import { ChevronDown } from 'lucide-react';
import { type CSSProperties, type RefObject, useRef, useState } from 'react';
import type { Source } from '@/data/types';
import { formatDate, stripPeriod } from '@/lib/format';
import { Popover, useInView, useIsoLayoutEffect, useReducedMotion } from '@/ui';
import { Field, Hex, Strip } from './Hexes';
import { fluxFacts, fluxLine, KINDS, type Kind, PICTURE_LABEL, QUESTIONS } from './kinds';
import styles from './TwoQuestions.module.css';

/**
 * True from just before the element scrolls into view, once. The picture is fully drawn and fully
 * lit without it: this only starts the short motion that shows how the answers fall into place, so
 * a screenshot at any moment, or with motion off, already shows the point.
 */
function usePlay(ref: RefObject<Element | null>): boolean {
  const reduced = useReducedMotion();
  const near = useInView(ref, { once: true, rootMargin: '0px 0px 6% 0px' });
  // Already on screen when it mounts (a link straight to the chapter): start before the first paint,
  // so the drawn state never shows for a frame and then restarts.
  const [here, setHere] = useState(false);
  useIsoLayoutEffect(() => {
    const r = ref.current?.getBoundingClientRect();
    if (r && r.bottom > 0 && r.top < window.innerHeight * 1.06) setHere(true);
  }, [ref]);
  return (near || here) && !reduced;
}

/**
 * The picture of the chapter: five ways to host an app, each answering the same two questions. Flux is
 * the first row and the answer: anyone can host, and your app runs on as many machines as you choose.
 * Under it, each of the other four has one answer that falls short, drawn as a hollow hexagon and set
 * back, so the only row with two lit answers is Flux.
 *
 * Nothing waits for a trigger. Everything is on the page, lit, from the first frame; each row then
 * plays a short fall-back as it scrolls in (the answers that fall short dim, the field of machines
 * comes on), under a second, transform and opacity only. Reduced motion gets the drawn state.
 */
export function TwoQuestions() {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <Heads />
        <ol className={styles.list} role="list" aria-label={PICTURE_LABEL}>
          {KINDS.map((kind) => (
            <Row key={kind.id} kind={kind} />
          ))}
        </ol>
        <div className={styles.foot}>
          <p className={styles.scope}>{fluxLine()}</p>
          <Details />
        </div>
      </div>
    </div>
  );
}

/** The two questions, as big as anything in the picture. Each row names its own answers for a screen reader. */
function Heads() {
  const ref = useRef<HTMLDivElement>(null);
  const play = usePlay(ref);
  return (
    <div ref={ref} className={styles.heads} data-play={play || undefined} aria-hidden="true">
      {(['who', 'machines'] as const).map((q, i) => {
        const { before, key, after } = QUESTIONS[q];
        return (
          <p key={q} className={styles.head} data-q={q} style={{ '--at': `${i * 200}ms` } as CSSProperties}>
            {before}
            <b>{key}</b>
            {after}
          </p>
        );
      })}
    </div>
  );
}

function Row({ kind }: { kind: Kind }) {
  const ref = useRef<HTMLLIElement>(null);
  const play = usePlay(ref);
  const flux = kind.id === 'flux';
  return (
    <li ref={ref} className={styles.row} data-kind={kind.id} data-flux={flux || undefined} data-play={play || undefined}>
      <p className={styles.name}>{kind.name}</p>

      <div className={styles.cell} data-q="who" data-good={kind.who.open || undefined}>
        <Hex lit={kind.who.open} className={styles.bullet} />
        <span className="sr-only">Who can host: </span>
        <span className={styles.answer}>{kind.who.answer}</span>
      </div>

      <div className={styles.cell} data-q="machines" data-good={kind.machines.many || undefined}>
        {flux ? <Field /> : <Strip count={kind.machines.hexes} lit={kind.machines.many} />}
        <span className="sr-only">Machines running your app: </span>
        <span className={styles.answer}>{kind.machines.answer}</span>
      </div>
    </li>
  );
}

/* ---- the receipts, on demand --------------------------------------------------------------------------- */

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

/** Flux's own two claims, each with where it comes from, and what the picture is and is not. */
function Details() {
  const facts = fluxFacts();
  return (
    <Popover
      className={styles.details}
      panelClassName={styles.panel}
      placement="top"
      label="Details and sources for the picture"
      trigger={
        <>
          Details and sources
          <ChevronDown size={14} aria-hidden="true" />
        </>
      }
    >
      <p className={styles.note}>
        The picture sets five kinds of hosting side by side by how they work. It is an illustration, not a measurement of any one provider, and each
        hexagon is a machine your app runs on. In an open marketplace your app is leased from one provider, so it runs on one machine.
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
