import type { Platform } from '@/data/types';
import { cn } from '@/lib/cn';
import { seriesStyle } from '@/lib/compare';
import styles from './Marker.module.css';

export interface MarkerProps {
  platform: Platform;
  size?: number;
  /** Fade it back until hovered or selected (the "competitors are muted" rule). */
  muted?: boolean;
  /** Draw it in steel instead of the platform's colour: the shape alone says what kind it is. */
  mono?: boolean;
  className?: string;
}

/**
 * A platform's swatch. The colour is the platform's own, and the shape is the secondary encoding
 * from `seriesStyle()`: a diamond for Flux, a circle for DePIN, a square in a dashed ring for web2.
 * Three hue pairs repeat across kinds (Akash and Hetzner, Render and AWS, Theta and Azure), so a
 * swatch is never the only thing naming a platform: a label always sits beside it.
 */
export function Marker({ platform, size = 12, muted = false, mono = false, className }: MarkerProps) {
  const { marker, stroke } = seriesStyle(platform);
  const color = platform.kind === 'flux' ? 'var(--accent)' : mono ? 'var(--steel-500)' : stroke;
  return (
    <svg
      className={cn(styles.marker, className)}
      data-muted={muted || undefined}
      width={size}
      height={size}
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      {marker === 'diamond' ? <polygon points="6,0.6 11.4,6 6,11.4 0.6,6" fill={color} /> : null}
      {marker === 'circle' ? <circle cx="6" cy="6" r="4.6" fill={color} /> : null}
      {marker === 'square' ? (
        <>
          <rect x="2.6" y="2.6" width="6.8" height="6.8" fill={color} />
          <rect x="0.7" y="0.7" width="10.6" height="10.6" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2.2 1.6" />
        </>
      ) : null}
    </svg>
  );
}
