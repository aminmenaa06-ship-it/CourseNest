import type { GeneratedSchedule, Preferences, ScheduleItem } from '../types';
import { indexToDate } from './time';

const ICS_DAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

interface ExportOptions {
  includeStudy: boolean;
  includeClasses: boolean;
  includeCommitments: boolean;
  includeFree: boolean;
  includeMeals: boolean;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Local datetime string in ICS form: YYYYMMDDTHHMMSS (floating local time). */
function dtLocal(date: Date, minutes: number): string {
  const d = new Date(date);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T` +
    `${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

function dtUTC(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function untilUTC(termEndISO: string): string {
  const d = new Date(termEndISO + 'T23:59:59');
  return dtUTC(d);
}

function escape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Fold long lines to 75 octets per RFC 5545. */
function fold(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  let s = line;
  chunks.push(s.slice(0, 73));
  s = s.slice(73);
  while (s.length > 72) {
    chunks.push(' ' + s.slice(0, 72));
    s = s.slice(72);
  }
  if (s.length) chunks.push(' ' + s);
  return chunks.join('\r\n');
}

const KIND_LABEL: Record<string, string> = {
  class: 'Class',
  commitment: 'Commitment',
  study: 'Study session',
  free: 'Free time',
  meal: 'Meal',
};

function shouldInclude(item: ScheduleItem, opts: ExportOptions): boolean {
  switch (item.kind) {
    case 'class':
      return opts.includeClasses;
    case 'commitment':
      return opts.includeCommitments;
    case 'study':
      return opts.includeStudy;
    case 'free':
      return opts.includeFree;
    case 'meal':
      return opts.includeMeals;
    default:
      return true;
  }
}

export function buildICS(
  schedule: GeneratedSchedule,
  prefs: Preferences,
  opts: ExportOptions,
): string {
  const now = dtUTC(new Date());
  const until = untilUTC(prefs.termEnd);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CourseNest//Semester Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CourseNest Schedule',
  ];

  let seq = 0;
  for (const item of schedule.items) {
    if (!shouldInclude(item, opts)) continue;
    // Date of this weekday in the first term week.
    const date = indexToDate(prefs.termStart, item.day, 0);
    const dtStart = dtLocal(date, item.start);
    const dtEnd = dtLocal(date, item.end);
    const uidStr = `coursenest-${item.kind}-${seq++}-${date.getTime()}@coursenest.app`;
    const descParts = [KIND_LABEL[item.kind] || item.kind];
    if (item.location) descParts.push(`Location: ${item.location}`);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uidStr}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAY[item.day]};UNTIL=${until}`);
    lines.push(fold(`SUMMARY:${escape(item.title)}`));
    lines.push(fold(`DESCRIPTION:${escape(descParts.join(' • '))}`));
    if (item.location) lines.push(fold(`LOCATION:${escape(item.location)}`));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
