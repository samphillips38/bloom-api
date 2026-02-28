import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function migratePrerequisitesProgress() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting prerequisites & progress migration...');

    await client.query(`
      -- Add last_page_index to user_progress for resume-where-left-off tracking
      ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_page_index INTEGER DEFAULT 0;

      -- Lesson prerequisites join table
      CREATE TABLE IF NOT EXISTS lesson_prerequisites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        prerequisite_lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(lesson_id, prerequisite_lesson_id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_lesson_prerequisites_lesson ON lesson_prerequisites(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_prerequisites_prereq ON lesson_prerequisites(prerequisite_lesson_id);
    `);

    console.log('✅ Prerequisites & progress migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migratePrerequisitesProgress().catch(console.error);
