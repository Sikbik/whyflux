import { Reveal } from '@/ui';
import { QUIET, type QuietLink } from './model';
import styles from './Explore.module.css';

function Quiet({ link }: { link: QuietLink }) {
  const Icon = link.icon;
  const external = link.href.startsWith('http');
  return (
    <a
      href={link.href}
      className={styles.quietLink}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
    >
      <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
      <span>{link.label}</span>
      {external ? <span className="sr-only"> (Opens in a new tab)</span> : null}
    </a>
  );
}

/** Under the ways in: a quiet row of the other places a reader might go next. */
export function Explore() {
  return (
    <Reveal from="none" delay={120}>
      <nav className={styles.quiet} aria-label="More places">
        <ul role="list">
          {QUIET.map((q) => (
            <li key={q.id}>
              <Quiet link={q} />
            </li>
          ))}
        </ul>
      </nav>
    </Reveal>
  );
}
