import { ArrowDown } from 'lucide-react';
import { ecosystem } from '@/data/flux';
import { LinkButton, Reveal, Section, SectionHeader } from '@/ui';
import styles from './Ecosystem.module.css';
import { Showcase } from './Showcase';
import { Timeline } from './Timeline';

/**
 * Chapter 10: More than a cloud. Flux is one network with a family of products around it, and it has
 * been running for years. The orbit is the family (point at a product, choose it, read one line);
 * the strip is the history, including the one milestone that has not happened yet. No panels, no
 * plate behind the orbit: the picture is the interface. Facts come from `ecosystem` and `milestones`
 * (src/data/flux.ts); statuses are never rounded up.
 */
export function Ecosystem() {
  return (
    <Section id="ecosystem" label="More than a cloud">
      <SectionHeader
        className={styles.head}
        num="10"
        eyebrow="Ecosystem"
        title="More than a **cloud**"
        lede="The products, tools and milestones growing around one network."
        ghost={false}
      />

      {ecosystem.length > 0 ? <Showcase items={ecosystem} /> : null}
      <Timeline />

      <Reveal className={styles.closing}>
        <p className={styles.closingLine}>
          All of it grows around <b>one network</b>
        </p>
        <LinkButton href="#proof" variant="secondary" size="lg" iconEnd={<ArrowDown size={16} aria-hidden="true" />}>
          Watch the network
        </LinkButton>
      </Reveal>
    </Section>
  );
}
