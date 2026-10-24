import { type CSSProperties, type KeyboardEvent, type ReactNode, useCallback, useRef } from 'react';
import { type PriceGroup, platformById, timesFlux } from '@/lib/compare';
import { formatUsd } from '@/lib/format';
import { Marker } from '@/sections/Arena/Marker';
import { shortName } from '@/sections/Arena/model';
import { useIsoLayoutEffect } from '@/ui';
import { type Axis, timesText } from './model';
import type { Meter } from './useMeter';
import styles from './Bars.module.css';

export interface BarsProps {
  group: PriceGroup;
  axis: Axis;
  selectedId: string;
  onSelect: (id: string) => void;
  meter: Pick<Meter, 'phase' | 'settled' | 'getT' | 'subscribe'>;
  /** Phone: rows are disclosure buttons and the receipt opens under the selected one. */
  phone: boolean;
  expanded: boolean;
  /** The receipt, placed under the selected row on a phone. */
  inline: ReactNode;
  inlineId: string;
}

/** Bars grow one after another on entry; during a run they all move together, at the same rate. */
const STAGGER = 0.05;
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

interface RowEls {
  price: number;
  fill: HTMLElement | null;
  reading: HTMLElement | null;
  figure: HTMLElement | null;
  last: string;
}

/**
 * One horizontal bar per platform, cheapest first, linear from zero. Each row is a button: pick one
 * to see exactly what its number includes. The price rides the end of its bar like a meter reading,
 * and the multiple against Flux sits in its own column, in plain coloured type, so the eye can run
 * down it.
 *
 * The bar widths and the readings change on every frame of the meter, so they are written straight
 * to the DOM from the meter's clock; React renders the rows once and never touches those values.
 */
export function Bars({ group, axis, selectedId, onSelect, meter, phone, expanded, inline, inlineId }: BarsProps) {
  const { phase, settled, getT, subscribe } = meter;
  const rootRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<RowEls[]>([]);
  const decimals = axis.step % 1 ? 1 : 0;
  const running = phase === 'run';

  const paint = useCallback(
    (t: number) => {
      const rows = rowsRef.current;
      const n = rows.length;
      rows.forEach((row, i) => {
        const local = running ? t : clamp01((t - i * STAGGER) / (1 - (n - 1) * STAGGER));
        const value = row.price * local;
        const frac = (value / axis.max) * 100;
        const text = formatUsd(value, 2);
        if (row.fill) row.fill.style.width = `max(2px, ${frac}%)`;
        if (row.reading) row.reading.style.left = `calc(max(2px, ${frac}%) + 10px)`;
        if (text !== row.last) {
          row.last = text;
          if (row.reading) row.reading.textContent = text;
          if (row.figure) row.figure.textContent = text;
        }
      });
    },
    [axis.max, running],
  );

  // Collect the row elements after every layout, paint the current frame, then follow the clock.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const prices = new Map(group.points.map((p) => [p.platformId, p.usdPerMonth]));
    rowsRef.current = [...root.querySelectorAll<HTMLElement>('[data-id]')].map((el) => ({
      price: prices.get(el.dataset.id ?? '') ?? 0,
      fill: el.querySelector<HTMLElement>('[data-fill]'),
      reading: el.querySelector<HTMLElement>('[data-reading]'),
      figure: el.querySelector<HTMLElement>('[data-price]'),
      last: '',
    }));
    paint(getT());
    return subscribe(paint);
  }, [group, phone, paint, getT, subscribe]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const back = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
    if (!forward && !back && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const ids = group.points.map((p) => p.platformId);
    const at = Math.max(0, ids.indexOf(selectedId));
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : (at + (forward ? 1 : -1) + ids.length) % ids.length;
    const id = ids[next];
    if (!id) return;
    onSelect(id);
    rootRef.current?.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus();
  };

  const rows = group.points.map((point, i) => {
    const platform = platformById(point.platformId);
    if (!platform) return null;
    const isFlux = platform.kind === 'flux';
    const selected = point.platformId === selectedId;
    const times = isFlux ? undefined : timesFlux(point, group);
    const name = shortName(platform);
    const label = `${name}, ${formatUsd(point.usdPerMonth, 2)} a month${times ? `, ${timesText(times)} the Flux price` : ''}`;

    const button = (
      <button
        key={point.platformId}
        type="button"
        className={styles.row}
        data-id={point.platformId}
        data-kind={platform.kind}
        data-selected={selected || undefined}
        style={{ '--i': i } as CSSProperties}
        aria-label={label}
        {...(phone
          ? { 'aria-expanded': selected && expanded, 'aria-controls': inlineId }
          : { role: 'radio', 'aria-checked': selected, tabIndex: selected ? 0 : -1 })}
        onClick={() => onSelect(point.platformId)}
      >
        <span className={styles.who}>
          <Marker platform={platform} size={12} mono />
          <b className={styles.name}>{name}</b>
        </span>
        <span className={styles.price} data-price aria-hidden="true" />
        <span className={styles.plot} aria-hidden="true">
          <span className={styles.track}>
            <span className={styles.fill} data-fill />
            <span className={styles.reading} data-reading />
          </span>
        </span>
        {times ? (
          <span className={styles.ratio} aria-hidden="true">
            <b>{timesText(times)}</b> Flux
          </span>
        ) : null}
      </button>
    );

    if (!phone) return button;
    return (
      <li key={point.platformId} className={styles.item}>
        {button}
        {selected && expanded ? (
          <div className={styles.inline} id={inlineId}>
            {inline}
          </div>
        ) : null}
      </li>
    );
  });

  return (
    <div
      ref={rootRef}
      className={styles.chart}
      data-ready={settled || undefined}
      data-phase={phase}
      data-phone={phone || undefined}
    >
      <div className={styles.frame}>
        <div className={styles.lines} aria-hidden="true">
          {axis.ticks.map((v) => (
            <i key={v} style={{ left: `${(v / axis.max) * 100}%` }} />
          ))}
        </div>
        {phone ? (
          <ul className={styles.rows} aria-label="Monthly price by platform. Select one to see what it includes">
            {rows}
          </ul>
        ) : (
          <div
            className={styles.rows}
            role="radiogroup"
            aria-label="Monthly price by platform. Select one to see what it includes"
            onKeyDown={onKeyDown}
          >
            {rows}
          </div>
        )}
      </div>

      <div className={styles.axis} aria-hidden="true">
        <span className={styles.axisPlot}>
          {axis.ticks.map((v) => (
            <span key={v} className={styles.tick} style={{ left: `${(v / axis.max) * 100}%` }}>
              {formatUsd(v, decimals)}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
