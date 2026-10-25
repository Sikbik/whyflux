import { type Ref, useImperativeHandle, useState } from 'react';
import type { GlobeHover } from '@/lib/globe/engine';
import { formatInt } from '@/lib/format';
import { countryName } from '@/lib/live';
import styles from './Hero.module.css';

const TIER_NAME = { cumulus: 'Cumulus', nimbus: 'Nimbus', stratus: 'Stratus' } as const;

function where(code: string | undefined): string {
  return code ? countryName(code) : 'Somewhere';
}

export interface GlobeReticleHandle {
  hover: (h: GlobeHover | null) => void;
}

/**
 * The hover label: corner brackets on the node cluster under the pointer, with where it is, its tier and
 * how many nodes are there. Nothing more: the hero globe is a showcase, not a game.
 */
export function GlobeReticle({ ref }: { ref?: Ref<GlobeReticleHandle> }) {
  const [hover, setHover] = useState<GlobeHover | null>(null);
  useImperativeHandle(ref, () => ({ hover: setHover }), []);
  if (!hover) return null;
  const { site } = hover;
  return (
    <div className={styles.reticle} style={{ translate: `${hover.x}px ${hover.y}px` }} data-tier={site.tier} aria-hidden="true">
      <span className={styles.reticleBox} />
      <span className={styles.reticleTag}>
        <b>{where(site.country)}</b>
        <span>
          {TIER_NAME[site.tier]} · {formatInt(site.weight)} {site.weight === 1 ? 'node' : 'nodes'}
        </span>
      </span>
    </div>
  );
}
