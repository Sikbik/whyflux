import { cn } from '@/lib/cn';
import { Section, SectionHeader } from '@/ui';
import { Dawn } from './Dawn';
import { Doors } from './Doors';
import { Explore } from './Explore';
import { Share } from './Share';
import styles from './Join.module.css';

/**
 * Chapter 12: Your move. The release. A sunrise, then the ways in as big typographic rows (deploy, run a
 * node, learn, or just look around), a quiet row of other places, and one share moment as the page's last
 * word. The dawn is the first warm white on the page; it comes up as the visitor scrolls in, and sits still
 * when motion is calm. No pitch and no lede: the rows say where they go and nothing else.
 */
export function Join() {
  return (
    <Section id="join" label="Your move" width="full" pad="none">
      <div className={styles.stage}>
        <div className={cn('container', styles.top)}>
          <SectionHeader num="12" eyebrow="Join" title="Your **move**" align="center" className={styles.head} ghost={false} />
        </div>

        <Dawn />

        <div className={cn('container', styles.bottom)}>
          <Doors />
          <Explore />
          <Share />
        </div>
      </div>
    </Section>
  );
}
