import { type KeyboardEvent, type ReactNode, useRef } from 'react';
import { incidents } from '@/data/compare';
import { writeParam } from '@/lib/urlState';
import { Tooltip } from '@/ui';
import { type Sim } from './sim/engine';
import { CHAOS_CLIMB_EVERY_S, WEAPONS, type Weapon, type WeaponInfo } from './sim/model';
import { useSimValue } from './useSim';
import styles from './TakeItDown.module.css';

/** The year of the real incident a weapon echoes, read from the data (never retyped). */
function echoYear(w: WeaponInfo): number | undefined {
  const inc = w.incident ? incidents.find((i) => i.id === w.incident) : undefined;
  return inc ? new Date(`${inc.date}T00:00:00Z`).getUTCFullYear() : undefined;
}

/** The incidents board in an earlier chapter shows the incident: set its URL state, then jump there. */
function openIncident(id: string) {
  writeParam('inc', id);
}

export interface WeaponRailProps {
  sim: Sim;
  /** On phones the rail is pinned to the bottom of the screen while the stage is in view. */
  pinned: boolean;
  visible: boolean;
  /** Fire at random, chaos and reset, to the right of the words (just the fire button when pinned). */
  trailing?: ReactNode;
}

/**
 * What to take out, as a sentence you finish: "Take out a machine / data center / country /
 * provider", small to large (keys 1 to 4 anywhere on the stage). Picking a word arms it; pressing a
 * node in a lane fires it. Under the words, one quiet line points at the real incident it echoes.
 */
export function WeaponRail({ sim, pinned, visible, trailing }: WeaponRailProps) {
  const weapon = useSimValue(sim, (s) => s.weapon, 1);
  const chaosWeapon = useSimValue(sim, (s) => (s.chaos ? s.chaosWeapon : 0), 0);
  // While chaos runs, the ladder climbs: the words it has not reached yet are dimmed.
  const rung = useSimValue(sim, (s) => (s.chaos ? Math.min(4, 1 + Math.floor(s.chaosT / CHAOS_CLIMB_EVERY_S)) : 0), 0);
  const group = useRef<HTMLDivElement>(null);
  const info = WEAPONS[weapon - 1]!;
  const year = echoYear(info);

  const onKeyDown = (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (((weapon - 1 + dir) % 4) + 4) % 4;
    sim.setWeapon((next + 1) as Weapon);
    requestAnimationFrame(() => group.current?.querySelector<HTMLElement>(`[data-weapon="${next + 1}"]`)?.focus());
  };

  return (
    <div className={styles.rail} data-pinned={pinned || undefined} data-visible={visible || undefined}>
      <div className={styles.railRow}>
        <div ref={group} className={styles.weapons} role="radiogroup" aria-label="Take out a" onKeyDown={onKeyDown}>
          <span className={styles.lead} aria-hidden="true">
            Take out a
          </span>
          {WEAPONS.map((w) => {
            const on = w.id === weapon;
            return (
              <Tooltip key={w.id} content={`${w.title} (key ${w.id})`} placement="top">
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-keyshortcuts={String(w.id)}
                  tabIndex={on ? 0 : -1}
                  data-weapon={w.id}
                  data-fired={chaosWeapon === w.id || undefined}
                  data-ahead={(rung > 0 && w.id > rung) || undefined}
                  className={styles.weapon}
                  onClick={() => sim.setWeapon(w.id)}
                >
                  {w.label}
                </button>
              </Tooltip>
            );
          })}
        </div>
        {trailing ? <div className={styles.railEnd}>{trailing}</div> : null}
      </div>
      {pinned ? null : (
        <p className={styles.echo} aria-live="polite">
          {info.incident && year ? (
            <>
              In real life:{' '}
              <a
                className={styles.echoLink}
                href="#fragile"
                onClick={() => openIncident(info.incident!)}
                aria-label={`${info.real}, ${year}, open the incident`}
              >
                {info.real} ({year})
              </a>
            </>
          ) : (
            `In real life: ${info.real}`
          )}
        </p>
      )}
    </div>
  );
}
