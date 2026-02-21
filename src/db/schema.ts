import { pgTable, uuid, varchar, text, integer, boolean, timestamp, date, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ USERS ============
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  energy: integer('energy').notNull().default(5),
  provider: varchar('provider', { length: 50 }).default('email'), // email, google, apple
  providerId: varchar('provider_id', { length: 255 }),
  isPremium: boolean('is_premium').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  progress: many(userProgress),
  streak: one(streaks),
}));

// ============ STREAKS ============
export const streaks = pgTable('streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActivityDate: date('last_activity_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}));

// ============ CATEGORIES ============
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  iconUrl: text('icon_url'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

// ============ COURSES ============
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  themeColor: varchar('theme_color', { length: 7 }).default('#FF6B35'), // hex color
  lessonCount: integer('lesson_count').notNull().default(0),
  exerciseCount: integer('exercise_count').notNull().default(0),
  isRecommended: boolean('is_recommended').notNull().default(false),
  collaborators: jsonb('collaborators').$type<string[]>().default([]),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  levels: many(levels),
}));

// ============ LEVELS ============
export const levels = pgTable('levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const levelsRelations = relations(levels, ({ one, many }) => ({
  course: one(courses, {
    fields: [levels.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

// ============ LESSONS ============
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  levelId: uuid('level_id').notNull().references(() => levels.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  iconUrl: text('icon_url'),
  type: varchar('type', { length: 50 }).notNull().default('lesson'), // lesson, exercise, quiz
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  level: one(levels, {
    fields: [lessons.levelId],
    references: [levels.id],
  }),
  content: many(lessonContent),
  progress: many(userProgress),
}));

// ============ LESSON CONTENT ============
export const lessonContent = pgTable('lesson_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull().default(0),
  contentType: varchar('content_type', { length: 50 }).notNull(), // text, image, interactive, question
  contentData: jsonb('content_data').notNull().$type<ContentData>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lessonContentRelations = relations(lessonContent, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonContent.lessonId],
    references: [lessons.id],
  }),
}));

// Content data types
export type ContentData = 
  | { type: 'text'; text: string; formatting?: { bold?: boolean; superscript?: boolean } }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'interactive'; componentId: string; props?: Record<string, unknown> }
  | { type: 'question'; question: string; options: string[]; correctIndex: number; explanation?: string };

// ============ USER PROGRESS ============
export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  completed: boolean('completed').notNull().default(false),
  score: integer('score'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [userProgress.lessonId],
    references: [lessons.id],
  }),
}));

// ============ TYPE EXPORTS ============
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Level = typeof levels.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type LessonContent = typeof lessonContent.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type Streak = typeof streaks.$inferSelect;
export type Category = typeof categories.$inferSelect;
