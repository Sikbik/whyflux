import { ChevronDown, RotateCcw, SkipForward } from 'lucide-react';
import { type CSSProperties, Fragment, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import type { Source } from '@/data/types';
import { formatDate, stripPeriod } from '@/lib/format';
import { Popover, useInView, usePageVisible, useReducedMotion } from '@/ui';
import { Glyph, GLYPH_W } from './Glyphs';
import {
  CATEGORIES,
  type Category,
  type CategoryId,
  categoryById,
  COLUMNS,
  ENTER_MS,
  fluxFacts,
  lowerFirst,
  READING,
  REST,
  ROWS,
  STEP_MS,
  STORY,
} from './model';
import styles from './OpenMap.module.css';

/** Each column is as wide as the widest picture in it, so every picture is drawn at one scale. */
const COLUMN_W = [0, 1, 2].map((col) => Math.max(...CATEGORIES.filter((c) => c.col === col).map((c) => GLYPH_W[c.id])));
const TOTAL_W = COLUMN_W.reduce((sum, w) => sum + w, 0);

const BANDS = ['top', 'bottom'] as const;

/**
 * The picture of the chapter: where an app can live, on two questions. Across, who is allowed to
 * host (one company, approved operators, anyone). Up, how many machines the app runs on. Flux sits
 * alone where both answers are the generous ones.
 *
 * It tells itself once when it scrolls into view, simplest first and Flux last, each step lighting
 * the two answers that place it. Hovering or focusing a kind pauses the story, choosing one ends it
 * (so does Skip), and Replay tells it again. Under reduced motion it simply rests on Flux with
 * everything drawn.
 */
export function OpenMap() {
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  const mapRef = useRef<HTMLDivElement>(null);
  // A tiny marker at the middle of the map: the story starts once it is well inside the screen.
  const middleRef = useRef<HTMLSpanElement>(null);
  const armed = useInView(middleRef, { rootMargin: '-30% 0px -30% 0px' }) && pageVisible;

  // -1: waiting to start. 0..4: the step being told. STORY.length: told.
  const [step, setStep] = useState(-1);
  // A kind the visitor chose: it ends the story and stays until they choose another.
  const [pinned, setPinned] = useState<CategoryId | null>(null);
  const [hover, setHover] = useState<CategoryId | null>(null);
  const [focusIn, setFocusIn] = useState(false);

  const finished = reduced || pinned !== null || step >= STORY.length;
  const playing = !finished && step >= 0;
  const paused = hover !== null || focusIn;

  useEffect(() => {
    if (finished || !armed || paused) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), step < 0 ? ENTER_MS : STEP_MS);
    return () => window.clearTimeout(t);
  }, [finished, armed, paused, step]);

  const current: CategoryId = pinned ?? (playing ? (STORY[step] ?? REST) : REST);
  const shown = hover ?? current;
  const active = categoryById(shown);
  const started = finished || step >= 0;
  // Before the story starts the two scales stay neutral: they light up with the first kind.
  const placed = started ? active : null;
  const revealed = (id: CategoryId): boolean => finished || (step >= 0 && STORY.indexOf(id) <= step);

  const replay = () => {
    setPinned(null);
    setHover(null);
    setStep(-1);
  };

  const skip = () => setStep(STORY.length);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    // The tab stop is always the chosen kind, so the keys can start from it without asking the DOM.
    const from = READING.indexOf(current);
    let to = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (from + 1) % READING.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (from - 1 + READING.length) % READING.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = READING.length - 1;
    if (to < 0) return;
    e.preventDefault();
    const target = READING[to];
    if (!target) return;
    setPinned(target);
    requestAnimationFrame(() => mapRef.current?.querySelector<HTMLElement>(`[data-id="${target}"]`)?.focus());
  };

  return (
    <div className={styles.root}>
      <div className={styles.inner} style={{ '--c0': COLUMN_W[0], '--c1': COLUMN_W[1], '--c2': COLUMN_W[2], '--sum': TOTAL_W } as CSSProperties}>
        <span ref={middleRef} className={styles.sentinel} aria-hidden="true" />

        <div
          ref={mapRef}
          className={styles.map}
          role="radiogroup"
          aria-label="Kinds of deployment, by who can host and how many machines your app runs on"
          onKeyDown={onKey}
          onFocus={() => setFocusIn(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIn(false);
          }}
        >
          <div className={styles.heads} aria-hidden="true">
            <span className={styles.rail} />
            {COLUMNS.map((c, i) => (
              <span key={c.label} className={styles.head} data-on={placed?.col === i || undefined}>
                {c.label}
              </span>
            ))}
          </div>

          {BANDS.map((row) => (
            <div key={row} className={styles.band} data-row={row}>
              <p className={styles.rowLabel} data-on={placed?.row === row || undefined} aria-hidden="true">
                {ROWS[row]}
              </p>
              {[0, 1, 2].map((col) => {
                const cat = CATEGORIES.find((c) => c.row === row && c.col === col);
                return (
                  <div key={col} className={styles.cell}>
                    {cat ? (
                      <Marker
                        cat={cat}
                        checked={cat.id === current}
                        on={cat.id === shown}
                        revealed={revealed(cat.id)}
                        onPick={setPinned}
                        onHover={setHover}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className={styles.foot}>
          <p className={styles.caption} aria-live={playing ? 'off' : 'polite'}>
            {started ? (
              <span key={shown} className={styles.line}>
                {active.line}
              </span>
            ) : null}
          </p>
          <div className={styles.actions}>
            <Details />
            {reduced ? null : (
              <button type="button" className={styles.action} onClick={finished ? replay : skip} data-hidden={!started || undefined}>
                {finished ? <RotateCcw size={15} aria-hidden="true" /> : <SkipForward size={15} aria-hidden="true" />}
                {finished ? 'Replay' : 'Skip'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MarkerProps {
  cat: Category;
  /** The kind the story or the visitor has landed on. */
  checked: boolean;
  /** Drawn as the active one: the landed kind, or whatever the pointer is over. */
  on: boolean;
  revealed: boolean;
  onPick: (id: CategoryId) => void;
  onHover: (id: CategoryId | null) => void;
}

function Marker({ cat, checked, on, revealed, onPick, onHover }: MarkerProps) {
  const lineId = useId();
  const label = `${cat.name}, ${lowerFirst(COLUMNS[cat.col]?.label ?? '')}, ${lowerFirst(ROWS[cat.row])}`;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={lineId}
      tabIndex={checked ? 0 : -1}
      data-id={cat.id}
      data-on={on || undefined}
      data-shown={revealed || undefined}
      className={styles.marker}
      onClick={() => onPick(cat.id)}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') onHover(cat.id);
      }}
      onPointerLeave={() => onHover(null)}
    >
      <Glyph id={cat.id} />
      <span className={styles.name}>
        <span className={styles.full}>
          <Words text={cat.name} />
        </span>
        <span className={styles.brief}>
          <Words text={cat.short} />
        </span>
      </span>
      <span id={lineId} className="sr-only">
        {cat.line}
      </span>
    </button>
  );
}

/** A hyphenated word never breaks across lines: "Approved-operator" stays whole. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <Fragment key={`${i}-${w}`}>
          {i > 0 ? ' ' : null}
          {w.includes('-') ? <span className={styles.nowrap}>{w}</span> : w}
        </Fragment>
      ))}
    </>
  );
}

function SourceList({ items }: { items: readonly Source[] }) {
  return (
    <ul className={styles.sources} role="list">
      {items.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.label}
            <span className="sr-only"> (Opens in a new tab)</span>
          </a>
          <span className={styles.accessed}>accessed {formatDate(s.accessed)}</span>
        </li>
      ))}
    </ul>
  );
}

/** The receipts, on demand: Flux's own two claims, each with where it comes from. */
function Details() {
  const facts = fluxFacts();
  return (
    <Popover
      className={styles.details}
      panelClassName={styles.panel}
      placement="top"
      label="Details and sources for the map"
      trigger={
        <>
          Details and sources
          <ChevronDown size={14} aria-hidden="true" />
        </>
      }
    >
      <p className={styles.note}>
        The map places each kind of deployment by how it works. It is an illustration, not a measurement. Solid hexagons are the machines your
        app runs on, faint ones could host it.
      </p>
      {facts.map((f) => (
        <section key={f.id} className={styles.fact}>
          <h4 className={styles.factTitle}>{stripPeriod(f.headline)}</h4>
          <p className={styles.factBody}>{f.body}</p>
          <SourceList items={f.sources} />
        </section>
      ))}
    </Popover>
  );
}
