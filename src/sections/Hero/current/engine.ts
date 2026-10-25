/**
 * The headline's engine: owns the canvas, steps the scene at a fixed 60 Hz and paints only when
 * something changed. It runs frames only while there is something to show: offscreen, in a hidden
 * tab or faded out it stops, and in the lulls between arcs (most of the time) it dozes on a timer
 * until the next scripted event, so an idle headline costs the page nothing.
 */
import { Director } from './director';
import type { BuiltHeadline } from './glyphs';
import { type Palette, Painter } from './paint';
import { Scene } from './scene';

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  headline: BuiltHeadline;
  palette: Palette;
  /** Canvas size in CSS pixels, and the device pixel ratio to draw it at. */
  width: number;
  height: number;
  dpr: number;
  /** Where long bolts may start from the top of the canvas (the page's header runs over it). */
  sky?: number;
  seed?: number;
}

export interface CurrentEngine {
  /** Starts the entrance (once). Under reduced motion it paints the finished headline instead. */
  play(): void;
  /** Paints the finished headline now, with no entrance (a rebuild after a resize). */
  settle(): void;
  setActive(on: boolean): void;
  setReduced(on: boolean): void;
  /** The pointer, in canvas pixels, or null when it has left. */
  pointer(x: number | null, y?: number): void;
  /** A tap or click at a point of the canvas: a surge. */
  tap(x: number, y: number): void;
  /** The scene at `seconds` into the entrance, drawn now (for tuning and screenshots). */
  seek(seconds: number): void;
  /** Steps a seeked scene forward by whole frames and draws it (for frame-by-frame sheets). */
  advance(frames: number): void;
  dispose(): void;
  /** For tuning: the live scene and director, and how many frames ran, painted and dozed. */
  readonly debug: { scene: () => Scene; director: () => Director; stats: () => { frames: number; paints: number; dozes: number } };
}

const STEP = 1 / 60;
/** A lull shorter than this (seconds) is not worth a timer: the loop just keeps running. */
const LULL = 0.12;
/** The longest a doze lasts, in milliseconds, so a missed wake can never leave the headline asleep for long. */
const LONGEST_DOZE = 2500;

export function createCurrentEngine(o: EngineOptions): CurrentEngine {
  const { canvas, headline, palette, width, height, dpr } = o;
  const sky = o.sky ?? 0;
  const seed = o.seed ?? 20241024;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d canvas');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  const painter = new Painter(palette);
  let scene = new Scene(headline, seed, width, height, sky);
  let director = new Director(scene);

  let raf = 0;
  let last = 0;
  let acc = 0;
  let active = false;
  let reduced = false;
  let running = false;
  let disposed = false;
  let lastTap = -1;
  // A doze: the timer that ends it, when it began (wall clock) and the scene time it is waiting for.
  let timer = 0;
  let dozing = false;
  let dozeFrom = 0;
  let dozeTo = 0;
  const stats = { frames: 0, paints: 0, dozes: 0 };

  const paint = () => {
    painter.paint(ctx, scene, width, height);
    scene.dirty = false;
    stats.paints++;
  };

  const frame = (now: number) => {
    raf = 0;
    if (!active || !running || disposed) return;
    stats.frames++;
    acc += last ? Math.min(0.1, (now - last) / 1000) : STEP;
    last = now;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      scene.step(STEP);
      director.update();
      acc -= STEP;
      steps++;
    }
    if (steps === 5) acc = 0;
    if (scene.dirty) paint();
    // Nothing moving and nothing due for a while: stop until it is.
    if (!scene.moving) {
      const next = Math.min(scene.nextTimed, director.nextAt());
      if (next - scene.time > LULL) {
        doze(next);
        return;
      }
    }
    raf = requestAnimationFrame(frame);
  };

  const doze = (next: number) => {
    stats.dozes++;
    dozing = true;
    dozeFrom = performance.now();
    dozeTo = next;
    if (next < Infinity) timer = window.setTimeout(wake, Math.min(LONGEST_DOZE, (next - scene.time) * 1000));
  };

  const wake = () => {
    if (dozing) {
      window.clearTimeout(timer);
      timer = 0;
      dozing = false;
      // The clock runs on through the lull, but stops a step short of what the loop was waiting for.
      scene.catchUp(Math.min(scene.time + (performance.now() - dozeFrom) / 1000, dozeTo - STEP));
    }
    if (raf || !active || !running || disposed || reduced) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };

  const sleep = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    window.clearTimeout(timer);
    timer = 0;
    dozing = false;
  };

  const fresh = () => {
    scene = new Scene(headline, seed, width, height, sky);
    director = new Director(scene);
  };

  return {
    play() {
      if (running) return;
      if (reduced) {
        fresh();
        director.still();
        scene.step(STEP);
        paint();
        return;
      }
      running = true;
      director.start();
      scene.dirty = true;
      wake();
    },
    settle() {
      sleep();
      fresh();
      if (reduced) director.still();
      else director.settle();
      scene.step(STEP);
      paint();
      running = !reduced;
      wake();
    },
    setActive(on) {
      active = on;
      if (on) wake();
      else sleep();
    },
    setReduced(on) {
      if (reduced === on) return;
      reduced = on;
      if (on) {
        sleep();
        running = false;
        fresh();
        director.still();
        scene.step(STEP);
        paint();
      } else {
        fresh();
        director.settle();
        running = true;
        scene.dirty = true;
        wake();
      }
    },
    pointer(x, y = 0) {
      scene.pointer(x, y);
      // A pointer that comes near the letters wakes a dozing loop to react.
      if (dozing && x !== null && scene.reaches(x, y)) wake();
    },
    tap(x, y) {
      if (reduced || !running || !director.done) return;
      // Only a press on (or just around) the letters is a surge.
      const m = scene.unit * 0.3;
      if (x < scene.x0 - m || x > scene.x1 + m || y < scene.y0 - m || y > scene.y1 + m) return;
      // One surge at a time: a flurry of taps is one surge.
      if (lastTap >= 0 && scene.time - lastTap < 0.8) return;
      lastTap = scene.time;
      // The strike point stays on the canvas, however near its edge the press was.
      director.surge(Math.min(width - 8, Math.max(8, x)), Math.min(height - 8, Math.max(scene.sky + 8, y)));
      wake();
    },
    seek(seconds) {
      fresh();
      director.start();
      while (scene.time < seconds) {
        scene.step(STEP);
        director.update();
      }
      paint();
    },
    advance(frames) {
      for (let i = 0; i < frames; i++) {
        scene.step(STEP);
        director.update();
      }
      paint();
    },
    dispose() {
      disposed = true;
      sleep();
    },
    debug: { scene: () => scene, director: () => director, stats: () => ({ ...stats }) },
  };
}
