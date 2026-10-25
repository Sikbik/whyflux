import { ArrowRight, BookOpen } from 'lucide-react';
import { LinkButton, Reveal } from '@/ui';
import { docsSource, ecosystemItem, titanSource } from './model';
import styles from './Closing.module.css';

/**
 * The way in, and the way on: read the docs and run a node, or stake with Titan and bring no
 * hardware, then on to the next chapter. Three links, no sentence between them.
 */
export function Closing() {
  const docs = docsSource();
  const titan = titanSource(ecosystemItem('fluxnodes')?.sources);

  return (
    <Reveal className={styles.closing}>
      {docs ? (
        <LinkButton href={docs.url} variant="primary" size="lg" icon={<BookOpen size={18} strokeWidth={1.75} aria-hidden="true" />}>
          Read the node docs
        </LinkButton>
      ) : null}
      {titan ? (
        <LinkButton href={titan.url} variant="secondary" size="lg">
          Stake with Titan
        </LinkButton>
      ) : null}
      <LinkButton href="#sealed" variant="ghost" size="lg" iconEnd={<ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />}>
        See how your app stays sealed
      </LinkButton>
    </Reveal>
  );
}
