import { Check, Download, Link2, RotateCcw, Send, Share2 } from 'lucide-react';
import { useState } from 'react';
import { copyText, intents, shareOrCopy } from '@/lib/share';
import { shareUrl } from '@/lib/urlState';
import { useToast } from '@/ui';
import { clock, failures, plural } from './format';
import { type LaneState, type Sim } from './sim/engine';
import { COPIES, type Placement } from './sim/model';
import { renderResultImage, saveResultImage } from './resultImage';
import { useSimValue } from './useSim';
import styles from './TakeItDown.module.css';

export interface ShareRowProps {
  sim: Sim;
  copies: number;
  place: Placement;
  /** The seed, when it is not the default (a shared link carries it so the scenario replays). */
  seed: number | null;
  /** Starts the round again. */
  onReset: () => void;
}

const fell = (L: LaneState): boolean => L.fellAtFailures >= 0;
const count = (L: LaneState): number => (fell(L) ? L.fellAtFailures : L.failures);
const held = (L: LaneState, now: number): number => (fell(L) ? L.fellAtT : L.firstStrikeT >= 0 ? now - L.firstStrikeT : 0);

function XMark() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * The way out of the game, in the same plain words as the controls above it: copy the link, post it,
 * save the picture, go again. The lanes already show the numbers, so the sentence they add up to is
 * only spoken (screen readers) and sent (the share text). It waits in reserved space and shows up
 * with the first failure; the link carries the copies, the placement and the seed.
 */
export function ShareRow({ sim, copies, place, seed, onReset }: ShareRowProps) {
  useSimValue(sim, (s) => s.version, 0);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cloud, flux] = sim.lanes;
  const started = cloud.failures + flux.failures > 0;
  const done = fell(cloud) && fell(flux);
  const c = count(cloud);
  const n = count(flux);
  const copyWord = `${copies} ${plural(copies, 'copy', 'copies')}`;

  const sentence = `Traditional hosting ${fell(cloud) ? 'fell to' : 'has taken'} ${failures(c)}, Flux ${fell(flux) ? 'took' : 'has taken'} ${failures(n)}${fell(flux) ? '' : ' and is still serving'}`;

  const share = done
    ? `Two apps, one disaster: traditional hosting fell to ${failures(c)}, Flux with ${copyWord} took ${n}\nTry to take it down`
    : fell(cloud)
      ? `Traditional hosting fell to ${failures(c)}, Flux has taken ${failures(n)} and is still serving, with ${copyWord}\nTry to take it down`
      : `Flux has taken ${failures(n)} and is still serving, with ${copyWord}\nTry to take it down`;

  const params = {
    copies: copies === COPIES.initial ? null : String(copies),
    place: place === 'default' ? null : place,
    s: seed === null ? null : String(seed),
  };
  const link = shareUrl('takedown', params);
  const native = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const onCopy = async () => {
    const ok = await copyText(link);
    setCopied(ok);
    toast(ok ? 'Link copied' : 'Could not copy the link', ok ? 'ok' : 'crit');
    if (ok) window.setTimeout(() => setCopied(false), 2200);
  };

  const onMore = async () => {
    const res = await shareOrCopy({ title: 'Why Flux', text: share, url: link });
    if (res === 'copied') toast('Link copied', 'ok');
  };

  const saveImage = async () => {
    if (busy) return;
    setBusy(true);
    const rows = [
      { L: cloud, name: 'Traditional hosting', isFlux: false },
      { L: flux, name: `Flux, ${copyWord}`, isFlux: true },
    ];
    const blob = await renderResultImage({
      columns: rows.map(({ L, name, isFlux }) => ({
        name,
        count: count(L),
        fell: fell(L),
        flux: isFlux,
        caption: fell(L) ? `${plural(count(L), 'failure', 'failures')} to take it down` : `${plural(count(L), 'failure', 'failures')} so far, still serving`,
        detail: isFlux && held(L, sim.t) >= 1 ? `${fell(L) ? 'held for' : 'holding for'} ${clock(held(L, sim.t))}` : undefined,
      })),
      sentence,
      link,
    });
    if (!blob) {
      toast('Could not draw the image', 'crit');
    } else {
      const res = await saveResultImage(blob, share, link);
      if (res === 'saved') toast('Image saved', 'ok');
      else if (res === 'failed') toast('Could not save the image', 'crit');
    }
    setBusy(false);
  };

  return (
    <div className={styles.share} role="group" aria-label="Share" data-on={started || undefined}>
      {started ? (
        <>
          <p className="sr-only" role="status">
            {sentence}
          </p>
          <button type="button" className={styles.textButton} onClick={onCopy}>
            {copied ? <Check size={15} strokeWidth={1.75} aria-hidden="true" /> : <Link2 size={15} strokeWidth={1.75} aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <a className={styles.textButton} href={intents.x(share, link)} target="_blank" rel="noopener noreferrer">
            <XMark />
            Post
            <span className="sr-only"> (Opens in a new tab)</span>
          </a>
          <a className={styles.textButton} href={intents.telegram(share, link)} target="_blank" rel="noopener noreferrer">
            <Send size={15} strokeWidth={1.75} aria-hidden="true" />
            Telegram
            <span className="sr-only"> (Opens in a new tab)</span>
          </a>
          <button type="button" className={styles.textButton} onClick={saveImage} aria-busy={busy || undefined}>
            <Download size={15} strokeWidth={1.75} aria-hidden="true" />
            {busy ? 'Drawing' : 'Save image'}
          </button>
          {native ? (
            <button type="button" className={styles.textButton} onClick={onMore}>
              <Share2 size={15} strokeWidth={1.75} aria-hidden="true" />
              More
            </button>
          ) : null}
          {done ? (
            <button type="button" className={styles.textButton} data-lit="" onClick={onReset}>
              <RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />
              Try again
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
