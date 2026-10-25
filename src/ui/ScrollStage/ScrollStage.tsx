import { type CSSProperties, type ReactNode, type RefObject, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { Progress } from '@/lib/scroll';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScrollProgress } from '../hooks/useScrollProgress';
import styles from './ScrollStage.module.css';

export interface ScrollStageState {
  /** The current step, 0..steps-1. Updates (and re-renders) only when it changes. */
  step: number;
  steps: number;
  /** Live scroll progress 0..1 across the whole story. Read `.current.p` inside a rAF loop. */
  progress: RefObject<Progress>;
  /** True under reduced motion: swap travel and scrubbing for plain cross-fades. */
  reduced: boolean;
}

export interface ScrollStageProps {
  /** How many steps the story has. Default 1. */
  steps?: number;
  /** Scroll distance per step, in viewport heights. Default 0.9. */
  perStep?: number;
  /** Height of the pinned stage. Default `100svh`. */
  stageHeight?: string;
  /** Distance from the viewport top where the stage pins (clear the nav). Default 0. */
  top?: string;
  /** The stage content: pinned for the whole story. Render by `step`, or scrub with `progress`. */
  children: (state: ScrollStageState) => ReactNode;
  className?: string;
  stageClassName?: string;
  /** Names the story for assistive tech. */
  'aria-label'?: string;
}

/**
 * A scroll-driven story: a tall wrapper with a `position: sticky` stage inside. As the visitor
 * scrolls through the wrapper, `step` advances and `progress` runs 0..1; the stage stays pinned
 * until the story is done. Native scrolling throughout, nothing is hijacked. The wrapper also
 * carries `--p` (0..1) and `data-step`, so CSS alone can scrub (`translate: calc(var(--p) * 40vw)`).
 *
 *   <ScrollStage steps={5} top="var(--nav-h)" stageHeight="calc(100svh - var(--nav-h))">
 *     {({ step }) => <MyStage step={step} />}
 *   </ScrollStage>
 */
export function ScrollStage({
  steps = 1,
  perStep = 0.9,
  stageHeight = '100svh',
  top = '0px',
  children,
  className,
  stageClassName,
  ...aria
}: ScrollStageProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();

  const last = useRef(0);
  const progress = useScrollProgress(wrap, {
    mode: 'sticky',
    onUpdate: ({ p }) => {
      const next = Math.min(steps - 1, Math.max(0, Math.floor(p * steps)));
      if (next === last.current) return;
      last.current = next;
      setStep(next);
    },
  });

  return (
    <div
      ref={wrap}
      className={cn(styles.wrap, className)}
      data-step={step}
      style={
        {
          '--stage-h': stageHeight,
          '--stage-top': top,
          blockSize: `calc(${stageHeight} + ${(steps * perStep).toFixed(3)} * 100svh)`,
        } as CSSProperties
      }
      {...aria}
    >
      <div className={cn(styles.stage, stageClassName)}>{children({ step, steps, progress, reduced })}</div>
    </div>
  );
}
