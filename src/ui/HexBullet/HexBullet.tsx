import { cn } from '@/lib/cn';
import styles from './HexBullet.module.css';

export interface HexBulletProps {
  /** Pixel size. Default 8. */
  size?: number;
  /** Solid (default) or an outlined hexagon. */
  outline?: boolean;
  /** A soft pulse, for "live" bullets. Calm under reduced motion. */
  pulse?: boolean;
  className?: string;
}

/** The brand's hexagon as a bullet. Takes the colour of its context (`color: currentColor`). */
export function HexBullet({ size = 8, outline = false, pulse = false, className }: HexBulletProps) {
  return (
    <span
      className={cn(styles.hex, className)}
      data-outline={outline || undefined}
      data-pulse={pulse || undefined}
      style={{ inlineSize: size, blockSize: size * 1.1547 }}
      aria-hidden="true"
    />
  );
}
