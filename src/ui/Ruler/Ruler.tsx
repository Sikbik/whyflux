import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import styles from './Ruler.module.css';

export interface RulerProps {
  orientation?: 'horizontal' | 'vertical';
  /** Length in CSS units. Default 100%. */
  length?: string;
  /** Distance between minor ticks in px. Default 6; majors are every 5th. */
  step?: number;
  /** Which side the ticks hang from. Default `start` (top for horizontal, left for vertical). */
  side?: 'start' | 'end';
  /** @deprecated No effect. The end fade was a gradient mask and was removed: ticks are crisp. */
  fade?: boolean;
  className?: string;
}

/** A tick ruler: minor ticks every `step` px, a major every fifth. A rare accent, never data. */
export function Ruler({ orientation = 'horizontal', length = '100%', step = 6, side = 'start', fade: _fade, className }: RulerProps) {
  return (
    <span
      className={cn(styles.ruler, className)}
      data-o={orientation}
      data-side={side}
      style={{ '--len': length, '--step': `${step}px` } as CSSProperties}
      aria-hidden="true"
    />
  );
}
