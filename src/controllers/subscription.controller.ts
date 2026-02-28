import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as subscriptionService from '../services/subscription.service';
import { AppError } from '../middleware/error.middleware';
import { env } from '../config/env';

// ── Validation Schemas ──

const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
});

const adminGrantSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  note: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(), // ISO 8601 string
});

const adminRevokeSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// ── Admin Key Middleware Helper ──

function requireAdminKey(req: Request): void {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== env.ADMIN_SECRET) {
    throw new AppError('Forbidden: invalid or missing admin key', 403);
  }
}

// ── GET /api/subscription/status ──

export async function getStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);

    const status = await subscriptionService.getSubscriptionStatus(req.user.id);

    res.json({ success: true, data: { status } });
  } catch (error) {
    next(error);
  }
}

// ── POST /api/subscription/checkout ──

export async function createCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);

    const { plan } = checkoutSchema.parse(req.body);
    const frontendUrl = env.FRONTEND_URL;

    const url = await subscriptionService.createCheckoutSession(req.user.id, plan, frontendUrl);

    res.json({ success: true, data: { url } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

// ── POST /api/subscription/portal ──

export async function createPortal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);

    const frontendUrl = env.FRONTEND_URL;
    const url = await subscriptionService.createPortalSession(req.user.id, frontendUrl);

    res.json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
}

// ── POST /api/subscription/webhook ──
// NOTE: This route must receive the raw body (not JSON-parsed).

export async function webhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      throw new AppError('Missing Stripe signature header', 400);
    }

    await subscriptionService.handleWebhook(req.body as Buffer, signature);

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
}

// ── POST /api/subscription/admin/grant ──

export async function adminGrant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    requireAdminKey(req);

    const { userId, note, expiresAt } = adminGrantSchema.parse(req.body);
    const expiresDate = expiresAt ? new Date(expiresAt) : undefined;

    await subscriptionService.adminGrantPremium(userId, req.user.id, note, expiresDate);

    res.json({
      success: true,
      data: { message: `Premium access granted to user ${userId}` },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

// ── POST /api/subscription/admin/revoke ──

export async function adminRevoke(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    requireAdminKey(req);

    const { userId } = adminRevokeSchema.parse(req.body);

    await subscriptionService.adminRevokePremium(userId);

    res.json({
      success: true,
      data: { message: `Premium access revoked from user ${userId}` },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}
