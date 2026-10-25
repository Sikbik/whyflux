import { useCallback, useMemo, useRef } from 'react';
import { cloudMarketShare, incidents } from '@/data/compare';
import { cn } from '@/lib/cn';
import { useUrlParam } from '@/lib/urlState';
import { Reveal, Section, SectionHeader, useReducedMotion } from '@/ui';
import { Closing } from './Closing';
import { buildShare, byDate, isKind, type KindFilter, kindOf } from './model';
import { Stage } from './Stage';
import styles from './FragileCloud.module.css';

/** The incident the stage opens on: the biggest outage of its year. */
const DEFAULT_INCIDENT = 'aws-us-east-1-2025';

/**
 * Chapter 01: the fragile cloud. Act I, in the cold: three companies carry most of the cloud, and
 * when one has a bad day real services go dark. It never claims Flux would have survived any of
 * these; it only shows what happened, from each incident's record.
 */
export function FragileCloud() {
  const reduced = useReducedMotion();
  const share = useMemo(() => buildShare(cloudMarketShare), []);
  const all = useMemo(() => [...incidents].sort(byDate), []);

  const [kindParam, setKindParam] = useUrlParam('kind');
  const [incParam, setIncParam] = useUrlParam('inc');

  const kind: KindFilter = isKind(kindParam) ? kindParam : 'all';
  const visible = useMemo(() => all.filter((i) => kind === 'all' || kindOf(i) === kind), [all, kind]);
  const selected = visible.find((i) => i.id === incParam) ?? visible.find((i) => i.id === DEFAULT_INCIDENT) ?? visible[0] ?? null;
  const selectedId = selected?.id ?? '';

  const stageRef = useRef<HTMLDivElement>(null);

  // Choosing a kind keeps what is on the stage if it belongs there, and otherwise opens on the lead of that kind.
  const onKind = useCallback(
    (k: KindFilter) => {
      setKindParam(k === 'all' ? null : k);
      const pool = k === 'all' ? all : all.filter((i) => kindOf(i) === k);
      if (!pool.some((i) => i.id === selectedId)) {
        const lead = pool.find((i) => i.id === DEFAULT_INCIDENT) ?? pool[0];
        if (lead) setIncParam(lead.id);
      }
    },
    [all, selectedId, setIncParam, setKindParam],
  );

  const showKind = useCallback(
    (k: KindFilter) => {
      onKind(k);
      stageRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    },
    [onKind, reduced],
  );

  const lede = share ? (
    <>
      Together they take {share.top}% of what the world spends on cloud infrastructure. Here is what a bad day looks like.
    </>
  ) : (
    'Together they carry most of the cloud. Here is what a bad day looks like.'
  );

  return (
    <Section
      id="fragile"
      label="The fragile cloud"
      mood="cold"
      pad="none"
      width="full"
      className={styles.root}
      plate="bg-blackout"
      plateProps={{ opacity: 0.85, fade: 'none', position: '78% 30%', className: styles.plate }}
    >
      <div className={styles.opener}>
        <div className="container">
          <SectionHeader title="Three companies, *one bad day*" />
          <Reveal as="p" className={cn('t-lead', styles.lede)} delay={200}>
            {lede}
          </Reveal>
        </div>
      </div>

      {selected ? (
        <Stage all={all} visible={visible} selected={selected} kind={kind} share={share} onKind={onKind} onSelect={setIncParam} stageRef={stageRef} />
      ) : null}

      <div className="container">
        <Closing onKind={showKind} />
      </div>
    </Section>
  );
}
