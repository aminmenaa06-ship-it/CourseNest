import type { ReactNode } from 'react';
import type { FeatureId } from './plans';
import { FEATURES } from './plans';
import { usePlan } from './PlanContext';
import ProBadge from './ProBadge';
import { LockIcon } from '../components/Icons';

interface GateProps {
  feature: FeatureId;
  children: ReactNode;
  /** Custom locked UI. Defaults to <LockedFeature />. */
  fallback?: ReactNode;
}

/** Renders children only when the current plan unlocks `feature`. */
export function ProGate({ feature, children, fallback }: GateProps) {
  const { can } = usePlan();
  if (can(feature)) return <>{children}</>;
  return <>{fallback ?? <LockedFeature feature={feature} />}</>;
}

/** Default locked placeholder: explains the feature and offers an upgrade. */
export function LockedFeature({ feature }: { feature: FeatureId }) {
  const { promptUpgrade } = usePlan();
  const meta = FEATURES[feature];
  return (
    <div className="card p-6 text-center border-dashed">
      <div className="flex justify-center mb-3">
        <span className="h-11 w-11 rounded-xl grid place-items-center bg-[var(--color-surface-2)] text-[var(--color-ink)]">
          <LockIcon size={20} />
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <h3 className="text-base font-semibold tracking-tight">{meta.name}</h3>
        <ProBadge tone="outline" />
      </div>
      <p className="text-sm text-[var(--color-muted)] mt-1.5 max-w-sm mx-auto">{meta.description}</p>
      <button onClick={() => promptUpgrade(feature)} className="btn btn-primary mt-5">
        Unlock with CourseNest Pro
      </button>
    </div>
  );
}
