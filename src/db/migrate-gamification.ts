import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🚀 Running gamification migration...');

    await client.query(`
      -- ── Users: XP, energy tracking, daily goal, streak freezes ──
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS xp                 INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS energy_updated_at  TIMESTAMP,
        ADD COLUMN IF NOT EXISTS daily_goal         INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS streak_freezes     INTEGER NOT NULL DEFAULT 1;

      -- ── Streaks: track freeze usage ──
      ALTER TABLE streaks
        ADD COLUMN IF NOT EXISTS streak_freeze_used_date DATE;

      -- ── User achievements ──
      CREATE TABLE IF NOT EXISTS user_achievements (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id VARCHAR(50) NOT NULL,
        earned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, achievement_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
    `);

    console.log('✅ Gamification migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
