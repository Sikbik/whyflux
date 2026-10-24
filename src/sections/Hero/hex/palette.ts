/** Colours of the hexagon headline, read from the design tokens (with the brand values as fallback). */

export interface HexPalette {
  /** Resting brightness steps of each role, dim to bright: [quiet, loud]. */
  steps: readonly [readonly string[], readonly string[]];
  /** A node that is down: a flat dark hex, so the letter is still faintly there. */
  ghost: string;
  /** The blink of a dying node. */
  alarm: string;
  /** The brightest a hex gets. */
  white: string;
}

function token(style: CSSStyleDeclaration, name: string, fallback: string): string {
  const v = style.getPropertyValue(name).trim();
  return /^#[0-9a-f]{3,8}$/i.test(v) ? v : fallback;
}

export function readPalette(el: Element): HexPalette {
  const s = getComputedStyle(el);
  return {
    steps: [
      // Line one: cool steel, from the web2 mood palette.
      [
        token(s, '--steel-500', '#9aa6bb'),
        token(s, '--steel-300', '#c3ccdb'),
        token(s, '--steel-100', '#e1e6ef'),
        token(s, '--text-1', '#ffffff'),
      ],
      // Line two: the Flux blues.
      [
        token(s, '--accent-500', '#4f7ad4'),
        token(s, '--accent-400', '#86a1da'),
        token(s, '--accent-300', '#abbee4'),
        token(s, '--accent-100', '#e5ebf8'),
      ],
    ],
    ghost: token(s, '--accent-900', '#061843'),
    alarm: token(s, '--status-crit', '#ff5470'),
    white: token(s, '--text-1', '#ffffff'),
  };
}

export type RGB = readonly [number, number, number];

export function parseHex(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = Number.parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a: RGB, b: RGB, t: number): string {
  const c = (i: 0 | 1 | 2) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${c(0)} ${c(1)} ${c(2)})`;
}
