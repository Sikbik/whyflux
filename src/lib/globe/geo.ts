import { DEG } from '@/lib/math';

/** Latitude/longitude in degrees to a point on a sphere of radius r. lon 0, lat 0 faces +z; east is +x. */
export function latLonToXyz(latDeg: number, lonDeg: number, r = 1): [number, number, number] {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const c = Math.cos(lat);
  return [r * c * Math.sin(lon), r * Math.sin(lat), r * c * Math.cos(lon)];
}

export function angleBetween(a: readonly number[], b: readonly number[]): number {
  const d = (a[0] ?? 0) * (b[0] ?? 0) + (a[1] ?? 0) * (b[1] ?? 0) + (a[2] ?? 0) * (b[2] ?? 0);
  return Math.acos(Math.min(1, Math.max(-1, d)));
}

/**
 * Points along the great circle from unit vector `a` to unit vector `b`, lifted off the surface in
 * a smooth arch whose height grows with the distance. Writes `segments + 1` points into `out`
 * starting at `offset` (3 floats each).
 */
export function arcPoints(
  a: readonly number[],
  b: readonly number[],
  segments: number,
  out: Float32Array,
  offset = 0,
  lift = 1,
): void {
  const ang = angleBetween(a, b);
  const sin = Math.sin(ang) || 1e-6;
  const h = (0.022 + 0.15 * (ang / Math.PI)) * lift;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const w1 = Math.sin((1 - t) * ang) / sin;
    const w2 = Math.sin(t * ang) / sin;
    const x = (a[0] ?? 0) * w1 + (b[0] ?? 0) * w2;
    const y = (a[1] ?? 0) * w1 + (b[1] ?? 0) * w2;
    const z = (a[2] ?? 0) * w1 + (b[2] ?? 0) * w2;
    const len = Math.hypot(x, y, z) || 1;
    const r = 1.012 + h * Math.sin(Math.PI * t);
    out[offset + i * 3] = (x / len) * r;
    out[offset + i * 3 + 1] = (y / len) * r;
    out[offset + i * 3 + 2] = (z / len) * r;
  }
}
