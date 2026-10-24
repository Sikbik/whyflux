import { useCallback, useEffect, useRef, useState } from 'react';

export type MeterPhase = 'rest' | 'run' | 'done';

/** The meter's month: a counter that walks 1 to 30 while the bills fill. */
export const MONTH_DAYS = 30;
/** The month, compressed. */
export const RUN_SECONDS = 4;
const RUN_MS = RUN_SECONDS * 1000;
const GROW_MS = 1100;

const easeOut = (x: number): number => 1 - (1 - x) ** 3;
const linear = (x: number): number => x;

export interface Meter {
  phase: MeterPhase;
  /** 1 to 30 while running, 30 once done, 0 before a run. */
  day: number;
  /** The bars have landed and no run is in progress: the multiples can show. */
  settled: boolean;
  /** 0 to 1: how much of the month has been billed (and, before a run, how far the bars have grown). */
  getT: () => number;
  /** Called on every frame with `t`. Frames never go through React: the bars write their own DOM. */
  subscribe: (listener: (t: number) => void) => () => void;
  run: () => void;
  reset: () => void;
  /** Grow the bars from zero again: the other workload was picked. */
  regrow: () => void;
}

/**
 * The cost meter. One number, `t`, drives every bar and every price: it grows to 1 once the chart
 * is in view, and "Run a month" plays it again at an even rate, because a bill accrues evenly.
 * The 60 frames a second are written straight to the bars; React only hears about the phase and the
 * day. Reduced motion jumps to the end. Scrolling away mid-run finishes the run.
 */
export function useMeter(inView: boolean, active: boolean, reduced: boolean): Meter {
  const [phase, setPhaseState] = useState<MeterPhase>('rest');
  const [day, setDay] = useState(0);
  const [settled, setSettled] = useState(reduced);
  const tRef = useRef(reduced ? 1 : 0);
  const phaseRef = useRef<MeterPhase>('rest');
  const dayRef = useRef(0);
  const settledRef = useRef(reduced);
  const listeners = useRef(new Set<(t: number) => void>());
  const frame = useRef(0);
  const grown = useRef(reduced);

  const setPhase = useCallback((p: MeterPhase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const emit = useCallback((t: number) => {
    tRef.current = t;
    listeners.current.forEach((l) => l(t));
    // Tell React only when something it renders changes (30 days, once settled), not 60 times a second.
    const p = phaseRef.current;
    const d = p === 'run' ? Math.min(MONTH_DAYS, Math.floor(t * MONTH_DAYS) + 1) : p === 'done' ? MONTH_DAYS : 0;
    if (d !== dayRef.current) {
      dayRef.current = d;
      setDay(d);
    }
    const s = p !== 'run' && t >= 0.999;
    if (s !== settledRef.current) {
      settledRef.current = s;
      setSettled(s);
    }
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
  }, []);
  useEffect(() => stop, [stop]);

  const play = useCallback(
    (ms: number, ease: (x: number) => number, done?: () => void) => {
      stop();
      const t0 = performance.now();
      emit(0);
      const tick = (now: number) => {
        const x = Math.min(1, (now - t0) / ms);
        emit(ease(x));
        if (x < 1) {
          frame.current = requestAnimationFrame(tick);
        } else {
          frame.current = 0;
          done?.();
        }
      };
      frame.current = requestAnimationFrame(tick);
    },
    [stop, emit],
  );

  const regrow = useCallback(() => {
    setPhase('rest');
    if (reduced) {
      stop();
      emit(1);
    } else {
      play(GROW_MS * 0.7, easeOut);
    }
  }, [reduced, play, stop, emit, setPhase]);

  useEffect(() => {
    if (!inView || grown.current) return;
    grown.current = true;
    play(GROW_MS, easeOut);
  }, [inView, play]);

  const run = useCallback(() => {
    if (reduced) {
      stop();
      setPhase('done');
      emit(1);
      return;
    }
    setPhase('run');
    play(RUN_MS, linear, () => {
      setPhase('done');
      emit(1);
    });
  }, [reduced, play, stop, emit, setPhase]);

  const reset = useCallback(() => {
    stop();
    setPhase('rest');
    emit(1);
  }, [stop, emit, setPhase]);

  useEffect(() => {
    if (active || phase !== 'run') return;
    stop();
    setPhase('done');
    emit(1);
  }, [active, phase, stop, emit, setPhase]);

  const getT = useCallback(() => tRef.current, []);
  const subscribe = useCallback((listener: (t: number) => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  return { phase, day, settled, getT, subscribe, run, reset, regrow };
}
