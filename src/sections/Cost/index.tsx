import { ArrowRight } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';
import { FLUX_ID, type PriceGroup, platformById } from '@/lib/compare';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useUrlParam, writeParam } from '@/lib/urlState';
import { shortName } from '@/sections/Arena/model';
import { TextSwitch } from '@/sections/Arena/TextSwitch';
import { Reveal, Section, SectionHeader, useIsPhone } from '@/ui';
import { Chart } from './Chart';
import { Fineprint } from './Fineprint';
import { Receipt } from './Receipt';
import {
  BILL_LABEL,
  BILL_LABEL_SHORT,
  type BillId,
  footnotesFor,
  parseBill,
  pricedOn,
  WORKLOADS,
  workloadOf,
} from './model';
import styles from './Cost.module.css';

/** The bar the receipt opens on, and the rival the meter and the link out set against Flux. */
const DEFAULT_PICK = 'aws';

/** A platform that is in this workload: the one asked for, else the dearest rival. */
function pickIn(group: PriceGroup, id: string): string {
  if (group.points.some((p) => p.platformId === id)) return id;
  const rivals = group.points.filter((p) => p.platformId !== FLUX_ID);
  return rivals[rivals.length - 1]?.platformId ?? group.points[0]?.platformId ?? FLUX_ID;
}

/**
 * Chapter 09: What it actually costs. One chart (the same month, priced on each platform, to scale),
 * one meter (run the month and watch the bills build) and, one word away, the receipts. Every bar
 * opens the line items behind its number; the workload, the dates and the sources come from `prices`,
 * so nothing on screen is typed in (docs/DESIGN.md section 9, chapter 09).
 */
export function Cost() {
  const [billRaw, writeBill] = useUrlParam('bill');
  const bill = parseBill(billRaw);
  const workload = workloadOf(bill);
  const isPhone = useIsPhone();
  const [picked, setPicked] = useState(DEFAULT_PICK);
  const [open, setOpen] = useState(false);
  const inlineId = useId();

  const group = workload?.group;
  const selectedId = group ? pickIn(group, picked) : picked;
  const compareId = group ? pickIn(group, selectedId === FLUX_ID ? DEFAULT_PICK : selectedId) : DEFAULT_PICK;
  const selectedPoint = group?.points.find((p) => p.platformId === selectedId);
  const footnotes = useMemo(() => (group ? footnotesFor(group) : []), [group]);
  const comparePlatform = platformById(compareId);
  const compareName = comparePlatform ? shortName(comparePlatform) : compareId;

  // On a phone the receipt opens under the row and the same row closes it; on a desktop it is always there.
  const onSelect = useCallback(
    (id: string) => {
      setPicked(id);
      setOpen((cur) => (id === selectedId ? !cur : true));
    },
    [selectedId],
  );

  const onBill = useCallback(
    (id: BillId) => writeBill(id === WORKLOADS[0]?.id ? null : id),
    [writeBill],
  );

  /** The way on is a matchup: the same rival the meter set against Flux. */
  const goArena = useCallback(() => {
    writeParam('vs', compareId);
    writeParam('view', 'h2h');
  }, [compareId]);

  const header = (
    <SectionHeader
      num="09"
      eyebrow="Cost"
      title="What it *actually* costs"
      lede="The same workload, priced across providers, with the line items the pricing pages bury"
    />
  );

  if (!workload || !group || !selectedPoint) {
    return (
      <Section id="cost" label="What it actually costs" width="wide">
        {header}
        <p className={styles.empty}>
          Prices are taken from each provider’s public rate card and from the live Flux network quote, and every one
          carries a date. None are loaded right now.
        </p>
      </Section>
    );
  }

  const receipt = <Receipt point={selectedPoint} group={group} inline={isPhone} />;

  return (
    <Section id="cost" label="What it actually costs" width="wide">
      {header}

      <Reveal>
        <div className={styles.controls}>
          <TextSwitch<BillId>
            aria-label="Workload"
            size="lg"
            value={bill}
            onChange={onBill}
            options={WORKLOADS.map((w) => ({
              value: w.id,
              label: isPhone ? BILL_LABEL_SHORT[w.id] : BILL_LABEL[w.id],
              ariaLabel: BILL_LABEL[w.id],
            }))}
          />
        </div>

        <div className={styles.grid}>
          <Chart
            workload={workload}
            selectedId={selectedId}
            compareId={compareId}
            onSelect={onSelect}
            phone={isPhone}
            expanded={open}
            inline={receipt}
            inlineId={inlineId}
          />
          {isPhone ? null : <div className={styles.side}>{receipt}</div>}
        </div>
      </Reveal>

      <Fineprint items={footnotes} workload={group.workload} pricedOn={formatDate(pricedOn(group))} />

      <p className={styles.out}>
        <a className={cn('link', styles.go)} href="#arena" onClick={goArena}>
          Flux against {compareName}, question by{' '}
          <span className={styles.tail}>
            question
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
        </a>
      </p>
    </Section>
  );
}
