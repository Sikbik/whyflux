import { Crosshair, FastForward, RotateCcw } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { fluxStats } from '@/data/flux';
import { liveStatValue, useFluxLive } from '@/lib/live';
import { useUrlParam } from '@/lib/urlState';
import { useActive, useInView, useIsPhone, useReducedMotion } from '@/ui';
import { CopiesPicker, CopyHexes } from './Copies';
import { plural } from './format';
import { Lane } from './Lane';
import { LaneStrip } from './LaneStrip';
import { Receipts } from './Receipts';
import { ShareRow } from './ShareRow';
import { Toggle } from './Toggle';
import { type Sim } from './sim/engine';
import {
  CLOUD,
  COPIES,
  DEFAULT_SEED,
  parseCopies,
  parsePlace,
  parseSeed,
  type Placement,
  REDEPLOY_SIM_S,
  SETTLE_S,
  SKIP_S,
  type Weapon,
} from './sim/model';
import { useLaneVersion, useSimBundle, useSimLoop, useSimValue, useWorlds } from './useSim';
import { WeaponRail } from './WeaponRail';
import styles from './TakeItDown.module.css';

/** The state of every place a lane's app lives, re-read whenever the lane reports a change. */
function useSlotStates(sim: Sim, lane: number): number[] {
  useLaneVersion(sim, lane);
  const L = sim.lanes[lane]!;
  return Array.from({ length: L.nSlots }, (_, s) => L.slotState[s]!);
}

/**
 * The playground: what to take out, two apps on one stage, and the way out. It owns the scenario
 * (copies, placement and the seed live in the URL, so a shared link replays), builds the worlds
 * from the live node positions, and runs the simulation while it is on screen.
 */
export function Playground() {
  const live = useFluxLive();
  const reduced = useReducedMotion();
  const phone = useIsPhone();
  const stage = useRef<HTMLDivElement>(null);
  const fireRef = useRef<HTMLButtonElement>(null);
  const active = useActive(stage);
  const pinned = useInView(stage, { rootMargin: '-50% 0px -30% 0px' });

  const [copiesParam, setCopiesParam] = useUrlParam('copies');
  const [placeParam, setPlaceParam] = useUrlParam('place');
  const [seedParam] = useUrlParam('s');
  const copies = parseCopies(copiesParam);
  const place = parsePlace(placeParam);
  const seed = parseSeed(seedParam);
  const [resilient, setResilient] = useState(false);
  const [struck, setStruck] = useState(false);

  const worlds = useWorlds(live, seed, struck);
  const bundle = useSimBundle(worlds, { copies, place, resilient, seed });
  useSimLoop(bundle, active, reduced);
  const sim = bundle?.sim ?? null;

  const hit = useSimValue(sim, (s) => s.strikes > 0, false);
  useEffect(() => {
    if (hit) setStruck(true);
  }, [hit]);

  const chaos = useSimValue(sim, (s) => s.chaos, false);

  const redundancy = fluxStats.find((s) => s.id === 'redundancy');
  const redundancyPct = liveStatValue('redundancy', live) ?? redundancy?.value;

  const settle = (seconds: number) => {
    if (!sim || !bundle) return;
    sim.advance(seconds);
    bundle.redraw();
  };

  const fire = () => {
    if (!sim) return;
    sim.fireRandom();
    if (reduced) settle(SETTLE_S);
  };
  const reset = () => {
    if (!sim) return;
    sim.reset();
    if (reduced) bundle?.redraw();
  };
  // The share row disappears with the reset, so the key focus it held moves to the fire button.
  const again = () => {
    reset();
    fireRef.current?.focus({ preventScroll: true });
  };
  const redeploy = (lane: number) => {
    if (sim?.redeploy(lane) && reduced) settle(REDEPLOY_SIM_S + 0.5);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!sim || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select')) return;
    if (e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      sim.setWeapon(Number(e.key) as Weapon);
    } else if (e.key === ' ' && !t.closest('button, a, [role="radio"], [role="switch"], [role="slider"]')) {
      e.preventDefault();
      fire();
    }
  };

  if (!sim || !bundle) {
    return (
      <div ref={stage} className={styles.stage} aria-busy="true">
        <div className={styles.skeleton} aria-hidden="true" />
      </div>
    );
  }

  const setCopies = (n: number) => setCopiesParam(n === COPIES.initial ? null : String(n));
  const setPlace = (p: Placement) => setPlaceParam(p === 'default' ? null : p);

  const fireButton = (
    <button type="button" ref={fireRef} className={styles.fire} onClick={fire} aria-label={phone ? 'Fire at random' : undefined}>
      <span className={styles.fireFace}>
        <Crosshair size={18} strokeWidth={1.75} aria-hidden="true" />
        {phone ? null : <span>Fire at random</span>}
      </span>
    </button>
  );
  const chaosControl = reduced ? (
    <button type="button" className={styles.textButton} onClick={() => settle(SKIP_S)}>
      <FastForward size={16} strokeWidth={1.75} aria-hidden="true" />
      Skip ahead
    </button>
  ) : (
    <Toggle on={chaos} onChange={(on) => sim.setChaos(on)} tone="crit">
      Chaos
    </Toggle>
  );
  const resetControl = (
    <button type="button" className={styles.textButton} onClick={reset}>
      <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
      Reset
    </button>
  );

  const laneProps = { sim, domain: bundle.domain, renderers: bundle.renderers, redraw: bundle.redraw, reduced, onRedeploy: redeploy };

  return (
    <div ref={stage} className={styles.stage} onKeyDown={onKeyDown} data-chaos={chaos || undefined}>
      {phone ? <LaneStrip sim={sim} reduced={reduced} /> : null}
      <WeaponRail
        sim={sim}
        pinned={phone}
        visible={pinned}
        trailing={
          phone ? (
            fireButton
          ) : (
            <>
              {fireButton}
              {chaosControl}
              {resetControl}
            </>
          )
        }
      />

      <div className={styles.lanes}>
        <Lane {...laneProps} lane={0}>
          <CloudDeck sim={sim} resilient={resilient} onChange={setResilient} />
        </Lane>
        <Lane {...laneProps} lane={1}>
          <FluxDeck sim={sim} copies={copies} place={place} onCopies={setCopies} onPlace={setPlace} pct={redundancyPct} label={redundancy?.label} />
        </Lane>
      </div>

      <div className={styles.after}>
        {phone ? (
          <div className={styles.more}>
            {chaosControl}
            {resetControl}
          </div>
        ) : null}
        <ShareRow sim={sim} copies={copies} place={place} seed={seed === DEFAULT_SEED && seedParam === null ? null : seed} onReset={again} />
        <Receipts illustrative={!worlds?.real} orgs={!!worlds?.orgs} statSource={redundancy?.source} />
      </div>
    </div>
  );
}

function CloudDeck({ sim, resilient, onChange }: { sim: Sim; resilient: boolean; onChange: (v: boolean) => void }) {
  const states = useSlotStates(sim, 0);
  return (
    <>
      <div className={styles.picker}>
        <CopyHexes states={states} />
        <span className={styles.pickerValue} aria-hidden="true">
          {states.length} {plural(states.length, 'server', 'servers')}
        </span>
      </div>
      <Toggle on={resilient} onChange={onChange}>
        Spread over {CLOUD.zones} data centers
      </Toggle>
    </>
  );
}

interface FluxDeckProps {
  sim: Sim;
  copies: number;
  place: Placement;
  onCopies: (n: number) => void;
  onPlace: (p: Placement) => void;
  pct: number | undefined;
  label: string | undefined;
}

function FluxDeck({ sim, copies, place, onCopies, onPlace, pct, label }: FluxDeckProps) {
  const states = useSlotStates(sim, 1);
  return (
    <>
      <CopiesPicker value={copies} states={states} onChange={onCopies} />
      <Toggle on={place === 'spread'} onChange={(on) => onPlace(on ? 'spread' : 'default')}>
        Spread across continents
      </Toggle>
      {pct != null && label ? (
        <p className={styles.fact}>
          {Math.round(pct)}% {label}
        </p>
      ) : null}
    </>
  );
}
