import { LAND_RLE, LAND_H, LAND_W } from './landmask.generated.ts';

let mask: Uint8Array | null = null;

/** The decoded equirectangular land mask (LAND_W x LAND_H, row 0 = 90N). 1 = land. */
export function landMask(): Uint8Array {
  if (mask) return mask;
  const bin = atob(LAND_RLE);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const words = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength >> 1);
  const out = new Uint8Array(LAND_W * LAND_H);
  let p = 0;
  for (let row = 0; row < LAND_H; row++) {
    const runs = words[p++] ?? 0;
    let col = 0;
    let v = 0;
    for (let r = 0; r < runs; r++) {
      const len = words[p++] ?? 0;
      if (v) out.fill(1, row * LAND_W + col, row * LAND_W + col + len);
      col += len;
      v ^= 1;
    }
  }
  mask = out;
  return out;
}

export function isLand(latDeg: number, lonDeg: number): boolean {
  const m = landMask();
  const col = Math.min(LAND_W - 1, Math.max(0, Math.floor(((lonDeg + 180) / 360) * LAND_W)));
  const row = Math.min(LAND_H - 1, Math.max(0, Math.floor(((90 - latDeg) / 180) * LAND_H)));
  return m[row * LAND_W + col] === 1;
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/**
 * Land dots on a Fibonacci lattice: `n` points spread evenly over the whole sphere, keeping the
 * ones that fall on land. Returns unit vectors (x, y, z) and a lat/lon pair per dot.
 */
export function landDots(n: number): { xyz: Float32Array; latlon: Float32Array; count: number } {
  const m = landMask();
  const xyz = new Float32Array(n * 3);
  const latlon = new Float32Array(n * 2);
  let count = 0;
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const lat = Math.asin(y);
    let lon = (i + 0.5) * GOLDEN;
    lon = ((lon + Math.PI) % (Math.PI * 2)) - Math.PI;
    const latDeg = (lat * 180) / Math.PI;
    const lonDeg = (lon * 180) / Math.PI;
    const col = Math.min(LAND_W - 1, Math.floor(((lonDeg + 180) / 360) * LAND_W));
    const row = Math.min(LAND_H - 1, Math.floor(((90 - latDeg) / 180) * LAND_H));
    if (m[row * LAND_W + col] !== 1) continue;
    const c = Math.cos(lat);
    xyz[count * 3] = c * Math.sin(lon);
    xyz[count * 3 + 1] = y;
    xyz[count * 3 + 2] = c * Math.cos(lon);
    latlon[count * 2] = latDeg;
    latlon[count * 2 + 1] = lonDeg;
    count++;
  }
  return { xyz: xyz.slice(0, count * 3), latlon: latlon.slice(0, count * 2), count };
}
