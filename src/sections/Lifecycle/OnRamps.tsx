import { type KeyboardEvent, useRef } from 'react';
import { cn } from '@/lib/cn';
import { Reveal, Sources } from '@/ui';
import { MicroScene } from './MicroScene';
import { allDoorSources, ON_RAMP_IDS, ON_RAMPS, type OnRampDef, type OnRampId } from './model';
import css from './OnRamps.module.css';

/** Roving radio behavior shared by the three doors and the compact switcher: arrows move and select. */
function useRoving(onChange: (id: OnRampId) => void) {
  const box = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    // Move from the door that has focus (with nothing chosen yet that is not the same as the choice), and
    // only for the radios themselves: a Sources button keeps its own keys.
    const door = (e.target as HTMLElement).closest<HTMLElement>('[role="radio"]');
    if (!door) return;
    const i = ON_RAMP_IDS.findIndex((id) => id === door.dataset.id);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % ON_RAMP_IDS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + ON_RAMP_IDS.length) % ON_RAMP_IDS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = ON_RAMP_IDS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = ON_RAMP_IDS[next];
    if (!id) return;
    onChange(id);
    box.current?.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus();
  };
  return { box, onKey };
}

export interface OnRampsProps {
  value: OnRampId | null;
  onChange: (id: OnRampId) => void;
}

/**
 * Part one: three doors of the same size, weight and motion, set straight on the page. Nothing is
 * recommended and nothing is pre-selected; choosing one tells the story below which door the visitor came
 * through, and the other two step back.
 */
export function OnRamps({ value, onChange }: OnRampsProps) {
  const { box, onKey } = useRoving(onChange);
  return (
    <div className={css.wrap}>
      <div
        ref={box}
        className={css.grid}
        role="radiogroup"
        aria-label="Three ways to deploy: choose one to follow it through the story below"
        onKeyDown={onKey}
      >
        {ON_RAMPS.map((def, i) => (
          <Reveal key={def.id} delay={i * 80} className={css.cell}>
            <Door
              def={def}
              checked={value === def.id}
              dim={value !== null && value !== def.id}
              tabbable={value === def.id || (value === null && i === 0)}
              onPick={() => onChange(def.id)}
            />
          </Reveal>
        ))}
      </div>
      <Reveal className={css.foot} delay={240}>
        <p>Pick one and follow it through the story</p>
        <Sources items={allDoorSources()} />
      </Reveal>
    </div>
  );
}

function Door({ def, checked, dim, tabbable, onPick }: { def: OnRampDef; checked: boolean; dim: boolean; tabbable: boolean; onPick: () => void }) {
  return (
    <div className={css.door} data-on={checked || undefined} data-dim={dim || undefined}>
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        data-id={def.id}
        tabIndex={tabbable ? 0 : -1}
        className={css.radio}
        onClick={onPick}
      >
        <span className={css.title}>
          {def.lead}
          <b>{def.key}</b>
        </span>
        <span className={css.line}>{def.line}</span>
        <span className={css.scene}>
          <MicroScene kind={def.id} />
        </span>
      </button>
    </div>
  );
}

export interface PickerProps {
  value: OnRampId | null;
  onChange: (id: OnRampId) => void;
  className?: string;
  /** Spread across the full width (the phone). */
  full?: boolean;
}

/**
 * The same three doors as a switcher of plain words: in the story's corner and, on phones, stuck to the top
 * of the steps. With nothing chosen the first door is the tab stop, so the keyboard can always get in.
 */
export function OnRampPicker({ value, onChange, className, full = false }: PickerProps) {
  const { box, onKey } = useRoving(onChange);
  return (
    <div
      ref={box}
      role="radiogroup"
      aria-label="Which door to follow"
      className={cn(css.picker, className)}
      data-full={full || undefined}
      onKeyDown={onKey}
    >
      {ON_RAMPS.map((def, i) => {
        const on = value === def.id;
        return (
          <button
            key={def.id}
            type="button"
            role="radio"
            aria-checked={on}
            data-id={def.id}
            tabIndex={on || (value === null && i === 0) ? 0 : -1}
            className={css.pick}
            data-on={on || undefined}
            onClick={() => onChange(def.id)}
          >
            {def.pick}
          </button>
        );
      })}
    </div>
  );
}
