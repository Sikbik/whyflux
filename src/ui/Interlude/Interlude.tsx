import { type CSSProperties, useRef } from 'react';
import { cn } from '@/lib/cn';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { Reveal } from '../Reveal/Reveal';
import styles from './Interlude.module.css';

export interface InterludeProps {
  /** The statement, one entry per line. No periods (house rule). Lines drift in opposite directions as you scroll past. */
  lines: string[];
  /**
   * Which lines are set quiet: light weight in a dimmer colour (0-based). Default: every line but the
   * last, so the last line lands bold and white as the punchline.
   */
  quiet?: number[];
  /** @deprecated The hollow outline type was retired. Now an alias of `quiet`. */
  outline?: number[];
  /** A small line above, in quiet sentence case. Prefer none: act markers and numerals are decoration. */
  kicker?: string;
  /** A small line below the statement. */
  caption?: string;
  /** `cold` for the web2 world. */
  mood?: 'cold';
  className?: string;
}

/**
 * A typographic breath between acts: a huge statement set in two weights that drifts with the
 * scroll, a light setup and a bold payoff. The page's rhythm device: dense chapter, breath, dense
 * chapter. Reads as one sentence to a screen reader.
 */
export function Interlude({ lines, quiet, outline, kicker, caption, mood, className }: InterludeProps) {
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref, { mode: 'enter' });
  const dim = new Set(quiet ?? outline ?? lines.map((_, i) => i).filter((i) => i < lines.length - 1));

  return (
    <section
      ref={ref}
      className={cn(styles.interlude, className)}
      data-mood={mood}
      aria-label={lines.join(' ')}
    >
      {kicker ? (
        <Reveal className={styles.kicker} from="none">
          {kicker}
        </Reveal>
      ) : null}
      <p className={styles.lines} aria-hidden="true" style={{ '--chars': Math.max(1, ...lines.map((l) => l.length)) } as CSSProperties}>
        {lines.map((line, i) => (
          <span
            key={line}
            className={cn(styles.line, dim.has(i) ? styles.quiet : styles.solid)}
            style={{ '--dir': i % 2 === 0 ? -1 : 1, '--i': i } as CSSProperties}
          >
            {line}
          </span>
        ))}
      </p>
      {caption ? (
        <Reveal className={cn('t-small', styles.caption)} delay={120}>
          {caption}
        </Reveal>
      ) : null}
    </section>
  );
}
