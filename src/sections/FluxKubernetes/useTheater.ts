import { useCallback, useEffect, useRef, useState } from 'react';
import type { LensId } from './lenses';
import { Sim, type View } from './sim';

export interface Theater {
  view: View;
  publish: () => void;
  setCopies: (n: number) => void;
  lose: () => void;
  reset: () => void;
  setZone: (zone: number | null) => void;
  /** Runs a lens's scripted scene (the four animated rows), or settles the stage for the others. */
  play: (lens: LensId) => void;
}

const FRAME = 50;

/** What the log says when reduced motion jumps straight to the end of a failure. */
const FAILURE_SUMMARY = 'Traffic moved off the lost node within seconds, and another node picked up the lost copy';

/**
 * Drives the simulation: a fixed 20 Hz step on a real-time accumulator, only while the stage is on
 * screen. React hears about the stage only when something visible changed (a node changed state, a
 * packet was sent), never per frame. Under reduced motion nothing ticks: every command jumps to its
 * end state and the log says what happened.
 */
export function useTheater(active: boolean, reduced: boolean): Theater {
  const sim = useRef<Sim | null>(null);
  if (!sim.current) {
    sim.current = new Sim();
    if (reduced) {
      sim.current.publish();
      sim.current.settle();
    }
  }
  const s = sim.current;
  const [view, setView] = useState<View>(() => s.view());
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const sync = useCallback(() => setView(s.view()), [s]);

  // Reduced motion arrived while a scene was mid-flight: land it.
  useEffect(() => {
    if (!reduced) return;
    s.setDemoCrash(false);
    if (s.isPublished) s.settle();
    sync();
  }, [reduced, s, sync]);

  // The clock.
  useEffect(() => {
    if (!active || reduced) return;
    let last = performance.now();
    let acc = 0;
    let seen = s.stamp;
    const id = window.setInterval(() => {
      const now = performance.now();
      acc += Math.min(0.5, (now - last) / 1000);
      last = now;
      while (acc >= FRAME / 1000) {
        s.step(FRAME / 1000);
        acc -= FRAME / 1000;
      }
      if (s.stamp !== seen) {
        seen = s.stamp;
        setView(s.view());
      }
    }, FRAME);
    return () => window.clearInterval(id);
  }, [active, reduced, s]);

  const publish = useCallback(() => {
    s.publish();
    if (reducedRef.current) s.settle();
    sync();
  }, [s, sync]);

  const setCopies = useCallback(
    (n: number) => {
      s.setDesired(n);
      if (reducedRef.current && s.isPublished) s.settle();
      sync();
    },
    [s, sync],
  );

  const failNow = useCallback(() => {
    s.loseNode();
    if (reducedRef.current) {
      s.settle(true);
      s.note(FAILURE_SUMMARY);
    }
  }, [s]);

  const lose = useCallback(() => {
    if (!s.isPublished) {
      s.publish();
      s.settle();
    }
    failNow();
    sync();
  }, [failNow, s, sync]);

  const reset = useCallback(() => {
    s.setDemoCrash(false);
    s.reset();
    sync();
  }, [s, sync]);

  const setZone = useCallback(
    (zone: number | null) => {
      s.setZone(zone);
      if (reducedRef.current) s.settle();
      sync();
    },
    [s, sync],
  );

  const play = useCallback(
    (lens: LensId) => {
      const instant = reducedRef.current;
      s.setDemoCrash(false);

      // A running app is the backdrop for most lenses: start one, already settled.
      const running = () => {
        if (!s.isPublished) s.publish();
        s.settle();
      };

      switch (lens) {
        case 'schedule':
          s.reset();
          s.publish();
          if (instant) s.settle();
          break;
        case 'replicas':
          running();
          s.setDesired(s.copies >= 12 ? s.copies - 1 : s.copies + 1);
          if (instant) s.settle();
          break;
        case 'failure':
          running();
          if (s.copies < 3) {
            s.setDesired(3);
            s.settle();
          }
          failNow();
          break;
        case 'reconcile':
          running();
          s.setDemoCrash(!instant);
          break;
        case 'geo':
          break;
        default:
          running();
          break;
      }
      sync();
    },
    [failNow, s, sync],
  );

  return { view, publish, setCopies, lose, reset, setZone, play };
}
