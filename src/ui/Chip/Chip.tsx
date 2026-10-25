import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Chip.module.css';

export type ChipTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'crit' | 'cumulus' | 'nimbus' | 'stratus';

export interface ChipProps {
  /** Colour of the words (and the dot). Tier tones go with a tier name, status tones with a status word. */
  tone?: ChipTone;
  /** A small round dot before the words, in the tone colour. `pulse` makes it breathe (live things). */
  bullet?: boolean | 'pulse';
  /** A lucide icon element before the words. */
  icon?: ReactNode;
  size?: 'sm' | 'md';
  /**
   * Keep the words in the quiet text colour and let only the dot or icon carry the tone: for a
   * status that should not shout ("Live just now").
   */
  muted?: boolean;
  /** Set the words in a heavier weight: for the one that matters in a row. No fill, no border. */
  solid?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A status or a tier as plain inline text: the colour or weight of the words, optionally led by a
 * small dot or icon. Never a capsule: no border, no fill, no uppercase mono (house rule). Prefer a
 * plain sentence where one will do.
 *
 *   <Chip tone="ok" bullet="pulse">Live</Chip>
 *   <Chip tone="nimbus">Nimbus</Chip>
 */
export function Chip({ tone = 'neutral', bullet = false, icon, size = 'md', muted = false, solid = false, className, children }: ChipProps) {
  const tierTone = tone === 'cumulus' || tone === 'nimbus' || tone === 'stratus' ? tone : undefined;
  const statusTone = tone === 'ok' || tone === 'warn' || tone === 'crit' ? tone : undefined;
  return (
    <span
      className={cn(styles.chip, className)}
      data-tier={tierTone}
      data-tone={statusTone}
      data-neutral={tone === 'neutral' ? '' : undefined}
      data-size={size}
      data-muted={muted || undefined}
      data-strong={solid || undefined}
    >
      {bullet ? <span className={styles.dot} data-pulse={bullet === 'pulse' || undefined} aria-hidden="true" /> : null}
      {icon}
      <span>{children}</span>
    </span>
  );
}
