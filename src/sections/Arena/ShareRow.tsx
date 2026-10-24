import { Check, Link2, Send, Share2 } from 'lucide-react';
import { useState } from 'react';
import type { Platform } from '@/data/types';
import { copyText, intents, shareOrCopy } from '@/lib/share';
import { shareUrl } from '@/lib/urlState';
import { Button, LinkButton, useToast } from '@/ui';
import { ShareCardButton } from './ShareCard';
import styles from './ShareRow.module.css';

function XMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export interface ShareRowProps {
  /** The line that goes with the link. */
  text: string;
  rival: Platform;
}

/**
 * The matchup's share actions as quiet text buttons: copy the link, post it, send it, save the card.
 * The same actions as the kit's ShareBar (a link that reopens this exact fight), without a box
 * around each, because the poster above is what is being shared.
 */
export function ShareRow({ text, rival }: ShareRowProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const link = shareUrl('arena', { view: 'h2h', vs: rival.id });
  const native = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const onCopy = async () => {
    const ok = await copyText(link);
    setCopied(ok);
    toast(ok ? 'Link copied' : 'Could not copy the link', ok ? 'ok' : 'crit');
    if (ok) window.setTimeout(() => setCopied(false), 2200);
  };

  const onShare = async () => {
    const res = await shareOrCopy({ title: 'Why Flux', text, url: link });
    if (res === 'copied') toast('Link copied', 'ok');
  };

  return (
    <div className={styles.row} role="group" aria-label="Share this matchup">
      <Button
        variant="ghost"
        size="sm"
        icon={copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
        onClick={onCopy}
      >
        {copied ? 'Copied' : 'Copy link'}
      </Button>
      <LinkButton variant="ghost" size="sm" icon={<XMark />} href={intents.x(text, link)}>
        Post
      </LinkButton>
      <LinkButton variant="ghost" size="sm" icon={<Send size={16} aria-hidden="true" />} href={intents.telegram(text, link)}>
        Telegram
      </LinkButton>
      {native ? (
        <Button variant="ghost" size="sm" icon={<Share2 size={16} aria-hidden="true" />} onClick={onShare}>
          More
        </Button>
      ) : null}
      <ShareCardButton rival={rival} />
    </div>
  );
}
