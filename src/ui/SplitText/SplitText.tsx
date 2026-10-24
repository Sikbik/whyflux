import { type CSSProperties, type ElementType, useMemo, useRef } from 'react';
import { cn } from '@/lib/cn';
import { useReveal } from '../hooks/useReveal';
import styles from './SplitText.module.css';

export interface SplitTextProps {
  /**
   * The text. Mixed weights are the signature: `*bold*` makes weight 700 in the text colour,
   * `**emphasis**` makes weight 700 in the solid accent colour (--accent-strong). Never a
   * gradient: that is a house rule.
   *
   *   <SplitText as="h1" className="t-mega" text="Pull the plug **It keeps running**" breakBefore={[3]} />
   *
   * No periods in headline text (house rule): split two sentences into two lines, or use a comma.
   */
  text: string;
  as?: ElementType;
  className?: string;
  /** Delay before the first word, in ms. */
  delay?: number;
  /** Gap between words, in ms. Default 55. */
  stagger?: number;
  /** Reveal on mount (above the fold). */
  immediate?: boolean;
  /** Hold the reveal until this clears (an intro finishing). */
  hold?: boolean;
  /** Put a hard line break before this word index (0-based), for hand-set headlines. */
  breakBefore?: number[];
  id?: string;
}

interface Piece {
  word: string;
  kind: 'plain' | 'bold' | 'emph';
}

function parse(text: string): Piece[] {
  const pieces: Piece[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|([^*]+)/g;
  for (const m of text.matchAll(re)) {
    const kind: Piece['kind'] = m[1] ? 'emph' : m[2] ? 'bold' : 'plain';
    const chunk = (m[1] ?? m[2] ?? m[3] ?? '').trim();
    for (const word of chunk.split(/\s+/)) if (word) pieces.push({ word, kind });
  }
  return pieces;
}

/** The text without the markup, for aria-label and document titles. */
export function plainText(text: string): string {
  return text.replace(/\*\*?/g, '');
}

/**
 * A headline that reveals word by word (opacity, a short rise, a little blur) with a stagger.
 * The element carries an aria-label with the plain text and the animated words are aria-hidden,
 * so assistive tech reads one clean heading. Under reduced motion the tokens zero the travel and
 * the stagger and it becomes a quick fade.
 */
export function SplitText({
  text,
  as,
  className,
  delay = 0,
  stagger = 55,
  immediate = false,
  hold = false,
  breakBefore,
  id,
}: SplitTextProps) {
  const Tag: ElementType = as ?? 'span';
  const ref = useRef<HTMLElement>(null);
  const shown = useReveal(ref, { immediate, hold });
  const pieces = useMemo(() => parse(text), [text]);
  const breaks = useMemo(() => new Set(breakBefore ?? []), [breakBefore]);

  return (
    <Tag ref={ref} id={id} className={cn(styles.split, className)} data-shown={shown} aria-label={plainText(text)}>
      {pieces.map((p, i) => (
        <span key={`${i}-${p.word}`}>
          {breaks.has(i) ? <br aria-hidden="true" /> : null}
          <span className={styles.word} data-w aria-hidden="true">
            <span
              className={styles.inner}
              data-kind={p.kind}
              style={{ '--i': i, '--delay': `${delay}ms`, '--stagger': `${stagger}ms` } as CSSProperties}
            >
              {p.word}
            </span>
          </span>{' '}
        </span>
      ))}
    </Tag>
  );
}
