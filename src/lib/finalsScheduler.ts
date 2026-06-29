import type { ClassItem, Commitment, DayIndex, Preferences } from '../types';
import { fmtHours, jsDayToIndex } from './time';

// ---- Comfort → study time ----------------------------------------------

export interface ComfortLevel {
  value: number; // 1..5
  label: string;
  hint: string;
  baseHours: number;
}

export const COMFORT_LEVELS: ComfortLevel[] = [
  { value: 1, label: 'Lost', hint: 'Need to relearn it', baseHours: 10 },
  { value: 2, label: 'Shaky', hint: 'Big gaps to fill', baseHours: 8 },
  { value: 3, label: 'Okay', hint: 'Solid review needed', baseHours: 6 },
  { value: 4, label: 'Solid', hint: 'Just polishing', baseHours: 4 },
  { value: 5, label: 'Confident', hint: 'A light refresh', baseHours: 2 },
];

/** Recommended finals study hours from comfort, nudged by class weight (units). */
export function comfortToHours(comfort: number, units: number): number {
  const base = COMFORT_LEVELS.find((c) => c.value === comfort)?.baseHours ?? 6;
  const scaled = base * (0.7 + units / 10);
  return Math.max(1, Math.round(scaled * 2) / 2);
}

// ---- Finals plan types --------------------------------------------------

export interface FinalsClassInput {
  classId: string;
  hasExam: boolean;
  comfort: number;
  studyHours: number;
  examDate: string; // ISO 'YYYY-MM-DD'
  examStart: number; // minutes
  examEnd: number;
}

export interface FinalsEvent {
  id: string;
  kind: 'exam' | 'study';
  classId: string;
  title: string;
  date: string; // ISO
  start: number;
  end: number;
  color: string;
}

export interface FinalsPlan {
  events: FinalsEvent[];
  startDate: string;
  endDate: string;
  perClass: Record<string, { target: number; scheduled: number }>;
  warnings: string[];
}

// ---- Date helpers -------------------------------------------------------

function isoToDate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}
function dateToISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function weekdayOf(iso: string): DayIndex {
  return jsDayToIndex(isoToDate(iso).getDay());
}
function eachDate(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const end = isoToDate(endISO);
  const cur = isoToDate(startISO);
  let guard = 0;
  while (cur <= end && guard < 400) {
    out.push(dateToISO(cur));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return out;
}

interface Slot {
  date: string;
  start: number;
  end: number;
  used: boolean;
}

let counter = 0;
const uid = () => `f${Date.now().toString(36)}-${(counter++).toString(36)}`;

// ---- Planner ------------------------------------------------------------

export function generateFinalsPlan(
  classes: ClassItem[],
  commitments: Commitment[],
  inputs: Record<string, FinalsClassInput>,
  prefs: Preferences,
  prepStartISO: string,
): FinalsPlan {
  const warnings: string[] = [];
  const examClasses = classes.filter(
    (c) => inputs[c.id]?.hasExam && inputs[c.id]?.examDate,
  );

  if (!examClasses.length) {
    return {
      events: [],
      startDate: prepStartISO,
      endDate: prepStartISO,
      perClass: {},
      warnings: ['Add at least one final with a date to build a plan.'],
    };
  }

  const examDates = examClasses.map((c) => inputs[c.id].examDate);
  const firstExam = examDates.reduce((a, b) => (a < b ? a : b));
  const lastExam = examDates.reduce((a, b) => (a > b ? a : b));
  // Make sure there's at least some runway before the first exam.
  let startDate = prepStartISO;
  if (startDate > firstExam) startDate = firstExam;

  const dates = eachDate(startDate, lastExam);
  const events: FinalsEvent[] = [];

  // Exam events + a per-date busy map (commitments by weekday + exams that day).
  const busyByDate = new Map<string, { start: number; end: number }[]>();
  const pushBusy = (date: string, start: number, end: number) => {
    if (!busyByDate.has(date)) busyByDate.set(date, []);
    busyByDate.get(date)!.push({ start, end });
  };

  for (const date of dates) {
    const wd = weekdayOf(date);
    for (const cm of commitments) {
      for (const b of cm.blocks) {
        if (b.day === wd) pushBusy(date, b.start, b.end);
      }
    }
  }
  for (const c of examClasses) {
    const inp = inputs[c.id];
    pushBusy(inp.examDate, inp.examStart, inp.examEnd);
    events.push({
      id: uid(),
      kind: 'exam',
      classId: c.id,
      title: `Final — ${c.code || c.name}`,
      date: inp.examDate,
      start: inp.examStart,
      end: inp.examEnd,
      color: c.color,
    });
  }

  // Candidate study slots per date (wake→sleep minus busy, chunked).
  const slotsByDate = new Map<string, Slot[]>();
  for (const date of dates) {
    const busy = (busyByDate.get(date) ?? []).slice().sort((a, b) => a.start - b.start);
    const gaps: { start: number; end: number }[] = [];
    let cursor = prefs.wake;
    for (const b of busy) {
      const bs = Math.max(b.start, prefs.wake);
      const be = Math.min(b.end, prefs.sleep);
      if (bs > cursor) gaps.push({ start: cursor, end: bs });
      cursor = Math.max(cursor, be);
    }
    if (cursor < prefs.sleep) gaps.push({ start: cursor, end: prefs.sleep });

    const slots: Slot[] = [];
    for (const g of gaps) {
      let c = g.start;
      while (g.end - c >= 30) {
        const len = Math.min(prefs.maxStudyBlock, g.end - c);
        slots.push({ date, start: c, end: c + len, used: false });
        c += len + prefs.minBreak;
      }
    }
    slotsByDate.set(date, slots);
  }

  // Assign per class, earliest exam first (earliest deadline first). Fill the
  // days closest to each exam first, but spread one block per day per pass.
  const perClass: Record<string, { target: number; scheduled: number }> = {};
  const ordered = [...examClasses].sort((a, b) =>
    inputs[a.id].examDate < inputs[b.id].examDate ? -1 : 1,
  );

  for (const c of ordered) {
    const inp = inputs[c.id];
    const target = Math.round(inp.studyHours * 60);
    let remaining = target;

    const eligibleDates = dates
      .filter((d) => d <= inp.examDate)
      .sort((a, b) => (a < b ? 1 : -1)); // closest to exam first

    const eligibleSlot = (date: string) =>
      (slotsByDate.get(date) ?? []).find(
        (s) => !s.used && (date < inp.examDate || s.end <= inp.examStart),
      );

    let progress = true;
    while (remaining > 0 && progress) {
      progress = false;
      for (const date of eligibleDates) {
        if (remaining <= 0) break;
        const slot = eligibleSlot(date);
        if (!slot) continue;
        const len = Math.min(remaining, slot.end - slot.start);
        if (len < 30) {
          slot.used = true;
          continue;
        }
        events.push({
          id: uid(),
          kind: 'study',
          classId: c.id,
          title: `Finals study — ${c.code || c.name}`,
          date,
          start: slot.start,
          end: slot.start + len,
          color: c.color,
        });
        slot.used = true;
        remaining -= len;
        progress = true;
      }
    }

    perClass[c.id] = { target, scheduled: target - remaining };
    if (remaining > 15) {
      warnings.push(
        `Only fit ${fmtHours(target - remaining)} of ${fmtHours(target)} for ${
          c.code || c.name
        } before its exam. Start prepping earlier or trim study time.`,
      );
    }
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.start - b.start));

  return { events, startDate, endDate: lastExam, perClass, warnings };
}

// ---- ICS export (dated, non-recurring) ---------------------------------

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function dtLocal(dateISO: string, minutes: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;
}
function dtStampUTC(): string {
  const d = new Date();
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildFinalsICS(plan: FinalsPlan): string {
  const stamp = dtStampUTC();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CourseNest//Finals//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CourseNest Finals',
  ];
  let seq = 0;
  for (const ev of plan.events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:coursenest-finals-${seq++}-${ev.date}@coursenest.app`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${dtLocal(ev.date, ev.start)}`);
    lines.push(`DTEND:${dtLocal(ev.date, ev.end)}`);
    lines.push(`SUMMARY:${esc(ev.title)}`);
    if (ev.kind === 'exam') lines.push('DESCRIPTION:Final exam');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
