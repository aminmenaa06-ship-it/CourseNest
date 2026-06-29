import { getSchool } from '../data/schools';

/** Effective study-hours-per-unit given the chosen school + any custom override. */
export function effectiveHoursPerUnit(
  schoolId: string | null,
  customHours: number | null,
): number {
  if (customHours && customHours > 0) return customHours;
  const school = getSchool(schoolId);
  return school?.studyHoursPerUnit ?? 2.5;
}

/** Derived recommended weekly study hours for a class (units × per-unit rate). */
export function derivedStudyHours(
  units: number,
  schoolId: string | null,
  customHours: number | null,
): number {
  const rate = effectiveHoursPerUnit(schoolId, customHours);
  return Math.round(units * rate * 2) / 2; // round to nearest 0.5
}
