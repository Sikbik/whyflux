import { ArrowUpRight } from 'lucide-react';
import type { Source } from '@/data/types';
import { formatDate } from '@/lib/format';
import { Popover } from '@/ui';
import css from './Receipts.module.css';

/** Splits `inline code` out of a data string. Strings without backticks pass through untouched. */
function Rich({ text }: { text: string }) {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className={css.code}>
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

export interface ReceiptsProps {
  /** The data's own text for the step: the detail the picture leaves out. */
  body: string;
  /** Where it comes from. */
  sources: Source[];
}

/**
 * The step's receipts, on demand: the data's full sentence and the links behind it. The story itself stays
 * to a title and a line; anyone who wants the detail opens this.
 */
export function Receipts({ body, sources }: ReceiptsProps) {
  if (!body && sources.length === 0) return null;
  return (
    <Popover
      className={css.trigger}
      panelClassName={css.panel}
      label="Details and sources for this step"
      placement="top"
      trigger={<span>Details</span>}
    >
      {body ? (
        <p className={css.body}>
          <Rich text={body} />
        </p>
      ) : null}
      {sources.length > 0 ? (
        <ul className={css.list} role="list">
          {sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className={css.link}>
                <span>{s.label}</span>
                <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
                <span className="sr-only"> (Opens in a new tab)</span>
              </a>
              <span className={css.date}>accessed {formatDate(s.accessed)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Popover>
  );
}
