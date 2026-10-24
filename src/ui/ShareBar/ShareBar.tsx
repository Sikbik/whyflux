import { Check, Link2, Send, Share2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { copyText, intents, shareOrCopy } from '@/lib/share';
import { shareUrl } from '@/lib/urlState';
import { Button, LinkButton } from '../Button/Button';
import { useToast } from '../Toast/Toast';
import styles from './ShareBar.module.css';

export interface ShareBarProps {
  /** The line that goes with the link. Make it quotable. */
  text: string;
  /** Section anchor to link to, e.g. "arena". Omit for the page top. */
  section?: string;
  /** State to carry in the link, e.g. { vs: 'akash' } so the link reproduces the view. */
  params?: Record<string, string | null | undefined>;
  /** An explicit URL, if you already have one. */
  url?: string;
  size?: 'sm' | 'md';
  className?: string;
}

function XMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * The share row: copy link (with a toast), post on X, Telegram, and the native share sheet on
 * phones. Every shareable moment (the arena's matchup, the take-it-down score, the final call to
 * action) uses this so a link reproduces the view the visitor is looking at.
 *
 *   <ShareBar text="Flux vs Akash: the receipts." section="arena" params={{ vs: 'akash' }} />
 */
export function ShareBar({ text, section, params, url, size = 'md', className }: ShareBarProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const link = url ?? shareUrl(section, params);

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

  const native = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className={cn(styles.bar, className)} role="group" aria-label="Share">
      <Button
        variant="secondary"
        size={size}
        icon={copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
        onClick={onCopy}
      >
        {copied ? 'Copied' : 'Copy link'}
      </Button>
      <LinkButton variant="secondary" size={size} icon={<XMark />} href={intents.x(text, link)}>
        Post
      </LinkButton>
      <LinkButton
        variant="secondary"
        size={size}
        icon={<Send size={16} aria-hidden="true" />}
        href={intents.telegram(text, link)}
      >
        Telegram
      </LinkButton>
      {native ? (
        <Button variant="ghost" size={size} icon={<Share2 size={16} aria-hidden="true" />} onClick={onShare}>
          More
        </Button>
      ) : null}
    </div>
  );
}
