/**
 * Chapter 05, where things sit on a lane's canvas. Positions are real where they can be: a site is
 * projected from its real latitude and longitude onto a flat map. A real network is lumpy (hundreds
 * of nodes in a few cells), so a site keeps its place only roughly: sites and the nodes inside them
 * are pushed apart until every one has room to be aimed at. It is a cartogram, not a survey.
 *
 * Pure functions, no DOM: the same inputs give the same picture, and a lane can be laid out again
 * on resize without anyone noticing.
 */
import type { LaneWorld } from '../sim/world';

/** The part of the world a lane draws: a lat/lon box, shared by both lanes so they read as one planet. */
export interface Domain {
  latTop: number;
  latBottom: number;
  lonLeft: number;
  lonRight: number;
}

export interface SiteShape {
  cx: number;
  cy: number;
  /** Outline radius around the hosts. */
  rad: number;
  hosts: number[];
}

export interface RegionShape {
  cx: number;
  cy: number;
  rad: number;
}

export interface CountryLabel {
  code: string;
  x: number;
  y: number;
}

export interface Layout {
  w: number;
  h: number;
  /** Host radius. */
  r: number;
  x: Float32Array;
  y: Float32Array;
  /** The gateway: where requests come in. */
  gx: number;
  gy: number;
  /** The map rectangle (for the land backdrop) and its scale in px per degree, east-west and north-south. */
  mapX: number;
  mapY: number;
  mapW: number;
  mapH: number;
  scale: number;
  scaleY: number;
  domain: Domain;
  sites: SiteShape[];
  regions: RegionShape[];
  labels: CountryLabel[];
}

/** Room above the map for the gateway, and below it for the labels and the button that sit on the field's lower edge. */
const TOP_PAD = 34;
const BOTTOM_PAD = 32;
const SIDE_PAD = 12;

/**
 * How far the map may be stretched north-south against east-west to fill a tall field. The land is
 * dots, so a stretch only spaces the rows out; it keeps nodes in the crowded north from sitting on top of each other.
 */
const STRETCH_MIN = 0.8;
const STRETCH_MAX = 1.5;

/** The lat/lon box that holds every host of every world, with a margin of a few degrees. */
export function domainOf(worlds: readonly LaneWorld[]): Domain {
  let latTop = -90;
  let latBottom = 90;
  let lonLeft = 180;
  let lonRight = -180;
  for (const w of worlds) {
    for (let i = 0; i < w.n; i++) {
      latTop = Math.max(latTop, w.lat[i]!);
      latBottom = Math.min(latBottom, w.lat[i]!);
      lonLeft = Math.min(lonLeft, w.lon[i]!);
      lonRight = Math.max(lonRight, w.lon[i]!);
    }
  }
  if (latTop < latBottom) return { latTop: 75, latBottom: -45, lonLeft: -130, lonRight: 160 };
  // A margin, and a floor on the span so a small fallback set still shows a planet.
  const pad = 12;
  latTop = Math.min(84, latTop + pad);
  latBottom = Math.max(-60, latBottom - pad);
  lonLeft = Math.max(-180, lonLeft - pad);
  lonRight = Math.min(180, lonRight + pad);
  if (lonRight - lonLeft < 200) {
    const mid = (lonLeft + lonRight) / 2;
    lonLeft = Math.max(-180, mid - 100);
    lonRight = Math.min(180, mid + 100);
  }
  if (latTop - latBottom < 90) {
    const mid = (latTop + latBottom) / 2;
    latTop = Math.min(84, mid + 45);
    latBottom = Math.max(-60, mid - 45);
  }
  return { latTop, latBottom, lonLeft, lonRight };
}

/** Offsets of the k hosts of one site, as a small hex flower around its centre, in units of the host spacing. */
function flower(k: number, out: number[]): void {
  out.length = 0;
  if (k === 1) {
    out.push(0, 0);
    return;
  }
  if (k === 2) {
    out.push(-0.5, 0, 0.5, 0);
    return;
  }
  if (k === 3) {
    out.push(-0.5, 0.29, 0.5, 0.29, 0, -0.58);
    return;
  }
  // The centre, then a ring of six, then a ring of twelve.
  out.push(0, 0);
  const ring1 = Math.min(6, k - 1);
  for (let i = 0; i < ring1; i++) {
    const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
    out.push(Math.cos(a), Math.sin(a));
  }
  const ring2 = Math.max(0, k - 1 - ring1);
  for (let i = 0; i < ring2; i++) {
    const a = -Math.PI / 2 + (i / Math.max(1, ring2)) * Math.PI * 2 + 0.26;
    out.push(2 * Math.cos(a), 2 * Math.sin(a));
  }
}

export function layoutLane(world: LaneWorld, domain: Domain, w: number, h: number): Layout {
  const r = Math.max(4.8, Math.min(9, w / 66));
  const spacing = r * 2.3;
  const availW = Math.max(40, w - 2 * SIDE_PAD);
  const availH = Math.max(40, h - TOP_PAD - BOTTOM_PAD);
  const lonSpan = domain.lonRight - domain.lonLeft;
  const latSpan = domain.latTop - domain.latBottom;
  let scale = availW / lonSpan;
  let scaleY = availH / latSpan;
  if (scaleY > scale * STRETCH_MAX) scaleY = scale * STRETCH_MAX;
  else if (scaleY < scale * STRETCH_MIN) scale = scaleY / STRETCH_MIN;
  const mapW = lonSpan * scale;
  const mapH = latSpan * scaleY;
  const mapX = (w - mapW) / 2;
  const mapY = TOP_PAD + (availH - mapH) / 2;
  const px = (lon: number) => mapX + (lon - domain.lonLeft) * scale;
  const py = (lat: number) => mapY + (domain.latTop - lat) * scaleY;

  // Group hosts by site.
  const bySite: number[][] = Array.from({ length: world.nSites }, () => []);
  for (let i = 0; i < world.n; i++) bySite[world.site[i]!]!.push(i);

  const nSites = world.nSites;
  const sx = new Float32Array(nSites);
  const sy = new Float32Array(nSites);
  const hx = new Float32Array(nSites);
  const hy = new Float32Array(nSites);
  const srad = new Float32Array(nSites);
  for (let s = 0; s < nSites; s++) {
    const first = bySite[s]![0]!;
    sx[s] = hx[s] = px(world.lon[first]!);
    sy[s] = hy[s] = py(world.lat[first]!);
    const k = bySite[s]!.length;
    srad[s] = k === 1 ? r + 1 : r + spacing * (k <= 3 ? 0.62 : k <= 7 ? 1 : 2) + 1.5;
  }

  // Push the sites apart, keeping each one on a leash to its true position.
  const gap = 3;
  const minX = SIDE_PAD;
  const maxX = w - SIDE_PAD;
  const minY = TOP_PAD - 6;
  const maxY = h - BOTTOM_PAD + 2;
  for (let iter = 0; iter < 140; iter++) {
    for (let a = 0; a < nSites; a++) {
      for (let b = a + 1; b < nSites; b++) {
        let dx = sx[b]! - sx[a]!;
        let dy = sy[b]! - sy[a]!;
        let d = Math.hypot(dx, dy);
        const min = srad[a]! + srad[b]! + gap;
        if (d >= min) continue;
        if (d < 0.01) {
          // Exactly on top of each other: split along a fixed, distinct direction.
          const ang = (a * 2.399 + b * 1.7) % (Math.PI * 2);
          dx = Math.cos(ang);
          dy = Math.sin(ang);
          d = 1;
        }
        const push = (min - d) / 2;
        const ux = dx / d;
        const uy = dy / d;
        sx[a]! -= ux * push;
        sy[a]! -= uy * push;
        sx[b]! += ux * push;
        sy[b]! += uy * push;
      }
    }
    for (let s = 0; s < nSites; s++) {
      sx[s] = Math.min(maxX - srad[s]!, Math.max(minX + srad[s]!, sx[s]! + (hx[s]! - sx[s]!) * 0.035));
      sy[s] = Math.min(maxY - srad[s]!, Math.max(minY + srad[s]!, sy[s]! + (hy[s]! - sy[s]!) * 0.035));
    }
  }

  // Hosts inside their sites.
  const x = new Float32Array(world.n);
  const y = new Float32Array(world.n);
  const off: number[] = [];
  const sites: SiteShape[] = [];
  for (let s = 0; s < nSites; s++) {
    const hosts = bySite[s]!;
    flower(hosts.length, off);
    hosts.forEach((hi, k) => {
      x[hi] = sx[s]! + off[k * 2]! * spacing;
      y[hi] = sy[s]! + off[k * 2 + 1]! * spacing;
    });
    sites.push({ cx: sx[s]!, cy: sy[s]!, rad: srad[s]! - 1, hosts });
  }

  // Regions (the cloud lane): a ring around each country's sites.
  const regions: RegionShape[] = [];
  if (world.kind === 'cloud') {
    for (let c = 0; c < world.countryCodes.length; c++) {
      let cx = 0;
      let cy = 0;
      let n = 0;
      for (let i = 0; i < world.n; i++) {
        if (world.country[i] !== c) continue;
        cx += x[i]!;
        cy += y[i]!;
        n++;
      }
      if (!n) continue;
      cx /= n;
      cy /= n;
      let rad = 0;
      for (let i = 0; i < world.n; i++) if (world.country[i] === c) rad = Math.max(rad, Math.hypot(x[i]! - cx, y[i]! - cy));
      regions.push({ cx, cy, rad: rad + r + 7 });
    }
  }

  // A two-letter label for each country that has several hosts, above its topmost one.
  const labels: CountryLabel[] = [];
  if (world.kind !== 'cloud') {
    const placed: { x: number; y: number }[] = [];
    const counts = new Map<number, number>();
    for (let i = 0; i < world.n; i++) counts.set(world.country[i]!, (counts.get(world.country[i]!) ?? 0) + 1);
    const order = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
    for (const [c] of order) {
      let cx = 0;
      let top = Infinity;
      let n = 0;
      for (let i = 0; i < world.n; i++) {
        if (world.country[i] !== c) continue;
        cx += x[i]!;
        top = Math.min(top, y[i]!);
        n++;
      }
      cx /= n;
      const ly = top - r - 7;
      if (ly < 10) continue;
      if (placed.some((p) => Math.abs(p.x - cx) < 22 && Math.abs(p.y - ly) < 11)) continue;
      // Not under the gateway's link, and not on top of any node: a label that would collide is left out.
      if (Math.abs(cx - w / 2) < 16 && ly < TOP_PAD + 10) continue;
      let clear = true;
      for (let i = 0; i < world.n && clear; i++) clear = Math.abs(x[i]! - cx) > r + 10 || Math.abs(y[i]! - ly) > r + 5;
      if (!clear) continue;
      placed.push({ x: cx, y: ly });
      labels.push({ code: world.countryCodes[c]!, x: cx, y: ly });
    }
  }

  return { w, h, r, x, y, gx: w / 2, gy: 16, mapX, mapY, mapW, mapH, scale, scaleY, domain, sites, regions, labels };
}
