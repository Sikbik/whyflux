/**
 * GLSL for the hero globe. Every material is additive on a black background, so the planet is made
 * of light: a faint body with a Fresnel rim, a dot-matrix of land, glowing sites, travelling arcs and
 * expanding pulse rings. Colours come in as uniforms (linear) from engine.ts.
 *
 * Point sizes are in WORLD units: pixel size = worldSize * uProj / -viewZ, where
 * uProj = drawingBufferHeight / (2 * tan(fov / 2)). That keeps dots the same fraction of the planet
 * at every canvas size and DPR.
 */

/* ---- planet body ------------------------------------------------------------------------- */

export const bodyVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vP;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vP = normalize(position);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

export const bodyFrag = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uRim;
  uniform vec3 uLight;   // view-space direction toward the light
  uniform float uFade;
  varying vec3 vN;
  varying vec3 vP;
  varying vec3 vV;
  void main() {
    vec3 n = normalize(vN);
    float ndv = clamp(dot(n, normalize(vV)), 0.0, 1.0);
    float lit = clamp(dot(n, normalize(uLight)), 0.0, 1.0);
    // The surface: a deep navy with a soft diffuse falloff, so the sphere has form without any glow.
    vec3 col = uBase * (0.55 + 1.15 * pow(lit, 1.3));
    // The limb: a thin, crisp line of Flux blue that is strongest on the lit side. Not a halo.
    float rim = smoothstep(0.70, 1.0, 1.0 - ndv);
    col += uRim * pow(rim, 3.0) * (0.16 + 0.5 * pow(lit, 1.2));
    // a faint lattice on the sphere, barely there
    float a = abs(sin(vP.x * 38.0 + vP.y * 22.0));
    float b = abs(sin(vP.y * 44.0));
    float g = smoothstep(0.985, 1.0, max(a, b));
    col += uRim * g * 0.022;
    gl_FragColor = vec4(col * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ---- atmosphere --------------------------------------------------------------------------- */

/*
 * The atmosphere is the BACK faces of a slightly larger sphere, additive. Its brightness is a function
 * of the angle between the view ray and the line to the planet's centre, so it is exactly 1 at the
 * planet's limb and exactly 0 at the shell's own silhouette: a thin lit edge that fades to nothing,
 * never a filled disc. (Everything inside the planet's limb is hidden by the body's depth.)
 */
export const atmoVert = /* glsl */ `
  varying vec3 vRay;      // view-space position of the fragment (camera at the origin)
  varying vec3 vCentre;   // view-space centre of the planet
  varying float vPlanetR; // planet radius in view space
  varying vec3 vN;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vRay = mv.xyz;
    vCentre = modelViewMatrix[3].xyz;
    vPlanetR = length(modelViewMatrix[0].xyz);
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

export const atmoFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLight;
  uniform float uFade;
  uniform float uShell;
  uniform float uPower;
  uniform float uGain;
  varying vec3 vRay;
  varying vec3 vCentre;
  varying float vPlanetR;
  varying vec3 vN;
  void main() {
    vec3 rd = normalize(vRay);
    float d = length(vCentre);
    float cosA = dot(rd, vCentre / d);
    float sinA = sqrt(max(0.0, 1.0 - cosA * cosA));
    float sinP = vPlanetR / d;              // the planet's limb
    float sinS = vPlanetR * uShell / d;     // the shell's silhouette
    float x = clamp((sinA - sinP) / max(sinS - sinP, 1e-4), 0.0, 1.0);
    float glow = pow(1.0 - x, uPower);
    // brighter on the lit side
    float lit = 0.35 + 0.95 * clamp(dot(normalize(vN), normalize(uLight)) * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(uColor * glow * lit * uGain * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ---- land dots ------------------------------------------------------------------------------ */

export const dotsVert = /* glsl */ `
  uniform float uTime;
  uniform float uProj;
  uniform float uSize;
  uniform float uIntro;
  uniform float uMotion;
  uniform float uSweep;
  attribute float aSeed;
  varying float vA;
  varying float vSweep;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    float face = smoothstep(-0.04, 0.32, dot(n, normalize(-mv.xyz)));
    float lon = atan(position.x, position.z);
    float lat = asin(clamp(position.y, -1.0, 1.0));
    // the intro: a wave of ignition from the north Atlantic outward
    float dist = distance(position, vec3(0.2, 0.7, 0.68));
    float born = smoothstep(dist * 0.55, dist * 0.55 + 0.35, uIntro * 1.45);
    // a slow meridian sweep that crosses the land
    float sw = pow(max(0.0, sin(lon * 1.0 - uTime * 0.35 * uMotion + 0.6)), 14.0);
    float tw = 0.78 + 0.22 * sin(uTime * 1.1 * uMotion + aSeed * 31.0);
    vSweep = sw * uSweep;
    vA = face * born * tw * (0.62 + 0.38 * face);
    gl_PointSize = max(1.0, uSize * (0.75 + 0.5 * aSeed) * uProj / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const dotsFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uFade;
  varying float vA;
  varying float vSweep;
  void main() {
    // a hexagon (the brand's own shape), hard-edged so the land stays crisp at any size
    vec2 p = abs((gl_PointCoord - 0.5) * 2.0);
    float h = max(dot(p, vec2(0.8660254, 0.5)), p.y);
    float a = 1.0 - smoothstep(0.78, 0.9, h);
    vec3 col = mix(uColor, uHot, clamp(vSweep, 0.0, 1.0));
    gl_FragColor = vec4(col * a * (vA * 0.95 + vSweep * 0.7) * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ---- sites (the nodes) ----------------------------------------------------------------------- */

export const sitesVert = /* glsl */ `
  uniform float uTime;
  uniform float uProj;
  uniform float uIntro;
  uniform float uMotion;
  uniform vec3 uAlarm;
  uniform float uHover;       // index of the hovered site, -1 for none
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aSeed;
  attribute float aKill;      // -1 alive, otherwise the time the plug was pulled
  attribute float aIndex;
  varying vec3 vColor;
  varying float vA;
  varying float vCore;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    float face = smoothstep(0.10, 0.42, dot(n, normalize(-mv.xyz)));
    float dist = distance(position, vec3(0.2, 0.7, 0.68));
    float born = smoothstep(dist * 0.55 + 0.1, dist * 0.55 + 0.4, uIntro * 1.45);
    float beat = 0.8 + 0.2 * sin(uTime * 2.1 * uMotion + aSeed * 6.2831);
    float dead = step(0.0, aKill);
    float age = max(0.0, uTime - aKill);
    float flick = mix(1.0, step(0.5, fract(age * 6.5)), dead * (1.0 - smoothstep(0.55, 0.8, age)));
    float k = dead * smoothstep(0.0, 0.1, age);
    vColor = mix(aColor, uAlarm, k);
    float dim = mix(1.0, 0.1, dead * smoothstep(0.8, 1.6, age));
    float hov = 1.0 - step(0.5, abs(uHover - aIndex));
    vA = face * born * beat * flick * dim;
    vCore = mix(1.0, 0.4, dead) + hov;
    float s = aSize * (1.0 + 0.5 * hov) * (0.9 + 0.2 * beat);
    gl_PointSize = max(9.0, s * uProj / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const sitesFrag = /* glsl */ `
  uniform float uFade;
  varying vec3 vColor;
  varying float vA;
  varying float vCore;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float disc = 1.0 - smoothstep(0.30, 0.38, d);         // the node itself, hard-edged
    float pin = 1.0 - smoothstep(0.09, 0.14, d);          // a bright pin at its centre
    float halo = pow(max(0.0, 1.0 - d), 3.2) * 0.3;       // a small, quiet halo
    vec3 col = vColor * (disc * 1.0 + halo) + vec3(1.0) * pin * 0.55 * vCore;
    gl_FragColor = vec4(col * vA * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ---- arcs ----------------------------------------------------------------------------------------- */

export const arcsVert = /* glsl */ `
  attribute vec4 aInfo;   // x: t along the arc, y: seed, z: born time, w: kill time (-1 alive)
  varying vec4 vInfo;
  void main() {
    vInfo = aInfo;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const arcsFrag = /* glsl */ `
  uniform float uTime;
  uniform float uMotion;
  uniform float uFade;
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform vec3 uAlarm;
  varying vec4 vInfo;
  void main() {
    float t = vInfo.x;
    float seed = vInfo.y;
    float born = vInfo.z;
    float kill = vInfo.w;
    float draw = clamp((uTime - born) * 0.9, 0.0, 1.0);
    if (t > draw) discard;
    float head = fract(uTime * 0.2 * uMotion + seed);
    float dd = abs(t - head);
    dd = min(dd, 1.0 - dd);
    float pulse = exp(-dd * dd * 700.0) * uMotion;
    float ends = smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.95, t);
    // the freshly drawn head glows while the arc is still being drawn
    float tip = exp(-pow((t - draw) * 24.0, 2.0)) * (1.0 - step(1.0, draw));
    float dead = step(0.0, kill);
    float age = max(0.0, uTime - kill);
    float flick = mix(1.0, step(0.5, fract(age * 8.0)), dead * (1.0 - smoothstep(0.35, 0.6, age)));
    float fade = mix(1.0, 1.0 - smoothstep(0.5, 1.3, age), dead);
    vec3 base = mix(uColor, uAlarm, dead * smoothstep(0.0, 0.12, age));
    vec3 col = base * 0.3 + uHot * (pulse * 0.8 + tip * 0.9);
    gl_FragColor = vec4(col * ends * flick * fade * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ---- pulse rings ---------------------------------------------------------------------------------------- */

export const pulseVert = /* glsl */ `
  uniform float uTime;
  uniform float uProj;
  attribute vec3 aColor;
  attribute float aBorn;     // -1 unused
  attribute float aMax;      // world size at the end of the ring
  varying vec3 vColor;
  varying float vT;
  varying float vVis;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    float t = (uTime - aBorn) / 1.6;
    vT = clamp(t, 0.0, 1.0);
    vVis = step(0.0, aBorn) * step(t, 1.0) * smoothstep(0.0, 0.22, dot(n, normalize(-mv.xyz)));
    vColor = aColor;
    gl_PointSize = max(2.0, aMax * (0.15 + 0.85 * vT) * uProj / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const pulseFrag = /* glsl */ `
  uniform float uFade;
  varying vec3 vColor;
  varying float vT;
  varying float vVis;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float r = 0.92 * (0.2 + 0.8 * vT);
    float ring = exp(-pow((d - r) * 14.0, 2.0));
    float a = ring * (1.0 - vT) * vVis;
    gl_FragColor = vec4(vColor * a * 0.95 * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ---- generic hairline (graticule, rings) ------------------------------------------------------------------ */

export const lineVert = /* glsl */ `
  varying float vFace;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFace = dot(n, normalize(-mv.xyz));
    gl_Position = projectionMatrix * mv;
  }
`;

export const lineFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform float uFade;
  uniform float uFront;   // 1: hide the far side (a graticule), 0: always visible (an orbit ring)
  varying float vFace;
  void main() {
    float face = mix(1.0, smoothstep(-0.02, 0.22, vFace), uFront);
    gl_FragColor = vec4(uColor * uAlpha * face * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ---- stars (a few hundred, for depth) --------------------------------------------------------------------- */

export const starsVert = /* glsl */ `
  uniform float uTime;
  uniform float uProj;
  uniform float uSize;
  uniform float uIntro;
  uniform float uMotion;
  attribute float aSeed;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) * uMotion + aSeed * 40.0);
    vA = (0.25 + 0.75 * aSeed) * tw * smoothstep(0.2, 1.0, uIntro);
    gl_PointSize = max(1.0, uSize * (0.4 + aSeed) * uProj / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const starsFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uFade;
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(c));
    gl_FragColor = vec4(uColor * a * vA * 0.7 * uFade, 1.0);
    #include <colorspace_fragment>
  }
`;
