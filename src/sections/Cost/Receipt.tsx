import { memo, useMemo } from 'react';
import type { PricePoint } from '@/data/types';
import { type PriceGroup, platformById, timesFlux } from '@/lib/compare';
import { formatDate, formatUsd } from '@/lib/format';
import { Marker } from '@/sections/Arena/Marker';
import { Sources } from '@/ui';
import { type NoteKind, readBill, timesText } from './model';
import styles from './Receipt.module.css';

export interface ReceiptProps {
  point: PricePoint;
  group: PriceGroup;
  /** Phone: the receipt sits under its row and already has a heading there. */
  inline?: boolean;
}

const GROUPS: { kind: NoteKind; title: string }[] = [
  { kind: 'included', title: 'Included' },
  { kind: 'excluded', title: 'Not included' },
  { kind: 'context', title: 'Worth knowing' },
];

/**
 * What one number includes, exactly as the data states it: the line items when the note itemizes
 * and they add up to the price, then what is included, what is not, and what to know. Date and
 * sources at the foot, because a price without a date is a rumor. Plain type on the page: no panel.
 */
export const Receipt = memo(function Receipt({ point, group, inline = false }: ReceiptProps) {
  const platform = platformById(point.platformId);
  const bill = useMemo(() => readBill(point), [point]);
  if (!platform) return null;
  const times = platform.kind === 'flux' ? undefined : timesFlux(point, group);

  return (
    <section className={styles.receipt} aria-label={`What the ${platform.name} price includes`} data-inline={inline || undefined}>
      <div className={styles.swap} key={point.platformId}>
        <header className={styles.head}>
          <p className={styles.who}>
            <Marker platform={platform} size={14} mono />
            <span>{platform.name}</span>
          </p>
        </header>

        <p className={styles.total}>
          <b>{formatUsd(point.usdPerMonth, 2)}</b>
          <span>a month</span>
          {times ? (
            <span className={styles.times}>
              <b>{timesText(times)}</b> Flux
            </span>
          ) : null}
        </p>

        {bill.lead ? <p className={styles.lead}>{bill.lead}</p> : null}

        {bill.items.length ? (
          <section className={styles.block} aria-label="The bill">
            <h4 className={styles.h}>The bill</h4>
            <ul className={styles.items}>
              {bill.items.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <b>{formatUsd(item.amount, 2)}</b>
                </li>
              ))}
            </ul>
            <p className={styles.sum}>
              <span>Total</span>
              <b>{formatUsd(point.usdPerMonth, 2)}</b>
            </p>
          </section>
        ) : null}

        {GROUPS.map(({ kind, title }) => {
          const list = bill.notes.filter((n) => n.kind === kind);
          if (!list.length) return null;
          return (
            <section key={kind} className={styles.block} aria-label={title}>
              <h4 className={styles.h}>{title}</h4>
              <ul className={styles.notes}>
                {list.map((n) => (
                  <li key={n.text}>{n.text}</li>
                ))}
              </ul>
            </section>
          );
        })}

        <footer className={styles.foot}>
          <span>Priced {formatDate(point.asOf)}</span>
          <Sources items={point.sources} title="Where this price comes from" />
        </footer>
      </div>
    </section>
  );
});
