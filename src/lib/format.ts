/** Number and date formatting. Every figure on the page goes through these so it reads the same. */

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatInt(n: number): string {
  return nf0.format(Math.round(n));
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** 12,400 -> "12.4K", 3_100_000 -> "3.1M". */
export function formatCompact(n: number, decimals = 1): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${trim(n / 1e9, decimals)}B`;
  if (a >= 1e6) return `${trim(n / 1e6, decimals)}M`;
  if (a >= 1e3) return `${trim(n / 1e3, decimals)}K`;
  return trim(n, decimals);
}

function trim(n: number, decimals: number): string {
  return n.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function formatUsd(n: number, decimals = 0): string {
  return `$${formatNumber(n, decimals)}`;
}

export function formatPercent(n: number, decimals = 0): string {
  return `${formatNumber(n, decimals)}%`;
}

/** Hours to a human duration: 0.5 -> "30 min", 14 -> "14 h", 49 -> "2 d 1 h". */
export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${trim(hours, 1)} h`;
  const d = Math.floor(hours / 24);
  const h = Math.round(hours - d * 24);
  return h ? `${d} d ${h} h` : `${d} d`;
}

const dtf = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** "2026-03-04" -> "Mar 4, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? iso : dtf.format(d);
}

/** Whole years between an ISO date and now (for "N years online" lines, derived from data). */
export function yearsSince(iso: string, now: Date = new Date()): number {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return 0;
  return (now.getTime() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
}

/** "3 min ago" style age for freshness chips. */
export function formatAge(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s} s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

/** 7 -> "07": chapter numbers. */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Data headlines are written as sentences ("git push to a decentralized cloud."). Used as a heading,
 * label or button, a trailing period breaks a house rule: strip it. A trailing "..." or an
 * abbreviation like "etc." is left alone.
 */
export function stripPeriod(s: string): string {
  const t = s.trimEnd();
  return t.endsWith('.') && !t.endsWith('..') && !/\b(?:etc|e\.g|i\.e|vs)\.$/i.test(t) ? t.slice(0, -1) : t;
}
