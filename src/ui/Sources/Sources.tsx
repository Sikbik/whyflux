import { ArrowUpRight, BookMarked } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { Source } from '@/data/types';
import { Popover } from '../Popover/Popover';
import styles from './Sources.module.css';

export interface SourcesProps {
  /** The sources of a claim, straight from src/data. Renders nothing when empty. */
  items: Source[] | undefined;
  /** Trigger text. Default "Sources". */
  label?: string;
  /** Heading inside the panel. */
  title?: string;
  className?: string;
}

/**
 * "Every number carries a source and a date": a quiet text link ("Sources" and a small icon) that
 * opens the list. Not a tag: no border, no capsule, no count. Put one next to any figure or claim
 * that came from src/data (the accuracy rule in docs/DESIGN.md).
 */
export function Sources({ items, label = 'Sources', title = 'Where this comes from', className }: SourcesProps) {
  if (!items || items.length === 0) return null;
  return (
    <Popover
      className={cn(styles.trigger, className)}
      label={`${label}: ${items.length}`}
      placement="top"
      trigger={
        <>
          <BookMarked size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>{label}</span>
        </>
      }
    >
      <p className={styles.title}>{title}</p>
      <ul className={styles.list} role="list">
        {items.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
              <span className={styles.name}>{s.label}</span>
              <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only"> (Opens in a new tab)</span>
            </a>
            <span className={styles.date}>accessed {formatDate(s.accessed)}</span>
          </li>
        ))}
      </ul>
    </Popover>
  );
}
