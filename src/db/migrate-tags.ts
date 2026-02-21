import { db } from '../config/database';
import { sql } from 'drizzle-orm';

async function migrateTags() {
  console.log('🏷️  Adding tags, ratings, and view count columns...');

  // Add tags, rating, and view count columns to workshop_lessons
  await db.execute(sql`
    ALTER TABLE workshop_lessons
    ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS rating_sum INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0
  `);

  // Create workshop_lesson_ratings table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workshop_lesson_ratings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workshop_lesson_id UUID NOT NULL REFERENCES workshop_lessons(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(workshop_lesson_id, user_id)
    )
  `);

  console.log('✅ Tags migration complete!');
  process.exit(0);
}

migrateTags().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
