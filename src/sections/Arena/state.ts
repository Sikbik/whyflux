/**
 * The arena's shareable state: `?view=matrix|h2h|shape`, `?vs=akash` and `?with=akash,aws`
 * (docs/DESIGN.md section 11). Every value is validated against the data, so an unknown id falls
 * back to the default instead of breaking the view. The arena opens on the matrix; `?view=h2h` (which
 * every share link carries) opens a matchup directly, and a bare `?vs=` (other chapters send one)
 * opens the matrix with that platform's row picked out.
 */
import { useCallback, useMemo } from 'react';
import { useUrlParam } from '@/lib/urlState';
import { platformById, rivals, VIEWS, type ArenaView } from './model';

export const DEFAULT_VS = 'akash';
/** The radar opens on a marketplace and a hyperscaler: the two names most people compare against. */
export const DEFAULT_WITH: readonly string[] = ['akash', 'aws'];
export const MAX_WITH = 3;

const isRival = (id: string): boolean => {
  const p = platformById(id);
  return !!p && p.kind !== 'flux';
};

export function parseVs(raw: string | null): string {
  return raw && isRival(raw) ? raw : (rivals().find((p) => p.id === DEFAULT_VS) ?? rivals()[0])?.id ?? DEFAULT_VS;
}

export function parseWith(raw: string | null): string[] {
  if (raw === 'none') return [];
  const ids = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((id, i, all) => isRival(id) && all.indexOf(id) === i)
    .slice(0, MAX_WITH);
  if (ids.length) return ids;
  return DEFAULT_WITH.filter(isRival).slice(0, MAX_WITH);
}

export interface ArenaState {
  view: ArenaView;
  setView: (v: ArenaView) => void;
  /** The opponent for head to head: `?vs=`, else the default. */
  vs: string;
  setVs: (id: string) => void;
  /** The platform a link named with `?vs=`, or null. The matrix picks its row out. */
  named: string | null;
  withIds: string[];
  /** Toggles one platform on the radar; a fourth pick replaces the oldest. */
  toggleWith: (id: string) => void;
}

export function useArenaState(): ArenaState {
  const [viewRaw, writeView] = useUrlParam('view');
  const [vsRaw, writeVs] = useUrlParam('vs');
  const [withRaw, writeWith] = useUrlParam('with');

  const view: ArenaView = (VIEWS as readonly string[]).includes(viewRaw ?? '') ? (viewRaw as ArenaView) : 'matrix';
  const vs = parseVs(vsRaw);
  const named = vsRaw && isRival(vsRaw) ? vsRaw : null;
  const withIds = useMemo(() => parseWith(withRaw), [withRaw]);

  const setView = useCallback((v: ArenaView) => writeView(v), [writeView]);
  const setVs = useCallback((id: string) => writeVs(id), [writeVs]);
  const toggleWith = useCallback(
    (id: string) => {
      const next = withIds.includes(id) ? withIds.filter((x) => x !== id) : [...withIds, id].slice(-MAX_WITH);
      const isDefault = next.length === DEFAULT_WITH.length && next.every((x, i) => x === DEFAULT_WITH[i]);
      writeWith(isDefault ? null : next.length ? next.join(',') : 'none');
    },
    [withIds, writeWith],
  );

  return { view, setView, vs, setVs, named, withIds, toggleWith };
}
