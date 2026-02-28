import { db } from '../config/database';
import {
  userProgress, streaks, users, lessons, levels, userAchievements,
  type UserProgress, type Streak,
} from '../db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_ENERGY = 5;
const ENERGY_REFILL_INTERVAL_MS = 60 * 60 * 1000; // 1 heart / hour
const XP_PER_LESSON_BASE = 10;
const XP_PER_LEVEL = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Achievement definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xpBonus: number;
}

export const ACHIEVEMENT_DEFS: Record<string, AchievementDef> = {
  first_bloom:  { id: 'first_bloom',  title: 'First Bloom',   description: 'Complete your first lesson',    emoji: '🌱', xpBonus: 20  },
  streak_3:     { id: 'streak_3',     title: 'Warming Up',    description: 'Reach a 3-day streak',          emoji: '🔥', xpBonus: 30  },
  streak_7:     { id: 'streak_7',     title: 'On Fire',       description: 'Reach a 7-day streak',          emoji: '🔥', xpBonus: 70  },
  streak_14:    { id: 'streak_14',    title: 'Blazing',       description: 'Reach a 14-day streak',         emoji: '⚡', xpBonus: 140 },
  streak_30:    { id: 'streak_30',    title: 'Dedicated',     description: 'Reach a 30-day streak',         emoji: '💪', xpBonus: 300 },
  streak_100:   { id: 'streak_100',   title: 'Legend',        description: 'Reach a 100-day streak',        emoji: '🏆', xpBonus: 1000},
  lessons_10:   { id: 'lessons_10',   title: 'Scholar',       description: 'Complete 10 lessons',           emoji: '📚', xpBonus: 100 },
  lessons_50:   { id: 'lessons_50',   title: 'Expert',        description: 'Complete 50 lessons',           emoji: '🎓', xpBonus: 500 },
  lessons_100:  { id: 'lessons_100',  title: 'Master',        description: 'Complete 100 lessons',          emoji: '🌟', xpBonus: 1000},
  perfect_score:{ id: 'perfect_score',title: 'Perfectionist', description: 'Get 100% on a quiz',           emoji: '⭐', xpBonus: 50  },
  level_5:      { id: 'level_5',      title: 'Apprentice',    description: 'Reach level 5',                 emoji: '📈', xpBonus: 0   },
  level_10:     { id: 'level_10',     title: 'Journeyman',    description: 'Reach level 10',                emoji: '🚀', xpBonus: 0   },
  level_20:     { id: 'level_20',     title: 'Expert Learner',description: 'Reach level 20',                emoji: '🌠', xpBonus: 0   },
  daily_3:      { id: 'daily_3',      title: 'Power Session', description: 'Complete 3 lessons in one day', emoji: '💥', xpBonus: 30  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function computeLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForNextLevel(xp: number): number {
  const level = computeLevel(xp);
  return level * XP_PER_LEVEL;
}

export function xpForCurrentLevel(xp: number): number {
  const level = computeLevel(xp);
  return (level - 1) * XP_PER_LEVEL;
}

/** Computes current energy accounting for hourly refills since last change. */
export function computeCurrentEnergy(storedEnergy: number, energyUpdatedAt: Date | null): number {
  if (storedEnergy >= MAX_ENERGY) return MAX_ENERGY;
  if (!energyUpdatedAt) return storedEnergy;
  const hoursElapsed = Math.floor((Date.now() - energyUpdatedAt.getTime()) / ENERGY_REFILL_INTERVAL_MS);
  return Math.min(MAX_ENERGY, storedEnergy + hoursElapsed);
}

/** Returns milliseconds until the next energy refill (0 if already at max). */
export function msUntilNextRefill(storedEnergy: number, energyUpdatedAt: Date | null): number {
  if (storedEnergy >= MAX_ENERGY || !energyUpdatedAt) return 0;
  const elapsed = Date.now() - energyUpdatedAt.getTime();
  const msPerRefill = ENERGY_REFILL_INTERVAL_MS;
  const msUntilNext = msPerRefill - (elapsed % msPerRefill);
  return msUntilNext;
}

function xpBonus(score: number | null | undefined): number {
  if (score == null) return 0;
  // 0-100 score → 0-5 bonus XP
  return Math.floor(score / 20);
}

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressUpdate {
  userId: string;
  lessonId: string;
  completed?: boolean;
  score?: number;
  lastPageIndex?: number;
}

export interface EarnedAchievement extends AchievementDef {
  earnedAt: string;
}

export interface UserStats {
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    streakFreezeUsedDate: string | null;
  } | null;
  energy: number;
  energyMax: number;
  msUntilNextEnergyRefill: number;
  streakFreezes: number;
  completedLessons: number;
  totalScore: number;
  xp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  dailyGoal: number;
  dailyProgress: number;
  achievements: EarnedAchievement[];
}

export interface LessonCompleteResult {
  progress: UserProgress;
  xpEarned: number;
  xpBonusFromAchievements: number;
  newXp: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newStreak: number;
  streakMilestone: number | null;
  newAchievements: AchievementDef[];
  usedStreakFreeze: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson Progress
// ─────────────────────────────────────────────────────────────────────────────

export async function getLessonProgress(
  userId: string,
  lessonId: string,
): Promise<UserProgress | null> {
  const [progress] = await db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.lessonId, lessonId)))
    .limit(1);
  return progress || null;
}

export async function getCourseProgress(
  userId: string,
  courseId: string,
): Promise<UserProgress[]> {
  const result = await db
    .select({ progress: userProgress })
    .from(userProgress)
    .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
    .innerJoin(levels, eq(lessons.levelId, levels.id))
    .where(and(eq(userProgress.userId, userId), eq(levels.courseId, courseId)));
  return result.map(r => r.progress);
}

export async function savePageProgress(
  userId: string,
  lessonId: string,
  pageIndex: number,
): Promise<void> {
  const existing = await getLessonProgress(userId, lessonId);
  if (existing) {
    const newIndex = Math.max(existing.lastPageIndex ?? 0, pageIndex);
    await db
      .update(userProgress)
      .set({ lastPageIndex: newIndex, updatedAt: new Date() })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({ userId, lessonId, completed: false, lastPageIndex: pageIndex });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: Update Progress (lesson completion with full gamification)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProgress(input: ProgressUpdate): Promise<LessonCompleteResult | UserProgress> {
  const { userId, lessonId, completed, score, lastPageIndex } = input;

  const existing = await getLessonProgress(userId, lessonId);
  let progress: UserProgress;

  if (existing) {
    const wasAlreadyCompleted = existing.completed;
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
    progress = updated;

    // Only award gamification rewards on first completion
    if (completed && !wasAlreadyCompleted) {
      return applyLessonCompletion(userId, progress, score ?? null);
    }
    return progress;
  }

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
  progress = created;

  if (completed) {
    return applyLessonCompletion(userId, progress, score ?? null);
  }
  return progress;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gamification: Apply all rewards on lesson completion
// ─────────────────────────────────────────────────────────────────────────────

async function applyLessonCompletion(
  userId: string,
  progress: UserProgress,
  score: number | null,
): Promise<LessonCompleteResult> {
  // 1. Fetch current user state
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const oldXp = user?.xp ?? 0;
  const oldLevel = computeLevel(oldXp);

  // 2. Award base + score bonus XP
  const earned = XP_PER_LESSON_BASE + xpBonus(score);
  const tentativeXp = oldXp + earned;
  const tentativeLevel = computeLevel(tentativeXp);

  // 3. Update streak
  const { streak, streakResult, usedFreeze } = await updateStreakInternal(userId, user?.streakFreezes ?? 1);

  // 4. Count total completed lessons (including this one)
  const [statsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)));
  const completedCount = statsRow?.count ?? 1;

  // 5. Count lessons completed today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [todayRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, true),
        gte(userProgress.completedAt, todayStart),
      ),
    );
  const todayCount = todayRow?.count ?? 1;

  // 6. Check which achievements were already earned
  const existingAchievements = await db
    .select({ achievementId: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  const earned_ids = new Set(existingAchievements.map(a => a.achievementId));

  // 7. Determine new achievements
  const newAchievementIds: string[] = [];

  const streakVal = streak?.currentStreak ?? 0;
  const checkAch = (id: string, condition: boolean) => {
    if (condition && !earned_ids.has(id)) newAchievementIds.push(id);
  };

  checkAch('first_bloom',   completedCount >= 1);
  checkAch('streak_3',      streakVal >= 3);
  checkAch('streak_7',      streakVal >= 7);
  checkAch('streak_14',     streakVal >= 14);
  checkAch('streak_30',     streakVal >= 30);
  checkAch('streak_100',    streakVal >= 100);
  checkAch('lessons_10',    completedCount >= 10);
  checkAch('lessons_50',    completedCount >= 50);
  checkAch('lessons_100',   completedCount >= 100);
  checkAch('perfect_score', score != null && score >= 100);
  checkAch('level_5',       tentativeLevel >= 5);
  checkAch('level_10',      tentativeLevel >= 10);
  checkAch('level_20',      tentativeLevel >= 20);
  checkAch('daily_3',       todayCount >= 3);

  // 8. Calculate bonus XP from achievements
  let achXpBonus = 0;
  const newAchievementDefs: AchievementDef[] = [];
  for (const id of newAchievementIds) {
    const def = ACHIEVEMENT_DEFS[id];
    if (def) {
      achXpBonus += def.xpBonus;
      newAchievementDefs.push(def);
    }
  }

  // 9. Final XP
  const finalXp = tentativeXp + achXpBonus;
  const finalLevel = computeLevel(finalXp);
  const leveledUp = finalLevel > oldLevel;

  // 10. Determine streak milestone
  const MILESTONES = [3, 7, 14, 30, 50, 100, 365];
  const streakMilestone = MILESTONES.includes(streakVal) ? streakVal : null;

  // 11. Persist: XP update, achievement records
  await db
    .update(users)
    .set({ xp: finalXp, updatedAt: new Date() })
    .where(eq(users.id, userId));

  if (newAchievementIds.length > 0) {
    await db.insert(userAchievements).values(
      newAchievementIds.map(id => ({ userId, achievementId: id })),
    );
  }

  return {
    progress,
    xpEarned: earned,
    xpBonusFromAchievements: achXpBonus,
    newXp: finalXp,
    oldLevel,
    newLevel: finalLevel,
    leveledUp,
    newStreak: streakVal,
    streakMilestone,
    newAchievements: newAchievementDefs,
    usedStreakFreeze: usedFreeze,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Streak
// ─────────────────────────────────────────────────────────────────────────────

async function updateStreakInternal(userId: string, availableFreezes: number) {
  const today = new Date().toISOString().split('T')[0];

  let [streak] = await db.select().from(streaks).where(eq(streaks.userId, userId)).limit(1);

  if (!streak) {
    [streak] = await db
      .insert(streaks)
      .values({ userId, currentStreak: 1, longestStreak: 1, lastActivityDate: today })
      .returning();
    return { streak, streakResult: 'new', usedFreeze: false };
  }

  const lastDate = streak.lastActivityDate;
  if (lastDate === today) {
    // Already counted today
    return { streak, streakResult: 'already', usedFreeze: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreakVal: number;
  let usedFreeze = false;

  if (lastDate === yesterdayStr) {
    // Consecutive day — extend streak
    newStreakVal = streak.currentStreak + 1;
  } else {
    // Gap: check if a freeze can bridge it (last activity was 2 days ago and freeze not yet used today)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const freezeUsed = streak.streakFreezeUsedDate;
    const canUseFreeze =
      availableFreezes > 0 &&
      lastDate === twoDaysAgoStr &&
      freezeUsed !== yesterdayStr; // didn't already burn a freeze for yesterday

    if (canUseFreeze) {
      // Extend streak as if they practiced yesterday
      newStreakVal = streak.currentStreak + 1;
      usedFreeze = true;
      // Decrement user's freeze tokens
      await db
        .update(users)
        .set({ streakFreezes: sql`GREATEST(${users.streakFreezes} - 1, 0)`, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } else {
      // Streak broken — restart
      newStreakVal = 1;
    }
  }

  const longestStreak = Math.max(newStreakVal, streak.longestStreak);

  [streak] = await db
    .update(streaks)
    .set({
      currentStreak: newStreakVal,
      longestStreak,
      lastActivityDate: today,
      streakFreezeUsedDate: usedFreeze ? yesterdayStr : streak.streakFreezeUsedDate,
      updatedAt: new Date(),
    })
    .where(eq(streaks.id, streak.id))
    .returning();

  return { streak, streakResult: 'updated', usedFreeze };
}

/** Public streak-update (called externally when needed, e.g. standalone). */
export async function updateStreak(userId: string): Promise<Streak> {
  const [user] = await db.select({ streakFreezes: users.streakFreezes }).from(users).where(eq(users.id, userId)).limit(1);
  const { streak } = await updateStreakInternal(userId, user?.streakFreezes ?? 1);
  return streak;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserStats(userId: string): Promise<UserStats> {
  const [streak] = await db.select().from(streaks).where(eq(streaks.userId, userId)).limit(1);

  const [user] = await db
    .select({
      energy: users.energy,
      energyUpdatedAt: users.energyUpdatedAt,
      xp: users.xp,
      dailyGoal: users.dailyGoal,
      streakFreezes: users.streakFreezes,
      isPremium: users.isPremium,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [stats] = await db
    .select({
      completedLessons: sql<number>`count(*)::int`.as('completed_lessons'),
      totalScore: sql<number>`coalesce(sum(${userProgress.score}), 0)::int`.as('total_score'),
    })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)));

  // Count lessons completed today for daily goal
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [todayRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, true),
        gte(userProgress.completedAt, todayStart),
      ),
    );

  // Achievements
  const achRows = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const earnedAchievements: EarnedAchievement[] = achRows
    .map(row => {
      const def = ACHIEVEMENT_DEFS[row.achievementId];
      if (!def) return null;
      return { ...def, earnedAt: row.earnedAt.toISOString() };
    })
    .filter(Boolean) as EarnedAchievement[];

  // Energy (account for hourly refills)
  const storedEnergy = user?.energy ?? MAX_ENERGY;
  const energyUpdatedAt = user?.energyUpdatedAt ?? null;
  const isPremium = user?.isPremium ?? false;
  const currentEnergy = isPremium ? MAX_ENERGY : computeCurrentEnergy(storedEnergy, energyUpdatedAt);
  const msTillRefill = isPremium ? 0 : msUntilNextRefill(currentEnergy, energyUpdatedAt);

  const currentXp = user?.xp ?? 0;
  const level = computeLevel(currentXp);

  return {
    streak: streak
      ? {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActivityDate: streak.lastActivityDate,
          streakFreezeUsedDate: streak.streakFreezeUsedDate,
        }
      : null,
    energy: currentEnergy,
    energyMax: MAX_ENERGY,
    msUntilNextEnergyRefill: msTillRefill,
    streakFreezes: user?.streakFreezes ?? 1,
    completedLessons: stats?.completedLessons ?? 0,
    totalScore: stats?.totalScore ?? 0,
    xp: currentXp,
    level,
    xpForCurrentLevel: xpForCurrentLevel(currentXp),
    xpForNextLevel: xpForNextLevel(currentXp),
    dailyGoal: user?.dailyGoal ?? 1,
    dailyProgress: todayRow?.count ?? 0,
    achievements: earnedAchievements,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Energy
// ─────────────────────────────────────────────────────────────────────────────

export async function consumeEnergy(userId: string, amount: number = 1): Promise<number> {
  const [user] = await db
    .select({ energy: users.energy, energyUpdatedAt: users.energyUpdatedAt, isPremium: users.isPremium })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.isPremium) return MAX_ENERGY; // premium = unlimited

  // Compute current energy with refills applied
  const currentEnergy = computeCurrentEnergy(user?.energy ?? MAX_ENERGY, user?.energyUpdatedAt ?? null);
  const newEnergy = Math.max(0, currentEnergy - amount);

  // If going below max, start or maintain refill timer
  const wasAtMax = currentEnergy >= MAX_ENERGY;
  const nowBelowMax = newEnergy < MAX_ENERGY;
  const newUpdatedAt = nowBelowMax && wasAtMax ? new Date() : user?.energyUpdatedAt ?? null;

  await db
    .update(users)
    .set({
      energy: newEnergy,
      energyUpdatedAt: newUpdatedAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return newEnergy;
}

export async function restoreEnergy(userId: string, amount: number = MAX_ENERGY): Promise<number> {
  const [user] = await db
    .update(users)
    .set({
      energy: amount,
      energyUpdatedAt: null, // at max → no refill timer needed
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ energy: users.energy });

  return user?.energy ?? amount;
}

// ─────────────────────────────────────────────────────────────────────────────
// Streak Freeze
// ─────────────────────────────────────────────────────────────────────────────

export async function buyStreakFreeze(userId: string, count = 1): Promise<number> {
  const [user] = await db
    .update(users)
    .set({
      streakFreezes: sql`${users.streakFreezes} + ${count}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ streakFreezes: users.streakFreezes });

  return user?.streakFreezes ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Goal
// ─────────────────────────────────────────────────────────────────────────────

export async function setDailyGoal(userId: string, goal: number): Promise<void> {
  await db
    .update(users)
    .set({ dailyGoal: goal, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserAchievements(userId: string): Promise<EarnedAchievement[]> {
  const rows = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  return rows
    .map(row => {
      const def = ACHIEVEMENT_DEFS[row.achievementId];
      if (!def) return null;
      return { ...def, earnedAt: row.earnedAt.toISOString() };
    })
    .filter(Boolean) as EarnedAchievement[];
}
