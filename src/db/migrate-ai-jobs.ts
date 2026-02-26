import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function migrateAIJobs() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting AI generation jobs migration...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_generation_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_modules INTEGER NOT NULL DEFAULT 0,
        completed_modules INTEGER NOT NULL DEFAULT 0,
        current_module_title VARCHAR(255),
        source_type VARCHAR(20) NOT NULL DEFAULT 'topic',
        error TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_gen_jobs_lesson ON lesson_generation_jobs(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_gen_jobs_user ON lesson_generation_jobs(user_id);
      CREATE INDEX IF NOT EXISTS idx_gen_jobs_status ON lesson_generation_jobs(status);
    `);

    console.log('✅ AI jobs migration completed successfully!');
  } catch (error) {
    console.error('❌ AI jobs migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAIJobs().catch(console.error);
