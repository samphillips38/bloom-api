import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ── Rate Limiting ──

// Strict limit for login/register (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many attempts. Please try again in 15 minutes.' },
  },
});

// Slightly more lenient for social login (one-click flows)
const socialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many attempts. Please try again later.' },
  },
});

// Token refresh can be more frequent
const refreshLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many refresh requests.' },
  },
});

// ── Public Routes ──

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', socialLimiter, authController.googleLogin);
router.post('/apple', socialLimiter, authController.appleLogin);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);

// ── Protected Routes ──

router.get('/profile', authMiddleware, authController.getProfile);

export default router;
