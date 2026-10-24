import { useSyncExternalStore } from 'react';

/** Subscribes to a media query. `fallback` is the server and first-paint value. */
export function useMedia(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

/** A mouse or trackpad (hover capable, precise): magnetic buttons, tilt. */
export function usePointerFine(): boolean {
  return useMedia('(hover: hover) and (pointer: fine)');
}

/** True from 1100 px wide: the desktop layout. */
export function useIsDesktop(): boolean {
  return useMedia('(min-width: 1100px)', true);
}

/** True below 720 px wide: the phone layout. */
export function useIsPhone(): boolean {
  return useMedia('(max-width: 719.98px)');
}
