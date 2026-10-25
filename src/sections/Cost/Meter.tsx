import { Play, RotateCcw } from 'lucide-react';
import { memo } from 'react';
import { formatUsd } from '@/lib/format';
import { Button } from '@/ui';
import { timesText } from './model';
import { MONTH_DAYS, type MeterPhase } from './useMeter';
import styles from './Meter.module.css';

export interface MeterResult {
  rivalName: string;
  rivalUsd: number;
  fluxUsd: number;
  times: number | undefined;
}

export interface MeterStripProps {
  phase: MeterPhase;
  day: number;
  result: MeterResult | null;
  onRun: () => void;
  onReset: () => void;
}

/**
 * The taxi meter's control strip: a button that runs a month, thirty ticks that light one a day, a
 * day counter, and at day 30 the line that says what the month cost on each side. On a phone the
 * strip sticks to the bottom of the chart while the chart is on screen.
 */
export const MeterStrip = memo(function MeterStrip({ phase, day, result, onRun, onReset }: MeterStripProps) {
  const running = phase === 'run';
  const done = phase === 'done';
  return (
    <div className={styles.strip} data-phase={phase}>
      <div className={styles.controls}>
        <Button
          variant="primary"
          size="md"
          className={styles.run}
          icon={<Play size={16} aria-hidden="true" />}
          disabled={running}
          onClick={onRun}
        >
          Run a month
        </Button>

        <ol className={styles.ticks} aria-hidden="true">
          {Array.from({ length: MONTH_DAYS }, (_, i) => (
            <li key={i} data-on={i < day || undefined} data-head={(running && i === day - 1) || undefined} data-week={(i + 1) % 7 === 0 || undefined} />
          ))}
        </ol>

        <p className={styles.counter} aria-hidden="true">
          {day > 0 ? (
            <>
              Day <b>{day}</b>
            </>
          ) : null}
        </p>
      </div>

      <div className={styles.line} role="status">
        {done && result ? (
          <>
            <span className="sr-only">
              {`After a month, ${result.rivalName} costs ${formatUsd(result.rivalUsd, 2)} and Flux costs ${formatUsd(result.fluxUsd, 2)}${
                result.times ? `: ${timesText(result.times)} the Flux price` : ''
              }`}
            </span>
            <p className={styles.result} aria-hidden="true">
              <span className={styles.side}>
                <span className={styles.who}>{result.rivalName}</span>
                <b>{formatUsd(result.rivalUsd, 2)}</b>
              </span>
              <span className={styles.side} data-flux>
                <span className={styles.who}>Flux</span>
                <b>{formatUsd(result.fluxUsd, 2)}</b>
              </span>
              {result.times ? (
                <span className={styles.multiple}>
                  <b>{timesText(result.times)}</b>
                  <span className={styles.words}>the Flux price</span>
                </span>
              ) : null}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className={styles.reset}
              icon={<RotateCcw size={15} aria-hidden="true" />}
              aria-label="Reset"
              onClick={onReset}
            >
              <span className={styles.resetLabel}>Reset</span>
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
});
