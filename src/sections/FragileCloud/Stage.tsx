import { ChevronDown, Play, SkipForward, Square } from 'lucide-react';
import { type CSSProperties, type KeyboardEvent, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Incident, Source } from '@/data/types';
import { cn } from '@/lib/cn';
import { formatDate, stripPeriod } from '@/lib/format';
import { easeOutExpo } from '@/lib/math';
import { hashString } from '@/lib/rng';
import { Popover, useActive, useInView, useIsPhone, usePageVisible, useReducedMotion } from '@/ui';
import { IncidentList, IncidentRuler } from './Timeline';
import {
  byDate,
  durationText,
  durationUnit,
  KIND_LABEL,
  type KindFilter,
  kindOf,
  LIT_MS,
  namesFor,
  nameSize,
  type Readout,
  readoutFor,
  REPLAY_STEP_MS,
  type Share,
  shortProvider,
} from './model';
import styles from './Stage.module.css';

interface StageProps {
  all: readonly Incident[];
  /** Incidents that match the kind, oldest first. */
  visible: readonly Incident[];
  selected: Incident;
  kind: KindFilter;
  share: Share | null;
  onKind: (k: KindFilter) => void;
  onSelect: (id: string) => void;
  stageRef: RefObject<HTMLDivElement | null>;
}

const COUNT_MS = 1400;

const FILTERS: readonly { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'outage', label: 'Outages' },
  { value: 'physical', label: 'Physical' },
  { value: 'deplatforming', label: 'Deplatforming' },
];

/**
 * The blackout stage. Pick an incident (the ruler, the keys, the replay) and the services named in
 * its reports go dark: they flicker out in hard steps while the downtime counts up. Names only,
 * nothing invented: a short record gives a short list. It never claims Flux would have survived any
 * of these; it shows what happened, from each incident's own record. Under reduced motion it shows
 * the dark end state at once.
 */
export function Stage({ all, visible, selected, kind, share, onKind, onSelect, stageRef }: StageProps) {
  const reduced = useReducedMotion();
  const phone = useIsPhone();
  const pageVisible = usePageVisible();
  const sceneRef = useRef<HTMLDivElement>(null);
  const armed = useInView(sceneRef, { threshold: 0.5 }) && pageVisible;
  const near = useActive(sceneRef);

  const [nonce, setNonce] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [darkKey, setDarkKey] = useState('');

  // The parent's callback is read through a ref: a timer must not restart because the parent re-rendered.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  const selectedId = selected.id;
  const runKey = `${selectedId}:${nonce}`;
  const dark = reduced || darkKey === runKey;
  const sorted = useMemo(() => [...visible].sort(byDate), [visible]);
  const live = useMemo(() => new Set(visible.map((i) => i.id)), [visible]);

  // The services stay lit for a beat, then go dark. Waits until the stage is on screen.
  useEffect(() => {
    if (dark || !armed) return;
    const t = window.setTimeout(() => setDarkKey(runKey), LIT_MS);
    return () => window.clearTimeout(t);
  }, [dark, armed, runKey]);

  const pick = useCallback(
    (id: string) => {
      setPlaying(false);
      if (id === selectedId) setNonce((n) => n + 1);
      else onSelectRef.current(id);
    },
    [selectedId],
  );

  // Replay the bad years: step through the incidents, oldest first, then stop.
  useEffect(() => {
    if (!playing || !near) return;
    const t = window.setTimeout(() => {
      const at = sorted.findIndex((i) => i.id === selectedId);
      const next = sorted[at + 1];
      if (next) onSelectRef.current(next.id);
      else setPlaying(false);
    }, REPLAY_STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, near, selectedId, sorted]);

  const replay = () => {
    const first = sorted[0];
    if (!first) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (first.id === selectedId) setNonce((n) => n + 1);
    else onSelectRef.current(first.id);
    setPlaying(true);
  };

  const nextIncident = () => {
    const at = sorted.findIndex((i) => i.id === selectedId);
    const next = sorted[(at + 1) % Math.max(1, sorted.length)];
    if (next) pick(next.id);
  };

  const readout = useMemo(() => readoutFor(selected), [selected]);
  const names = useMemo(() => namesFor(selected), [selected]);
  const nameList = names.filter((n) => !n.more).map((n) => n.name);
  const announce = dark
    ? `${stripPeriod(selected.title)}. ${nameList.join(', ')} went dark.${
        readout?.type === 'hours'
          ? ` ${durationText(readout.hours, 1)} ${unitFor(readout.hours)} offline.`
          : readout?.type === 'word'
            ? ` ${readout.word}${readout.tail ? ` ${readout.tail}` : ''}.`
            : ''
      }`
    : '';

  return (
    <div ref={stageRef} id="fragile-stage" className={styles.stage} data-dark={dark || undefined}>
      <div className={cn('container', styles.inner)}>
        <div className={styles.top}>
          <Tabs
            value={kind}
            all={all}
            onChange={(k) => {
              setPlaying(false);
              onKind(k);
            }}
          />
          {reduced ? (
            <button type="button" className={styles.action} onClick={nextIncident}>
              <SkipForward size={15} aria-hidden="true" />
              Next incident
            </button>
          ) : (
            <button type="button" className={styles.action} onClick={replay}>
              {playing ? <Square size={14} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
              {playing ? 'Stop the replay' : 'Replay the bad years'}
            </button>
          )}
        </div>

        <div ref={sceneRef} className={styles.scene} data-dark={dark || undefined} data-idle={!near || undefined} data-size={nameSize(names)}>
          <header className={styles.head}>
            <p className={styles.meta}>
              <span className={styles.provider}>{shortProvider(selected.provider)}</span>
              <time dateTime={selected.date}>{formatDate(selected.date)}</time>
              <span>{KIND_LABEL[kindOf(selected)]}</span>
            </p>
            <h3 className={styles.title}>{stripPeriod(selected.title)}</h3>
          </header>

          <Count readout={readout} dark={dark} runKey={runKey} reduced={reduced} />

          <ul key={runKey} className={styles.names} role="list" aria-label={`Services named in the reports on ${stripPeriod(selected.title)}`}>
            {names.map((n, idx) => {
              const seed = hashString(`${selected.id}:${n.key}`);
              return (
                <li
                  key={n.key}
                  className={styles.name}
                  data-more={n.more || undefined}
                  style={{ '--d': `${idx * 95 + (seed % 140)}ms`, '--speed': 0.9 + (seed % 5) * 0.07 } as CSSProperties}
                >
                  <span className={styles.dead}>{n.name}</span>
                  <span className={styles.lit} aria-hidden="true">
                    {n.name}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className={styles.record}>
            <Details incident={selected} share={share} />
          </div>
        </div>

        <div className={styles.timeline}>
          {phone ? (
            <IncidentList list={sorted} selectedId={selectedId} onSelect={pick} />
          ) : (
            <IncidentRuler all={all} live={live} selectedId={selectedId} onSelect={pick} share={share} />
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </div>
  );
}

/** The unit a duration counts in, singular when the final value is exactly one. */
function unitFor(hours: number): string {
  const { label } = durationUnit(hours);
  return durationText(hours, 1) === '1' ? label.slice(0, -1) : label;
}

interface CountProps {
  readout: Readout | null;
  dark: boolean;
  runKey: string;
  reduced: boolean;
}

/**
 * The big number. It counts up while the services are dark (written straight to the DOM, so the
 * count never re-renders the page). For events that ran for days or longer the data has no hours, so
 * a word read from the impact text stands where the number would.
 */
function Count({ readout, dark, runKey, reduced }: CountProps) {
  const valueRef = useRef<HTMLSpanElement>(null);

  // The unit is fixed by the final value, so it never flips mid-count.
  useEffect(() => {
    const el = valueRef.current;
    if (!el || readout?.type !== 'hours') return;
    if (!dark) {
      el.textContent = durationText(readout.hours, 0);
      return;
    }
    if (reduced) {
      el.textContent = durationText(readout.hours, 1);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / COUNT_MS);
      el.textContent = durationText(readout.hours, easeOutExpo(p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [dark, readout, reduced, runKey]);

  if (!readout) return <div className={styles.read} />;

  if (readout.type === 'hours') {
    return (
      <p className={styles.read} data-type="hours" aria-hidden="true">
        <span ref={valueRef} className={styles.num}>
          {durationText(readout.hours, dark ? 1 : 0)}
        </span>
        <span className={styles.unit}>
          {unitFor(readout.hours)} <span className={styles.off}>offline</span>
        </span>
      </p>
    );
  }

  return (
    <p className={styles.read} data-type="word" data-long={readout.word.length > 9 || undefined} aria-hidden="true">
      <span key={runKey} className={styles.word}>
        {readout.word}
      </span>
      {readout.tail ? (
        <span className={styles.unit}>
          <span className={styles.off}>{readout.tail}</span>
        </span>
      ) : null}
    </p>
  );
}

interface TabsProps {
  value: KindFilter;
  onChange: (k: KindFilter) => void;
  all: readonly Incident[];
}

/** The kinds as plain words: one tab stop, arrow keys move between them. */
function Tabs({ value, onChange, all }: TabsProps) {
  const root = useRef<HTMLDivElement>(null);
  const options = FILTERS.filter((f) => f.value === 'all' || all.some((i) => kindOf(i) === f.value));
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = Math.max(0, options.findIndex((o) => o.value === value));
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (at + 1) % options.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (at - 1 + options.length) % options.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = options.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const target = options[next];
    if (!target) return;
    onChange(target.value);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`[data-value="${target.value}"]`)?.focus());
  };
  return (
    <div ref={root} className={styles.tabs} role="radiogroup" aria-label="Kind of incident" onKeyDown={onKey}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          data-value={o.value}
          className={styles.tab}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface DetailsProps {
  incident: Incident;
  share: Share | null;
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

/** The receipts, on demand: the record of what happened and where it comes from. */
function Details({ incident, share }: DetailsProps) {
  return (
    <Popover
      className={styles.details}
      panelClassName={styles.panel}
      placement="top"
      label={`Details and sources for ${stripPeriod(incident.title)}`}
      trigger={
        <>
          Details and sources
          <ChevronDown size={14} aria-hidden="true" />
        </>
      }
    >
      <p className={styles.impact}>{incident.impact}</p>
      <SourceList items={incident.sources} />
      {share && share.sources.length > 0 ? (
        <>
          <p className={styles.sub}>Where the share of spending comes from</p>
          <SourceList items={share.sources} />
        </>
      ) : null}
    </Popover>
  );
}
