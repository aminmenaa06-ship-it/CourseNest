import { useEffect } from 'react';
import type { FeatureId } from './plans';
import { FEATURES, PRO_PLAN } from './plans';
import { BILLING_ENABLED } from './checkout';
import { usePlan } from './PlanContext';
import ProBadge from './ProBadge';
import { CheckIcon } from '../components/Icons';

interface Props {
  open: boolean;
  feature: FeatureId | null;
  onClose: () => void;
}

export default function UpgradeModal({ open, feature, onClose }: Props) {
  const { beginCheckout, checkoutPending, isPro } = usePlan();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const highlighted = feature ? FEATURES[feature] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(9,9,11,0.45)] backdrop-blur-sm animate-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to CourseNest Pro"
    >
      <div
        className="card w-full max-w-md p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">CourseNest</span>
            <ProBadge />
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-xl leading-none px-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {isPro ? (
          <div className="mt-6 text-center py-6">
            <div className="text-lg font-semibold">You're on Pro 🎉</div>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Calendar export and the backup schedule builder are unlocked.
            </p>
            <button onClick={onClose} className="btn btn-primary mt-5">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mt-4 text-[var(--color-muted)]">{PRO_PLAN.tagline}</p>

            {highlighted && (
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3.5">
                <div className="text-sm font-semibold">{highlighted.name}</div>
                <div className="text-xs text-[var(--color-muted)] mt-0.5">
                  {highlighted.description}
                </div>
              </div>
            )}

            <ul className="mt-5 space-y-2.5">
              {PRO_PLAN.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-sm">
                  <span className="h-5 w-5 rounded-full grid place-items-center bg-[var(--color-ink)] text-white shrink-0">
                    <CheckIcon size={13} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">{PRO_PLAN.priceLabel}</span>
              <span className="text-[var(--color-muted)]">{PRO_PLAN.pricePeriod}</span>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-1">{PRO_PLAN.priceNote}</p>

            <button
              onClick={() => beginCheckout()}
              disabled={checkoutPending}
              className="btn btn-primary w-full mt-4 !py-3 text-base"
            >
              {checkoutPending ? 'Activating…' : 'Upgrade to Pro'}
            </button>

            {!BILLING_ENABLED && (
              <p className="text-[11px] text-[var(--color-muted)] text-center mt-3 leading-relaxed">
                Billing isn't connected yet — this is a preview that activates Pro locally so you
                can try the gated features.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
