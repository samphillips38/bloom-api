import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { users, streaks, type User, type NewUser } from '../db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import type { JwtPayload } from '../middleware/auth.middleware';

const SALT_ROUNDS = 12;

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
  token: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, name } = input;

  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    throw new AppError('Email already registered', 400);
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

  // Generate token
  const token = generateToken(newUser);

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return { user: userWithoutPassword, token };
}

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
    throw new AppError('Please use social login for this account', 401);
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

export async function socialLogin(
  provider: 'google' | 'apple',
  providerId: string,
  email: string,
  name: string
): Promise<AuthResponse> {
  // Check if user exists with this provider
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.providerId, providerId))
    .limit(1);

  if (!user) {
    // Check if email exists
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (user) {
      // Link provider to existing account
      [user] = await db
        .update(users)
        .set({ provider, providerId })
        .where(eq(users.id, user.id))
        .returning();
    } else {
      // Create new user
      [user] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          name,
          provider,
          providerId,
        } as NewUser)
        .returning();

      // Create streak record
      await db.insert(streaks).values({
        userId: user.id,
        currentStreak: 0,
        longestStreak: 0,
      });
    }
  }

  const token = generateToken(user);
  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

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

function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}
