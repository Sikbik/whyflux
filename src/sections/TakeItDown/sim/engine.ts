/**
 * Chapter 05, the simulation. One `Sim` holds two lanes (the same app on traditional hosting and on
 * Flux), a fixed 20 Hz step, a seeded random generator and a small ring of effects the renderer
 * drains. It knows nothing about React or the canvas.
 *
 * A lane is a set of hosts (src/sections/TakeItDown/sim/world.ts) and a few "slots": the places the
 * app lives. A slot's host is where a copy runs; its state says what that copy is doing:
 *
 *   UP          serving
 *   UNDETECTED  its host just died, the balancer does not know yet (requests that hit it are retried)
 *   WAIT        marked down; the network waits for the lost copy's record to lapse, then a node claims it
 *   OWNER       dead and nothing will fix it: the owner has to redeploy by hand
 *   INSTALL     a node claimed the copy and is installing it
 *   WARM        installed; the balancer waits for two good checks before sending traffic
 *
 * Seconds-long things run in real time and minutes-long things are compressed (model.ts). All
 * state lives in typed arrays; the step never allocates. Narration strings are built on events
 * only, which are rare and user-driven.
 */
import { mulberry32 } from '@/lib/rng';
import {
  CHAOS_CLIMB_EVERY_S,
  CHAOS_EVERY_S,
  CLOUD_REPAIR_SIM_S,
  COPIES,
  DETECT_MIN_S,
  DETECT_SPAN_S,
  INSTALL_SIM_S,
  type LaneKind,
  MAX_FRAME_S,
  MINUTES_PER_SIM_S,
  type Placement,
  REDEPLOY_SIM_S,
  REQUEST_TRIES,
  REQUESTS_PER_S,
  STEP_S,
  WAIT_MAX_MIN,
  WAIT_MIN_MIN,
  WARM_MIN_S,
  WARM_SPAN_S,
  type Weapon,
} from './model';
import type { LaneWorld, Worlds } from './world';

export const SLOT = { EMPTY: 0, UP: 1, UNDETECTED: 2, WAIT: 3, OWNER: 4, INSTALL: 5, WARM: 6 } as const;
export const STATUS = { SERVING: 0, FAILING: 1, DOWN: 2 } as const;
export const OUTCOME = { SERVED: 0, RETRIED: 1, FAILED: 2 } as const;
export const FX = { STRIKE: 1, REQUEST: 2, CLAIM: 3, UP: 4, REVIVE: 5 } as const;
/** What a log line is about; the larger value wins when several lines are merged into one beat. */
export const LOG = { INFO: 0, WORK: 1, OK: 2, LOSS: 3 } as const;
/** How many lines of the story each lane remembers. */
export const LOG_CAP = 6;

export const MAX_SLOTS = COPIES.max;
/** The most hosts one blast can take: the biggest world. */
export const MAX_BLAST = 48;
export const FX_CAP = 256;
/** Narration changes at most this often: a screen reader hears one line per beat, not a stutter. */
const NARR_GAP_S = 1.6;
/** The UI hears about counters at most this often. */
const COUNTER_EVERY_S = 0.5;

export interface LogLine {
  /** Unique within a lane for the lifetime of the sim, so a list can key on it. */
  id: number;
  text: string;
  tone: number;
}

export interface SimConfig {
  copies: number;
  place: Placement;
  /** The cloud lane's "configure for resilience" switch. */
  resilient: boolean;
  seed: number;
}

/* ---- the effect ring --------------------------------------------------------------------------- */

/**
 * What the renderer needs to animate: strikes, request dots, claims and recoveries. A fixed ring,
 * so nothing is allocated and a renderer that is not drawing (offscreen) costs nothing: old
 * entries are simply overwritten. Each renderer keeps its own read cursor.
 */
export class FxRing {
  seq = 0;
  readonly kind = new Uint8Array(FX_CAP);
  readonly lane = new Uint8Array(FX_CAP);
  readonly a = new Int16Array(FX_CAP);
  readonly b = new Int16Array(FX_CAP);
  readonly c = new Int16Array(FX_CAP);
  readonly count = new Uint8Array(FX_CAP);
  /** For a strike: the hosts it took out, MAX_BLAST per entry. */
  readonly hosts = new Int16Array(FX_CAP * MAX_BLAST);

  push(kind: number, lane: number, a: number, b: number, c: number): number {
    const i = this.seq % FX_CAP;
    this.kind[i] = kind;
    this.lane[i] = lane;
    this.a[i] = a;
    this.b[i] = b;
    this.c[i] = c;
    this.count[i] = 0;
    this.seq++;
    return i;
  }
}

/* ---- one lane ---------------------------------------------------------------------------------- */

export class LaneState {
  readonly kind: LaneKind;
  readonly world: LaneWorld;
  readonly n: number;
  readonly alive: Uint8Array;
  /** Sim time a host died, -1 while it lives. */
  readonly deadAt: Float64Array;

  nSlots = 1;
  readonly slotHost = new Int16Array(MAX_SLOTS);
  readonly slotState = new Uint8Array(MAX_SLOTS);
  /** When the slot's current state ends. */
  readonly slotT = new Float64Array(MAX_SLOTS);
  /** When the current state began. */
  readonly slotT0 = new Float64Array(MAX_SLOTS);
  /** When the slot's host died. */
  readonly slotFail = new Float64Array(MAX_SLOTS);
  /** When a replacement will be claimed. */
  readonly slotClaim = new Float64Array(MAX_SLOTS);
  /** Real minutes this copy has been gone (Flux): the compressed waits count at full length. */
  readonly slotWaitMin = new Float64Array(MAX_SLOTS);
  /** The copy was started by the owner's hand (a redeploy), not by the network. */
  readonly slotManual = new Uint8Array(MAX_SLOTS);

  /* scratch, so choosing a host allocates nothing */
  readonly mark: Uint8Array;
  readonly taken: Uint8Array;
  readonly provCount: Uint8Array;
  readonly contCount: Uint8Array;
  readonly zoneCount: Uint8Array;
  readonly seen: Uint8Array;

  /* traffic */
  served = 0;
  retried = 0;
  failed = 0;
  reqAcc = 0;
  rr = 0;

  /* score */
  failures = 0;
  fellAtFailures = -1;
  fellAtT = -1;
  firstStrikeT = -1;

  /* status */
  status: number = STATUS.SERVING;
  downSince = 0;
  /** Real seconds the lane has been down in this outage (the compressed waits count at full length). */
  downReal = 0;
  /** The cloud lane's home region (an index into the world's countries). */
  home = 0;
  /** The last time a rebuild could not find a node. */
  starved = false;

  /* ui */
  /** The story so far, newest first. */
  readonly log: LogLine[] = [];
  logSeq = 0;
  narrT = -Infinity;
  readonly pending: string[] = [];
  pendingTone: number = LOG.INFO;
  uiVersion = 0;
  dirty = false;
  counterT = 0;
  downTickT = 0;

  constructor(kind: LaneKind, world: LaneWorld) {
    this.kind = kind;
    this.world = world;
    this.n = world.n;
    this.alive = new Uint8Array(world.n);
    this.deadAt = new Float64Array(world.n);
    this.mark = new Uint8Array(world.n);
    this.taken = new Uint8Array(world.n);
    this.provCount = new Uint8Array(world.providers.length + 1);
    this.contCount = new Uint8Array(world.continentCodes.length + 1);
    this.zoneCount = new Uint8Array(world.nSites + 1);
    this.seen = new Uint8Array(world.providers.length + 1);
  }

  /** Served and retried requests over all of them: what a visitor of the app would have felt. */
  get uptime(): number {
    const total = this.served + this.retried + this.failed;
    return total === 0 ? 1 : (this.served + this.retried) / total;
  }

  /** How many slots currently serve. */
  countState(state: number): number {
    let k = 0;
    for (let s = 0; s < this.nSlots; s++) if (this.slotState[s] === state) k++;
    return k;
  }

  /** True while this lane auto-heals (Flux, or the cloud configured for resilience). */
  get heals(): boolean {
    return this.kind === 'flux' || (this.kind === 'cloud' && this.nSlots > 1);
  }

  get needsOwner(): boolean {
    return this.countState(SLOT.OWNER) > 0;
  }
}

/* ---- the simulation ---------------------------------------------------------------------------- */

export class Sim {
  readonly lanes: [LaneState, LaneState];
  readonly fx = new FxRing();
  readonly blastBuf = new Int16Array(MAX_BLAST);

  t = 0;
  weapon: Weapon = 1;
  chaos = false;
  chaosT = 0;
  chaosAcc = 0;
  chaosWeapon: Weapon = 1;
  /** Request dots and strike effects are only worth recording while something draws them. */
  emitFx = true;
  /** Seconds of healthy traffic a fresh run plays before it hands over (reduced motion has no loop to do it). */
  prerollS = 0;
  /** What the pointer or the keyboard points at: the renderer draws the blast preview for it. */
  hover = { lane: -1, host: -1, kbd: false };
  /** Bumped when anything the page shows changes (lane versions are the finer-grained signal). */
  version = 0;
  cfg: SimConfig;
  run = 0;
  /** Which roll of the seed this run plays: 0 for a fresh scenario (so a shared link replays), +1 per reset. */
  private variant = 0;
  /** Total strikes of this run, by anyone (the visitor or chaos). */
  strikes = 0;
  private rng: () => number;
  private acc = 0;
  private listeners = new Set<() => void>();
  private notifyQueued = false;

  constructor(worlds: Worlds, cfg: SimConfig) {
    this.cfg = { ...cfg, copies: Math.min(MAX_SLOTS, Math.max(1, cfg.copies)) };
    this.lanes = [new LaneState('cloud', worlds.cloud), new LaneState('flux', worlds.flux)];
    this.rng = mulberry32(this.cfg.seed);
    this.resetLanes();
  }

  /* ---- subscriptions (React's useSyncExternalStore) ---------------------------------------- */

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    this.version++;
    for (const l of this.listeners) l();
  }

  /** Marks a change the page should show; the listeners hear about it once, at the end of the step. */
  private touch(L: LaneState): void {
    L.dirty = true;
    this.notifyQueued = true;
  }

  /** Something that is not a lane changed (the weapon, chaos). */
  touchSim(): void {
    this.notifyQueued = true;
    this.flushNotifications();
  }

  private flushNotifications(): void {
    for (const L of this.lanes) {
      if (L.dirty) {
        L.dirty = false;
        L.uiVersion++;
      }
    }
    if (this.notifyQueued) {
      this.notifyQueued = false;
      this.notify();
    }
  }

  /* ---- controls ------------------------------------------------------------------------------ */

  setWeapon(w: Weapon): void {
    if (this.weapon === w) return;
    this.weapon = w;
    this.touchSim();
  }

  setChaos(on: boolean): void {
    if (this.chaos === on) return;
    this.chaos = on;
    this.chaosT = 0;
    // The first strike comes quickly: a visitor who flips the switch wants to see something.
    this.chaosAcc = CHAOS_EVERY_S * 0.55;
    this.touchSim();
  }

  /** Changes the scenario and starts the run over (same world, new run). */
  configure(next: Partial<Omit<SimConfig, 'seed'>>): void {
    const cfg = { ...this.cfg, ...next };
    cfg.copies = Number.isFinite(cfg.copies) ? Math.min(MAX_SLOTS, Math.max(1, Math.round(cfg.copies))) : this.cfg.copies;
    const same = cfg.copies === this.cfg.copies && cfg.place === this.cfg.place && cfg.resilient === this.cfg.resilient;
    this.cfg = cfg;
    if (!same) this.reset(true);
  }

  /**
   * Starts a fresh run: everything alive, nothing struck, the counters at zero. A new scenario
   * (`fresh`) plays the seed's first roll, the same one a shared link shows; the reset button
   * rolls again, so the same map does not play out the same way twice.
   */
  reset(fresh = false): void {
    this.run++;
    this.variant = fresh ? 0 : this.variant + 1;
    this.rng = mulberry32((this.cfg.seed ^ Math.imul(this.variant, 0x9e3779b1)) >>> 0);
    this.t = 0;
    this.acc = 0;
    this.chaos = false;
    this.chaosT = 0;
    this.chaosAcc = 0;
    this.strikes = 0;
    this.resetLanes();
    if (this.prerollS > 0) this.advance(this.prerollS);
    for (const L of this.lanes) this.touch(L);
    this.touchSim();
    this.flushNotifications();
  }

  private resetLanes(): void {
    for (const L of this.lanes) this.initLane(L);
  }

  /* ---- the clock ---------------------------------------------------------------------------- */

  /** Runs the fixed steps that fit in `dt` seconds of wall time (the rest carries to the next frame). */
  frame(dt: number): void {
    this.acc += Math.min(MAX_FRAME_S, dt);
    while (this.acc >= STEP_S) {
      this.acc -= STEP_S;
      this.step(STEP_S);
    }
  }

  /** Jumps the sim clock forward (reduced motion: no loop, so time moves when the visitor says). */
  advance(seconds: number): void {
    const was = this.emitFx;
    this.emitFx = false;
    const n = Math.ceil(seconds / STEP_S);
    for (let i = 0; i < n; i++) this.step(STEP_S);
    this.emitFx = was;
  }

  step(dt: number): void {
    this.t += dt;
    const t = this.t;

    if (this.chaos) {
      this.chaosT += dt;
      this.chaosAcc += dt;
      if (this.chaosAcc >= CHAOS_EVERY_S) {
        this.chaosAcc -= CHAOS_EVERY_S;
        const level = Math.min(4, 1 + Math.floor(this.chaosT / CHAOS_CLIMB_EVERY_S));
        this.chaosWeapon = (1 + Math.floor(this.rng() * level)) as Weapon;
        this.fireRandom(this.chaosWeapon);
      }
    }

    for (let li = 0; li < this.lanes.length; li++) {
      const L = this.lanes[li]!;
      for (let s = 0; s < L.nSlots; s++) {
        const st = L.slotState[s]!;
        // The real time a lost Flux copy has been gone, on the same two clocks as the readout: the
        // waits and the install are compressed, the balancer's two good checks are not.
        if (L.kind === 'flux' && st !== SLOT.UP && st !== SLOT.EMPTY && st !== SLOT.OWNER) {
          L.slotWaitMin[s]! += st === SLOT.WARM ? dt / 60 : dt * MINUTES_PER_SIM_S;
        }
        if (st === SLOT.UNDETECTED) {
          if (t >= L.slotT[s]!) this.markDown(L, s);
        } else if (st === SLOT.WAIT) {
          if (t >= L.slotT[s]!) this.claim(li, L, s);
        } else if (st === SLOT.INSTALL) {
          if (t >= L.slotT[s]!) this.installed(li, L, s);
        } else if (st === SLOT.WARM) {
          if (t >= L.slotT[s]!) this.bringUp(li, L, s);
        }
      }

      L.reqAcc += REQUESTS_PER_S * dt;
      while (L.reqAcc >= 1) {
        L.reqAcc -= 1;
        this.dispatch(li, L);
      }

      if (L.status === STATUS.DOWN) {
        // The compressed waits stand for far more real time than they take on screen.
        let compressed = false;
        for (let s = 0; s < L.nSlots; s++) {
          const st = L.slotState[s];
          if (st === SLOT.UNDETECTED || st === SLOT.WAIT || st === SLOT.INSTALL) compressed = true;
        }
        L.downReal += compressed && L.kind === 'flux' ? dt * (MINUTES_PER_SIM_S * 60) : dt;
        if (t - L.downTickT >= 1) {
          L.downTickT = t;
          this.touch(L);
        }
      }
      if (t - L.counterT >= COUNTER_EVERY_S) {
        L.counterT = t;
        this.touch(L);
      }
      if (L.pending.length > 0 && t - L.narrT >= NARR_GAP_S) this.flushNarration(L);
    }

    this.flushNotifications();
  }

  /* ---- choosing hosts ------------------------------------------------------------------------ */

  /** Fills `out` with the hosts a weapon takes out when aimed at `host`. Returns how many. */
  blast(L: LaneState, weapon: Weapon, host: number, out: Int16Array): number {
    const w = L.world;
    let k = 0;
    if (host < 0 || host >= L.n) return 0;
    if (weapon === 1) {
      out[k++] = host;
    } else if (weapon === 2) {
      const s = w.site[host]!;
      for (let h = 0; h < L.n; h++) if (w.site[h] === s) out[k++] = h;
    } else if (weapon === 3) {
      const c = w.country[host]!;
      for (let h = 0; h < L.n; h++) if (w.country[h] === c) out[k++] = h;
    } else {
      const p = w.provider[host]!;
      for (let h = 0; h < L.n; h++) if (w.provider[h] === p) out[k++] = h;
    }
    return k;
  }

  /** A host the app lives on right now (alive, in a state that counts): where "fire at random" aims. */
  private randomAppHost(L: LaneState): number {
    let count = 0;
    for (let s = 0; s < L.nSlots; s++) if (this.occupies(L, s)) count++;
    if (count === 0) return -1;
    let k = Math.floor(this.rng() * count);
    for (let s = 0; s < L.nSlots; s++) {
      if (!this.occupies(L, s)) continue;
      if (k-- === 0) return L.slotHost[s]!;
    }
    return -1;
  }

  /** The slot holds a living host a strike could hit. */
  private occupies(L: LaneState, s: number): boolean {
    const st = L.slotState[s]!;
    const h = L.slotHost[s]!;
    return h >= 0 && L.alive[h] === 1 && (st === SLOT.UP || st === SLOT.WARM || st === SLOT.INSTALL);
  }

  /**
   * Picks the host for a Flux copy: alive, not already running one of this app's copies, with no more
   * than ceil(copies / providers) copies on one provider (FluxOS fault domains), and, when the
   * placement rule is "spread", on the continent that holds the fewest copies.
   */
  private pickFluxHost(L: LaneState, forSlot: number): number {
    const w = L.world;
    L.taken.fill(0);
    L.provCount.fill(0);
    L.contCount.fill(0);
    L.seen.fill(0);
    for (let s = 0; s < L.nSlots; s++) {
      if (s === forSlot) continue;
      const h = L.slotHost[s]!;
      if (h < 0 || !L.alive[h] || L.slotState[s] === SLOT.EMPTY) continue;
      L.taken[h] = 1;
      L.provCount[w.provider[h]!]!++;
      L.contCount[w.continent[h]!]!++;
    }
    let domains = 0;
    for (let h = 0; h < L.n; h++) {
      if (!L.alive[h]) continue;
      const p = w.provider[h]!;
      if (!L.seen[p]) {
        L.seen[p] = 1;
        domains++;
      }
    }
    const cap = Math.max(1, Math.ceil(L.nSlots / Math.max(1, domains)));
    const spread = this.cfg.place === 'spread';

    for (let pass = 0; pass < 2; pass++) {
      let minCont = 255;
      let count = 0;
      for (let h = 0; h < L.n; h++) {
        if (!L.alive[h] || L.taken[h]) continue;
        if (pass === 0 && L.provCount[w.provider[h]!]! >= cap) continue;
        count++;
        if (spread) minCont = Math.min(minCont, L.contCount[w.continent[h]!]!);
      }
      if (count === 0) continue;
      // Count again inside the continents that hold the fewest copies.
      let pool = 0;
      for (let h = 0; h < L.n; h++) {
        if (!L.alive[h] || L.taken[h]) continue;
        if (pass === 0 && L.provCount[w.provider[h]!]! >= cap) continue;
        if (spread && L.contCount[w.continent[h]!] !== minCont) continue;
        pool++;
      }
      let k = Math.floor(this.rng() * pool);
      for (let h = 0; h < L.n; h++) {
        if (!L.alive[h] || L.taken[h]) continue;
        if (pass === 0 && L.provCount[w.provider[h]!]! >= cap) continue;
        if (spread && L.contCount[w.continent[h]!] !== minCont) continue;
        if (k-- === 0) return h;
      }
    }
    return -1;
  }

  /** Cloud, configured for resilience: a machine in the home region, in the zone with the fewest copies. */
  private pickCloudHost(L: LaneState, forSlot: number): number {
    const w = L.world;
    L.taken.fill(0);
    L.zoneCount.fill(0);
    for (let s = 0; s < L.nSlots; s++) {
      if (s === forSlot) continue;
      const h = L.slotHost[s]!;
      if (h < 0 || !L.alive[h] || L.slotState[s] === SLOT.EMPTY) continue;
      L.taken[h] = 1;
      L.zoneCount[w.site[h]!]!++;
    }
    let minZone = 255;
    for (let h = 0; h < L.n; h++) {
      if (!L.alive[h] || L.taken[h] || w.country[h] !== L.home) continue;
      minZone = Math.min(minZone, L.zoneCount[w.site[h]!]!);
    }
    if (minZone === 255) return -1;
    let pool = 0;
    for (let h = 0; h < L.n; h++) {
      if (L.alive[h] && !L.taken[h] && w.country[h] === L.home && L.zoneCount[w.site[h]!] === minZone) pool++;
    }
    let k = Math.floor(this.rng() * pool);
    for (let h = 0; h < L.n; h++) {
      if (L.alive[h] && !L.taken[h] && w.country[h] === L.home && L.zoneCount[w.site[h]!] === minZone && k-- === 0) return h;
    }
    return -1;
  }

  /** Any living machine: where a redeploy by hand finds out whether anything is left to deploy onto. */
  private pickAnyHost(L: LaneState): number {
    let count = 0;
    for (let h = 0; h < L.n; h++) if (L.alive[h]) count++;
    if (count === 0) return -1;
    let k = Math.floor(this.rng() * count);
    for (let h = 0; h < L.n; h++) {
      if (L.alive[h] && k-- === 0) return h;
    }
    return -1;
  }

  /* ---- lane setup ---------------------------------------------------------------------------- */

  private initLane(L: LaneState): void {
    L.alive.fill(1);
    L.deadAt.fill(-1);
    L.slotHost.fill(-1);
    L.slotState.fill(SLOT.EMPTY);
    L.slotT.fill(0);
    L.slotT0.fill(0);
    L.slotFail.fill(0);
    L.slotClaim.fill(0);
    L.slotWaitMin.fill(0);
    L.slotManual.fill(0);
    L.served = 0;
    L.retried = 0;
    L.failed = 0;
    L.reqAcc = 0;
    L.rr = 0;
    L.failures = 0;
    L.fellAtFailures = -1;
    L.fellAtT = -1;
    L.firstStrikeT = -1;
    L.status = STATUS.SERVING;
    L.downSince = 0;
    L.downReal = 0;
    L.starved = false;
    L.log.length = 0;
    L.narrT = -Infinity;
    L.pending.length = 0;
    L.pendingTone = LOG.INFO;
    L.counterT = 0;
    L.downTickT = 0;

    if (L.kind === 'flux') {
      L.nSlots = this.cfg.copies;
      for (let s = 0; s < L.nSlots; s++) {
        const h = this.pickFluxHost(L, s);
        L.slotHost[s] = h;
        L.slotState[s] = h >= 0 ? SLOT.UP : SLOT.OWNER;
      }
    } else {
      L.home = Math.floor(this.rng() * Math.max(1, L.world.countryCodes.length));
      this.placeCloud(L, this.cfg.resilient ? 3 : 1);
    }
  }

  /** The traditional app in its home region: one server in the first data center, or one in each of three. */
  private placeCloud(L: LaneState, instances: number): void {
    const w = L.world;
    L.nSlots = instances;
    L.taken.fill(0);
    // The zones of the home region that still have a living machine, in order.
    const zones: number[] = [];
    for (let h = 0; h < L.n; h++) {
      if (L.alive[h] && w.country[h] === L.home && !zones.includes(w.site[h]!)) zones.push(w.site[h]!);
    }
    for (let s = 0; s < instances; s++) {
      const zone = zones.length > 0 ? zones[s % zones.length]! : -1;
      let count = 0;
      for (let h = 0; h < L.n; h++) if (L.alive[h] && !L.taken[h] && w.site[h] === zone) count++;
      let k = Math.floor(this.rng() * Math.max(1, count));
      let host = -1;
      for (let h = 0; h < L.n; h++) {
        if (L.alive[h] && !L.taken[h] && w.site[h] === zone && k-- === 0) {
          host = h;
          break;
        }
      }
      if (host >= 0) L.taken[host] = 1;
      L.slotHost[s] = host;
      L.slotState[s] = host >= 0 ? SLOT.UP : SLOT.OWNER;
    }
    for (let s = instances; s < MAX_SLOTS; s++) {
      L.slotHost[s] = -1;
      L.slotState[s] = SLOT.EMPTY;
    }
  }

  /* ---- failures ------------------------------------------------------------------------------ */

  /**
   * Fires the selected weapon at `host` in one lane: every host the weapon reaches goes offline.
   * Returns true when at least one living host was taken out.
   */
  fireAt(laneIdx: number, host: number, weapon: Weapon = this.weapon): boolean {
    const L = this.lanes[laneIdx];
    if (!L) return false;
    const count = this.blast(L, weapon, host, this.blastBuf);
    const t = this.t;
    let killed = 0;
    for (let i = 0; i < count; i++) {
      const h = this.blastBuf[i]!;
      if (!L.alive[h]) continue;
      L.alive[h] = 0;
      L.deadAt[h] = t;
      L.mark[h] = 1;
      killed++;
    }
    if (killed === 0) return false;
    this.strikes++;

    const slot = this.emitFx ? this.fx.push(FX.STRIKE, laneIdx, host, weapon, 0) : -1;
    if (slot >= 0) {
      let k = 0;
      for (let i = 0; i < count; i++) {
        const h = this.blastBuf[i]!;
        if (L.mark[h]) this.fx.hosts[slot * MAX_BLAST + k++] = h;
      }
      this.fx.count[slot] = killed;
    }

    let hit = 0;
    for (let s = 0; s < L.nSlots; s++) {
      const h = L.slotHost[s]!;
      const st = L.slotState[s]!;
      if (h < 0 || !L.mark[h]) continue;
      if (st === SLOT.UP || st === SLOT.WARM || st === SLOT.INSTALL) {
        this.lose(L, s, st);
        hit++;
      }
    }
    for (let i = 0; i < count; i++) L.mark[this.blastBuf[i]!] = 0;
    if (slot >= 0) this.fx.c[slot] = hit > 0 ? 1 : 0;

    if (hit > 0) {
      L.failures++;
      if (L.firstStrikeT < 0) L.firstStrikeT = t;
    }
    const label = this.describe(L, weapon, host);
    this.recompute(L);
    this.narrateStrike(L, label, killed, hit);
    this.touch(L);
    this.flushNotifications();
    return true;
  }

  /** One of this lane's copies lost its host: what happens next depends on the lane. */
  private lose(L: LaneState, s: number, was: number): void {
    const t = this.t;
    L.slotFail[s] = t;
    if (!L.heals) {
      // One instance, nothing to fail over to, nobody watching: the owner has to notice.
      L.slotState[s] = SLOT.OWNER;
      L.slotT[s] = Infinity;
      L.slotT0[s] = t;
      return;
    }
    if (was === SLOT.UP) {
      L.slotState[s] = SLOT.UNDETECTED;
      L.slotT0[s] = t;
      const markAt = t + DETECT_MIN_S + this.rng() * DETECT_SPAN_S;
      L.slotT[s] = markAt;
      // Real minutes this copy has been gone: counted up in step(), from zero at the loss.
      L.slotWaitMin[s] = 0;
      if (L.kind === 'flux') {
        // A sudden loss: the record lapses anywhere between the clean-shutdown figure and its full life.
        const waitMin = WAIT_MIN_MIN + this.rng() * (WAIT_MAX_MIN - WAIT_MIN_MIN);
        L.slotClaim[s] = Math.max(t + waitMin / MINUTES_PER_SIM_S, markAt + 0.9);
      } else {
        L.slotClaim[s] = Math.max(t + CLOUD_REPAIR_SIM_S - INSTALL_SIM_S, markAt + 0.5);
      }
    } else {
      // The copy was still being installed: it never served. Another node picks the work up soon.
      // (Its clock keeps running: the real time since the first loss is what the log reports.)
      L.slotState[s] = SLOT.WAIT;
      L.slotT0[s] = t;
      L.slotClaim[s] = t + 1 + this.rng() * 2;
      L.slotT[s] = L.slotClaim[s]!;
    }
  }

  /** The balancer takes a dead copy out of rotation. */
  private markDown(L: LaneState, s: number): void {
    const t = this.t;
    L.slotState[s] = SLOT.WAIT;
    L.slotT0[s] = t;
    L.slotT[s] = Math.max(L.slotClaim[s]!, t + 0.4);
    this.recompute(L);
    const up = L.countState(SLOT.UP);
    const gap = Math.round(t - L.slotFail[s]!);
    this.say(
      L,
      up > 0
        ? `Traffic rerouted to the other ${L.kind === 'flux' ? (up === 1 ? 'copy' : `${up} copies`) : up === 1 ? 'server' : `${up} servers`} after ${gap} s`
        : `Marked unhealthy after ${gap} s, with nothing left to route to`,
      up > 0 ? LOG.OK : LOG.LOSS,
    );
    if (L.kind === 'flux') this.say(L, 'The lost copy is rebuilt automatically', LOG.WORK);
    this.touch(L);
  }

  /** A node (or, in the cloud, the control plane) claims the missing copy. */
  private claim(laneIdx: number, L: LaneState, s: number): void {
    const t = this.t;
    const h = L.kind === 'flux' ? this.pickFluxHost(L, s) : this.pickCloudHost(L, s);
    if (h < 0) {
      if (L.kind === 'flux') {
        // Nothing eligible right now: try again soon.
        L.slotT[s] = t + 1;
        if (!L.starved) {
          L.starved = true;
          this.say(L, 'No node is left that could take the lost copy', LOG.LOSS);
          this.touch(L);
        }
      } else {
        // Automatic repair has nowhere to go: the region is gone, or every machine left already runs an instance.
        L.slotState[s] = SLOT.OWNER;
        L.slotT[s] = Infinity;
        let spare = false;
        for (let x = 0; x < L.n && !spare; x++) spare = L.alive[x] === 1 && L.world.country[x] === L.home;
        this.say(
          L,
          spare ? 'No spare server is left in the region to repair onto' : 'Every data center in the region is gone, so there is nothing to repair onto',
          LOG.LOSS,
        );
        this.touch(L);
      }
      return;
    }
    L.slotHost[s] = h;
    L.slotState[s] = SLOT.INSTALL;
    L.slotT0[s] = t;
    L.slotT[s] = t + INSTALL_SIM_S;
    if (this.emitFx) this.fx.push(FX.CLAIM, laneIdx, h, s, 0);
    const w = L.world;
    this.say(
      L,
      L.kind === 'flux'
        ? `A node in ${the(w.countryLabels[w.country[h]!]!)} picked up the lost copy and is installing it`
        : `A replacement server started in the ${w.countryLabels[w.country[h]!]}`,
      LOG.WORK,
    );
    this.touch(L);
  }

  private installed(laneIdx: number, L: LaneState, s: number): void {
    const t = this.t;
    if (L.kind === 'flux') {
      // Installed: the balancer sends traffic after two good checks.
      L.slotState[s] = SLOT.WARM;
      L.slotT0[s] = t;
      L.slotT[s] = t + WARM_MIN_S + this.rng() * WARM_SPAN_S;
      this.touch(L);
    } else {
      this.bringUp(laneIdx, L, s);
    }
  }

  private bringUp(laneIdx: number, L: LaneState, s: number): void {
    const t = this.t;
    L.slotState[s] = SLOT.UP;
    L.slotT0[s] = t;
    const h = L.slotHost[s]!;
    if (this.emitFx) this.fx.push(FX.UP, laneIdx, h, s, 0);
    this.recompute(L);
    const w = L.world;
    if (L.kind === 'flux') {
      const real = Math.max(1, Math.round(L.slotWaitMin[s]!));
      const prov = w.providers[w.provider[h]!];
      this.say(
        L,
        `Copy restored in ${the(w.countryLabels[w.country[h]!]!)}${prov?.real ? ` on ${prov.name}` : ''}, rebuilt in about ${approxMinutes(real)} of real time`,
        LOG.OK,
      );
    } else if (L.kind === 'cloud' && L.nSlots > 1 && !L.slotManual[s]) {
      this.say(L, 'Server replaced inside the region', LOG.OK);
    } else {
      this.say(L, 'Back online after a redeploy by hand', LOG.OK);
    }
    L.slotManual[s] = 0;
    this.touch(L);
  }

  /** The owner redeploys the traditional app by hand, after its server, data center, region or company is gone. */
  redeploy(laneIdx: number): boolean {
    const L = this.lanes[laneIdx];
    if (!L || L.kind === 'flux' || !L.needsOwner || L.status !== STATUS.DOWN) return false;
    const t = this.t;
    let h = this.pickAnyHost(L);
    if (h < 0) {
      // The whole company is gone: the owner signs up somewhere new, and the world comes back.
      L.alive.fill(1);
      L.deadAt.fill(-1);
      h = this.pickAnyHost(L);
      if (this.emitFx) this.fx.push(FX.REVIVE, laneIdx, h, 0, 0);
    }
    // Move the whole app to the region with the most living machines.
    let best = -1;
    let bestCount = -1;
    for (let c = 0; c < L.world.countryCodes.length; c++) {
      let k = 0;
      for (let x = 0; x < L.n; x++) if (L.alive[x] && L.world.country[x] === c) k++;
      if (k > bestCount) {
        best = c;
        bestCount = k;
      }
    }
    L.home = Math.max(0, best);
    this.placeCloud(L, L.nSlots);
    for (let s = 0; s < L.nSlots; s++) {
      if (L.slotHost[s]! < 0) continue;
      L.slotState[s] = SLOT.INSTALL;
      L.slotManual[s] = 1;
      L.slotT0[s] = t;
      L.slotT[s] = t + REDEPLOY_SIM_S;
      if (this.emitFx) this.fx.push(FX.CLAIM, laneIdx, L.slotHost[s]!, s, 0);
    }
    this.say(L, `Redeployed by hand to the ${L.world.countryLabels[L.home]}`, LOG.WORK);
    this.touch(L);
    this.flushNotifications();
    return true;
  }

  /** Fires at something that currently hosts the app, in every lane at once. */
  fireRandom(weapon: Weapon = this.weapon): void {
    for (let li = 0; li < this.lanes.length; li++) {
      const L = this.lanes[li]!;
      const h = this.randomAppHost(L);
      if (h >= 0) this.fireAt(li, h, weapon);
    }
  }

  /* ---- traffic ------------------------------------------------------------------------------- */

  private dispatch(laneIdx: number, L: LaneState): void {
    let outcome: number = OUTCOME.FAILED;
    let first = -1;
    let last = -1;

    if (L.heals) {
      let healthy = 0;
      for (let s = 0; s < L.nSlots; s++) {
        const st = L.slotState[s];
        if (st === SLOT.UP || st === SLOT.UNDETECTED) healthy++;
      }
      if (healthy > 0) {
        let tries = 0;
        while (tries < REQUEST_TRIES) {
          // The next copy the balancer believes in, round robin.
          let s = L.rr;
          for (let g = 0; g < L.nSlots; g++) {
            s = (s + 1) % L.nSlots;
            const st = L.slotState[s];
            // The first try may land on a copy that died but is not marked down yet (that is the retry
            // you see); the retries go to a copy that is up.
            if (st === SLOT.UP || (tries === 0 && st === SLOT.UNDETECTED)) break;
          }
          L.rr = s;
          tries++;
          if (L.slotState[s] === SLOT.UP) {
            outcome = tries > 1 ? OUTCOME.RETRIED : OUTCOME.SERVED;
            last = L.slotHost[s]!;
            break;
          }
          if (first < 0) first = L.slotHost[s]!;
        }
      } else {
        L.rr = (L.rr + 1) % L.nSlots;
        first = L.slotHost[L.rr]!;
      }
    } else if (L.slotState[0] === SLOT.UP) {
      outcome = OUTCOME.SERVED;
      last = L.slotHost[0]!;
    } else {
      first = L.slotHost[0]!;
    }

    if (outcome === OUTCOME.SERVED) L.served++;
    else if (outcome === OUTCOME.RETRIED) L.retried++;
    else L.failed++;
    if (this.emitFx) this.fx.push(FX.REQUEST, laneIdx, outcome, first, last);
  }

  /* ---- status and narration ------------------------------------------------------------------ */

  private recompute(L: LaneState): void {
    let up = 0;
    let und = 0;
    for (let s = 0; s < L.nSlots; s++) {
      const st = L.slotState[s];
      if (st === SLOT.UP) up++;
      else if (st === SLOT.UNDETECTED) und++;
    }
    const next = up === 0 ? STATUS.DOWN : und > 0 ? STATUS.FAILING : STATUS.SERVING;
    if (next === L.status) return;
    if (next === STATUS.DOWN) {
      L.downSince = this.t;
      L.downReal = 0;
      L.downTickT = this.t;
      if (L.fellAtFailures < 0 && L.failures > 0) {
        L.fellAtFailures = L.failures;
        L.fellAtT = this.t - L.firstStrikeT;
      }
    }
    L.status = next;
    this.touch(L);
  }

  private say(L: LaneState, msg: string, tone: number = LOG.INFO): void {
    if (L.pending[L.pending.length - 1] !== msg) L.pending.push(msg);
    if (tone > L.pendingTone) L.pendingTone = tone;
    this.touch(L);
  }

  /** The sentences said since the last beat become one line of the story. */
  private flushNarration(L: LaneState): void {
    // A beat is the last two things that happened, one per line.
    const said = L.pending.length > 2 ? L.pending.slice(-2) : L.pending;
    L.log.unshift({ id: ++L.logSeq, text: said.join('\n'), tone: L.pendingTone });
    if (L.log.length > LOG_CAP) L.log.length = LOG_CAP;
    L.pending.length = 0;
    L.pendingTone = LOG.INFO;
    L.narrT = this.t;
    this.touch(L);
  }

  /** What a blast aimed at `host` is called, as a phrase that can start a sentence. */
  describe(L: LaneState, weapon: Weapon, host: number): string {
    const w = L.world;
    const country = w.countryLabels[w.country[host]!] ?? '';
    const prov = w.providers[w.provider[host]!];
    if (L.kind === 'cloud') {
      if (weapon === 1) return `A server in the ${country}`;
      if (weapon === 2) return `A data center in the ${country}`;
      if (weapon === 3) return `The ${country}`;
      return 'The cloud company';
    }
    const named = prov?.real ? prov.name : '';
    if (weapon === 1) return named ? `A node on ${named} in ${the(country)}` : `A node in ${the(country)}`;
    if (weapon === 2) return named ? `${named}'s data center in ${the(country)}` : `A data center in ${the(country)}`;
    if (weapon === 3) return cap(the(country));
    return named || (prov?.kind === 'isp' ? `A home internet provider in ${the(country)}` : `A small provider in ${the(country)}`);
  }

  private narrateStrike(L: LaneState, label: string, killed: number, hit: number): void {
    const up = L.countState(SLOT.UP);
    const total = L.nSlots;
    const lost = killed === 1 ? '' : ` (${killed} ${L.kind === 'flux' ? 'nodes' : 'servers'})`;
    if (hit === 0) {
      this.say(L, `${label} went offline${lost}, the app was not running there`, LOG.INFO);
      return;
    }
    if (L.kind === 'flux' || L.nSlots > 1) {
      const unit = L.kind === 'flux' ? 'copies' : 'servers';
      if (up > 0) {
        this.say(L, `${label} went offline${lost}, ${up} of ${total} ${unit} still serving`, LOG.LOSS);
      } else if (L.kind === 'flux') {
        this.say(L, `${label} went offline${lost}, ${total === 1 ? 'the only copy is' : 'every copy is'} down while the network rebuilds`, LOG.LOSS);
      } else {
        this.say(L, `${label} went offline${lost}, no server is left serving`, LOG.LOSS);
      }
    } else {
      this.say(L, `${label} went offline${lost}, the app is down until redeployed by hand`, LOG.LOSS);
    }
  }
}

/** "United States" to "the United States", for the few country names that take an article. */
export function the(name: string): string {
  return /^(United |Netherlands|Philippines|Bahamas|Gambia|Czech Republic|Dominican|Central African|Congo)/.test(name) ? `the ${name}` : name;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 125 to "2 hours", 94 to "94 minutes", 110 to "2 hours": a rough figure for the narration. */
export function approxMinutes(min: number): string {
  if (min >= 100) {
    const h = Math.round((min / 60) * 2) / 2;
    return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  }
  const m = Math.max(1, Math.round(min));
  return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
}
