import { db } from '../config/database';
import {
  lessons,
  lessonContent,
  lessonModules,
  lessonContentEdits,
  lessonEditSuggestions,
  lessonRatings,
  users,
  type Lesson,
  type LessonContent,
  type LessonModule,
  type LessonContentEdit,
  type LessonEditSuggestion,
  type ContentData,
  type SourceReference,
} from '../db/schema';
import { eq, and, asc, desc, or, sql, ilike } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════
//  Interfaces
// ═══════════════════════════════════════════════════════

export interface LessonModuleWithContent extends LessonModule {
  content: LessonContent[];
}

export interface LessonWithFullContent extends Lesson {
  modules: LessonModuleWithContent[];
  content: LessonContent[];
  authorName: string;
  authorAvatarUrl: string | null;
}

export interface LessonSummary extends Lesson {
  authorName: string;
  pageCount: number;
  averageRating: number;
}

export interface ContentPageMetadata {
  contentId: string;
  moduleId?: string | null;
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
  modules?: { id: string; title: string; description: string | null }[];
  pages: ContentPageMetadata[];
}

// ═══════════════════════════════════════════════════════
//  CRUD: Lessons (user-created)
// ═══════════════════════════════════════════════════════

export async function createLesson(data: {
  authorId: string;
  title: string;
  description?: string;
  iconUrl?: string;
  themeColor?: string;
  visibility?: string;
  editPolicy?: string;
  aiInvolvement?: string;
  tags?: string[];
}): Promise<Lesson> {
  const [lesson] = await db
    .insert(lessons)
    .values({
      authorId: data.authorId,
      title: data.title,
      description: data.description,
      iconUrl: data.iconUrl,
      themeColor: data.themeColor || '#FF6B35',
      isOfficial: false,
      visibility: data.visibility || 'private',
      status: 'draft',
      editPolicy: data.editPolicy || 'approval',
      aiInvolvement: data.aiInvolvement || 'none',
      tags: data.tags || [],
    })
    .returning();
  return lesson;
}

export async function getLessonById(lessonId: string): Promise<LessonWithFullContent | null> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) return null;

  let authorName = 'Bloom Team';
  let authorAvatarUrl: string | null = null;

  if (lesson.authorId) {
    const [author] = await db
      .select({ name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, lesson.authorId))
      .limit(1);
    authorName = author?.name || 'Unknown';
    authorAvatarUrl = author?.avatarUrl || null;
  }

  // Fetch modules
  const modules = await db
    .select()
    .from(lessonModules)
    .where(eq(lessonModules.lessonId, lessonId))
    .orderBy(asc(lessonModules.orderIndex));

  const content = await db
    .select()
    .from(lessonContent)
    .where(eq(lessonContent.lessonId, lessonId))
    .orderBy(asc(lessonContent.orderIndex));

  // Group content into modules
  const modulesWithContent: LessonModuleWithContent[] = modules.map(mod => ({
    ...mod,
    content: content.filter(c => c.moduleId === mod.id),
  }));

  return {
    ...lesson,
    modules: modulesWithContent,
    content,
    authorName,
    authorAvatarUrl,
  };
}

/**
 * Returns lesson content in a unified shape for the lesson viewer.
 */
export async function getLessonForPlay(lessonId: string) {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) return null;

  let authorName = 'Bloom Team';
  let authorAvatarUrl: string | null = null;

  if (lesson.authorId) {
    const [author] = await db
      .select({ name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, lesson.authorId))
      .limit(1);
    authorName = author?.name || 'Unknown';
    authorAvatarUrl = author?.avatarUrl || null;
  }

  // Fetch modules
  const modules = await db
    .select()
    .from(lessonModules)
    .where(eq(lessonModules.lessonId, lessonId))
    .orderBy(asc(lessonModules.orderIndex));

  const pages = await db
    .select()
    .from(lessonContent)
    .where(eq(lessonContent.lessonId, lessonId))
    .orderBy(asc(lessonContent.orderIndex));

  return {
    id: lesson.id,
    levelId: lesson.levelId || lesson.id,
    title: lesson.title,
    iconUrl: lesson.iconUrl,
    type: lesson.type as 'lesson' | 'exercise' | 'quiz',
    orderIndex: lesson.orderIndex,
    isOfficial: lesson.isOfficial,
    modules: modules.map(mod => ({
      id: mod.id,
      title: mod.title,
      description: mod.description,
      orderIndex: mod.orderIndex,
      content: pages
        .filter(p => p.moduleId === mod.id)
        .map((page, idx) => ({
          id: page.id,
          lessonId: lesson.id,
          moduleId: mod.id,
          orderIndex: idx,
          contentType: page.contentType,
          contentData: page.contentData,
        })),
    })),
    content: pages.map((page, idx) => ({
      id: page.id,
      lessonId: lesson.id,
      moduleId: page.moduleId,
      orderIndex: idx,
      contentType: page.contentType,
      contentData: page.contentData,
    })),
    // Extra fields for display
    authorId: lesson.authorId,
    authorName,
    authorAvatarUrl,
    description: lesson.description,
    themeColor: lesson.themeColor,
    aiInvolvement: lesson.aiInvolvement,
    tags: lesson.tags,
    creatorName: authorName,
    visibility: lesson.visibility,
    status: lesson.status,
  };
}

export async function getMyLessons(userId: string): Promise<LessonSummary[]> {
  const myLessons = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.authorId, userId), eq(lessons.isOfficial, false)))
    .orderBy(desc(lessons.updatedAt));

  const [author] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const result: LessonSummary[] = [];
  for (const lesson of myLessons) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessonContent)
      .where(eq(lessonContent.lessonId, lesson.id));

    result.push({
      ...lesson,
      authorName: author?.name || 'Unknown',
      pageCount: Number(countResult?.count || 0),
      averageRating: lesson.ratingCount > 0 ? lesson.ratingSum / lesson.ratingCount : 0,
    });
  }

  return result;
}

export async function updateLesson(
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
    tags: string[];
  }>
): Promise<Lesson | null> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson || lesson.isOfficial || lesson.authorId !== userId) return null;

  const [updated] = await db
    .update(lessons)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(lessons.id, lessonId))
    .returning();

  return updated;
}

export async function deleteLesson(lessonId: string, userId: string): Promise<boolean> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson || lesson.isOfficial || lesson.authorId !== userId) return false;

  await db.delete(lessons).where(eq(lessons.id, lessonId));
  return true;
}

export async function publishLesson(lessonId: string, userId: string): Promise<Lesson | null> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson || lesson.isOfficial || lesson.authorId !== userId) return null;

  // Check there's at least one content page
  const [contentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(lessonContent)
    .where(eq(lessonContent.lessonId, lessonId));

  if (Number(contentCount?.count || 0) === 0) return null;

  const [updated] = await db
    .update(lessons)
    .set({
      status: 'published',
      visibility: 'public',
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(lessons.id, lessonId))
    .returning();

  return updated;
}

// ═══════════════════════════════════════════════════════
//  CRUD: Lesson Content (Pages)
// ═══════════════════════════════════════════════════════

export async function addLessonContent(data: {
  lessonId: string;
  moduleId?: string;
  contentType: string;
  contentData: ContentData;
  authorId: string;
  sources?: SourceReference[];
}): Promise<LessonContent> {
  // Get next order index (within the module if specified, else across the whole lesson)
  const conditions = [eq(lessonContent.lessonId, data.lessonId)];
  if (data.moduleId) {
    conditions.push(eq(lessonContent.moduleId, data.moduleId));
  }

  const [maxOrder] = await db
    .select({ maxIdx: sql<number>`COALESCE(MAX(order_index), -1)` })
    .from(lessonContent)
    .where(and(...conditions));

  const nextIndex = Number(maxOrder?.maxIdx ?? -1) + 1;

  const [content] = await db
    .insert(lessonContent)
    .values({
      lessonId: data.lessonId,
      moduleId: data.moduleId || null,
      orderIndex: nextIndex,
      contentType: data.contentType,
      contentData: data.contentData,
      authorId: data.authorId,
      sources: data.sources || [],
    })
    .returning();

  // Record edit history
  await db.insert(lessonContentEdits).values({
    lessonId: data.lessonId,
    contentId: content.id,
    editorId: data.authorId,
    editType: 'create',
    previousData: null,
  });

  // Update lesson timestamp
  await db
    .update(lessons)
    .set({ updatedAt: new Date() })
    .where(eq(lessons.id, data.lessonId));

  return content;
}

export async function updateLessonContent(
  contentId: string,
  editorId: string,
  data: {
    contentType?: string;
    contentData?: ContentData;
    sources?: SourceReference[];
  }
): Promise<LessonContent | null> {
  const [existing] = await db
    .select()
    .from(lessonContent)
    .where(eq(lessonContent.id, contentId))
    .limit(1);

  if (!existing) return null;

  // Check edit permissions
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, existing.lessonId))
    .limit(1);

  if (!lesson) return null;

  // Official lessons are not editable; user lessons: only author or open-edit
  if (lesson.isOfficial) return null;
  if (lesson.authorId !== editorId && lesson.editPolicy !== 'open') {
    return null;
  }

  // Record edit history
  await db.insert(lessonContentEdits).values({
    lessonId: existing.lessonId,
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
    .update(lessonContent)
    .set(updateData)
    .where(eq(lessonContent.id, contentId))
    .returning();

  // Update lesson timestamp and AI involvement
  const lessonUpdate: Record<string, unknown> = { updatedAt: new Date() };
  if (lesson.aiInvolvement === 'full' && editorId !== lesson.authorId) {
    lessonUpdate.aiInvolvement = 'collaboration';
  }
  await db.update(lessons).set(lessonUpdate).where(eq(lessons.id, existing.lessonId));

  return updated;
}

export async function reorderLessonContent(
  lessonId: string,
  userId: string,
  contentIds: string[]
): Promise<boolean> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson || lesson.isOfficial) return false;
  if (lesson.authorId !== userId && lesson.editPolicy !== 'open') return false;

  for (let i = 0; i < contentIds.length; i++) {
    await db
      .update(lessonContent)
      .set({ orderIndex: i })
      .where(
        and(
          eq(lessonContent.id, contentIds[i]),
          eq(lessonContent.lessonId, lessonId)
        )
      );
  }

  // Record edit history
  await db.insert(lessonContentEdits).values({
    lessonId,
    contentId: null,
    editorId: userId,
    editType: 'reorder',
    previousData: { contentIds },
  });

  await db
    .update(lessons)
    .set({ updatedAt: new Date() })
    .where(eq(lessons.id, lessonId));

  return true;
}

export async function deleteLessonContent(
  contentId: string,
  userId: string
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(lessonContent)
    .where(eq(lessonContent.id, contentId))
    .limit(1);

  if (!existing) return false;

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, existing.lessonId))
    .limit(1);

  if (!lesson || lesson.isOfficial) return false;
  if (lesson.authorId !== userId && lesson.editPolicy !== 'open') return false;

  // Record edit history
  await db.insert(lessonContentEdits).values({
    lessonId: existing.lessonId,
    contentId: null,
    editorId: userId,
    editType: 'delete',
    previousData: { contentType: existing.contentType, contentData: existing.contentData },
  });

  await db.delete(lessonContent).where(eq(lessonContent.id, contentId));

  await db
    .update(lessons)
    .set({ updatedAt: new Date() })
    .where(eq(lessons.id, existing.lessonId));

  return true;
}

// ═══════════════════════════════════════════════════════
//  History & Metadata
// ═══════════════════════════════════════════════════════

export async function getEditHistory(lessonId: string): Promise<(LessonContentEdit & { editorName: string })[]> {
  const edits = await db
    .select()
    .from(lessonContentEdits)
    .where(eq(lessonContentEdits.lessonId, lessonId))
    .orderBy(desc(lessonContentEdits.createdAt));

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

export async function getLessonMetadata(lessonId: string): Promise<LessonMetadata | null> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) return null;

  let authorName = 'Bloom Team';
  let authorAvatarUrl: string | null = null;

  if (lesson.authorId) {
    const [author] = await db
      .select({ name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, lesson.authorId))
      .limit(1);
    authorName = author?.name || 'Unknown';
    authorAvatarUrl = author?.avatarUrl || null;
  }

  const [editCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(lessonContentEdits)
    .where(eq(lessonContentEdits.lessonId, lessonId));

  const contentPages = await db
    .select()
    .from(lessonContent)
    .where(eq(lessonContent.lessonId, lessonId))
    .orderBy(asc(lessonContent.orderIndex));

  const pages: ContentPageMetadata[] = [];
  for (const page of contentPages) {
    let pageAuthorName = authorName;
    let pageAuthorAvatarUrl = authorAvatarUrl;

    if (page.authorId) {
      const [pageAuthor] = await db
        .select({ name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, page.authorId))
        .limit(1);
      pageAuthorName = pageAuthor?.name || 'Unknown';
      pageAuthorAvatarUrl = pageAuthor?.avatarUrl || null;
    }

    // Get editors for this page
    const pageEdits = await db
      .select({
        editorId: lessonContentEdits.editorId,
        createdAt: lessonContentEdits.createdAt,
      })
      .from(lessonContentEdits)
      .where(
        and(
          eq(lessonContentEdits.contentId, page.id),
          eq(lessonContentEdits.editType, 'update')
        )
      )
      .orderBy(desc(lessonContentEdits.createdAt));

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
      moduleId: page.moduleId,
      authorName: pageAuthorName,
      authorAvatarUrl: pageAuthorAvatarUrl,
      sources: (page.sources as SourceReference[]) || [],
      lastEdited: page.updatedAt,
      editors,
    });
  }

  // Fetch modules
  const modules = await db
    .select()
    .from(lessonModules)
    .where(eq(lessonModules.lessonId, lessonId))
    .orderBy(asc(lessonModules.orderIndex));

  return {
    lesson: {
      authorName,
      authorAvatarUrl,
      totalEdits: Number(editCount?.count || 0),
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      aiInvolvement: lesson.aiInvolvement,
    },
    modules: modules.map(m => ({ id: m.id, title: m.title, description: m.description })),
    pages,
  };
}

// ═══════════════════════════════════════════════════════
//  Edit Suggestions
// ═══════════════════════════════════════════════════════

export async function submitEditSuggestion(data: {
  lessonId: string;
  contentId?: string;
  suggesterId: string;
  suggestedData: unknown;
}): Promise<LessonEditSuggestion> {
  const [suggestion] = await db
    .insert(lessonEditSuggestions)
    .values({
      lessonId: data.lessonId,
      contentId: data.contentId || null,
      suggesterId: data.suggesterId,
      suggestedData: data.suggestedData,
    })
    .returning();
  return suggestion;
}

export async function getEditSuggestions(
  lessonId: string,
  status?: string
): Promise<(LessonEditSuggestion & { suggesterName: string })[]> {
  const conditions = [eq(lessonEditSuggestions.lessonId, lessonId)];
  if (status) {
    conditions.push(eq(lessonEditSuggestions.status, status));
  }

  const suggestions = await db
    .select()
    .from(lessonEditSuggestions)
    .where(and(...conditions))
    .orderBy(desc(lessonEditSuggestions.createdAt));

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
): Promise<LessonEditSuggestion | null> {
  const [suggestion] = await db
    .select()
    .from(lessonEditSuggestions)
    .where(eq(lessonEditSuggestions.id, suggestionId))
    .limit(1);

  if (!suggestion) return null;

  // Verify the reviewer is the lesson author
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, suggestion.lessonId))
    .limit(1);

  if (!lesson || lesson.authorId !== reviewerId) return null;

  // If approving, apply the edit
  if (action === 'approved' && suggestion.contentId && suggestion.suggestedData) {
    const suggestedContent = suggestion.suggestedData as { contentType?: string; contentData?: ContentData; sources?: SourceReference[] };
    await updateLessonContent(suggestion.contentId, reviewerId, {
      contentType: suggestedContent.contentType,
      contentData: suggestedContent.contentData,
      sources: suggestedContent.sources,
    });
  }

  const [updated] = await db
    .update(lessonEditSuggestions)
    .set({
      status: action,
      reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(lessonEditSuggestions.id, suggestionId))
    .returning();

  return updated;
}

// ═══════════════════════════════════════════════════════
//  Browse public lessons (user-created, published)
// ═══════════════════════════════════════════════════════

export async function browseLessons(opts?: {
  search?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'rating' | 'popular';
}): Promise<{ lessons: LessonSummary[]; total: number }> {
  const limit = opts?.limit || 20;
  const offset = opts?.offset || 0;
  const sort = opts?.sort || 'rating';

  const conditions = [
    eq(lessons.isOfficial, false),
    eq(lessons.status, 'published'),
    eq(lessons.visibility, 'public'),
  ];

  // Filter by tag using jsonb containment
  if (opts?.tag) {
    conditions.push(sql`${lessons.tags}::jsonb @> ${JSON.stringify([opts.tag])}::jsonb`);
  }

  // Filter by search term
  if (opts?.search) {
    conditions.push(
      or(
        ilike(lessons.title, `%${opts.search}%`),
        ilike(lessons.description, `%${opts.search}%`)
      )!
    );
  }

  // Determine sort order
  const orderBy = sort === 'recent'
    ? desc(lessons.publishedAt)
    : sort === 'popular'
      ? desc(lessons.viewCount)
      : sql`CASE WHEN ${lessons.ratingCount} = 0 THEN 0 ELSE ${lessons.ratingSum}::float / ${lessons.ratingCount} END DESC`;

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(and(...conditions))
    .orderBy(orderBy, desc(lessons.viewCount))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(lessons)
    .where(and(...conditions));

  const result: LessonSummary[] = [];
  for (const lesson of lessonRows) {
    let authorName = 'Unknown';
    if (lesson.authorId) {
      const [author] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, lesson.authorId))
        .limit(1);
      authorName = author?.name || 'Unknown';
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessonContent)
      .where(eq(lessonContent.lessonId, lesson.id));

    result.push({
      ...lesson,
      authorName,
      pageCount: Number(countResult?.count || 0),
      averageRating: lesson.ratingCount > 0 ? lesson.ratingSum / lesson.ratingCount : 0,
    });
  }

  return { lessons: result, total: Number(totalResult?.count || 0) };
}

// ═══════════════════════════════════════════════════════
//  Popular Tags
// ═══════════════════════════════════════════════════════

export async function getPopularTags(limit: number = 20): Promise<{ tag: string; count: number }[]> {
  const result = await db.execute(sql`
    SELECT tag, COUNT(*) as count
    FROM lessons,
    jsonb_array_elements_text(tags) AS tag
    WHERE status = 'published' AND visibility = 'public' AND is_official = false
    GROUP BY tag
    ORDER BY count DESC
    LIMIT ${limit}
  `);

  return (result.rows as any[]).map(row => ({
    tag: row.tag as string,
    count: Number(row.count),
  }));
}

// ═══════════════════════════════════════════════════════
//  Ratings
// ═══════════════════════════════════════════════════════

export async function rateLesson(
  lessonId: string,
  userId: string,
  rating: number
): Promise<{ averageRating: number; ratingCount: number }> {
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

  // Check for existing rating
  const [existing] = await db
    .select()
    .from(lessonRatings)
    .where(
      and(
        eq(lessonRatings.lessonId, lessonId),
        eq(lessonRatings.userId, userId)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing rating
    const diff = rating - existing.rating;
    await db
      .update(lessonRatings)
      .set({ rating })
      .where(eq(lessonRatings.id, existing.id));

    await db
      .update(lessons)
      .set({
        ratingSum: sql`${lessons.ratingSum} + ${diff}`,
      })
      .where(eq(lessons.id, lessonId));
  } else {
    // Insert new rating
    await db
      .insert(lessonRatings)
      .values({ lessonId, userId, rating });

    await db
      .update(lessons)
      .set({
        ratingSum: sql`${lessons.ratingSum} + ${rating}`,
        ratingCount: sql`${lessons.ratingCount} + 1`,
      })
      .where(eq(lessons.id, lessonId));
  }

  // Return updated values
  const [lesson] = await db
    .select({ ratingSum: lessons.ratingSum, ratingCount: lessons.ratingCount })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  return {
    averageRating: lesson.ratingCount > 0 ? lesson.ratingSum / lesson.ratingCount : 0,
    ratingCount: lesson.ratingCount,
  };
}

export async function incrementViewCount(lessonId: string): Promise<void> {
  await db
    .update(lessons)
    .set({ viewCount: sql`${lessons.viewCount} + 1` })
    .where(eq(lessons.id, lessonId));
}

// ═══════════════════════════════════════════════════════
//  Get lessons grouped by tags (for Courses page)
// ═══════════════════════════════════════════════════════

export async function getLessonsByTag(tag: string, limit: number = 10): Promise<LessonSummary[]> {
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.isOfficial, false),
        eq(lessons.status, 'published'),
        eq(lessons.visibility, 'public'),
        sql`${lessons.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`
      )
    )
    .orderBy(
      sql`CASE WHEN ${lessons.ratingCount} = 0 THEN 0 ELSE ${lessons.ratingSum}::float / ${lessons.ratingCount} END DESC`,
      desc(lessons.viewCount)
    )
    .limit(limit);

  const result: LessonSummary[] = [];
  for (const lesson of lessonRows) {
    let authorName = 'Unknown';
    if (lesson.authorId) {
      const [author] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, lesson.authorId))
        .limit(1);
      authorName = author?.name || 'Unknown';
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessonContent)
      .where(eq(lessonContent.lessonId, lesson.id));

    result.push({
      ...lesson,
      authorName,
      pageCount: Number(countResult?.count || 0),
      averageRating: lesson.ratingCount > 0 ? lesson.ratingSum / lesson.ratingCount : 0,
    });
  }

  return result;
}

// ═══════════════════════════════════════════════════════
//  Bulk insert content (for AI drafts)
// ═══════════════════════════════════════════════════════

export async function bulkInsertContent(
  lessonId: string,
  authorId: string,
  pages: { contentType: string; contentData: ContentData; moduleId?: string }[]
): Promise<LessonContent[]> {
  const result: LessonContent[] = [];

  for (let i = 0; i < pages.length; i++) {
    const [content] = await db
      .insert(lessonContent)
      .values({
        lessonId,
        moduleId: pages[i].moduleId || null,
        orderIndex: i,
        contentType: pages[i].contentType,
        contentData: pages[i].contentData,
        authorId,
        sources: [],
      })
      .returning();

    await db.insert(lessonContentEdits).values({
      lessonId,
      contentId: content.id,
      editorId: authorId,
      editType: 'create',
      previousData: null,
    });

    result.push(content);
  }

  await db
    .update(lessons)
    .set({ updatedAt: new Date() })
    .where(eq(lessons.id, lessonId));

  return result;
}

// ═══════════════════════════════════════════════════════
//  Permission check helper
// ═══════════════════════════════════════════════════════

export async function canUserEditLesson(lessonId: string, userId: string): Promise<boolean> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) return false;
  if (lesson.isOfficial) return false; // Official lessons are never editable
  if (lesson.authorId === userId) return true;
  if (lesson.editPolicy === 'open' && lesson.visibility === 'public') return true;
  return false;
}

// ═══════════════════════════════════════════════════════
//  CRUD: Lesson Modules
// ═══════════════════════════════════════════════════════

export async function createLessonModule(data: {
  lessonId: string;
  title: string;
  description?: string;
  userId: string;
}): Promise<LessonModule | null> {
  // Verify permission
  const canEdit = await canUserEditLesson(data.lessonId, data.userId);
  if (!canEdit) return null;

  // Get next order index
  const [maxOrder] = await db
    .select({ maxIdx: sql<number>`COALESCE(MAX(order_index), -1)` })
    .from(lessonModules)
    .where(eq(lessonModules.lessonId, data.lessonId));

  const nextIndex = Number(maxOrder?.maxIdx ?? -1) + 1;

  const [module] = await db
    .insert(lessonModules)
    .values({
      lessonId: data.lessonId,
      title: data.title,
      description: data.description || null,
      orderIndex: nextIndex,
    })
    .returning();

  await db
    .update(lessons)
    .set({ updatedAt: new Date() })
    .where(eq(lessons.id, data.lessonId));

  return module;
}

export async function updateLessonModule(
  moduleId: string,
  userId: string,
  data: { title?: string; description?: string }
): Promise<LessonModule | null> {
  const [module] = await db
    .select()
    .from(lessonModules)
    .where(eq(lessonModules.id, moduleId))
    .limit(1);

  if (!module) return null;

  const canEdit = await canUserEditLesson(module.lessonId, userId);
  if (!canEdit) return null;

  const [updated] = await db
    .update(lessonModules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(lessonModules.id, moduleId))
    .returning();

  await db
    .update(lessons)
    .set({ updatedAt: new Date() })
    .where(eq(lessons.id, module.lessonId));

  return updated;
}

export async function deleteLessonModule(moduleId: string, userId: string): Promise<boolean> {
  const [module] = await db
    .select()
    .from(lessonModules)
    .where(eq(lessonModules.id, moduleId))
    .limit(1);

  if (!module) return false;

  const canEdit = await canUserEditLesson(module.lessonId, userId);
  if (!canEdit) return false;

  await db.delete(lessonModules).where(eq(lessonModules.id, moduleId));

  await db
    .update(lessons)
    .set({ updatedAt: new Date() })
    .where(eq(lessons.id, module.lessonId));

  return true;
}

export async function reorderLessonModules(
  lessonId: string,
  userId: string,
  moduleIds: string[]
): Promise<boolean> {
  const canEdit = await canUserEditLesson(lessonId, userId);
  if (!canEdit) return false;

  for (let i = 0; i < moduleIds.length; i++) {
    await db
      .update(lessonModules)
      .set({ orderIndex: i })
      .where(
        and(
          eq(lessonModules.id, moduleIds[i]),
          eq(lessonModules.lessonId, lessonId)
        )
      );
  }

  await db
    .update(lessons)
    .set({ updatedAt: new Date() })
    .where(eq(lessons.id, lessonId));

  return true;
}

export async function getLessonModules(lessonId: string): Promise<LessonModule[]> {
  return db
    .select()
    .from(lessonModules)
    .where(eq(lessonModules.lessonId, lessonId))
    .orderBy(asc(lessonModules.orderIndex));
}

/**
 * Bulk-create modules and their content pages for a lesson (used by AI generation).
 */
export async function bulkInsertModulesWithContent(
  lessonId: string,
  authorId: string,
  modulesData: {
    title: string;
    description?: string;
    pages: { contentType: string; contentData: ContentData }[];
  }[]
): Promise<LessonModuleWithContent[]> {
  const result: LessonModuleWithContent[] = [];

  for (let mi = 0; mi < modulesData.length; mi++) {
    const modData = modulesData[mi];

    // Create the module
    const [module] = await db
      .insert(lessonModules)
      .values({
        lessonId,
        title: modData.title,
        description: modData.description || null,
        orderIndex: mi,
      })
      .returning();

    // Insert pages for this module
    const contentItems: LessonContent[] = [];
    for (let pi = 0; pi < modData.pages.length; pi++) {
      const [content] = await db
        .insert(lessonContent)
        .values({
          lessonId,
          moduleId: module.id,
          orderIndex: pi,
          contentType: modData.pages[pi].contentType,
          contentData: modData.pages[pi].contentData,
          authorId,
          sources: [],
        })
        .returning();

      await db.insert(lessonContentEdits).values({
        lessonId,
        contentId: content.id,
        editorId: authorId,
        editType: 'create',
        previousData: null,
      });

      contentItems.push(content);
    }

    result.push({ ...module, content: contentItems });
  }

  await db
    .update(lessons)
    .set({ updatedAt: new Date() })
    .where(eq(lessons.id, lessonId));

  return result;
}
