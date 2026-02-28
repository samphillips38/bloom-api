import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://Home@localhost:5432/bloom',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'bloom-dev-secret-key-change-in-production',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // AI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // OAuth - Google
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

  // OAuth - Apple
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID || '',  // e.g. com.yourapp.web
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID || '',
  APPLE_KEY_ID: process.env.APPLE_KEY_ID || '',
  APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY || '', // PEM-encoded .p8 key contents

  // Stripe (Payments)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID || '',
  STRIPE_YEARLY_PRICE_ID: process.env.STRIPE_YEARLY_PRICE_ID || '',

  // Admin
  ADMIN_SECRET: process.env.ADMIN_SECRET || 'bloom-admin-secret-change-in-production',
  
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
};
