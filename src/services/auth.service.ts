import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import * as jose from 'jose';
import { db } from '../config/database';
import { users, streaks, refreshTokens, type User, type NewUser } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import type { JwtPayload } from '../middleware/auth.middleware';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// ── Google OAuth Client ──
const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

// ── Apple JWKS (cached) ──
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
let appleJWKS: jose.JWTVerifyGetKey | null = null;

function getAppleJWKS(): jose.JWTVerifyGetKey {
  if (!appleJWKS) {
    appleJWKS = jose.createRemoteJWKSet(new URL(APPLE_JWKS_URL));
  }
  return appleJWKS;
}

// ── Types ──

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ── Registration ──

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, name } = input;

  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    throw new AppError('Email already registered', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      provider: 'email',
    } as NewUser)
    .returning();

  // Create streak record
  await db.insert(streaks).values({
    userId: newUser.id,
    currentStreak: 0,
    longestStreak: 0,
  });

  // Generate tokens
  const accessToken = generateAccessToken(newUser);
  const refreshToken = await createRefreshToken(newUser.id);

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return { user: userWithoutPassword, accessToken, refreshToken };
}

// ── Email/Password Login ──

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.passwordHash) {
    throw new AppError(
      'This account uses social login. Please sign in with Google or Apple.',
      401
    );
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshToken };
}

// ── Google Sign-In ──

export async function googleLogin(credential: string): Promise<AuthResponse> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google Sign-In is not configured', 503);
  }

  // The credential can be either:
  // 1. A Google ID token (JWT) — from GoogleLogin component / One Tap
  // 2. A Google access token — from useGoogleLogin with implicit flow
  // We try ID token verification first, then fall back to access token userinfo.

  let email: string;
  let name: string;
  let avatarUrl: string | null;
  let providerId: string;

  try {
    if (googleClient) {
      // Try verifying as an ID token (JWT)
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload()!;

      if (!payload.email) {
        throw new AppError('Google account does not have an email address', 400);
      }
      if (!payload.email_verified) {
        throw new AppError('Google email is not verified', 400);
      }

      email = payload.email.toLowerCase();
      name = payload.name || email.split('@')[0];
      avatarUrl = payload.picture || null;
      providerId = payload.sub!;
    } else {
      throw new Error('fallback');
    }
  } catch (idTokenError) {
    // If ID token verification fails, try as an access token
    try {
      const userInfoRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${credential}` } }
      );

      if (!userInfoRes.ok) {
        throw new AppError('Invalid Google credential', 401);
      }

      const userInfo = await userInfoRes.json() as {
        sub: string;
        email: string;
        email_verified: boolean;
        name?: string;
        picture?: string;
      };

      if (!userInfo.email) {
        throw new AppError('Google account does not have an email address', 400);
      }
      if (!userInfo.email_verified) {
        throw new AppError('Google email is not verified', 400);
      }

      email = userInfo.email.toLowerCase();
      name = userInfo.name || email.split('@')[0];
      avatarUrl = userInfo.picture || null;
      providerId = userInfo.sub;
    } catch (accessTokenError) {
      if (accessTokenError instanceof AppError) throw accessTokenError;
      throw new AppError('Invalid Google credential', 401);
    }
  }

  // Find or create user
  const user = await findOrCreateSocialUser('google', providerId, email, name, avatarUrl);

  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshToken };
}

// ── Apple Sign-In ──

export async function appleLogin(
  idToken: string,
  userName?: string | null
): Promise<AuthResponse> {
  // Verify the Apple ID token using Apple's JWKS
  let payload: jose.JWTPayload;

  try {
    const jwks = getAppleJWKS();
    const { payload: verified } = await jose.jwtVerify(idToken, jwks, {
      issuer: 'https://appleid.apple.com',
      audience: env.APPLE_CLIENT_ID || undefined,
    });
    payload = verified;
  } catch {
    throw new AppError('Invalid Apple credential', 401);
  }

  const email = (payload.email as string)?.toLowerCase();
  if (!email) {
    throw new AppError('Apple account does not have an email address', 400);
  }

  const providerId = payload.sub!;
  // Apple only sends the user's name on the FIRST sign-in, so we accept it as a parameter
  const name = userName || email.split('@')[0];

  // Find or create user
  const user = await findOrCreateSocialUser('apple', providerId, email, name, null);

  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshToken };
}

// ── Shared: Find or create user from social provider ──

async function findOrCreateSocialUser(
  provider: 'google' | 'apple',
  providerId: string,
  email: string,
  name: string,
  avatarUrl: string | null
): Promise<User> {
  // First, try to find by provider ID
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.providerId, providerId))
    .limit(1);

  if (user) {
    // Update avatar if it changed (Google provides profile pictures)
    if (avatarUrl && user.avatarUrl !== avatarUrl) {
      [user] = await db
        .update(users)
        .set({ avatarUrl, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
    }
    return user;
  }

  // Check if email exists (link social to existing email account)
  [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    // Link this social provider to the existing account
    [user] = await db
      .update(users)
      .set({
        provider,
        providerId,
        ...(avatarUrl && { avatarUrl }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    return user;
  }

  // Create a brand new user
  [user] = await db
    .insert(users)
    .values({
      email,
      name,
      provider,
      providerId,
      avatarUrl,
    } as NewUser)
    .returning();

  // Create streak record for new user
  await db.insert(streaks).values({
    userId: user.id,
    currentStreak: 0,
    longestStreak: 0,
  });

  return user;
}

// ── Token Refresh ──

export async function refreshAccessToken(rawRefreshToken: string): Promise<TokenRefreshResponse> {
  const tokenHash = hashToken(rawRefreshToken);

  // Find the refresh token in DB
  const [storedToken] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt)
      )
    )
    .limit(1);

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (new Date() > storedToken.expiresAt) {
    // Revoke expired token
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, storedToken.id));
    throw new AppError('Refresh token expired', 401);
  }

  // Find the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, storedToken.userId))
    .limit(1);

  if (!user) {
    throw new AppError('User not found', 401);
  }

  // Rotate: revoke old token, create new one
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, storedToken.id));

  const accessToken = generateAccessToken(user);
  const newRefreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
}

// ── Logout ──

export async function logoutUser(rawRefreshToken: string): Promise<void> {
  if (!rawRefreshToken) return;

  const tokenHash = hashToken(rawRefreshToken);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function logoutAllDevices(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.revokedAt)
      )
    );
}

// ── Get user by ID ──

export async function getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ── Token Helpers ──

function generateAccessToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
