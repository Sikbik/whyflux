/**
 * The hero globe: a three.js scene that is a picture of the network and a toy at the same time.
 *
 * What is drawn: a faint planet body with a Fresnel rim and an atmosphere, a dot-matrix of land, one
 * glowing site per node cluster (tier colour, size by how many nodes are there), travelling arcs that
 * are the replicas of a handful of simulated apps, and expanding pulse rings for events.
 *
 * What it does: slow auto-rotation, drag to spin (with inertia), hover a site for a reticle. By default
 * it is a showcase: nothing on it can be clicked. With `playable` a click on a site (or `pullPlug()`)
 * knocks it out: its arcs flicker red and die, and a few moments later the apps it hosted place a
 * replacement elsewhere and the site comes back. A quiet ambient failover does the same every few
 * seconds so the picture is alive without a visitor (`ambientFailover: false` turns it off). It is a
 * SIMULATION on real node positions; wherever it is playable, the page must say so.
 *
 * Engineering: lazy (this file and three.js are one chunk), paused when the hero is offscreen or the
 * tab is hidden, a frame-time governor that drops bloom, then DPR, then dots, and a reduced-motion
 * mode with no rotation, autopilot or ambient animation.
 */
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  LineSegments,
  Mesh,
  NoToneMapping,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { NodeTierId } from '@/data/types.ts';
import type { NodePoint } from '@/lib/live';
import { clamp, damp, DEG, easeOutCubic, smoothstep } from '@/lib/math';
import { mulberry32 } from '@/lib/rng';
import { arcPoints, angleBetween, latLonToXyz } from './geo';
import { landDots } from './landmask';
import {
  arcsFrag,
  arcsVert,
  atmoFrag,
  atmoVert,
  bodyFrag,
  bodyVert,
  dotsFrag,
  dotsVert,
  lineFrag,
  lineVert,
  pulseFrag,
  pulseVert,
  sitesFrag,
  sitesVert,
  starsFrag,
  starsVert,
} from './shaders';

export type GlobeQuality = 'high' | 'medium' | 'low';

export interface GlobeSite {
  lat: number;
  lon: number;
  tier: NodeTierId;
  country?: string;
  /** Nodes of this tier in this cell. */
  weight: number;
}

export type GlobeEvent =
  | { kind: 'kill'; site: GlobeSite }
  | { kind: 'reroute'; site: GlobeSite; to: GlobeSite }
  | { kind: 'heal'; site: GlobeSite };

export interface GlobeHover {
  site: GlobeSite;
  /** Pixels from the canvas's top left. */
  x: number;
  y: number;
}

export interface GlobeOptions {
  canvas: HTMLCanvasElement;
  quality?: GlobeQuality;
  reducedMotion?: boolean;
  /** A click on a site knocks it out. Off by default: the hero globe is a showcase, not the game. */
  playable?: boolean;
  /** The ambient failover (a site goes dark every few seconds, apps re-place). Default true. */
  ambientFailover?: boolean;
  onEvent?: (e: GlobeEvent) => void;
  onHover?: (h: GlobeHover | null) => void;
  /** Called when the governor lowers the quality. */
  onQuality?: (q: GlobeQuality) => void;
  /** Called if the WebGL context is lost for good. */
  onFail?: () => void;
}

export interface GlobeController {
  setSites(points: readonly NodePoint[]): void;
  /**
   * `topPx`, when given, is where the planet's top edge should sit, in CSS pixels from the canvas
   * top (the hero uses it on phones, to place the globe in its own window under the copy).
   */
  resize(cssWidth: number, cssHeight: number, dpr: number, topPx?: number): void;
  setActive(active: boolean): void;
  /** Scroll progress of the hero, 0 at the top to 1 when it has left. */
  setScroll(p: number): void;
  setReducedMotion(reduced: boolean): void;
  /** Knocks out a random site that hosts a simulated app: the keyboard-reachable twin of a click. */
  pullPlug(): void;
  setAutopilot(on: boolean): void;
  /** The cinematic entrance. Skipped (instant) under reduced motion. */
  playIntro(): void;
  skipIntro(): void;
  readonly quality: GlobeQuality;
  dispose(): void;
}

/* ----------------------------------------------------------------------------------------- */

const FOV = 30;
/** The atmosphere shell's radius relative to the planet's. */
const ATMO_SHELL = 1.07;
const SEG = 48; // segments per arc
const PULSES = 24;
const KILL_HEAL_AFTER = 7.5; // seconds until a knocked-out site comes back
const REROUTE_AFTER = 1.15; // seconds until the apps place a replacement

const QUALITY = {
  high: { dpr: 2, bloom: true, dotShare: 1 },
  medium: { dpr: 1.5, bloom: false, dotShare: 0.7 },
  low: { dpr: 1, bloom: false, dotShare: 0.42 },
} as const;

const TIER_INDEX: Record<NodeTierId, number> = { cumulus: 0, nimbus: 1, stratus: 2 };

function hex(c: string): Color {
  return new Color(c);
}

const COLORS = {
  cumulus: hex('#36d3ff'),
  nimbus: hex('#c77dff'),
  stratus: hex('#ffc857'),
  alarm: hex('#ff5470'),
  ok: hex('#3fdc95'),
  base: hex('#040c1b'),
  rim: hex('#2b61d1'),
  dots: hex('#5c86dc'),
  hot: hex('#aec6ff'),
  arc: hex('#4f7ad4'),
};

interface Site extends GlobeSite {
  unit: [number, number, number];
}

interface ArcSlot {
  /** Site indices this arc joins, -1 when the slot is free. */
  a: number;
  b: number;
  born: number;
  dying: number;
}

interface SimApp {
  replicas: number[];
}

export async function createGlobe(opts: GlobeOptions): Promise<GlobeController> {
  const { canvas } = opts;
  let reduced = !!opts.reducedMotion;
  let quality: GlobeQuality = opts.quality ?? 'high';

  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = NoToneMapping;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1.6, 0.1, 80);
  const world = new Group();
  scene.add(world);

  const rand = mulberry32(2026);
  const tmpV = new Vector3();

  /* ---- uniforms shared by every material ------------------------------------------------ */
  const U = {
    uTime: { value: 0 },
    uProj: { value: 600 },
    uIntro: { value: 0 },
    uMotion: { value: reduced ? 0 : 1 },
    uFade: { value: 1 },
  };

  /* ---- planet ------------------------------------------------------------------------------ */
  const lightView = new Vector3(0.55, 0.62, 0.55).normalize();
  const bodyMat = new ShaderMaterial({
    vertexShader: bodyVert,
    fragmentShader: bodyFrag,
    uniforms: {
      uBase: { value: COLORS.base },
      uRim: { value: COLORS.rim },
      uLight: { value: lightView },
      uFade: U.uFade,
    },
  });
  const body = new Mesh(new SphereGeometry(1, 96, 64), bodyMat);
  world.add(body);

  const atmoMat = new ShaderMaterial({
    vertexShader: atmoVert,
    fragmentShader: atmoFrag,
    uniforms: {
      uColor: { value: COLORS.rim },
      uLight: { value: lightView },
      uFade: U.uFade,
      uShell: { value: ATMO_SHELL },
      uPower: { value: 4.6 },
      uGain: { value: 0.2 },
    },
    side: BackSide,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const atmo = new Mesh(new SphereGeometry(ATMO_SHELL, 64, 48), atmoMat);
  scene.add(atmo);

  /* ---- land dots --------------------------------------------------------------------------- */
  const dotsData = landDots(72000);
  // Shuffle so a draw range thins the dots evenly (the Fibonacci order is a spiral).
  const order = new Uint32Array(dotsData.count);
  for (let i = 0; i < order.length; i++) order[i] = i;
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = order[i] ?? 0;
    order[i] = order[j] ?? 0;
    order[j] = t;
  }
  const dotPos = new Float32Array(dotsData.count * 3);
  const dotSeed = new Float32Array(dotsData.count);
  for (let i = 0; i < order.length; i++) {
    const s = (order[i] ?? 0) * 3;
    dotPos[i * 3] = (dotsData.xyz[s] ?? 0) * 1.0025;
    dotPos[i * 3 + 1] = (dotsData.xyz[s + 1] ?? 0) * 1.0025;
    dotPos[i * 3 + 2] = (dotsData.xyz[s + 2] ?? 0) * 1.0025;
    dotSeed[i] = rand();
  }
  const dotsGeo = new BufferGeometry();
  dotsGeo.setAttribute('position', new BufferAttribute(dotPos, 3));
  dotsGeo.setAttribute('aSeed', new BufferAttribute(dotSeed, 1));
  const dotsMat = new ShaderMaterial({
    vertexShader: dotsVert,
    fragmentShader: dotsFrag,
    uniforms: {
      ...U,
      uSize: { value: 0.0075 },
      uSweep: { value: 1 },
      uColor: { value: COLORS.dots },
      uHot: { value: COLORS.hot },
    },
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const dots = new Points(dotsGeo, dotsMat);
  dots.frustumCulled = false;
  world.add(dots);

  /* ---- graticule and orbit rings (the blueprint voice) ------------------------------------------ */
  const gratPos: number[] = [];
  const push = (a: [number, number, number], b: [number, number, number]) => gratPos.push(...a, ...b);
  for (const lat of [-60, -30, 0, 30, 60]) {
    for (let i = 0; i < 120; i++) {
      push(latLonToXyz(lat, (i / 120) * 360 - 180, 1.0012), latLonToXyz(lat, ((i + 1) / 120) * 360 - 180, 1.0012));
    }
  }
  for (let lon = -180; lon < 180; lon += 30) {
    for (let i = 0; i < 60; i++) {
      push(latLonToXyz(-90 + (i / 60) * 180, lon, 1.0012), latLonToXyz(-90 + ((i + 1) / 60) * 180, lon, 1.0012));
    }
  }
  const gratGeo = new BufferGeometry();
  gratGeo.setAttribute('position', new BufferAttribute(new Float32Array(gratPos), 3));
  const gratMat = new ShaderMaterial({
    vertexShader: lineVert,
    fragmentShader: lineFrag,
    uniforms: { uColor: { value: COLORS.arc }, uAlpha: { value: 0.1 }, uFront: { value: 1 }, uFade: U.uFade },
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const graticule = new LineSegments(gratGeo, gratMat);
  graticule.frustumCulled = false;
  world.add(graticule);

  const ringGroup = new Group();
  const ringMats: ShaderMaterial[] = [];
  for (const [radius, tilt, alpha] of [
    [1.34, 0.42, 0.2],
    [1.62, -0.28, 0.1],
  ] as const) {
    const pts: number[] = [];
    const n = 240;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const b = ((i + 1) / n) * Math.PI * 2;
      // dashes: skip every few segments
      if (i % 6 > 3) continue;
      pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius, Math.cos(b) * radius, 0, Math.sin(b) * radius);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
    const m = new ShaderMaterial({
      vertexShader: lineVert,
      fragmentShader: lineFrag,
      uniforms: { uColor: { value: COLORS.arc }, uAlpha: { value: alpha }, uFront: { value: 0 }, uFade: U.uFade },
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    ringMats.push(m);
    const ring = new LineSegments(g, m);
    ring.rotation.x = tilt;
    ring.rotation.z = tilt * 0.6;
    ring.frustumCulled = false;
    ringGroup.add(ring);
  }
  world.add(ringGroup);

  /* ---- sites ----------------------------------------------------------------------------------- */
  let sites: Site[] = [];
  let sitesPoints: Points | null = null;
  let sitesGeo: BufferGeometry | null = null;
  let killAttr: BufferAttribute | null = null;
  const sitesMat = new ShaderMaterial({
    vertexShader: sitesVert,
    fragmentShader: sitesFrag,
    uniforms: { ...U, uAlarm: { value: COLORS.alarm }, uHover: { value: -1 } },
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

  /* ---- arcs ------------------------------------------------------------------------------------- */
  const arcSlots: ArcSlot[] = [];
  let arcGeo: BufferGeometry | null = null;
  let arcPosAttr: BufferAttribute | null = null;
  let arcInfoAttr: BufferAttribute | null = null;
  const arcMat = new ShaderMaterial({
    vertexShader: arcsVert,
    fragmentShader: arcsFrag,
    uniforms: {
      ...U,
      uColor: { value: COLORS.arc },
      uHot: { value: COLORS.hot },
      uAlarm: { value: COLORS.alarm },
    },
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  let arcLines: LineSegments | null = null;

  /* ---- pulses ----------------------------------------------------------------------------------- */
  const pulsePos = new Float32Array(PULSES * 3);
  const pulseCol = new Float32Array(PULSES * 3);
  const pulseBorn = new Float32Array(PULSES).fill(-1);
  const pulseMax = new Float32Array(PULSES);
  const pulseGeo = new BufferGeometry();
  pulseGeo.setAttribute('position', new BufferAttribute(pulsePos, 3).setUsage(DynamicDrawUsage));
  pulseGeo.setAttribute('aColor', new BufferAttribute(pulseCol, 3).setUsage(DynamicDrawUsage));
  pulseGeo.setAttribute('aBorn', new BufferAttribute(pulseBorn, 1).setUsage(DynamicDrawUsage));
  pulseGeo.setAttribute('aMax', new BufferAttribute(pulseMax, 1).setUsage(DynamicDrawUsage));
  const pulseMat = new ShaderMaterial({
    vertexShader: pulseVert,
    fragmentShader: pulseFrag,
    uniforms: { uTime: U.uTime, uProj: U.uProj, uFade: U.uFade },
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const pulses = new Points(pulseGeo, pulseMat);
  pulses.frustumCulled = false;
  world.add(pulses);
  let pulseNext = 0;

  function emitPulse(unit: readonly [number, number, number], color: Color, size: number): void {
    const i = pulseNext;
    pulseNext = (pulseNext + 1) % PULSES;
    pulsePos[i * 3] = unit[0] * 1.012;
    pulsePos[i * 3 + 1] = unit[1] * 1.012;
    pulsePos[i * 3 + 2] = unit[2] * 1.012;
    pulseCol[i * 3] = color.r;
    pulseCol[i * 3 + 1] = color.g;
    pulseCol[i * 3 + 2] = color.b;
    pulseBorn[i] = U.uTime.value;
    pulseMax[i] = size;
    for (const name of ['position', 'aColor', 'aBorn', 'aMax']) {
      (pulseGeo.getAttribute(name) as BufferAttribute).needsUpdate = true;
    }
  }

  /* ---- stars (depth, almost invisible) ------------------------------------------------------------- */
  {
    const n = 360;
    const p = new Float32Array(n * 3);
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1;
      const t = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const d = 24 + rand() * 20;
      p[i * 3] = r * Math.cos(t) * d;
      p[i * 3 + 1] = u * d;
      p[i * 3 + 2] = r * Math.sin(t) * d - 8;
      s[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(p, 3));
    g.setAttribute('aSeed', new BufferAttribute(s, 1));
    const m = new ShaderMaterial({
      vertexShader: starsVert,
      fragmentShader: starsFrag,
      uniforms: { ...U, uSize: { value: 0.06 }, uColor: { value: new Color('#9fb8ee') } },
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const stars = new Points(g, m);
    stars.frustumCulled = false;
    scene.add(stars);
  }

  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__globe = { renderer, scene, camera, world, atmo, body };

  /* ---- debug: ?hide=atmo,dots,sites,arcs,body,grat,rings,pulses,bloom hides layers ------------------------- */
  const hidden = new Set((new URLSearchParams(window.location.search).get('hide') ?? '').split(',').filter(Boolean));
  if (hidden.has('atmo')) atmo.visible = false;
  if (hidden.has('dots')) dots.visible = false;
  if (hidden.has('body')) body.visible = false;
  if (hidden.has('grat')) graticule.visible = false;
  if (hidden.has('rings')) ringGroup.visible = false;
  if (hidden.has('pulses')) pulses.visible = false;

  /* ---- post ---------------------------------------------------------------------------------------- */
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  let cssW = 800;
  let cssH = 600;
  let dpr = 1;

  function buildComposer(): void {
    composer?.dispose();
    composer = null;
    bloom = null;
    if (!QUALITY[quality].bloom || hidden.has('bloom')) return;
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.setSize(cssW, cssH);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new Vector2(cssW / 2, cssH / 2), 0.14, 0.32, 0.66);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  /* ---- layout ------------------------------------------------------------------------------------------ */
  let topFrac = 0.6;
  let topOverride: number | null = null;
  let camBaseZ = 2.6;
  let worldBaseY = -1.1;

  function layout(): void {
    const aspect = cssW / Math.max(1, cssH);
    const tanHalf = Math.tan((FOV * DEG) / 2);
    const wide = aspect > 1.25;
    topFrac = wide ? 0.6 : aspect > 0.9 ? 0.64 : 0.67;
    if (topOverride !== null) topFrac = clamp(topOverride / Math.max(1, cssH), 0.12, 0.92);
    // How big the planet's disc should be on screen, as a fraction of the canvas width: wide screens
    // get a limb that sweeps past both edges, portrait gets the whole width.
    const radiusPx = (wide ? 0.47 : 0.54) * cssW;
    const tanAlpha = (radiusPx / (cssH / 2)) * tanHalf;
    camBaseZ = clamp(1 / Math.sin(Math.atan(tanAlpha)), 1.95, 18);
    // Place the planet so the top of its silhouette sits at topFrac of the canvas height. The
    // silhouette is tangent, so solve for the centre height by fixed-point iteration.
    const thetaTop = Math.atan((2 * topFrac - 1) * tanHalf);
    let cy = -1.1;
    for (let i = 0; i < 8; i++) {
      const d = Math.hypot(cy, camBaseZ);
      const alpha = Math.asin(Math.min(0.999, 1 / d));
      cy = -camBaseZ * Math.tan(thetaTop + alpha);
    }
    worldBaseY = cy;
    U.uProj.value = (cssH * dpr) / (2 * tanHalf);
  }

  /* ---- state -------------------------------------------------------------------------------------------- */
  let active = false;
  let disposed = false;
  let raf = 0;
  let last = 0;
  let introT = reduced ? 1 : 0;
  let introOn = false;
  let scrollP = 0;
  let autopilot = opts.ambientFailover ?? true;
  let nextAuto = 3.2;
  // Where the camera starts: just south of the equator, a little east of Greenwich. The visible band of
  // a planet that rises behind the copy is roughly 40 to 65 degrees north, which is where the nodes are.
  let yaw = -17 * DEG;
  let pitch = -0.07;
  let yawVel = 0;
  let pitchVel = 0;
  let dragging = false;
  let lastInteract = -99;
  let hoverIdx = -1;
  const frameTimes: number[] = [];
  let governorCheckAt = 0;
  let dotShare = QUALITY[quality].dotShare;

  const healQueue: { at: number; site: number }[] = [];
  const rerouteQueue: { at: number; site: number }[] = [];
  let apps: SimApp[] = [];

  function applyDotShare(): void {
    dotsGeo.setDrawRange(0, Math.floor(dotsData.count * dotShare));
  }
  applyDotShare();

  /* ---- sites build ----------------------------------------------------------------------------------------- */
  function buildSites(points: readonly NodePoint[]): void {
    if (sitesPoints) {
      world.remove(sitesPoints);
      sitesGeo?.dispose();
    }
    if (arcLines) {
      world.remove(arcLines);
      arcGeo?.dispose();
    }
    healQueue.length = 0;
    rerouteQueue.length = 0;

    // The biggest clusters first, capped so the picking and the buffers stay cheap.
    const sorted = [...points].sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1)).slice(0, 2400);
    sites = sorted.map((p) => {
      const ti = TIER_INDEX[p.tier];
      // A hair of offset per tier, so three tiers in one city read as a little cluster, not one dot.
      const lat = p.lat + (ti - 1) * 0.22;
      const lon = p.lon + (ti - 1) * 0.26;
      return {
        lat: p.lat,
        lon: p.lon,
        tier: p.tier,
        country: p.country,
        weight: p.weight ?? 1,
        unit: latLonToXyz(lat, lon, 1),
      };
    });
    const n = sites.length;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const seed = new Float32Array(n);
    const kill = new Float32Array(n).fill(-1);
    const index = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const s = sites[i];
      if (!s) continue;
      pos[i * 3] = s.unit[0] * 1.011;
      pos[i * 3 + 1] = s.unit[1] * 1.011;
      pos[i * 3 + 2] = s.unit[2] * 1.011;
      const c = COLORS[s.tier];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      size[i] = 0.013 + 0.026 * clamp(Math.log10(1 + s.weight) / 2.4, 0, 1);
      seed[i] = rand();
      index[i] = i;
    }
    sitesGeo = new BufferGeometry();
    sitesGeo.setAttribute('position', new BufferAttribute(pos, 3));
    sitesGeo.setAttribute('aColor', new BufferAttribute(col, 3));
    sitesGeo.setAttribute('aSize', new BufferAttribute(size, 1));
    sitesGeo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    sitesGeo.setAttribute('aIndex', new BufferAttribute(index, 1));
    killAttr = new BufferAttribute(kill, 1).setUsage(DynamicDrawUsage);
    sitesGeo.setAttribute('aKill', killAttr);
    sitesPoints = new Points(sitesGeo, sitesMat);
    sitesPoints.frustumCulled = false;
    sitesPoints.renderOrder = 3;
    sitesPoints.visible = !hidden.has('sites');
    world.add(sitesPoints);

    buildApps();
  }

  function buildApps(): void {
    apps = [];
    arcSlots.length = 0;
    const n = sites.length;
    if (n < 4) return;
    const appCount = clamp(Math.round(n / 38), 10, 20);
    const slots = appCount * 3 + 18;
    const verts = slots * (SEG + 1);
    const pos = new Float32Array(verts * 3);
    const info = new Float32Array(verts * 4);
    const idx = new Uint32Array(slots * SEG * 2);
    for (let s = 0; s < slots; s++) {
      arcSlots.push({ a: -1, b: -1, born: 1e9, dying: -1 });
      for (let i = 0; i < SEG; i++) {
        idx[(s * SEG + i) * 2] = s * (SEG + 1) + i;
        idx[(s * SEG + i) * 2 + 1] = s * (SEG + 1) + i + 1;
      }
      for (let i = 0; i <= SEG; i++) {
        const v = s * (SEG + 1) + i;
        info[v * 4] = i / SEG;
        info[v * 4 + 2] = 1e9;
        info[v * 4 + 3] = -1;
      }
    }
    arcGeo = new BufferGeometry();
    arcPosAttr = new BufferAttribute(pos, 3).setUsage(DynamicDrawUsage);
    arcInfoAttr = new BufferAttribute(info, 4).setUsage(DynamicDrawUsage);
    arcGeo.setAttribute('position', arcPosAttr);
    arcGeo.setAttribute('aInfo', arcInfoAttr);
    arcGeo.setIndex(new BufferAttribute(idx, 1));
    arcLines = new LineSegments(arcGeo, arcMat);
    arcLines.frustumCulled = false;
    arcLines.renderOrder = 2;
    arcLines.visible = !hidden.has('arcs');
    world.add(arcLines);

    // Each simulated app has three replicas spread over distant sites; arcs join them in a triangle.
    for (let a = 0; a < appCount; a++) {
      const replicas: number[] = [];
      let tries = 0;
      while (replicas.length < 3 && tries++ < 60) {
        const i = Math.floor(rand() * n);
        const s = sites[i];
        if (!s || replicas.includes(i)) continue;
        const ok = replicas.every((j) => {
          const o = sites[j];
          const ang = o ? angleBetween(o.unit, s.unit) : 0;
          return o && ang > 0.45 && ang < 1.75 && o.country !== s.country;
        });
        if (ok || tries > 40) replicas.push(i);
      }
      if (replicas.length < 3) continue;
      apps.push({ replicas });
      const [r0, r1, r2] = replicas as [number, number, number];
      // Born staggered, so the intro draws the web in over a couple of seconds.
      const t0 = 0.9 + rand() * 2.4;
      addArc(r0, r1, t0);
      addArc(r1, r2, t0 + 0.2);
      addArc(r2, r0, t0 + 0.4);
    }
  }

  function freeSlot(): number {
    const now = U.uTime.value;
    for (let i = 0; i < arcSlots.length; i++) {
      const s = arcSlots[i];
      if (s && s.a === -1) return i;
    }
    // Reuse the oldest dead arc.
    for (let i = 0; i < arcSlots.length; i++) {
      const s = arcSlots[i];
      if (s && s.dying >= 0 && now - s.dying > 1.6) return i;
    }
    return -1;
  }

  function addArc(a: number, b: number, born: number): void {
    const si = freeSlot();
    const slot = arcSlots[si];
    const sa = sites[a];
    const sb = sites[b];
    if (!slot || !sa || !sb || !arcPosAttr || !arcInfoAttr) return;
    slot.a = a;
    slot.b = b;
    slot.born = born;
    slot.dying = -1;
    const base = si * (SEG + 1);
    arcPoints(sa.unit, sb.unit, SEG, arcPosAttr.array as Float32Array, base * 3);
    const seed = rand();
    const info = arcInfoAttr.array as Float32Array;
    for (let i = 0; i <= SEG; i++) {
      const v = base + i;
      info[v * 4] = i / SEG;
      info[v * 4 + 1] = seed;
      info[v * 4 + 2] = born;
      info[v * 4 + 3] = -1;
    }
    arcPosAttr.needsUpdate = true;
    arcInfoAttr.needsUpdate = true;
  }

  function killArcsAt(site: number, now: number): void {
    if (!arcInfoAttr) return;
    const info = arcInfoAttr.array as Float32Array;
    for (let si = 0; si < arcSlots.length; si++) {
      const s = arcSlots[si];
      if (!s || s.a === -1 || s.dying >= 0) continue;
      if (s.a !== site && s.b !== site) continue;
      s.dying = now;
      const base = si * (SEG + 1);
      for (let i = 0; i <= SEG; i++) info[(base + i) * 4 + 3] = now;
    }
    arcInfoAttr.needsUpdate = true;
  }

  /** Frees dead arc slots whose fade has finished (so their vertices stop drawing). */
  function reapArcs(now: number): void {
    if (!arcInfoAttr || !arcPosAttr) return;
    let dirty = false;
    const info = arcInfoAttr.array as Float32Array;
    const pos = arcPosAttr.array as Float32Array;
    for (let si = 0; si < arcSlots.length; si++) {
      const s = arcSlots[si];
      if (!s || s.dying < 0 || now - s.dying < 1.6 || s.a === -1) continue;
      s.a = -1;
      s.b = -1;
      s.dying = -1;
      const base = si * (SEG + 1);
      for (let i = 0; i <= SEG; i++) {
        info[(base + i) * 4 + 2] = 1e9;
        info[(base + i) * 4 + 3] = -1;
        pos[(base + i) * 3] = 0;
        pos[(base + i) * 3 + 1] = 0;
        pos[(base + i) * 3 + 2] = 0;
      }
      dirty = true;
    }
    if (dirty) {
      arcInfoAttr.needsUpdate = true;
      arcPosAttr.needsUpdate = true;
    }
  }

  /* ---- the failure simulation --------------------------------------------------------------------------------------- */
  const isDead = (i: number) => (killAttr ? (killAttr.array as Float32Array)[i]! >= 0 : false);
  const publicSite = (i: number): GlobeSite => {
    const s = sites[i] as Site;
    return { lat: s.lat, lon: s.lon, tier: s.tier, country: s.country, weight: s.weight };
  };

  function killSite(i: number): void {
    const s = sites[i];
    if (!s || !killAttr || isDead(i)) return;
    const now = U.uTime.value;
    (killAttr.array as Float32Array)[i] = now;
    killAttr.needsUpdate = true;
    killArcsAt(i, now);
    emitPulse(s.unit, COLORS.alarm, 0.16);
    opts.onEvent?.({ kind: 'kill', site: publicSite(i) });
    rerouteQueue.push({ at: now + REROUTE_AFTER, site: i });
    healQueue.push({ at: now + KILL_HEAL_AFTER, site: i });
  }

  function reroute(deadSite: number): void {
    const now = U.uTime.value;
    for (const app of apps) {
      const at = app.replicas.indexOf(deadSite);
      if (at === -1) continue;
      const survivors = app.replicas.filter((r) => r !== deadSite && !isDead(r));
      if (survivors.length === 0) continue;
      // Choose a living site far from the survivors, in a country they are not in.
      let best = -1;
      let bestScore = -1;
      for (let tries = 0; tries < 40; tries++) {
        const c = Math.floor(rand() * sites.length);
        const cs = sites[c];
        if (!cs || isDead(c) || app.replicas.includes(c)) continue;
        if (survivors.some((r) => sites[r]?.country === cs.country)) continue;
        const score = survivors.reduce((m, r) => m + angleBetween(sites[r]!.unit, cs.unit), 0) + rand() * 0.4;
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      if (best === -1) continue;
      app.replicas[at] = best;
      for (const r of survivors) addArc(r, best, now);
      emitPulse(sites[best]!.unit, COLORS.hot, 0.2);
      opts.onEvent?.({ kind: 'reroute', site: publicSite(deadSite), to: publicSite(best) });
      break; // one narrated placement per kill, the rest happen silently
    }
    // The other apps that lost a replica here re-place theirs too, without a log line each.
    for (const app of apps) {
      const at = app.replicas.indexOf(deadSite);
      if (at === -1) continue;
      const survivors = app.replicas.filter((r) => r !== deadSite && !isDead(r));
      if (survivors.length === 0) continue;
      for (let tries = 0; tries < 30; tries++) {
        const c = Math.floor(rand() * sites.length);
        const cs = sites[c];
        if (!cs || isDead(c) || app.replicas.includes(c)) continue;
        if (survivors.some((r) => sites[r]?.country === cs.country)) continue;
        app.replicas[at] = c;
        for (const r of survivors) addArc(r, c, now + rand() * 0.3);
        break;
      }
    }
  }

  function healSite(i: number): void {
    const s = sites[i];
    if (!s || !killAttr || !isDead(i)) return;
    (killAttr.array as Float32Array)[i] = -1;
    killAttr.needsUpdate = true;
    emitPulse(s.unit, COLORS.ok, 0.14);
    opts.onEvent?.({ kind: 'heal', site: publicSite(i) });
  }

  function randomHostingSite(): number {
    const hosting: number[] = [];
    for (const app of apps) for (const r of app.replicas) if (!isDead(r)) hosting.push(r);
    if (hosting.length === 0) return -1;
    return hosting[Math.floor(rand() * hosting.length)] ?? -1;
  }

  function stepSimulation(now: number): void {
    reapArcs(now);
    for (let i = rerouteQueue.length - 1; i >= 0; i--) {
      const q = rerouteQueue[i];
      if (q && now >= q.at) {
        rerouteQueue.splice(i, 1);
        reroute(q.site);
      }
    }
    for (let i = healQueue.length - 1; i >= 0; i--) {
      const q = healQueue[i];
      if (q && now >= q.at) {
        healQueue.splice(i, 1);
        healSite(q.site);
      }
    }
    const idle = now - lastInteract > 9;
    if (autopilot && !reduced && idle && introT >= 1 && now >= nextAuto && healQueue.length < 2) {
      const s = randomHostingSite();
      if (s >= 0) killSite(s);
      nextAuto = now + 5.5 + rand() * 3;
    }
  }

  /* ---- picking ---------------------------------------------------------------------------------------------------------- */
  function pick(clientX: number, clientY: number, radiusPx = 22): { idx: number; x: number; y: number } | null {
    if (!sites.length) return null;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    world.updateMatrixWorld();
    camera.updateMatrixWorld();
    let best = -1;
    let bestD = radiusPx * radiusPx;
    let bx = 0;
    let by = 0;
    for (let i = 0; i < sites.length; i++) {
      const s = sites[i];
      if (!s) continue;
      tmpV.set(s.unit[0], s.unit[1], s.unit[2]).applyMatrix4(world.matrixWorld);
      // facing the camera?
      const facing = tmpV.x * (camera.position.x - tmpV.x) + tmpV.y * (camera.position.y - tmpV.y) + tmpV.z * (camera.position.z - tmpV.z);
      if (facing < 0.08) continue;
      tmpV.project(camera);
      const sx = (tmpV.x * 0.5 + 0.5) * rect.width;
      const sy = (-tmpV.y * 0.5 + 0.5) * rect.height;
      const d = (sx - px) ** 2 + (sy - py) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
        bx = sx;
        by = sy;
      }
    }
    return best >= 0 ? { idx: best, x: bx, y: by } : null;
  }

  /* ---- pointer ------------------------------------------------------------------------------------------------------------ */
  let downT = 0;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    downT = performance.now();
    yawVel = 0;
    pitchVel = 0;
    lastInteract = U.uTime.value;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.dataset.dragging = 'true';
    if (introT < 1) skipIntro();
  };

  const onMove = (e: PointerEvent) => {
    lastInteract = U.uTime.value;
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      const radiusPx = Math.max(200, (U.uProj.value / dpr / camera.position.z) * 0.9);
      const k = 1 / radiusPx;
      yaw += dx * k;
      pitch = clamp(pitch + dy * k * 0.6, -0.3, 0.7);
      yawVel = dx * k * 60;
      pitchVel = dy * k * 36;
      return;
    }
    if (e.pointerType === 'touch') return;
    const hit = pick(e.clientX, e.clientY);
    const idx = hit ? hit.idx : -1;
    if (idx !== hoverIdx) {
      hoverIdx = idx;
      sitesMat.uniforms.uHover!.value = idx;
      if (opts.playable) canvas.style.cursor = idx >= 0 ? 'crosshair' : '';
    }
    opts.onHover?.(hit ? { site: publicSite(hit.idx), x: hit.x, y: hit.y } : null);
  };

  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    delete canvas.dataset.dragging;
    try {
      canvas.releasePointerCapture?.(e.pointerId);
    } catch {
      // not captured
    }
    const quick = performance.now() - downT < 450;
    if (opts.playable && moved < 6 && quick) {
      const hit = pick(e.clientX, e.clientY, e.pointerType === 'touch' ? 34 : 22);
      if (hit) {
        lastInteract = U.uTime.value;
        killSite(hit.idx);
      }
    }
  };

  const onLeave = () => {
    if (hoverIdx !== -1) {
      hoverIdx = -1;
      sitesMat.uniforms.uHover!.value = -1;
      canvas.style.cursor = '';
      opts.onHover?.(null);
    }
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  const onContextLost = (e: Event) => {
    e.preventDefault();
    stop();
    opts.onFail?.();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  /* ---- frame loop ---------------------------------------------------------------------------------------------------------------- */
  function skipIntro(): void {
    introT = 1;
    introOn = true;
  }

  function frame(nowMs: number): void {
    raf = 0;
    if (disposed || !active) return;
    const dt = clamp((nowMs - last) / 1000, 0, 0.1);
    last = nowMs;

    U.uTime.value += dt;
    const t = U.uTime.value;

    // intro
    if (introOn && introT < 1) introT = Math.min(1, introT + dt / 3.4);
    const ie = easeOutCubic(introT);
    U.uIntro.value = introOn || introT >= 1 ? introT : 0;

    // motion
    U.uMotion.value = damp(U.uMotion.value, reduced ? 0 : 1, 4, dt);
    if (!dragging) {
      if (!reduced) {
        const idle = t - lastInteract > 2.5;
        yaw += (idle ? 0.026 : 0) * dt + yawVel * dt;
        pitch = clamp(pitch + pitchVel * dt, -0.3, 0.7);
      }
      yawVel = damp(yawVel, 0, 2.6, dt);
      pitchVel = damp(pitchVel, 0, 3.2, dt);
    }

    // scroll: the planet lags the page (depth), spins up a little, and settles back
    const sp = clamp(scrollP, 0, 1);
    world.rotation.y = yaw + sp * 0.5;
    world.rotation.x = pitch - sp * 0.12;
    const introScale = 0.9 + 0.1 * ie;
    world.scale.setScalar(introScale);
    world.position.y = worldBaseY + sp * 0.35 - (1 - ie) * 0.25;
    camera.position.set(0, 0, camBaseZ * (1.18 - 0.18 * ie));
    camera.lookAt(0, 0, 0);
    atmo.position.copy(world.position);
    atmo.scale.setScalar(introScale);

    ringGroup.rotation.y += reduced ? 0 : dt * 0.02;

    const fadeIn = smoothstep(0, 0.35, introT);
    U.uFade.value = fadeIn * (1 - smoothstep(0.82, 1, sp));

    stepSimulation(t);

    if (composer) composer.render(dt);
    else renderer.render(scene, camera);

    // governor
    if (dt > 0 && dt < 0.2) frameTimes.push(dt);
    if (frameTimes.length > 90) frameTimes.shift();
    if (t > governorCheckAt && frameTimes.length >= 60) {
      governorCheckAt = t + 2.5;
      const avg = frameTimes.reduce((s, v) => s + v, 0) / frameTimes.length;
      if (avg > 0.028) degrade();
    }

    raf = requestAnimationFrame(frame);
  }

  function degrade(): void {
    if (quality === 'low') return;
    quality = quality === 'high' ? 'medium' : 'low';
    dotShare = QUALITY[quality].dotShare;
    applyDotShare();
    dpr = Math.min(dpr, QUALITY[quality].dpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW, cssH, false);
    buildComposer();
    layout();
    frameTimes.length = 0;
    opts.onQuality?.(quality);
  }

  function start(): void {
    if (raf || disposed) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop(): void {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ---- controller ---------------------------------------------------------------------------------------------------------------------- */
  const controller: GlobeController = {
    setSites(points) {
      buildSites(points);
    },
    resize(w, h, ratio, topPx) {
      cssW = Math.max(1, w);
      cssH = Math.max(1, h);
      topOverride = topPx ?? null;
      dpr = Math.min(ratio, QUALITY[quality].dpr);
      renderer.setPixelRatio(dpr);
      renderer.setSize(cssW, cssH, false);
      camera.aspect = cssW / cssH;
      camera.updateProjectionMatrix();
      layout();
      if (QUALITY[quality].bloom && !composer) buildComposer();
      else if (composer) {
        composer.setPixelRatio(dpr);
        composer.setSize(cssW, cssH);
        bloom?.setSize(cssW / 2, cssH / 2);
      }
      // Draw once even when paused, so a resize never shows a blank frame.
      if (!raf && !disposed) {
        U.uTime.value += 0;
        if (composer) composer.render(0);
        else renderer.render(scene, camera);
      }
    },
    setActive(a) {
      active = a;
      if (a) start();
      else stop();
    },
    setScroll(p) {
      scrollP = p;
    },
    setReducedMotion(r) {
      reduced = r;
      if (r && introT < 1) skipIntro();
    },
    pullPlug() {
      lastInteract = U.uTime.value;
      const s = randomHostingSite();
      if (s >= 0) killSite(s);
    },
    setAutopilot(on) {
      autopilot = on;
    },
    playIntro() {
      if (reduced) {
        skipIntro();
        return;
      }
      introT = 0;
      introOn = true;
    },
    skipIntro,
    get quality() {
      return quality;
    },
    dispose() {
      disposed = true;
      stop();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      composer?.dispose();
      scene.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as ShaderMaterial | ShaderMaterial[] | undefined;
        if (Array.isArray(mat)) for (const x of mat) x.dispose();
        else mat?.dispose?.();
      });
      renderer.dispose();
    },
  };

  return controller;
}
