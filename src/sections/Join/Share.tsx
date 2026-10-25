import { useFluxLive } from '@/lib/live';
import { CountUp, Reveal, ShareBar } from '@/ui';
import styles from './Share.module.css';

/** What a post carries with the link. The page's own line first, then why it is worth the click. */
const SHARE_TEXT = 'Pull the plug, it keeps running: the Flux decentralized cloud, with live numbers you can check';

/**
 * The last thing before the footer: one share moment, set as type. The sentence on the left, the
 * kit's share row on the right, and under both one quiet line with the network still counting: a pulse
 * when it is live, plain words about the last snapshot when it is not.
 */
export function Share() {
  const live = useFluxLive();
  const isLive = live.status === 'live';
  const nodes = live.totalNodes > 0 ? live.totalNodes : undefined;

  return (
    <section className={styles.share} aria-labelledby="join-share">
      <Reveal from="up" className={styles.row}>
        <h3 id="join-share" className={styles.title}>
          Send it to someone who has been <b>hit by an outage</b>
        </h3>
        <ShareBar text={SHARE_TEXT} />
      </Reveal>

      <Reveal from="none" className={styles.pulse}>
        {isLive ? <span className={styles.dot} aria-hidden="true" /> : null}
        <p>
          <CountUp value={nodes} className={styles.count} /> nodes online {isLive ? 'right now' : 'at the last snapshot'}
        </p>
      </Reveal>
    </section>
  );
}
