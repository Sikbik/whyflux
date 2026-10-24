import { useCallback, useEffect, useReducer, useState } from 'react';
import { type Attempt, type Host, HOSTS, holdFor, PACE } from './model';

/** One attempt, as the stage and the readout see it. */
export interface Run {
  /** Counts up with every attempt. The stage keys its animation on it, so each one plays from the start. */
  seq: number;
  host: Host;
  key: string;
  /** Part of a run (the opening sequence or Run all), rather than chosen by the visitor. */
  auto: boolean;
  /** The first time this attempt has been tried on this node (so there is nothing to show for it yet). */
  fresh: boolean;
}

interface State {
  host: Host;
  /** The attempts tried on each kind of node, in the order they last ran. */
  tried: Record<Host, string[]>;
  run: Run | null;
  /** How many attempts have run, ever: the next one is `seq + 1`, even after a clear. */
  seq: number;
}

type Action =
  | { type: 'host'; host: Host }
  | { type: 'attempt'; host: Host; key: string; auto: boolean }
  | { type: 'fill'; hosts: readonly Host[]; keys: readonly string[] }
  | { type: 'clear'; hosts: readonly Host[] };

function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'host':
      return state.host === action.host ? state : { ...state, host: action.host };
    case 'attempt': {
      const fresh = !state.tried[action.host].includes(action.key);
      const list = state.tried[action.host].filter((k) => k !== action.key);
      list.push(action.key);
      const seq = state.seq + 1;
      return {
        host: action.host,
        tried: { ...state.tried, [action.host]: list },
        run: { seq, host: action.host, key: action.key, auto: action.auto, fresh },
        seq,
      };
    }
    case 'fill': {
      const tried = { ...state.tried };
      for (const h of action.hosts) tried[h] = [...action.keys];
      return { ...state, tried };
    }
    case 'clear': {
      const tried = { ...state.tried };
      for (const h of action.hosts) tried[h] = [];
      const run = state.run && action.hosts.includes(state.run.host) ? null : state.run;
      return { ...state, tried, run };
    }
  }
}

/** A step of a timeline: an attempt, a flip of the node toggle, or a pause. */
type Step =
  | { kind: 'attempt'; host: Host; key: string; hold: number }
  | { kind: 'flip'; host: Host; hold: number }
  | { kind: 'wait'; hold: number };

interface Plan {
  steps: Step[];
  i: number;
}

function attemptsFor(rows: readonly Attempt[], host: Host): Step[] {
  return rows.map((row) => ({ kind: 'attempt', host, key: row.key, hold: holdFor(host) }));
}

export interface SeatOptions {
  rows: readonly Attempt[];
  initialHost: Host | null;
  /** Reduced motion: nothing plays, and the seat opens on its end state. */
  reduced: boolean;
  /** A timeline only plays while the seat is on screen and the tab is visible. */
  active: boolean;
}

export interface Seat {
  host: Host;
  tried: Record<Host, string[]>;
  run: Run | null;
  /** A timeline is playing. */
  playing: boolean;
  /** Counts up when a timeline finishes by itself (not when the visitor interrupts it). */
  finished: number;
  setHost: (host: Host) => void;
  attempt: (key: string) => void;
  /** Run every attempt on the selected node, in order. */
  runAll: () => void;
  /** The opening sequence: the attempts on each node in turn, flipping the toggle between them. */
  playIntro: (hosts: readonly Host[]) => void;
  stop: () => void;
}

/**
 * The operator's seat as a state machine. `tried` and `run` are the whole story the stage and the readout
 * draw from. A timeline (the opening sequence, or Run all) is a list of steps played with timers; it
 * pauses while the seat is off screen and the visitor can interrupt it at any point by touching anything.
 */
export function useSeat({ rows, initialHost, reduced, active }: SeatOptions): Seat {
  const [state, dispatch] = useReducer(reduce, undefined, (): State => {
    const keys = rows.map((r) => r.key);
    if (reduced) return { host: initialHost ?? 'arcane', tried: { legacy: [...keys], arcane: [...keys] }, run: null, seq: 0 };
    return { host: initialHost ?? 'arcane', tried: { legacy: [], arcane: [] }, run: null, seq: 0 };
  });
  const [plan, setPlan] = useState<Plan | null>(null);
  const [finished, setFinished] = useState(0);

  // Reduced motion arriving mid-flight (the footer toggle): stop, and show everything.
  useEffect(() => {
    if (!reduced) return;
    setPlan(null);
    dispatch({ type: 'fill', hosts: HOSTS, keys: rows.map((r) => r.key) });
  }, [reduced, rows]);

  useEffect(() => {
    if (!plan || !active) return;
    const step = plan.steps[plan.i];
    if (!step) {
      setPlan(null);
      setFinished((n) => n + 1);
      return;
    }
    if (step.kind === 'attempt') dispatch({ type: 'attempt', host: step.host, key: step.key, auto: true });
    else if (step.kind === 'flip') dispatch({ type: 'host', host: step.host });
    const id = window.setTimeout(() => setPlan((p) => (p ? { ...p, i: p.i + 1 } : p)), step.hold);
    return () => window.clearTimeout(id);
  }, [plan, active]);

  const stop = useCallback(() => setPlan(null), []);

  const setHost = useCallback((host: Host) => {
    setPlan(null);
    dispatch({ type: 'host', host });
  }, []);

  const attempt = useCallback(
    (key: string) => {
      setPlan(null);
      dispatch({ type: 'attempt', host: state.host, key, auto: false });
    },
    [state.host],
  );

  const runAll = useCallback(() => {
    if (reduced) {
      setPlan(null);
      const keys = rows.map((r) => r.key);
      dispatch({ type: 'fill', hosts: [state.host], keys });
      const last = keys[keys.length - 1];
      if (last) dispatch({ type: 'attempt', host: state.host, key: last, auto: false });
      return;
    }
    dispatch({ type: 'clear', hosts: [state.host] });
    setPlan({ steps: attemptsFor(rows, state.host), i: 0 });
  }, [reduced, rows, state.host]);

  const playIntro = useCallback(
    (hosts: readonly Host[]) => {
      if (reduced) return;
      const steps: Step[] = [];
      hosts.forEach((host, n) => {
        if (n > 0) {
          steps.push({ kind: 'wait', hold: PACE.beforeFlip });
          steps.push({ kind: 'flip', host, hold: PACE.afterFlip });
        }
        steps.push(...attemptsFor(rows, host));
      });
      const first = hosts[0];
      if (first) dispatch({ type: 'host', host: first });
      setPlan({ steps, i: 0 });
    },
    [reduced, rows],
  );

  return {
    host: state.host,
    tried: state.tried,
    run: state.run,
    playing: plan !== null,
    finished,
    setHost,
    attempt,
    runAll,
    playIntro,
    stop,
  };
}
