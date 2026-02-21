import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/social', authController.socialLogin);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

export default router;
