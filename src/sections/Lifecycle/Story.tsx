import { type CSSProperties, useEffect, useRef } from 'react';
import { lifecycle } from '@/data/flux';
import { trackProgress } from '@/lib/scroll';
import { Reveal, ScrollStage, useIsDesktop, useReducedMotion } from '@/ui';
import { createClock } from './clock';
import { MicroScene } from './MicroScene';
import { OnRampPicker } from './OnRamps';
import { Receipts } from './Receipts';
import { Scene } from './Scene';
import { BEATS, CROPS, detailFor, lineFor, type OnRampId, PER_BEAT, POSTER, progressOfStep, stepOfBeat, storyTime } from './model';
import css from './Story.module.css';

/** A step's title with its last word set heavier, the way the page's headlines are. */
function Title({ text }: { text: string }) {
  const i = text.lastIndexOf(' ');
  if (i < 0) return <b>{text}</b>;
  return (
    <>
      {text.slice(0, i + 1)}
      <b>{text.slice(i + 1)}</b>
    </>
  );
}

/** The title, its one line, and the receipts. Everything else the data says waits behind the receipts. */
function Caption({ step, on }: { step: number; on: OnRampId | null }) {
  const s = lifecycle[step];
  if (!s) return <div className={css.caption} data-empty />;
  const detail = detailFor(step, on);
  return (
    <div className={css.caption}>
      <div key={`${step}${on ?? ''}`} className={css.capBody}>
        <h3 className={css.capTitle}>
          <Title text={s.title} />
        </h3>
        <p className={css.capLine}>{lineFor(step, on)}</p>
      </div>
      <div className={css.capFoot}>
        <Receipts body={detail.body} sources={detail.sources} />
      </div>
    </div>
  );
}

/** The step marks: ten ticks down the edge of the stage, each a real button that scrolls to its step. */
function Rail({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <nav className={css.rail} aria-label="Steps of a deployment">
      <div className={css.railBody}>
        <span className={css.railLine} aria-hidden="true" data-rail="">
          <i />
        </span>
        <ol>
          {lifecycle.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={css.tick}
                aria-label={s.title}
                aria-current={i === step ? 'step' : undefined}
                data-done={i < step || undefined}
                data-title={s.title}
                onClick={() => onJump(i)}
              />
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

interface StageProps {
  beat: number;
  reduced: boolean;
  on: OnRampId | null;
  onChange: (id: OnRampId) => void;
}

/** The pinned stage. It owns one job on scroll: move the story clock (see clock.ts) and the rail's progress line. */
function Stage({ beat, reduced, on, onChange }: StageProps) {
  const root = useRef<HTMLDivElement>(null);
  const step = stepOfBeat(beat);

  // The clock is rebuilt when the scene's markup changes under it (a different door in the You corner).
  useEffect(() => {
    const el = root.current;
    const wrap = el?.closest<HTMLElement>('[data-step]');
    const scene = el?.querySelector('[data-clock]');
    const line = el?.querySelector<HTMLElement>('[data-rail]');
    if (!wrap || !scene) return;
    const clock = createClock(scene);
    return trackProgress(wrap, 'sticky', ({ p }) => {
      // Reduced motion: every step lands whole, so the clock sits at the moment that shows the current step.
      const t = reduced ? (POSTER[stepOfBeat(Math.min(BEATS - 1, Math.floor(p * BEATS)))] ?? 0) : storyTime(p);
      clock.set(t);
      line?.style.setProperty('--t', t.toFixed(4));
    });
  }, [reduced, on]);

  const jump = (i: number) => {
    const wrap = root.current?.closest<HTMLElement>('[data-step]');
    if (!wrap) return;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    const range = wrap.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * progressOfStep(i), behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <div ref={root} className={css.stage} data-reduced={reduced || undefined}>
      <Rail step={step} onJump={jump} />

      <div className={css.main}>
        <header className={css.head}>
          <OnRampPicker value={on} onChange={onChange} />
        </header>

        <div className={css.sceneWrap}>
          <div className={css.sceneBox}>
            <Scene on={on} />
          </div>
        </div>

        <Caption step={step} on={on} />
      </div>

      {/* The whole story as plain text, for anyone who cannot see the stage. */}
      <ol className="sr-only">
        {lifecycle.map((s) => (
          <li key={s.id}>
            {s.title}. {s.body}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Below the desktop width nothing pins: ten steps one after another, each with a small version of its picture. */
function Steps({ on, onChange }: { on: OnRampId | null; onChange: (id: OnRampId) => void }) {
  return (
    <div className={css.steps}>
      <div className={css.sticky}>
        <OnRampPicker value={on} onChange={onChange} full />
      </div>
      <ol className={css.stepList}>
        {lifecycle.map((s, i) => {
          const crop = CROPS[i] ?? CROPS[0];
          const detail = detailFor(i, on);
          return (
            <li key={s.id} className={css.stepItem}>
              <Reveal className={css.step}>
                <h3 className={css.capTitle}>
                  <Title text={s.title} />
                </h3>
                <p className={css.capLine}>{lineFor(i, on)}</p>
                <div
                  className={css.mini}
                  style={{ aspectRatio: i === 0 ? '16 / 10' : `${crop?.[2] ?? 1} / ${crop?.[3] ?? 1}`, '--t': POSTER[i] ?? i + 1 } as CSSProperties}
                  data-reduced
                >
                  {i === 0 ? <MicroScene kind={on ?? 'neutral'} /> : <Scene on={on} step={i} />}
                </div>
                <div className={css.stepFoot}>
                  <Receipts body={detail.body} sources={detail.sources} />
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export interface StoryProps {
  on: OnRampId | null;
  onChange: (id: OnRampId) => void;
}

/**
 * Part two: the page's one pinned story. Native scroll drives a single clock; ten steps, with the two that
 * matter most (nodes volunteering, a node failing) given twice the scroll. Below the desktop width the
 * pin gives way to a plain run of steps.
 */
export function Story({ on, onChange }: StoryProps) {
  const desktop = useIsDesktop();
  const reduced = useReducedMotion();
  if (!desktop) return <Steps on={on} onChange={onChange} />;
  return (
    <ScrollStage
      steps={BEATS}
      perStep={PER_BEAT}
      top="var(--nav-h)"
      stageHeight="calc(100svh - var(--nav-h))"
      aria-label="A deployment, from spec to serving"
      stageClassName={css.stageShell}
    >
      {({ step }) => <Stage beat={step} reduced={reduced} on={on} onChange={onChange} />}
    </ScrollStage>
  );
}
