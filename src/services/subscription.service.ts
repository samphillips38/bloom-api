import Stripe from 'stripe';
import { db } from '../config/database';
import { users, subscriptions, type Subscription } from '../db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Client
// ─────────────────────────────────────────────────────────────────────────────

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError('Stripe is not configured. Please set STRIPE_SECRET_KEY.', 503);
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'monthly' | 'yearly';

export interface SubscriptionStatus {
  isPremium: boolean;
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
  grantedBy: 'stripe' | 'admin' | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns or creates a Stripe customer for the given user. */
async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const stripe = getStripe();

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new AppError('User not found', 404);

  if (user.stripeCustomerId) return user.stripeCustomerId;

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { bloomUserId: userId },
  });

  // Save customer ID to users table
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return customer.id;
}

/** Maps a Stripe subscription status to whether the user is considered premium. */
function isActivePremiumStatus(status: string): boolean {
  return ['active', 'trialing'].includes(status);
}

/** Syncs a Stripe subscription object to our database and updates user.isPremium. */
async function syncStripeSubscription(stripeSubscription: Stripe.Subscription): Promise<void> {
  const customerId = stripeSubscription.customer as string;

  // Find the user by stripeCustomerId
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.warn(`[Stripe Webhook] No user found for customer ${customerId}`);
    return;
  }

  // In Stripe API 2026-02-25+, current_period_start/end moved to SubscriptionItem
  const firstItem = stripeSubscription.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  const plan: SubscriptionPlan | null =
    priceId === env.STRIPE_MONTHLY_PRICE_ID
      ? 'monthly'
      : priceId === env.STRIPE_YEARLY_PRICE_ID
      ? 'yearly'
      : null;

  const isPremium = isActivePremiumStatus(stripeSubscription.status);

  const currentPeriodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : null;
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : null;
  const trialEnd = stripeSubscription.trial_end
    ? new Date(stripeSubscription.trial_end * 1000)
    : null;
  const canceledAt = stripeSubscription.canceled_at
    ? new Date(stripeSubscription.canceled_at * 1000)
    : null;

  // Upsert subscription record
  const existing = await db
    .select({ id: subscriptions.id, grantedBy: subscriptions.grantedBy })
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  // Don't overwrite an admin-granted subscription that is still valid
  if (existing[0]?.grantedBy === 'admin' && isPremium) {
    return;
  }

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        plan,
        status: stripeSubscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt,
        trialEnd,
        grantedBy: 'stripe',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, user.id));
  } else {
    await db.insert(subscriptions).values({
      userId: user.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      plan,
      status: stripeSubscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt,
      trialEnd,
      grantedBy: 'stripe',
    });
  }

  // Update user premium status
  await db
    .update(users)
    .set({ isPremium, updatedAt: new Date() })
    .where(eq(users.id, user.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a Stripe Checkout session for the given user and plan.
 * Returns the session URL to redirect the user to.
 */
export async function createCheckoutSession(
  userId: string,
  plan: SubscriptionPlan,
  frontendUrl: string,
): Promise<string> {
  const stripe = getStripe();

  const priceId =
    plan === 'monthly' ? env.STRIPE_MONTHLY_PRICE_ID : env.STRIPE_YEARLY_PRICE_ID;

  if (!priceId) {
    throw new AppError(
      `Stripe price ID for ${plan} plan is not configured. Set STRIPE_${plan.toUpperCase()}_PRICE_ID.`,
      503,
    );
  }

  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7, // 7-day free trial
      metadata: { bloomUserId: userId, plan },
    },
    success_url: `${frontendUrl}/premium?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/premium?canceled=true`,
    allow_promotion_codes: true,
    metadata: { bloomUserId: userId, plan },
  });

  if (!session.url) {
    throw new AppError('Failed to create checkout session', 500);
  }

  return session.url;
}

/**
 * Creates a Stripe Customer Portal session so the user can manage their billing.
 */
export async function createPortalSession(
  userId: string,
  frontendUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${frontendUrl}/premium`,
  });

  return session.url;
}

/**
 * Gets the subscription status for a user.
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const [user] = await db
    .select({ isPremium: users.isPremium })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub) {
    return {
      isPremium: user?.isPremium ?? false,
      subscription: null,
      plan: null,
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
      grantedBy: null,
    };
  }

  return {
    isPremium: user?.isPremium ?? false,
    subscription: sub,
    plan: (sub.plan as SubscriptionPlan) ?? null,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    trialEnd: sub.trialEnd,
    grantedBy: (sub.grantedBy as 'stripe' | 'admin') ?? null,
  };
}

/**
 * Handles incoming Stripe webhook events.
 */
export async function handleWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<void> {
  const stripe = getStripe();

  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('Stripe webhook secret is not configured', 503);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new AppError(`Webhook signature verification failed: ${(err as Error).message}`, 400);
  }

  console.log(`[Stripe Webhook] ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // The subscription is created asynchronously — fetch it
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncStripeSubscription(sub);
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.resumed': {
      const sub = event.data.object as Stripe.Subscription;
      await syncStripeSubscription(sub);
      break;
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.paused': {
      const sub = event.data.object as Stripe.Subscription;
      await syncStripeSubscription(sub); // status = 'canceled'/'paused' → isPremium = false
      break;
    }

    case 'invoice.payment_failed': {
      // Subscription goes past_due — Stripe handles retries; we just log
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`[Stripe] Payment failed for customer ${invoice.customer}`);
      break;
    }

    default:
      // Ignore unhandled event types
      break;
  }
}

/**
 * Admin: Grants premium access to a user without a Stripe subscription.
 */
export async function adminGrantPremium(
  targetUserId: string,
  grantedByAdminId: string,
  note?: string,
  expiresAt?: Date,
): Promise<void> {
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) throw new AppError('Target user not found', 404);

  // Update users.isPremium
  await db
    .update(users)
    .set({ isPremium: true, updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  // Upsert subscription record
  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.userId, targetUserId))
    .limit(1);

  const subData = {
    status: 'admin_granted',
    grantedBy: 'admin' as const,
    grantedByAdminId,
    grantNote: note ?? null,
    currentPeriodEnd: expiresAt ?? null,
    cancelAtPeriodEnd: false,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set(subData)
      .where(eq(subscriptions.userId, targetUserId));
  } else {
    await db.insert(subscriptions).values({
      userId: targetUserId,
      plan: null,
      ...subData,
    });
  }
}

/**
 * Admin: Revokes premium access from a user.
 */
export async function adminRevokePremium(targetUserId: string): Promise<void> {
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) throw new AppError('Target user not found', 404);

  await db
    .update(users)
    .set({ isPremium: false, updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  await db
    .update(subscriptions)
    .set({ status: 'revoked', canceledAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.userId, targetUserId));
}
