import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as progressService from '../services/progress.service';
import { AppError } from '../middleware/error.middleware';

const updateProgressSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
  completed: z.boolean().optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export async function getUserStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const stats = await progressService.getUserStats(req.user.id);
    
    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCourseProgress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { courseId } = req.params;
    const progress = await progressService.getCourseProgress(req.user.id, courseId);
    
    res.json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
}

export async function getLessonProgress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { lessonId } = req.params;
    const progress = await progressService.getLessonProgress(req.user.id, lessonId);
    
    res.json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProgress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const data = updateProgressSchema.parse(req.body);
    const progress = await progressService.updateProgress({
      userId: req.user.id,
      lessonId: data.lessonId,
      completed: data.completed,
      score: data.score,
    });
    
    res.json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

export async function consumeEnergy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { amount = 1 } = req.body;
    const energy = await progressService.consumeEnergy(req.user.id, amount);
    
    res.json({
      success: true,
      data: { energy },
    });
  } catch (error) {
    next(error);
  }
}
