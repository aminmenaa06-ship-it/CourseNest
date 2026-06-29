import type { Preferences } from '../types';

// Each backup is a named tweak to the user's preferences, re-run through the
// same scheduler. They stay in sync with the latest classes/commitments because
// schedules are recomputed from the strategy, never snapshotted.

export type StrategyKey = 'morning' | 'evening' | 'weekdays' | 'long' | 'short';

export interface Strategy {
  key: StrategyKey;
  label: string;
  description: string;
  patch: Partial<Preferences>;
}

export const BACKUP_STRATEGIES: Strategy[] = [
  {
    key: 'morning',
    label: 'Morning-focused',
    description: 'Front-loads study into the morning.',
    patch: { studyWindow: 'morning' },
  },
  {
    key: 'evening',
    label: 'Evening-focused',
    description: 'Pushes study toward the evening.',
    patch: { studyWindow: 'evening' },
  },
  {
    key: 'weekdays',
    label: 'Weekdays only',
    description: 'Keeps weekends free of study.',
    patch: { studyDays: [0, 1, 2, 3, 4] },
  },
  {
    key: 'long',
    label: 'Fewer, longer sessions',
    description: 'Larger study blocks with real breaks.',
    patch: { maxStudyBlock: 180, minBreak: 30 },
  },
  {
    key: 'short',
    label: 'Shorter, frequent sessions',
    description: 'Smaller blocks spread across the week.',
    patch: { maxStudyBlock: 60, minBreak: 15 },
  },
];

export function strategyByKey(key: StrategyKey): Strategy {
  return BACKUP_STRATEGIES.find((s) => s.key === key) ?? BACKUP_STRATEGIES[0];
}
