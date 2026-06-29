import type { CommitmentType } from '../types';

/**
 * Quiet, distinct category accents. In a monochrome UI these appear only as
 * thin left-border bars and small dots on white event cards — color as a
 * functional cue, never as fill.
 */
export const CLASS_COLORS = [
  '#4f46e5', // indigo
  '#0d9488', // teal
  '#db2777', // pink
  '#d97706', // amber
  '#7c3aed', // violet
  '#0284c7', // sky
  '#dc2626', // red
  '#059669', // emerald
];

export function classColor(index: number): string {
  return CLASS_COLORS[index % CLASS_COLORS.length];
}

export const COMMITMENT_META: Record<
  CommitmentType,
  { label: string; color: string }
> = {
  work: { label: 'Work', color: '#475569' },
  volunteer: { label: 'Volunteering', color: '#0d9488' },
  gym: { label: 'Gym / Fitness', color: '#db2777' },
  club: { label: 'Club / Org', color: '#d97706' },
  personal: { label: 'Personal', color: '#7c3aed' },
  meal: { label: 'Meal', color: '#71717a' },
  free: { label: 'Free time', color: '#a1a1aa' },
};

/** Study blocks render as solid near-black cards with white text. */
export const STUDY_COLOR = '#0a0a0a';
/** Free time renders as a dashed hairline outline. */
export const FREE_COLOR = '#a1a1aa';
