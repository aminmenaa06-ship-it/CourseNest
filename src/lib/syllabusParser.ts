import type { DayIndex, FinalExamInfo, TimeBlock } from '../types';

export interface ParsedSyllabus {
  name: string | null;
  code: string | null;
  units: number | null;
  meetings: TimeBlock[];
  /** Explicit "expected hours per week outside class" if the syllabus states it. */
  explicitStudyHours: number | null;
  /** Final-exam date/time if stated in the syllabus. */
  finalExam: FinalExamInfo | null;
  /** Which fields we were confident about, for UI hints. */
  confidence: {
    name: boolean;
    units: boolean;
    meetings: boolean;
    studyHours: boolean;
    finalExam: boolean;
  };
}

// ---- Day parsing -------------------------------------------------------

const DAY_TOKENS: Record<string, DayIndex> = {
  monday: 0, mon: 0, m: 0,
  tuesday: 1, tues: 1, tue: 1, tu: 1, t: 1,
  wednesday: 2, wed: 2, w: 2,
  thursday: 3, thurs: 3, thur: 3, thu: 3, th: 3, r: 3,
  friday: 4, fri: 4, f: 4,
  saturday: 5, sat: 5, sa: 5,
  sunday: 6, sun: 6, su: 6,
};

/**
 * Parse compact day codes like "MWF", "TR", "MW", "TTh", "MTWRF".
 * Returns null if the string doesn't look like a day code.
 */
function parseCompactDays(raw: string): DayIndex[] | null {
  const s = raw.replace(/[^A-Za-z]/g, '');
  if (!s) return null;
  const days: DayIndex[] = [];
  let i = 0;
  while (i < s.length) {
    const two = s.slice(i, i + 2).toLowerCase();
    const one = s[i].toLowerCase();
    if (two === 'th') {
      days.push(3);
      i += 2;
      continue;
    }
    if (two === 'tu') {
      days.push(1);
      i += 2;
      continue;
    }
    if (two === 'su') {
      days.push(6);
      i += 2;
      continue;
    }
    if (two === 'sa') {
      days.push(5);
      i += 2;
      continue;
    }
    const map: Record<string, DayIndex> = { m: 0, t: 1, w: 2, r: 3, f: 4, s: 5, u: 6 };
    if (one in map) {
      days.push(map[one]);
      i += 1;
    } else {
      return null;
    }
  }
  return days.length ? Array.from(new Set(days)).sort((a, b) => a - b) : null;
}

/** Parse a list of full/short day names separated by /,&-and. */
function parseNamedDays(raw: string): DayIndex[] {
  const parts = raw
    .toLowerCase()
    .split(/[\s,/&]+|and/)
    .map((p) => p.trim())
    .filter(Boolean);
  const days: DayIndex[] = [];
  for (const p of parts) {
    if (p in DAY_TOKENS) days.push(DAY_TOKENS[p]);
  }
  return Array.from(new Set(days)).sort((a, b) => a - b);
}

// ---- Time parsing ------------------------------------------------------

function parseTimeToken(token: string, fallbackPM?: boolean): number | null {
  const m = token
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3]?.replace(/\./g, '');
  if (h > 23 || min > 59) return null;
  if (mer === 'pm') {
    if (h !== 12) h += 12;
  } else if (mer === 'am') {
    if (h === 12) h = 0;
  } else if (fallbackPM && h < 8) {
    // Heuristic: a class "end" time like "1:50" with no meridiem is PM.
    h += 12;
  }
  return h * 60 + min;
}

/** Parse "10:00 - 11:50 AM" / "9–9:50am" / "2:00pm to 3:15pm". */
function parseTimeRange(raw: string): { start: number; end: number } | null {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  const m = cleaned.match(
    /(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)\s*(?:-|–|—|to|until)\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)/i,
  );
  if (!m) return null;
  const endHasMer = /[ap]\.?m/i.test(m[2]);
  const startHasMer = /[ap]\.?m/i.test(m[1]);
  let end = parseTimeToken(m[2], !endHasMer);
  if (end === null) return null;
  // If start has no meridiem, inherit from end's half of day.
  let start = parseTimeToken(m[1], false);
  if (start === null) return null;
  if (!startHasMer && endHasMer) {
    // Start has no meridiem. Prefer the SAME half of day as the end (e.g.
    // "2:00 - 3:00 PM" → 2 PM, not 2 AM), falling back to the other half only
    // if that's what keeps start before end (e.g. "11:00 - 1:00 PM" → 11 AM).
    const startBare = m[1].trim();
    const endIsPM = /p\.?m/i.test(m[2]);
    const sameMer = endIsPM ? ' pm' : ' am';
    const otherMer = endIsPM ? ' am' : ' pm';
    const guessSame = parseTimeToken(startBare + sameMer, false);
    const guessOther = parseTimeToken(startBare + otherMer, false);
    if (guessSame !== null && guessSame < end) start = guessSame;
    else if (guessOther !== null && guessOther < end) start = guessOther;
  }
  if (end <= start) {
    // Bump end into the afternoon if it slipped (e.g. 11:00-1:00).
    if (end + 720 > start) end += 720;
  }
  if (end <= start) return null;
  return { start, end };
}

// ---- Field extractors --------------------------------------------------

const COURSE_CODE_RE = /\b([A-Z]{2,4}(?:\s|-)?\d{1,3}[A-Z]{0,2})\b/;

function extractCode(text: string): string | null {
  // Prefer a code appearing on an early line.
  const head = text.split('\n').slice(0, 12).join('\n');
  const m = head.match(COURSE_CODE_RE) || text.match(COURSE_CODE_RE);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

function extractName(text: string, code: string | null): string | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Look for explicit "Course Title:" labels first.
  for (const l of lines.slice(0, 25)) {
    const m = l.match(/(?:course\s*(?:title|name)|title)\s*[:\-]\s*(.+)/i);
    if (m && m[1].trim().length > 2) return clean(m[1]);
  }

  // A line containing the code is often "CS 101: Intro to Programming".
  if (code) {
    for (const l of lines.slice(0, 15)) {
      if (l.toUpperCase().includes(code.toUpperCase())) {
        const after = l.split(new RegExp(code.replace(/\s/g, '\\s*'), 'i'))[1] || '';
        const t = after.replace(/^[\s:.\-–—]+/, '').trim();
        if (t.length > 3 && !/syllabus/i.test(t)) return clean(t);
      }
    }
  }

  // Otherwise the most "title-like" of the first few lines.
  for (const l of lines.slice(0, 8)) {
    if (
      l.length > 6 &&
      l.length < 80 &&
      !/syllabus|semester|fall|spring|winter|summer|\d{4}|professor|instructor|university|college|department/i.test(
        l,
      )
    ) {
      return clean(l);
    }
  }
  return null;
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/[\s:–—\-]+$/, '').trim();
}

function extractUnits(text: string): number | null {
  const patterns = [
    /(\d(?:\.\d)?)\s*(?:semester\s*)?(?:credit\s*hours?|credits?|units?|cr\.?\b)/i,
    /(?:credit\s*hours?|credits?|units?)\s*[:\-]?\s*(\d(?:\.\d)?)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = parseFloat(m[1]);
      if (n >= 0.5 && n <= 12) return n;
    }
  }
  return null;
}

function extractExplicitStudyHours(text: string): number | null {
  // e.g. "expect to spend 6-9 hours per week outside of class", "8 hours/week of homework"
  const re =
    /(\d{1,2})(?:\s*[-–to]+\s*(\d{1,2}))?\s*hours?\s*(?:per|\/|a)\s*week[^.\n]{0,40}?(?:outside|study|homework|prepar|reading|coursework)?/i;
  const m = text.match(re);
  if (m) {
    const lo = parseInt(m[1], 10);
    const hi = m[2] ? parseInt(m[2], 10) : lo;
    const avg = Math.round((lo + hi) / 2);
    if (avg >= 1 && avg <= 40) return avg;
  }
  // Reverse phrasing: "outside of class ... 6 hours/week"
  const re2 =
    /(?:outside\s*of\s*class|independent\s*study|study\s*time|workload)[^.\n]{0,40}?(\d{1,2})(?:\s*[-–to]+\s*(\d{1,2}))?\s*hours?/i;
  const m2 = text.match(re2);
  if (m2) {
    const lo = parseInt(m2[1], 10);
    const hi = m2[2] ? parseInt(m2[2], 10) : lo;
    const avg = Math.round((lo + hi) / 2);
    if (avg >= 1 && avg <= 40) return avg;
  }
  return null;
}

function extractMeetings(text: string): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const seen = new Set<string>();

  const lines = text.split('\n');
  for (const line of lines) {
    const range = parseTimeRange(line);
    if (!range) continue;
    // Find the day portion: text before the time range on the same line.
    const idx = line.search(
      /\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to|until)/i,
    );
    const before = idx > 0 ? line.slice(0, idx) : line;

    let days: DayIndex[] = [];
    // Try named days anywhere in the leading text.
    const named = parseNamedDays(before);
    if (named.length) days = named;
    else {
      // Try a compact token (last alpha run before the time).
      const tokens = before.match(/[A-Za-z]{1,7}/g) || [];
      for (let i = tokens.length - 1; i >= 0; i--) {
        const compact = parseCompactDays(tokens[i]);
        if (compact && compact.length) {
          days = compact;
          break;
        }
      }
    }
    if (!days.length) continue;

    for (const day of days) {
      const key = `${day}-${range.start}-${range.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      blocks.push({ day, start: range.start, end: range.end });
    }
  }
  return blocks.sort((a, b) => a.day - b.day || a.start - b.start);
}

// ---- Final exam ---------------------------------------------------------

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function isoDate(month0: number, day: number, year: number): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${year}-${p(month0 + 1)}-${p(day)}`;
}

const FINAL_RE = /final\s*(?:exam|assessment)|exam.*\bfinal\b|\bfinal\b\s*[:\-]/i;
const NOT_FINAL_RE = /final\s*(?:grade|project|paper|essay|presentation|draft|portfolio|report)/i;

function extractFinalExam(text: string): FinalExamInfo | null {
  const lines = text.split('\n');
  let context = '';

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (FINAL_RE.test(l) && !NOT_FINAL_RE.test(l)) {
      const merged = `${l} ${lines[i + 1] ?? ''}`;
      if (/\d/.test(merged)) {
        context = merged;
        break;
      }
      if (!context) context = merged;
    }
  }
  if (!context || !/\d/.test(context)) return null;

  let month0: number | null = null;
  let day: number | null = null;
  let year: number | null = null;

  const named = context.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/i,
  );
  if (named) {
    month0 = MONTHS[named[1].slice(0, 3).toLowerCase()];
    day = parseInt(named[2], 10);
    year = named[3] ? parseInt(named[3], 10) : null;
  } else {
    const numeric = context.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (numeric) {
      month0 = parseInt(numeric[1], 10) - 1;
      day = parseInt(numeric[2], 10);
      if (numeric[3]) {
        year = numeric[3].length === 2 ? 2000 + parseInt(numeric[3], 10) : parseInt(numeric[3], 10);
      }
    }
  }

  if (month0 === null || day === null || month0 < 0 || month0 > 11 || day < 1 || day > 31) {
    return null;
  }

  if (year === null) {
    const now = new Date();
    year = now.getFullYear();
    const candidate = new Date(year, month0, day);
    // If the date already passed comfortably, the syllabus likely means next year.
    if (candidate.getTime() < now.getTime() - 7 * 24 * 3600 * 1000) year += 1;
  }

  const range = parseTimeRange(context);
  return { date: isoDate(month0, day, year), start: range?.start, end: range?.end };
}

// ---- Public API --------------------------------------------------------

export function parseSyllabus(text: string): ParsedSyllabus {
  const code = extractCode(text);
  const name = extractName(text, code);
  const units = extractUnits(text);
  const meetings = extractMeetings(text);
  const explicitStudyHours = extractExplicitStudyHours(text);
  const finalExam = extractFinalExam(text);

  return {
    name,
    code,
    units,
    meetings,
    explicitStudyHours,
    finalExam,
    confidence: {
      name: !!name,
      units: units !== null,
      meetings: meetings.length > 0,
      studyHours: explicitStudyHours !== null,
      finalExam: finalExam !== null && !!finalExam.date,
    },
  };
}
