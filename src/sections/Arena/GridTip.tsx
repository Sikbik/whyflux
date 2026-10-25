import { useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { cellFor, dimensionById, platformById } from '@/lib/compare';
import { Marker } from './Marker';
import { verdictWord } from './model';
import { useAnchoredPosition } from './useAnchored';
import styles from './GridTip.module.css';

export interface TipState {
  el: HTMLElement;
  platformId: string;
  dimensionId: string;
}

export interface TipStore {
  get: () => TipState | null;
  set: (next: TipState | null) => void;
  subscribe: (fn: () => void) => () => void;
}

/**
 * A tiny external store, so hovering across 224 cells re-renders only the one tooltip and never the
 * grid. The matrix writes it from its delegated pointer and focus handlers.
 */
export function createTipStore(): TipStore {
  let state: TipState | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next) => {
      if (next === state || (next && state && next.el === state.el)) return;
      state = next;
      for (const l of [...listeners]) l();
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** The one shared hover and focus readout for the matrix: who, which question, the score, the one-line answer. */
export function GridTip({ store }: { store: TipStore }) {
  const state = useSyncExternalStore(store.subscribe, store.get, () => null);
  const ref = useRef<HTMLDivElement | null>(null);
  const pos = useAnchoredPosition(state?.el ?? null, ref, !!state, 'top', 6);
  if (!state) return null;

  const cell = cellFor(state.platformId, state.dimensionId);
  const platform = platformById(state.platformId);
  const dimension = dimensionById(state.dimensionId);
  if (!cell || !platform || !dimension) return null;

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      className={styles.tip}
      data-placement={pos?.placement}
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
    >
      <p className={styles.who}>
        <Marker platform={platform} size={11} />
        <span>{platform.name}</span>
        <span className={styles.dim}>{dimension.label}</span>
      </p>
      <p className={styles.line}>
        <b className={styles.score}>{cell.verdict === 'na' ? 'n/a' : `${cell.score} / 5`}</b>
        <span className={styles.verdict}>{verdictWord(cell.verdict)}</span>
        <span>{cell.short}</span>
      </p>
      <p className={styles.hint}>Click for the receipt</p>
    </div>,
    document.body,
  );
}
