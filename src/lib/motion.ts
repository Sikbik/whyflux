/**
 * Reduced motion, as one external store. The effective value is the visitor's explicit choice
 * when the footer toggle mirrors it to `html[data-motion="reduced|full"]`, otherwise the OS
 * `prefers-reduced-motion`. CSS reads the same two inputs through the tokens, so JS and CSS
 * never disagree.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

export function readReducedMotion(): boolean {
  if (typeof document === 'undefined') return false;
  const mode = document.documentElement.dataset.motion;
  if (mode === 'reduced') return true;
  if (mode === 'full') return false;
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;
}

export function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia ? window.matchMedia(QUERY) : null;
  mq?.addEventListener('change', onChange);
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  return () => {
    mq?.removeEventListener('change', onChange);
    mo.disconnect();
  };
}

const KEY = 'whyflux:motion';

/** Applies a stored motion override ("reduced" | "full") to <html> before the first paint. */
export function applyStoredMotion(): void {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'reduced' || v === 'full') document.documentElement.dataset.motion = v;
  } catch {
    // storage unavailable: follow the OS
  }
}

/** Sets or clears the explicit override. `null` follows the OS again. */
export function setMotionOverride(mode: 'reduced' | 'full' | null): void {
  if (mode) document.documentElement.dataset.motion = mode;
  else delete document.documentElement.dataset.motion;
  try {
    if (mode) localStorage.setItem(KEY, mode);
    else localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
