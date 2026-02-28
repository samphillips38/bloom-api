import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { testConnection, db } from './config/database';
import { sql } from 'drizzle-orm';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import coursesRoutes from './routes/courses.routes';
import progressRoutes from './routes/progress.routes';
import workshopRoutes from './routes/workshop.routes';
import libraryRoutes from './routes/library.routes';
import subscriptionRoutes from './routes/subscription.routes';
import * as subscriptionController from './controllers/subscription.controller';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

// Trust the first proxy hop (Railway / any reverse-proxy in production)
// Required so express-rate-limit can read X-Forwarded-For correctly
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS — allow credentials for refresh token cookies
const allowedOrigins = env.isDev
  ? ['http://localhost:5173', 'http://localhost:3000']
  : process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : [];

app.use(cors({
  origin: env.isDev
    ? true // allow any origin in dev
    : (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
  credentials: true,
}));

// ── Stripe Webhook: MUST be registered BEFORE express.json() ──
// Stripe requires the raw request body to verify the webhook signature.
app.post(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.webhook,
);

// Body parsing & cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/workshop', authMiddleware, workshopRoutes);
app.use('/api/library', authMiddleware, libraryRoutes);
app.use('/api/subscription', subscriptionRoutes);

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

    // Ensure lesson_modules has sources column (added for AI web-search source tracking)
    await db.execute(sql`
      ALTER TABLE lesson_modules
        ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'
    `);

    // Ensure lesson_generation_jobs has discovered_sources column
    await db.execute(sql`
      ALTER TABLE lesson_generation_jobs
        ADD COLUMN IF NOT EXISTS discovered_sources JSONB DEFAULT '[]'
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

    // ── AI generation jobs table ──
    await db.execute(sql`
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
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_gen_jobs_lesson ON lesson_generation_jobs(lesson_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_gen_jobs_user ON lesson_generation_jobs(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_gen_jobs_status ON lesson_generation_jobs(status)
    `);

    // ── User library table ──
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_library (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        saved_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, lesson_id),
        UNIQUE (user_id, course_id)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_library_user ON user_library(user_id)
    `);

    // ── Refresh tokens table ──
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash)
    `);

    // ── Prerequisites & progress tracking ──
    await db.execute(sql`
      ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_page_index INTEGER DEFAULT 0
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lesson_prerequisites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        prerequisite_lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(lesson_id, prerequisite_lesson_id)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_lesson_prerequisites_lesson ON lesson_prerequisites(lesson_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_lesson_prerequisites_prereq ON lesson_prerequisites(prerequisite_lesson_id)
    `);

    // ── Subscriptions table & stripe_customer_id column ──
    await db.execute(sql`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id)
        WHERE stripe_customer_id IS NOT NULL
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255) UNIQUE,
        stripe_price_id VARCHAR(255),
        plan VARCHAR(20),
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
        canceled_at TIMESTAMP,
        trial_end TIMESTAMP,
        granted_by VARCHAR(20),
        granted_by_admin_id UUID REFERENCES users(id),
        grant_note TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id)
        WHERE stripe_subscription_id IS NOT NULL
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
