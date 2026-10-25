import { type ComponentType, lazy, Suspense } from 'react';
import { SectionBoundary } from './SectionBoundary';

type SectionModule = Record<string, unknown>;

/**
 * A chapter loaded as its own chunk. Every loader starts the moment this module evaluates, so all
 * chapters download in parallel right after the shell; `lazy` only waits for the promise.
 *
 * Why lazy: a chapter whose module fails to load (a broken import mid-edit, a bad chunk) rejects its
 * own promise, which SectionBoundary catches. A static import would fail the whole page instead.
 */
export function chapter(load: () => Promise<SectionModule>, exportName: string): ComponentType {
  const pending = load();
  pending.catch(() => {}); // surfaced by the boundary on render; this only silences the early rejection
  return lazy(async () => {
    const mod = await pending;
    const component = mod[exportName];
    if (typeof component !== 'function') throw new Error(`chapter module has no export "${exportName}"`);
    return { default: component as ComponentType };
  });
}

interface Props {
  /** Chapter id: the anchor, kept on the placeholder so deep links land while the chunk loads. */
  id: string;
  component: ComponentType;
}

export function LazySection({ id, component: Chapter }: Props) {
  return (
    <SectionBoundary id={id}>
      <Suspense fallback={<section id={id} aria-busy="true" style={{ minHeight: '100vh' }} />}>
        <Chapter />
      </Suspense>
    </SectionBoundary>
  );
}
