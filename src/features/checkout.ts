import type { Plan } from './plans';

/**
 * The single integration seam for billing.
 *
 * Today there is no payments provider configured, so this is a mock that
 * "succeeds" after a short delay and activates Pro locally. When Stripe is
 * added, replace the body below with a real Checkout Session redirect and have
 * the success/return path call `onActivate('pro')` (ideally confirmed by a
 * webhook-backed subscription check). Nothing else in the app needs to change —
 * the rest of the UI only knows about `plan` and `can(feature)`.
 */
export async function startProCheckout(onActivate: (plan: Plan) => void): Promise<void> {
  // --- STRIPE INTEGRATION POINT --------------------------------------------
  // const res = await fetch('/api/create-checkout-session', { method: 'POST' });
  // const { url } = await res.json();
  // window.location.assign(url); // → Stripe Checkout; user returns post-payment
  // On a verified subscription, call: onActivate('pro')
  // -------------------------------------------------------------------------

  // Mock until billing is configured:
  await new Promise((resolve) => setTimeout(resolve, 400));
  onActivate('pro');
}

/** Flip to true once Stripe (or another provider) is actually wired up. */
export const BILLING_ENABLED = false;
