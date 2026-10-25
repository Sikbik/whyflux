/**
 * Shareable state in the URL. Sections that have something worth sharing (the arena's matchup,
 * the simulation's scenario) keep it in a query parameter so a link reproduces the view:
 *
 *   const [vs, setVs] = useUrlParam('vs');          // ?vs=akash
 *
 * Writes use replaceState (the back button is for pages, not for every chip click) and keep the
 * hash and every other parameter. Reads work during the first render, so a shared link opens
 * on the right matchup with no flash.
 */
import { useCallback, useSyncExternalStore } from 'react';

const EVENT = 'whyflux:urlchange';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function readParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function writeParam(key: string, value: string | null | undefined): void {
  const url = new URL(window.location.href);
  if (value == null || value === '') url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState(window.history.state, '', url);
  window.dispatchEvent(new Event(EVENT));
}

export function useUrlParam(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readParam(key),
    () => null,
  );
  const set = useCallback((v: string | null) => writeParam(key, v), [key]);
  return [value, set];
}

/** The page's canonical URL: no query, no hash. Override with VITE_SITE_URL for deploys. */
export function siteUrl(): string {
  const env = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (env) return env.replace(/\/$/, '/');
  if (typeof window === 'undefined') return 'https://whyflux.example/';
  return `${window.location.origin}${window.location.pathname}`;
}

/** A shareable link to a section with optional state: shareUrl('arena', { vs: 'akash' }). */
export function shareUrl(sectionId?: string, params: Record<string, string | null | undefined> = {}): string {
  const url = new URL(siteUrl());
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  if (sectionId) url.hash = sectionId;
  return url.toString();
}
