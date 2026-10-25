/** True for absolute URLs that leave this site (http, https, protocol-relative). */
export function isExternalHref(href: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href) && !isSameOrigin(href);
}

function isSameOrigin(href: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URL(href, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** The rel for a link that opens another site. */
export const EXTERNAL_REL = 'noopener noreferrer';
