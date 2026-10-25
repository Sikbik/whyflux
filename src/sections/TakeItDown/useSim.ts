/**
 * Chapter 05, the glue between React and the simulation: build the worlds once the live node
 * positions are in, create the `Sim`, run its loop while the stage is on screen, and let
 * components read it without re-rendering per frame (lane versions change on events only).
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { hostingOrgs } from '@/data/flux';
import type { FluxLiveSnapshot } from '@/lib/live';
import type { FieldRenderer } from './render/draw';
import { type Domain, domainOf } from './render/layout';
import { Sim, type SimConfig } from './sim/engine';
import { MAX_FRAME_S, PREROLL_S } from './sim/model';
import { buildWorlds, type Worlds } from './sim/world';

/** How long to wait for real node positions before drawing the labeled fallback set. */
const POINTS_GRACE_MS = 1600;

/**
 * Builds the worlds from the live layer. The real positions normally arrive within a moment; if
 * they do not, the fallback set stands in (the chapter says so), and is replaced by the real thing
 * if it arrives before the first strike.
 */
export function useWorlds(live: FluxLiveSnapshot, seed: number, struck: boolean): Worlds | null {
  const [waited, setWaited] = useState(false);
  const [worlds, setWorlds] = useState<Worlds | null>(null);
  const hasPoints = live.points.length > 0;

  useEffect(() => {
    const id = window.setTimeout(() => setWaited(true), POINTS_GRACE_MS);
    return () => window.clearTimeout(id);
  }, []);

  const latest = useRef(live);
  latest.current = live;

  useEffect(() => {
    if (worlds && (worlds.real || !hasPoints || struck)) return;
    if (!worlds && !hasPoints && !waited) return;
    const l = latest.current;
    setWorlds(buildWorlds({ points: l.points, byCountry: l.byCountry, orgs: hostingOrgs, seed }));
  }, [worlds, hasPoints, waited, seed, struck]);

  return worlds;
}

export interface SimBundle {
  sim: Sim;
  domain: Domain;
  renderers: Set<FieldRenderer>;
  /** Draws every visible lane once (reduced motion has no loop). */
  redraw: () => void;
}

/** The sim for a set of worlds, kept in step with the scenario controls. */
export function useSimBundle(worlds: Worlds | null, cfg: SimConfig): SimBundle | null {
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const renderers = useMemo(() => new Set<FieldRenderer>(), []);

  const base = useMemo(() => {
    if (!worlds) return null;
    return { sim: new Sim(worlds, cfgRef.current), domain: domainOf([worlds.cloud, worlds.flux]) };
  }, [worlds]);

  const sim = base?.sim;
  useEffect(() => {
    sim?.configure({ copies: cfg.copies, place: cfg.place, resilient: cfg.resilient });
  }, [sim, cfg.copies, cfg.place, cfg.resilient]);

  const redraw = useCallback(() => {
    const now = performance.now() / 1000;
    for (const r of renderers) if (r.visible) r.draw(now, true);
  }, [renderers]);

  return useMemo(() => (base ? { sim: base.sim, domain: base.domain, renderers, redraw } : null), [base, renderers, redraw]);
}

/**
 * Runs the sim and draws every lane, once per animation frame, only while `active` (the stage is
 * within a screen of the viewport and the tab is visible). Under reduced motion there is no loop:
 * the lanes redraw when something changes.
 */
export function useSimLoop(bundle: SimBundle | null, active: boolean, reduced: boolean): void {
  const sim = bundle?.sim;
  const renderers = bundle?.renderers;
  const redraw = bundle?.redraw;

  useEffect(() => {
    if (!sim || !renderers || !redraw) return;
    sim.emitFx = !reduced;
    sim.prerollS = reduced ? PREROLL_S : 0;
    if (reduced) {
      if (sim.t === 0 && sim.strikes === 0) sim.advance(PREROLL_S);
      redraw();
      return sim.subscribe(redraw);
    }
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      sim.frame(Math.min(MAX_FRAME_S, (t - last) / 1000));
      last = t;
      // The clock the one-off redraws use too, so an effect never starts "in the future" of the loop.
      const now = performance.now() / 1000;
      for (const r of renderers) {
        if (r.visible) r.draw(now, false);
        else r.skip();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [sim, renderers, redraw, active, reduced]);
}

/** A primitive read from the sim that re-renders the component when the sim reports a change. */
export function useSimValue<T extends string | number | boolean>(sim: Sim | null, read: (s: Sim) => T, fallback: T): T {
  const subscribe = useCallback((cb: () => void) => (sim ? sim.subscribe(cb) : () => {}), [sim]);
  return useSyncExternalStore(
    subscribe,
    () => (sim ? read(sim) : fallback),
    () => fallback,
  );
}

/** A lane's version: bumps on events (a strike, a state change, the narration), a few times a second at most. */
export function useLaneVersion(sim: Sim | null, lane: number): number {
  return useSimValue(sim, (s) => s.lanes[lane]!.uiVersion, 0);
}
