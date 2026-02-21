import { Request, Response, NextFunction } from 'express';
import * as courseService from '../services/course.service';
import { AppError } from '../middleware/error.middleware';

// Categories
export async function getCategories(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await courseService.getAllCategories();
    
    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
}

// Courses
export async function getCourses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { categoryId } = req.query;
    
    let courses;
    if (categoryId && typeof categoryId === 'string') {
      courses = await courseService.getCoursesByCategory(categoryId);
    } else {
      courses = await courseService.getAllCourses();
    }
    
    res.json({
      success: true,
      data: { courses },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecommendedCourses(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const courses = await courseService.getRecommendedCourses();
    
    res.json({
      success: true,
      data: { courses },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCourseById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const course = await courseService.getCourseWithLevels(id);
    
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    
    res.json({
      success: true,
      data: { course },
    });
  } catch (error) {
    next(error);
  }
}

// Lessons
export async function getLessonById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const lesson = await courseService.getLessonWithContent(id);
    
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }
    
    res.json({
      success: true,
      data: { lesson },
    });
  } catch (error) {
    next(error);
  }
}

export async function getLessonsByLevel(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { levelId } = req.params;
    const lessons = await courseService.getLessonsByLevel(levelId);
    
    res.json({
      success: true,
      data: { lessons },
    });
  } catch (error) {
    next(error);
  }
}
