import { ArrowUpRight } from 'lucide-react';
import { type ReactNode, useId, useMemo } from 'react';
import { Reveal, Sources } from '@/ui';
import { buildDoors, type Door as DoorModel } from './model';
import styles from './Doors.module.css';

/** "Deploy an *app*" becomes Deploy an <b>app</b>: the weight sits on the word that matters. */
function titleParts(title: string): ReactNode[] {
  return title
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, i) => (part.startsWith('*') ? <b key={i}>{part.slice(1, -1)}</b> : part));
}

/**
 * One way in, set as type: a big headline that is the link, one line under it, and an arrow. The whole
 * row is the target (a stretched link), so a click anywhere lands; the keyboard and screen readers meet
 * one link with the line as its description. The Sources button, where there is one, sits above it.
 */
function Door({ door, index }: { door: DoorModel; index: number }) {
  const lineId = useId();
  return (
    <Reveal as="li" from="up" delay={index * 70} className={styles.row} data-lit={door.lit || undefined} data-quiet={door.quiet || undefined}>
      {/* The pointer target for the whole row (arrow, line, gaps). It is a direct child of the grid row on
          purpose: a stretched ::after on the headline link only spans the headline's grid cell. Hidden from
          the keyboard and screen readers, which meet the headline link below. */}
      <a className={styles.cover} href={door.href} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" />
      <h3 className={styles.title}>
        <a className={styles.link} href={door.href} target="_blank" rel="noopener noreferrer" aria-describedby={lineId}>
          {titleParts(door.title)}
          <span className="sr-only">
            {' '}
            ({door.action}, opens in a new tab)
          </span>
        </a>
      </h3>
      <p id={lineId} className={styles.line}>
        {door.line}
        {door.sources ? (
          <>
            {' '}
            <Sources items={door.sources} label="Sources" />
          </>
        ) : null}
      </p>
      <span className={styles.go} aria-hidden="true">
        <ArrowUpRight size={26} strokeWidth={1.5} />
      </span>
    </Reveal>
  );
}

/** The ways in, one under the other, divided by a single hairline. Deploy is lit; the last row is the quiet one. */
export function Doors() {
  const doors = useMemo(buildDoors, []);
  return (
    <ul className={styles.list} role="list" aria-label="Ways in">
      {doors.map((d, i) => (
        <Door key={d.id} door={d} index={i} />
      ))}
    </ul>
  );
}
