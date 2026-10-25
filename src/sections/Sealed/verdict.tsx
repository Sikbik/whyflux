import { Lock, LockOpen, Minus, ShieldHalf, type LucideIcon } from 'lucide-react';
import type { Verdict } from '@/data/types';
import styles from './verdict.module.css';

/**
 * How an answer is worded and drawn: the one place the mapping lives. The question is "Can a node
 * operator ...?", so the answer is a plain word: `no` is Flux blue with a lock, `partial` is orange
 * ("Partly"), `yes` is the alarm red with an open lock, `na` is a dash. Colour is always paired with the
 * word and a glyph, and never sits in a capsule.
 */
export interface VerdictInfo {
  /** The answer to "Can a node operator ...?", in one word. */
  word: string;
  icon: LucideIcon;
  /** The kit's `data-tone`, which re-points the accent roles for a subtree. `no` keeps Flux blue. */
  tone: 'warn' | 'crit' | undefined;
}

export const VERDICT: Record<Verdict, VerdictInfo> = {
  no: { word: 'No', icon: Lock, tone: undefined },
  partial: { word: 'Partly', icon: ShieldHalf, tone: 'warn' },
  yes: { word: 'Yes', icon: LockOpen, tone: 'crit' },
  na: { word: 'Not applicable', icon: Minus, tone: undefined },
};

/** The answer as coloured words: a small glyph and the word. */
export function Answer({ verdict, size = 'md' }: { verdict: Verdict; size?: 'md' | 'lg' }) {
  const v = VERDICT[verdict];
  const Icon = v.icon;
  return (
    <span className={styles.answer} data-tone={v.tone} data-size={size}>
      <Icon aria-hidden="true" strokeWidth={2} />
      {v.word}
    </span>
  );
}
