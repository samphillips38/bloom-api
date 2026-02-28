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
  energyUpdatedAt: timestamp('energy_updated_at'),           // null = at max capacity
  xp: integer('xp').notNull().default(0),                   // total lifetime XP
  dailyGoal: integer('daily_goal').notNull().default(1),     // lessons per day
  streakFreezes: integer('streak_freezes').notNull().default(1), // available freeze tokens
  provider: varchar('provider', { length: 50 }).default('email'), // email, google, apple
  providerId: varchar('provider_id', { length: 255 }),
  isPremium: boolean('is_premium').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  progress: many(userProgress),
  streak: one(streaks),
  lessons: many(lessons),
}));

// ============ STREAKS ============
export const streaks = pgTable('streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActivityDate: date('last_activity_date'),
  streakFreezeUsedDate: date('streak_freeze_used_date'),     // last date a freeze was consumed
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
  creatorName: varchar('creator_name', { length: 255 }).default('Bloom Team'),
  aiInvolvement: varchar('ai_involvement', { length: 20 }).default('full'), // 'none' | 'collaboration' | 'full'
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

// ============ LESSONS (Unified — official + user-created) ============
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  // For official lessons (part of a course → level hierarchy)
  levelId: uuid('level_id').references(() => levels.id, { onDelete: 'cascade' }),
  // For user-created lessons
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  themeColor: varchar('theme_color', { length: 7 }).default('#FF6B35'),
  type: varchar('type', { length: 50 }).notNull().default('lesson'), // lesson, exercise, quiz
  orderIndex: integer('order_index').notNull().default(0),
  // Official vs user-created
  isOfficial: boolean('is_official').notNull().default(false),
  // Publishing & visibility (user-created lessons)
  visibility: varchar('visibility', { length: 20 }).notNull().default('private'), // 'private' | 'public'
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft' | 'published'
  editPolicy: varchar('edit_policy', { length: 20 }).notNull().default('approval'), // 'open' | 'approval'
  aiInvolvement: varchar('ai_involvement', { length: 20 }).notNull().default('none'), // 'none' | 'collaboration' | 'full'
  tags: jsonb('tags').$type<string[]>().default([]),
  // Rating & engagement
  ratingSum: integer('rating_sum').notNull().default(0),
  ratingCount: integer('rating_count').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  isPromoted: boolean('is_promoted').notNull().default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  level: one(levels, {
    fields: [lessons.levelId],
    references: [levels.id],
  }),
  author: one(users, {
    fields: [lessons.authorId],
    references: [users.id],
  }),
  modules: many(lessonModules),
  content: many(lessonContent),
  progress: many(userProgress),
  edits: many(lessonContentEdits),
  suggestions: many(lessonEditSuggestions),
  prerequisites: many(lessonPrerequisites, { relationName: 'lessonRequires' }),
  requiredBy: many(lessonPrerequisites, { relationName: 'lessonIsPrerequisiteFor' }),
}));

// ============ LESSON MODULES ============
export const lessonModules = pgTable('lesson_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull().default(0),
  sources: jsonb('sources').$type<SourceReference[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessonModulesRelations = relations(lessonModules, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [lessonModules.lessonId],
    references: [lessons.id],
  }),
  content: many(lessonContent),
}));

// ============ LESSON CONTENT ============
export interface SourceReference {
  title: string;
  url?: string;
  description?: string;
}

export const lessonContent = pgTable('lesson_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').references(() => lessonModules.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull().default(0),
  contentType: varchar('content_type', { length: 50 }).notNull(), // text, image, interactive, question
  contentData: jsonb('content_data').notNull().$type<ContentData>(),
  authorId: uuid('author_id').references(() => users.id),
  sources: jsonb('sources').$type<SourceReference[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessonContentRelations = relations(lessonContent, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [lessonContent.lessonId],
    references: [lessons.id],
  }),
  module: one(lessonModules, {
    fields: [lessonContent.moduleId],
    references: [lessonModules.id],
  }),
  author: one(users, {
    fields: [lessonContent.authorId],
    references: [users.id],
  }),
  edits: many(lessonContentEdits),
}));

// ============ RICH CONTENT DATA TYPES ============

// Inline text segment — the atomic unit of rich text
export interface TextSegment {
  text: string
  bold?: boolean
  italic?: boolean
  color?: 'accent' | 'secondary' | 'success' | 'warning' | 'blue' | 'purple'
  underline?: boolean
  definition?: string            // tappable definition popover
  latex?: boolean                // render this segment as inline LaTeX
}

// Block types that make up a lesson page
export type ContentBlock =
  | { type: 'heading'; segments: TextSegment[]; level?: 1 | 2 | 3 }
  | { type: 'paragraph'; segments: TextSegment[] }
  | { type: 'image'; src: string; alt?: string; caption?: string; style?: 'full' | 'inline' | 'icon' }
  | { type: 'math'; latex: string; caption?: string }             // block-level LaTeX
  | { type: 'callout'; style: 'info' | 'tip' | 'warning' | 'example'; title?: string; segments: TextSegment[] }
  | { type: 'bulletList'; items: TextSegment[][] }                 // each item is an array of segments
  | { type: 'animation'; src: string; autoplay?: boolean; loop?: boolean; caption?: string }
  | { type: 'interactive'; componentId: string; props?: Record<string, unknown> }
  | { type: 'spacer'; size?: 'sm' | 'md' | 'lg' }
  | { type: 'divider' }

// Question format variants for the quiz section
export type QuestionFormat =
  | 'multiple-choice'   // tap one correct answer (default)
  | 'true-false'        // Yes / No binary choice
  | 'multi-select'      // select all that apply
  | 'fill-blank'        // type the answer as text
  | 'word-arrange'      // tap shuffled word chips in the correct order

// Top-level content data for a lesson content entry
export type ContentData =
  // NEW: rich page with multiple blocks
  | { type: 'page'; blocks: ContentBlock[] }
  // Questions stay as a dedicated type — format defaults to 'multiple-choice'
  | { type: 'question'; format?: QuestionFormat; question: string; questionSegments?: TextSegment[]; options: string[]; optionSegments?: TextSegment[][]; correctIndex: number; correctIndices?: number[]; correctAnswer?: string; explanation?: string; explanationSegments?: TextSegment[] }
  // LEGACY: keep old types for backward compatibility
  | { type: 'text'; text: string; formatting?: { bold?: boolean; superscript?: boolean } }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'interactive'; componentId: string; props?: Record<string, unknown> };

// ============ LESSON PREREQUISITES ============
export const lessonPrerequisites = pgTable('lesson_prerequisites', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  prerequisiteLessonId: uuid('prerequisite_lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lessonPrerequisitesRelations = relations(lessonPrerequisites, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonPrerequisites.lessonId],
    references: [lessons.id],
    relationName: 'lessonRequires',
  }),
  prerequisite: one(lessons, {
    fields: [lessonPrerequisites.prerequisiteLessonId],
    references: [lessons.id],
    relationName: 'lessonIsPrerequisiteFor',
  }),
}));

// ============ USER PROGRESS ============
export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  completed: boolean('completed').notNull().default(false),
  score: integer('score'),
  lastPageIndex: integer('last_page_index').default(0),
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

// ============ LESSON CONTENT EDITS (History) ============
export const lessonContentEdits = pgTable('lesson_content_edits', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').references(() => lessonContent.id, { onDelete: 'set null' }),
  editorId: uuid('editor_id').notNull().references(() => users.id),
  editType: varchar('edit_type', { length: 20 }).notNull(), // 'create' | 'update' | 'reorder' | 'delete'
  previousData: jsonb('previous_data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lessonContentEditsRelations = relations(lessonContentEdits, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonContentEdits.lessonId],
    references: [lessons.id],
  }),
  content: one(lessonContent, {
    fields: [lessonContentEdits.contentId],
    references: [lessonContent.id],
  }),
  editor: one(users, {
    fields: [lessonContentEdits.editorId],
    references: [users.id],
  }),
}));

// ============ LESSON EDIT SUGGESTIONS ============
export const lessonEditSuggestions = pgTable('lesson_edit_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').references(() => lessonContent.id, { onDelete: 'set null' }),
  suggesterId: uuid('suggester_id').notNull().references(() => users.id),
  suggestedData: jsonb('suggested_data').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  reviewerId: uuid('reviewer_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lessonEditSuggestionsRelations = relations(lessonEditSuggestions, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonEditSuggestions.lessonId],
    references: [lessons.id],
  }),
  content: one(lessonContent, {
    fields: [lessonEditSuggestions.contentId],
    references: [lessonContent.id],
  }),
  suggester: one(users, {
    fields: [lessonEditSuggestions.suggesterId],
    references: [users.id],
    relationName: 'suggester',
  }),
  reviewer: one(users, {
    fields: [lessonEditSuggestions.reviewerId],
    references: [users.id],
    relationName: 'reviewer',
  }),
}));

// ============ LESSON RATINGS ============
export const lessonRatings = pgTable('lesson_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lessonRatingsRelations = relations(lessonRatings, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonRatings.lessonId],
    references: [lessons.id],
  }),
  user: one(users, {
    fields: [lessonRatings.userId],
    references: [users.id],
  }),
}));

// ============ USER LIBRARY ============
export const userLibrary = pgTable('user_library', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // One of these will be set (not both)
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  savedAt: timestamp('saved_at').notNull().defaultNow(),
});

export const userLibraryRelations = relations(userLibrary, ({ one }) => ({
  user: one(users, {
    fields: [userLibrary.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [userLibrary.lessonId],
    references: [lessons.id],
  }),
  course: one(courses, {
    fields: [userLibrary.courseId],
    references: [courses.id],
  }),
}));

// ============ REFRESH TOKENS ============
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  revokedAt: timestamp('revoked_at'),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

// ============ LESSON GENERATION JOBS ============
export const lessonGenerationJobs = pgTable('lesson_generation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | searching | planning | reviewing | generating | completed | failed
  totalModules: integer('total_modules').notNull().default(0),
  completedModules: integer('completed_modules').notNull().default(0),
  currentModuleTitle: varchar('current_module_title', { length: 255 }),
  sourceType: varchar('source_type', { length: 20 }).notNull().default('topic'), // topic | url | pdf
  discoveredSources: jsonb('discovered_sources').$type<SourceReference[]>().default([]),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessonGenerationJobsRelations = relations(lessonGenerationJobs, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonGenerationJobs.lessonId],
    references: [lessons.id],
  }),
  user: one(users, {
    fields: [lessonGenerationJobs.userId],
    references: [users.id],
  }),
}));

// ============ USER ACHIEVEMENTS ============
export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: varchar('achievement_id', { length: 50 }).notNull(),
  earnedAt: timestamp('earned_at').notNull().defaultNow(),
});

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

// ============ TYPE EXPORTS ============
export type UserLibrary = typeof userLibrary.$inferSelect;
export type NewUserLibrary = typeof userLibrary.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Level = typeof levels.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type LessonModule = typeof lessonModules.$inferSelect;
export type LessonContent = typeof lessonContent.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type Streak = typeof streaks.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type LessonContentEdit = typeof lessonContentEdits.$inferSelect;
export type LessonEditSuggestion = typeof lessonEditSuggestions.$inferSelect;
export type LessonRating = typeof lessonRatings.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type LessonGenerationJob = typeof lessonGenerationJobs.$inferSelect;
export type NewLessonGenerationJob = typeof lessonGenerationJobs.$inferInsert;
export type LessonPrerequisite = typeof lessonPrerequisites.$inferSelect;
export type NewLessonPrerequisite = typeof lessonPrerequisites.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;