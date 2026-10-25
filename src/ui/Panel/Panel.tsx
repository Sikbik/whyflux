import { type ComponentPropsWithoutRef, type ElementType, type ReactNode, type Ref, useRef } from 'react';
import { cn } from '@/lib/cn';
import { useSpotlight } from '../hooks/useSpotlight';
import { useTilt } from '../hooks/useTilt';
import { mergeRefs } from '../internal/refs';
import styles from './Panel.module.css';

export type PanelCorner = 'tl' | 'tr' | 'bl' | 'br';
export type PanelCut = 'tr-bl' | 'tl-br' | 'all' | 'tl' | 'tr' | 'bl' | 'br' | 'none';
export type PanelTone = 'neutral' | 'ok' | 'warn' | 'crit' | 'cumulus' | 'nimbus' | 'stratus';

interface PanelOwnProps {
  /**
   * `glass` (default): a flat tint with a soft blur behind it. `slab`: denser, no blur (use for long
   * lists and wherever panels stack). `ghost`: the hairline only.
   */
  variant?: 'glass' | 'slab' | 'ghost';
  /** Chamfer size: sm 8 px, md 12 px (default), lg 18 px. */
  size?: 'sm' | 'md' | 'lg';
  /** Which corners are cut. `tr-bl` (default) is the family silhouette; `tl-br` is its mirror. */
  cut?: PanelCut;
  /** Inner padding. Default `md`. `none` for full-bleed media (pair with `clip`). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Recolours the hairline and the accent roles for the subtree: a status or a tier. */
  tone?: PanelTone;
  /** @deprecated No visual effect: the hot corner was a gradient glow and was removed. */
  hot?: PanelCorner | 'none';
  /** @deprecated No visual effect: the hex lattice was removed. */
  pattern?: PanelCorner | 'none';
  /** Corner crosshairs. Opt-in (default false): a rare blueprint accent, not a default. */
  marks?: boolean;
  /** A tick ruler along one inner edge. Opt-in (default none). */
  ruler?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  /**
   * Hover and press feedback: a pointer cursor on clickable cards, a hairline that firms up on hover and
   * press compression. Calm by design: no spotlight, no hover glow. Default false.
   */
  interactive?: boolean;
  /**
   * @deprecated No visual effect; the cursor spotlight was removed per user feedback. Kept so existing
   * callers still compile. Use `interactive` for hover and press feedback.
   */
  spot?: boolean;
  /** Tilt up to 5 degrees toward the pointer (needs `interactive`). A number sets the maximum. */
  tilt?: boolean | number;
  /** @deprecated No visual effect: the accent bloom was removed (no glows, no gradients). */
  halo?: boolean;
  /** Clip the content to the chamfer (for full-bleed media). Default false. */
  clip?: boolean;
  /** Make the panel a size container so children can use `@container` queries. */
  container?: boolean;
  className?: string;
  /** Class for the inner content wrapper (flex, grid, scrolling). */
  contentClassName?: string;
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

export type PanelProps<T extends ElementType = 'div'> = PanelOwnProps & {
  /** The element to render. Default `div`. Use `a`, `button`, `li`, `article`, `section`... */
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof PanelOwnProps | 'as'>;

const TIERS = new Set<string>(['cumulus', 'nimbus', 'stratus']);

/**
 * A quiet surface for an interactive instrument: a solid hairline and a flat tint, with the family's
 * chamfered silhouette. No glow, no gradient, no lattice, no crosshairs unless you ask for them. Use it
 * only where an instrument genuinely needs a surface (a simulation, a picker, a console); content
 * belongs directly on the page, never in a grid of cards and never in a card inside a card.
 *
 *   <Panel padding="lg">...</Panel>
 *   <Panel as="a" href="#arena" interactive tone="cumulus">...</Panel>
 */
export function Panel<T extends ElementType = 'div'>({
  as,
  variant = 'glass',
  size = 'md',
  cut = 'tr-bl',
  padding = 'md',
  tone = 'neutral',
  hot: _hot,
  pattern: _pattern,
  marks = false,
  ruler = 'none',
  interactive = false,
  spot: _spot,
  tilt = false,
  halo: _halo,
  clip = false,
  container = false,
  className,
  contentClassName,
  children,
  ref,
  ...rest
}: PanelProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const local = useRef<HTMLElement | null>(null);
  const tiltMax = typeof tilt === 'number' ? tilt : 5;

  useSpotlight(local, { enabled: interactive });
  useTilt(local, { max: tiltMax, enabled: interactive && tilt !== false });

  const props = rest as Record<string, unknown>;
  const clickable = Tag === 'a' || Tag === 'button' || typeof props.onClick === 'function';

  return (
    <Tag
      ref={mergeRefs(local, ref)}
      className={cn('chamfer', styles.panel, className)}
      data-cut={cut === 'tr-bl' ? undefined : cut}
      data-variant={variant}
      data-size={size}
      data-pad={padding}
      data-interactive={interactive || undefined}
      data-clickable={clickable && interactive ? 'true' : undefined}
      data-tilt={interactive && tilt !== false ? 'true' : undefined}
      data-ruler={ruler === 'none' ? undefined : ruler}
      data-clip={clip ? 'true' : undefined}
      data-container={container ? '' : undefined}
      data-tier={TIERS.has(tone) ? tone : undefined}
      data-tone={tone === 'ok' || tone === 'warn' || tone === 'crit' ? tone : undefined}
      {...rest}
    >
      <span className={styles.edge} aria-hidden="true" />
      <span className={styles.fill} aria-hidden="true" />
      {marks ? <span className={styles.marks} aria-hidden="true" /> : null}
      {ruler !== 'none' ? <span className={styles.ruler} aria-hidden="true" /> : null}
      <div className={cn(styles.content, contentClassName)}>{children}</div>
    </Tag>
  );
}
