import { ArrowUpRight } from 'lucide-react';
import { type CSSProperties, useId, useMemo, useRef } from 'react';
import { prices } from '@/data/compare';
import type { Cell, Platform } from '@/data/types';
import { cn } from '@/lib/cn';
import { headToHead } from '@/lib/compare';
import { CountUp, Sources, Tooltip, useInView } from '@/ui';
import { HexGlyph, HexPips } from './Glyph';
import {
  FLUX_ID,
  GROUPED_DIMENSIONS,
  ORDERED_DIMENSIONS,
  outcomeOf,
  platformById,
  rivals,
  shortName,
} from './model';
import { Roster } from './Roster';
import { HowWeScored } from './Rubric';
import { ShareRow } from './ShareRow';
import styles from './Versus.module.css';

export interface VersusProps {
  vs: string;
  onPick: (id: string) => void;
  openKey: string | null;
  onOpenReceipt: (platformId: string, dimensionId: string, anchor: HTMLElement) => void;
  /** Switch to the full matrix. */
  onMatrix: () => void;
}

/** The line a shared link carries: "Flux vs Akash: ahead on 7 questions, see the receipts". */
export function matchupText(rival: Platform): string {
  const { wins } = headToHead(FLUX_ID, rival.id);
  return wins > 0
    ? `Flux vs ${shortName(rival)}: ahead on ${wins} questions, see the receipts`
    : `Flux vs ${shortName(rival)}: question by question, see the receipts`;
}

/**
 * View 1, the hero: head to head. Flux against one opponent, set directly on the page. A poster (the
 * two names, how many questions Flux leads, one hexagon per question, the plain-language reason) over
 * one row per question: five hexagon pips each side that grow outward from the middle. Every side
 * opens its receipt; the one-line answers appear on hover. The opponent is `?vs=`, so a link opens
 * on a specific fight, and the poster is what the card and the share row carry away.
 */
export function Versus({ vs, onPick, openKey, onOpenReceipt, onMatrix }: VersusProps) {
  const uid = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const shown = useInView(root, { once: true, rootMargin: '0px 0px -8% 0px' });
  const flux = platformById(FLUX_ID);
  const rival = platformById(vs) ?? rivals()[0];

  const h2h = useMemo(() => (rival ? headToHead(FLUX_ID, rival.id) : null), [rival]);
  const byDimension = useMemo(() => new Map(h2h?.rows.map((r) => [r.dimension.id, r]) ?? []), [h2h]);
  const orderOf = useMemo(() => new Map(ORDERED_DIMENSIONS.map((d, i) => [d.id, i])), []);

  if (!flux || !rival || !h2h) return null;

  const hasPrice = prices.some((p) => p.platformId === rival.id);
  const rivalName = shortName(rival);
  const jump = (id: string) => {
    const el = document.getElementById(`${uid}-${id}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el?.setAttribute('data-flash', '');
    window.setTimeout(() => el?.removeAttribute('data-flash'), 1400);
  };

  return (
    <div ref={root} className={styles.versus} data-shown={shown}>
      <Roster label="Opponent" mode="single" picked={[rival.id]} onPick={onPick} className={styles.roster} />

      <div className={styles.main}>
        <header className={styles.poster} aria-label="The matchup">
          <h3 className={styles.names}>
            <b className={styles.flux}>Flux</b>
            <span className={styles.vs}>vs</span>
            <span className={styles.rival} key={rival.id}>
              {rivalName}
            </span>
          </h3>

          <div className={styles.tally}>
            <p className={styles.lead}>
              <span className={styles.big} aria-hidden="true">
                <CountUp value={h2h.wins} duration={900} immediate />
              </span>
              <span className={styles.bigCaption} aria-hidden="true">
                questions where Flux leads
              </span>
              <span className="sr-only" aria-live="polite">
                {`Flux leads on ${h2h.wins} questions`}
              </span>
            </p>

            <ol className={styles.strip} aria-label="One hexagon per question, filled where Flux leads">
              {GROUPED_DIMENSIONS.map((g) => (
                <li key={g.group} className={styles.stripGroup}>
                  {g.dimensions.map((d) => {
                    const outcome = outcomeOf(byDimension.get(d.id));
                    const win = outcome === 'win';
                    return (
                      <Tooltip key={d.id} content={win ? `${d.label}: Flux leads` : d.label}>
                        <button
                          type="button"
                          className={styles.stripHex}
                          data-outcome={outcome}
                          aria-label={`${d.label}${win ? ', Flux leads' : ''}. Jump to the row`}
                          onClick={() => jump(d.id)}
                        >
                          <HexGlyph score={win ? 5 : 0} verdict="yes" size={20} />
                        </button>
                      </Tooltip>
                    );
                  })}
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.say} key={rival.id}>
            <p className={styles.edge}>{rival.fluxEdge}</p>
            <Sources items={rival.sources} />
            <ShareRow text={matchupText(rival)} rival={rival} />
          </div>
        </header>

        <div className={styles.rows}>
          {GROUPED_DIMENSIONS.map((g) => (
            <section key={g.group} className={styles.group} aria-labelledby={`${uid}-g-${g.group}`}>
              <h4 id={`${uid}-g-${g.group}`} className={styles.groupName}>
                {g.label}
              </h4>
              {g.dimensions.map((d) => {
                const row = byDimension.get(d.id);
                if (!row) return null;
                const outcome = outcomeOf(row);
                return (
                  <div
                    key={d.id}
                    id={`${uid}-${d.id}`}
                    role="group"
                    aria-label={`${d.label}: Flux ${row.a?.score ?? 'no data'}, ${rivalName} ${row.b?.score ?? 'no data'}`}
                    className={styles.row}
                    data-outcome={outcome}
                    style={{ '--row-delay': `${(orderOf.get(d.id) ?? 0) * 38}ms` } as CSSProperties}
                  >
                    <Side side="flux" platform={flux} cell={row.a} dimensionId={d.id} openKey={openKey} onOpen={onOpenReceipt} />
                    <span className={styles.name}>{d.label}</span>
                    <Side
                      key={rival.id}
                      side="rival"
                      platform={rival}
                      cell={row.b}
                      dimensionId={d.id}
                      openKey={openKey}
                      onOpen={onOpenReceipt}
                    />
                  </div>
                );
              })}
            </section>
          ))}
        </div>

        <nav className={styles.next} aria-label="More on this matchup">
          {hasPrice ? (
            <a className={cn('link', styles.go)} href="#cost">
              What it costs
            </a>
          ) : null}
          <a className={cn('link', styles.go)} href={rival.website} target="_blank" rel="noopener noreferrer">
            {rivalName} on its own site
            <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only"> (Opens in a new tab)</span>
          </a>
          <button type="button" className={cn('link', styles.go)} onClick={onMatrix}>
            The full matrix
          </button>
          <HowWeScored />
        </nav>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

interface SideProps {
  side: 'flux' | 'rival';
  platform: Platform;
  cell: Cell | undefined;
  dimensionId: string;
  openKey: string | null;
  onOpen: (platformId: string, dimensionId: string, anchor: HTMLElement) => void;
}

function Side({ side, platform, cell, dimensionId, openKey, onOpen }: SideProps) {
  const key = `${platform.id}:${dimensionId}`;
  if (!cell) {
    return (
      <div className={styles.side} data-side={side}>
        <span className={styles.na}>No data</span>
      </div>
    );
  }
  const na = cell.verdict === 'na';
  const score = na ? null : cell.score;
  const short = (
    <span className={styles.short} aria-hidden="true">
      {cell.short}
    </span>
  );
  return (
    <button
      type="button"
      className={styles.side}
      data-side={side}
      data-open={openKey === key || undefined}
      aria-haspopup="dialog"
      aria-label={`${platform.name}: ${na ? 'not applicable' : `${cell.score} out of 5`}. ${cell.short}. Open the receipt.`}
      onClick={(e) => onOpen(platform.id, dimensionId, e.currentTarget)}
    >
      {side === 'flux' ? short : null}
      <span className={styles.meter}>
        {side === 'flux' ? <b className={styles.score}>{score ?? 'n/a'}</b> : null}
        {na ? <span className={styles.na}>Not applicable</span> : <HexPips score={cell.score} align={side === 'flux' ? 'end' : 'start'} size={24} animate />}
        {side === 'rival' ? <b className={styles.score}>{score ?? 'n/a'}</b> : null}
      </span>
      {side === 'rival' ? short : null}
    </button>
  );
}
