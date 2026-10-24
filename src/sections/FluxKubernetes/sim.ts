/**
 * The theater's simulation: a small, deterministic model of how Flux places and heals an app.
 * Pure TypeScript, no React, no timers: the hook feeds it fixed 50 ms steps while the stage is on screen.
 *
 * What it models (the facts live in model.ts, each with its source):
 *  - a registry every node can read; an app is a spec with a number of copies it wants
 *  - no scheduler: every node wakes on its own, sees the app is short of copies, picks it at random
 *    if it can host it, and claims it. First claims win, a node never takes an app already on its IP
 *  - a claimed copy installs, then announces itself with a location record that lives a long time
 *  - a load balancer checks every copy on a clock and drops one after two failed checks
 *  - a lost node's record lingers until it expires (the slow step, sped up here), then another node
 *    rebuilds the copy
 *
 * Randomness is seeded, so the same clicks replay the same theater.
 */
import { mulberry32 } from '@/lib/rng';
import {
  type Anchor,
  CHECK_FAILS,
  CHECK_SECONDS,
  DEFAULT_COPIES,
  INSTALL_TIME,
  ipGroupOf,
  LOCATION_TTL_MIN,
  MINUTES_PER_SECOND,
  NODE_COUNT,
  REQUEST_EVERY,
  SHOWN_MAX,
  STAGE_BLOCK_EVERY,
  WAKE_AGAIN,
  WAKE_FIRST,
  zoneOf,
} from './model';

export type NodeState = 'idle' | 'claim' | 'install' | 'run' | 'dead';
export type Serving = 'off' | 'starting' | 'ok' | 'retry' | 'down';

export interface SimNode {
  id: number;
  state: NodeState;
  /** Holds a copy: claimed, installing, running, or dead with its record still in the registry. */
  copy: boolean;
  /** In the load balancer's rotation. */
  inLb: boolean;
  /** Dead, but its location record is still in the registry. */
  stale: boolean;
  /** Seconds the install ring takes (drives the CSS animation). */
  installFor: number;
  /** A container crash and restart, shown for a moment. */
  crash: boolean;
  /** When the node took its copy, as a counter: keeps the registry's slots in a stable order. */
  order: number;
}

export type FxKind = 'ring' | 'packet' | 'peek' | 'ping' | 'fail' | 'trim' | 'drop' | 'wave';
export type FxTone = 'accent' | 'ok' | 'warn' | 'crit';

/** A one-shot visual. CSS animates it from its own attributes; the sim only decides when it exists. */
export interface Fx {
  id: number;
  kind: FxKind;
  from: Anchor;
  to?: Anchor;
  dur: number;
  delay: number;
  tone: FxTone;
}

export interface LogLine {
  id: number;
  text: string;
}

export interface Counts {
  /** Running on a healthy node. */
  live: number;
  /** Dead, record still in the registry. */
  stale: number;
  /** Claimed or installing. */
  pending: number;
  /** In the balancer's rotation and alive. */
  rotation: number;
}

export interface View {
  version: number;
  /** The spec has landed in a block: nodes can see it. */
  published: boolean;
  /** The spec is on its way (signed, paid, waiting for the next block). */
  pending: boolean;
  desired: number;
  zone: number | null;
  nodes: SimNode[];
  serving: Serving;
  fx: Fx[];
  blocks: number;
  specBlock: number;
  counts: Counts;
  log: LogLine[];
}

interface N extends SimNode {
  wake: number;
  checkAt: number;
  fails: number;
  ttlMin: number;
  claimUntil: number;
  installUntil: number;
  crashUntil: number;
  /** A lost node comes back online at this time (0: it has not been lost). */
  reviveAt: number;
}

const SEED = 0x5eed;
const STEP = 0.05;

export class Sim {
  private t = 0;
  private version = 0;
  private epoch = 0;
  private rand: () => number = mulberry32(SEED);
  private nodes: N[] = [];
  private fxList: { fx: Fx; until: number }[] = [];
  private fxId = 0;
  private logId = 0;
  private log: LogLine[] = [];

  private published = false;
  private desired = DEFAULT_COPIES;
  private zone: number | null = null;
  private specAt: number | null = null;
  private blocks = 7;
  private specBlock = 0;
  private blockTimer = 0;
  private reqTimer = 0;
  private rr = 0;
  private orderSeq = 0;
  private everServed = false;
  private serving: Serving = 'off';
  private trimAt: number | null = null;
  private rebuildActive = false;
  private demoCrash = false;
  private crashTimer = 0;
  private tickAcc = 0;

  constructor() {
    this.reset();
  }

  get stamp(): number {
    return this.version;
  }

  get isPublished(): boolean {
    return this.published || this.specAt !== null;
  }

  get copies(): number {
    return this.desired;
  }

  /** Adds a line to the event log (the text twin of the picture). */
  note(text: string): void {
    this.say(text);
    this.bump();
  }

  /* ---------------------------------------------------------------------------------------- */
  /* Commands                                                                                 */
  /* ---------------------------------------------------------------------------------------- */

  reset(zone: number | null = null): void {
    this.epoch++;
    this.rand = mulberry32(SEED + this.epoch * 7919);
    this.nodes = Array.from({ length: NODE_COUNT }, (_, id) => ({
      id,
      state: 'idle',
      copy: false,
      inLb: false,
      stale: false,
      installFor: 1.6,
      crash: false,
      order: 0,
      wake: 0,
      checkAt: 0,
      fails: 0,
      ttlMin: 0,
      claimUntil: 0,
      installUntil: 0,
      crashUntil: 0,
      reviveAt: 0,
    }));
    this.fxList = [];
    this.log = [];
    this.published = false;
    this.specAt = null;
    this.specBlock = 0;
    this.zone = zone;
    this.everServed = false;
    this.serving = 'off';
    this.trimAt = null;
    this.rebuildActive = false;
    this.rr = 0;
    this.orderSeq = 0;
    this.say('An illustrative network, no apps yet');
    this.bump();
  }

  /** The spec is signed and paid, then lands in the next block. Every node can read it from there. */
  publish(): void {
    if (this.published || this.specAt !== null) return;
    this.specAt = this.t + 1.05;
    this.blockTimer = 0;
    this.fx('drop', 'reg', undefined, 0.9, 0, 'accent');
    this.say('The spec is signed and paid, and on its way into the next block');
    this.bump();
  }

  setDesired(n: number): void {
    const next = Math.max(1, Math.min(SHOWN_MAX, Math.round(n)));
    if (next === this.desired) return;
    const grew = next > this.desired;
    this.desired = next;
    if (this.published) {
      this.say(`The spec now asks for ${next} ${next === 1 ? 'copy' : 'copies'}`);
      if (grew) this.wakeSoon();
      this.trimAt = null;
    }
    this.bump();
  }

  setZone(zone: number | null): void {
    const keep = this.desired;
    this.reset(zone);
    this.desired = keep;
    this.publish();
  }

  setDemoCrash(on: boolean): void {
    this.demoCrash = on;
    this.crashTimer = 1.4;
  }

  /** A hosting node goes dark with no warning. */
  loseNode(): void {
    const hosting = this.nodes.filter((n) => n.copy && n.state !== 'dead');
    const pool = hosting.length > 0 ? hosting : this.nodes.filter((n) => n.state === 'idle');
    const victim = pool[Math.floor(this.rand() * pool.length)];
    if (!victim) return;
    const hadRecord = victim.state === 'run';
    victim.state = 'dead';
    victim.fails = 0;
    victim.crash = false;
    if (hadRecord) {
      victim.stale = true;
      // The record was last announced some time ago: it lapses anywhere up to the full lifetime from now.
      victim.ttlMin = LOCATION_TTL_MIN * (0.22 + this.rand() * 0.78);
      this.rebuildActive = true;
    } else {
      victim.copy = false;
      victim.inLb = false;
      victim.reviveAt = this.t + 6;
    }
    this.fx('ring', victim.id, undefined, 1.2, 0, 'crit');
    this.say('A node went dark with no warning');
    this.recompute();
    this.bump();
  }

  /** Complete everything in flight: the end state of whatever was running. Used for macros and reduced motion. */
  settle(keepDead = false): void {
    if (this.specAt !== null) this.landSpec();
    if (!this.published) return;
    // Anything lost has been noticed, expired and replaced by the end of the story. A lost node then comes
    // back online, unless the caller wants the loss left on the stage.
    for (const n of this.nodes) {
      if (n.state !== 'dead') continue;
      n.stale = false;
      n.copy = false;
      n.inLb = false;
      n.reviveAt = 0;
      if (!keepDead) {
        n.state = 'idle';
        n.wake = this.t + this.between(WAKE_AGAIN);
      }
    }
    let guard = 0;
    while (this.known() < this.desired && guard++ < 80) {
      const pool = this.nodes.filter((n) => this.eligible(n));
      const pick = pool[Math.floor(this.rand() * pool.length)];
      if (!pick) break;
      pick.copy = true;
      pick.order = ++this.orderSeq;
      pick.state = 'run';
    }
    for (const n of this.nodes) {
      if (n.state === 'claim' || n.state === 'install') n.state = 'run';
      if (n.state === 'run') {
        n.inLb = true;
        n.fails = 0;
        n.checkAt = this.t + 0.4 + this.rand() * CHECK_SECONDS;
      }
    }
    this.trimSurplus(true);
    this.fxList = [];
    this.rebuildActive = false;
    this.recompute();
    this.say(this.summary());
    this.bump();
  }

  /* ---------------------------------------------------------------------------------------- */
  /* The clock                                                                                */
  /* ---------------------------------------------------------------------------------------- */

  step(dt: number = STEP): void {
    this.t += dt;
    const t = this.t;

    this.blockTimer += dt;
    if (this.blockTimer >= STAGE_BLOCK_EVERY) {
      this.blockTimer = 0;
      this.blocks++;
      this.bump();
    }

    if (this.specAt !== null && t >= this.specAt) this.landSpec();

    for (const n of this.nodes) {
      if (n.crash && t >= n.crashUntil) {
        n.crash = false;
        this.bump();
      }
      if (n.state === 'idle') {
        if (this.published && t >= n.wake) this.wakeNode(n);
      } else if (n.state === 'claim') {
        if (t >= n.claimUntil) {
          n.state = 'install';
          n.installUntil = t + n.installFor;
          this.bump();
        }
      } else if (n.state === 'install') {
        if (t >= n.installUntil) this.announce(n);
      } else if (n.state === 'dead' && !n.copy && n.reviveAt > 0 && t >= n.reviveAt) {
        this.revive(n);
      } else if (n.copy && t >= n.checkAt) {
        this.checkNode(n);
      }
      if (n.stale) {
        n.ttlMin -= dt * MINUTES_PER_SECOND;
        if (n.ttlMin <= 0) this.expire(n);
      }
    }

    if (this.published) {
      this.reqTimer += dt;
      if (this.reqTimer >= REQUEST_EVERY) {
        this.reqTimer = 0;
        this.request();
      }
      this.watchSurplus();
      if (this.demoCrash) this.crashDemo(dt);
    }

    this.tickAcc += dt;
    if (this.tickAcc >= 0.2) {
      this.tickAcc = 0;
      if (this.nodes.some((n) => n.stale)) this.bump();
    }
  }

  /* ---------------------------------------------------------------------------------------- */
  /* Nodes                                                                                    */
  /* ---------------------------------------------------------------------------------------- */

  private landSpec(): void {
    this.specAt = null;
    this.published = true;
    this.blocks++;
    this.specBlock = this.blocks;
    this.blockTimer = 0;
    this.fx('ring', 'reg', undefined, 1.3, 0, 'accent');
    this.fx('wave', 'reg', undefined, 1.1, 0, 'accent');
    this.say('The block lands, and every node reads the same registry');
    this.wakeSoon(WAKE_FIRST);
    this.bump();
  }

  private wakeSoon(range: readonly [number, number] = [0.2, 1.2]): void {
    for (const n of this.nodes) {
      if (n.state === 'idle') n.wake = Math.min(n.wake || Infinity, this.t + this.between(range));
    }
  }

  /** Each node runs the same loop on its own clock: look, check, maybe claim. Nobody assigns anything. */
  private wakeNode(n: N): void {
    if (this.known() >= this.desired) {
      n.wake = this.t + this.between(WAKE_AGAIN);
      return;
    }
    if (this.fxList.length < 42) this.fx('peek', 'reg', n.id, 0.42, 0, 'accent');
    if (!this.eligible(n)) {
      n.wake = this.t + this.between(WAKE_AGAIN);
      return;
    }
    n.state = 'claim';
    n.copy = true;
    n.order = ++this.orderSeq;
    n.claimUntil = this.t + 0.42;
    n.installFor = this.between(INSTALL_TIME);
    this.fx('ring', n.id, undefined, 1.25, 0, 'accent');
    this.say('A node picked the app up on its own');
    this.recompute();
    this.bump();
  }

  private announce(n: N): void {
    n.state = 'run';
    n.stale = false;
    n.inLb = false;
    n.fails = 0;
    n.checkAt = this.t + 0.5 + this.rand() * 0.7;
    this.fx('ring', n.id, undefined, 1.1, 0, 'ok');
    this.fx('packet', n.id, 'reg', 0.55, 0, 'ok');
    const live = this.countRunning();
    this.say(`A node announced its copy: ${live} of ${this.desired} running`);
    this.recompute();
    this.bump();
  }

  private expire(n: N): void {
    n.stale = false;
    n.copy = false;
    n.inLb = false;
    n.reviveAt = this.t + 5;
    this.fx('ring', 'reg', undefined, 1.2, 0, 'warn');
    this.say('The lost copy’s record lapsed (sped up here), so another node picks the copy up');
    this.wakeSoon([0.1, 0.9]);
    this.bump();
  }

  /** A lost node is repaired and comes back online, idle, ready to take work again. */
  private revive(n: N): void {
    n.state = 'idle';
    n.reviveAt = 0;
    n.crash = false;
    n.wake = this.t + this.between(WAKE_AGAIN);
    this.fx('ring', n.id, undefined, 1.0, 0, 'ok');
    this.bump();
  }

  private checkNode(n: N): void {
    n.checkAt += CHECK_SECONDS;
    if (n.state === 'run') {
      this.fx('ping', n.id, undefined, 0.8, 0, 'ok');
      if (!n.inLb) {
        n.inLb = true;
        this.say('A node passes its check and joins the rotation');
        this.recompute();
        this.bump();
      }
      return;
    }
    if (n.state === 'dead' && n.inLb) {
      this.fx('fail', n.id, undefined, 0.8, 0, 'crit');
      n.fails++;
      if (n.fails >= CHECK_FAILS) {
        n.inLb = false;
        this.say('Traffic moved off the lost node within seconds');
        this.recompute();
      }
      this.bump();
    }
  }

  private crashDemo(dt: number): void {
    this.crashTimer -= dt;
    if (this.crashTimer > 0) return;
    this.crashTimer = 4.2;
    const pool = this.nodes.filter((n) => n.state === 'run' && !n.crash);
    const pick = pool[Math.floor(this.rand() * pool.length)];
    if (!pick) return;
    pick.crash = true;
    pick.crashUntil = this.t + 1.5;
    this.fx('fail', pick.id, undefined, 0.8, 0, 'warn');
    this.say('A container crashed and its node restarted it at once');
    this.bump();
  }

  /* ---------------------------------------------------------------------------------------- */
  /* Surplus and traffic                                                                      */
  /* ---------------------------------------------------------------------------------------- */

  private watchSurplus(): void {
    const surplus = this.known() - this.desired;
    if (surplus <= 0) {
      this.trimAt = null;
      return;
    }
    if (this.trimAt === null) this.trimAt = this.t + 1.3;
    else if (this.t >= this.trimAt) {
      this.trimSurplus(false);
      this.trimAt = null;
    }
  }

  private trimSurplus(all: boolean): void {
    let guard = 0;
    while (this.known() > this.desired && guard++ < 40) {
      const pool = this.nodes.filter((n) => n.state === 'run' || n.state === 'install' || n.state === 'claim');
      const pick = pool[Math.floor(this.rand() * pool.length)];
      if (!pick) return;
      pick.state = 'idle';
      pick.copy = false;
      pick.inLb = false;
      pick.wake = this.t + this.between(WAKE_AGAIN);
      if (!all) {
        this.fx('trim', pick.id, undefined, 0.9, 0, 'warn');
        this.say('A surplus copy is removed');
        this.recompute();
        this.bump();
        return;
      }
    }
  }

  private request(): void {
    const rotation = this.nodes.filter((n) => n.copy && n.inLb);
    if (rotation.length === 0) {
      if (this.everServed) {
        this.serving = 'down';
        this.fx('packet', 'users', 'fdm', 0.26, 0, 'crit');
        this.fx('fail', 'fdm', undefined, 0.7, 0.26, 'crit');
        this.bump();
      }
      return;
    }
    const pick = rotation[this.rr++ % rotation.length];
    if (!pick) return;
    this.fx('packet', 'users', 'fdm', 0.24, 0, 'accent');
    if (pick.state === 'run') {
      this.fx('packet', 'fdm', pick.id, 0.42, 0.24, 'accent');
      this.bump();
      return;
    }
    // The copy is dead but the balancer has not noticed yet: the attempt fails and is retried elsewhere.
    this.fx('packet', 'fdm', pick.id, 0.42, 0.24, 'crit');
    this.fx('fail', pick.id, undefined, 0.7, 0.66, 'crit');
    const other = rotation.filter((n) => n.state === 'run');
    const alt = other[this.rr % Math.max(1, other.length)];
    if (alt) this.fx('packet', 'fdm', alt.id, 0.42, 0.78, 'warn');
    this.bump();
  }

  /* ---------------------------------------------------------------------------------------- */
  /* Helpers                                                                                  */
  /* ---------------------------------------------------------------------------------------- */

  private known(): number {
    let k = 0;
    for (const n of this.nodes) if (n.copy) k++;
    return k;
  }

  private countRunning(): number {
    let k = 0;
    for (const n of this.nodes) if (n.state === 'run') k++;
    return k;
  }

  private eligible(n: N): boolean {
    if (n.state !== 'idle' || n.copy) return false;
    if (this.zone !== null && zoneOf(n.id) !== this.zone) return false;
    const g = ipGroupOf(n.id);
    return !this.nodes.some((o) => o.copy && o.id !== n.id && ipGroupOf(o.id) === g);
  }

  private between(range: readonly [number, number]): number {
    return range[0] + this.rand() * (range[1] - range[0]);
  }

  private recompute(): void {
    if (!this.published) {
      this.serving = 'off';
      return;
    }
    const rotation = this.nodes.filter((n) => n.copy && n.inLb);
    const alive = rotation.filter((n) => n.state === 'run');
    if (rotation.length === 0) this.serving = this.everServed ? 'down' : 'starting';
    else if (alive.length === 0) this.serving = 'down';
    else {
      this.everServed = true;
      this.serving = rotation.some((n) => n.state === 'dead') ? 'retry' : 'ok';
    }
    if (this.rebuildActive && !this.nodes.some((n) => n.stale)) {
      const running = this.nodes.filter((n) => n.state === 'run');
      if (running.length >= this.desired && running.every((n) => n.inLb)) {
        this.rebuildActive = false;
        this.say(`The replacement is serving: ${running.length} of ${this.desired} copies running`);
      }
    }
  }

  private summary(): string {
    const live = this.countRunning();
    return `${live} of ${this.desired} ${this.desired === 1 ? 'copy' : 'copies'} running`;
  }

  private fx(kind: FxKind, from: Anchor, to: Anchor | undefined, dur: number, delay: number, tone: FxTone): void {
    const fx: Fx = { id: ++this.fxId, kind, from, to, dur, delay, tone };
    this.fxList.push({ fx, until: this.t + delay + dur + 0.1 });
  }

  private say(text: string): void {
    this.log.unshift({ id: ++this.logId, text });
    if (this.log.length > 14) this.log.length = 14;
  }

  private bump(): void {
    this.version++;
  }

  /* ---------------------------------------------------------------------------------------- */
  /* Reading                                                                                  */
  /* ---------------------------------------------------------------------------------------- */

  view(): View {
    this.fxList = this.fxList.filter((f) => f.until > this.t);
    const counts: Counts = { live: 0, stale: 0, pending: 0, rotation: 0 };
    for (const n of this.nodes) {
      if (n.state === 'run') counts.live++;
      if (n.stale) counts.stale++;
      if (n.state === 'claim' || n.state === 'install') counts.pending++;
      if (n.state === 'run' && n.inLb) counts.rotation++;
    }
    return {
      version: this.version,
      published: this.published,
      pending: this.specAt !== null,
      desired: this.desired,
      zone: this.zone,
      nodes: this.nodes.map((n) => ({
        id: n.id,
        state: n.state,
        copy: n.copy,
        inLb: n.inLb,
        stale: n.stale,
        installFor: n.installFor,
        crash: n.crash,
        order: n.order,
      })),
      serving: this.serving,
      fx: this.fxList.map((f) => f.fx),
      blocks: this.blocks,
      specBlock: this.specBlock,
      counts,
      log: [...this.log],
    };
  }
}
