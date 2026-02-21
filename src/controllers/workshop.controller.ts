import { Request, Response, NextFunction } from 'express';
import * as workshopService from '../services/workshop.service';
import * as aiService from '../services/ai.service';
import { AppError } from '../middleware/error.middleware';

// ═══════════════════════════════════════════════════════
//  Workshop Lessons CRUD
// ═══════════════════════════════════════════════════════

export async function getMyLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lessons = await workshopService.getMyWorkshopLessons(req.user!.id);
    res.json({ success: true, data: { lessons } });
  } catch (error) {
    next(error);
  }
}

export async function createLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description, iconUrl, themeColor, visibility, editPolicy, aiInvolvement } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError('Title is required', 400);
    }

    const lesson = await workshopService.createWorkshopLesson({
      authorId: req.user!.id,
      title: title.trim(),
      description,
      iconUrl,
      themeColor,
      visibility,
      editPolicy,
      aiInvolvement,
    });

    res.status(201).json({ success: true, data: { lesson } });
  } catch (error) {
    next(error);
  }
}

export async function getLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const lesson = await workshopService.getWorkshopLessonById(id);

    if (!lesson) {
      throw new AppError('Workshop lesson not found', 404);
    }

    // If private, only the author can view
    if (lesson.visibility === 'private' && lesson.authorId !== req.user!.id) {
      throw new AppError('Not authorized to view this lesson', 403);
    }

    res.json({ success: true, data: { lesson } });
  } catch (error) {
    next(error);
  }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, iconUrl, themeColor, visibility, editPolicy, aiInvolvement } = req.body;

    const lesson = await workshopService.updateWorkshopLesson(id, req.user!.id, {
      title,
      description,
      iconUrl,
      themeColor,
      visibility,
      editPolicy,
      aiInvolvement,
    });

    if (!lesson) {
      throw new AppError('Lesson not found or not authorized', 404);
    }

    res.json({ success: true, data: { lesson } });
  } catch (error) {
    next(error);
  }
}

export async function deleteLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await workshopService.deleteWorkshopLesson(id, req.user!.id);

    if (!deleted) {
      throw new AppError('Lesson not found or not authorized', 404);
    }

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}

export async function publishLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const lesson = await workshopService.publishWorkshopLesson(id, req.user!.id);

    if (!lesson) {
      throw new AppError('Cannot publish: lesson not found, not authorized, or no content', 400);
    }

    res.json({ success: true, data: { lesson } });
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════
//  Content Pages CRUD
// ═══════════════════════════════════════════════════════

export async function addContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { contentType, contentData, sources } = req.body;

    if (!contentType || !contentData) {
      throw new AppError('contentType and contentData are required', 400);
    }

    const canEdit = await workshopService.canUserEditLesson(id, req.user!.id);
    if (!canEdit) {
      throw new AppError('Not authorized to edit this lesson', 403);
    }

    const content = await workshopService.addWorkshopContent({
      workshopLessonId: id,
      contentType,
      contentData,
      authorId: req.user!.id,
      sources,
    });

    res.status(201).json({ success: true, data: { content } });
  } catch (error) {
    next(error);
  }
}

export async function updateContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cid } = req.params;
    const { contentType, contentData, sources } = req.body;

    const content = await workshopService.updateWorkshopContent(cid, req.user!.id, {
      contentType,
      contentData,
      sources,
    });

    if (!content) {
      throw new AppError('Content not found or not authorized', 404);
    }

    res.json({ success: true, data: { content } });
  } catch (error) {
    next(error);
  }
}

export async function reorderContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { contentIds } = req.body;

    if (!Array.isArray(contentIds)) {
      throw new AppError('contentIds array is required', 400);
    }

    const success = await workshopService.reorderWorkshopContent(id, req.user!.id, contentIds);
    if (!success) {
      throw new AppError('Not authorized or lesson not found', 403);
    }

    res.json({ success: true, data: { reordered: true } });
  } catch (error) {
    next(error);
  }
}

export async function deleteContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cid } = req.params;
    const deleted = await workshopService.deleteWorkshopContent(cid, req.user!.id);

    if (!deleted) {
      throw new AppError('Content not found or not authorized', 404);
    }

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════
//  History & Metadata
// ═══════════════════════════════════════════════════════

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const history = await workshopService.getEditHistory(id);
    res.json({ success: true, data: { history } });
  } catch (error) {
    next(error);
  }
}

export async function getMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const metadata = await workshopService.getLessonMetadata(id);

    if (!metadata) {
      throw new AppError('Lesson not found', 404);
    }

    res.json({ success: true, data: { metadata } });
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════
//  Edit Suggestions
// ═══════════════════════════════════════════════════════

export async function submitSuggestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { contentId, suggestedData } = req.body;

    if (!suggestedData) {
      throw new AppError('suggestedData is required', 400);
    }

    const suggestion = await workshopService.submitEditSuggestion({
      workshopLessonId: id,
      contentId,
      suggesterId: req.user!.id,
      suggestedData,
    });

    res.status(201).json({ success: true, data: { suggestion } });
  } catch (error) {
    next(error);
  }
}

export async function getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const suggestions = await workshopService.getEditSuggestions(id, status as string | undefined);
    res.json({ success: true, data: { suggestions } });
  } catch (error) {
    next(error);
  }
}

export async function reviewSuggestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sid } = req.params;
    const { action } = req.body;

    if (action !== 'approved' && action !== 'rejected') {
      throw new AppError('action must be "approved" or "rejected"', 400);
    }

    const suggestion = await workshopService.reviewEditSuggestion(sid, req.user!.id, action);

    if (!suggestion) {
      throw new AppError('Suggestion not found or not authorized', 404);
    }

    res.json({ success: true, data: { suggestion } });
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════
//  AI Draft Generation
// ═══════════════════════════════════════════════════════

export async function generateAIDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { topic, pageCount } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new AppError('topic is required', 400);
    }

    const pages = await aiService.generateLessonDraft(topic.trim(), pageCount || 8);
    res.json({ success: true, data: { pages } });
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════
//  Browse
// ═══════════════════════════════════════════════════════

export async function browse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, limit, offset } = req.query;
    const result = await workshopService.browseWorkshopLessons({
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
