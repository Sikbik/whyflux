import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Platform } from '@/data/types';
import { cellFor, platformsOfKind } from '@/lib/compare';
import { IconButton } from '@/ui';
import { HexGlyph, HexPips } from './Glyph';
import { Marker } from './Marker';
import { FLUX_ID, GROUPED_DIMENSIONS, ORDERED_DIMENSIONS, platformById, verdictWord } from './model';
import { DEFAULT_VS } from './state';
import styles from './MatrixPhone.module.css';

export interface MatrixPhoneProps {
  openKey: string | null;
  /** A platform a link named (`?vs=`): its row is picked out. */
  picked: string | null;
  onOpenReceipt: (platformId: string, dimensionId: string, anchor: HTMLElement) => void;
  onVersus: (platformId: string) => void;
}

const scoreOf = (platformId: string, dimId: string): number => {
  const c = cellFor(platformId, dimId);
  return !c || c.verdict === 'na' ? -1 : c.score;
};

/**
 * The matrix on a phone: 14 columns cannot fit, so it becomes one question at a time. A strip of 14
 * hexagons (Flux's own answer to each, in group order) is the picker; below it, every platform's
 * answer to the chosen question, Flux pinned first and the rest from strongest to weakest. Tap a row
 * for its receipt.
 */
export function MatrixPhone({ openKey, picked, onOpenReceipt, onVersus }: MatrixPhoneProps) {
  const [i, setI] = useState(0);
  const n = ORDERED_DIMENSIONS.length;
  const dim = ORDERED_DIMENSIONS[i];

  const rows = useMemo<Platform[]>(() => {
    if (!dim) return [];
    const flux = platformById(FLUX_ID);
    const others = [...platformsOfKind('depin'), ...platformsOfKind('web2')]
      .map((p, k) => ({ p, k, s: scoreOf(p.id, dim.id) }))
      .sort((a, b) => b.s - a.s || a.k - b.k)
      .map((x) => x.p);
    return flux ? [flux, ...others] : others;
  }, [dim]);

  if (!dim) return null;
  const step = (d: number) => setI((v) => (v + d + n) % n);

  let offset = 0;
  return (
    <div className={styles.phone}>
      <ol className={styles.strip} aria-label="Pick a question">
        {GROUPED_DIMENSIONS.map((g) => (
          <li key={g.group} className={styles.group}>
            {g.dimensions.map((d) => {
              const idx = offset++;
              const c = cellFor(FLUX_ID, d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  className={styles.hex}
                  data-on={idx === i || undefined}
                  aria-pressed={idx === i}
                  aria-label={`${idx + 1}. ${d.label}`}
                  onClick={() => setI(idx)}
                >
                  <HexGlyph score={c?.score ?? 0} verdict={c?.verdict ?? 'no'} size={19} />
                </button>
              );
            })}
          </li>
        ))}
      </ol>

      <header className={styles.head}>
        <IconButton variant="ghost" size="sm" aria-label="Previous question" icon={<ChevronLeft size={18} />} onClick={() => step(-1)} />
        <div className={styles.title}>
          <h3>{dim.label}</h3>
          <p>{dim.question}</p>
        </div>
        <IconButton variant="ghost" size="sm" aria-label="Next question" icon={<ChevronRight size={18} />} onClick={() => step(1)} />
      </header>

      <ul role="list" className={styles.list} aria-live="polite">
        {rows.map((p) => {
          const c = cellFor(p.id, dim.id);
          if (!c) return null;
          const key = `${p.id}:${dim.id}`;
          const na = c.verdict === 'na';
          return (
            <li key={p.id}>
              <button
                type="button"
                className={styles.row}
                data-kind={p.kind}
                data-picked={picked === p.id || undefined}
                data-open={openKey === key || undefined}
                aria-haspopup="dialog"
                aria-label={`${p.name}, ${verdictWord(c.verdict)}${na ? '' : `, ${c.score} out of 5`}. ${c.short}. Open the receipt.`}
                onClick={(e) => onOpenReceipt(p.id, dim.id, e.currentTarget)}
              >
                <span className={styles.name}>
                  <Marker platform={p} size={12} mono />
                  <b>{p.name}</b>
                </span>
                <span className={styles.meter}>
                  {na ? <em>n/a</em> : <HexPips score={c.score} size={15} />}
                  <b>{na ? '' : c.score}</b>
                </span>
                <span className={styles.short}>{c.short}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className={styles.hint}>
        Tap a platform for its receipt{' '}
        <span aria-hidden="true">&middot;</span>{' '}
        <button type="button" className={styles.link} onClick={() => onVersus(DEFAULT_VS)}>
          Head to head instead
        </button>
      </p>
    </div>
  );
}
