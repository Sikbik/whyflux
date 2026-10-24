/**
 * The hexagon headline's renderer and its little story: a dense field of lit hexes forms the
 * letters, now and then a few go dark (a node dies), and the neighbours light up and the gap
 * re-fills (the network heals). The word never stops being readable.
 *
 * Everything is flat colour on a 2D canvas: no blur, bloom or gradient. Each hex is one blit of a
 * prebuilt sprite, so a frame only touches the hexes that changed (a scissored redraw of the cell
 * and its six neighbours). When nothing is moving the loop sleeps on a timer.
 */
import { mulberry32 } from '@/lib/rng';
import type { Layout } from './layout';
import { type HexPalette, type RGB, mix, parseHex } from './palette';
import type { Cells } from './sample';

// ---- sprites ---------------------------------------------------------------------------------

const SHADES = 4;
/** 0 and 1 dim on the way out, 2 is rest, 3 to 5 get hotter toward white. */
const HOTS = 6;
const REST = 2;
const SCALES = 3;
const SCALE_K = [0.5, 0.78, 1] as const;
const HOT_MIX = [0, 0, 0, 0.4, 0.75, 1] as const;
const PER_ROW = 16;

const fillId = (role: number, shade: number, hot: number, scale: number) =>
  1 + (((role * SHADES + shade) * HOTS + hot) * SCALES + scale);
const FILLS = 2 * SHADES * HOTS * SCALES;
const GHOST = FILLS + 1;
const ALARM = FILLS + 2;
const SLOTS = FILLS + 3;

interface Atlas {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
}

/** Every hex the headline can show, drawn once into one sheet: colour step x heat x size. */
function buildAtlas(layout: Layout, pal: HexPalette): Atlas {
  const { P, Q, g } = layout;
  const w = P + 2;
  let h = Math.ceil((4 * Q) / 3) + 3;
  if (h & 1) h++;
  const canvas = document.createElement('canvas');
  canvas.width = PER_ROW * w;
  canvas.height = Math.ceil(SLOTS / PER_ROW) * h;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('2d canvas unavailable');

  // The visible hex is the lattice cell shrunk by the gap. When its width is an odd number of
  // pixels it is nudged half a pixel so the vertical edges land on whole pixels (crisp).
  const k = (P - g) / P;
  const nudge = (P - g) % 2 ? 0.5 : 0;
  const put = (id: number, color: string, scale: number) => {
    const x = (id % PER_ROW) * w + w / 2 + nudge;
    const y = Math.floor(id / PER_ROW) * h + h / 2;
    const hw = (P / 2) * k * scale;
    const tip = ((2 * Q) / 3) * k * scale;
    const shoulder = (Q / 3) * k * scale;
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x, y - tip);
    c.lineTo(x + hw, y - shoulder);
    c.lineTo(x + hw, y + shoulder);
    c.lineTo(x, y + tip);
    c.lineTo(x - hw, y + shoulder);
    c.lineTo(x - hw, y - shoulder);
    c.closePath();
    c.fill();
  };

  const white = parseHex(pal.white);
  const ghost = parseHex(pal.ghost);
  for (let role = 0; role < 2; role++) {
    for (let shade = 0; shade < SHADES; shade++) {
      const base: RGB = parseHex(pal.steps[role as 0 | 1][shade]!);
      for (let hot = 0; hot < HOTS; hot++) {
        const color =
          hot === REST
            ? mix(base, base, 0)
            : hot > REST
              ? mix(base, white, HOT_MIX[hot]!)
              : mix(base, ghost, hot === 1 ? 0.45 : 0.8);
        for (let s = 0; s < SCALES; s++) put(fillId(role, shade, hot, s), color, SCALE_K[s]!);
      }
    }
  }
  put(GHOST, pal.ghost, 1);
  put(ALARM, pal.alarm, 1);
  return { canvas, w, h };
}

// ---- tracks ----------------------------------------------------------------------------------

/** A track is a short run of frames: [milliseconds, hot step, scale step]. Hot 6 is the alarm blink. */
type Key = readonly [number, number, number];
interface Track {
  keys: readonly Key[];
  total: number;
}
const track = (keys: readonly Key[]): Track => ({ keys, total: keys.reduce((a, k) => a + k[0], 0) });

const T_POP = 1;
const T_HEAL = 2;
const T_DIE = 3;
const T_FLARE = 4;
const T_ECHO = 5;
const T_TWINKLE = 6;
const T_DIM = 7;

const TRACKS: readonly (Track | undefined)[] = [
  undefined,
  // a node coming online: a small white hex that grows and cools into its colour
  track([
    [34, 5, 0],
    [34, 5, 1],
    [70, 5, 2],
    [80, 4, 2],
    [110, 3, 2],
  ]),
  // a gap re-filling: white first, then it cools
  track([
    [110, 5, 2],
    [90, 4, 2],
    [120, 3, 2],
  ]),
  // a node dropping out: the alarm blinks, then it goes dark
  track([
    [80, 6, 2],
    [40, 0, 2],
  ]),
  // a neighbour noticing: it flares
  track([
    [60, 3, 2],
    [90, 4, 2],
    [80, 3, 2],
  ]),
  // the second, softer flare as the gap re-fills
  track([
    [70, 3, 2],
    [90, 4, 2],
    [100, 3, 2],
  ]),
  // a node idling: a tick brighter
  track([[240, 3, 2]]),
  // a quiet power cut (the plug being pulled): dims to dark with no alarm
  track([
    [40, 1, 2],
    [50, 0, 2],
  ]),
];

const POP_MS = TRACKS[T_POP]!.total;
/** How long the word "plug" takes to lose its power twice and come back. */
const FLICKER_MS = 1000;

// ---- engine ----------------------------------------------------------------------------------

export interface HexEngine {
  /** Run the entrance (once), then the healing loop. */
  play(): void;
  /** Draw the finished headline now, with no entrance. */
  settle(): void;
  /** In view and tab visible. Off stops all timers and frames. */
  setActive(on: boolean): void;
  /** Reduced motion: the finished headline, still. */
  setReduced(on: boolean): void;
  /** The pointer at canvas CSS pixels: a hover knocks a few hexes out, a tap a small cluster. */
  poke(x: number, y: number, tap: boolean): void;
  dispose(): void;
}

export interface EngineInit {
  canvas: HTMLCanvasElement;
  layout: Layout;
  cells: Cells;
  palette: HexPalette;
}

type Phase = 'blank' | 'entering' | 'live' | 'static';

export function createHexEngine({ canvas, layout, cells, palette }: EngineInit): HexEngine {
  const { P, Q, cols, rows, pad, dpr } = layout;
  const { n, cx, cy, role, shade, nb, deg, grid, comp, compCount, compX, hop, plug, thick } = cells;

  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d canvas unavailable');
  ctx.imageSmoothingEnabled = false;
  const atlas = buildAtlas(layout, palette);
  const { w: sw, h: sh } = atlas;
  const halfW = sw >> 1;
  const halfH = sh >> 1;

  // Per-cell state.
  const life = new Uint8Array(n); // 0 not yet online, 1 alive, 2 down
  const cur = new Uint16Array(n); // the sprite on the canvas
  const tk = new Uint8Array(n); // running track (0 none)
  const t0 = new Float64Array(n); // when it starts
  const started = new Uint8Array(n);
  const cool = new Float64Array(n); // no new pointer hit before this time
  const isActive = new Uint8Array(n);
  const active: number[] = [];
  const changed = new Int32Array(n);
  let deadCount = 0;

  // The animation clock. If the page stalls (the globe booting, say) a frame arrives late; the
  // clock skips at most 50 ms of that, so the entrance never jumps a beat, it just resumes.
  let debt = 0;
  let requestedAt = 0;
  const now = () => performance.now() - debt;

  let phase: Phase = 'blank';
  let visible = true;
  let reduced = false;
  let disposed = false;
  let wantPlay = false;
  let raf = 0;
  let wake = 0;
  let lastCluster = 0;
  const timers: { at: number; run: () => void }[] = [];
  const events: { x: number; y: number; until: number }[] = [];

  // Cells of the loud line, for picking what fails.
  const loud: number[] = [];
  for (let i = 0; i < n; i++) if (role[i] === 1) loud.push(i);
  const maxDead = Math.max(6, Math.round(loud.length * 0.026));

  const rest = (i: number): number => {
    const l = life[i]!;
    return l === 0 ? 0 : l === 2 ? GHOST : fillId(role[i]!, shade[i]!, REST, SCALES - 1);
  };

  // ---- drawing -------------------------------------------------------------------------------

  const paint = (i: number) => {
    const id = cur[i]!;
    if (!id) return;
    ctx.drawImage(
      atlas.canvas,
      (id % PER_ROW) * sw,
      Math.floor(id / PER_ROW) * sh,
      sw,
      sh,
      cx[i]! - halfW,
      cy[i]! - halfH,
      sw,
      sh,
    );
  };

  /** Redraw one cell and its six neighbours inside the cell's own rectangle. */
  const repaint = (i: number) => {
    const x = cx[i]! - halfW;
    const y = cy[i]! - halfH;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, sw, sh);
    ctx.clip();
    ctx.clearRect(x, y, sw, sh);
    paint(i);
    for (let k = 0; k < 6; k++) {
      const j = nb[i * 6 + k]!;
      if (j >= 0) paint(j);
    }
    ctx.restore();
  };

  const paintAll = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < n; i++) paint(i);
  };

  // ---- tracks and timers ---------------------------------------------------------------------

  const start = (i: number, kind: number, at: number) => {
    tk[i] = kind;
    t0[i] = at;
    started[i] = 0;
    if (!isActive[i]) {
      isActive[i] = 1;
      active.push(i);
    }
  };

  const onStart = (i: number, kind: number) => {
    if (kind === T_POP || kind === T_HEAL) {
      if (life[i] === 2) deadCount--;
      life[i] = 1;
    }
  };

  const onFinish = (i: number, kind: number) => {
    if (kind === T_DIE) life[i] = 2;
    else if (kind === T_DIM) {
      life[i] = 2;
      deadCount++;
    }
  };

  const sprite = (i: number, at: number): number => {
    const kind = tk[i]!;
    if (!kind) return rest(i);
    const t = at - t0[i]!;
    if (t < 0) return rest(i);
    // A flare or tick means nothing on a node that is down.
    if ((kind === T_FLARE || kind === T_ECHO || kind === T_TWINKLE) && life[i] !== 1) {
      tk[i] = 0;
      return rest(i);
    }
    if (!started[i]) {
      started[i] = 1;
      onStart(i, kind);
    }
    const tr = TRACKS[kind]!;
    if (t >= tr.total) {
      onFinish(i, kind);
      tk[i] = 0;
      return rest(i);
    }
    let acc = 0;
    for (const key of tr.keys) {
      acc += key[0];
      if (t < acc) return key[1] === 6 ? ALARM : fillId(role[i]!, shade[i]!, key[1], key[2]);
    }
    return rest(i);
  };

  const addTimer = (at: number, run: () => void) => {
    timers.push({ at, run });
    timers.sort((a, b) => a.at - b.at);
    kick();
  };

  const ask = () => {
    requestedAt = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    if (wake) window.clearTimeout(wake);
    raf = 0;
    wake = 0;
  };

  function kick() {
    if (disposed || !visible || raf) return;
    if (phase === 'blank' || phase === 'static') return;
    if (active.length) {
      if (wake) window.clearTimeout(wake);
      wake = 0;
      ask();
      return;
    }
    const next = timers[0];
    if (!next) return;
    if (wake) window.clearTimeout(wake);
    const wait = next.at - now();
    if (wait <= 20) {
      wake = 0;
      ask();
    } else {
      wake = window.setTimeout(() => {
        wake = 0;
        if (!raf && !disposed && visible) ask();
      }, wait - 12);
    }
  }

  function frame() {
    raf = 0;
    if (disposed || !visible) return;
    const late = performance.now() - requestedAt;
    if (late > 66) debt += late - 50;
    const at = now();
    while (timers.length && timers[0]!.at <= at) timers.shift()!.run();

    let count = 0;
    let keep = 0;
    for (let a = 0; a < active.length; a++) {
      const i = active[a]!;
      const id = sprite(i, at);
      if (id !== cur[i]) {
        cur[i] = id;
        changed[count++] = i;
      }
      if (tk[i]) active[keep++] = i;
      else isActive[i] = 0;
    }
    active.length = keep;

    if (count > 90) paintAll();
    else for (let c = 0; c < count; c++) repaint(changed[c]!);

    kick();
  }

  // ---- the entrance --------------------------------------------------------------------------

  const compJitter = new Float32Array(compCount);
  {
    const r = mulberry32(0xe17a);
    for (let c = 0; c < compCount; c++) compJitter[c] = r();
  }

  /** The cells of the word "plug", left to right, for the flicker that ends line one's entrance. */
  const plugCells: number[] = [];
  for (let i = 0; i < n; i++) if (plug[i]) plugCells.push(i);
  plugCells.sort((a, b) => cx[a]! - cx[b]!);

  /** "Pull the plug": the word loses its power, comes back, loses it again for some, and holds. */
  const plugOut = () => {
    if (phase !== 'entering' || !plugCells.length) return;
    const t = now();
    const m = plugCells.length;
    plugCells.forEach((i, k) => start(i, T_DIM, t + (k / m) * 90));
    addTimer(t + 280, () => {
      if (phase !== 'entering') return;
      const t1 = now();
      plugCells.forEach((i, k) => start(i, T_HEAL, t1 + (k / m) * 130));
    });
    addTimer(t + 600, () => {
      if (phase !== 'entering') return;
      const t2 = now();
      const some = plugCells.filter(() => Math.random() < 0.42);
      some.forEach((i, k) => start(i, T_DIM, t2 + (k / some.length) * 50));
      addTimer(t2 + 170, () => {
        if (phase !== 'entering') return;
        const t3 = now();
        some.forEach((i, k) => start(i, T_HEAL, t3 + (k / some.length) * 80));
      });
    });
  };

  const enter = () => {
    const t = now();
    paintAll();
    const r = mulberry32(0x4a11);
    let end = 0;
    let quietEnd = 0;
    for (let i = 0; i < n; i++) {
      const c = comp[i]!;
      const loudLine = role[i] === 1;
      // Each letter ignites at its centre and spreads along its strokes; the letters come online
      // left to right, the quiet line first and the loud line right behind it.
      const at =
        (loudLine ? 230 : 0) +
        compX[c]! * (loudLine ? 520 : 300) +
        compJitter[c]! * 70 +
        hop[i]! * 15 +
        r() * 50;
      start(i, T_POP, t + at);
      end = Math.max(end, at + POP_MS);
      if (!loudLine) quietEnd = Math.max(quietEnd, at + POP_MS);
    }
    // Once line one is up, "plug" flickers while the loud line is still lighting.
    const flickerAt = quietEnd + 100;
    addTimer(t + flickerAt, plugOut);
    end = Math.max(end, flickerAt + FLICKER_MS);
    phase = 'entering';
    addTimer(t + end, () => {
      if (phase === 'entering') goLive(true);
    });
  };

  // ---- the healing loop ----------------------------------------------------------------------

  const eligible = (i: number) => life[i] === 1 && (tk[i] === 0 || tk[i] === T_TWINKLE || tk[i] === T_FLARE);

  /** Cells that go down together, grown from the seed. */
  const cluster = (seed: number, size: number): number[] => {
    const set = [seed];
    const inSet = new Set(set);
    for (let guard = 0; set.length < size && guard < size * 6; guard++) {
      const from = set[Math.floor(Math.random() * set.length)]!;
      const j = nb[from * 6 + Math.floor(Math.random() * 6)]!;
      if (j >= 0 && !inSet.has(j) && role[j] === 1 && eligible(j) && deg[j]! >= 4) {
        set.push(j);
        inSet.add(j);
      }
    }
    return set;
  };

  /** Everything within `radius` hops of the seed: a data centre going dark. */
  const disc = (seed: number, radius: number): number[] => {
    const seen = new Set([seed]);
    let frontier = [seed];
    const set = [seed];
    for (let h = 0; h < radius; h++) {
      const next: number[] = [];
      for (const i of frontier) {
        for (let k = 0; k < 6; k++) {
          const j = nb[i * 6 + k]!;
          if (j >= 0 && !seen.has(j) && role[j] === 1 && eligible(j)) {
            seen.add(j);
            next.push(j);
            set.push(j);
          }
        }
      }
      frontier = next;
    }
    return set;
  };

  /**
   * Takes a set of nodes down and heals it. The neighbours flare as the node drops (the network
   * noticing), then, after `healAfter` ms, the gap re-fills from the outside in with the
   * neighbours flaring just ahead of it.
   */
  const knockOut = (set: number[], healAfter: number) => {
    const t = now();
    const seed = set[0]!;
    const inSet = new Set(set);
    const dist = set.map((i) => Math.hypot(cx[i]! - cx[seed]!, cy[i]! - cy[seed]!) / P);
    const reach = Math.max(...dist);
    deadCount += set.length;
    const ring = new Set<number>();
    set.forEach((i, k) => {
      start(i, T_DIE, t + dist[k]! * 38);
      for (let q = 0; q < 6; q++) {
        const j = nb[i * 6 + q]!;
        if (j >= 0 && !inSet.has(j)) ring.add(j);
      }
    });
    for (const j of ring) if (eligible(j)) start(j, T_FLARE, t + 30 + Math.random() * 60);
    for (const i of set) cool[i] = t + healAfter + reach * 62 + 700;

    addTimer(t + healAfter, () => {
      if (phase !== 'live') return;
      const t1 = now();
      set.forEach((i, k) => start(i, T_HEAL, t1 + (reach - dist[k]!) * 62));
      for (const j of ring) if (eligible(j)) start(j, T_ECHO, t1 + Math.random() * 90);
    });
  };

  /** No second failure near a recent one: the gaps stay apart and the word stays readable. */
  const free = (i: number, at: number) => {
    for (const e of events) {
      if (e.until > at && Math.hypot(cx[i]! - e.x, cy[i]! - e.y) < P * 6) return false;
    }
    return true;
  };

  /** How well a cell can take a hit without breaking a stroke: 3 in solid ink, 2 inside, 1 near an edge. */
  const grade = (i: number) => (thick[i] ? 3 : deg[i] === 6 ? 2 : deg[i]! >= 5 ? 1 : 0);

  const failure = (force?: 'node' | 'cluster' | 'dc') => {
    if (phase !== 'live' || !loud.length) return;
    const at = now();
    for (let e = events.length - 1; e >= 0; e--) if (events[e]!.until < at) events.splice(e, 1);
    if (deadCount >= maxDead) return;
    // Pick what fails first, then a spot that can take it: bigger failures only in solid ink, so a
    // stroke is never cut right through.
    const roll = force ? { node: 0, cluster: 0.6, dc: 0.95 }[force] : Math.random();
    let kind: 'node' | 'cluster' | 'dc' = roll < 0.5 ? 'node' : roll < 0.86 ? 'cluster' : 'dc';
    if (kind === 'dc' && !force && !(at - lastCluster > 4500 && deadCount < maxDead - 12)) kind = 'node';
    const need = kind === 'dc' ? 3 : kind === 'cluster' ? 2 : 1;
    for (let tries = 0; tries < 24; tries++) {
      const i = loud[Math.floor(Math.random() * loud.length)]!;
      if (!eligible(i) || grade(i) < need || !free(i, at)) continue;
      let set: number[];
      if (kind === 'node') set = [i];
      else if (kind === 'cluster') set = cluster(i, 3 + Math.floor(Math.random() * 3));
      else {
        set = disc(i, 2);
        lastCluster = at;
      }
      const healAfter = 460 + Math.random() * 380 + set.length * 14;
      events.push({ x: cx[i]!, y: cy[i]!, until: at + healAfter + 900 });
      knockOut(set, healAfter);
      return;
    }
  };

  const twinkle = () => {
    if (phase !== 'live' || !loud.length) return;
    const i = loud[Math.floor(Math.random() * loud.length)]!;
    if (life[i] === 1 && tk[i] === 0) start(i, T_TWINKLE, now());
  };

  let loopOn = false;
  /** Starts the failures and the idle ticks. After the entrance the first failure is a visible one. */
  function goLive(first: boolean) {
    phase = 'live';
    if (reduced || loopOn) return;
    loopOn = true;
    const again = (fn: () => void, lo: number, hi: number, delay = 0) => {
      const tick = () => {
        if (phase !== 'live') {
          loopOn = false;
          return;
        }
        fn();
        addTimer(now() + lo + Math.random() * (hi - lo), tick);
      };
      addTimer(now() + delay + lo + Math.random() * (hi - lo), tick);
    };
    if (first) addTimer(now() + 700, () => failure('cluster'));
    again(() => failure(), 900, 1800, first ? 900 : 0);
    again(twinkle, 220, 460);
  }

  // ---- control -------------------------------------------------------------------------------

  /** Jump every running track to its end and draw the finished headline. */
  const finish = () => {
    timers.length = 0;
    active.length = 0;
    isActive.fill(0);
    tk.fill(0);
    started.fill(0);
    life.fill(1);
    deadCount = 0;
    events.length = 0;
    for (let i = 0; i < n; i++) cur[i] = rest(i);
    paintAll();
    loopOn = false;
  };

  const api: HexEngine = {
    play() {
      if (phase !== 'blank' || disposed) return;
      if (reduced) {
        api.settle();
        return;
      }
      // Out of view (or a hidden tab): wait, so the entrance is seen when it can be.
      wantPlay = true;
      if (visible) enter();
    },
    settle() {
      if (disposed) return;
      stop();
      finish();
      phase = reduced ? 'static' : 'live';
      if (!reduced && visible) goLive(false);
    },
    setActive(on) {
      if (disposed || visible === on) return;
      visible = on;
      if (!on) {
        stop();
        if (phase === 'entering' || phase === 'live') {
          finish();
          phase = 'live';
        }
      } else if (phase === 'blank' && wantPlay && !reduced) {
        enter();
      } else if (phase === 'live' && !reduced) {
        goLive(false);
        kick();
      }
    },
    setReduced(on) {
      if (disposed || reduced === on) return;
      reduced = on;
      if (on) {
        if (phase !== 'blank') {
          stop();
          finish();
          phase = 'static';
        }
      } else if (phase === 'static') {
        phase = 'live';
        if (visible) goLive(false);
      }
    },
    poke(xCss, yCss, tap) {
      if (phase !== 'live' || !visible || reduced) return;
      const at = now();
      const x = xCss * dpr;
      const y = yCss * dpr;
      const radius = (tap ? 2.5 : 1.75) * P;
      const r0 = Math.round((y - pad) / Q);
      const hit: number[] = [];
      for (let r = r0 - 3; r <= r0 + 3; r++) {
        if (r < 0 || r >= rows) continue;
        const shift = r & 1 ? P / 2 : 0;
        const c0 = Math.round((x - P / 2 - shift) / P);
        for (let c = c0 - 3; c <= c0 + 3; c++) {
          if (c < 0 || c >= cols) continue;
          const i = grid[r * cols + c]!;
          if (i < 0 || !eligible(i) || at < cool[i]!) continue;
          if (Math.hypot(cx[i]! - x, cy[i]! - y) > radius) continue;
          if (tap || Math.random() < 0.36) hit.push(i);
        }
      }
      if (!hit.length || deadCount + hit.length > maxDead + 30) return;
      hit.sort((a, b) => Math.hypot(cx[a]! - x, cy[a]! - y) - Math.hypot(cx[b]! - x, cy[b]! - y));
      knockOut(hit, 420 + Math.random() * 360 + (tap ? 200 : 0));
    },
    dispose() {
      disposed = true;
      stop();
      timers.length = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
  return api;
}
