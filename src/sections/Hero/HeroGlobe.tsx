import { type RefObject, useEffect, useRef } from 'react';
import type { GlobeController, GlobeHover, GlobeQuality } from '@/lib/globe/engine';
import type { NodePoint } from '@/lib/live';
import { subscribeScroll } from '@/lib/scroll';
import { useActive, useReducedMotion } from '@/ui';
import styles from './Hero.module.css';

export interface HeroGlobeProps {
  /** Sites to draw: real node points, or the illustrative fallback. */
  sites: readonly NodePoint[];
  onHover: (h: GlobeHover | null) => void;
  /** Fires once, when the first frame of the live scene is on screen. */
  onReady: () => void;
  /** Fires if WebGL is unavailable or the context is lost for good: the poster stays. */
  onFail: () => void;
  /**
   * On a phone the planet gets its own window under the copy: this element's top edge is where the
   * planet's top edge sits. On wider screens the engine's own composition is used.
   */
  anchor?: RefObject<HTMLElement | null>;
}

/** Below this width the layout is a single column and the planet follows the anchor. */
const NARROW = 720;

function initialQuality(): GlobeQuality {
  const forced = new URLSearchParams(window.location.search).get('q');
  if (forced === 'low' || forced === 'medium' || forced === 'high') return forced;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return 'low';
  if (window.innerWidth < 720 || (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4) return 'medium';
  return 'high';
}

/**
 * The canvas and its lifecycle. The engine (and three.js with it) is a separate chunk, imported
 * after the first paint; the loop runs only while the hero is within a screen of the viewport and
 * the tab is visible; resizing follows the container; the scroll position feeds the camera.
 */
export function HeroGlobe({ sites, onHover, onReady, onFail, anchor }: HeroGlobeProps) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const globe = useRef<GlobeController | null>(null);
  const reduced = useReducedMotion();
  const active = useActive(box);

  // Callbacks are read through a ref so the engine is created once.
  const cb = useRef({ onHover, onReady, onFail });
  cb.current = { onHover, onReady, onFail };
  const latest = useRef({ sites, reduced, active });
  latest.current = { sites, reduced, active };

  // Create the engine once the canvas is mounted and there is something to draw.
  const haveSites = sites.length > 0;
  useEffect(() => {
    const el = canvas.current;
    const host = box.current;
    if (!el || !host || !haveSites) return;
    let cancelled = false;
    let controller: GlobeController | null = null;
    let ro: ResizeObserver | null = null;
    let stopScroll = () => {};

    import('@/lib/globe/engine')
      .then(({ createGlobe }) =>
        createGlobe({
          canvas: el,
          quality: initialQuality(),
          reducedMotion: latest.current.reduced,
          // The hero globe is a showcase: nothing on it can be knocked out (that is chapter 05).
          playable: false,
          ambientFailover: true,
          onHover: (h) => cb.current.onHover(h),
          onFail: () => cb.current.onFail(),
        }),
      )
      .then((g) => {
        if (cancelled) {
          g.dispose();
          return;
        }
        controller = g;
        globe.current = g;
        const fit = () => {
          const r = host.getBoundingClientRect();
          const a = anchor?.current;
          const top = a && r.width < NARROW ? a.getBoundingClientRect().top - r.top : undefined;
          g.resize(r.width, r.height, window.devicePixelRatio || 1, top);
        };
        fit();
        ro = new ResizeObserver(fit);
        ro.observe(host);
        if (anchor?.current) ro.observe(anchor.current);
        g.setSites(latest.current.sites);
        g.setActive(latest.current.active);
        stopScroll = subscribeScroll(({ y, vh }) => g.setScroll(Math.min(1, Math.max(0, y / vh))));
        g.playIntro();
        cb.current.onReady();
      })
      .catch(() => {
        if (!cancelled) cb.current.onFail();
      });

    return () => {
      cancelled = true;
      stopScroll();
      ro?.disconnect();
      controller?.dispose();
      globe.current = null;
    };
  }, [haveSites, anchor]);

  // Follow data, visibility and motion preference without recreating anything.
  useEffect(() => {
    if (sites.length) globe.current?.setSites(sites);
  }, [sites]);
  useEffect(() => {
    globe.current?.setActive(active);
  }, [active]);
  useEffect(() => {
    globe.current?.setReducedMotion(reduced);
  }, [reduced]);

  return (
    <div ref={box} className={styles.globeBox}>
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}
