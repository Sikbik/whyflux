/**
 * Chapter 05, the result as a picture: a 1200 x 630 image (the size social networks preview) drawn
 * on a canvas from the same numbers the scoreboard shows, so a visitor can post what happened and
 * not only a link. Colours and fonts are read from the page's own tokens. Nothing here invents a
 * number: it prints what `ShareRow` gives it.
 */

export interface ResultImageColumn {
  /** "Traditional hosting". */
  name: string;
  /** The failures counted for it. */
  count: number;
  /** True once it went down. */
  fell: boolean;
  /** True for the Flux column (drawn in the accent, heavier). */
  flux: boolean;
  /** "failure to take it down", "failures so far, still serving". */
  caption: string;
  /** A second small line, e.g. "held for 00:42". */
  detail?: string;
}

export interface ResultImageData {
  columns: ResultImageColumn[];
  /** The sentence under the title. */
  sentence: string;
  /** The link the picture points at; only its host and hash are printed. */
  link: string;
}

const W = 1200;
const H = 630;
const SCALE = 2;
const PAD = 72;

function token(cs: CSSStyleDeclaration, name: string, fallback: string): string {
  return cs.getPropertyValue(name).trim() || fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Draws the image and returns it as a PNG, or null when the browser cannot encode one. */
export async function renderResultImage(data: ResultImageData): Promise<Blob | null> {
  const root = getComputedStyle(document.documentElement);
  const display = token(root, '--font-display', 'sans-serif');
  const sans = token(root, '--font-sans', 'sans-serif');
  const mono = token(root, '--font-mono', 'monospace');
  const ink = token(root, '--ink-0', '#06090f');
  const text1 = token(root, '--text-1', '#ffffff');
  const text2 = token(root, '--text-2', '#d3d8e3');
  const text3 = token(root, '--text-3', '#a5adbd');
  const line = token(root, '--line-2', '#27324a');
  const accent = token(root, '--accent-strong', '#aec6ff');
  const accentSolid = token(root, '--accent', '#4f7ad4');
  const alarm = token(root, '--alarm', '#ff5470');

  // Make sure the faces are in before measuring: the canvas does not wait for them.
  try {
    await Promise.all([
      document.fonts.load(`300 120px ${display}`),
      document.fonts.load(`700 120px ${display}`),
      document.fonts.load(`600 48px ${display}`),
      document.fonts.load(`400 24px ${sans}`),
      document.fonts.load(`500 20px ${sans}`),
      document.fonts.load(`400 18px ${mono}`),
    ]);
  } catch {
    // A missing face falls back to the stack; the image still draws.
  }

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(SCALE, SCALE);

  // The ground: one flat colour, nothing else behind the numbers.
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, W, H);

  // The title and the sentence.
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = text1;
  ctx.font = `600 54px ${display}`;
  ctx.fillText('Two apps, one disaster', PAD, 108);
  ctx.fillStyle = text2;
  ctx.font = `400 24px ${sans}`;
  const lines = wrap(ctx, data.sentence, W - PAD * 2).slice(0, 2);
  lines.forEach((l, i) => ctx.fillText(l, PAD, 156 + i * 33));

  // The two numbers, each under a single rule: alarm once it fell, the accent for Flux.
  const gap = 96;
  const colW = (W - PAD * 2 - gap * (data.columns.length - 1)) / data.columns.length;
  const top = 262;
  data.columns.forEach((col, i) => {
    const x = PAD + i * (colW + gap);
    ctx.fillStyle = col.flux ? accentSolid : col.fell ? alarm : line;
    ctx.fillRect(x, top, colW, col.flux ? 3 : 1);
    ctx.fillStyle = col.flux ? accent : text1;
    ctx.font = `600 26px ${display}`;
    ctx.fillText(col.name, x, top + 44);
    ctx.fillStyle = col.fell ? alarm : col.flux ? accent : text1;
    ctx.font = `${col.flux ? 700 : 400} 190px ${display}`;
    ctx.fillText(String(col.count), x - 6, top + 222);
    ctx.fillStyle = text3;
    ctx.font = `400 22px ${sans}`;
    ctx.fillText(col.caption, x, top + 262);
    if (col.detail) {
      ctx.fillStyle = text2;
      ctx.font = `500 20px ${sans}`;
      ctx.fillText(col.detail, x, top + 294);
    }
  });

  // The footer: where to try it, and what this is.
  let where = '';
  try {
    const u = new URL(data.link);
    where = `${u.host}/${u.hash || ''}`;
  } catch {
    where = data.link;
  }
  ctx.fillStyle = text3;
  ctx.font = `400 18px ${mono}`;
  ctx.fillText(`A simulation, try it at ${where}`, PAD, H - 40);
  // The wordmark, right-aligned: a hexagon, "Why" light, "Flux" heavy.
  ctx.textAlign = 'right';
  ctx.fillStyle = text1;
  ctx.font = `700 26px ${display}`;
  const fluxW = ctx.measureText('Flux').width;
  ctx.fillText('Flux', W - PAD, H - 38);
  ctx.font = `300 26px ${display}`;
  const whyW = ctx.measureText('Why ').width;
  ctx.fillText('Why ', W - PAD - fluxW, H - 38);
  ctx.textAlign = 'left';
  ctx.fillStyle = accentSolid;
  ctx.beginPath();
  hexPath(ctx, W - PAD - fluxW - whyW - 24, H - 46, 11);
  ctx.fill();

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

/** Hands the picture to the phone's share sheet when it takes files, otherwise downloads it. */
export async function saveResultImage(blob: Blob, text: string, link: string): Promise<'shared' | 'saved' | 'failed'> {
  const file = new File([blob], 'take-it-down.png', { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }) && window.matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ files: [file], text, url: link });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'failed';
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'saved';
  } catch {
    return 'failed';
  }
}
