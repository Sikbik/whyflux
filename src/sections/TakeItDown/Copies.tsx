import { type KeyboardEvent, useState } from 'react';
import { Hex, hexState } from './Hex';
import { plural } from './format';
import { COPIES } from './sim/model';
import styles from './TakeItDown.module.css';

/** The hexagons of a lane that cannot be changed: one per place the app lives, wearing its state. */
export function CopyHexes({ states }: { states: readonly number[] }) {
  return (
    <span className={styles.hexes} aria-hidden="true">
      {states.map((st, i) => (
        <Hex key={i} state={hexState(st)} />
      ))}
    </span>
  );
}

export interface CopiesPickerProps {
  /** How many copies the app runs on. */
  value: number;
  /** The state of each copy (the first `value` entries). */
  states: readonly number[];
  onChange: (n: number) => void;
}

/**
 * The lever on the Flux lane: a row of twelve hexagons, the first N lit. Press one to run on that
 * many copies. One slider for the keyboard and for assistive tech (arrows, Home, End); the hexagons
 * are the hit targets for a pointer and a thumb. While a copy is lost or being rebuilt its hexagon
 * shows it, so the row is also the lane's heartbeat.
 */
export function CopiesPicker({ value, states, onChange }: CopiesPickerProps) {
  const [peek, setPeek] = useState(0);
  const set = (n: number) => onChange(Math.min(COPIES.max, Math.max(COPIES.min, n)));
  const word = `${value} ${plural(value, 'copy', 'copies')}`;

  const onKeyDown = (e: KeyboardEvent) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : e.key === 'PageUp' ? 3 : e.key === 'PageDown' ? -3 : 0;
    if (step) {
      e.preventDefault();
      set(value + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      set(COPIES.min);
    } else if (e.key === 'End') {
      e.preventDefault();
      set(COPIES.max);
    }
  };

  return (
    <div className={styles.picker}>
      <div
        role="slider"
        tabIndex={0}
        className={styles.pickerRow}
        aria-label="Copies of the app"
        aria-orientation="horizontal"
        aria-valuemin={COPIES.min}
        aria-valuemax={COPIES.max}
        aria-valuenow={value}
        aria-valuetext={word}
        onKeyDown={onKeyDown}
        onPointerLeave={() => setPeek(0)}
      >
        {Array.from({ length: COPIES.max }, (_, i) => {
          const lit = i < value;
          const preview = peek > 0 && i < peek && !lit;
          const fading = peek > 0 && peek < value && i >= peek && lit;
          return (
            <span
              key={i}
              className={styles.pickerCell}
              data-preview={preview || undefined}
              data-fading={fading || undefined}
              onClick={() => set(i + 1)}
              onPointerEnter={(e) => setPeek(e.pointerType === 'mouse' ? i + 1 : 0)}
            >
              <Hex state={lit ? hexState(states[i] ?? 0) : 'off'} />
            </span>
          );
        })}
      </div>
      <span className={styles.pickerValue} aria-hidden="true">
        {word}
      </span>
    </div>
  );
}
