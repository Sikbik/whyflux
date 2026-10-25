import type { CSSProperties, ReactNode } from 'react';
import type { ArtId } from '@/lib/art';
import { cn } from '@/lib/cn';
import { ArtPlate, type ArtPlateProps } from '../ArtPlate/ArtPlate';
import styles from './Section.module.css';

export interface SectionProps {
  /** The anchor id (#id) and the id the nav tracks. Must match the registry. */
  id: string;
  /** Accessible name of the region. */
  label: string;
  /** `cold` re-points the accent roles to steel (the web2 world). */
  mood?: 'cold';
  /** A generated plate behind the section (see src/lib/art.ts). */
  plate?: ArtId;
  plateProps?: Partial<Omit<ArtPlateProps, 'src'>>;
  /** Vertical padding: `default` (--section-y), `tight` (half), `none` (the section owns it). */
  pad?: 'default' | 'tight' | 'none';
  /** Container width: `default` 1240, `wide` 1520, `narrow` 760, `full` no container. */
  width?: 'default' | 'wide' | 'narrow' | 'full';
  className?: string;
  innerClassName?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * The frame every chapter sits in: an anchored `<section>` with the nav's id, an optional mood and
 * art plate, vertical rhythm and a container. A section builder starts here:
 *
 *   <Section id="arena" label="The comparison arena" plate="bg-lattice-floor">
 *     <SectionHeader title="Pick a fight **See the receipts**" lede="..." />
 *     ...
 *   </Section>
 */
export function Section({
  id,
  label,
  mood,
  plate,
  plateProps,
  pad = 'default',
  width = 'default',
  className,
  innerClassName,
  style,
  children,
}: SectionProps) {
  return (
    <section id={id} aria-label={label} data-section={id} data-mood={mood} data-pad={pad} className={cn(styles.section, className)} style={style}>
      {plate ? <ArtPlate src={plate} {...plateProps} /> : null}
      <div
        className={cn(width !== 'full' && 'container', styles.inner, innerClassName)}
        data-size={width === 'wide' || width === 'narrow' ? width : undefined}
      >
        {children}
      </div>
    </section>
  );
}
