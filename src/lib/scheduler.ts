import type {
  ClassItem,
  Commitment,
  DayIndex,
  GeneratedSchedule,
  Preferences,
  ScheduleItem,
  TimeBlock,
} from '../types';
import { fmtHours } from './time';
import { COMMITMENT_META, FREE_COLOR, STUDY_COLOR } from './colors';

interface Interval {
  day: DayIndex;
  start: number;
  end: number;
}

let counter = 0;
const uid = () => `s${Date.now().toString(36)}-${(counter++).toString(36)}`;

const STUDY_WINDOWS: Record<string, [number, number]> = {
  morning: [6 * 60, 12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening: [17 * 60, 22 * 60],
  any: [0, 24 * 60],
};

/** Subtract a set of busy blocks from a [start,end] window on one day. */
function freeGaps(
  day: DayIndex,
  windowStart: number,
  windowEnd: number,
  busy: TimeBlock[],
): Interval[] {
  const dayBusy = busy
    .filter((b) => b.day === day && b.end > windowStart && b.start < windowEnd)
    .map((b) => ({
      start: Math.max(b.start, windowStart),
      end: Math.min(b.end, windowEnd),
    }))
    .sort((a, b) => a.start - b.start);

  const gaps: Interval[] = [];
  let cursor = windowStart;
  for (const b of dayBusy) {
    if (b.start > cursor) gaps.push({ day, start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < windowEnd) gaps.push({ day, start: cursor, end: windowEnd });
  return gaps;
}

/** How well a candidate start time matches the preferred study window (0..1). */
function windowScore(start: number, window: [number, number]): number {
  const [ws, we] = window;
  if (start >= ws && start < we) return 1;
  const dist = start < ws ? ws - start : start - we;
  return Math.max(0, 1 - dist / 240); // decay over 4 hours
}

export function generateSchedule(
  classes: ClassItem[],
  commitments: Commitment[],
  prefs: Preferences,
): GeneratedSchedule {
  const items: ScheduleItem[] = [];
  const busy: TimeBlock[] = [];
  const warnings: string[] = [];

  // 1) Fixed: class meetings
  for (const c of classes) {
    for (const m of c.meetings) {
      busy.push(m);
      items.push({
        id: uid(),
        kind: 'class',
        title: `${c.code ? c.code + ' — ' : ''}${c.name}`,
        day: m.day,
        start: m.start,
        end: m.end,
        color: c.color,
        location: m.location,
        classId: c.id,
      });
    }
  }

  // 2) Fixed: commitments
  for (const cm of commitments) {
    for (const b of cm.blocks) {
      busy.push(b);
      items.push({
        id: uid(),
        kind: cm.type === 'meal' ? 'meal' : 'commitment',
        title: cm.title,
        day: b.day,
        start: b.start,
        end: b.end,
        color: cm.color,
        location: b.location,
      });
    }
  }

  // 3) Optional meal blocks (only where they don't collide with something fixed)
  if (prefs.includeMeals) {
    const meals: Array<{ title: string; start: number; end: number }> = [
      { title: 'Lunch', start: 12 * 60, end: 12 * 60 + 45 },
      { title: 'Dinner', start: 18 * 60, end: 18 * 60 + 45 },
    ];
    for (let day = 0; day < 7; day++) {
      for (const meal of meals) {
        const collides = busy.some(
          (b) => b.day === day && b.start < meal.end && b.end > meal.start,
        );
        if (!collides) {
          const block: TimeBlock = { day: day as DayIndex, start: meal.start, end: meal.end };
          busy.push(block);
          items.push({
            id: uid(),
            kind: 'meal',
            title: meal.title,
            day: day as DayIndex,
            start: meal.start,
            end: meal.end,
            color: COMMITMENT_META.meal.color,
          });
        }
      }
    }
  }

  // 4) Build candidate study slots from free gaps on allowed study days
  const window = STUDY_WINDOWS[prefs.studyWindow] ?? STUDY_WINDOWS.any;
  const studyDays = new Set(prefs.studyDays);
  const candidates: Interval[] = [];
  for (let day = 0; day < 7; day++) {
    if (!studyDays.has(day as DayIndex)) continue;
    const gaps = freeGaps(day as DayIndex, prefs.wake, prefs.sleep, busy);
    for (const gap of gaps) {
      // Chop a gap into chunks no longer than maxStudyBlock, leaving a break.
      let cursor = gap.start;
      while (gap.end - cursor >= 30) {
        const len = Math.min(prefs.maxStudyBlock, gap.end - cursor);
        candidates.push({ day: day as DayIndex, start: cursor, end: cursor + len });
        cursor += len + prefs.minBreak;
      }
    }
  }

  // 5) Score & order candidates (prefer the chosen window, then earlier in the day)
  const scored = candidates
    .map((c) => ({
      c,
      score: windowScore(c.start, window) * 100 - c.start / 600,
    }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.c);

  // 6) Demand per class
  const need = new Map<string, number>();
  for (const c of classes) need.set(c.id, Math.round(c.studyHoursPerWeek * 60));
  const requiredStudyMin = Array.from(need.values()).reduce((a, b) => a + b, 0);

  const totalFreeAvailable = candidates.reduce((a, c) => a + (c.end - c.start), 0);
  const freeTargetMin = prefs.freeTimePerWeek * 60;

  // Track which day each class already has a block on, to spread across the week.
  const classDayCount = new Map<string, Map<DayIndex, number>>();
  classes.forEach((c) => classDayCount.set(c.id, new Map()));

  const usedRanges: TimeBlock[] = [];
  const studyBlocks: ScheduleItem[] = [];

  // Greedy multi-pass: each pass lays at most one block per class, spreading days.
  let safety = 0;
  while (Array.from(need.values()).some((v) => v > 0) && safety < 400) {
    safety++;
    let placedSomething = false;

    for (const cand of scored) {
      // Skip candidate slots already consumed.
      const overlaps = usedRanges.some(
        (u) => u.day === cand.day && u.start < cand.end && u.end > cand.start,
      );
      if (overlaps) continue;

      // Choose the neediest class that has the fewest blocks on this day.
      const ranked = classes
        .filter((c) => (need.get(c.id) ?? 0) > 0)
        .sort((a, b) => {
          const da = classDayCount.get(a.id)!.get(cand.day) ?? 0;
          const db = classDayCount.get(b.id)!.get(cand.day) ?? 0;
          if (da !== db) return da - db; // prefer class not yet on this day
          return (need.get(b.id) ?? 0) - (need.get(a.id) ?? 0); // then neediest
        });
      if (!ranked.length) break;
      const cls = ranked[0];

      const remaining = need.get(cls.id)!;
      // Respect free-time reservation: stop converting slots once we'd dip below target.
      const usedStudy = studyBlocks.reduce((a, s) => a + (s.end - s.start), 0);
      if (totalFreeAvailable - usedStudy <= freeTargetMin && usedStudy >= requiredStudyMin) {
        break;
      }

      const len = Math.min(remaining, cand.end - cand.start);
      if (len < 30) continue;
      const end = cand.start + len;

      studyBlocks.push({
        id: uid(),
        kind: 'study',
        title: `Study — ${cls.code || cls.name}`,
        day: cand.day,
        start: cand.start,
        end,
        color: STUDY_COLOR,
        classId: cls.id,
      });
      usedRanges.push({ day: cand.day, start: cand.start, end });
      need.set(cls.id, remaining - len);
      const dc = classDayCount.get(cls.id)!;
      dc.set(cand.day, (dc.get(cand.day) ?? 0) + 1);
      placedSomething = true;
    }

    if (!placedSomething) break;
  }

  items.push(...studyBlocks);
  const scheduledStudyMin = studyBlocks.reduce((a, s) => a + (s.end - s.start), 0);

  // 7) Whatever free gaps remain become Free-time blocks.
  const allBusy: TimeBlock[] = [...busy, ...usedRanges];
  let freeMin = 0;
  for (let day = 0; day < 7; day++) {
    const gaps = freeGaps(day as DayIndex, prefs.wake, prefs.sleep, allBusy);
    for (const g of gaps) {
      if (g.end - g.start < 30) continue;
      freeMin += g.end - g.start;
      items.push({
        id: uid(),
        kind: 'free',
        title: 'Free time',
        day: day as DayIndex,
        start: g.start,
        end: g.end,
        color: FREE_COLOR,
      });
    }
  }

  // 8) Per-class accounting + warnings
  const perClass: Record<string, { required: number; scheduled: number }> = {};
  for (const c of classes) {
    const required = Math.round(c.studyHoursPerWeek * 60);
    const scheduled = studyBlocks
      .filter((s) => s.classId === c.id)
      .reduce((a, s) => a + (s.end - s.start), 0);
    perClass[c.id] = { required, scheduled };
    if (scheduled < required - 15) {
      warnings.push(
        `Only fit ${fmtHours(scheduled)} of the ${fmtHours(required)} recommended for ${
          c.code || c.name
        }. Free up time or widen study hours.`,
      );
    }
  }

  if (freeMin < freeTargetMin - 30) {
    warnings.push(
      `Your week leaves about ${fmtHours(freeMin)} of free time — short of your ${fmtHours(
        freeTargetMin,
      )} goal. Consider trimming commitments or study load.`,
    );
  }

  return {
    items,
    summary: {
      requiredStudyMin,
      scheduledStudyMin,
      freeMin,
      perClass,
      warnings,
    },
  };
}
