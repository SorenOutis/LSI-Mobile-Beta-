/** Formatting/parsing helpers shared across screens. */

/** Up to two initials from a full name: "Ana Clara Ortiz" -> "AO". */
export function initials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** 'YYYY-MM-DD' key built from *local* time (UTC toISOString drifts a day west of UTC). */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse a date string/number/Date. Bare 'YYYY-MM-DD' is treated as *local*
 * time (new Date() would parse it as UTC midnight and drift a day).
 * Returns null for unparseable input.
 */
export function parseDate(iso: string | number | Date | null | undefined): Date | null {
  if (iso == null) return null;
  if (typeof iso === 'number') return new Date(iso);
  if (iso instanceof Date) return Number.isNaN(iso.getTime()) ? null : iso;
  const s = String(iso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(s);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 'HH:MM' from a number of seconds. */
export function fmtTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
