import { type ReactNode, useMemo, useRef } from 'react';
import { FLUX_ID, platformById } from '@/lib/compare';
import { shortName } from '@/sections/Arena/model';
import { useActive, useInView, useIsoLayoutEffect, useReducedMotion } from '@/ui';
import { Bars } from './Bars';
import { MeterStrip, type MeterResult } from './Meter';
import { niceAxis, type Workload } from './model';
import { useMeter } from './useMeter';
import styles from './Chart.module.css';

export interface ChartProps {
  workload: Workload;
  selectedId: string;
  /** The rival the meter's last line sets against Flux. */
  compareId: string;
  onSelect: (id: string) => void;
  phone: boolean;
  expanded: boolean;
  inline: ReactNode;
  inlineId: string;
}

/**
 * The bars, the dollar axis and the meter. The meter owns one number, `t`, and every bar and every
 * price is that number times the platform's monthly price, so the bars grow into place on entry and
 * "Run a month" plays the same number again, evenly, with a day counter.
 */
export function Chart({ workload, selectedId, compareId, onSelect, phone, expanded, inline, inlineId }: ChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, threshold: 0.2 });
  const active = useActive(ref);
  const reduced = useReducedMotion();
  const meter = useMeter(inView, active, reduced);
  const { group } = workload;

  // A different workload re-prices every row: grow the bars again (not on the first render). A layout
  // effect, so the new prices never show at full length for a frame first.
  const { regrow } = meter;
  const first = useRef(true);
  useIsoLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    regrow();
  }, [workload.id, regrow]);

  const axis = useMemo(() => niceAxis(Math.max(...group.points.map((p) => p.usdPerMonth))), [group]);

  const result = useMemo<MeterResult | null>(() => {
    const rivalPoint = group.points.find((p) => p.platformId === compareId);
    const rival = platformById(compareId);
    if (!rivalPoint || !rival || !group.flux || !platformById(FLUX_ID)) return null;
    return {
      rivalName: shortName(rival),
      rivalUsd: rivalPoint.usdPerMonth,
      fluxUsd: group.flux.usdPerMonth,
      times: group.flux.usdPerMonth > 0 ? rivalPoint.usdPerMonth / group.flux.usdPerMonth : undefined,
    };
  }, [group, compareId]);

  return (
    <div ref={ref} className={styles.chart}>
      <Bars
        group={group}
        axis={axis}
        selectedId={selectedId}
        onSelect={onSelect}
        meter={meter}
        phone={phone}
        expanded={expanded}
        inline={inline}
        inlineId={inlineId}
      />
      <MeterStrip phase={meter.phase} day={meter.day} result={result} onRun={meter.run} onReset={meter.reset} />
    </div>
  );
}
