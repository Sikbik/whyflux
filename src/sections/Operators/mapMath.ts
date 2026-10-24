/**
 * Map math for the node map: an equirectangular view of the world, and the hex lattice of land dots
 * drawn in screen space (so a dot is the same size at every width).
 */
import { LAND_H } from '@/lib/globe/landmask.generated';
import { isLand } from '@/lib/globe/landmask';

/** The centre of the view in degrees and its scale in CSS pixels per degree. */
export interface View {
  cx: number;
  cy: number;
  k: number;
}

/**
 * The world, minus the polar caps where there is nothing to show (Antarctica holds no nodes, the far
 * north is ocean), so the map is as large as it can be.
 */
const WORLD = { lon0: -180, lon1: 180, lat0: -56, lat1: 80 } as const;

const SIN60 = Math.sqrt(3) / 2;

/** The view that fits the whole world in a w x h box. */
export function fitWorld(w: number, h: number): View {
  const k = Math.min(w / (WORLD.lon1 - WORLD.lon0), h / (WORLD.lat1 - WORLD.lat0));
  return { cx: (WORLD.lon0 + WORLD.lon1) / 2, cy: (WORLD.lat0 + WORLD.lat1) / 2, k };
}

export function toScreen(v: View, w: number, h: number, lon: number, lat: number): [number, number] {
  return [w / 2 + (lon - v.cx) * v.k, h / 2 - (lat - v.cy) * v.k];
}

export function toGeo(v: View, w: number, h: number, x: number, y: number): [number, number] {
  return [v.cx + (x - w / 2) / v.k, v.cy - (y - h / 2) / v.k];
}

/**
 * The shared land mask was baked with its antimeridian polygons filled the wrong way, so three bands of
 * rows are damaged: Chukotka (rows 41 to 49, 65 to 69 degrees north) is inverted, with a 196 degree
 * stripe of "land" over North America and the Atlantic and the Siberian coast missing; row 37 carries
 * a stray run across the Norwegian Sea; and Fiji (rows 212 and 213, 16 to 17 degrees south) paints a
 * 220 degree stripe across the oceans. A damaged row is read as the land of the two clean rows that
 * bound it (so a peninsula keeps its width). Reported to the owner of src/lib/globe.
 */
const REPAIR: ReadonlyArray<{ from: number; to: number; above: number; below: number }> = [
  { from: 37, to: 37, above: 36, below: 38 },
  { from: 41, to: 49, above: 40, below: 50 },
  { from: 212, to: 213, above: 211, below: 214 },
];

const rowLat = (row: number): number => 90 - (row + 0.5) * (180 / LAND_H);

function landAt(lat: number, lon: number): boolean {
  const row = Math.floor(((90 - lat) / 180) * LAND_H);
  const band = REPAIR.find((b) => row >= b.from && row <= b.to);
  return band ? isLand(rowLat(band.above), lon) || isLand(rowLat(band.below), lon) : isLand(lat, lon);
}

export interface Lattice {
  cols: number;
  rows: number;
  pitch: number;
  rowH: number;
  /** 1 where the dot sits on land. */
  land: Uint8Array;
  /** 1 where it is land with water beside it: the coastline. */
  edge: Uint8Array;
}

/** Odd rows are shifted half a cell right; these are the six neighbours of a cell in that layout. */
function neighbours(i: number, j: number): [number, number][] {
  return j % 2
    ? [[i - 1, j], [i + 1, j], [i, j - 1], [i + 1, j - 1], [i, j + 1], [i + 1, j + 1]]
    : [[i - 1, j], [i + 1, j], [i - 1, j - 1], [i, j - 1], [i - 1, j + 1], [i, j + 1]];
}

/** The land dots for a view: a hex lattice in screen space, each cell asking the land mask what is under it. */
export function buildLattice(v: View, w: number, h: number, pitch: number): Lattice {
  const rowH = pitch * SIN60;
  const cols = Math.ceil(w / pitch) + 2;
  const rows = Math.ceil(h / rowH) + 2;
  const land = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    const y = j * rowH - rowH;
    for (let i = 0; i < cols; i++) {
      const x = i * pitch - pitch + (j % 2 ? pitch / 2 : 0);
      const [lon, lat] = toGeo(v, w, h, x, y);
      // Only the part of the world the map is about: no Antarctic coast on a tall phone stage.
      if (lon >= -180 && lon <= 180 && lat >= WORLD.lat0 && lat <= WORLD.lat1 && landAt(lat, lon)) land[j * cols + i] = 1;
    }
  }
  const edge = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (!land[j * cols + i]) continue;
      for (const [a, b] of neighbours(i, j)) {
        if (a < 0 || b < 0 || a >= cols || b >= rows || !land[b * cols + a]) {
          edge[j * cols + i] = 1;
          break;
        }
      }
    }
  }
  return { cols, rows, pitch, rowH, land, edge };
}

/** Where to start the ignite from: the visitor's own part of the world, guessed from the time zone. Europe if unsure. */
export function guessOrigin(): { lon: number; lat: number } {
  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    tz = '';
  }
  const south = /^America\/(Argentina|Sao_Paulo|Bogota|Lima|Santiago|Caracas|La_Paz|Montevideo|Asuncion|Guayaquil|Guyana|Paramaribo|Cayenne|Manaus|Bahia|Fortaleza|Recife)/;
  if (south.test(tz)) return { lon: -58, lat: -15 };
  if (tz.startsWith('America/') || tz.startsWith('US/') || tz.startsWith('Canada/')) return { lon: -98, lat: 40 };
  if (tz.startsWith('Asia/') || tz.startsWith('Indian/')) return { lon: 85, lat: 28 };
  if (tz.startsWith('Australia/') || tz.startsWith('Pacific/')) return { lon: 135, lat: -25 };
  if (tz.startsWith('Africa/')) return { lon: 20, lat: 5 };
  return { lon: 10, lat: 50 };
}
