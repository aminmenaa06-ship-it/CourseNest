import type { DayIndex } from '../types';

/** Convert minutes-from-midnight to a display string like "9:30 AM". */
export function fmtTime(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 < 12 || h24 === 24 ? 'AM' : 'PM';
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Convert minutes-from-midnight to "HH:MM" 24h for <input type=time>. */
export function toTimeInput(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Parse "HH:MM" (24h) into minutes-from-midnight. */
export function fromTimeInput(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function fmtHours(min: number): string {
  return (min / 60).toFixed(min % 60 === 0 ? 0 : 1) + 'h';
}

/** Map a JS Date.getDay() (0=Sun) to our DayIndex (0=Mon). */
export function jsDayToIndex(jsDay: number): DayIndex {
  return ((jsDay + 6) % 7) as DayIndex;
}

/** Map our DayIndex (0=Mon) to a JS day offset within a Mon-start week. */
export function indexToDate(termStartISO: string, day: DayIndex, weekOffset = 0): Date {
  const start = new Date(termStartISO + 'T00:00:00');
  // Snap termStart to the Monday of its week.
  const startIdx = jsDayToIndex(start.getDay());
  const monday = new Date(start);
  monday.setDate(start.getDate() - startIdx);
  const d = new Date(monday);
  d.setDate(monday.getDate() + day + weekOffset * 7);
  return d;
}

export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function addWeeksISO(iso: string, weeks: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

/** ISO date of the next Monday on/after today. */
export function nextMondayISO(): string {
  const d = new Date();
  const idx = jsDayToIndex(d.getDay());
  if (idx !== 0) d.setDate(d.getDate() + (7 - idx));
  return d.toISOString().slice(0, 10);
}
