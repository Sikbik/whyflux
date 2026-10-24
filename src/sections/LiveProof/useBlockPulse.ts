import { useEffect, useState } from 'react';
import { LIVE_ENDPOINTS } from '@/lib/live';

/** How often the heartbeat asks the chain for its height while it is on screen. */
const POLL_MS = 3000;

export interface BlockPulse {
  /** The newest height we have heard from the chain, if any. */
  height?: number;
  /**
   * True once a block was seen arriving while we were watching, so the beat is real. Until then the
   * heartbeat runs from the 30 second cadence and says so.
   */
  observed: boolean;
  /** When the newest block arrived (epoch ms), to within the poll interval. Only when `observed`. */
  arrivedAt?: number;
  /** When the last poll succeeded (epoch ms). */
  seenAt?: number;
  /** Three polls in a row failed: the estimate takes over. */
  offline: boolean;
}

const INITIAL: BlockPulse = { observed: false, offline: false };

/**
 * Watches the chain: polls `getblockcount` (the same endpoint the live layer uses, listed in
 * LIVE_ENDPOINTS) every few seconds while `active`, and notes the moment the height goes up. That
 * moment is a block arriving, which is what the heartbeat shows. It never throws; failures just
 * leave the last good answer in place.
 */
export function useBlockPulse(active: boolean): BlockPulse {
  const [pulse, setPulse] = useState<BlockPulse>(INITIAL);

  useEffect(() => {
    if (!active) return;
    const ctl = new AbortController();
    let timer = 0;
    let fails = 0;

    const poll = async () => {
      try {
        const res = await fetch(LIVE_ENDPOINTS.blockCount, {
          signal: ctl.signal,
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        const body = (await res.json()) as { status?: unknown; data?: unknown };
        const h = body.status === 'success' && typeof body.data === 'number' && Number.isFinite(body.data) ? body.data : undefined;
        if (h === undefined) throw new Error('unexpected answer');
        const now = Date.now();
        fails = 0;
        setPulse((s) => {
          if (s.height === undefined) return { ...s, height: h, seenAt: now, offline: false };
          if (h <= s.height) return { ...s, seenAt: now, offline: false };
          // One block since the last look, and the last look was recent: it arrived between the two.
          const recent = s.seenAt !== undefined && now - s.seenAt < POLL_MS * 2.5;
          const clean = recent && h - s.height === 1;
          return {
            height: h,
            observed: clean || (s.observed && recent),
            arrivedAt: clean ? ((s.seenAt ?? now) + now) / 2 : s.arrivedAt,
            seenAt: now,
            offline: false,
          };
        });
      } catch {
        if (ctl.signal.aborted) return;
        fails += 1;
        if (fails >= 3) setPulse((s) => (s.offline ? s : { ...s, offline: true }));
      }
      if (!ctl.signal.aborted) timer = window.setTimeout(poll, POLL_MS);
    };

    void poll();
    return () => {
      ctl.abort();
      window.clearTimeout(timer);
    };
  }, [active]);

  return pulse;
}
