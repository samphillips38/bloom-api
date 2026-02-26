import { Request, Response, NextFunction } from 'express';
import * as libraryService from '../services/library.service';
import { AppError } from '../middleware/error.middleware';

export async function getLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const items = await libraryService.getLibrary(req.user.id);
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}

export async function addCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { courseId } = req.params;
    await libraryService.addCourseToLibrary(req.user.id, courseId);
    res.json({ success: true, data: { saved: true } });
  } catch (error) {
    next(error);
  }
}

export async function removeCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { courseId } = req.params;
    await libraryService.removeCourseFromLibrary(req.user.id, courseId);
    res.json({ success: true, data: { removed: true } });
  } catch (error) {
    next(error);
  }
}

export async function addLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { lessonId } = req.params;
    await libraryService.addLessonToLibrary(req.user.id, lessonId);
    res.json({ success: true, data: { saved: true } });
  } catch (error) {
    next(error);
  }
}

export async function removeLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { lessonId } = req.params;
    await libraryService.removeLessonFromLibrary(req.user.id, lessonId);
    res.json({ success: true, data: { removed: true } });
  } catch (error) {
    next(error);
  }
}

export async function checkCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { courseId } = req.params;
    const saved = await libraryService.isInLibrary(req.user.id, { courseId });
    res.json({ success: true, data: { saved } });
  } catch (error) {
    next(error);
  }
}

export async function checkLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { lessonId } = req.params;
    const saved = await libraryService.isInLibrary(req.user.id, { lessonId });
    res.json({ success: true, data: { saved } });
  } catch (error) {
    next(error);
  }
}
