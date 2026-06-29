// ----- CourseNest plans & entitlements -----
// Single source of truth for what each plan unlocks. Feature-gating everywhere
// else goes through `planAllows` / the `can()` helper on PlanContext, so adding
// or moving a feature between tiers is a one-line change here.

export type Plan = 'free' | 'pro';

export type FeatureId =
  | 'calendarExport'
  | 'backupSchedules'
  | 'savedSchedules'
  | 'finalsBuilder';

export interface FeatureMeta {
  id: FeatureId;
  name: string;
  description: string;
  /** Lowest plan that unlocks this feature. */
  minPlan: Plan;
}

export const FEATURES: Record<FeatureId, FeatureMeta> = {
  calendarExport: {
    id: 'calendarExport',
    name: 'Calendar export',
    description:
      'Download your schedule as an .ics file and import it into Google or Apple Calendar.',
    minPlan: 'pro',
  },
  backupSchedules: {
    id: 'backupSchedules',
    name: 'Backup schedule builder',
    description:
      'Generate alternate “Plan B” schedules, compare them at a glance, and fall back to one anytime.',
    minPlan: 'pro',
  },
  savedSchedules: {
    id: 'savedSchedules',
    name: 'Saved schedules',
    description:
      'Save a schedule to your account and reopen it later — adjust classes or commitments, then re-export the updated calendar.',
    minPlan: 'pro',
  },
  finalsBuilder: {
    id: 'finalsBuilder',
    name: 'Finals schedule builder',
    description:
      'Turn a saved schedule into a finals study plan — study time weighted by how comfortable you are with each class, placed around your real exam times.',
    minPlan: 'pro',
  },
};

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1 };

/** Does `plan` unlock `feature`? */
export function planAllows(plan: Plan, feature: FeatureId): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURES[feature].minPlan];
}

// Marketing copy for the upgrade dialog. Price is a placeholder until billing
// is wired — see src/features/checkout.ts.
export const PRO_PLAN = {
  name: 'CourseNest Pro',
  priceLabel: '$15',
  pricePeriod: '/year',
  priceNote: 'About $1.25 a month — student-friendly, one simple plan.',
  tagline: 'Everything in Free, plus the tools to lock in your perfect term.',
  perks: [
    FEATURES.calendarExport.name,
    FEATURES.savedSchedules.name,
    FEATURES.backupSchedules.name,
    FEATURES.finalsBuilder.name,
  ],
};
