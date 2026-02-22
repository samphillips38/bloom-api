import { db } from '../config/database';
import { 
  categories, 
  courses, 
  levels, 
  lessons, 
  lessonContent,
  lessonModules,
  type Category,
  type Course,
  type Level,
  type Lesson,
  type LessonModule,
  type LessonContent,
  type SourceReference,
} from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import type { ContentPageMetadata, LessonMetadata } from './workshop.service';

export interface CourseWithLevels extends Course {
  levels: LevelWithLessons[];
}

export interface LevelWithLessons extends Level {
  lessons: Lesson[];
}

export interface LessonModuleWithContent extends LessonModule {
  content: LessonContent[];
}

export interface LessonWithContent extends Lesson {
  modules: LessonModuleWithContent[];
  content: LessonContent[];
}

// Categories
export async function getAllCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.orderIndex));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return category || null;
}

// Courses
export async function getAllCourses(): Promise<Course[]> {
  return db
    .select()
    .from(courses)
    .orderBy(asc(courses.orderIndex));
}

export async function getCoursesByCategory(categoryId: string): Promise<Course[]> {
  return db
    .select()
    .from(courses)
    .where(eq(courses.categoryId, categoryId))
    .orderBy(asc(courses.orderIndex));
}

export async function getRecommendedCourses(): Promise<Course[]> {
  return db
    .select()
    .from(courses)
    .where(eq(courses.isRecommended, true))
    .orderBy(asc(courses.orderIndex));
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  return course || null;
}

export async function getCourseWithLevels(courseId: string): Promise<CourseWithLevels | null> {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) return null;

  const courseLevels = await db
    .select()
    .from(levels)
    .where(eq(levels.courseId, courseId))
    .orderBy(asc(levels.orderIndex));

  const levelsWithLessons: LevelWithLessons[] = await Promise.all(
    courseLevels.map(async (level) => {
      const levelLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.levelId, level.id))
        .orderBy(asc(lessons.orderIndex));
      
      return { ...level, lessons: levelLessons };
    })
  );

  return { ...course, levels: levelsWithLessons };
}

// Lessons
export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);
  return lesson || null;
}

export async function getLessonWithContent(lessonId: string): Promise<LessonWithContent | null> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) return null;

  // Fetch modules for this lesson
  const modules = await db
    .select()
    .from(lessonModules)
    .where(eq(lessonModules.lessonId, lessonId))
    .orderBy(asc(lessonModules.orderIndex));

  // Fetch all content for this lesson
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

  return { ...lesson, modules: modulesWithContent, content };
}

export async function getLessonsByLevel(levelId: string): Promise<Lesson[]> {
  return db
    .select()
    .from(lessons)
    .where(eq(lessons.levelId, levelId))
    .orderBy(asc(lessons.orderIndex));
}

// Content
export async function getLessonContent(lessonId: string): Promise<LessonContent[]> {
  return db
    .select()
    .from(lessonContent)
    .where(eq(lessonContent.lessonId, lessonId))
    .orderBy(asc(lessonContent.orderIndex));
}

// ═══════════════════════════════════════════════════════
//  Lesson Metadata (for course lessons — uses unified schema)
// ═══════════════════════════════════════════════════════

export async function getLessonMetadata(lessonId: string): Promise<LessonMetadata | null> {
  // Get the lesson
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) return null;

  // Walk up to get the course (lesson → level → course)
  let courseName = 'Bloom Team';
  let aiInvolvement = lesson.aiInvolvement || 'full';
  let courseCreatedAt = lesson.createdAt;

  if (lesson.levelId) {
    const [level] = await db
      .select()
      .from(levels)
      .where(eq(levels.id, lesson.levelId))
      .limit(1);

    if (level) {
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, level.courseId))
        .limit(1);

      if (course) {
        courseName = course.creatorName || 'Bloom Team';
        aiInvolvement = course.aiInvolvement || 'full';
        courseCreatedAt = course.createdAt;
      }
    }
  }

  // Get modules for this lesson
  const modules = await db
    .select()
    .from(lessonModules)
    .where(eq(lessonModules.lessonId, lessonId))
    .orderBy(asc(lessonModules.orderIndex));

  // Get all content pages for this lesson
  const contentPages = await db
    .select()
    .from(lessonContent)
    .where(eq(lessonContent.lessonId, lessonId))
    .orderBy(asc(lessonContent.orderIndex));

  const pages: ContentPageMetadata[] = contentPages.map(page => ({
    contentId: page.id,
    moduleId: page.moduleId,
    authorName: courseName,
    authorAvatarUrl: null,
    sources: (page.sources as SourceReference[]) || [],
    lastEdited: page.createdAt,
    editors: [],
  }));

  return {
    lesson: {
      authorName: courseName,
      authorAvatarUrl: null,
      totalEdits: 0,
      createdAt: courseCreatedAt,
      updatedAt: courseCreatedAt,
      aiInvolvement,
    },
    modules: modules.map(m => ({ id: m.id, title: m.title, description: m.description })),
    pages,
  };
}
