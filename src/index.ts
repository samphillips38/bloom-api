import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { testConnection } from './config/database';
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

// Start server
async function start() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected && env.isProd) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`🌸 Bloom API running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Health: http://localhost:${env.PORT}/health`);
  });
}

start().catch(console.error);

export default app;
