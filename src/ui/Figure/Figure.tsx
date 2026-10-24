import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Figure.module.css';

export interface FigureProps {
  /** @deprecated No effect. "FIG x.x" labels were removed from the page. */
  fig?: string;
  /**
   * @deprecated Almost no effect. Captions are not printed: a visual should explain itself. Only a real
   * sentence (a string of 56 characters or more, or any non-string node) survives, as one quiet plain
   * line under the visual. Say it in the section's own copy instead.
   */
  caption?: ReactNode;
  /** Right side of the quiet row under the visual: a legend, `Sources`. Renders only if given. */
  aside?: ReactNode;
  /** Draw dimension rulers along the left and bottom (hard-edged ticks). A rare accent. Default false. */
  rulers?: boolean;
  /** A single hairline around the stage. Default false: content sits directly on the page. */
  frame?: boolean;
  children: ReactNode;
  className?: string;
  /** Class for the inner stage. */
  stageClassName?: string;
}

/** Shorter than this and a string caption is a label, not a sentence: it is dropped. */
const SENTENCE = 56;

function quietNote(caption: ReactNode): ReactNode {
  if (caption == null || caption === false || caption === '') return null;
  if (typeof caption !== 'string') return caption;
  return caption.length >= SENTENCE ? caption.replace(/\.+$/, '') : null;
}

/**
 * The frame for anything that is a picture: a diagram, a map, a simulation. Restyle v2: bare. No FIG
 * label, no caption bar, no box, no crosshairs. The stage is just a positioned, contained region; the
 * optional row under it holds only a legend or `Sources`, and a genuinely long caption as one plain
 * sentence.
 */
export function Figure({ caption, aside, rulers = false, frame = false, children, className, stageClassName }: FigureProps) {
  const note = quietNote(caption);
  return (
    <figure className={cn(styles.figure, className)} data-rulers={rulers || undefined} data-frame={frame || undefined}>
      <div className={cn(styles.stage, stageClassName)}>{children}</div>
      {note || aside ? (
        <figcaption className={styles.caption}>
          {note ? <span className={styles.note}>{note}</span> : null}
          {aside ? <span className={styles.aside}>{aside}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
