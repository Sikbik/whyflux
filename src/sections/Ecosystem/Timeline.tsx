import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { type KeyboardEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { milestones } from '@/data/flux';
import type { Milestone } from '@/data/types';
import { formatDate } from '@/lib/format';
import { CHAIN, estimateHeight, nextRewardReduction, useFluxLive } from '@/lib/live';
import { HexBullet, IconButton, Popover, Reveal, useActive, useReducedMotion } from '@/ui';
import { useNow } from './useNow';
import styles from './Timeline.module.css';

/**
 * Beat B: the history as one quiet strip. Dates and titles on a line, nothing else; the sentence and
 * the sources behind each one are a tap away. It runs the full width of the screen and starts at the
 * present, so the latest milestones are what you see and the years behind them are one drag back
 * (touch, mouse drag, the arrow keys or the two arrows; the wheel is never taken over). The one
 * milestone that has not happened yet is hollow and counted down from the chain height; once the
 * chain is past it, it renders like the others.
 */

/** The block at which the first annual reward reduction takes effect (CHAIN is the source). */
const FIRST_REDUCTION = CHAIN.ponActivationHeight + CHAIN.reductionInterval;

type Phase = { kind: 'done' } | { kind: 'expected'; etaSeconds?: number };

const utc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

function phaseOf(m: Milestone, nowMs: number, height: number | undefined): Phase {
  const flagged = /\(expected\)/i.test(m.title);
  const future = utc(m.date) > nowMs;
  if (!flagged && !future) return { kind: 'done' };
  if (/reward reduction/i.test(m.title) && height !== undefined) {
    const next = nextRewardReduction(height);
    // The next reduction on the schedule is still this one: count down. Otherwise the chain is past it.
    return next && next.height === FIRST_REDUCTION ? { kind: 'expected', etaSeconds: next.etaSeconds } : { kind: 'done' };
  }
  return { kind: 'expected', etaSeconds: future ? (utc(m.date) - nowMs) / 1000 : undefined };
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** "in about 2 days", "in about 5 hours": coarse on purpose, it is an estimate from 30 second blocks. */
function inAbout(seconds: number): string {
  if (seconds < 90) return 'any moment now';
  const minutes = seconds / 60;
  if (minutes < 90) return `in about ${plural(Math.round(minutes), 'minute')}`;
  const hours = minutes / 60;
  if (hours < 36) return `in about ${plural(Math.round(hours), 'hour')}`;
  return `in about ${plural(Math.round(hours / 24), 'day')}`;
}

/** What a milestone says once it has happened: no "(expected)" and no "the date is an estimate". */
function settled(m: Milestone): { title: string; body: string } {
  return {
    title: m.title.replace(/\s*\(expected\)\s*$/i, ''),
    body: m.body
      .split(/(?<=\.)\s+/)
      .filter((s) => !/estimate/i.test(s))
      .join(' '),
  };
}

export function Timeline() {
  const live = useFluxLive();
  const root = useRef<HTMLDivElement>(null);
  const region = useRef<HTMLDivElement>(null);
  const active = useActive(root);
  const now = useNow(active);
  const reduced = useReducedMotion();
  const [edges, setEdges] = useState({ start: false, end: true });

  const height = estimateHeight(live, now) ?? live.blockHeight;

  const entries = useMemo(() => {
    const sorted = [...milestones].sort((a, b) => utc(a.date) - utc(b.date));
    return sorted.map((m, i) => {
      const year = m.date.slice(0, 4);
      const prev = sorted[i - 1];
      return { m, year, yearStart: !prev || prev.date.slice(0, 4) !== year };
    });
  }, []);

  const phases = entries.map((e) => phaseOf(e.m, now, height));

  // ---- scrolling: edges, buttons and keys ------------------------------------------------------------

  const measure = useCallback(() => {
    const el = region.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft >= max - 4;
    setEdges((e) => (e.start === start && e.end === end ? e : { start, end }));
  }, []);

  // Begin at the present: the end of the line, before the first paint.
  useLayoutEffect(() => {
    const el = region.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
    measure();
  }, [measure, entries.length]);

  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, entries.length]);

  const behavior = reduced ? 'auto' : 'smooth';
  const pageStep = () => {
    const first = region.current?.querySelector<HTMLElement>('li');
    return ((first?.offsetWidth ?? 220) + 28) * 2;
  };
  const scrollByPage = (dir: 1 | -1) => region.current?.scrollBy({ left: dir * pageStep(), behavior });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowRight') scrollByPage(1);
    else if (e.key === 'ArrowLeft') scrollByPage(-1);
    else if (e.key === 'Home') region.current?.scrollTo({ left: 0, behavior });
    else if (e.key === 'End') region.current?.scrollTo({ left: region.current.scrollWidth, behavior });
    else return;
    e.preventDefault();
  };

  // Drag to scroll with a mouse, from anywhere (the entries are buttons, so a drag may start on one).
  // Touch and pen scroll natively; the click that ends a drag is swallowed.
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    let id = -1;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      id = e.pointerId;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      moved = false;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        el.setPointerCapture(id);
        el.dataset.dragging = 'true';
      }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      delete el.dataset.dragging;
      if (moved) window.setTimeout(() => (moved = false), 0);
    };
    const click = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click, true);
    };
  }, []);

  if (entries.length === 0) return null;

  return (
    <div ref={root} className={styles.wrap}>
      <span className={styles.nav}>
        <IconButton variant="ghost" size="sm" aria-label="Earlier milestones" disabled={edges.start} icon={<ChevronLeft size={18} aria-hidden="true" />} onClick={() => scrollByPage(-1)} />
        <IconButton variant="ghost" size="sm" aria-label="Later milestones" disabled={edges.end} icon={<ChevronRight size={18} aria-hidden="true" />} onClick={() => scrollByPage(1)} />
      </span>

      <Reveal from="none">
        <div
          ref={region}
          className={styles.region}
          role="region"
          aria-label="Milestones since 2018, scrolls sideways"
          tabIndex={0}
          onScroll={measure}
          onKeyDown={onKeyDown}
        >
          <ol className={styles.track} role="list">
            {entries.map(({ m, year, yearStart }, i) => {
              const phase = phases[i] ?? { kind: 'done' as const };
              const expected = phase.kind === 'expected';
              const { title, body } = expected ? { title: settled(m).title, body: m.body } : settled(m);
              const when = expected ? `Expected ${formatDate(m.date)}` : formatDate(m.date);
              const eta = expected && phase.etaSeconds !== undefined ? inAbout(phase.etaSeconds) : undefined;
              return (
                <li key={`${m.date}-${m.title}`} className={styles.item} data-state={phase.kind}>
                  {yearStart ? (
                    <span className={styles.year} aria-hidden="true">
                      {year}
                    </span>
                  ) : null}
                  <span className={styles.tick} aria-hidden="true">
                    <HexBullet size={12} outline={expected} pulse={expected} />
                  </span>
                  <Popover
                    className={styles.hit}
                    panelClassName={styles.panel}
                    label={`${title}, ${when}`}
                    placement="top"
                    trigger={
                      <>
                        <span className={styles.date}>{when}</span>
                        <span className={styles.title}>{title}</span>
                        {eta ? (
                          <span className={styles.eta}>
                            <span className={styles.dot} aria-hidden="true" />
                            {eta}
                          </span>
                        ) : null}
                      </>
                    }
                  >
                    <p className={styles.pDate}>{when}</p>
                    <h4 className={styles.pTitle}>{title}</h4>
                    <p className={styles.pBody}>{body}</p>
                    <ul className={styles.pSources} role="list">
                      {m.sources.map((s) => (
                        <li key={s.url}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer">
                            <span>{s.label}</span>
                            <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
                            <span className="sr-only"> (Opens in a new tab)</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Popover>
                </li>
              );
            })}
          </ol>
        </div>
      </Reveal>
    </div>
  );
}

