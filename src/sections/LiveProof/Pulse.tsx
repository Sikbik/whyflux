import { cn } from '@/lib/cn';
import styles from './Pulse.module.css';

/**
 * "This one is live", said with motion instead of a badge: a solid dot and one hairline ring that
 * leaves it every couple of seconds. Hard edges only (no glow). Decorative: the word "live" is read
 * out by whoever places it. Still under reduced motion.
 */
export function Pulse({ className }: { className?: string }) {
  return <span className={cn(styles.pulse, className)} aria-hidden="true" />;
}
