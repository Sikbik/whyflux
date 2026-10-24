import { useRef } from 'react';
import { estimateHeight, useFluxLive } from '@/lib/live';
import { Section, SectionHeader, useActive } from '@/ui';
import { CheckUs } from './CheckUs';
import { Heartbeat } from './Heartbeat';
import { Shapes } from './Shapes';
import { useBlockPulse } from './useBlockPulse';
import { Wall } from './Wall';
import styles from './LiveProof.module.css';

/**
 * Chapter 11: Watch the network. "Trust us" becomes "check us": the network's own numbers set large on
 * the page (a pulse marks the ones read live), a heartbeat you can watch (blocks really are counted
 * arriving), the shape of the network, and the three public requests behind all of it, runnable in the
 * visitor's own browser with the answer set beside the number on the wall. No plate and no panels: the
 * numbers are the picture.
 */
export function LiveProof() {
  const live = useFluxLive();
  const beat = useRef<HTMLDivElement>(null);
  const check = useRef<HTMLDivElement>(null);
  const beatActive = useActive(beat);
  const checkActive = useActive(check);
  // One poller for the heartbeat and the block height check, running only while either is on screen.
  const pulse = useBlockPulse(beatActive || checkActive);
  const height = pulse.height ?? estimateHeight(live) ?? live.blockHeight;

  return (
    <Section id="proof" label="Watch the network">
      <SectionHeader
        className={styles.head}
        num="11"
        eyebrow="Live proof"
        title="Don't take our word, **watch the network**"
        lede="Live numbers, straight from the nodes. Then check them yourself."
        ghost={false}
      />
      <Wall live={live} />
      <div ref={beat}>
        <Heartbeat live={live} pulse={pulse} active={beatActive} />
      </div>
      <Shapes live={live} />
      <div ref={check}>
        <CheckUs live={live} height={height} />
      </div>
    </Section>
  );
}
