import { ArrowUpRight, ArrowUp } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/cn';
import { readReducedMotion, setMotionOverride, subscribeReducedMotion } from '@/lib/motion';
import { chapters, LINKS } from '@/sections/chapters';
import { ShareBar, Segmented } from '@/ui';
import styles from './Footer.module.css';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Build',
    links: [
      { label: 'Deploy on FluxCloud', href: LINKS.cloud },
      { label: 'Documentation', href: LINKS.docs },
      { label: 'Flux Academy', href: LINKS.academy },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Flux Atlas, the live network', href: LINKS.atlas },
      { label: 'runonflux.com', href: LINKS.flux },
      { label: 'Source code on GitHub', href: LINKS.github },
    ],
  },
];

/**
 * The footer: a last statement, the same chapters as the nav, outbound links, the share row, and
 * the motion switch (the page honours prefers-reduced-motion by default; this overrides it either
 * way and remembers).
 */
export function Footer() {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);

  return (
    <footer className={styles.footer}>
      <div className={cn('container', styles.inner)}>
        <div className={styles.top}>
          <div className={styles.lead}>
            <p className={styles.brand}>
              <img src="/brand/Flux_symbol_blue-white.svg" alt="" width={34} height={34} />
              <span>
                Why <b>Flux</b>
              </span>
            </p>
            <p className={cn('t-lead', styles.blurb)}>
              An independent, community-built showcase of the Flux decentralized cloud, made with live network data and
              sourced facts
            </p>
            <ShareBar text="Why Flux: pull the plug, it keeps running" size="sm" />
          </div>

          <nav className={styles.cols} aria-label="Footer">
            <div>
              <h2 className={styles.colTitle}>The story</h2>
              <ul className={styles.list} role="list">
                {chapters
                  .filter((c) => c.act !== 0)
                  .map((c) => (
                    <li key={c.id}>
                      <a href={`#${c.id}`} className={styles.link}>
                        {c.label}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className={styles.colTitle}>{col.title}</h2>
                <ul className={styles.list} role="list">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className={styles.link} target="_blank" rel="noopener noreferrer">
                        {l.label}
                        <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
                        <span className="sr-only"> (Opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={cn('t-small', styles.note)}>
            Live figures come from the Flux public API, every comparison links to its source, and simulations say so
          </p>
          <div className={styles.controls}>
            <Segmented
              aria-label="Motion"
              size="sm"
              value={reduced ? 'calm' : 'full'}
              onChange={(v) => setMotionOverride(v === 'calm' ? 'reduced' : 'full')}
              options={[
                { value: 'full', label: 'Full motion' },
                { value: 'calm', label: 'Calm' },
              ]}
            />
            <a href="#top" className={styles.top2} aria-label="Back to the top">
              <ArrowUp size={16} aria-hidden="true" />
              <span>Top</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
