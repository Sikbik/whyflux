/**
 * The illustrative fallback network: used for the first moments before the real node points arrive,
 * and whenever they never do. It is NOT data. The UI labels it "illustrative" while it is showing.
 *
 * Sites cluster around well-known hosting hubs on land, with a tier mix that follows the counts it
 * is given (or a neutral 50/25/25 when there are none), so the picture reads like the real network
 * without claiming anything about it.
 */
import type { NodeTierId } from '@/data/types.ts';
import type { NodePoint } from '@/lib/live';
import { gauss, mulberry32 } from '@/lib/rng';
import { isLand } from './landmask';

/** [lat, lon, spread (deg), relative weight] */
const HUBS: readonly [number, number, number, number][] = [
  [50.4, 11.5, 2.4, 10], // Germany
  [60.2, 24.9, 1.6, 8], // Finland
  [48.9, 2.4, 1.8, 6], // France
  [51.5, -0.5, 1.4, 3], // UK
  [52.4, 5.0, 1.2, 3], // Netherlands
  [52.2, 21.0, 2.2, 3], // Poland
  [55.7, 12.6, 1.6, 3], // Denmark
  [59.9, 10.7, 2.4, 1.5], // Norway
  [41.9, 12.5, 2.5, 1], // Italy
  [40.4, -3.7, 2.2, 1.5], // Spain
  [50.4, 30.5, 2.5, 1.5], // Ukraine
  [55.7, 37.6, 3, 2], // Russia west
  [39.0, -77.5, 2.4, 6], // US east
  [37.4, -121.9, 1.6, 2.5], // US west
  [41.9, -87.6, 3, 2], // US midwest
  [32.8, -96.8, 2.5, 2], // US south
  [45.5, -73.6, 1.6, 3], // Canada east
  [49.3, -123.1, 1.6, 1.2], // Canada west
  [35.7, 139.7, 1.4, 1.5], // Japan
  [1.35, 103.8, 0.5, 1.2], // Singapore
  [22.3, 114.2, 0.8, 0.6], // Hong Kong
  [-33.9, 151.2, 1.4, 1.1], // Australia
  [-23.5, -46.6, 1.6, 0.6], // Brazil
  [-33.4, -70.7, 1, 0.8], // Chile
  [-26.2, 28.0, 1.4, 0.6], // South Africa
  [26.2, 50.6, 0.6, 0.8], // Bahrain
  [25.2, 55.3, 0.8, 0.5], // UAE
  [19.1, 72.9, 1.4, 0.4], // India
];

export function proceduralSites(
  count: number,
  tiers: Record<NodeTierId, number>,
  seed = 7,
): NodePoint[] {
  const rand = mulberry32(seed);
  const total = tiers.cumulus + tiers.nimbus + tiers.stratus;
  const mix = total > 0 ? [tiers.cumulus / total, tiers.nimbus / total, tiers.stratus / total] : [0.5, 0.25, 0.25];
  const wsum = HUBS.reduce((s, h) => s + h[3], 0);
  const out: NodePoint[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    let pick = rand() * wsum;
    let hub = HUBS[0];
    for (const h of HUBS) {
      pick -= h[3];
      if (pick <= 0) {
        hub = h;
        break;
      }
    }
    if (!hub) continue;
    const lat = Math.max(-80, Math.min(80, hub[0] + gauss(rand) * hub[2]));
    const lon = hub[1] + (gauss(rand) * hub[2]) / Math.max(0.35, Math.cos((lat * Math.PI) / 180));
    if (!isLand(lat, lon)) continue;
    const r = rand();
    const tier: NodeTierId = r < (mix[0] ?? 0.5) ? 'cumulus' : r < (mix[0] ?? 0.5) + (mix[1] ?? 0.25) ? 'nimbus' : 'stratus';
    out.push({ lat, lon, tier, weight: 1 + Math.floor(rand() * rand() * 6) });
  }
  return out;
}
