import { ImageDown } from 'lucide-react';
import { useState } from 'react';
import type { Platform } from '@/data/types';
import { headToHead } from '@/lib/compare';
import { siteUrl } from '@/lib/urlState';
import { Button, useToast } from '@/ui';
import { FLUX_ID, GROUPED_DIMENSIONS, outcomeOf, shortName } from './model';

const W = 1200;
const H = 630;
const PAD = 72;

/** A pointy-top regular hexagon path centred on (cx, cy) with circumradius r. */
function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

const css = (name: string, fallback: string): string => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

/**
 * Draws the matchup poster: the two names, how many questions Flux leads, one hexagon per question
 * (filled where Flux leads), and where to go. Flat colour on solid ink; no frame, no glow. Colours
 * come from the page's own tokens, so the card always matches the site.
 */
async function drawCard(rival: Platform): Promise<HTMLCanvasElement> {
  await Promise.all([
    document.fonts.load('300 120px "Montserrat Variable"'),
    document.fonts.load('500 30px "Montserrat Variable"'),
    document.fonts.load('700 120px "Montserrat Variable"'),
  ]).catch(() => undefined);

  const h2h = headToHead(FLUX_ID, rival.id);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const ink = css('--ink-0', '#06090f');
  const accent = css('--accent', '#4f7ad4');
  const accentStrong = css('--accent-strong', '#abbee4');
  const text1 = css('--text-1', '#ffffff');
  const text2 = css('--text-2', '#d8dde8');
  const text3 = css('--text-3', '#a5adbd');
  const steel = css('--steel-700', '#626e84');
  const display = '"Montserrat Variable", "Montserrat", system-ui, sans-serif';

  // The floor, and one short bar of solid light above the names.
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.fillRect(PAD, 62, 96, 6);

  // The two names, mixed weights: Flux bold, the opponent light. The pair shrinks until it fits.
  const rivalName = shortName(rival);
  let size = 120;
  const widths = (s: number) => {
    ctx.font = `700 ${s}px ${display}`;
    const flux = ctx.measureText('Flux').width;
    ctx.font = `500 ${Math.round(s * 0.3)}px ${display}`;
    const vs = ctx.measureText('vs').width;
    ctx.font = `300 ${s}px ${display}`;
    const other = ctx.measureText(rivalName).width;
    return { flux, vs, other, gap: s * 0.28 };
  };
  let w = widths(size);
  while (size > 52 && w.flux + w.vs + w.other + w.gap * 2 > W - PAD * 2) {
    size -= 4;
    w = widths(size);
  }
  const nameY = 206;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = accentStrong;
  ctx.font = `700 ${size}px ${display}`;
  ctx.fillText('Flux', PAD, nameY);
  ctx.fillStyle = text3;
  ctx.font = `500 ${Math.round(size * 0.3)}px ${display}`;
  ctx.fillText('vs', PAD + w.flux + w.gap, nameY);
  ctx.fillStyle = text1;
  ctx.font = `300 ${size}px ${display}`;
  ctx.fillText(rivalName, PAD + w.flux + w.gap + w.vs + w.gap, nameY);

  // The number, and what it counts.
  const wins = String(h2h.wins);
  ctx.fillStyle = accentStrong;
  ctx.font = `300 250px ${display}`;
  ctx.fillText(wins, PAD - 8, 448);
  const numberW = ctx.measureText(wins).width;
  ctx.fillStyle = text2;
  ctx.font = `500 34px ${display}`;
  ctx.fillText('questions where', PAD + numberW + 28, 400);
  ctx.fillText('Flux leads', PAD + numberW + 28, 444);

  // One hexagon per question, in column order: filled where Flux leads, an outline everywhere else.
  const byId = new Map(h2h.rows.map((r) => [r.dimension.id, r]));
  let x = PAD;
  const r = 19;
  const y = 548;
  for (const g of GROUPED_DIMENSIONS) {
    for (const d of g.dimensions) {
      hexPath(ctx, x + r, y, r);
      if (outcomeOf(byId.get(d.id)) === 'win') {
        ctx.fillStyle = accent;
        ctx.fill();
      } else {
        ctx.strokeStyle = steel;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      x += r * 1.8 + 6;
    }
    x += 14;
  }

  // The invitation, and where it lives.
  ctx.textAlign = 'right';
  ctx.fillStyle = text1;
  ctx.font = `600 30px ${display}`;
  ctx.fillText('See the receipts', W - PAD, 556);
  ctx.fillStyle = text3;
  ctx.font = `500 20px ${display}`;
  ctx.fillText(siteUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''), W - PAD, 590);
  ctx.textAlign = 'left';
  return canvas;
}

/** "Save card": renders the matchup poster to a PNG and downloads it (or opens the share sheet on a phone). */
export function ShareCardButton({ rival }: { rival: Platform }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      const canvas = await drawCard(rival);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('no image');
      const name = `why-flux-vs-${rival.id}.png`;
      const file = new File([blob], name, { type: 'image/png' });
      if (window.matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Why Flux' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast('Card saved', 'ok');
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') toast('Could not make the card', 'crit');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={busy}
      icon={<ImageDown size={16} aria-hidden="true" />}
      onClick={() => void onClick()}
    >
      Save card
    </Button>
  );
}
