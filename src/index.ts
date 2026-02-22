import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { testConnection, db } from './config/database';
import { sql } from 'drizzle-orm';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import coursesRoutes from './routes/courses.routes';
import progressRoutes from './routes/progress.routes';
import workshopRoutes from './routes/workshop.routes';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.isDev
    ? '*'
    : process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
      : '*',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/workshop', authMiddleware, workshopRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Auto-migration: runs idempotent schema updates on startup
async function runAutoMigrations() {
  try {
    // Ensure unified lessons table has all needed columns
    await db.execute(sql`
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
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    `);

    // Make level_id nullable
    await db.execute(sql`
      ALTER TABLE lessons ALTER COLUMN level_id DROP NOT NULL
    `);

    // Ensure lesson_content has author_id, updated_at, sources
    await db.execute(sql`
      ALTER TABLE lesson_content
        ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'
    `);

    // Create lesson_modules table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lesson_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_lesson_modules_lesson ON lesson_modules(lesson_id)
    `);

    // Ensure lesson_content has module_id column
    await db.execute(sql`
      ALTER TABLE lesson_content
        ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES lesson_modules(id) ON DELETE CASCADE
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_lesson_content_module ON lesson_content(module_id)
    `);

    // Create edit tracking tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lesson_content_edits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        content_id UUID REFERENCES lesson_content(id) ON DELETE SET NULL,
        editor_id UUID NOT NULL REFERENCES users(id),
        edit_type VARCHAR(20) NOT NULL,
        previous_data JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
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
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lesson_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(lesson_id, user_id)
      )
    `);

    console.log('✅ Auto-migrations complete');
  } catch (error) {
    console.error('⚠️  Auto-migration warning:', error);
    // Don't crash — columns may already exist
  }
}

// Start server
async function start() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected && env.isProd) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Run idempotent schema migrations
  await runAutoMigrations();

  app.listen(env.PORT, () => {
    console.log(`🌸 Bloom API running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Health: http://localhost:${env.PORT}/health`);
  });
}

start().catch(console.error);

export default app;
