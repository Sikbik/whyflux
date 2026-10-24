import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { kubernetesMap } from '@/data/flux';
import { LinkButton, Reveal, Section, SectionHeader, Sources, useActive, useIsDesktop, useIsPhone, useReducedMotion } from '@/ui';
import { lensById, lensFor } from './lenses';
import { Rosetta, RosettaPair, type SelectVia } from './Rosetta';
import { Theater } from './Theater';
import { useTheater } from './useTheater';
import css from './FluxKubernetes.module.css';

/**
 * Chapter 02: Flux is a decentralized Kubernetes. The Rosetta stone, set as type: twelve Kubernetes terms
 * and what plays that role in Flux. Beside it, one stage you can drive: the app lands and the nodes claim it
 * on their own, copies come and go, a node is lost and the network heals. Each pair is a lens on the same
 * stage and brings one plain line. The stage starts by itself the first time it comes into view, and says in
 * its first line that its network is made up.
 */
export function FluxKubernetes() {
  const rows = kubernetesMap;
  const phone = useIsPhone();
  const desktop = useIsDesktop();
  const reduced = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const active = useActive(stage);
  const theater = useTheater(active, reduced);

  // The first row to show is the scheduler: the idea this chapter is named for.
  const first = useMemo(() => Math.max(0, rows.findIndex((r) => lensFor(r.k8s).id === 'schedule')), [rows]);
  const [selected, setSelected] = useState(first);
  const timer = useRef<number | undefined>(undefined);
  const touched = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const row = rows[selected];
  const lens = row ? lensFor(row.k8s) : lensById('generic');

  const { play } = theater;

  // The first time the stage is seen, the scheduler scene runs on its own: the point lands before anyone clicks.
  useEffect(() => {
    if (!active || reduced) return;
    const id = window.setTimeout(() => {
      if (touched.current) return;
      touched.current = true;
      play('schedule');
    }, 500);
    return () => window.clearTimeout(id);
  }, [active, reduced, play]);

  const onSelect = (i: number, via: SelectVia) => {
    touched.current = true;
    setSelected(i);
    window.clearTimeout(timer.current);
    const next = rows[i];
    if (!next) return;
    const id = lensFor(next.k8s).id;
    // Arrowing through the list should not fire a scene per row: wait for the selection to settle.
    if (via === 'key') timer.current = window.setTimeout(() => play(id), 380);
    else play(id);
  };

  return (
    <Section id="kubernetes" label="Flux is a decentralized Kubernetes" width="wide">
      <SectionHeader
        eyebrow="A decentralized Kubernetes"
        title="A cloud that **schedules itself**"
        lede="Where Kubernetes has a control plane, Flux has a blockchain and nodes that pick up work on their own."
      />

      {rows.length === 0 ? null : (
        <Reveal className={css.layout}>
          <div className={css.index}>
            <Rosetta rows={rows} selected={selected} onSelect={onSelect} phone={!desktop} />
            {desktop ? null : <RosettaPair row={row} />}
          </div>

          <div ref={stage} className={css.stage}>
            <div className={css.captionRow}>
              <p className={css.caption}>{lens.watch}</p>
              <Sources items={row?.sources} />
            </div>
            <Theater theater={theater} lens={lens.id} phone={phone} />
            {lens.link ? (
              <div className={css.link}>
                <LinkButton href={lens.link.href} variant="ghost" size="sm" iconEnd={<ArrowRight size={14} aria-hidden="true" />}>
                  {lens.link.label}
                </LinkButton>
              </div>
            ) : null}
          </div>
        </Reveal>
      )}
    </Section>
  );
}
