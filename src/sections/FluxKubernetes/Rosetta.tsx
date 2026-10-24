import { ArrowRight } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef } from 'react';
import type { ConceptMapping } from '@/data/types';
import css from './Rosetta.module.css';

/** Splits `inline code` out of a data string. Strings without backticks pass through untouched. */
export function Rich({ text }: { text: string }) {
  const parts = text.split('`');
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <code key={i} className={css.code}>
            {p}
          </code>
        ) : (
          p
        ),
      )}
    </>
  );
}

export type SelectVia = 'pointer' | 'key';

export interface RosettaProps {
  rows: readonly ConceptMapping[];
  selected: number;
  onSelect: (index: number, via: SelectVia) => void;
  phone: boolean;
}

/**
 * The Rosetta stone, set as type: what Kubernetes calls a thing, and under it what plays that role in
 * Flux. A listbox whose selection follows the arrow keys. On phones the list is a scroller of the
 * Kubernetes terms alone and the chosen pair is set under it (`RosettaPair`). Choosing a row points the
 * theater at that idea.
 */
export function Rosetta({ rows, selected, onSelect, phone }: RosettaProps) {
  const uid = useId();
  const box = useRef<HTMLDivElement>(null);

  const move = (to: number) => {
    const next = (to + rows.length) % rows.length;
    onSelect(next, 'key');
    // The rows are always in the DOM, so focus can follow the key at once. On phones the tab scrolls itself.
    box.current?.querySelector<HTMLElement>(`[data-i="${next}"]`)?.focus({ preventScroll: phone });
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const fwd = phone ? 'ArrowRight' : 'ArrowDown';
    const back = phone ? 'ArrowLeft' : 'ArrowUp';
    if (e.key === fwd || e.key === (phone ? 'ArrowDown' : 'ArrowRight')) move(selected + 1);
    else if (e.key === back || e.key === (phone ? 'ArrowUp' : 'ArrowLeft')) move(selected - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(rows.length - 1);
    else return;
    e.preventDefault();
  };

  // On phones the selected tab scrolls itself into view (inside the scroller only).
  useEffect(() => {
    if (!phone) return;
    const el = box.current?.querySelector<HTMLElement>(`[data-i="${selected}"]`);
    const sc = box.current;
    if (!el || !sc) return;
    const left = el.offsetLeft - (sc.clientWidth - el.offsetWidth) / 2;
    sc.scrollTo({ left, behavior: 'smooth' });
  }, [phone, selected]);

  return (
    <div
      ref={box}
      role="listbox"
      aria-label="Kubernetes concepts and what plays that role in Flux"
      aria-orientation={phone ? 'horizontal' : 'vertical'}
      className={css.list}
      data-phone={phone || undefined}
      onKeyDown={onKey}
    >
      {rows.map((r, i) => {
        const on = i === selected;
        return (
          <div
            key={r.k8s}
            id={`${uid}-${i}`}
            data-i={i}
            role="option"
            aria-selected={on}
            aria-label={phone ? `${r.k8s}: ${r.flux.replaceAll('`', '')}` : undefined}
            tabIndex={on ? 0 : -1}
            className={css.row}
            data-on={on || undefined}
            onClick={() => onSelect(i, 'pointer')}
          >
            <span className={css.k8s}>{r.k8s}</span>
            {phone ? null : (
              <span className={css.flux}>
                <ArrowRight className={css.arrow} size={15} strokeWidth={1.75} aria-hidden="true" />
                <span>
                  <Rich text={r.flux} />
                </span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The chosen pair, set big, for the layouts where the list shows only the Kubernetes terms. */
export function RosettaPair({ row }: { row: ConceptMapping | undefined }) {
  if (!row) return null;
  return (
    <p className={css.pair} aria-hidden="true">
      <span className={css.pairK}>{row.k8s}</span>
      <span className={css.pairF}>
        <ArrowRight className={css.arrow} size={18} strokeWidth={1.75} aria-hidden="true" />
        <span>
          <Rich text={row.flux} />
        </span>
      </span>
    </p>
  );
}
