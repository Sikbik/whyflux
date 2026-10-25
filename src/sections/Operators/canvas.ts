/**
 * Small canvas helpers shared by the crowd and the map. Canvas cannot read CSS variables, so colours
 * are read from the element's computed style once and cached by the caller.
 */

/** "54 211 255" (a token's rgb triple) as [54, 211, 255]. */
export function readRgb(el: Element, name: string, fallback: [number, number, number]): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const parts = raw.split(/[\s,]+/).map(Number);
  return parts.length >= 3 && parts.every((n) => Number.isFinite(n)) ? [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0] : fallback;
}

export const rgba = (c: readonly [number, number, number], a: number): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/** Sizes the backing store for the device pixel ratio (capped at 2) and returns the 2D context in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

const SIN60 = Math.sqrt(3) / 2;

/** A pointy-top hexagon path centred on (x, y) with circumradius r. Call beginPath first. */
export function hexPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * SIN60, y - r / 2);
  ctx.lineTo(x + r * SIN60, y + r / 2);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * SIN60, y + r / 2);
  ctx.lineTo(x - r * SIN60, y - r / 2);
  ctx.closePath();
}

export const TAU = Math.PI * 2;
