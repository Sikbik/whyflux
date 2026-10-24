import { type CSSProperties, useRef, useState } from 'react';
import { ART, type ArtId, artUrl } from '@/lib/art';
import { cn } from '@/lib/cn';
import { useScrollProgress } from '../hooks/useScrollProgress';
import styles from './ArtPlate.module.css';

export interface ArtPlateProps {
  /** An id from src/lib/art.ts (the generated files in public/art). */
  src: ArtId;
  /** 0..1. Plates are backdrops: usually 0.4 to 0.9. Default 1. */
  opacity?: number;
  /** object-fit. Default cover. */
  fit?: 'cover' | 'contain';
  /** object-position, e.g. "70% 40%". Default center. */
  position?: string;
  /** Soft-fade the edges into the page: `y` top and bottom, `x` left and right, `all` a vignette. */
  fade?: 'y' | 'x' | 'all' | 'none';
  /** Parallax travel in px across the viewport (0 = none). Needs a scrolled ancestor; auto-calm under reduced motion. */
  parallax?: number;
  /** Override how it composites. Pieces on a pure black floor default to `screen`. */
  blend?: 'screen' | 'normal';
  /** Load eagerly with high priority: only for the hero. */
  priority?: boolean;
  /** Fill the nearest positioned ancestor (default) or sit in flow with the art's aspect ratio. */
  mode?: 'fill' | 'flow';
  /** Real alt text for key art; omit for decorative plates (they are aria-hidden). */
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * A generated art plate. `fill` (default) is an absolutely positioned backdrop: put it first inside
 * a positioned section. `flow` is key art that takes its place in the layout with its intrinsic
 * aspect ratio reserved (no layout shift). A missing file hides itself, so the page never shows a broken
 * image while the art is still being generated.
 */
export function ArtPlate({
  src,
  opacity = 1,
  fit = 'cover',
  position = 'center',
  fade = 'none',
  parallax = 0,
  blend,
  priority = false,
  mode = 'fill',
  alt,
  className,
  style,
}: ArtPlateProps) {
  const entry = ART[src];
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useScrollProgress(ref, { vars: parallax !== 0, mode: 'enter' });

  if (failed) return null;
  const effectiveAlt = alt ?? entry.alt;
  const mix = blend ?? entry.blend;

  return (
    <div
      ref={ref}
      className={cn(styles.plate, className)}
      data-mode={mode}
      data-fade={fade}
      data-blend={mix}
      style={
        {
          '--plate-o': opacity,
          '--par': `${parallax}px`,
          '--plate-scale': 1 + Math.abs(parallax) * 0.002,
          ...(mode === 'flow' ? { aspectRatio: `${entry.w} / ${entry.h}` } : null),
          ...style,
        } as CSSProperties
      }
    >
      <img
        className={styles.img}
        src={artUrl(src)}
        width={entry.w}
        height={entry.h}
        alt={effectiveAlt}
        aria-hidden={effectiveAlt ? undefined : true}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        style={{ objectFit: fit, objectPosition: position }}
        draggable={false}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
