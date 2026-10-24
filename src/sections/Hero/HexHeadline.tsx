import { useCallback, useEffect, useRef, useState } from 'react';
import { useActive, useReducedMotion } from '@/ui';
import { useIsoLayoutEffect } from '@/ui/hooks';
import { type HexEngine, createHexEngine } from './hex/engine';
import { type Layout, computeLayout, layoutKey } from './hex/layout';
import { readPalette } from './hex/palette';
import { sampleCells } from './hex/sample';
import styles from './HexHeadline.module.css';

interface Frame {
  layout: Layout;
  /** Width of the box the canvas is centred in, in CSS pixels. */
  boxWidth: number;
}

/** Wait for the display face (and give up after two seconds: a fallback face still draws legibly). */
async function fontsReady(family: string, weights: number[]): Promise<void> {
  const fonts = document.fonts;
  if (!fonts?.load) return;
  const loads = weights.map((w) => fonts.load(`${w} 64px ${family}`, 'Pull the plug It keeps running'));
  const timeout = new Promise<void>((r) => window.setTimeout(r, 2000));
  await Promise.race([Promise.all(loads).then(() => fonts.ready.then(() => undefined)), timeout]).catch(() => undefined);
}

/**
 * The hero headline, built from hexagons: "Pull the plug" in cool steel hexes and "It keeps
 * running" in a dense field of lit blue ones that now and then lose a few and heal (the whole
 * pitch of Flux, told by the type). The real text stays in the heading for screen readers and
 * search; the canvas is decoration. The box reserves its height from arithmetic alone, so nothing
 * moves when the font loads.
 *
 * Under reduced motion the finished headline is drawn still. Hovering near the letters knocks a
 * few hexes out and they heal; on a phone a tap does the same to a small cluster.
 */
export function HexHeadline({ go }: { go: boolean }) {
  const box = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<HexEngine | null>(null);
  const played = useRef(false);
  const reduced = useReducedMotion();
  const active = useActive(box);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [status, setStatus] = useState<'pending' | 'on' | 'off'>('pending');
  const [built, setBuilt] = useState(0);

  const latest = useRef({ go, active, reduced });
  latest.current = { go, active, reduced };

  const maybePlay = useCallback(() => {
    const e = engine.current;
    if (!e || played.current || !latest.current.go) return;
    played.current = true;
    e.play();
  }, []);

  // 1. Layout, before paint: the height is reserved from the first frame, and again (debounced)
  //    whenever the width, the viewport height or the pixel ratio changes.
  useIsoLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    let timer = 0;
    const measure = () => {
      const w = el.clientWidth;
      if (!w) return;
      const next = computeLayout({ width: w, vh: window.innerHeight, dpr: window.devicePixelRatio || 1 });
      setFrame((prev) => {
        // The same lattice in a slightly different box only re-centres: no rebuild.
        if (prev && layoutKey(prev.layout) === layoutKey(next)) {
          return prev.boxWidth === w ? prev : { layout: prev.layout, boxWidth: w };
        }
        return { layout: next, boxWidth: w };
      });
    };
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 120);
    };
    measure();
    const ro = new ResizeObserver(later);
    ro.observe(el);
    window.addEventListener('resize', later);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener('resize', later);
    };
  }, []);

  // 2. Sample the letterforms and build the engine once the font is in (and again on resize).
  const layout = frame?.layout;
  useEffect(() => {
    const host = box.current;
    const cv = canvas.current;
    if (!layout || !host || !cv) return;
    let alive = true;
    let eng: HexEngine | null = null;
    const family = getComputedStyle(host).getPropertyValue('--font-display').trim() || '"Montserrat Variable", sans-serif';
    void fontsReady(family, [...new Set(layout.lines.map((l) => l.weight))]).then(() => {
      if (!alive) return;
      try {
        const cells = sampleCells(layout, { fontFamily: family });
        eng = createHexEngine({ canvas: cv, layout, cells, palette: readPalette(host) });
      } catch {
        // No 2D canvas: the heading shows its real words as plain type.
        setStatus('off');
        return;
      }
      engine.current = eng;
      eng.setReduced(latest.current.reduced);
      eng.setActive(latest.current.active);
      setStatus('on');
      setBuilt((b) => b + 1);
      // A rebuild after a resize shows the finished headline: the entrance plays once.
      if (played.current) eng.settle();
      else maybePlay();
    });
    return () => {
      alive = false;
      eng?.dispose();
      if (engine.current === eng) engine.current = null;
    };
  }, [layout, maybePlay]);

  useEffect(() => {
    maybePlay();
  }, [go, built, maybePlay]);
  useEffect(() => {
    engine.current?.setReduced(reduced);
  }, [reduced, built]);
  useEffect(() => {
    engine.current?.setActive(active);
  }, [active, built]);

  // 3. Pointer: a hover knocks a few hexes out and they heal; a tap on a phone knocks out a cluster.
  useEffect(() => {
    const cv = canvas.current;
    if (!built || reduced || !active || !cv) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const poke = (e: PointerEvent, tap: boolean) => {
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < -24 || y < -24 || x > r.width + 24 || y > r.height + 24) return;
      engine.current?.poke(x, y, tap);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      last = e;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (last) poke(last, false);
          last = null;
        });
      }
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch') poke(e, true);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [built, reduced, active]);

  const left = frame ? Math.round(((frame.boxWidth - frame.layout.cssWidth) / 2) * frame.layout.dpr) / frame.layout.dpr : 0;

  return (
    <h1 className={styles.title} data-hex={status}>
      <span className={styles.line}>Pull the plug</span> <span className={styles.line}>It keeps running</span>
      <span
        ref={box}
        className={styles.box}
        aria-hidden="true"
        style={{ blockSize: frame ? `${frame.layout.cssHeight}px` : undefined }}
      >
        <canvas
          ref={canvas}
          className={styles.canvas}
          style={
            frame
              ? {
                  inlineSize: `${frame.layout.cssWidth}px`,
                  blockSize: `${frame.layout.cssHeight}px`,
                  insetInlineStart: `${left}px`,
                }
              : undefined
          }
        />
      </span>
    </h1>
  );
}
