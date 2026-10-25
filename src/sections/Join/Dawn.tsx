import { useRef } from 'react';
import { clamp01, smoothstep } from '@/lib/math';
import { ArtPlate, useIsoLayoutEffect, useReducedMotion, useScrollProgress } from '@/ui';
import styles from './Dawn.module.css';

/** Everything the dawn is, from how far the horizon has climbed. Each is 0..1. */
function light(rise: number) {
  return {
    /** The plate and the sun climb into place. */
    lift: smoothstep(0, 1, rise),
    /** The plate fades in from black first. */
    veil: smoothstep(0, 0.55, rise),
    /** Then the sun itself comes up, and its rings open. */
    sun: smoothstep(0.3, 0.95, rise),
  };
}

const VARS = ['--lift', '--veil', '--sun'] as const;

/**
 * The sunrise. A zero-size anchor sits at the middle of a band between the title and the ways in, and
 * everything that is the dawn hangs off it: the `bg-dawn` plate (placed so its own sun lands on the
 * anchor), then crisp light on top of it: a hard-edged warm-white disc and two hairline rings, no blur, no
 * soft glow of our own.
 *
 * Scroll writes three numbers (see `light`) on the band as it climbs the screen; CSS does the rest, so
 * nothing re-renders. Under reduced motion the numbers are cleared and the stylesheet shows the
 * finished dawn at rest.
 */
export function Dawn() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const last = useRef(-1);

  const apply = (force = false) => {
    const el = root.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 while the band is at the bottom edge of the screen, 1 once it has climbed to the middle.
    const rise = clamp01((vh * 1.02 - (r.top + r.height / 2)) / (vh * 0.52));
    if (!force && Math.abs(rise - last.current) < 0.0006) return;
    last.current = rise;
    const l = light(rise);
    el.style.setProperty('--lift', l.lift.toFixed(4));
    el.style.setProperty('--veil', l.veil.toFixed(4));
    el.style.setProperty('--sun', l.sun.toFixed(4));
  };

  useScrollProgress(root, { vars: false, onUpdate: () => (reduced ? undefined : apply()) });

  // Place the dawn before the first paint, and hand it back to the stylesheet when motion is calm.
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (reduced) {
      for (const v of VARS) el.style.removeProperty(v);
      last.current = -1;
    } else {
      apply(true);
    }
  }, [reduced]);

  return (
    <div ref={root} className={styles.horizon} aria-hidden="true">
      <div className={styles.anchor}>
        <div className={styles.plate}>
          <ArtPlate src="bg-dawn" opacity={0.9} />
        </div>
        <span className={styles.ring} data-ring="outer" />
        <span className={styles.ring} data-ring="inner" />
        <span className={styles.sun} />
      </div>
    </div>
  );
}
