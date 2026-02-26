import { db } from '../config/database';
import {
  userLibrary,
  userProgress,
  lessons,
  courses,
  levels,
  lessonModules,
  lessonContent,
} from '../db/schema';
import { eq, and, isNull, isNotNull, sql, max } from 'drizzle-orm';

export interface LibraryItem {
  id: string;
  type: 'lesson' | 'course';
  // Course fields
  courseId?: string;
  courseTitle?: string;
  courseDescription?: string;
  courseThemeColor?: string;
  courseLessonCount?: number;
  // Lesson fields
  lessonId?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  lessonThemeColor?: string;
  lessonPageCount?: number;
  lessonAuthorName?: string;
  lessonTags?: string[];
  // Progress
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  isCompleted: boolean;
  // Metadata
  savedAt: string;
  lastActivityAt?: string;
}

export async function getLibrary(userId: string): Promise<LibraryItem[]> {
  // Fetch all library entries for the user
  const entries = await db
    .select()
    .from(userLibrary)
    .where(eq(userLibrary.userId, userId))
    .orderBy(userLibrary.savedAt);

  const items: LibraryItem[] = [];

  for (const entry of entries) {
    if (entry.courseId) {
      // ── Official course item ──
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, entry.courseId))
        .limit(1);

      if (!course) continue;

      // Count total lessons in the course
      const totalLessonsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(lessons)
        .innerJoin(levels, eq(lessons.levelId, levels.id))
        .where(eq(levels.courseId, entry.courseId));
      const totalCount = totalLessonsResult[0]?.count ?? 0;

      // Count completed lessons
      const completedResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(userProgress)
        .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
        .innerJoin(levels, eq(lessons.levelId, levels.id))
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(levels.courseId, entry.courseId),
            eq(userProgress.completed, true)
          )
        );
      const completedCount = completedResult[0]?.count ?? 0;

      // Last activity timestamp
      const lastActivityResult = await db
        .select({ lastAt: max(userProgress.updatedAt) })
        .from(userProgress)
        .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
        .innerJoin(levels, eq(lessons.levelId, levels.id))
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(levels.courseId, entry.courseId)
          )
        );
      const lastActivityAt = lastActivityResult[0]?.lastAt ?? undefined;

      const progressPercent = totalCount > 0
        ? Math.round((completedCount / totalCount) * 100)
        : 0;

      items.push({
        id: entry.id,
        type: 'course',
        courseId: entry.courseId,
        courseTitle: course.title,
        courseDescription: course.description ?? undefined,
        courseThemeColor: course.themeColor ?? '#FF6B35',
        courseLessonCount: totalCount,
        progressPercent,
        completedCount,
        totalCount,
        isCompleted: totalCount > 0 && completedCount >= totalCount,
        savedAt: entry.savedAt.toISOString(),
        lastActivityAt: lastActivityAt ? (lastActivityAt as Date).toISOString() : undefined,
      });
    } else if (entry.lessonId) {
      // ── Standalone lesson item ──
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, entry.lessonId))
        .limit(1);

      if (!lesson) continue;

      // Count total pages (lesson_content rows)
      const pagesResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(lessonContent)
        .where(eq(lessonContent.lessonId, entry.lessonId));
      const totalCount = pagesResult[0]?.count ?? 0;

      // For standalone lessons, progress is often tracked in localStorage on the client,
      // but we also check user_progress for completion
      const [progress] = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.lessonId, entry.lessonId)
          )
        )
        .limit(1);

      const completedCount = progress?.completed ? totalCount : 0;
      const progressPercent = progress?.completed ? 100 : 0;
      const lastActivityAt = progress?.updatedAt ?? undefined;

      items.push({
        id: entry.id,
        type: 'lesson',
        lessonId: entry.lessonId,
        lessonTitle: lesson.title,
        lessonDescription: lesson.description ?? undefined,
        lessonThemeColor: lesson.themeColor ?? '#FF6B35',
        lessonPageCount: totalCount,
        lessonTags: (lesson.tags as string[]) ?? [],
        progressPercent,
        completedCount,
        totalCount,
        isCompleted: progress?.completed ?? false,
        savedAt: entry.savedAt.toISOString(),
        lastActivityAt: lastActivityAt ? (lastActivityAt as Date).toISOString() : undefined,
      });
    }
  }

  return items;
}

export async function addCourseToLibrary(userId: string, courseId: string): Promise<void> {
  // Upsert — ignore if already exists
  await db
    .insert(userLibrary)
    .values({ userId, courseId, lessonId: null })
    .onConflictDoNothing();
}

export async function removeCourseFromLibrary(userId: string, courseId: string): Promise<void> {
  await db
    .delete(userLibrary)
    .where(
      and(
        eq(userLibrary.userId, userId),
        eq(userLibrary.courseId, courseId)
      )
    );
}

export async function addLessonToLibrary(userId: string, lessonId: string): Promise<void> {
  await db
    .insert(userLibrary)
    .values({ userId, lessonId, courseId: null })
    .onConflictDoNothing();
}

export async function removeLessonFromLibrary(userId: string, lessonId: string): Promise<void> {
  await db
    .delete(userLibrary)
    .where(
      and(
        eq(userLibrary.userId, userId),
        eq(userLibrary.lessonId, lessonId)
      )
    );
}

export async function isInLibrary(
  userId: string,
  opts: { courseId?: string; lessonId?: string }
): Promise<boolean> {
  const conditions = [eq(userLibrary.userId, userId)];
  if (opts.courseId) conditions.push(eq(userLibrary.courseId, opts.courseId));
  if (opts.lessonId) conditions.push(eq(userLibrary.lessonId, opts.lessonId));

  const [row] = await db
    .select({ id: userLibrary.id })
    .from(userLibrary)
    .where(and(...conditions))
    .limit(1);

  return !!row;
}
