import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Eyebrow } from '../Eyebrow/Eyebrow';
import { Reveal } from '../Reveal/Reveal';
import { plainText, SplitText } from '../SplitText/SplitText';
import styles from './SectionHeader.module.css';

export interface SectionHeaderProps {
  /** @deprecated No effect. Chapter numbers (and the ghost numeral they fed) were removed. Omit it. */
  num?: string;
  /**
   * One quiet line above the title, in sentence case. Optional: leave it out whenever the title
   * already says it (most of the time). Never put a number in it.
   */
  eyebrow?: string;
  /**
   * The headline. SplitText markup: `*bold*` (weight 700), `**emphasis**` (weight 700 in the solid accent
   * colour). The base weight is light (300), so the marked words carry the weight contrast: one or two
   * words, usually the payoff. No periods (house rule): use a line break, a comma or a rewrite.
   */
  title: string;
  /** One or two short sentences. On wide screens it sits to the right of the title. */
  lede?: ReactNode;
  align?: 'start' | 'center';
  /** @deprecated No effect. The ghost chapter numeral was removed. */
  ghost?: boolean;
  /** Extra content under the lede (a toggle, a legend). */
  children?: ReactNode;
  className?: string;
  /** id for the h2, so a section can aria-labelledby it. */
  titleId?: string;
}

/** A title longer than this takes the full width, with the lede stacked under it. */
const LONG_TITLE = 32;

/**
 * The section slate: a big light-and-bold title that reveals word by word, an optional quiet kicker
 * above it, and a short lede that sits beside the title on wide screens (under it on narrow ones, and
 * under any long title). No numeral, no ruler, no bullet. One per section, right at the top.
 *
 *   <SectionHeader title="A cloud that **schedules itself**" lede="..." />
 */
export function SectionHeader({
  num: _num,
  eyebrow,
  title,
  lede,
  align = 'start',
  ghost: _ghost,
  children,
  className,
  titleId,
}: SectionHeaderProps) {
  return (
    <header className={cn(styles.header, className)} data-align={align} data-stack={plainText(title).length > LONG_TITLE || undefined}>
      {eyebrow ? (
        <Reveal className={styles.kicker} from="none">
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <div className={styles.main}>
        <SplitText as="h2" id={titleId} text={title} className={styles.title} />
        {lede ? (
          <Reveal as="div" className={styles.lede} delay={160}>
            <p>{lede}</p>
          </Reveal>
        ) : null}
      </div>
      {children ? (
        <Reveal className={styles.extra} delay={240}>
          {children}
        </Reveal>
      ) : null}
    </header>
  );
}
