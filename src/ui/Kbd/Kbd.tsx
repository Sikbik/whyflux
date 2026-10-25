import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Kbd.module.css';

/** A key cap: `<Kbd>Esc</Kbd>`. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn(styles.kbd, className)}>{children}</kbd>;
}
