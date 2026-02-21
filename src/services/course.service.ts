import { db } from '../config/database';
import { 
  categories, 
  courses, 
  levels, 
  lessons, 
  lessonContent,
  type Category,
  type Course,
  type Level,
  type Lesson,
  type LessonContent
} from '../db/schema';
import { eq, asc } from 'drizzle-orm';

export interface CourseWithLevels extends Course {
  levels: LevelWithLessons[];
}

export interface LevelWithLessons extends Level {
  lessons: Lesson[];
}

export interface LessonWithContent extends Lesson {
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

  const content = await db
    .select()
    .from(lessonContent)
    .where(eq(lessonContent.lessonId, lessonId))
    .orderBy(asc(lessonContent.orderIndex));

  return { ...lesson, content };
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
