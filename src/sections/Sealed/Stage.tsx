import { Terminal } from 'lucide-react';
import { type CSSProperties, useMemo } from 'react';
import { ArtPlate } from '@/ui';
import {
  CRACKS,
  CRYSTAL_BOX,
  CRYSTAL_CENTER,
  crackPath,
  dashFor,
  hexPath,
  linePath,
  pct,
  planBeam,
  type BeamPlan,
  type Pt,
  ringRadius,
  type StageBox,
} from './geometry';
import { type Attempt, type Host, PACE, type Ring, ringOf, ringVerdict, verdictOn } from './model';
import type { Run } from './useSeat';
import styles from './Stage.module.css';

/** Where the splash goes when a beam is stopped: back toward the operator, fanned out. */
const SPARKS: readonly Pt[] = [
  [-15, -13],
  [-19, -3],
  [-16, 8],
  [-9, 15],
  [-7, -18],
  [-12, 2],
];

export interface StageProps {
  box: StageBox;
  /** The attempts the seat plays, in order (the order decides where each one strikes). */
  rows: readonly Attempt[];
  rings: readonly Ring[];
  host: Host;
  /** What has been tried on this kind of node, in order. */
  tried: readonly string[];
  run: Run | null;
  /** The ring a hovered or focused attempt is aimed at. */
  previewRing: number | null;
  reduced: boolean;
  /** The stage has scrolled into view: the layers draw themselves in. */
  arrived: boolean;
  /** Counts up each time a run ends on an ArcaneOS node: the layers answer once more, outside to inside. 0 is none. */
  wave: number;
}

interface Mark {
  key: string;
  row: Attempt;
  verdict: 'no' | 'partial' | 'yes';
  plan: BeamPlan;
}

/**
 * The app, sealed in layers. A crystal at the center, a pointy-top hexagon around it for each layer the
 * data names (outermost first), and the operator at the left. Each ring is drawn as the table says it
 * stands on this kind of node: closed (every attempt it decides is denied), gapped (some are only
 * limited) or open (some get in). A beam leaves the operator for the ring an attempt names: a denial
 * stops on it and the ring flares blue, a limit pierces it and dies halfway in, and a gets-in crosses
 * every ring and cracks the crystal. What has been tried stays: a dot on the ring, a fracture on the
 * crystal. Solid colour and crisp lines only. The SVG is decoration: the readout and the list carry the
 * same information as text.
 */
export function Stage({ box, rows, rings, host, tried, run, previewRing, reduced, arrived, wave }: StageProps) {
  const { cx, cy, w, h } = box;
  const count = rings.length;

  const rowByKey = useMemo(() => new Map(rows.map((r) => [r.key, r])), [rows]);
  const orderOf = useMemo(() => new Map(rows.map((r, i) => [r.key, i])), [rows]);

  const shapes = useMemo(
    () =>
      rings.map((ring, i) => {
        const r = ringRadius(i, count);
        return { ring, r, d: hexPath(cx, cy, r) };
      }),
    [rings, count, cx, cy],
  );

  /** What each tried attempt did on this node: where it struck and how it ended. */
  const marks = useMemo(
    () =>
      tried.flatMap((key): Mark[] => {
        const row = rowByKey.get(key);
        if (!row) return [];
        const verdict = verdictOn(row, host);
        if (verdict === 'na') return [];
        return [{ key, row, verdict, plan: planBeam(box, verdict, ringOf(row, rings), count, orderOf.get(key) ?? 0) }];
      }),
    [tried, rowByKey, host, rings, count, orderOf, box],
  );

  const cracks = useMemo(() => marks.filter((m) => m.verdict === 'yes'), [marks]);

  const current = run && run.host === host ? run : null;
  const latest = current ? marks.find((m) => m.key === current.key) : undefined;
  const beamMs = PACE.beam[host];
  const beamVar = { '--beam': `${beamMs}ms` } as CSSProperties;

  // The ring the latest attempt flared: its own, or the outermost when none is named (and it did not get in).
  const named = latest ? ringOf(latest.row, rings) : null;
  const flareIdx = latest ? (latest.verdict === 'yes' ? named : (named ?? (count > 0 ? 0 : null))) : null;
  const flareShape = flareIdx === null ? undefined : shapes[flareIdx];
  const hot = previewRing ?? (reduced ? flareIdx : null);

  const crystalStyle: CSSProperties = {
    left: `${((cx - CRYSTAL_CENTER[0] * CRYSTAL_BOX) / w) * 100}%`,
    top: `${((cy - CRYSTAL_CENTER[1] * CRYSTAL_BOX) / h) * 100}%`,
    width: `${(CRYSTAL_BOX / w) * 100}%`,
    ...beamVar,
  };

  const animate = !reduced && current !== null && latest !== undefined;
  const hit = latest?.plan.hit ?? null;
  // The crystal flickers when something gets in. Two identical keyframes take turns, so each hit restarts it.
  const flicker = animate && latest.verdict === 'yes' ? (current.seq % 2 === 0 ? 'a' : 'b') : undefined;

  return (
    <div
      className={styles.stage}
      data-host={host}
      data-reduced={reduced || undefined}
      data-arrived={arrived || undefined}
      style={{ aspectRatio: `${w} / ${h}` }}
      aria-hidden="true"
    >
      <div className={styles.crystal} data-flicker={flicker} style={crystalStyle}>
        <ArtPlate src="container-crystal" mode="flow" alt="" />
      </div>

      <svg className={styles.svg} viewBox={`0 0 ${w} ${h}`} focusable="false">
        <g>
          {shapes.map(({ ring, r, d }, i) => {
            const verdict = ringVerdict(ring, rows, host);
            const dash = dashFor(verdict, r);
            return (
              <path
                key={ring.key}
                className={styles.ring}
                d={d}
                data-verdict={verdict}
                data-hot={hot === i || undefined}
                style={{ strokeDasharray: dash.array, strokeDashoffset: dash.offset, '--i': i } as CSSProperties}
              />
            );
          })}
        </g>

        {wave > 0 ? (
          <g key={`wave-${wave}`}>
            {shapes.map(({ ring, d }, i) => (
              <path key={ring.key} className={styles.wave} d={d} style={{ '--i': i } as CSSProperties} />
            ))}
          </g>
        ) : null}

        <g>
          {marks.map(({ key, verdict, plan }) => {
            if (!plan.hit) return null;
            const fresh = animate && key === current.key;
            return (
              <circle
                key={`${key}-${fresh ? current.seq : 'still'}`}
                className={styles.mark}
                cx={plan.hit[0]}
                cy={plan.hit[1]}
                r={verdict === 'no' ? 2.8 : 2.4}
                data-verdict={verdict}
                data-new={fresh ? '' : undefined}
                style={beamVar}
              />
            );
          })}
        </g>

        <g>
          {cracks.map(({ key }, n) => {
            const points = CRACKS[n % CRACKS.length];
            if (!points) return null;
            const fresh = animate && key === current.key;
            return (
              <path
                key={`${n}-${fresh ? current.seq : 'still'}`}
                className={styles.crack}
                d={crackPath(box, points)}
                pathLength={1}
                data-new={fresh ? '' : undefined}
                style={beamVar}
              />
            );
          })}
        </g>

        {animate ? (
          <g key={`event-${current.seq}`} className={styles.event} data-verdict={latest.verdict} style={beamVar}>
            <path className={styles.trace} d={linePath(latest.plan.from, latest.plan.to)} />
            <path className={styles.beam} d={linePath(latest.plan.from, latest.plan.to)} pathLength={1} />
            {flareShape ? (
              <>
                <path className={styles.flare} d={flareShape.d} />
                <path className={styles.pulse} d={flareShape.d} />
              </>
            ) : null}
            {hit && latest.verdict !== 'yes'
              ? SPARKS.map(([dx, dy], n) => (
                  <circle
                    key={`${dx}:${dy}:${n}`}
                    className={styles.spark}
                    cx={hit[0]}
                    cy={hit[1]}
                    r={1.6}
                    style={{ '--dx': `${dx}px`, '--dy': `${dy}px` } as CSSProperties}
                  />
                ))
              : null}
            {latest.verdict === 'yes' ? <circle className={styles.leak} cx={latest.plan.to[0]} cy={latest.plan.to[1]} r={8} /> : null}
          </g>
        ) : null}
      </svg>

      <div className={styles.operator} style={pct(box, [box.ox, box.oy])}>
        <span className={styles.operatorHex}>
          <Terminal size={18} strokeWidth={1.75} />
        </span>
        <span className={styles.operatorLabel}>Operator</span>
      </div>
    </div>
  );
}
