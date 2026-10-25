/** Small, pure numeric helpers shared by the kit and the scenes. */

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Inverse of lerp: where `v` sits between `a` and `b` (not clamped). */
export function invLerp(a: number, b: number, v: number): number {
  return a === b ? 0 : (v - a) / (b - a);
}

/** Maps `v` from [a, b] to [c, d], clamped. */
export function remap(v: number, a: number, b: number, c: number, d: number): number {
  return lerp(c, d, clamp01(invLerp(a, b, v)));
}

/** Frame-rate independent exponential approach: `lambda` is the stiffness per second. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function smoothstep(a: number, b: number, v: number): number {
  const t = clamp01(invLerp(a, b, v));
  return t * t * (3 - 2 * t);
}

/** A window of the 0..1 progress: 0 before `from`, 1 after `to`, linear between. */
export function window01(p: number, from: number, to: number): number {
  return clamp01(invLerp(from, to, p));
}

export function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - 2 ** (-10 * t);
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
