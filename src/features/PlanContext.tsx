import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FeatureId, Plan } from './plans';
import { planAllows } from './plans';
import { startProCheckout } from './checkout';
import UpgradeModal from './UpgradeModal';

const KEY = 'coursenest:plan';

function loadPlan(): Plan {
  try {
    return localStorage.getItem(KEY) === 'pro' ? 'pro' : 'free';
  } catch {
    return 'free';
  }
}

interface PlanContextValue {
  plan: Plan;
  isPro: boolean;
  /** The one gating check the whole app uses. */
  can: (feature: FeatureId) => boolean;
  /** Open the upgrade dialog, optionally highlighting the feature that prompted it. */
  promptUpgrade: (feature?: FeatureId | null) => void;
  /** Begin (mock) checkout — wired to the Stripe seam in checkout.ts. */
  beginCheckout: () => Promise<void>;
  checkoutPending: boolean;
  /** Revert to Free. Handy for testing / a future "manage plan" screen. */
  downgrade: () => void;
}

const Ctx = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>(loadPlan);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFeature, setModalFeature] = useState<FeatureId | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, plan);
    } catch {
      /* ignore */
    }
  }, [plan]);

  const promptUpgrade = useCallback((feature: FeatureId | null = null) => {
    setModalFeature(feature ?? null);
    setModalOpen(true);
  }, []);

  const beginCheckout = useCallback(async () => {
    setCheckoutPending(true);
    try {
      await startProCheckout((p) => setPlan(p));
    } finally {
      setCheckoutPending(false);
    }
  }, []);

  const downgrade = useCallback(() => setPlan('free'), []);

  const value = useMemo<PlanContextValue>(
    () => ({
      plan,
      isPro: plan === 'pro',
      can: (feature) => planAllows(plan, feature),
      promptUpgrade,
      beginCheckout,
      checkoutPending,
      downgrade,
    }),
    [plan, promptUpgrade, beginCheckout, checkoutPending, downgrade],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <UpgradeModal open={modalOpen} feature={modalFeature} onClose={() => setModalOpen(false)} />
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlan(): PlanContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
