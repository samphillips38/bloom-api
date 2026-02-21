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
    await db.execute(sql`
      ALTER TABLE workshop_lessons
      ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS rating_sum INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0
    `);
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
