import { db } from '../config/database';
import {
  workshopLessons,
  workshopLessonContent,
  workshopContentEdits,
  workshopEditSuggestions,
  users,
  type WorkshopLesson,
  type WorkshopLessonContent,
  type WorkshopContentEdit,
  type WorkshopEditSuggestion,
  type ContentData,
  type SourceReference,
} from '../db/schema';
import { eq, and, asc, desc, or, sql } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════
//  Workshop Lesson interfaces
// ═══════════════════════════════════════════════════════

export interface WorkshopLessonWithContent extends WorkshopLesson {
  content: WorkshopLessonContent[];
  authorName: string;
  authorAvatarUrl: string | null;
}

export interface WorkshopLessonSummary extends WorkshopLesson {
  authorName: string;
  pageCount: number;
}

export interface ContentPageMetadata {
  contentId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  sources: SourceReference[];
  lastEdited: Date;
  editors: { name: string; avatarUrl: string | null; editedAt: Date }[];
}

export interface LessonMetadata {
  lesson: {
    authorName: string;
    authorAvatarUrl: string | null;
    totalEdits: number;
    createdAt: Date;
    updatedAt: Date;
    aiInvolvement: string;
  };
  pages: ContentPageMetadata[];
}

// ═══════════════════════════════════════════════════════
//  CRUD: Workshop Lessons
// ═══════════════════════════════════════════════════════

export async function createWorkshopLesson(data: {
  authorId: string;
  title: string;
  description?: string;
  iconUrl?: string;
  themeColor?: string;
  visibility?: string;
  editPolicy?: string;
  aiInvolvement?: string;
}): Promise<WorkshopLesson> {
  const [lesson] = await db
    .insert(workshopLessons)
    .values({
      authorId: data.authorId,
      title: data.title,
      description: data.description,
      iconUrl: data.iconUrl,
      themeColor: data.themeColor || '#FF6B35',
      visibility: data.visibility || 'private',
      editPolicy: data.editPolicy || 'approval',
      aiInvolvement: data.aiInvolvement || 'none',
    })
    .returning();
  return lesson;
}

export async function getWorkshopLessonById(lessonId: string): Promise<WorkshopLessonWithContent | null> {
  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, lessonId))
    .limit(1);

  if (!lesson) return null;

  const [author] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, lesson.authorId))
    .limit(1);

  const content = await db
    .select()
    .from(workshopLessonContent)
    .where(eq(workshopLessonContent.workshopLessonId, lessonId))
    .orderBy(asc(workshopLessonContent.orderIndex));

  return {
    ...lesson,
    content,
    authorName: author?.name || 'Unknown',
    authorAvatarUrl: author?.avatarUrl || null,
  };
}

export async function getMyWorkshopLessons(userId: string): Promise<WorkshopLessonSummary[]> {
  const lessons = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.authorId, userId))
    .orderBy(desc(workshopLessons.updatedAt));

  const [author] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const result: WorkshopLessonSummary[] = [];
  for (const lesson of lessons) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workshopLessonContent)
      .where(eq(workshopLessonContent.workshopLessonId, lesson.id));
    
    result.push({
      ...lesson,
      authorName: author?.name || 'Unknown',
      pageCount: Number(countResult?.count || 0),
    });
  }

  return result;
}

export async function updateWorkshopLesson(
  lessonId: string,
  userId: string,
  data: Partial<{
    title: string;
    description: string;
    iconUrl: string;
    themeColor: string;
    visibility: string;
    editPolicy: string;
    aiInvolvement: string;
  }>
): Promise<WorkshopLesson | null> {
  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, lessonId))
    .limit(1);

  if (!lesson || lesson.authorId !== userId) return null;

  const [updated] = await db
    .update(workshopLessons)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workshopLessons.id, lessonId))
    .returning();

  return updated;
}

export async function deleteWorkshopLesson(lessonId: string, userId: string): Promise<boolean> {
  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, lessonId))
    .limit(1);

  if (!lesson || lesson.authorId !== userId) return false;

  await db.delete(workshopLessons).where(eq(workshopLessons.id, lessonId));
  return true;
}

export async function publishWorkshopLesson(lessonId: string, userId: string): Promise<WorkshopLesson | null> {
  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, lessonId))
    .limit(1);

  if (!lesson || lesson.authorId !== userId) return null;

  // Check there's at least one content page
  const [contentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workshopLessonContent)
    .where(eq(workshopLessonContent.workshopLessonId, lessonId));

  if (Number(contentCount?.count || 0) === 0) return null;

  const [updated] = await db
    .update(workshopLessons)
    .set({
      status: 'published',
      visibility: 'public',
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workshopLessons.id, lessonId))
    .returning();

  return updated;
}

// ═══════════════════════════════════════════════════════
//  CRUD: Workshop Lesson Content (Pages)
// ═══════════════════════════════════════════════════════

export async function addWorkshopContent(data: {
  workshopLessonId: string;
  contentType: string;
  contentData: ContentData;
  authorId: string;
  sources?: SourceReference[];
}): Promise<WorkshopLessonContent> {
  // Get next order index
  const [maxOrder] = await db
    .select({ maxIdx: sql<number>`COALESCE(MAX(order_index), -1)` })
    .from(workshopLessonContent)
    .where(eq(workshopLessonContent.workshopLessonId, data.workshopLessonId));

  const nextIndex = Number(maxOrder?.maxIdx ?? -1) + 1;

  const [content] = await db
    .insert(workshopLessonContent)
    .values({
      workshopLessonId: data.workshopLessonId,
      orderIndex: nextIndex,
      contentType: data.contentType,
      contentData: data.contentData,
      authorId: data.authorId,
      sources: data.sources || [],
    })
    .returning();

  // Record edit history
  await db.insert(workshopContentEdits).values({
    workshopLessonId: data.workshopLessonId,
    contentId: content.id,
    editorId: data.authorId,
    editType: 'create',
    previousData: null,
  });

  // Update lesson timestamp
  await db
    .update(workshopLessons)
    .set({ updatedAt: new Date() })
    .where(eq(workshopLessons.id, data.workshopLessonId));

  return content;
}

export async function updateWorkshopContent(
  contentId: string,
  editorId: string,
  data: {
    contentType?: string;
    contentData?: ContentData;
    sources?: SourceReference[];
  }
): Promise<WorkshopLessonContent | null> {
  const [existing] = await db
    .select()
    .from(workshopLessonContent)
    .where(eq(workshopLessonContent.id, contentId))
    .limit(1);

  if (!existing) return null;

  // Check edit permissions
  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, existing.workshopLessonId))
    .limit(1);

  if (!lesson) return null;

  // Only author or open-edit lessons allow direct edits
  if (lesson.authorId !== editorId && lesson.editPolicy !== 'open') {
    return null;
  }

  // Record edit history
  await db.insert(workshopContentEdits).values({
    workshopLessonId: existing.workshopLessonId,
    contentId: contentId,
    editorId: editorId,
    editType: 'update',
    previousData: { contentType: existing.contentType, contentData: existing.contentData, sources: existing.sources },
  });

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.contentType) updateData.contentType = data.contentType;
  if (data.contentData) updateData.contentData = data.contentData;
  if (data.sources) updateData.sources = data.sources;

  const [updated] = await db
    .update(workshopLessonContent)
    .set(updateData)
    .where(eq(workshopLessonContent.id, contentId))
    .returning();

  // Update lesson timestamp and AI involvement
  const lessonUpdate: Record<string, unknown> = { updatedAt: new Date() };
  if (lesson.aiInvolvement === 'full' && editorId !== lesson.authorId) {
    lessonUpdate.aiInvolvement = 'collaboration';
  }
  await db.update(workshopLessons).set(lessonUpdate).where(eq(workshopLessons.id, existing.workshopLessonId));

  return updated;
}

export async function reorderWorkshopContent(
  workshopLessonId: string,
  userId: string,
  contentIds: string[]
): Promise<boolean> {
  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, workshopLessonId))
    .limit(1);

  if (!lesson || (lesson.authorId !== userId && lesson.editPolicy !== 'open')) return false;

  for (let i = 0; i < contentIds.length; i++) {
    await db
      .update(workshopLessonContent)
      .set({ orderIndex: i })
      .where(
        and(
          eq(workshopLessonContent.id, contentIds[i]),
          eq(workshopLessonContent.workshopLessonId, workshopLessonId)
        )
      );
  }

  // Record edit history
  await db.insert(workshopContentEdits).values({
    workshopLessonId,
    contentId: null,
    editorId: userId,
    editType: 'reorder',
    previousData: { contentIds },
  });

  await db
    .update(workshopLessons)
    .set({ updatedAt: new Date() })
    .where(eq(workshopLessons.id, workshopLessonId));

  return true;
}

export async function deleteWorkshopContent(
  contentId: string,
  userId: string
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(workshopLessonContent)
    .where(eq(workshopLessonContent.id, contentId))
    .limit(1);

  if (!existing) return false;

  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, existing.workshopLessonId))
    .limit(1);

  if (!lesson || (lesson.authorId !== userId && lesson.editPolicy !== 'open')) return false;

  // Record edit history
  await db.insert(workshopContentEdits).values({
    workshopLessonId: existing.workshopLessonId,
    contentId: null,
    editorId: userId,
    editType: 'delete',
    previousData: { contentType: existing.contentType, contentData: existing.contentData },
  });

  await db.delete(workshopLessonContent).where(eq(workshopLessonContent.id, contentId));

  await db
    .update(workshopLessons)
    .set({ updatedAt: new Date() })
    .where(eq(workshopLessons.id, existing.workshopLessonId));

  return true;
}

// ═══════════════════════════════════════════════════════
//  History & Metadata
// ═══════════════════════════════════════════════════════

export async function getEditHistory(workshopLessonId: string): Promise<(WorkshopContentEdit & { editorName: string })[]> {
  const edits = await db
    .select()
    .from(workshopContentEdits)
    .where(eq(workshopContentEdits.workshopLessonId, workshopLessonId))
    .orderBy(desc(workshopContentEdits.createdAt));

  const result = [];
  for (const edit of edits) {
    const [editor] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, edit.editorId))
      .limit(1);

    result.push({
      ...edit,
      editorName: editor?.name || 'Unknown',
    });
  }

  return result;
}

export async function getLessonMetadata(workshopLessonId: string): Promise<LessonMetadata | null> {
  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, workshopLessonId))
    .limit(1);

  if (!lesson) return null;

  const [author] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, lesson.authorId))
    .limit(1);

  const [editCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workshopContentEdits)
    .where(eq(workshopContentEdits.workshopLessonId, workshopLessonId));

  const contentPages = await db
    .select()
    .from(workshopLessonContent)
    .where(eq(workshopLessonContent.workshopLessonId, workshopLessonId))
    .orderBy(asc(workshopLessonContent.orderIndex));

  const pages: ContentPageMetadata[] = [];
  for (const page of contentPages) {
    const [pageAuthor] = await db
      .select({ name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, page.authorId))
      .limit(1);

    // Get editors for this page
    const pageEdits = await db
      .select({
        editorId: workshopContentEdits.editorId,
        createdAt: workshopContentEdits.createdAt,
      })
      .from(workshopContentEdits)
      .where(
        and(
          eq(workshopContentEdits.contentId, page.id),
          eq(workshopContentEdits.editType, 'update')
        )
      )
      .orderBy(desc(workshopContentEdits.createdAt));

    const editors = [];
    const seenEditors = new Set<string>();
    for (const edit of pageEdits) {
      if (seenEditors.has(edit.editorId)) continue;
      seenEditors.add(edit.editorId);

      const [editor] = await db
        .select({ name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, edit.editorId))
        .limit(1);

      editors.push({
        name: editor?.name || 'Unknown',
        avatarUrl: editor?.avatarUrl || null,
        editedAt: edit.createdAt,
      });
    }

    pages.push({
      contentId: page.id,
      authorName: pageAuthor?.name || 'Unknown',
      authorAvatarUrl: pageAuthor?.avatarUrl || null,
      sources: (page.sources as SourceReference[]) || [],
      lastEdited: page.updatedAt,
      editors,
    });
  }

  return {
    lesson: {
      authorName: author?.name || 'Unknown',
      authorAvatarUrl: author?.avatarUrl || null,
      totalEdits: Number(editCount?.count || 0),
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      aiInvolvement: lesson.aiInvolvement,
    },
    pages,
  };
}

// ═══════════════════════════════════════════════════════
//  Edit Suggestions
// ═══════════════════════════════════════════════════════

export async function submitEditSuggestion(data: {
  workshopLessonId: string;
  contentId?: string;
  suggesterId: string;
  suggestedData: unknown;
}): Promise<WorkshopEditSuggestion> {
  const [suggestion] = await db
    .insert(workshopEditSuggestions)
    .values({
      workshopLessonId: data.workshopLessonId,
      contentId: data.contentId || null,
      suggesterId: data.suggesterId,
      suggestedData: data.suggestedData,
    })
    .returning();
  return suggestion;
}

export async function getEditSuggestions(
  workshopLessonId: string,
  status?: string
): Promise<(WorkshopEditSuggestion & { suggesterName: string })[]> {
  const conditions = [eq(workshopEditSuggestions.workshopLessonId, workshopLessonId)];
  if (status) {
    conditions.push(eq(workshopEditSuggestions.status, status));
  }

  const suggestions = await db
    .select()
    .from(workshopEditSuggestions)
    .where(and(...conditions))
    .orderBy(desc(workshopEditSuggestions.createdAt));

  const result = [];
  for (const suggestion of suggestions) {
    const [suggester] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, suggestion.suggesterId))
      .limit(1);

    result.push({
      ...suggestion,
      suggesterName: suggester?.name || 'Unknown',
    });
  }

  return result;
}

export async function reviewEditSuggestion(
  suggestionId: string,
  reviewerId: string,
  action: 'approved' | 'rejected'
): Promise<WorkshopEditSuggestion | null> {
  const [suggestion] = await db
    .select()
    .from(workshopEditSuggestions)
    .where(eq(workshopEditSuggestions.id, suggestionId))
    .limit(1);

  if (!suggestion) return null;

  // Verify the reviewer is the lesson author
  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, suggestion.workshopLessonId))
    .limit(1);

  if (!lesson || lesson.authorId !== reviewerId) return null;

  // If approving, apply the edit
  if (action === 'approved' && suggestion.contentId && suggestion.suggestedData) {
    const suggestedContent = suggestion.suggestedData as { contentType?: string; contentData?: ContentData; sources?: SourceReference[] };
    await updateWorkshopContent(suggestion.contentId, reviewerId, {
      contentType: suggestedContent.contentType,
      contentData: suggestedContent.contentData,
      sources: suggestedContent.sources,
    });
  }

  const [updated] = await db
    .update(workshopEditSuggestions)
    .set({
      status: action,
      reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(workshopEditSuggestions.id, suggestionId))
    .returning();

  return updated;
}

// ═══════════════════════════════════════════════════════
//  Browse public lessons
// ═══════════════════════════════════════════════════════

export async function browseWorkshopLessons(opts?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ lessons: WorkshopLessonSummary[]; total: number }> {
  const limit = opts?.limit || 20;
  const offset = opts?.offset || 0;

  let query = db
    .select()
    .from(workshopLessons)
    .where(
      and(
        eq(workshopLessons.status, 'published'),
        eq(workshopLessons.visibility, 'public')
      )
    )
    .orderBy(desc(workshopLessons.publishedAt))
    .limit(limit)
    .offset(offset);

  const lessons = await query;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workshopLessons)
    .where(
      and(
        eq(workshopLessons.status, 'published'),
        eq(workshopLessons.visibility, 'public')
      )
    );

  const result: WorkshopLessonSummary[] = [];
  for (const lesson of lessons) {
    const [author] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, lesson.authorId))
      .limit(1);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workshopLessonContent)
      .where(eq(workshopLessonContent.workshopLessonId, lesson.id));

    result.push({
      ...lesson,
      authorName: author?.name || 'Unknown',
      pageCount: Number(countResult?.count || 0),
    });
  }

  return { lessons: result, total: Number(totalResult?.count || 0) };
}

// ═══════════════════════════════════════════════════════
//  Bulk insert content (for AI drafts)
// ═══════════════════════════════════════════════════════

export async function bulkInsertContent(
  workshopLessonId: string,
  authorId: string,
  pages: { contentType: string; contentData: ContentData }[]
): Promise<WorkshopLessonContent[]> {
  const result: WorkshopLessonContent[] = [];

  for (let i = 0; i < pages.length; i++) {
    const [content] = await db
      .insert(workshopLessonContent)
      .values({
        workshopLessonId,
        orderIndex: i,
        contentType: pages[i].contentType,
        contentData: pages[i].contentData,
        authorId,
        sources: [],
      })
      .returning();

    await db.insert(workshopContentEdits).values({
      workshopLessonId,
      contentId: content.id,
      editorId: authorId,
      editType: 'create',
      previousData: null,
    });

    result.push(content);
  }

  await db
    .update(workshopLessons)
    .set({ updatedAt: new Date() })
    .where(eq(workshopLessons.id, workshopLessonId));

  return result;
}

// ═══════════════════════════════════════════════════════
//  Permission check helper
// ═══════════════════════════════════════════════════════

export async function canUserEditLesson(workshopLessonId: string, userId: string): Promise<boolean> {
  const [lesson] = await db
    .select()
    .from(workshopLessons)
    .where(eq(workshopLessons.id, workshopLessonId))
    .limit(1);

  if (!lesson) return false;
  if (lesson.authorId === userId) return true;
  if (lesson.editPolicy === 'open' && lesson.visibility === 'public') return true;
  return false;
}
