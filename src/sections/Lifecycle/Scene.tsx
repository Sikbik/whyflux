import { type CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { CHAIN } from '@/lib/live';
import { mulberry32 } from '@/lib/rng';
import { MicroScene } from './MicroScene';
import { cameraTransform, CROPS, type OnRampId, SAMPLE_APP, SAMPLE_HOST, SCENE_H, SCENE_W } from './model';
import css from './Scene.module.css';

/* ------------------------------------------------------------------------------------------------
 * One picture and one number. The whole scene is a function of story time `--t` (0 to 10: the integer
 * part is the step, the fraction is how far through it). Nothing here is time-based: every element is a
 * window on `--t`, so scrolling back reverses the story exactly. It is drawn flat: solid fills, crisp
 * lines, no glow, no gradient, no boxes around things.
 *
 *   w(a, b)          an element eases in over t = a..b          (classes k, fade)
 *   w2(a, b, c, d)   ...and eases out over c..d                 (classes k, k2, fio)
 *   mv(...)          a packet travels from p to q over a..b     (classes k, mv)
 * ---------------------------------------------------------------------------------------------- */

interface Pt {
  x: number;
  y: number;
}

const w = (a: number, b: number): CSSProperties => ({ '--a': a, '--b': b }) as CSSProperties;
const w2 = (a: number, b: number, c: number, d: number): CSSProperties => ({ '--a': a, '--b': b, '--c': c, '--d': d }) as CSSProperties;
const mv = (a: number, b: number, p: Pt, q: Pt, extra?: CSSProperties): CSSProperties =>
  ({ '--a': a, '--b': b, '--x1': `${p.x}px`, '--y1': `${p.y}px`, '--x2': `${q.x}px`, '--y2': `${q.y}px`, ...extra }) as CSSProperties;

const K = css.k;
const K2 = css.k2;

const hexCache = new Map<number, string>();
function hex(r: number): string {
  const hit = hexCache.get(r);
  if (hit) return hit;
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`);
  }
  const out = pts.join(' ');
  hexCache.set(r, out);
  return out;
}

/* ---- geometry ----------------------------------------------------------------------------------- */

const APP: Pt = { x: 170, y: 372 };
const SEAL: Pt = { x: 170, y: 482 };
const BLOCK: Pt = { x: 440, y: 232 };
const REG: Pt = { x: 440, y: 424 };
const LB: Pt = { x: 986, y: 296 };
const FIRST_USER: Pt = { x: 1030, y: 372 };
const USERS: Pt[] = [FIRST_USER, { x: 1090, y: 372 }, { x: 1150, y: 372 }];

const R = 17;
const ROWS = [
  { y: 150, n: 6, x0: 594 },
  { y: 232, n: 5, x0: 624 },
  { y: 314, n: 6, x0: 594 },
  { y: 396, n: 5, x0: 624 },
];
const jitter = mulberry32(31);
const NODES: Pt[] = ROWS.flatMap((row) =>
  Array.from({ length: row.n }, (_, c) => ({ x: row.x0 + c * 60 + (jitter() - 0.5) * 8, y: row.y + (jitter() - 0.5) * 8 })),
);

/** The nodes that take the app, the one that dies, and the one that replaces it. */
const COPIES = [2, 9, 16] as const;
const VICTIM = 1;
const REPLACEMENT = 19;
const CLAIM_AT = [4.4, 4.54, 4.7] as const;
const PEEK_AT = NODES.map(() => 4.04 + jitter() * 0.5);

const p = (i: number): Pt => NODES[i] ?? { x: 0, y: 0 };
const copy = (i: number): Pt => p(COPIES[i] ?? 0);

/** Requests: a packet from a user to the balancer, then to a copy. Which copies are alive depends on the time. */
interface Req {
  s: number;
  user: Pt;
  to: Pt;
}

function requests(): Req[] {
  const out: Req[] = [];
  let n = 0;
  for (let s = 7.72; s < 9.9; s += 0.105) {
    const user = USERS[n % USERS.length] ?? FIRST_USER;
    let pool: Pt[];
    if (s < 8.12) pool = [copy(0), copy(1), copy(2)];
    else if (s < 9.0) pool = [copy(0), copy(2)];
    else pool = [copy(0), p(REPLACEMENT), copy(2)];
    const to = pool[n % pool.length] ?? copy(0);
    out.push({ s, user, to });
    n++;
  }
  return out;
}
const REQS = requests();

/** What step two ticks off, in one word each: the data's validation of image, size, ports, placement and price. */
const CHECKS = ['Image', 'Size', 'Ports', 'Placement', 'Price'] as const;

/* ---- pieces ------------------------------------------------------------------------------------- */

/** The app: a hexagon cut into three flat faces, a container seen corner-on. */
function Crystal({ r }: { r: number }) {
  const h = r * 0.866;
  const half = r / 2;
  return (
    <g className={css.crystal}>
      <polygon className={css.faceTop} points={`0,${-r} ${h},${-half} 0,0 ${-h},${-half}`} />
      <polygon className={css.faceLeft} points={`${-h},${-half} 0,0 0,${r} ${-h},${half}`} />
      <polygon className={css.faceRight} points={`0,0 ${h},${-half} ${h},${half} 0,${r}`} />
    </g>
  );
}

function You({ on }: { on: OnRampId | null }) {
  return (
    <g>
      <foreignObject x={36} y={64} width={304} height={250} className={css.fo}>
        {/* The micro-scene inside runs on its own number (the first 0.74 of the story clock, already under way at 0). */}
        <div className={cn(K, K2, css.fio, css.foBox)} style={w2(-0.1, 0, 2.1, 2.5)} data-win="-0.1 0.74">
          <MicroScene
            kind={on ?? 'neutral'}
            scrub
            style={{ '--mp': 'clamp(0, calc((var(--t) + 0.1) / 0.84), 1)' } as CSSProperties}
          />
        </div>
      </foreignObject>

      <g transform={`translate(${APP.x} ${APP.y})`}>
        <g className={cn(K, K2, css.pop)} style={w2(0.62, 0.96, 4.0, 4.6)}>
          <Crystal r={44} />
        </g>
      </g>

      {/* Step 3: signed with your Flux ID. */}
      <g transform={`translate(${SEAL.x} ${SEAL.y})`} className={cn(K, K2, css.fio)} style={w2(2.1, 2.4, 4.0, 4.6)}>
        <polygon className={css.seal} points={hex(17)} />
        <path className={cn(K, css.sign)} d="M-6 1 L-2 5 L7 -5" pathLength={1} style={w(2.3, 2.75)} />
      </g>

      {/* ...and the word goes out, in hexagons. */}
      <g transform={`translate(${APP.x} ${APP.y})`}>
        {[0, 1, 2].map((i) => (
          <polygon key={i} className={cn(K, css.ripple)} points={hex(20)} style={w(2.4 + i * 0.12, 2.95 + i * 0.12)} />
        ))}
      </g>
    </g>
  );
}

function Chain() {
  const older = [286, 340];
  return (
    <g>
      {/* Step 2: any node checks the spec, one word at a time. */}
      <line className={cn(K, K2, css.draw, css.beam)} x1={APP.x + 40} y1={APP.y - 30} x2={376} y2={150} pathLength={1} style={w2(1.0, 1.3, 1.9, 2.1)} />
      <g className={cn(K, K2, css.fio)} style={w2(1.0, 1.2, 2.05, 2.3)}>
        {CHECKS.map((label, i) => (
          <g key={label} className={cn(K, css.fade)} style={w(1.25 + i * 0.13, 1.35 + i * 0.13)} transform={`translate(392 ${116 + i * 30})`}>
            <path className={css.checkTick} d="M0 0 L4.5 4.5 L12 -5.5" />
            <text className={css.checkText} x={26} y={5}>
              {label}
            </text>
          </g>
        ))}
      </g>

      {/* Step 4: payment, then the next block. */}
      <g transform="translate(440 118)" className={cn(K, K2, css.fio)} style={w2(3.0, 3.15, 3.9, 4.0)}>
        <circle className={css.ringBg} r={34} />
        <circle className={cn(K, css.ringFill)} r={34} pathLength={1} transform="rotate(-90)" style={w(3.1, 3.88)} />
        <text className={css.ringText} y={7} textAnchor="middle">
          {`${CHAIN.blockSeconds} s`}
        </text>
      </g>

      <line className={cn(K, K2, css.draw, css.beam)} x1={APP.x + 52} y1={APP.y - 6} x2={BLOCK.x - 22} y2={BLOCK.y} pathLength={1} style={w2(3.0, 3.5, 3.55, 3.75)} />
      <polygon
        className={cn(K, css.packetCoin, css.mv)}
        points={hex(8)}
        style={mv(3.0, 3.55, { x: APP.x + 52, y: APP.y - 6 }, { x: BLOCK.x - 22, y: BLOCK.y })}
      />

      <g className={cn(K, css.fade)} style={w(0.95, 1.4)}>
        {older.map((y) => (
          <g key={y} transform={`translate(440 ${y})`}>
            <line className={css.link} x1={0} y1={-34} x2={0} y2={-20} />
            <polygon className={css.block} points={hex(20)} />
            <path className={css.blockMark} d="M-6 -2 H6 M-6 4 H2" />
          </g>
        ))}
        <line className={css.link} x1={BLOCK.x} y1={BLOCK.y + 20} x2={BLOCK.x} y2={BLOCK.y + 34} />
      </g>
      <g transform={`translate(${BLOCK.x} ${BLOCK.y})`}>
        <polygon className={cn(K, K2, css.fio, css.blockPending)} points={hex(20)} style={w2(3.0, 3.2, 3.85, 3.95)} />
        <g className={cn(K, css.fade)} style={w(3.85, 4.0)}>
          <polygon className={css.blockSpec} points={hex(20)} />
          <path className={css.blockMarkHot} d="M-6 -2 H6 M-6 4 H2" />
        </g>
      </g>

      {/* The registry: the app, and a pip for every copy that has announced itself. */}
      <line className={cn(K, css.fade, css.link)} x1={440} y1={366} x2={440} y2={REG.y - 22} style={w(3.8, 4.05)} />
      <g transform={`translate(${REG.x} ${REG.y})`} className={cn(K, css.fade)} style={w(3.9, 4.05)}>
        <Crystal r={14} />
        <text className={css.regName} y={40} textAnchor="middle">
          {SAMPLE_APP}
        </text>
      </g>
      <g transform={`translate(${REG.x - 22} ${REG.y + 62})`}>
        {COPIES.map((_, i) => {
          const isVictim = i === VICTIM;
          return (
            <g key={i} transform={`translate(${i * 22} 0)`}>
              <polygon className={cn(K, css.pipEmpty, css.fade)} points={hex(7)} style={w(3.9, 4.05)} />
              <polygon
                className={cn(K, K2, css.fio, css.pipLive)}
                points={hex(7)}
                style={w2(6.65 + i * 0.05, 6.8 + i * 0.05, isVictim ? 8.12 : 11, isVictim ? 8.18 : 12)}
              />
              {isVictim ? (
                <>
                  <polygon className={cn(K, K2, css.fio, css.pipStale)} points={hex(7)} style={w2(8.12, 8.2, 8.88, 8.94)} />
                  <polygon className={cn(K, css.fade, css.pipLive)} points={hex(7)} style={w(8.97, 9.02)} />
                </>
              ) : null}
            </g>
          );
        })}
      </g>

      {/* Records travel up from the copies. */}
      {COPIES.map((_, i) => (
        <circle key={i} className={cn(K, css.packet, css.mv)} r={3} style={mv(6.2 + i * 0.05, 6.7 + i * 0.05, copy(i), { x: REG.x + 12, y: REG.y })} />
      ))}
      <circle className={cn(K, css.packet, css.mv)} r={3} style={mv(8.95, 9.0, p(REPLACEMENT), { x: REG.x + 12, y: REG.y })} />
    </g>
  );
}

function Field() {
  return (
    <g>
      {/* Step 4 ends with every node reading the same block. */}
      <g className={cn(K, K2, css.fio)} style={w2(3.82, 4.1, 4.25, 4.55)}>
        {NODES.map((n, i) => (
          <line key={i} className={cn(K, css.draw, css.read)} x1={BLOCK.x + 20} y1={BLOCK.y} x2={n.x} y2={n.y} pathLength={1} style={w(3.82, 4.1)} />
        ))}
      </g>

      {/* Step 6 ends with the copies keeping step with each other. */}
      <g className={cn(K, K2, css.fio)} style={w2(5.7, 5.95, 8.0, 8.1)}>
        {[0, 1, 2].map((i) => {
          const a = copy(i);
          const b = copy((i + 1) % 3);
          return <line key={i} className={css.sync} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </g>

      <g className={cn(K, css.fade)} style={w(2.8, 3.4)}>
        {NODES.map((n, i) => {
          const ci = COPIES.indexOf(i as (typeof COPIES)[number]);
          const isCopy = ci >= 0;
          const isRep = i === REPLACEMENT;
          const isVictim = ci === VICTIM;
          const claim = isCopy ? (CLAIM_AT[ci] ?? 4.5) : isRep ? 8.72 : 0;
          const install = isCopy ? 5.05 + ci * 0.05 : 8.76;
          const installEnd = isRep ? 8.9 : install + 0.78;
          const installOut: [number, number] = isRep ? [8.91, 8.99] : [install + 0.8, install + 0.9];
          const runAt = isCopy ? 6.0 + ci * 0.03 : 8.92;
          const peek = isRep ? 8.6 : (PEEK_AT[i] ?? 4.2);
          const plain = !isCopy && !isRep;
          return (
            <g key={i} transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`} className={cn(plain && K, plain && css.fadeDim)} style={plain ? w(9.1, 9.5) : undefined}>
              <polygon className={css.nodeBase} points={hex(R)} />
              <circle className={css.nodeCore} r={2.6} />
              <polygon className={cn(K, css.peek)} points={hex(R)} style={w(peek, peek + 0.12)} />
              {isCopy || isRep ? (
                <>
                  <polygon className={cn(K, K2, css.fio, css.claim)} points={hex(R)} style={w2(claim, claim + 0.04, claim + 0.1, claim + 0.2)} />
                  <polygon className={cn(K, K2, css.fio, css.taken)} points={hex(R)} style={w2(claim + 0.1, claim + 0.22, runAt, runAt + 0.1)} />
                  <polygon className={cn(K, K2, css.fio, css.install)} points={hex(R + 5)} pathLength={1} style={w2(install, installEnd, installOut[0], installOut[1])} />
                  <g className={cn(K, isVictim ? K2 : false, isVictim ? css.fio : css.fade)} style={isVictim ? w2(runAt, runAt + 0.12, 8.1, 8.14) : w(runAt, runAt + 0.12)}>
                    <polygon className={css.run} points={hex(R)} />
                  </g>
                  {isVictim ? (
                    <g className={cn(K, K2, css.fio)} style={w2(8.1, 8.3, 9.0, 9.4)}>
                      <polygon className={css.deadBody} points={hex(R)} />
                      <path className={css.deadCross} d="M-6 -6 L6 6 M6 -6 L-6 6" />
                    </g>
                  ) : null}
                  <g className={cn(K, isVictim ? K2 : false, isVictim ? css.fio : css.fade)} style={isVictim ? w2(install + 0.03, install + 0.15, 8.12, 8.2) : w(install + 0.03, install + 0.15)}>
                    <Crystal r={9} />
                  </g>
                </>
              ) : null}
            </g>
          );
        })}
      </g>
    </g>
  );
}

function Routes() {
  return (
    <g>
      {/* Step 8: the balancer, its routes, the users. */}
      <g className={cn(K, css.fade)} style={w(7.0, 7.25)}>
        <polygon className={css.lbBody} points={hex(20)} transform={`translate(${LB.x} ${LB.y})`} />
        <path className={css.lbGlyph} transform={`translate(${LB.x} ${LB.y})`} d="M-9 0 H-2 M-2 0 L7 -7 M-2 0 H7 M-2 0 L7 7" />
      </g>

      {COPIES.map((_, i) => {
        const isVictim = i === VICTIM;
        const a = 7.2 + i * 0.08;
        return (
          <g key={i}>
            <line
              className={cn(K, isVictim ? K2 : false, css.draw, css.route)}
              x1={LB.x - 20}
              y1={LB.y}
              x2={copy(i).x + 15}
              y2={copy(i).y}
              pathLength={1}
              style={isVictim ? w2(a, a + 0.3, 8.1, 8.14) : w(a, a + 0.3)}
            />
            {isVictim ? (
              <line
                className={cn(K, K2, css.fio, css.routeDead)}
                x1={LB.x - 20}
                y1={LB.y}
                x2={copy(i).x + 15}
                y2={copy(i).y}
                style={w2(8.1, 8.14, 8.38, 8.46)}
              />
            ) : null}
          </g>
        );
      })}
      <line
        className={cn(K, css.draw, css.route)}
        x1={LB.x - 20}
        y1={LB.y}
        x2={p(REPLACEMENT).x + 15}
        y2={p(REPLACEMENT).y - 6}
        pathLength={1}
        style={w(8.92, 9.0)}
      />

      <g className={cn(K, css.fade)} style={w(7.0, 7.3)}>
        {USERS.map((u, i) => (
          <g key={i} transform={`translate(${u.x} ${u.y})`}>
            <circle className={css.userHead} cy={-6} r={6} />
            <path className={css.userBody} d="M-11 12 a11 9 0 0 1 22 0" />
          </g>
        ))}
      </g>
      {USERS.map((u, i) => (
        <line key={i} className={cn(K, css.draw, css.route)} x1={u.x} y1={u.y - 20} x2={LB.x + 14} y2={LB.y + 10} pathLength={1} style={w(7.25 + i * 0.06, 7.6 + i * 0.06)} />
      ))}

      {REQS.map((r, i) => (
        <g key={i}>
          <circle className={cn(K, css.packet, css.mv)} r={2.8} style={mv(r.s, r.s + 0.05, { x: r.user.x, y: r.user.y - 20 }, { x: LB.x + 14, y: LB.y + 10 })} />
          <circle className={cn(K, css.packet, css.mv)} r={2.8} style={mv(r.s + 0.05, r.s + 0.12, { x: LB.x - 20, y: LB.y }, { x: r.to.x + 15, y: r.to.y })} />
        </g>
      ))}

      {/* The attempt that hits the copy that just died, and is retried. */}
      <circle className={cn(K, css.packet, css.packetBad, css.mv)} r={3} style={mv(8.15, 8.24, { x: LB.x - 20, y: LB.y }, { x: copy(VICTIM).x + 15, y: copy(VICTIM).y })} />
      <circle className={cn(K, css.packet, css.packetWarn, css.mv)} r={3} style={mv(8.26, 8.34, { x: LB.x - 20, y: LB.y }, { x: copy(2).x + 15, y: copy(2).y })} />
    </g>
  );
}

/** The visitor's side: one address, and the page it serves. Drawn flat, so a phone card can show it too. */
function Browser() {
  const x = 960;
  const y = 62;
  const bw = 208;
  const bh = 176;
  return (
    <g className={cn(K, css.fade)} style={w(7.0, 7.3)}>
      <rect className={css.frame} x={x} y={y} width={bw} height={bh} />
      <line className={css.frameRule} x1={x} y1={y + 34} x2={x + bw} y2={y + 34} />
      <rect className={css.urlBox} x={x + 12} y={y + 8} width={bw - 24} height={18} />
      <text className={cn(K, css.fade, css.urlText)} x={x + 20} y={y + 21} style={w(7.3, 7.75)}>
        {SAMPLE_HOST}
      </text>
      <polygon className={cn(K, css.pageArt, css.fade)} points={hex(22)} transform={`translate(${x + 40} ${y + 84})`} style={w(7.7, 8.0)} />
      <rect className={cn(K, css.pageLine, css.fade)} x={x + 16} y={y + 124} width={bw - 32} height={6} style={w(7.8, 8.05)} />
      <rect className={cn(K, css.pageLine, css.fade)} x={x + 16} y={y + 140} width={(bw - 32) * 0.6} height={6} style={w(7.85, 8.1)} />
      <g className={cn(K, css.fade)} style={w(9.2, 9.5)} transform={`translate(${x + bw - 62} ${y + bh - 18})`}>
        <circle className={css.liveDot} r={3.5} cy={-1} />
        <text className={css.liveText} x={10} y={3}>
          Live
        </text>
      </g>
    </g>
  );
}

/* ---- the scene ---------------------------------------------------------------------------------- */

export interface SceneProps {
  /** The door the visitor chose, or none: step one shows all three. */
  on: OnRampId | null;
  /** A phone step: the same picture, cropped to the step. */
  step?: number;
}

export function Scene({ on, step }: SceneProps) {
  const mini = step !== undefined;
  const crop: readonly number[] = mini ? (CROPS[step] ?? [0, 0, SCENE_W, SCENE_H]) : [0, 0, SCENE_W, SCENE_H];

  return (
    <svg
      className={cn(css.scene, mini && css.mini)}
      viewBox={crop.join(' ')}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      data-clock={mini ? undefined : ''}
    >
      {/* The camera: on the pinned stage the clock points this group at each step's view (clock.ts). */}
      <g data-camera={mini ? undefined : ''} transform={mini ? undefined : cameraTransform(0)}>
        <Field />
        <You on={on} />
        <Chain />
        <Routes />
        <Browser />
      </g>
    </svg>
  );
}
