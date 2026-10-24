import { type ComponentPropsWithoutRef, type CSSProperties, type ElementType, type ReactNode, useRef } from 'react';
import { cn } from '@/lib/cn';
import { useReveal } from '../hooks/useReveal';
import styles from './Reveal.module.css';

interface RevealOwnProps {
  as?: ElementType;
  /** Delay in ms before the reveal starts (on top of the viewport trigger). */
  delay?: number;
  /** Which way it travels in from. Default `up`. `none` is opacity only. */
  from?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Add a blur-to-sharp. Only for small things (text): large blurred layers are expensive. */
  blur?: boolean;
  /** A scale-up entrance (for key art). */
  scale?: boolean;
  /** Reveal on mount instead of on entering the viewport (above the fold). */
  immediate?: boolean;
  /** Hold the reveal until this clears (an intro finishing). */
  hold?: boolean;
  /** Reveal again every time it re-enters. Default false. */
  repeat?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export type RevealProps<T extends ElementType = 'div'> = RevealOwnProps & { as?: T } & Omit<
    ComponentPropsWithoutRef<T>,
    keyof RevealOwnProps
  >;

/**
 * Scroll reveal: opacity 0 to 1 and a short travel, once, when the element enters the viewport.
 * Never hides content without JS and collapses to a plain fade under reduced motion (the tokens
 * zero the travel). Stagger siblings with `delay={i * 70}`.
 */
export function Reveal<T extends ElementType = 'div'>({
  as,
  delay = 0,
  from = 'up',
  blur = false,
  scale = false,
  immediate = false,
  hold = false,
  repeat = false,
  className,
  style,
  children,
  ...rest
}: RevealProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const ref = useRef<HTMLElement>(null);
  const shown = useReveal(ref, { immediate, hold, repeat });
  return (
    <Tag
      ref={ref}
      className={cn(styles.reveal, className)}
      data-shown={shown}
      data-from={from}
      data-blur={blur || undefined}
      data-scale={scale || undefined}
      style={{ '--delay': `${delay}ms`, ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
