import { type CSSProperties, type KeyboardEvent, type RefObject, useEffect, useMemo, useRef } from 'react';
import type { Incident } from '@/data/types';
import { formatDate, formatDuration, formatPercent, stripPeriod } from '@/lib/format';
import { Tooltip, useElementSize, useReducedMotion } from '@/ui';
import { dayMs, GROUP_SHORT, layoutTimeline, type Share, shortProvider } from './model';
import styles from './Timeline.module.css';

/** Room at both ends of the ruler so the first and last markers are not cut off, px. */
const PAD = 18;

interface RulerProps {
  /** Every incident, so markers keep their place while a kind is chosen. */
  all: readonly Incident[];
  /** The incidents of the chosen kind: the rest fade and leave the tab order. */
  live: ReadonlySet<string>;
  selectedId: string;
  onSelect: (id: string) => void;
  /** The share of spending, set beside each company's row. */
  share: Share | null;
}

const hoursLabel = (i: Incident): string =>
  typeof i.durationHours === 'number' ? formatDuration(i.durationHours) : 'ran for days or longer';

function rovingHandler(live: ReadonlySet<string>, all: readonly Incident[], onSelect: (id: string) => void, root: RefObject<HTMLElement | null>) {
  return (e: KeyboardEvent<HTMLElement>) => {
    const order = [...all].filter((i) => live.has(i.id)).sort((a, b) => dayMs(a.date) - dayMs(b.date));
    if (order.length === 0) return;
    const current = (document.activeElement as HTMLElement | null)?.dataset.id;
    const at = Math.max(0, order.findIndex((i) => i.id === current));
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(order.length - 1, at + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, at - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = order.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const target = order[next];
    if (!target) return;
    onSelect(target.id);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(target.id)}"]`)?.focus());
  };
}

/** The tab stop of a roving group: the selected marker if it matches, else the first that does. */
function tabStop(all: readonly Incident[], live: ReadonlySet<string>, selectedId: string): string | undefined {
  if (live.has(selectedId)) return selectedId;
  return [...all].sort((a, b) => dayMs(a.date) - dayMs(b.date)).find((i) => live.has(i.id))?.id;
}

/**
 * Every incident on one ruler, by date, in a row per company. Marker size is the square root of the
 * hours offline; a dashed hollow marker ran for days or longer (the data has no hours for those).
 * Time is linear: the last year is crowded because it was.
 */
export function IncidentRuler({ all, live, selectedId, onSelect, share }: RulerProps) {
  const plot = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(plot);
  const inner = Math.max(240, width - PAD * 2);
  const layout = useMemo(() => layoutTimeline(all, inner), [all, inner]);
  const stop = tabStop(all, live, selectedId);
  const onKey = rovingHandler(live, all, onSelect, plot);
  const selected = layout.placed.find((p) => p.incident.id === selectedId);

  return (
    <div className={styles.ruler} style={{ '--pad': `${PAD}px`, '--h': `${layout.height}px` } as CSSProperties}>
      <div className={styles.gutter} aria-hidden="true">
        {layout.rows.map((r) => {
          const pct = share?.rows.find((s) => s.big && s.id === r.group)?.sharePct;
          return (
            <span key={r.group} className={styles.rowLabel} style={{ insetBlockStart: r.top, blockSize: r.height }}>
              <span className={styles.rowName}>{GROUP_SHORT[r.group]}</span>
              {pct != null ? <span className={styles.rowShare}>{formatPercent(pct, Number.isInteger(pct) ? 0 : 1)}</span> : null}
            </span>
          );
        })}
      </div>

      <div className={styles.stage}>
        <div
          ref={plot}
          className={styles.plot}
          role="radiogroup"
          aria-label="Incidents by date and company, use the arrow keys to move through them"
          onKeyDown={onKey}
        >
          {layout.rows.map((r) => (
            <span key={r.group} className={styles.track} style={{ insetBlockStart: r.top, blockSize: r.height }} aria-hidden="true" />
          ))}

          {selected ? <span className={styles.playhead} style={{ '--t': selected.t } as CSSProperties} aria-hidden="true" /> : null}

          {layout.placed.map((p) => {
            const i = p.incident;
            const on = i.id === selectedId;
            const open = typeof i.durationHours !== 'number';
            return (
              <Tooltip
                key={i.id}
                placement="top"
                content={
                  <>
                    <strong>{shortProvider(i.provider)}</strong>, {formatDate(i.date)}
                  </>
                }
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${formatDate(i.date)}, ${shortProvider(i.provider)}: ${stripPeriod(i.title)}, ${hoursLabel(i)}`}
                  tabIndex={i.id === stop ? 0 : -1}
                  data-id={i.id}
                  data-on={on || undefined}
                  data-live={live.has(i.id) || undefined}
                  data-open={open || undefined}
                  data-group={p.group}
                  className={styles.marker}
                  style={{ '--t': p.t, '--y': `${p.y}px`, '--d': `${p.d}px` } as CSSProperties}
                  onClick={() => onSelect(i.id)}
                >
                  <svg className={styles.hex} viewBox="0 0 100 87" aria-hidden="true">
                    <polygon className={styles.ring} points={HEX} vectorEffect="non-scaling-stroke" />
                    <polygon className={styles.body} points={HEX} vectorEffect="non-scaling-stroke" />
                  </svg>
                </button>
              </Tooltip>
            );
          })}
        </div>

        <div className={styles.years} aria-hidden="true">
          {layout.years.map((y) => (
            <span key={y.label} style={{ '--t': y.t } as CSSProperties}>
              {y.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const HEX = '25,1.5 75,1.5 99,43.5 75,85.5 25,85.5 1,43.5';

interface ListProps {
  /** Only the incidents of the chosen kind, oldest first. */
  list: readonly Incident[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** The phone version of the ruler: plain words in a snapping row, oldest to newest. */
export function IncidentList({ list, selectedId, onSelect }: ListProps) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const live = useMemo(() => new Set(list.map((i) => i.id)), [list]);
  const onKey = rovingHandler(live, list, onSelect, root);
  const stop = tabStop(list, live, selectedId);

  // Keep the chosen incident in the middle of the row.
  useEffect(() => {
    const el = root.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(selectedId)}"]`);
    const row = root.current;
    if (!el || !row) return;
    const left = el.offsetLeft - (row.clientWidth - el.clientWidth) / 2;
    row.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });
  }, [selectedId, reduced, list]);

  return (
    <div ref={root} className={styles.list} role="radiogroup" aria-label="Incidents, oldest to newest" onKeyDown={onKey}>
      {list.map((i) => {
        const on = i.id === selectedId;
        return (
          <button
            key={i.id}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={i.id === stop ? 0 : -1}
            data-id={i.id}
            data-on={on || undefined}
            className={styles.item}
            onClick={() => onSelect(i.id)}
          >
            <span className={styles.who}>{shortProvider(i.provider)}</span>
            <span className={styles.when}>{formatDate(i.date).replace(/ \d{1,2},/, '')}</span>
          </button>
        );
      })}
    </div>
  );
}
