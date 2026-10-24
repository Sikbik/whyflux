import { useUrlParam } from '@/lib/urlState';
import { Section, SectionHeader } from '@/ui';
import { OnRamps } from './OnRamps';
import { type OnRampId, parseOnRamp } from './model';
import { Story } from './Story';
import css from './Lifecycle.module.css';

/**
 * Chapter 03: how a deployment works. Part one shows three doors of the same size: a Docker image, a
 * Git repo through Orbit, an AI agent over the MCP server. Part two is the page's one pinned story: a
 * made-up app followed from spec to serving, with the two moments that matter most given the longest
 * stretch of scroll. The chosen door lives in `?on=` so a shared link opens on it.
 */
export function Lifecycle() {
  const [raw, setRaw] = useUrlParam('on');
  const on = parseOnRamp(raw);
  const choose = (id: OnRampId) => setRaw(id);

  return (
    <Section id="lifecycle" label="How a deployment works" width="wide">
      <SectionHeader
        eyebrow="How a deployment works"
        title="Ship it your way, *Flux keeps it alive*"
        lede="Follow a made-up app from the moment you deploy it until it is live, replicated and healing itself."
      />

      <OnRamps value={on} onChange={choose} />

      <div id="lifecycle-story" className={css.story}>
        <Story on={on} onChange={choose} />
      </div>
    </Section>
  );
}
