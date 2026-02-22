import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

/**
 * Migration: Unify workshop_lessons into a single lessons table.
 *
 * Steps:
 * 1. Expand the lessons table with workshop-specific columns
 * 2. Make level_id nullable
 * 3. Expand lesson_content with author_id, updated_at
 * 4. Expand lesson_modules with updated_at
 * 5. Migrate workshop_lessons → lessons
 * 6. Migrate workshop_lesson_modules → lesson_modules
 * 7. Migrate workshop_lesson_content → lesson_content
 * 8. Migrate workshop_content_edits → lesson_content_edits
 * 9. Migrate workshop_edit_suggestions → lesson_edit_suggestions
 * 10. Migrate workshop_lesson_ratings → lesson_ratings
 * 11. Mark existing lessons as official
 * 12. Drop old workshop tables
 */
async function migrateUnifyLessons() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting lesson unification migration...');
    await client.query('BEGIN');

    // 1. Make level_id nullable on lessons
    await client.query(`
      ALTER TABLE lessons ALTER COLUMN level_id DROP NOT NULL;
    `);
    console.log('  ✅ level_id is now nullable');

    // 2. Add workshop-specific columns to lessons
    await client.query(`
      ALTER TABLE lessons
        ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7) DEFAULT '#FF6B35',
        ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'public',
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published',
        ADD COLUMN IF NOT EXISTS edit_policy VARCHAR(20) NOT NULL DEFAULT 'approval',
        ADD COLUMN IF NOT EXISTS ai_involvement VARCHAR(20) NOT NULL DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS rating_sum INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);
    console.log('  ✅ Expanded lessons table with unified columns');

    // 3. Add author_id and updated_at to lesson_content
    await client.query(`
      ALTER TABLE lesson_content
        ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);
    console.log('  ✅ Expanded lesson_content with author_id, updated_at');

    // 4. Add updated_at to lesson_modules
    await client.query(`
      ALTER TABLE lesson_modules
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);
    console.log('  ✅ Expanded lesson_modules with updated_at');

    // 5. Create new edit tracking tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_content_edits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        content_id UUID REFERENCES lesson_content(id) ON DELETE SET NULL,
        editor_id UUID NOT NULL REFERENCES users(id),
        edit_type VARCHAR(20) NOT NULL,
        previous_data JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lesson_content_edits_lesson ON lesson_content_edits(lesson_id);
    `);
    console.log('  ✅ Created lesson_content_edits table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_edit_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        content_id UUID REFERENCES lesson_content(id) ON DELETE SET NULL,
        suggester_id UUID NOT NULL REFERENCES users(id),
        suggested_data JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        reviewer_id UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lesson_edit_suggestions_lesson ON lesson_edit_suggestions(lesson_id);
    `);
    console.log('  ✅ Created lesson_edit_suggestions table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(lesson_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_lesson_ratings_lesson ON lesson_ratings(lesson_id);
    `);
    console.log('  ✅ Created lesson_ratings table');

    // 6. Migrate workshop_lessons → lessons (with ID mapping)
    // We'll insert with a new UUID but keep a mapping for content migration
    const workshopLessons = await client.query('SELECT * FROM workshop_lessons');
    const idMap: Record<string, string> = {}; // oldId → newId

    for (const wl of workshopLessons.rows) {
      const result = await client.query(
        `INSERT INTO lessons (
          author_id, title, description, icon_url, theme_color, type, order_index,
          is_official, visibility, status, edit_policy, ai_involvement,
          tags, rating_sum, rating_count, view_count, is_promoted,
          published_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'lesson', 0,
          false, $6, $7, $8, $9,
          $10, $11, $12, $13, $14,
          $15, $16, $17
        ) RETURNING id`,
        [
          wl.author_id, wl.title, wl.description, wl.icon_url, wl.theme_color || '#FF6B35',
          wl.visibility, wl.status, wl.edit_policy, wl.ai_involvement,
          JSON.stringify(wl.tags || []), wl.rating_sum, wl.rating_count, wl.view_count, wl.is_promoted,
          wl.published_at, wl.created_at, wl.updated_at,
        ]
      );
      idMap[wl.id] = result.rows[0].id;
    }
    console.log(`  ✅ Migrated ${workshopLessons.rows.length} workshop lessons → lessons`);

    // 7. Migrate workshop_lesson_modules → lesson_modules
    const moduleIdMap: Record<string, string> = {};
    const workshopModules = await client.query('SELECT * FROM workshop_lesson_modules');
    for (const wm of workshopModules.rows) {
      const newLessonId = idMap[wm.workshop_lesson_id];
      if (!newLessonId) continue;
      const result = await client.query(
        `INSERT INTO lesson_modules (lesson_id, title, description, order_index, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [newLessonId, wm.title, wm.description, wm.order_index, wm.created_at, wm.updated_at]
      );
      moduleIdMap[wm.id] = result.rows[0].id;
    }
    console.log(`  ✅ Migrated ${workshopModules.rows.length} workshop modules → lesson_modules`);

    // 8. Migrate workshop_lesson_content → lesson_content
    const contentIdMap: Record<string, string> = {};
    const workshopContent = await client.query('SELECT * FROM workshop_lesson_content ORDER BY order_index');
    for (const wc of workshopContent.rows) {
      const newLessonId = idMap[wc.workshop_lesson_id];
      if (!newLessonId) continue;
      const newModuleId = wc.module_id ? moduleIdMap[wc.module_id] : null;
      const result = await client.query(
        `INSERT INTO lesson_content (lesson_id, module_id, order_index, content_type, content_data, author_id, sources, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [newLessonId, newModuleId, wc.order_index, wc.content_type, JSON.stringify(wc.content_data), wc.author_id, JSON.stringify(wc.sources || []), wc.created_at, wc.updated_at]
      );
      contentIdMap[wc.id] = result.rows[0].id;
    }
    console.log(`  ✅ Migrated ${workshopContent.rows.length} content pages → lesson_content`);

    // 9. Migrate workshop_content_edits → lesson_content_edits
    const workshopEdits = await client.query('SELECT * FROM workshop_content_edits');
    for (const we of workshopEdits.rows) {
      const newLessonId = idMap[we.workshop_lesson_id];
      if (!newLessonId) continue;
      const newContentId = we.content_id ? contentIdMap[we.content_id] : null;
      await client.query(
        `INSERT INTO lesson_content_edits (lesson_id, content_id, editor_id, edit_type, previous_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newLessonId, newContentId, we.editor_id, we.edit_type, we.previous_data ? JSON.stringify(we.previous_data) : null, we.created_at]
      );
    }
    console.log(`  ✅ Migrated ${workshopEdits.rows.length} edit history entries`);

    // 10. Migrate workshop_edit_suggestions → lesson_edit_suggestions
    const workshopSuggestions = await client.query('SELECT * FROM workshop_edit_suggestions');
    for (const ws of workshopSuggestions.rows) {
      const newLessonId = idMap[ws.workshop_lesson_id];
      if (!newLessonId) continue;
      const newContentId = ws.content_id ? contentIdMap[ws.content_id] : null;
      await client.query(
        `INSERT INTO lesson_edit_suggestions (lesson_id, content_id, suggester_id, suggested_data, status, reviewer_id, reviewed_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newLessonId, newContentId, ws.suggester_id, JSON.stringify(ws.suggested_data), ws.status, ws.reviewer_id, ws.reviewed_at, ws.created_at]
      );
    }
    console.log(`  ✅ Migrated ${workshopSuggestions.rows.length} edit suggestions`);

    // 11. Migrate workshop_lesson_ratings → lesson_ratings
    const workshopRatings = await client.query('SELECT * FROM workshop_lesson_ratings');
    for (const wr of workshopRatings.rows) {
      const newLessonId = idMap[wr.workshop_lesson_id];
      if (!newLessonId) continue;
      await client.query(
        `INSERT INTO lesson_ratings (lesson_id, user_id, rating, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (lesson_id, user_id) DO NOTHING`,
        [newLessonId, wr.user_id, wr.rating, wr.created_at]
      );
    }
    console.log(`  ✅ Migrated ${workshopRatings.rows.length} ratings`);

    // 12. Drop old workshop tables (in correct order due to FK constraints)
    await client.query('DROP TABLE IF EXISTS workshop_lesson_ratings CASCADE');
    await client.query('DROP TABLE IF EXISTS workshop_edit_suggestions CASCADE');
    await client.query('DROP TABLE IF EXISTS workshop_content_edits CASCADE');
    await client.query('DROP TABLE IF EXISTS workshop_lesson_content CASCADE');
    await client.query('DROP TABLE IF EXISTS workshop_lesson_modules CASCADE');
    await client.query('DROP TABLE IF EXISTS workshop_lessons CASCADE');
    console.log('  ✅ Dropped old workshop tables');

    await client.query('COMMIT');
    console.log('✅ Lesson unification migration completed successfully!');
    console.log(`   ${workshopLessons.rows.length} lessons migrated with their content, modules, edits, suggestions, and ratings.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateUnifyLessons().catch(console.error);
