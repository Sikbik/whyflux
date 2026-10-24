/**
 * The node map's canvas engine: a hex-dot world, nodes as crisp discs in their tier colours, and an
 * ignite that spreads from the visitor's own part of the world. No React in here. The component feeds
 * it nodes and a focus, and it draws only while something changes (the ignite, a hover): at rest it
 * costs nothing. Flat fills only: no blur, no glow sprites.
 */
import type { NodeTierId } from '@/data/types';
import { clamp, easeOutCubic } from '@/lib/math';
import { fitCanvas, readRgb, rgba, TAU } from './canvas';
import { buildLattice, fitWorld, guessOrigin, type Lattice, toScreen, type View } from './mapMath';

export interface MapNode {
  lon: number;
  lat: number;
  tier: NodeTierId;
  /** Nodes of this tier in this cell. */
  weight: number;
  country: string;
}

/** What the pointer found under it. `x` and `y` are CSS pixels inside the canvas. */
export interface MapHit {
  country: string;
  x: number;
  y: number;
}

export interface MapEngineOptions {
  canvas: HTMLCanvasElement;
  /** The pointer found a node (or lost it). A tap on touch is sticky until the next tap. */
  onHover: (hit: MapHit | null) => void;
}

export interface MapEngine {
  resize: (width: number, height: number) => void;
  setNodes: (nodes: readonly MapNode[]) => void;
  /** Pick out one country's nodes (the rest step back), or let go with `null`. */
  setFocus: (country: string | null) => void;
  setActive: (active: boolean) => void;
  setReduced: (reduced: boolean) => void;
  /** Light the nodes up outward from the visitor's part of the world, once. */
  ignite: () => void;
  /** Where a country's nodes gather on screen, for a keyboard-driven tooltip. */
  anchorOf: (country: string) => { x: number; y: number } | null;
  dispose: () => void;
}

/** Each tier sits a hair off its cell's centre, in its own direction, so overlapping tiers stay readable. */
const TIER_ANGLE: Record<NodeTierId, number> = {
  cumulus: (210 * Math.PI) / 180,
  nimbus: (330 * Math.PI) / 180,
  stratus: Math.PI / 2,
};
const TIER_VAR: Record<NodeTierId, string> = { cumulus: '--cumulus-rgb', nimbus: '--nimbus-rgb', stratus: '--stratus-rgb' };
const TIER_FALLBACK: Record<NodeTierId, [number, number, number]> = {
  cumulus: [54, 211, 255],
  nimbus: [199, 125, 255],
  stratus: [255, 200, 87],
};

/** Seconds the ignite takes to reach the far side of the map, and how long one node takes to light. */
const IGNITE_REACH = 1.25;
const IGNITE_FADE = 0.5;
const IGNITE_TOTAL = IGNITE_REACH + IGNITE_FADE + 0.35;

export function createMapEngine({ canvas, onHover }: MapEngineOptions): MapEngine {
  let ctx: CanvasRenderingContext2D | null = null;
  let w = 0;
  let h = 0;
  let nodes: readonly MapNode[] = [];
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let pr = new Float32Array(0);
  let pa = new Float32Array(0);
  let focus: string | null = null;
  let active = false;
  let reduced = false;
  let raf = 0;
  let view: View = { cx: 0, cy: 12, k: 1 };
  let lattice: Lattice | null = null;
  let latticeKey = '';
  let igniteAt = -1;
  let igniteFrom = { x: 0, y: 0 };
  let igniteSpan = 1;
  let hover = -1;
  let down: { x: number; y: number } | null = null;

  const accent = readRgb(canvas, '--accent-rgb', [79, 122, 212]);
  const hot = readRgb(canvas, '--accent-hot-rgb', [174, 198, 255]);
  const root = document.documentElement;
  const rgb = (id: NodeTierId) => readRgb(root, TIER_VAR[id], TIER_FALLBACK[id]);
  const fill: Record<NodeTierId, string> = {
    cumulus: rgba(rgb('cumulus'), 1),
    nimbus: rgba(rgb('nimbus'), 1),
    stratus: rgba(rgb('stratus'), 1),
  };

  function request() {
    if (raf || !active || !ctx) return;
    raf = requestAnimationFrame(frame);
  }

  function frame(now: number) {
    raf = 0;
    if (igniteAt >= 0 && (now - igniteAt) / 1000 > IGNITE_TOTAL) igniteAt = -1;
    draw(now);
    if (igniteAt >= 0) raf = requestAnimationFrame(frame);
  }

  function draw(now: number) {
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);

    // ---- the land: a hex lattice in screen space, so a dot is the same size at every width ----
    const pitch = w < 560 ? 6.5 : clamp(w / 175, 6.5, 8);
    const key = `${w}|${h}`;
    if (key !== latticeKey || !lattice) {
      lattice = buildLattice(view, w, h, pitch);
      latticeKey = key;
    }
    const L = lattice;
    const dotR = Math.max(1.05, pitch * 0.23);
    for (const pass of [0, 1] as const) {
      ctx.fillStyle = rgba(accent, pass ? 0.85 : 0.42);
      ctx.beginPath();
      for (let j = 0; j < L.rows; j++) {
        const y = j * L.rowH - L.rowH;
        for (let i = 0; i < L.cols; i++) {
          const idx = j * L.cols + i;
          if (!L.land[idx] || L.edge[idx] !== pass) continue;
          const x = i * L.pitch - L.pitch + (j % 2 ? L.pitch / 2 : 0);
          ctx.moveTo(x + dotR, y);
          ctx.arc(x, y, dotR, 0, TAU);
        }
      }
      ctx.fill();
    }

    // ---- the nodes: flat discs with a dark keyline, big clusters first so the small ones stay on top, a white pinpoint in the biggest ----
    const t = igniteAt >= 0 ? (now - igniteAt) / 1000 : -1;
    const scale = clamp(w / 1300, 0.62, 1.15);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    for (let n = 0; n < nodes.length; n++) {
      const node = nodes[n];
      if (!node) continue;
      const [x, y] = toScreen(view, w, h, node.lon, node.lat);
      const r = (1.2 + 0.58 * Math.log2(node.weight + 1)) * scale;
      const ox = Math.cos(TIER_ANGLE[node.tier]) * r * 0.55;
      const oy = Math.sin(TIER_ANGLE[node.tier]) * r * 0.55;
      px[n] = x + ox;
      py[n] = y + oy;
      pr[n] = r;
      let a = 1;
      if (t >= 0) {
        const d = Math.hypot(x - igniteFrom.x, y - igniteFrom.y) / igniteSpan;
        a *= easeOutCubic(clamp((t - d * IGNITE_REACH) / IGNITE_FADE, 0, 1));
      }
      if (focus && node.country !== focus) a *= 0.14;
      pa[n] = a;
      if (a <= 0.004) continue;
      ctx.globalAlpha = a * 0.94;
      ctx.fillStyle = fill[node.tier];
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, r, 0, TAU);
      ctx.fill();
      if (r >= 2) {
        ctx.globalAlpha = a * 0.6;
        ctx.stroke();
      }
      if (r > 3.4) {
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r * 0.3, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // ---- the ignite ring: one crisp line, opening out and gone ----
    if (t >= 0 && t < IGNITE_TOTAL) {
      const ring = (t / IGNITE_REACH) * igniteSpan;
      const fade = clamp(1 - t / IGNITE_TOTAL, 0, 1);
      ctx.strokeStyle = rgba(hot, 0.5 * fade);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(igniteFrom.x, igniteFrom.y, ring, 0, TAU);
      ctx.stroke();
    }

    // ---- the reticle: four corner brackets round whatever is picked out ----
    const mark = hover >= 0 ? { x: px[hover] ?? 0, y: py[hover] ?? 0, r: pr[hover] ?? 6 } : reticleAt();
    if (mark) {
      const s = Math.max(12, mark.r + 9);
      const k = Math.max(5, s * 0.45);
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        const cx = mark.x + sx * s;
        const cy = mark.y + sy * s;
        ctx.moveTo(cx - sx * k, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy - sy * k);
      }
      ctx.stroke();
    }
  }

  /** The heaviest cluster of the focused country, for a reticle when the pointer is elsewhere (the keyboard). */
  function reticleAt(): { x: number; y: number; r: number } | null {
    if (!focus) return null;
    let best = -1;
    let weight = 0;
    for (let n = 0; n < nodes.length; n++) {
      const node = nodes[n];
      if (node && node.country === focus && node.weight > weight && (pa[n] ?? 0) > 0.05) {
        best = n;
        weight = node.weight;
      }
    }
    return best >= 0 ? { x: px[best] ?? 0, y: py[best] ?? 0, r: pr[best] ?? 6 } : null;
  }

  function hit(x: number, y: number): number {
    let best = -1;
    let bestD = Infinity;
    for (let n = 0; n < nodes.length; n++) {
      if ((pa[n] ?? 0) < 0.05) continue;
      const dx = x - (px[n] ?? 0);
      const dy = y - (py[n] ?? 0);
      const reach = Math.max(15, (pr[n] ?? 0) + 8);
      const d = (dx * dx + dy * dy) / (reach * reach);
      if (d < 1 && d < bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  }

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function report(index: number) {
    hover = index;
    const node = index >= 0 ? nodes[index] : undefined;
    onHover(node ? { country: node.country, x: px[index] ?? 0, y: py[index] ?? 0 } : null);
    request();
  }

  // A mouse hovers; a finger taps (and a tap that moved is a scroll, never a tap).
  function onMove(e: PointerEvent) {
    if (e.pointerType === 'touch') return;
    const p = local(e);
    const index = hit(p.x, p.y);
    if (index !== hover) report(index);
  }

  function onDown(e: PointerEvent) {
    down = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY };
  }

  function onUp(e: PointerEvent) {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8;
    down = null;
    if (!moved) {
      const p = local(e);
      report(hit(p.x, p.y));
    }
  }

  function onCancel() {
    down = null;
  }

  function onLeave(e: PointerEvent) {
    if (e.pointerType === 'touch') return;
    if (hover >= 0) report(-1);
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('pointerleave', onLeave);

  return {
    resize(width, height) {
      w = Math.max(1, width);
      h = Math.max(1, height);
      ctx = fitCanvas(canvas, w, h);
      view = fitWorld(w, h);
      latticeKey = '';
      request();
    },
    setNodes(list) {
      // Biggest clusters first: they are drawn underneath, and the single nodes stay readable on top.
      nodes = [...list].sort((a, b) => b.weight - a.weight);
      if (px.length < list.length) {
        px = new Float32Array(list.length);
        py = new Float32Array(list.length);
        pr = new Float32Array(list.length);
        pa = new Float32Array(list.length).fill(1);
      }
      hover = -1;
      request();
    },
    setFocus(next) {
      focus = next;
      request();
    },
    setActive(on) {
      active = on;
      if (on) request();
    },
    setReduced(on) {
      reduced = on;
      if (on) {
        igniteAt = -1;
        request();
      }
    },
    ignite() {
      if (reduced || nodes.length === 0 || w === 0) return;
      const o = guessOrigin();
      const [x, y] = toScreen(view, w, h, o.lon, o.lat);
      igniteFrom = { x, y };
      igniteSpan = Math.max(1, Math.hypot(Math.max(x, w - x), Math.max(y, h - y)));
      igniteAt = performance.now();
      request();
    },
    anchorOf(country) {
      let sx = 0;
      let sy = 0;
      let sw = 0;
      for (const n of nodes) {
        if (n.country !== country) continue;
        sx += n.lon * n.weight;
        sy += n.lat * n.weight;
        sw += n.weight;
      }
      if (sw === 0) return null;
      const [x, y] = toScreen(view, w, h, sx / sw, sy / sw);
      return { x, y };
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('pointerleave', onLeave);
    },
  };
}
