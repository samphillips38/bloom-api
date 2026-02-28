import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as progressService from '../services/progress.service';
import { AppError } from '../middleware/error.middleware';

const updateProgressSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
  completed: z.boolean().optional(),
  score: z.number().int().min(0).max(100).optional(),
  lastPageIndex: z.number().int().min(0).optional(),
});

const savePageSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
  pageIndex: z.number().int().min(0),
});

const dailyGoalSchema = z.object({
  goal: z.number().int().min(1).max(20),
});

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getUserStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const stats = await progressService.getUserStats(req.user.id);
    res.json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
}

// ── Course / Lesson progress ───────────────────────────────────────────────

export async function getCourseProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { courseId } = req.params;
    const progress = await progressService.getCourseProgress(req.user.id, courseId);
    res.json({ success: true, data: { progress } });
  } catch (error) {
    next(error);
  }
}

export async function getLessonProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { lessonId } = req.params;
    const progress = await progressService.getLessonProgress(req.user.id, lessonId);
    res.json({ success: true, data: { progress } });
  } catch (error) {
    next(error);
  }
}

export async function updateProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);

    const data = updateProgressSchema.parse(req.body);
    const result = await progressService.updateProgress({
      userId: req.user.id,
      lessonId: data.lessonId,
      completed: data.completed,
      score: data.score,
      lastPageIndex: data.lastPageIndex,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

export async function savePage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const data = savePageSchema.parse(req.body);
    await progressService.savePageProgress(req.user.id, data.lessonId, data.pageIndex);
    res.json({ success: true, data: { saved: true } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

// ── Energy ─────────────────────────────────────────────────────────────────

export async function consumeEnergy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { amount = 1 } = req.body;
    const energy = await progressService.consumeEnergy(req.user.id, amount);
    res.json({ success: true, data: { energy } });
  } catch (error) {
    next(error);
  }
}

export async function restoreEnergy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const energy = await progressService.restoreEnergy(req.user.id);
    res.json({ success: true, data: { energy } });
  } catch (error) {
    next(error);
  }
}

// ── Achievements ───────────────────────────────────────────────────────────

export async function getAchievements(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const achievements = await progressService.getUserAchievements(req.user.id);
    const all = Object.values(progressService.ACHIEVEMENT_DEFS);
    res.json({ success: true, data: { achievements, all } });
  } catch (error) {
    next(error);
  }
}

// ── Daily goal ─────────────────────────────────────────────────────────────

export async function setDailyGoal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const data = dailyGoalSchema.parse(req.body);
    await progressService.setDailyGoal(req.user.id, data.goal);
    res.json({ success: true, data: { goal: data.goal } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

// ── Streak freeze ──────────────────────────────────────────────────────────

export async function addStreakFreeze(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { count = 1 } = req.body;
    const streakFreezes = await progressService.buyStreakFreeze(req.user.id, count);
    res.json({ success: true, data: { streakFreezes } });
  } catch (error) {
    next(error);
  }
}
