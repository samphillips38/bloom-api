import { Router } from 'express';
import * as progressController from '../controllers/progress.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Stats & progress
router.get('/stats', progressController.getUserStats);
router.get('/course/:courseId', progressController.getCourseProgress);
router.get('/lesson/:lessonId', progressController.getLessonProgress);
router.post('/update', progressController.updateProgress);
router.post('/save-page', progressController.savePage);

// Energy
router.post('/energy/consume', progressController.consumeEnergy);
router.post('/energy/restore', progressController.restoreEnergy);

// Achievements
router.get('/achievements', progressController.getAchievements);

// Daily goal
router.post('/daily-goal', progressController.setDailyGoal);

// Streak freeze
router.post('/streak-freeze/add', progressController.addStreakFreeze);

export default router;
