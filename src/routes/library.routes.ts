import { Router } from 'express';
import * as libraryController from '../controllers/library.controller';

const router = Router();

// Get user's full library with progress
router.get('/', libraryController.getLibrary);

// Courses
router.get('/course/:courseId/check', libraryController.checkCourse);
router.post('/course/:courseId', libraryController.addCourse);
router.delete('/course/:courseId', libraryController.removeCourse);

// Lessons
router.get('/lesson/:lessonId/check', libraryController.checkLesson);
router.post('/lesson/:lessonId', libraryController.addLesson);
router.delete('/lesson/:lessonId', libraryController.removeLesson);

export default router;
