import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { EcosystemItem } from '@/data/types';
import { IconButton, Reveal } from '@/ui';
import { Caption } from './Caption';
import { groupRings, STATUS } from './model';
import { Orbit } from './Orbit';
import styles from './Showcase.module.css';

/**
 * The orbit and what it is pointing at. The orbit is the interface: pointing at a product previews
 * it in the caption, clicking (or the arrow keys) chooses it, and the caption goes back to the choice
 * when the pointer leaves. Small screens add two arrows under the caption, because a thumb is a
 * blunt instrument on a crowded orbit. The rotation eases to a stop while the pointer or keyboard
 * focus is anywhere in here.
 */
export function Showcase({ items }: { items: readonly EcosystemItem[] }) {
  const rings = useMemo(() => groupRings(items), [items]);
  const flat = useMemo(() => rings.flatMap((ring) => ring.items.map((item) => ({ item, ring }))), [rings]);

  const [selectedId, setSelectedId] = useState(() => (flat.find((f) => f.item.id === 'fluxcloud') ?? flat[0])?.item.id ?? '');
  const [hoverId, setHoverId] = useState<string | null>(null);

  const hold = useRef({ pointer: false, focus: false });
  const pausedRef = useRef(false);
  const sync = () => {
    pausedRef.current = hold.current.pointer || hold.current.focus;
  };

  const selectedIndex = Math.max(
    0,
    flat.findIndex((f) => f.item.id === selectedId),
  );
  const selected = flat[selectedIndex];
  const step = (delta: 1 | -1) => {
    const next = flat[(selectedIndex + delta + flat.length) % flat.length];
    if (next) setSelectedId(next.item.id);
  };

  return (
    <div
      className={styles.showcase}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        hold.current.pointer = true;
        sync();
      }}
      onPointerLeave={() => {
        hold.current.pointer = false;
        sync();
      }}
      onFocus={(e) => {
        // A click also focuses a node; only the keyboard should hold the orbit still after the pointer leaves.
        if (!(e.target as HTMLElement).matches(':focus-visible')) return;
        hold.current.focus = true;
        sync();
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        hold.current.focus = false;
        sync();
      }}
    >
      <Reveal from="none">
        <Orbit
          rings={rings}
          selectedId={selectedId}
          hoverId={hoverId}
          pausedRef={pausedRef}
          onSelect={setSelectedId}
          onHover={setHoverId}
        />
      </Reveal>

      <Caption entries={flat} shownId={hoverId ?? selectedId} />

      <span className={styles.stepper}>
        <IconButton variant="ghost" size="sm" aria-label="Previous product" icon={<ChevronLeft size={18} aria-hidden="true" />} onClick={() => step(-1)} />
        <IconButton variant="ghost" size="sm" aria-label="Next product" icon={<ChevronRight size={18} aria-hidden="true" />} onClick={() => step(1)} />
      </span>

      <p className="sr-only" aria-live="polite">
        {selected ? `${selected.item.name}, ${STATUS[selected.item.status].label}, in the ${selected.ring.name} family` : ''}
      </p>
    </div>
  );
}
