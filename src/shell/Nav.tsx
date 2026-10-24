import { ArrowUpRight, Menu, Share2, X } from 'lucide-react';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { ACTS, chapters, LINKS } from '@/sections/chapters';
import { shareOrCopy } from '@/lib/share';
import { subscribeScroll } from '@/lib/scroll';
import { siteUrl } from '@/lib/urlState';
import { IconButton, LinkButton, Tooltip, useToast } from '@/ui';
import styles from './Nav.module.css';

/** The chapter whose top has passed 40 percent of the viewport height, or the first. */
function findActive(vh: number): number {
  let active = 0;
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i];
    const el = c ? document.getElementById(c.id) : null;
    if (!el) continue;
    if (el.getBoundingClientRect().top <= vh * 0.4) active = i;
  }
  return active;
}

/**
 * The sticky chapter nav: the brand, a row of ticks that is also the table of contents (the tall
 * white tick is where you are, with its name beneath), and the primary action. It is clear over the
 * hero and a flat dark frosted bar once you scroll; a solid hairline along its bottom edge fills with
 * the page. No chapter numbers. On a phone the ticks fold into the current chapter's name plus a
 * menu sheet.
 */
export function Nav() {
  const header = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const { toast } = useToast();

  useEffect(
    () =>
      subscribeScroll(({ y, vh }) => {
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - vh);
        header.current?.style.setProperty('--page-p', Math.min(1, Math.max(0, y / max)).toFixed(4));
        setScrolled(y > 24);
        setActive((a) => {
          const next = findActive(vh);
          return a === next ? a : next;
        });
      }),
    [],
  );

  const current = chapters[active] ?? chapters[0];

  const share = useCallback(async () => {
    const res = await shareOrCopy({
      title: 'Why Flux',
      text: 'Why Flux: pull the plug, it keeps running',
      url: siteUrl(),
    });
    if (res === 'copied') toast('Link copied', 'ok');
  }, [toast]);

  return (
    <>
      <header ref={header} className={styles.header} data-scrolled={scrolled || undefined} data-menu={menu || undefined}>
        <div className={styles.bar}>
          <a href="#top" className={styles.brand} aria-label="Why Flux, back to the top">
            <img src="/brand/Flux_symbol_blue-white.svg" alt="" width={28} height={28} className={styles.mark} />
            <span className={styles.word}>
              Why <b>Flux</b>
            </span>
          </a>

          <nav className={styles.chapters} aria-label="Chapters">
            <ol className={styles.ticks} role="list">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <Tooltip content={c.title} placement="bottom">
                    <a
                      href={`#${c.id}`}
                      className={styles.tick}
                      aria-label={c.title}
                      aria-current={i === active ? 'location' : undefined}
                      data-state={i < active ? 'past' : i === active ? 'now' : 'next'}
                    />
                  </Tooltip>
                </li>
              ))}
            </ol>
            <p className={styles.current} aria-hidden="true">
              <span key={current?.id} className={styles.curLabel}>
                {current?.label}
              </span>
            </p>
          </nav>

          <div className={styles.actions}>
            <IconButton
              icon={<Share2 size={17} aria-hidden="true" />}
              aria-label="Share this page"
              variant="ghost"
              size="sm"
              className={styles.share}
              onClick={share}
            />
            <LinkButton
              href={LINKS.cloud}
              variant="primary"
              size="sm"
              iconEnd={<ArrowUpRight size={16} aria-hidden="true" />}
              className={styles.cta}
            >
              Deploy on Flux
            </LinkButton>
            <IconButton
              icon={menu ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
              aria-label={menu ? 'Close menu' : 'Open menu'}
              aria-expanded={menu}
              aria-controls="chapter-sheet"
              variant="secondary"
              size="sm"
              className={styles.menuBtn}
              onClick={() => setMenu((m) => !m)}
            />
          </div>
        </div>
        <span className={styles.progress} aria-hidden="true" />
      </header>

      <MobileSheet open={menu} onClose={() => setMenu(false)} active={active} />
    </>
  );
}

function MobileSheet({ open, onClose, active }: { open: boolean; onClose: () => void; active: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    root?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !root) return;
      // The menu button rides above the sheet, so it is part of the cycle: close is always one Tab away.
      const toggle = document.querySelector<HTMLElement>('[aria-controls="chapter-sheet"]');
      const items = [...(toggle ? [toggle] : []), ...root.querySelectorAll<HTMLElement>('a[href]')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div
      id="chapter-sheet"
      ref={ref}
      className={styles.sheet}
      data-open={open || undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Chapters"
      aria-hidden={!open}
      inert={!open}
    >
      <ol className={styles.sheetList} role="list">
        {chapters.map((c, i) => (
          <li key={c.id} style={{ '--i': i } as CSSProperties}>
            {c.act !== 0 && chapters[i - 1]?.act !== c.act ? <p className={styles.sheetAct}>{ACTS[c.act]}</p> : null}
            <a href={`#${c.id}`} className={styles.sheetLink} onClick={onClose} aria-current={i === active ? 'location' : undefined}>
              {c.title}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
