import type { ClassItem, Commitment } from '../types';
import { classColor, COMMITMENT_META } from '../lib/colors';

/**
 * A realistic syllabus excerpt used by the "Paste sample syllabus" button so
 * users can see the auto-extractor work without uploading a file.
 */
export const SAMPLE_SYLLABUS_TEXT = `University of Example — Department of Computer Science
CS 61A: Structure and Interpretation of Computer Programs
Fall 2026 Syllabus

Instructor: Dr. A. Turing
Credit Units: 4 units
Lecture: MWF 10:00 - 10:50 AM, Wheeler Hall 150
Discussion: Th 2:00 - 3:00 PM, Soda 320

Course Description:
This course introduces the foundations of computation. Students should expect
to spend 8-10 hours per week outside of class on readings, labs, and projects.

Grading: Projects 40%, Exams 45%, Participation 15%.
`;

let idc = 0;
const id = (p: string) => `${p}-${Date.now().toString(36)}-${idc++}`;

/** Pre-built classes for the "Load example schedule" shortcut. */
export function demoClasses(): ClassItem[] {
  return [
    {
      id: id('class'),
      name: 'Structure & Interpretation of Computer Programs',
      code: 'CS 61A',
      units: 4,
      studyHoursPerWeek: 9,
      studyHoursAuto: true,
      color: classColor(0),
      source: 'CS61A_syllabus.pdf',
      meetings: [
        { day: 0, start: 600, end: 650, location: 'Wheeler 150' },
        { day: 2, start: 600, end: 650, location: 'Wheeler 150' },
        { day: 4, start: 600, end: 650, location: 'Wheeler 150' },
        { day: 3, start: 840, end: 900, location: 'Soda 320' },
      ],
    },
    {
      id: id('class'),
      name: 'Calculus II',
      code: 'MATH 1B',
      units: 4,
      studyHoursPerWeek: 10,
      studyHoursAuto: false,
      color: classColor(1),
      source: 'MATH1B_syllabus.pdf',
      meetings: [
        { day: 1, start: 660, end: 740, location: 'Evans 10' },
        { day: 3, start: 660, end: 740, location: 'Evans 10' },
      ],
    },
    {
      id: id('class'),
      name: 'Introduction to Psychology',
      code: 'PSYCH 1',
      units: 3,
      studyHoursPerWeek: 7,
      studyHoursAuto: false,
      color: classColor(2),
      source: 'PSYCH1_syllabus.pdf',
      meetings: [
        { day: 1, start: 870, end: 960, location: 'Stanley 105' },
        { day: 3, start: 870, end: 960, location: 'Stanley 105' },
      ],
    },
  ];
}

export function demoCommitments(): Commitment[] {
  return [
    {
      id: id('cmt'),
      title: 'Campus job — Library',
      type: 'work',
      color: COMMITMENT_META.work.color,
      blocks: [
        { day: 0, start: 900, end: 1020 },
        { day: 2, start: 900, end: 1020 },
      ],
    },
    {
      id: id('cmt'),
      title: 'Gym',
      type: 'gym',
      color: COMMITMENT_META.gym.color,
      blocks: [
        { day: 1, start: 420, end: 480 },
        { day: 3, start: 420, end: 480 },
        { day: 5, start: 540, end: 600 },
      ],
    },
    {
      id: id('cmt'),
      title: 'Robotics Club',
      type: 'club',
      color: COMMITMENT_META.club.color,
      blocks: [{ day: 4, start: 1080, end: 1200 }],
    },
    {
      id: id('cmt'),
      title: 'Food bank volunteering',
      type: 'volunteer',
      color: COMMITMENT_META.volunteer.color,
      blocks: [{ day: 6, start: 600, end: 720 }],
    },
  ];
}
