import { Section, SectionHeader } from '@/ui';
import { TwoQuestions } from './TwoQuestions';
import styles from './TwoQuestions.module.css';

/**
 * Chapter 04: open to anyone, on as many machines as you choose. The turn from how Flux works to the
 * proof. Two questions decide how fragile hosting is (who is allowed to host, and how many machines
 * run your app) and the chapter is one picture of five ways to host answering both: Flux first, then
 * the four that each fall short on one. The kinds are generic (no platform is named) and Flux's own
 * claims are read from `src/data/flux.ts`. The picture is whole from the first frame; see TwoQuestions.
 */
export function DepinGap() {
  return (
    <Section id="open" label="Open to anyone, on as many machines as you choose">
      <SectionHeader
        title="Open to *anyone,* on as many machines as *you choose*"
        lede={<span className={styles.lede}>Two questions decide how fragile hosting is</span>}
      />
      <TwoQuestions />
    </Section>
  );
}
