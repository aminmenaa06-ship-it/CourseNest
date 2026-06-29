import type { School } from '../types';

/**
 * Study-hours-per-unit data, drawn from official credit-hour policy.
 *
 * Every U.S. accredited institution defines an academic unit/credit using the
 * federal credit-hour standard (34 CFR §600.2), which each system below
 * restates in its own published policy: one unit/credit ≈ 1 hour of instruction
 * PLUS a minimum of 2 hours of out-of-class student work per week. That is the
 * officially recommended study time per unit, so the values here are 2
 * hrs/unit/week for these systems. Academic advisors commonly suggest stretching
 * toward 3 hours for demanding courses — the "General guideline" presets and the
 * custom-rate option cover that — and a syllabus's own stated weekly workload
 * always overrides the preset.
 *
 * Sources per system:
 *  • UC   — UC credit-hour policy (e.g. UC San Diego credit-hour definition)
 *  • CSU  — CSU / Title 5 credit-hour policy (e.g. CSU Long Beach, SF State)
 *  • UT   — UT Austin General Catalog, "Credit Value" (UT System standard)
 *  • SUNY — SUNY credit/contact-hour policy (suny.edu document 168)
 *  • CUNY — CUNY credit-hour policy (CCNY / QCC / SPS)
 *  • FL   — Florida BOG + SACSCOC credit-hour policy (FSU, USF, UWF)
 *  • Private NY/FL — federal credit-hour standard via MSCHE / SACSCOC accreditation
 */

const RATE = 2;

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Def {
  name: string;
  quarter?: boolean;
}

function group(system: string, note: string, defs: Def[], rate = RATE): School[] {
  return defs.map((d) => ({
    id: slug(d.name),
    name: d.name,
    system,
    studyHoursPerUnit: rate,
    term: d.quarter ? ('quarter' as const) : ('semester' as const),
    note: d.quarter ? `${note} · quarter system` : note,
  }));
}

// ---- General guidelines (federal credit-hour standard) ----
const GENERAL: School[] = [
  {
    id: 'generic-2',
    name: 'General guideline — 2 hrs / unit',
    system: 'General guidelines',
    studyHoursPerUnit: 2,
    note: 'Federal credit-hour standard: ~2 hrs out-of-class work per unit/week.',
  },
  {
    id: 'generic-25',
    name: 'General guideline — 2.5 hrs / unit',
    system: 'General guidelines',
    studyHoursPerUnit: 2.5,
    note: 'Midpoint of the common 2–3 hr/unit advising range.',
  },
  {
    id: 'generic-3',
    name: 'General guideline — 3 hrs / unit',
    system: 'General guidelines',
    studyHoursPerUnit: 3,
    note: 'Upper end of the 2–3 hr/unit range; common advising guidance for heavy courses.',
  },
];

// ---- University of California (9 undergraduate campuses) ----
const UC_NOTE = 'UC credit-hour policy: ≥2 hrs out-of-class work per unit each week.';
const UC = group('University of California', UC_NOTE, [
  { name: 'UC Berkeley' },
  { name: 'UC Merced' },
  { name: 'UC Davis', quarter: true },
  { name: 'UC Irvine', quarter: true },
  { name: 'UCLA', quarter: true },
  { name: 'UC Riverside', quarter: true },
  { name: 'UC San Diego', quarter: true },
  { name: 'UC Santa Barbara', quarter: true },
  { name: 'UC Santa Cruz', quarter: true },
]);

// ---- California State University (23 campuses) ----
const CSU_NOTE = 'CSU / Title 5 credit-hour policy: 2 hrs of preparation per unit each week.';
const CSU = group('California State University', CSU_NOTE, [
  { name: 'CSU Bakersfield' },
  { name: 'CSU Channel Islands' },
  { name: 'CSU Chico' },
  { name: 'CSU Dominguez Hills' },
  { name: 'CSU East Bay' },
  { name: 'Fresno State' },
  { name: 'CSU Fullerton' },
  { name: 'Cal Poly Humboldt' },
  { name: 'CSU Long Beach' },
  { name: 'Cal State LA' },
  { name: 'Cal Maritime Academy' },
  { name: 'CSU Monterey Bay' },
  { name: 'CSU Northridge' },
  { name: 'Cal Poly Pomona' },
  { name: 'Sacramento State' },
  { name: 'CSU San Bernardino' },
  { name: 'San Diego State University' },
  { name: 'San Francisco State University' },
  { name: 'San José State University' },
  { name: 'Cal Poly San Luis Obispo', quarter: true },
  { name: 'CSU San Marcos' },
  { name: 'Sonoma State University' },
  { name: 'Stanislaus State' },
]);

// ---- University of Texas System (academic institutions) ----
const UT_NOTE =
  'UT System: ~2 hrs of preparation per semester credit hour each week (UT Austin General Catalog).';
const UT = group('University of Texas System', UT_NOTE, [
  { name: 'UT Austin' },
  { name: 'UT Arlington' },
  { name: 'UT Dallas' },
  { name: 'UT El Paso' },
  { name: 'UT Permian Basin' },
  { name: 'UT Rio Grande Valley' },
  { name: 'UT San Antonio' },
  { name: 'UT Tyler' },
]);

// ---- New York — SUNY ----
const SUNY_NOTE = 'SUNY credit-hour policy: 2 hrs of outside study per credit each week.';
const SUNY = group('SUNY (New York)', SUNY_NOTE, [
  { name: 'University at Albany' },
  { name: 'Binghamton University' },
  { name: 'University at Buffalo' },
  { name: 'Stony Brook University' },
  { name: 'Buffalo State University' },
  { name: 'SUNY New Paltz' },
  { name: 'SUNY Geneseo' },
  { name: 'SUNY Oswego' },
  { name: 'SUNY Cortland' },
  { name: 'SUNY Brockport' },
  { name: 'SUNY Plattsburgh' },
  { name: 'SUNY Fredonia' },
  { name: 'SUNY Oneonta' },
  { name: 'SUNY Potsdam' },
  { name: 'SUNY Purchase' },
  { name: 'SUNY Polytechnic Institute' },
  { name: 'SUNY ESF' },
  { name: 'SUNY Maritime College' },
]);

// ---- New York — CUNY ----
const CUNY_NOTE = 'CUNY credit-hour policy: 2 hrs of outside study per credit each week.';
const CUNY = group('CUNY (New York)', CUNY_NOTE, [
  { name: 'Baruch College' },
  { name: 'Brooklyn College' },
  { name: 'City College of New York' },
  { name: 'College of Staten Island' },
  { name: 'Hunter College' },
  { name: 'John Jay College' },
  { name: 'Lehman College' },
  { name: 'Medgar Evers College' },
  { name: 'NYC College of Technology' },
  { name: 'Queens College' },
  { name: 'York College (CUNY)' },
]);

// ---- New York — notable private institutions ----
const NY_PRIVATE_NOTE =
  'Federal / Middle States (MSCHE) credit-hour standard: ≥2 hrs out-of-class work per credit each week.';
const NY_PRIVATE = group('New York — private universities', NY_PRIVATE_NOTE, [
  { name: 'New York University' },
  { name: 'Columbia University' },
  { name: 'Cornell University' },
  { name: 'Fordham University' },
  { name: 'Syracuse University' },
  { name: 'University of Rochester' },
  { name: 'Rochester Institute of Technology' },
  { name: 'Rensselaer Polytechnic Institute' },
  { name: 'Pace University' },
  { name: "St. John's University (NY)" },
  { name: 'Hofstra University' },
  { name: 'New York Institute of Technology' },
]);

// ---- Florida — State University System ----
const FL_SUS_NOTE =
  'Florida BOG + SACSCOC credit-hour policy: ≥2 hrs out-of-class work per credit each week.';
const FL_SUS = group('Florida — State University System', FL_SUS_NOTE, [
  { name: 'University of Florida' },
  { name: 'Florida State University' },
  { name: 'University of Central Florida' },
  { name: 'University of South Florida' },
  { name: 'Florida International University' },
  { name: 'Florida Atlantic University' },
  { name: 'University of North Florida' },
  { name: 'University of West Florida' },
  { name: 'Florida A&M University' },
  { name: 'Florida Gulf Coast University' },
  { name: 'New College of Florida' },
  { name: 'Florida Polytechnic University' },
]);

// ---- Florida — notable private institutions ----
const FL_PRIVATE_NOTE =
  'Federal / SACSCOC credit-hour standard: ≥2 hrs out-of-class work per credit each week.';
const FL_PRIVATE = group('Florida — private universities', FL_PRIVATE_NOTE, [
  { name: 'University of Miami' },
  { name: 'Stetson University' },
  { name: 'Rollins College' },
  { name: 'Embry-Riddle Aeronautical University' },
  { name: 'Nova Southeastern University' },
  { name: 'Florida Institute of Technology' },
  { name: 'Lynn University' },
]);

export const SCHOOLS: School[] = [
  ...GENERAL,
  ...UC,
  ...CSU,
  ...UT,
  ...SUNY,
  ...CUNY,
  ...NY_PRIVATE,
  ...FL_SUS,
  ...FL_PRIVATE,
];

/** Systems in display order, for grouping in the picker. */
export const SCHOOL_SYSTEMS: string[] = [
  'General guidelines',
  'University of California',
  'California State University',
  'University of Texas System',
  'SUNY (New York)',
  'CUNY (New York)',
  'New York — private universities',
  'Florida — State University System',
  'Florida — private universities',
];

export const DEFAULT_SCHOOL_ID = 'generic-25';

export function getSchool(id: string | null): School | null {
  if (!id) return null;
  return SCHOOLS.find((s) => s.id === id) ?? null;
}
