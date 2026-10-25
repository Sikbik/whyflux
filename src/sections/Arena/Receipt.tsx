import { ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cellFor, dimensionById, platformById } from '@/lib/compare';
import { formatDate } from '@/lib/format';
import { useIsPhone } from '@/ui';
import { HexGlyph } from './Glyph';
import { Marker } from './Marker';
import { shortName, verdictWord } from './model';
import { useAnchoredPosition } from './useAnchored';
import styles from './Receipt.module.css';

export interface ReceiptTarget {
  platformId: string;
  dimensionId: string;
  /** The element that opened it: the panel sits next to it and focus returns to it. */
  anchor: HTMLElement | null;
}

export interface ReceiptProps {
  target: ReceiptTarget;
  onClose: (returnFocus: boolean) => void;
  /** Jump to the head to head with this platform. */
  onVersus: (platformId: string) => void;
}

/**
 * The receipt for one cell: the score, the one-line answer, the researcher's detail (quotes kept as
 * given), why the question matters, and every source with the date it was read. A popover beside
 * the cell on desktop and a bottom sheet on phones. The sources are listed inline rather than behind
 * a second popover, so nothing opens on top of the receipt. Set as type on a solid sheet: no labels,
 * no boxes inside the box.
 */
export function Receipt({ target, onClose, onVersus }: ReceiptProps) {
  const id = useId();
  const panel = useRef<HTMLDivElement | null>(null);
  const isPhone = useIsPhone();
  const pos = useAnchoredPosition(target.anchor, panel, !isPhone, 'side', 14);

  const cell = cellFor(target.platformId, target.dimensionId);
  const platform = platformById(target.platformId);
  const dimension = dimensionById(target.dimensionId);

  // Take focus so keyboard users land in the receipt; Escape and the close button hand it back.
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, [target.platformId, target.dimensionId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(true);
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      if (panel.current?.contains(t) || target.anchor?.contains(t)) return;
      // A dialog opened from inside the receipt (none today) is still "inside".
      if (t.closest('[role="dialog"]')) return;
      onClose(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [onClose, target.anchor]);

  if (!cell || !platform || !dimension) return null;

  const sheet = isPhone;
  const style = sheet
    ? undefined
    : { top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? ('visible' as const) : ('hidden' as const) };
  const na = cell.verdict === 'na';

  return createPortal(
    <>
      {sheet ? <div className={styles.scrim} aria-hidden="true" onClick={() => onClose(true)} /> : null}
      <div
        ref={panel}
        role="dialog"
        aria-modal={sheet || undefined}
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        className={styles.panel}
        data-sheet={sheet || undefined}
        data-placement={pos?.placement}
        style={style}
      >
        <header className={styles.head}>
          <p className={styles.who}>
            <Marker platform={platform} size={12} />
            <span className={styles.name}>{platform.name}</span>
          </p>
          <button type="button" className={styles.close} aria-label="Close the receipt" onClick={() => onClose(true)}>
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </header>

        <p className={styles.dim}>{dimension.label}</p>

        <div className={styles.score} data-flux={platform.kind === 'flux' || undefined}>
          <HexGlyph score={cell.score} verdict={cell.verdict} size={38} className={styles.glyph} />
          <p className={styles.reading}>
            <span className={styles.big}>{na ? 'n/a' : cell.score}</span>
            {na ? null : <span className={styles.of}>of 5</span>}
            <span className={styles.word}>{verdictWord(cell.verdict)}</span>
          </p>
        </div>

        <h3 id={`${id}-title`} className={styles.short}>
          {cell.short}
        </h3>
        <p className={styles.detail}>{cell.detail}</p>

        <p className={styles.why}>
          <b>{dimension.question}</b> {dimension.why}
        </p>

        <section className={styles.sources} aria-label={`Sources, ${cell.sources.length}`}>
          <ul role="list" className={styles.list}>
            {cell.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  <span>{s.label}</span>
                  <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden="true" />
                  <span className="sr-only"> (Opens in a new tab)</span>
                </a>
                <span className={styles.date}>accessed {formatDate(s.accessed)}</span>
              </li>
            ))}
          </ul>
        </section>

        {platform.kind !== 'flux' ? (
          <button type="button" className={styles.versus} onClick={() => onVersus(platform.id)}>
            Flux vs {shortName(platform)}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
