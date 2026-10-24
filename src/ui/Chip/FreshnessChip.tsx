import { useEffect, useState } from 'react';
import { formatAge } from '@/lib/format';
import type { FluxLiveSnapshot } from '@/lib/live';
import { Chip } from './Chip';

export interface FreshnessChipProps {
  /** The live snapshot's status: loading, live (just fetched) or snapshot (bundled fallback). */
  status: FluxLiveSnapshot['status'];
  /** ISO timestamp of the data (snapshot.fetchedAt). */
  fetchedAt?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Honest data labels as quiet text, never a pill. "Live" is a breathing green dot and the age in
 * muted words; "Snapshot" is amber words with the date it was taken (the bundled fallback is never
 * dressed as live); "Syncing" is a grey dot while nothing has arrived. Put one next to every live
 * number.
 */
export function FreshnessChip({ status, fetchedAt, size = 'sm', className }: FreshnessChipProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status === 'loading') return;
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, [status]);

  if (status === 'live') {
    return (
      <Chip tone="ok" bullet="pulse" muted size={size} className={className}>
        Live{fetchedAt ? ` ${formatAge(fetchedAt, now)}` : ''}
      </Chip>
    );
  }
  if (status === 'snapshot') {
    return (
      <Chip tone="warn" bullet size={size} className={className}>
        Snapshot{fetchedAt ? ` ${fetchedAt.slice(0, 10)}` : ''}
      </Chip>
    );
  }
  return (
    <Chip tone="neutral" bullet="pulse" size={size} className={className}>
      Syncing
    </Chip>
  );
}
