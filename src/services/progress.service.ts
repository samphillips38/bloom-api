import { db } from '../config/database';
import { userProgress, streaks, users, lessons, levels, type UserProgress, type Streak } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface ProgressUpdate {
  userId: string;
  lessonId: string;
  completed?: boolean;
  score?: number;
  lastPageIndex?: number;
}

export interface UserStats {
  streak: Streak | null;
  energy: number;
  completedLessons: number;
  totalScore: number;
}

// Get user's progress for a lesson
export async function getLessonProgress(
  userId: string, 
  lessonId: string
): Promise<UserProgress | null> {
  const [progress] = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.lessonId, lessonId)
      )
    )
    .limit(1);
  
  return progress || null;
}

// Get all progress for a user in a course
export async function getCourseProgress(
  userId: string, 
  courseId: string
): Promise<UserProgress[]> {
  const result = await db
    .select({
      progress: userProgress,
    })
    .from(userProgress)
    .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
    .innerJoin(levels, eq(lessons.levelId, levels.id))
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(levels.courseId, courseId)
      )
    );
  
  return result.map(r => r.progress);
}

// Update or create progress
export async function updateProgress(input: ProgressUpdate): Promise<UserProgress> {
  const { userId, lessonId, completed, score, lastPageIndex } = input;
  
  // Check if progress exists
  const existing = await getLessonProgress(userId, lessonId);
  
  if (existing) {
    const [updated] = await db
      .update(userProgress)
      .set({
        completed: completed ?? existing.completed,
        score: score ?? existing.score,
        lastPageIndex: lastPageIndex !== undefined ? lastPageIndex : existing.lastPageIndex,
        completedAt: completed ? new Date() : existing.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(userProgress.id, existing.id))
      .returning();
    
    if (completed) {
      await updateStreak(userId);
    }
    
    return updated;
  }
  
  // Create new progress
  const [created] = await db
    .insert(userProgress)
    .values({
      userId,
      lessonId,
      completed: completed ?? false,
      score: score ?? null,
      lastPageIndex: lastPageIndex ?? 0,
      completedAt: completed ? new Date() : null,
    })
    .returning();
  
  if (completed) {
    await updateStreak(userId);
  }
  
  return created;
}

// Lightweight page-progress save (upsert lastPageIndex without marking complete)
export async function savePageProgress(
  userId: string,
  lessonId: string,
  pageIndex: number,
): Promise<void> {
  const existing = await getLessonProgress(userId, lessonId);

  if (existing) {
    // Only move the index forward (don't regress if user navigated back)
    const newIndex = Math.max(existing.lastPageIndex ?? 0, pageIndex);
    await db
      .update(userProgress)
      .set({ lastPageIndex: newIndex, updatedAt: new Date() })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({
      userId,
      lessonId,
      completed: false,
      lastPageIndex: pageIndex,
    });
  }
}

// Update user streak
export async function updateStreak(userId: string): Promise<Streak> {
  const today = new Date().toISOString().split('T')[0];
  
  let [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1);
  
  if (!streak) {
    // Create new streak
    [streak] = await db
      .insert(streaks)
      .values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      })
      .returning();
    return streak;
  }
  
  const lastDate = streak.lastActivityDate;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastDate === today) {
    // Already updated today
    return streak;
  }
  
  let newStreak: number;
  if (lastDate === yesterdayStr) {
    // Continuing streak
    newStreak = streak.currentStreak + 1;
  } else {
    // Streak broken, start fresh
    newStreak = 1;
  }
  
  const longestStreak = Math.max(newStreak, streak.longestStreak);
  
  [streak] = await db
    .update(streaks)
    .set({
      currentStreak: newStreak,
      longestStreak,
      lastActivityDate: today,
      updatedAt: new Date(),
    })
    .where(eq(streaks.id, streak.id))
    .returning();
  
  return streak;
}

// Get user stats
export async function getUserStats(userId: string): Promise<UserStats> {
  const [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1);
  
  const [user] = await db
    .select({ energy: users.energy })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  const [stats] = await db
    .select({
      completedLessons: sql<number>`count(*)::int`.as('completed_lessons'),
      totalScore: sql<number>`coalesce(sum(${userProgress.score}), 0)::int`.as('total_score'),
    })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, true)
      )
    );
  
  return {
    streak: streak || null,
    energy: user?.energy ?? 5,
    completedLessons: stats?.completedLessons ?? 0,
    totalScore: stats?.totalScore ?? 0,
  };
}

// Consume energy
export async function consumeEnergy(userId: string, amount: number = 1): Promise<number> {
  const [user] = await db
    .update(users)
    .set({
      energy: sql`GREATEST(${users.energy} - ${amount}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ energy: users.energy });
  
  return user?.energy ?? 0;
}

// Restore energy (for premium or daily reset)
export async function restoreEnergy(userId: string, amount: number = 5): Promise<number> {
  const [user] = await db
    .update(users)
    .set({
      energy: amount,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ energy: users.energy });
  
  return user?.energy ?? amount;
}
