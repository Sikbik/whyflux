import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { subscribeScroll } from '@/lib/scroll';
import { useActive, useReducedMotion } from '@/ui';
import { useIsoLayoutEffect } from '@/ui/hooks';
import { type CurrentEngine, createCurrentEngine } from './current/engine';
import { ESTIMATE, FAMILY, faceLoaded, faceReady, measured } from './current/face';
import { buildHeadline } from './current/glyphs';
import { type Metrics, STYLE, plan } from './current/layout';
import { readPalette } from './current/paint';
import './Headline.font.css';
import styles from './Headline.module.css';

/** Where the headline sits in the page, in CSS pixels. */
interface Geometry {
  /** Width the lines may use. */
  width: number;
  /** Viewport height, rounded (a wide headline takes a share of it). */
  vh: number;
  /** Width of the canvas: the whole hero, so bolts can come from beyond the letters. */
  canvasWidth: number;
  /** How far the canvas reaches left of the headline's box, and above it (up to the top of the hero). */
  left: number;
  top: number;
  /** The page's fixed header runs over the top of the canvas: long bolts start below it. */
  sky: number;
  /** The screen's device pixel ratio (the canvas takes what it can use of it: see `fitDpr`). */
  dpr: number;
}

/** The hero stops drawing once its copy has faded out: scroll progress (scrollY over viewport height) past this. */
const FADED = 0.6;
/** Device pixels the canvas may hold: a phone's 3x on a headline that fills its width, a laptop's 2x, and no more. */
const PIXEL_BUDGET = 4.2e6;
const fitDpr = (want: number, width: number, height: number) =>
  Math.max(1, Math.min(want, 3, Math.sqrt(PIXEL_BUDGET / Math.max(1, width * height))));
/** A press that is a tap: it ends within this many pixels and milliseconds of where and when it began. */
const TAP_SLOP = 10;
const TAP_TIME = 500;

/** Where `el` sits inside `ancestor` from the layout alone, so a scroll-driven transform never skews it. */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement): { left: number; top: number } {
  let left = 0;
  let top = 0;
  for (let n: HTMLElement | null = el; n && n !== ancestor; n = n.offsetParent as HTMLElement | null) {
    left += n.offsetLeft;
    top += n.offsetTop;
  }
  return { left, top };
}

// Start fetching the face as soon as this chunk runs: the canvas cannot draw a letter without it.
if (typeof document !== 'undefined') void faceReady(STYLE.weight);

/**
 * The hero headline: "Pull the plug" / "It keeps running" in crisp display type, charged with
 * electricity. The real words stay in the heading for screen readers and search; the canvas is
 * decoration. The block reserves its height from arithmetic alone, so nothing moves when the font
 * arrives, and the entrance plays once the page says go.
 *
 * Under reduced motion the finished headline is drawn still with a few arcs held in place. Near the
 * letters the pointer draws arcs to it like a plasma ball; a tap or click on them is a surge.
 */
export function Headline({ go }: { go: boolean }) {
  const box = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<CurrentEngine | null>(null);
  const played = useRef(false);
  const reduced = useReducedMotion();
  const near = useActive(box);
  // Past the point where the hero's copy has faded out nothing is visible: stop drawing.
  const [faded, setFaded] = useState(false);
  const active = near && !faded;
  const [geom, setGeom] = useState<Geometry | null>(null);
  const [metrics, setMetrics] = useState<Metrics>(ESTIMATE);
  const [fontOk, setFontOk] = useState(false);
  // Whether the headline face itself has been measured (not a fallback drawn after the wait gave up).
  const [exact, setExact] = useState(false);
  const [status, setStatus] = useState<'pending' | 'on' | 'off'>('pending');
  const [built, setBuilt] = useState(0);

  const latest = useRef({ go, active, reduced });
  latest.current = { go, active, reduced };

  useEffect(() => subscribeScroll(({ y, vh }) => setFaded(y / vh > FADED)), []);

  const maybePlay = useCallback(() => {
    const e = engine.current;
    if (!e || played.current || !latest.current.go) return;
    played.current = true;
    e.play();
  }, []);

  // 1. Geometry, before paint: the height is reserved from the first frame, and again (debounced)
  //    whenever the width or the viewport height changes.
  useIsoLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    let timer = 0;
    const measure = () => {
      const width = el.clientWidth;
      if (!width) return;
      const hero = el.closest('section');
      const at = hero ? offsetWithin(el, hero) : { left: 0, top: 0 };
      const next: Geometry = {
        width,
        vh: Math.round(window.innerHeight / 16) * 16,
        canvasWidth: hero ? hero.clientWidth : width,
        left: at.left,
        top: at.top,
        sky: (Number.parseFloat(getComputedStyle(el).getPropertyValue('--nav-h')) || 60) + 6,
        dpr: Math.round(Math.min(window.devicePixelRatio || 1, 3) * 100) / 100,
      };
      setGeom((prev) => (prev && (Object.keys(next) as (keyof Geometry)[]).every((k) => prev[k] === next[k]) ? prev : next));
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

  // 2. Once the face is in, measure it for real (the estimate is only for the first frame). On a slow
  //    link the wait can end first and a fallback face is drawn; when the real one lands it is measured
  //    and drawn again.
  useEffect(() => {
    let alive = true;
    const fonts = document.fonts;
    const measure = () => {
      try {
        setMetrics(measured(STYLE.weight, STYLE.stretch));
        setExact(faceLoaded(STYLE.weight));
        setFontOk(true);
      } catch {
        setStatus('off');
      }
    };
    const arrived = () => {
      if (!alive || !faceLoaded(STYLE.weight)) return;
      fonts.removeEventListener('loadingdone', arrived);
      measure();
    };
    void faceReady(STYLE.weight).then(() => {
      if (!alive) return;
      measure();
      if (fonts && !faceLoaded(STYLE.weight)) fonts.addEventListener('loadingdone', arrived);
    });
    return () => {
      alive = false;
      fonts?.removeEventListener('loadingdone', arrived);
    };
  }, []);

  const layout = useMemo(() => (geom ? plan({ width: geom.width, vh: geom.vh, top: geom.top }, metrics) : null), [geom, metrics]);
  const canvasHeight = layout ? layout.top + layout.height + layout.bottom : 0;
  // The height the page reserves. A fallback face drawn on a slow link is measured to fit, but the page
  // keeps the room the real face will take, so nothing below moves when it arrives.
  const estimate = useMemo(() => (geom ? plan({ width: geom.width, vh: geom.vh, top: geom.top }, ESTIMATE) : null), [geom]);
  const reserved = layout && estimate ? (exact || layout.height > estimate.height + 2 ? layout.height : estimate.height) : 0;
  // What makes two layouts the same picture: a rebuild only when one of these changes.
  const key = geom && layout ? `${layout.mode}|${layout.size.toFixed(1)}|${layout.height}|${layout.top}|${geom.canvasWidth}|${geom.left}|${geom.width}|${geom.sky}|${geom.dpr}` : '';

  // 3. Build the engine for this layout (and again on a resize); the entrance plays once.
  useEffect(() => {
    const host = box.current;
    const cv = canvas.current;
    if (!geom || !layout || !host || !cv || !fontOk) return;
    let eng: CurrentEngine;
    try {
      const headline = buildHeadline(layout.lines, FAMILY, geom.left + geom.width / 2);
      eng = createCurrentEngine({
        canvas: cv,
        headline,
        palette: readPalette(host),
        width: geom.canvasWidth,
        height: canvasHeight,
        dpr: fitDpr(geom.dpr, geom.canvasWidth, canvasHeight),
        sky: geom.sky,
      });
    } catch {
      // No 2D canvas: the heading shows its real words as plain type.
      setStatus('off');
      return;
    }
    engine.current = eng;
    eng.setReduced(latest.current.reduced);
    eng.setActive(latest.current.active);
    if (import.meta.env.DEV) (window as unknown as { __current?: CurrentEngine }).__current = eng;
    setStatus('on');
    setBuilt((b) => b + 1);
    // A rebuild after a resize shows the finished headline: the entrance plays once.
    if (played.current) eng.settle();
    else maybePlay();
    return () => {
      eng.dispose();
      if (engine.current === eng) engine.current = null;
    };
    // The key stands for geom + layout: they are rebuilt each render but only matter when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fontOk, maybePlay]);

  useEffect(() => {
    maybePlay();
  }, [go, built, maybePlay]);
  useEffect(() => {
    engine.current?.setReduced(reduced);
  }, [reduced, built]);
  useEffect(() => {
    engine.current?.setActive(active);
  }, [active, built]);

  // 4. Pointer: arcs reach from the letters to a pointer that is near them. A tap or click on them is a
  //    surge, counted when the press ends where it began: a finger that starts a scroll is not a tap.
  useEffect(() => {
    const cv = canvas.current;
    if (!built || reduced || !active || !cv) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    let gone = false;
    let press: { id: number; x: number; y: number; at: number; scroll: number } | null = null;
    const flush = () => {
      raf = 0;
      const r = cv.getBoundingClientRect();
      engine.current?.pointer(gone ? null : x - r.left, y - r.top);
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const move = (e: PointerEvent) => {
      // Touch has no hover: a finger is a tap, handled below.
      if (e.pointerType === 'touch') return;
      x = e.clientX;
      y = e.clientY;
      gone = false;
      queue();
    };
    const leave = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      gone = true;
      queue();
    };
    const down = (e: PointerEvent) => {
      press = e.isPrimary && e.button === 0 ? { id: e.pointerId, x: e.clientX, y: e.clientY, at: e.timeStamp, scroll: window.scrollY } : null;
    };
    const up = (e: PointerEvent) => {
      const p = press;
      press = null;
      if (!p || p.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > TAP_SLOP || e.timeStamp - p.at > TAP_TIME) return;
      if (Math.abs(window.scrollY - p.scroll) > 4) return;
      const r = cv.getBoundingClientRect();
      engine.current?.tap(e.clientX - r.left, e.clientY - r.top);
    };
    const cancel = () => {
      press = null;
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerout', leave, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', cancel, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerout', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      if (raf) cancelAnimationFrame(raf);
      engine.current?.pointer(null);
    };
  }, [built, reduced, active]);

  return (
    <h1 className={styles.title} data-state={status}>
      <span className={styles.line}>Pull the plug</span> <span className={styles.line}>It keeps running</span>
      <span ref={box} className={styles.box} aria-hidden="true" style={{ blockSize: layout ? `${reserved}px` : undefined }}>
        <canvas
          ref={canvas}
          className={styles.canvas}
          style={
            geom && layout
              ? {
                  inlineSize: `${geom.canvasWidth}px`,
                  blockSize: `${canvasHeight}px`,
                  insetInlineStart: `${-geom.left}px`,
                  insetBlockStart: `${-layout.top}px`,
                }
              : undefined
          }
        />
      </span>
    </h1>
  );
}
