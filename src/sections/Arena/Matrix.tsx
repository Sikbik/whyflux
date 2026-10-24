import { ArrowDown, ArrowRight, ArrowUp, ChevronsUpDown } from 'lucide-react';
import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Dimension, Platform } from '@/data/types';
import { cn } from '@/lib/cn';
import { cellFor, platformsOfKind } from '@/lib/compare';
import { Tooltip, useInView, useReducedMotion } from '@/ui';
import { createTipStore, GridTip } from './GridTip';
import { HexGlyph, HexRing } from './Glyph';
import { MatrixLegend } from './Legend';
import { Marker } from './Marker';
import {
  FLUX_ID,
  GROUPED_DIMENSIONS,
  KIND_GROUP_LABEL,
  ORDERED_DIMENSIONS,
  platformById,
  verdictWord,
} from './model';
import { HowWeScored } from './Rubric';
import styles from './Matrix.module.css';

type SortState = { dim: string; dir: 'desc' | 'asc' } | null;

export interface MatrixProps {
  /** The `platformId:dimensionId` of the open receipt, so its cell keeps a ring. */
  openKey: string | null;
  /** A platform a link named (`?vs=`): its row is picked out. */
  picked: string | null;
  onOpenReceipt: (platformId: string, dimensionId: string, anchor: HTMLElement) => void;
  onVersus: (platformId: string) => void;
}

interface RowGroup {
  kind: Platform['kind'];
  label: string;
  platforms: Platform[];
}

/**
 * View 2: every platform at once. 16 platforms by 14 questions, Flux pinned on top and the only
 * blue row, a hexagon in every cell filled to its score and outlined by its verdict. Hover or focus
 * draws a crosshair and a readout; click (or Enter) opens the receipt. Click a column head to sort
 * within each kind; click a name to go head to head. One tab stop, arrow keys move. Complete on
 * purpose: every score is here, and every one has its receipt.
 */
export function Matrix({ openKey, picked, onOpenReceipt, onVersus }: MatrixProps) {
  const reduced = useReducedMotion();
  const [sort, setSort] = useState<SortState>(null);
  const [focus, setFocus] = useState({ r: 0, c: 0 });

  const content = useRef<HTMLDivElement | null>(null);
  const grid = useRef<HTMLDivElement | null>(null);
  const cross = useRef<HTMLDivElement | null>(null);
  const tip = useRef(createTipStore()).current;
  const lit = useRef<{ row: HTMLElement | null; col: HTMLElement | null }>({ row: null, col: null });
  const rowEls = useRef(new Map<string, HTMLElement>());
  const lastTops = useRef(new Map<string, number>());
  const shown = useInView(content, { once: true, threshold: 0.12 });

  const cols = ORDERED_DIMENSIONS;

  const rowGroups = useMemo<RowGroup[]>(() => {
    const out: RowGroup[] = [];
    const flux = platformById(FLUX_ID);
    if (flux) out.push({ kind: 'flux', label: KIND_GROUP_LABEL.flux, platforms: [flux] });
    for (const k of ['depin', 'web2'] as const) {
      const base = platformsOfKind(k);
      const sorted = sort
        ? base
            .map((p, i) => ({ p, i, s: scoreOrNeg(p.id, sort.dim) }))
            .sort((a, b) => (sort.dir === 'desc' ? b.s - a.s : a.s - b.s) || a.i - b.i)
            .map((x) => x.p)
        : base;
      out.push({ kind: k, label: KIND_GROUP_LABEL[k], platforms: sorted });
    }
    return out;
  }, [sort]);

  const flat = useMemo(() => rowGroups.flatMap((g) => g.platforms), [rowGroups]);

  // Rows glide to their new places when the sort changes (FLIP). Skipped under reduced motion.
  useLayoutEffect(() => {
    const prev = lastTops.current;
    const next = new Map<string, number>();
    rowEls.current.forEach((el, id) => {
      const top = el.getBoundingClientRect().top;
      next.set(id, top);
      const before = prev.get(id);
      if (!reduced && before != null && Math.abs(before - top) > 1 && typeof el.animate === 'function') {
        el.animate([{ translate: `0 ${before - top}px` }, { translate: '0 0' }], {
          duration: 460,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        });
      }
    });
    lastTops.current = next;
  }, [rowGroups, reduced]);

  const probe = useCallback(
    (el: HTMLElement | null) => {
      const c = content.current;
      const x = cross.current;
      lit.current.row?.removeAttribute('data-lit');
      lit.current.col?.removeAttribute('data-lit');
      lit.current = { row: null, col: null };
      if (!el || !c || !x) {
        if (x) x.dataset.on = 'false';
        tip.set(null);
        return;
      }
      const target = el.closest<HTMLElement>('[role="gridcell"], [role="columnheader"]') ?? el;
      const a = target.getBoundingClientRect();
      const b = c.getBoundingClientRect();
      const isCell = target.getAttribute('role') === 'gridcell';
      x.style.setProperty('--x', `${a.left - b.left}px`);
      x.style.setProperty('--w', `${a.width}px`);
      x.style.setProperty('--y', `${a.top - b.top}px`);
      x.style.setProperty('--h', `${a.height}px`);
      x.dataset.on = 'true';
      x.dataset.kind = isCell ? 'cell' : 'head';
      if (isCell) {
        const row = el.closest<HTMLElement>('[role="row"]');
        const rh = row?.querySelector<HTMLElement>('[role="rowheader"]') ?? null;
        rh?.setAttribute('data-lit', '');
        lit.current.row = rh;
        tip.set({ el, platformId: el.dataset.p ?? '', dimensionId: el.dataset.d ?? '' });
      } else {
        tip.set(null);
      }
      const dimId = el.dataset.d ?? el.dataset.hdr;
      const col = dimId ? (grid.current?.querySelector<HTMLElement>(`[data-hdr="${CSS.escape(dimId)}"]`) ?? null) : null;
      col?.setAttribute('data-lit', '');
      lit.current.col = col;
    },
    [tip],
  );

  // Anything that reshuffles the grid invalidates the crosshair.
  useEffect(() => probe(null), [probe, rowGroups]);

  const cycleSort = (dim: string) =>
    setSort((s) => (!s || s.dim !== dim ? { dim, dir: 'desc' } : s.dir === 'desc' ? { dim, dir: 'asc' } : null));

  const focusedCell = (): HTMLElement | null => {
    const a = document.activeElement;
    return a instanceof HTMLElement && grid.current?.contains(a) && a.matches(':focus-visible') ? a : null;
  };

  const onPointerOver = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cell], [data-hdr] > button');
    if (el) probe(el);
  };
  const onPointerLeave = () => probe(focusedCell());

  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-nav]');
    if (!el?.dataset.nav) return;
    const [r, c] = el.dataset.nav.split(':').map(Number);
    setFocus({ r: r ?? 0, c: c ?? 0 });
    if (el.matches(':focus-visible')) probe(el);
  };
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!grid.current?.contains(e.relatedTarget as Node | null)) probe(null);
  };

  const onClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const cellEl = t.closest<HTMLElement>('[data-cell]');
    if (cellEl?.dataset.p && cellEl.dataset.d) {
      probe(null);
      onOpenReceipt(cellEl.dataset.p, cellEl.dataset.d, cellEl);
      return;
    }
    const sortEl = t.closest<HTMLElement>('[data-sort]');
    if (sortEl?.dataset.sort) {
      cycleSort(sortEl.dataset.sort);
      return;
    }
    const vs = t.closest<HTMLElement>('[data-versus]');
    if (vs?.dataset.versus) onVersus(vs.dataset.versus);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-nav]');
    if (!el?.dataset.nav) return;
    let [r = 0, c = 0] = el.dataset.nav.split(':').map(Number);
    const lastR = flat.length - 1;
    const lastC = cols.length - 1;
    switch (e.key) {
      case 'ArrowRight':
        c = Math.min(c + 1, lastC);
        break;
      case 'ArrowLeft':
        c = Math.max(c - 1, 0);
        break;
      case 'ArrowDown':
        r = Math.min(r + 1, lastR);
        break;
      case 'ArrowUp':
        r = Math.max(r - 1, -1);
        break;
      case 'PageDown':
        r = Math.min(r + 5, lastR);
        break;
      case 'PageUp':
        r = Math.max(r - 5, -1);
        break;
      case 'Home':
        if (e.ctrlKey || e.metaKey) r = -1;
        c = 0;
        break;
      case 'End':
        if (e.ctrlKey || e.metaKey) r = lastR;
        c = lastC;
        break;
      default:
        return;
    }
    e.preventDefault();
    setFocus({ r, c });
    grid.current?.querySelector<HTMLElement>(`[data-nav="${r}:${c}"]`)?.focus();
  };

  const fr = Math.min(Math.max(focus.r, -1), flat.length - 1);
  const fc = Math.min(focus.c, cols.length - 1);
  const rowNumber = new Map(flat.map((p, i) => [p.id, i]));

  return (
    <div className={styles.matrix}>
      <div className={styles.scroller}>
        <div ref={content} className={styles.content} data-shown={shown}>
          <div ref={cross} className={styles.cross} data-on="false" aria-hidden="true">
            <span className={styles.crossRow} />
            <span className={styles.crossCol} />
          </div>

          <div
            ref={grid}
            role="grid"
            aria-label="Comparison matrix: platforms by question. Arrow keys move between cells, Enter opens the receipt."
            aria-rowcount={flat.length + 2}
            aria-colcount={cols.length + 1}
            className={styles.grid}
            style={{ '--n': cols.length } as CSSProperties}
            onPointerOver={onPointerOver}
            onPointerLeave={onPointerLeave}
            onFocus={onFocus}
            onBlur={onBlur}
            onClick={onClick}
            onKeyDown={onKeyDown}
          >
            <div role="row" className={cn(styles.row, styles.groupHead)}>
              <div role="columnheader" className={styles.corner} aria-label="Platform" />
              {GROUPED_DIMENSIONS.map((g) => (
                <div
                  key={g.group}
                  role="columnheader"
                  aria-colspan={g.dimensions.length}
                  className={styles.groupCell}
                  style={{ gridColumn: `span ${g.dimensions.length}` }}
                >
                  <span>{g.label}</span>
                </div>
              ))}
            </div>

            <div role="row" className={cn(styles.row, styles.dimHead)}>
              <div role="columnheader" className={styles.corner} aria-label="Question" />
              {cols.map((d, ci) => (
                <DimensionHead
                  key={d.id}
                  dimension={d}
                  ci={ci}
                  tabbable={fr === -1 && fc === ci}
                  sorted={sort?.dim === d.id ? sort.dir : null}
                />
              ))}
            </div>

            {rowGroups.map((g) => (
              <div key={g.kind} role="rowgroup" aria-label={g.label} className={styles.rowGroup}>
                {g.kind !== 'flux' ? (
                  <div className={styles.kindRow} aria-hidden="true">
                    <span>{g.label}</span>
                  </div>
                ) : null}
                {g.platforms.map((p) => {
                  const r = rowNumber.get(p.id) ?? 0;
                  return (
                    <MatrixRow
                      key={p.id}
                      platform={p}
                      r={r}
                      cols={cols}
                      focusCol={fr === r ? fc : -1}
                      openKey={openKey}
                      picked={picked === p.id}
                      register={(el) => {
                        if (el) rowEls.current.set(p.id, el);
                        else rowEls.current.delete(p.id);
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.foot}>
        <MatrixLegend />
        <HowWeScored />
      </div>
      <GridTip store={tip} />
    </div>
  );
}

function scoreOrNeg(platformId: string, dimId: string): number {
  const c = cellFor(platformId, dimId);
  return !c || c.verdict === 'na' ? -1 : c.score;
}

interface HeadProps {
  dimension: Dimension;
  ci: number;
  tabbable: boolean;
  sorted: 'desc' | 'asc' | null;
}

function DimensionHead({ dimension, ci, tabbable, sorted }: HeadProps) {
  const Icon = sorted === 'desc' ? ArrowDown : sorted === 'asc' ? ArrowUp : ChevronsUpDown;
  return (
    <div
      role="columnheader"
      aria-sort={sorted === 'desc' ? 'descending' : sorted === 'asc' ? 'ascending' : 'none'}
      className={styles.dimCell}
      data-hdr={dimension.id}
      data-sorted={sorted ?? undefined}
    >
      <Tooltip content={dimension.question} placement="top">
        <button
          type="button"
          className={styles.dimBtn}
          data-nav={`-1:${ci}`}
          data-sort={dimension.id}
          data-d={dimension.id}
          tabIndex={tabbable ? 0 : -1}
          aria-label={`${dimension.label}. Sort the platforms by this question.`}
        >
          <span className={styles.dimLabel}>{dimension.label}</span>
          <Icon className={styles.sortIcon} size={13} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}

interface RowProps {
  platform: Platform;
  r: number;
  cols: readonly Dimension[];
  focusCol: number;
  openKey: string | null;
  picked: boolean;
  register: (el: HTMLElement | null) => void;
}

const MatrixRow = memo(function MatrixRow({ platform, r, cols, focusCol, openKey, picked, register }: RowProps) {
  const isFlux = platform.kind === 'flux';
  return (
    <div
      role="row"
      aria-rowindex={r + 3}
      className={styles.row}
      data-kind={platform.kind}
      data-picked={picked || undefined}
      ref={register}
      style={{ '--r': r } as CSSProperties}
    >
      <div role="rowheader" className={styles.rowHdr}>
        {isFlux ? (
          <span className={styles.name}>
            <Marker platform={platform} size={12} />
            <b>{platform.name}</b>
          </span>
        ) : (
          <button type="button" className={styles.nameBtn} tabIndex={-1} data-versus={platform.id} title={`Head to head: Flux vs ${platform.name}`}>
            <Marker platform={platform} size={12} mono />
            <span>{platform.name}</span>
            <ArrowRight className={styles.go} size={13} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>
      {cols.map((d, ci) => {
        const cell = cellFor(platform.id, d.id);
        const key = `${platform.id}:${d.id}`;
        return (
          <div
            key={d.id}
            role="gridcell"
            className={styles.cell}
            style={{ '--c': ci } as CSSProperties}
            data-open={openKey === key || undefined}
          >
            {cell ? (
              <button
                type="button"
                className={styles.cellBtn}
                data-cell
                data-p={platform.id}
                data-d={d.id}
                data-nav={`${r}:${ci}`}
                tabIndex={focusCol === ci ? 0 : -1}
                aria-haspopup="dialog"
                aria-label={`${platform.name}, ${d.label}: ${verdictWord(cell.verdict)}${cell.verdict === 'na' ? '' : `, ${cell.score} out of 5`}. ${cell.short}`}
              >
                <HexGlyph score={cell.score} verdict={cell.verdict} size={30} animate />
                {cell.verdict === 'na' ? null : (
                  <span className={styles.digit} aria-hidden="true">
                    {cell.score}
                  </span>
                )}
                {openKey === key ? <HexRing className={styles.ring} size={40} /> : null}
              </button>
            ) : (
              <span className={styles.missing} role="img" aria-label="No data" />
            )}
          </div>
        );
      })}
    </div>
  );
});
