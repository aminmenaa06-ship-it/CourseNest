// ----- Domain types for CourseNest -----

/** 0 = Monday ... 6 = Sunday */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** A recurring weekly time block, times stored as minutes-from-midnight. */
export interface TimeBlock {
  day: DayIndex;
  start: number; // minutes from midnight
  end: number; // minutes from midnight
  location?: string;
}

export interface School {
  id: string;
  name: string;
  /** Recommended study hours per credit unit, per week. */
  studyHoursPerUnit: number;
  /** System / grouping the school belongs to (e.g. "University of California"). */
  system?: string;
  /** Calendar type — affects how units map to a term, surfaced as a note. */
  term?: 'semester' | 'quarter';
  /** Where the number comes from, shown to the user for transparency. */
  note?: string;
}

/** Final-exam date/time, auto-pulled from the syllabus when present. */
export interface FinalExamInfo {
  /** ISO date 'YYYY-MM-DD'. */
  date?: string;
  /** Minutes from midnight. */
  start?: number;
  end?: number;
}

export interface ClassItem {
  id: string;
  name: string;
  /** Course code if detected, e.g. "CS 101". */
  code?: string;
  units: number;
  meetings: TimeBlock[];
  /**
   * Study hours per week for this class. If the syllabus stated an explicit
   * expected weekly workload we use that (auto). Otherwise it's derived from
   * units * school.studyHoursPerUnit and may be overridden by the user.
   */
  studyHoursPerWeek: number;
  /** True when studyHoursPerWeek was auto-detected from the syllabus text. */
  studyHoursAuto: boolean;
  color: string;
  /** Free-text notes / source filename. */
  source?: string;
  /** Final-exam date/time if found in the syllabus. */
  finalExam?: FinalExamInfo;
}

export type CommitmentType =
  | 'work'
  | 'volunteer'
  | 'gym'
  | 'club'
  | 'personal'
  | 'meal'
  | 'free';

export interface Commitment {
  id: string;
  title: string;
  type: CommitmentType;
  blocks: TimeBlock[];
  color: string;
}

export type StudyWindow = 'morning' | 'afternoon' | 'evening' | 'any';

export interface Preferences {
  /** Daily wake / sleep boundaries in minutes from midnight. */
  wake: number;
  sleep: number;
  /** Desired total free/leisure time per week, in hours. */
  freeTimePerWeek: number;
  studyWindow: StudyWindow;
  /** Longest single study block, in minutes. */
  maxStudyBlock: number;
  /** Minimum break between study blocks, in minutes. */
  minBreak: number;
  /** Days the student is willing to study. */
  studyDays: DayIndex[];
  /** Auto-insert lunch & dinner blocks. */
  includeMeals: boolean;
  /** First day of the term (ISO date) — anchors the exported recurrence. */
  termStart: string;
  /** Last day of the term (ISO date) — recurrence UNTIL. */
  termEnd: string;
}

export type ScheduleItemKind = 'class' | 'commitment' | 'study' | 'free' | 'meal';

export interface ScheduleItem {
  id: string;
  kind: ScheduleItemKind;
  title: string;
  day: DayIndex;
  start: number;
  end: number;
  color: string;
  location?: string;
  /** For study blocks, which class it belongs to. */
  classId?: string;
}

export interface ScheduleSummary {
  requiredStudyMin: number;
  scheduledStudyMin: number;
  freeMin: number;
  /** Per-class scheduled vs required, in minutes. */
  perClass: Record<string, { required: number; scheduled: number }>;
  warnings: string[];
}

export interface GeneratedSchedule {
  items: ScheduleItem[];
  summary: ScheduleSummary;
}

export interface AppState {
  schoolId: string | null;
  customStudyHoursPerUnit: number | null;
  classes: ClassItem[];
  commitments: Commitment[];
  prefs: Preferences;
  step: number;
  /** False while the landing/intro page is showing; true once the user begins setup. */
  entered: boolean;
}

/** The portion of state that fully describes a schedule — saved & restored as a unit. */
export type AppSnapshot = Pick<
  AppState,
  'schoolId' | 'customStudyHoursPerUnit' | 'classes' | 'commitments' | 'prefs'
>;
