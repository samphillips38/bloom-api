import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function migrateWorkshop() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting workshop migration...');
    
    await client.query(`
      -- Add new columns to courses table
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS creator_name VARCHAR(255) DEFAULT 'Bloom Team';
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS ai_involvement VARCHAR(20) DEFAULT 'full';

      -- Backfill existing courses
      UPDATE courses SET creator_name = 'Bloom Team' WHERE creator_name IS NULL;
      UPDATE courses SET ai_involvement = 'full' WHERE ai_involvement IS NULL;

      -- Workshop lessons table
      CREATE TABLE IF NOT EXISTS workshop_lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon_url TEXT,
        theme_color VARCHAR(7) DEFAULT '#FF6B35',
        visibility VARCHAR(20) NOT NULL DEFAULT 'private',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        edit_policy VARCHAR(20) NOT NULL DEFAULT 'approval',
        ai_involvement VARCHAR(20) NOT NULL DEFAULT 'none',
        is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
        published_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Workshop lesson content table
      CREATE TABLE IF NOT EXISTS workshop_lesson_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workshop_lesson_id UUID NOT NULL REFERENCES workshop_lessons(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL DEFAULT 0,
        content_type VARCHAR(50) NOT NULL,
        content_data JSONB NOT NULL,
        author_id UUID NOT NULL REFERENCES users(id),
        sources JSONB DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Workshop content edits (history) table
      CREATE TABLE IF NOT EXISTS workshop_content_edits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workshop_lesson_id UUID NOT NULL REFERENCES workshop_lessons(id) ON DELETE CASCADE,
        content_id UUID REFERENCES workshop_lesson_content(id) ON DELETE SET NULL,
        editor_id UUID NOT NULL REFERENCES users(id),
        edit_type VARCHAR(20) NOT NULL,
        previous_data JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Workshop edit suggestions table
      CREATE TABLE IF NOT EXISTS workshop_edit_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workshop_lesson_id UUID NOT NULL REFERENCES workshop_lessons(id) ON DELETE CASCADE,
        content_id UUID REFERENCES workshop_lesson_content(id) ON DELETE SET NULL,
        suggester_id UUID NOT NULL REFERENCES users(id),
        suggested_data JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        reviewer_id UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_workshop_lessons_author ON workshop_lessons(author_id);
      CREATE INDEX IF NOT EXISTS idx_workshop_lessons_status ON workshop_lessons(status);
      CREATE INDEX IF NOT EXISTS idx_workshop_lessons_visibility ON workshop_lessons(visibility);
      CREATE INDEX IF NOT EXISTS idx_workshop_content_lesson ON workshop_lesson_content(workshop_lesson_id);
      CREATE INDEX IF NOT EXISTS idx_workshop_edits_lesson ON workshop_content_edits(workshop_lesson_id);
      CREATE INDEX IF NOT EXISTS idx_workshop_edits_content ON workshop_content_edits(content_id);
      CREATE INDEX IF NOT EXISTS idx_workshop_suggestions_lesson ON workshop_edit_suggestions(workshop_lesson_id);
      CREATE INDEX IF NOT EXISTS idx_workshop_suggestions_status ON workshop_edit_suggestions(status);
    `);
    
    console.log('✅ Workshop migration completed successfully!');
  } catch (error) {
    console.error('❌ Workshop migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateWorkshop().catch(console.error);
