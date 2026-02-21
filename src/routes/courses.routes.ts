import { Router } from 'express';
import * as coursesController from '../controllers/courses.controller';

const router = Router();

// Categories
router.get('/categories', coursesController.getCategories);

// Courses
router.get('/', coursesController.getCourses);
router.get('/recommended', coursesController.getRecommendedCourses);
router.get('/:id', coursesController.getCourseById);

// Lessons
router.get('/lessons/:id', coursesController.getLessonById);
router.get('/lessons/:id/metadata', coursesController.getLessonMetadata);
router.get('/levels/:levelId/lessons', coursesController.getLessonsByLevel);

export default router;
