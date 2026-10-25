import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Marquee.module.css';

export interface MarqueeProps {
  children: ReactNode;
  /** Seconds for one full loop. Default 48. */
  duration?: number;
  reverse?: boolean;
  /** Pause while hovered or focused inside. Default true. */
  pauseOnHover?: boolean;
  /** @deprecated No effect. The end fade was a gradient mask and was removed. */
  fade?: boolean;
  /** Names the strip for assistive tech; decorative strips pass aria-hidden instead. */
  'aria-hidden'?: boolean;
  className?: string;
}

/**
 * An endless horizontal strip. The children render twice (the second copy is aria-hidden), so
 * the loop is seamless at any width. Under reduced motion it holds still. Decorative strips of
 * pure type should be `aria-hidden`.
 */
export function Marquee({
  children,
  duration = 48,
  reverse = false,
  pauseOnHover = true,
  fade: _fade,
  className,
  ...rest
}: MarqueeProps) {
  return (
    <div
      className={cn(styles.marquee, className)}
      data-pause={pauseOnHover || undefined}
      data-reverse={reverse || undefined}
      style={{ '--dur': `${duration}s` } as CSSProperties}
      {...rest}
    >
      <div className={styles.track}>
        <div className={styles.group}>{children}</div>
        <div className={styles.group} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
