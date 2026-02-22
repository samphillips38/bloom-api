import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function migrateModules() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting modules migration...');

    await client.query('BEGIN');

    // 1. Create lesson_modules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lesson_modules_lesson ON lesson_modules(lesson_id);
    `);
    console.log('  ✅ lesson_modules table created');

    // 2. Create workshop_lesson_modules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workshop_lesson_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workshop_lesson_id UUID NOT NULL REFERENCES workshop_lessons(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_workshop_lesson_modules_lesson ON workshop_lesson_modules(workshop_lesson_id);
    `);
    console.log('  ✅ workshop_lesson_modules table created');

    // 3. Add module_id column to lesson_content (nullable)
    await client.query(`
      ALTER TABLE lesson_content
        ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES lesson_modules(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_lesson_content_module ON lesson_content(module_id);
    `);
    console.log('  ✅ module_id added to lesson_content');

    // 4. Add module_id column to workshop_lesson_content (nullable)
    await client.query(`
      ALTER TABLE workshop_lesson_content
        ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES workshop_lesson_modules(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_workshop_lesson_content_module ON workshop_lesson_content(module_id);
    `);
    console.log('  ✅ module_id added to workshop_lesson_content');

    // 5. Add sources column to lesson_content if missing (needed for consistency)
    await client.query(`
      ALTER TABLE lesson_content
        ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]';
    `);

    // 6. Backfill: create default "Introduction" module for each existing lesson
    const existingLessons = await client.query(
      `SELECT DISTINCT lesson_id FROM lesson_content WHERE module_id IS NULL`
    );
    for (const row of existingLessons.rows) {
      const moduleResult = await client.query(
        `INSERT INTO lesson_modules (lesson_id, title, order_index)
         VALUES ($1, 'Introduction', 0)
         RETURNING id`,
        [row.lesson_id]
      );
      const moduleId = moduleResult.rows[0].id;
      await client.query(
        `UPDATE lesson_content SET module_id = $1 WHERE lesson_id = $2 AND module_id IS NULL`,
        [moduleId, row.lesson_id]
      );
    }
    console.log(`  ✅ Backfilled ${existingLessons.rows.length} official lesson(s) with default modules`);

    // 7. Backfill: create default "Introduction" module for each existing workshop lesson
    const existingWorkshopLessons = await client.query(
      `SELECT DISTINCT workshop_lesson_id FROM workshop_lesson_content WHERE module_id IS NULL`
    );
    for (const row of existingWorkshopLessons.rows) {
      const moduleResult = await client.query(
        `INSERT INTO workshop_lesson_modules (workshop_lesson_id, title, order_index)
         VALUES ($1, 'Introduction', 0)
         RETURNING id`,
        [row.workshop_lesson_id]
      );
      const moduleId = moduleResult.rows[0].id;
      await client.query(
        `UPDATE workshop_lesson_content SET module_id = $1 WHERE workshop_lesson_id = $2 AND module_id IS NULL`,
        [moduleId, row.workshop_lesson_id]
      );
    }
    console.log(`  ✅ Backfilled ${existingWorkshopLessons.rows.length} workshop lesson(s) with default modules`);

    await client.query('COMMIT');
    console.log('✅ Modules migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateModules().catch(console.error);
