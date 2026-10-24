import { cn } from '@/lib/cn';
import { SLOT } from './sim/engine';
import styles from './TakeItDown.module.css';

/** A pointy-top hexagon in a 24 x 28 box, with room for a 1.6 stroke. */
const HEX_PATH = 'M12 1.4 L22.3 7.2 V20.8 L12 26.6 L1.7 20.8 V7.2 Z';

export type HexState = 'off' | 'up' | 'failing' | 'rebuilding' | 'lost';

/** What a copy is doing, in the one word the hex wears. */
export function hexState(slot: number): HexState {
  if (slot === SLOT.UP) return 'up';
  if (slot === SLOT.UNDETECTED) return 'failing';
  if (slot === SLOT.WAIT || slot === SLOT.INSTALL || slot === SLOT.WARM) return 'rebuilding';
  if (slot === SLOT.OWNER) return 'lost';
  return 'off';
}

/**
 * One hexagon, drawn as an SVG so it can be filled, outlined or dashed with plain CSS (the states
 * are in the module stylesheet). It takes the colour roles of the lane it sits in.
 */
export function Hex({ state, className }: { state: HexState; className?: string }) {
  return (
    <svg className={cn(styles.hex, className)} data-state={state} viewBox="0 0 24 28" aria-hidden="true" focusable="false">
      <path d={HEX_PATH} />
    </svg>
  );
}
