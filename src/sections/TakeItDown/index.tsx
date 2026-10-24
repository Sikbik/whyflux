import { Section, SectionHeader } from '@/ui';
import { Playground } from './Playground';

/**
 * Chapter 05: Try to take it down. The same app hosted two ways (traditional hosting, one server in
 * one region, and a Flux app with copies on independent nodes) and a ladder of real-world failures
 * to throw at it. The lesson is a number: how many independent failures it
 * took. The model and its constants are in ./sim/model.ts; the spec is docs/DESIGN.md, chapter 05.
 * No art plate and no frame: the stage is the picture.
 */
export function TakeItDown() {
  return (
    <Section id="takedown" label="Try to take it down" width="wide">
      <SectionHeader
        eyebrow="The simulation"
        title="Go on, **take it down**"
        lede="The same app, hosted two ways: click anything to break it"
      />
      <Playground />
    </Section>
  );
}
