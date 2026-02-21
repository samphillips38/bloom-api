import { Router } from 'express';
import * as progressController from '../controllers/progress.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/stats', progressController.getUserStats);
router.get('/course/:courseId', progressController.getCourseProgress);
router.get('/lesson/:lessonId', progressController.getLessonProgress);
router.post('/update', progressController.updateProgress);
router.post('/energy/consume', progressController.consumeEnergy);

export default router;
