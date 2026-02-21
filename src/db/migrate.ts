import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.isProd ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...');
    
    // Create tables in order of dependencies
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        energy INTEGER NOT NULL DEFAULT 5,
        provider VARCHAR(50) DEFAULT 'email',
        provider_id VARCHAR(255),
        is_premium BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Streaks table
      CREATE TABLE IF NOT EXISTS streaks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_activity_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        icon_url TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Courses table
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID NOT NULL REFERENCES categories(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon_url TEXT,
        theme_color VARCHAR(7) DEFAULT '#FF6B35',
        lesson_count INTEGER NOT NULL DEFAULT 0,
        exercise_count INTEGER NOT NULL DEFAULT 0,
        is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
        collaborators JSONB DEFAULT '[]',
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Levels table
      CREATE TABLE IF NOT EXISTS levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Lessons table
      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        icon_url TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'lesson',
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Lesson content table
      CREATE TABLE IF NOT EXISTS lesson_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL DEFAULT 0,
        content_type VARCHAR(50) NOT NULL,
        content_data JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- User progress table
      CREATE TABLE IF NOT EXISTS user_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        score INTEGER,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, lesson_id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
      CREATE INDEX IF NOT EXISTS idx_levels_course ON levels(course_id);
      CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(level_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_content_lesson ON lesson_content(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON user_progress(lesson_id);
    `);
    
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
