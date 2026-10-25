/** Small formatters for the chapter's readouts. Numbers come from the sim; nothing is typed here. */
import { formatDuration } from '@/lib/format';

/** 7.4 to "00:07". */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Real seconds to "42 s", "35 min", "1.1 h". */
export function realTime(seconds: number): string {
  if (seconds < 90) return `${Math.max(1, Math.round(seconds))} s`;
  return formatDuration(seconds / 3600);
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** "1 failure", "14 failures". */
export function failures(n: number): string {
  return `${n} ${plural(n, 'failure', 'failures')}`;
}

/** The DOM id of a lane's wrapper, so the phone strip can scroll to it. */
export function laneDomId(lane: number): string {
  return `takedown-lane-${lane}`;
}
