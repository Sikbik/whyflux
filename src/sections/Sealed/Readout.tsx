import { useEffect, useState } from 'react';
import { stripPeriod } from '@/lib/format';
import { Sources } from '@/ui';
import { type Attempt, commandFor, type Host, noteOn, questionFor, verdictOn } from './model';
import type { Run } from './useSeat';
import { Answer } from './verdict';
import styles from './Readout.module.css';

/** Types a command line out, a character at a time. Returns the whole thing at once when not animating. */
function useTyped(text: string, animate: boolean, restart: number): string {
  const [n, setN] = useState(animate ? 0 : text.length);
  useEffect(() => {
    if (!animate) {
      setN(text.length);
      return;
    }
    setN(0);
    const step = Math.max(9, Math.min(20, 440 / Math.max(1, text.length)));
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, step);
    return () => window.clearInterval(id);
  }, [text, animate, restart]);
  return text.slice(0, n);
}

/** The first sentence of a note, without its period: a caption never carries one. */
function firstSentence(s: string): string {
  const [head = s] = s.split(/(?<=[.!?])\s+(?=[A-Z"])/);
  return stripPeriod(head);
}

/**
 * The one short line that says what decided an attempt. On an ArcaneOS node it is the layer, in the data's
 * own words; on a legacy node it is the first sentence of the row's own note about why it is open (root). The
 * longer notes live in the receipts.
 */
export function detailFor(row: Attempt, host: Host): string | null {
  if (host === 'arcane') return row.layer ?? null;
  return firstSentence(noteOn(row, 'legacy'));
}

export interface ReadoutProps {
  /** The attempt that ran last on this kind of node. */
  row: Attempt | undefined;
  host: Host;
  run: Run | null;
  /** The beam has landed (or there is no beam to wait for): the answer may show. */
  landed: boolean;
  /** Type the command out. Off for the quick legacy pass and under reduced motion. */
  type: boolean;
  /** A run is playing: nothing to prompt for while it is between two attempts. */
  playing: boolean;
}

/**
 * Under the stage: what the operator typed, the question it asks, and the answer, in three short lines. The
 * answer waits for the beam, so it arrives in the same instant the ring answers.
 */
export function Readout({ row, host, run, landed, type, playing }: ReadoutProps) {
  const command = row ? commandFor(row) : '';
  const typed = useTyped(command, type, run?.seq ?? 0);

  if (!row || !run) {
    return <div className={styles.readout}>{playing ? null : <p className={styles.idle}>Pick an attempt, or run them all</p>}</div>;
  }

  const verdict = verdictOn(row, host);
  const detail = detailFor(row, host);

  return (
    <div className={styles.readout}>
      <div key={run.seq} className={styles.entry}>
        <p className={styles.cmd}>
          <span className={styles.prompt} aria-hidden="true">
            operator@node ~ $
          </span>
          <span className="sr-only">Command: </span>
          <span className={styles.line}>{typed}</span>
        </p>
        <p className={styles.question}>{questionFor(row)}</p>
        <p className={styles.verdict} data-pending={landed ? undefined : ''}>
          <Answer verdict={verdict} size="lg" />
          {detail ? <span className={styles.detail}>{detail}</span> : null}
          <Sources items={row.sources} />
        </p>
      </div>
    </div>
  );
}
