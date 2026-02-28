import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as subscriptionController from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';

// ── Rate Limiting ──

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many checkout attempts. Please try again shortly.' } },
});

const portalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many portal requests. Please try again shortly.' } },
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many admin requests.' } },
});

// ── Main subscription router (requires express.json() to be mounted first) ──

const router = Router();

router.get('/status', authMiddleware, subscriptionController.getStatus);
router.post('/checkout', authMiddleware, checkoutLimiter, subscriptionController.createCheckout);
router.post('/portal', authMiddleware, portalLimiter, subscriptionController.createPortal);

// Admin routes (auth + X-Admin-Key header)
router.post('/admin/grant', authMiddleware, adminLimiter, subscriptionController.adminGrant);
router.post('/admin/revoke', authMiddleware, adminLimiter, subscriptionController.adminRevoke);

export default router;
