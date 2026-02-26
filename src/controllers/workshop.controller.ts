import { Request, Response, NextFunction } from 'express';
import * as workshopService from '../services/workshop.service';
import * as aiService from '../services/ai.service';
import { AppError } from '../middleware/error.middleware';
import { db } from '../config/database';
import { lessonGenerationJobs, lessons } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════
//  Lessons CRUD (user-created)
// ═══════════════════════════════════════════════════════

export async function getMyLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lessons = await workshopService.getMyLessons(req.user!.id);
    res.json({ success: true, data: { lessons } });
  } catch (error) {
    next(error);
  }
}

export async function createLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description, iconUrl, themeColor, visibility, editPolicy, aiInvolvement, tags } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError('Title is required', 400);
    }

    const lesson = await workshopService.createLesson({
      authorId: req.user!.id,
      title: title.trim(),
      description,
      iconUrl,
      themeColor,
      visibility,
      editPolicy,
      aiInvolvement,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean) : [],
    });

    res.status(201).json({ success: true, data: { lesson } });
  } catch (error) {
    next(error);
  }
}

export async function getLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const lesson = await workshopService.getLessonById(id);

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
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
    const { title, description, iconUrl, themeColor, visibility, editPolicy, aiInvolvement, tags } = req.body;

    const updateData: Record<string, unknown> = {
      title,
      description,
      iconUrl,
      themeColor,
      visibility,
      editPolicy,
      aiInvolvement,
    };
    if (Array.isArray(tags)) {
      updateData.tags = tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean);
    }

    const lesson = await workshopService.updateLesson(id, req.user!.id, updateData);

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
    const deleted = await workshopService.deleteLesson(id, req.user!.id);

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
    const lesson = await workshopService.publishLesson(id, req.user!.id);

    if (!lesson) {
      throw new AppError('Cannot publish: lesson not found, not authorized, or no content', 400);
    }

    res.json({ success: true, data: { lesson } });
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════
//  Play (serves lesson content for the viewer)
// ═══════════════════════════════════════════════════════

export async function playLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const lesson = await workshopService.getLessonForPlay(id);

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // If private, only the author can play
    if (lesson.visibility === 'private' && lesson.authorId !== req.user!.id) {
      throw new AppError('Not authorized to view this lesson', 403);
    }

    // Strip internal fields before sending
    const { visibility, status, ...playData } = lesson;
    res.json({ success: true, data: { lesson: playData } });
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

    const content = await workshopService.addLessonContent({
      lessonId: id,
      moduleId: req.body.moduleId,
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

    const content = await workshopService.updateLessonContent(cid, req.user!.id, {
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

    const success = await workshopService.reorderLessonContent(id, req.user!.id, contentIds);
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
    const deleted = await workshopService.deleteLessonContent(cid, req.user!.id);

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
      lessonId: id,
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
    const { topic, moduleCount } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new AppError('topic is required', 400);
    }

    // Use the new two-phase generation
    const result = await aiService.generateFullLesson(topic.trim(), moduleCount || 3);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function generateAIPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { topic, moduleCount } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new AppError('topic is required', 400);
    }

    const plan = await aiService.generateLessonPlan(topic.trim(), moduleCount || 3);
    res.json({ success: true, data: { plan } });
  } catch (error) {
    next(error);
  }
}

export async function generateAIModuleContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { lessonTitle, lessonDescription, modulePlan, moduleIndex, totalModules } = req.body;

    if (!lessonTitle || !modulePlan) {
      throw new AppError('lessonTitle and modulePlan are required', 400);
    }

    const pages = await aiService.generateModuleContent(
      lessonTitle,
      lessonDescription || '',
      modulePlan,
      moduleIndex || 0,
      totalModules || 1
    );
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
    const { search, tag, limit, offset, sort } = req.query;
    const result = await workshopService.browseLessons({
      search: search as string | undefined,
      tag: tag as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      sort: (sort as 'recent' | 'rating' | 'popular') || undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getPopularTags(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit } = req.query;
    const tags = await workshopService.getPopularTags(limit ? parseInt(limit as string) : 20);
    res.json({ success: true, data: { tags } });
  } catch (error) {
    next(error);
  }
}

export async function rateLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new AppError('Rating must be an integer between 1 and 5', 400);
    }

    const result = await workshopService.rateLesson(id, req.user!.id, Math.round(rating));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getLessonsByTag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tag } = req.params;
    const { limit } = req.query;
    const lessons = await workshopService.getLessonsByTag(
      decodeURIComponent(tag),
      limit ? parseInt(limit as string) : 10
    );
    res.json({ success: true, data: { lessons } });
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════
//  Module CRUD
// ═══════════════════════════════════════════════════════

export async function createModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError('Module title is required', 400);
    }

    const module = await workshopService.createLessonModule({
      lessonId: id,
      title: title.trim(),
      description,
      userId: req.user!.id,
    });

    if (!module) {
      throw new AppError('Not authorized or lesson not found', 403);
    }

    res.status(201).json({ success: true, data: { module } });
  } catch (error) {
    next(error);
  }
}

export async function updateModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mid } = req.params;
    const { title, description } = req.body;

    const module = await workshopService.updateLessonModule(mid, req.user!.id, { title, description });

    if (!module) {
      throw new AppError('Module not found or not authorized', 404);
    }

    res.json({ success: true, data: { module } });
  } catch (error) {
    next(error);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mid } = req.params;
    const deleted = await workshopService.deleteLessonModule(mid, req.user!.id);

    if (!deleted) {
      throw new AppError('Module not found or not authorized', 404);
    }

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
}

export async function reorderModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { moduleIds } = req.body;

    if (!Array.isArray(moduleIds)) {
      throw new AppError('moduleIds array is required', 400);
    }

    const success = await workshopService.reorderLessonModules(id, req.user!.id, moduleIds);
    if (!success) {
      throw new AppError('Not authorized or lesson not found', 403);
    }

    res.json({ success: true, data: { reordered: true } });
  } catch (error) {
    next(error);
  }
}

export async function getModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const modules = await workshopService.getLessonModules(id);
    res.json({ success: true, data: { modules } });
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════
//  Async AI Generation (background job)
// ═══════════════════════════════════════════════════════

/**
 * POST /workshop/ai-generate
 * Starts a background AI generation job and returns immediately.
 * Body: { topic?, moduleCount?, sourceType?, sourceContent?, lessonId? }
 *   - topic: free-text description of what to teach
 *   - sourceType: 'topic' | 'url' | 'pdf'
 *   - sourceContent: extracted text from URL/PDF (sent by client)
 *   - lessonId: optional existing lesson to generate into
 */
export async function startAIGeneration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { topic, moduleCount, sourceType, sourceContent, lessonId: existingLessonId } = req.body;
    const userId = req.user!.id;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new AppError('topic is required', 400);
    }

    const effectiveSourceType = sourceType || 'topic';

    // Extract source content based on source type
    let resolvedSourceContent: string | undefined = sourceContent;
    if (effectiveSourceType === 'url' && typeof sourceContent === 'string' && sourceContent.startsWith('http')) {
      // sourceContent is the URL — extract its text server-side
      try {
        resolvedSourceContent = await aiService.extractUrlContent(sourceContent);
      } catch (err: any) {
        throw new AppError(`Could not read URL: ${err.message}`, 400);
      }
    } else if (effectiveSourceType === 'pdf') {
      // Prefer binary upload via multer; fall back to base64 string for backward compat
      const pdfInput: Buffer | string | undefined = (req as any).file?.buffer ?? sourceContent;
      if (!pdfInput) throw new AppError('No PDF data received', 400);
      try {
        resolvedSourceContent = await aiService.extractPdfContent(pdfInput);
      } catch (err: any) {
        throw new AppError(`Could not read PDF: ${err.message}`, 400);
      }
    }

    // Create or reuse lesson stub
    let lessonId = existingLessonId as string | undefined;
    if (!lessonId) {
      const lesson = await workshopService.createLesson({
        authorId: userId,
        title: topic.trim().substring(0, 100),
        aiInvolvement: 'full',
        visibility: 'private',
        editPolicy: 'approval',
        tags: [],
      });
      lessonId = lesson.id;
    }

    // Create job record
    const [job] = await db.insert(lessonGenerationJobs).values({
      lessonId,
      userId,
      status: 'pending',
      sourceType: effectiveSourceType,
    }).returning();

    // Fire and forget — background generation
    void aiService.startBackgroundGeneration({
      lessonId,
      userId,
      jobId: job.id,
      topic: topic.trim(),
      moduleCount: moduleCount || 3,
      sourceContent: resolvedSourceContent,
      sourceType: effectiveSourceType,
    });

    res.status(201).json({ success: true, data: { lessonId, jobId: job.id } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /workshop/lessons/:id/generation-status
 * Returns the latest generation job status for a lesson.
 */
export async function getGenerationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const [lesson] = await db.select({ authorId: lessons.authorId })
      .from(lessons)
      .where(eq(lessons.id, id));

    if (!lesson) throw new AppError('Lesson not found', 404);
    if (lesson.authorId !== userId) throw new AppError('Not authorized', 403);

    const [job] = await db.select()
      .from(lessonGenerationJobs)
      .where(eq(lessonGenerationJobs.lessonId, id))
      .orderBy(desc(lessonGenerationJobs.createdAt))
      .limit(1);

    if (!job) {
      res.json({ success: true, data: { job: null } });
      return;
    }

    res.json({ success: true, data: { job } });
  } catch (error) {
    next(error);
  }
}
