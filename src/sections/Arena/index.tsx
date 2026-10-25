import { useCallback, useId, useState } from 'react';
import { Section, SectionHeader, useIsPhone } from '@/ui';
import { Matrix } from './Matrix';
import { MatrixPhone } from './MatrixPhone';
import { Receipt, type ReceiptTarget } from './Receipt';
import { ShapeView } from './Shape';
import { TextSwitch } from './TextSwitch';
import { Versus } from './Versus';
import type { ArenaView } from './model';
import { useArenaState } from './state';
import styles from './Arena.module.css';

/**
 * Chapter 08: The comparison arena. It opens on the matrix: every platform against every question,
 * Flux first, a receipt behind every hexagon. Head to head (pick an opponent and Flux is set against it,
 * question by question) and the radar are one word away. The view, the opponent and the radar's
 * platforms live in the URL (docs/DESIGN.md section 11), so a link reproduces the fight.
 */
export function Arena() {
  const state = useArenaState();
  const isPhone = useIsPhone();
  const { view, setView, vs, setVs, named, withIds, toggleWith } = state;
  const [receipt, setReceipt] = useState<ReceiptTarget | null>(null);
  const barId = useId();

  const openReceipt = useCallback((platformId: string, dimensionId: string, anchor: HTMLElement | null) => {
    setReceipt((cur) =>
      cur && cur.platformId === platformId && cur.dimensionId === dimensionId ? null : { platformId, dimensionId, anchor },
    );
  }, []);

  const closeReceipt = useCallback((returnFocus: boolean) => {
    setReceipt((cur) => {
      if (returnFocus && cur?.anchor?.isConnected) cur.anchor.focus({ preventScroll: true });
      return null;
    });
  }, []);

  /** Back to the switch, so a view picked from the foot of a long one does not leave you at the bottom of the next. */
  const toTop = useCallback(() => {
    const bar = document.getElementById(barId);
    if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [barId]);

  const goView = useCallback(
    (next: ArenaView) => {
      setReceipt(null);
      setView(next);
      toTop();
    },
    [setView, toTop],
  );

  const goVersus = useCallback(
    (platformId: string) => {
      setReceipt(null);
      setVs(platformId);
      setView('h2h');
      toTop();
    },
    [setVs, setView, toTop],
  );

  const openKey = receipt ? `${receipt.platformId}:${receipt.dimensionId}` : null;

  return (
    <Section id="arena" label="The comparison arena" width="wide">
      <SectionHeader
        num="08"
        eyebrow="The arena"
        title="Pick a fight, **see the receipts**"
        lede="Flux against the other DePIN networks and the big clouds, question by question"
      />

      <div id={barId} className={styles.bar}>
        <TextSwitch<ArenaView>
          aria-label="View"
          size="lg"
          value={view}
          onChange={goView}
          options={[
            { value: 'matrix', label: 'Matrix', ariaLabel: 'Matrix of every platform' },
            { value: 'h2h', label: 'Head to head' },
            { value: 'shape', label: 'Shape', ariaLabel: 'Shape of each platform' },
          ]}
        />
      </div>

      <div className={styles.stage}>
        {view === 'matrix' ? (
          isPhone ? (
            <MatrixPhone openKey={openKey} picked={named} onOpenReceipt={openReceipt} onVersus={goVersus} />
          ) : (
            <Matrix openKey={openKey} picked={named} onOpenReceipt={openReceipt} onVersus={goVersus} />
          )
        ) : null}
        {view === 'h2h' ? (
          <Versus vs={vs} onPick={setVs} openKey={openKey} onOpenReceipt={openReceipt} onMatrix={() => goView('matrix')} />
        ) : null}
        {view === 'shape' ? <ShapeView withIds={withIds} onToggle={toggleWith} onOpenReceipt={openReceipt} /> : null}
      </div>

      {receipt ? <Receipt target={receipt} onClose={closeReceipt} onVersus={goVersus} /> : null}
    </Section>
  );
}
