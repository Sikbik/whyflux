/**
 * The headline face: Archivo (variable weight and width), set at 800.
 *
 * `ESTIMATE` is what the face measures once loaded, so the headline's height can be reserved from
 * the first frame and nothing moves when the font arrives. Once it has, the real measurements
 * replace it (they agree to a fraction of a pixel, and a fallback face is measured, not guessed).
 */
import { advanceEm, faceMetrics } from './glyphs';
import type { Metrics } from './layout';

/** CSS font-family for the canvas: the display face, then the site's own display stack. */
export const FAMILY = '"Archivo Variable", "Montserrat Variable", "Avenir Next", "Segoe UI", system-ui, sans-serif';

/** The face's advance widths in em at weight 800, by width setting. */
const ADVANCE: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'semi-expanded': { 'Pull the plug': 6.795, 'It keeps running': 8.878, 'It keeps': 4.42, running: 4.212 },
  'semi-condensed': { 'Pull the plug': 5.438, 'It keeps running': 7.095, 'It keeps': 3.509, running: 3.421 },
};

export const ESTIMATE: Metrics = {
  adv: (text, _weight, stretch) => ADVANCE[stretch]?.[text] ?? text.length * 0.55,
  cap: 0.69,
  descent: 0.2,
};

/** Measurements from the loaded face (or whatever face the browser fell back to). */
export function measured(weight: number, stretch: string): Metrics {
  const { cap, descent } = faceMetrics(weight, stretch, FAMILY);
  return { adv: (text, w, s) => advanceEm(text, w, s, FAMILY), cap, descent };
}

/** True once the headline face itself (not a fallback) is loaded. One variable file covers every width. */
export function faceLoaded(weight: number): boolean {
  try {
    return document.fonts.check(`${weight} 64px "Archivo Variable"`);
  } catch {
    return true; // an engine that cannot say is taken at its word
  }
}

/** Resolves once the face is ready to draw with (or after two seconds: a fallback face draws legibly). */
export async function faceReady(weight: number): Promise<void> {
  const fonts = document.fonts;
  if (!fonts?.load) return;
  const load = fonts.load(`${weight} 64px ${FAMILY}`, 'Pull the plug It keeps running');
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 2000));
  await Promise.race([load.then(() => fonts.ready.then(() => undefined)), timeout]).catch(() => undefined);
}
