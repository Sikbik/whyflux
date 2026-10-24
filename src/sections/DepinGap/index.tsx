import { Section, SectionHeader } from '@/ui';
import { OpenMap } from './OpenMap';

/**
 * Chapter 04: open to anyone, never on one machine. The turn from the idea to the proof, in one
 * picture. Where can an app live? On two questions: who is allowed to host, and how many machines it
 * runs on. Flux is the one place where the answers are "anyone" and "several". The kinds on the map
 * are generic (no platform is named); Flux's own claims come from `src/data/flux.ts`.
 */
export function DepinGap() {
  return (
    <Section id="open" label="Open to anyone, on as many machines as you choose">
      <SectionHeader
        title="Open to anyone, *on as many machines as you choose*"
        lede="Two questions decide how fragile a cloud is: who can host it, and how many machines run your app."
      />
      <OpenMap />
    </Section>
  );
}
