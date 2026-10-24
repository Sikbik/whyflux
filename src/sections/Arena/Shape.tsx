import { useMemo } from 'react';
import { Marker } from './Marker';
import { Radar } from './Radar';
import { FLUX_ID, ORDERED_DIMENSIONS, platformById, verdictWord } from './model';
import { Roster } from './Roster';
import { HowWeScored } from './Rubric';
import { buildSeries, type Series } from './series';
import styles from './Shape.module.css';

export interface ShapeProps {
  withIds: string[];
  onToggle: (id: string) => void;
  onOpenReceipt: (platformId: string, dimensionId: string, anchor: HTMLElement) => void;
}

/**
 * View 3: shape. Flux is always on the chart; up to three more platforms are picked from the roster,
 * which is also the legend (each picked name carries its line key: solid for DePIN, dashed for web2).
 * A visually hidden table carries every value as the text equivalent. Never a total: the shape is the
 * point.
 */
export function ShapeView({ withIds, onToggle, onOpenReceipt }: ShapeProps) {
  const series = useMemo(() => buildSeries(withIds), [withIds]);
  const flux = platformById(FLUX_ID);
  const fluxSeries = series[0];
  const byId = useMemo(() => new Map(series.map((s) => [s.platform.id, s])), [series]);

  return (
    <div className={styles.shape}>
      <Roster
        label="Platforms to draw next to Flux"
        mode="multi"
        picked={withIds}
        onPick={onToggle}
        pinned={flux && fluxSeries ? { platform: flux, lead: <LineKey s={fluxSeries} /> } : undefined}
        leadFor={(p) => {
          const s = byId.get(p.id);
          return s ? <LineKey s={s} /> : <Marker platform={p} size={11} muted mono />;
        }}
        className={styles.roster}
      />

      <div className={styles.main}>
        <Radar series={series} onOpenReceipt={onOpenReceipt} />
        <div className={styles.foot}>
          <HowWeScored />
        </div>
        <ScoresTable series={series} />
      </div>
    </div>
  );
}

/** A line key: the stroke a series is drawn with (solid or dashed) and its marker. */
function LineKey({ s }: { s: Series }) {
  const w = 22;
  return (
    <svg className={styles.key} width={w} height="12" viewBox={`0 0 ${w} 12`} aria-hidden="true" focusable="false">
      <line x1="0" y1="6" x2={w} y2="6" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
      <g transform={`translate(${w / 2} 6)`}>
        {s.marker === 'circle' ? <circle r="3.6" fill={s.color} stroke="var(--ink-0)" strokeWidth="1.5" /> : null}
        {s.marker === 'square' ? <rect x="-3.4" y="-3.4" width="6.8" height="6.8" fill={s.color} stroke="var(--ink-0)" strokeWidth="1.5" /> : null}
        {s.marker === 'diamond' ? <polygon points="0,-4.8 4.8,0 0,4.8 -4.8,0" fill={s.color} stroke="var(--ink-0)" strokeWidth="1.5" /> : null}
      </g>
    </svg>
  );
}

/** The text equivalent of the radar: every score, for every question and every series on show. */
function ScoresTable({ series }: { series: Series[] }) {
  return (
    <table className="sr-only">
      <caption>Scores out of 5 for each question, for Flux and the platforms chosen</caption>
      <thead>
        <tr>
          <th scope="col">Question</th>
          {series.map((s) => (
            <th scope="col" key={s.platform.id}>
              {s.platform.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ORDERED_DIMENSIONS.map((d, i) => (
          <tr key={d.id}>
            <th scope="row">{d.label}</th>
            {series.map((s) => {
              const c = s.cells[i];
              return (
                <td key={s.platform.id}>
                  {!c ? 'No data' : c.verdict === 'na' ? 'Not applicable' : `${c.score} out of 5, ${verdictWord(c.verdict)}`}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
