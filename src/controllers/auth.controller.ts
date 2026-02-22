import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';
import { env } from '../config/env';

// ── Validation Schemas ──

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

const appleLoginSchema = z.object({
  idToken: z.string().min(1, 'Apple ID token is required'),
  user: z
    .object({
      name: z
        .object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ── Helpers ──

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? ('none' as const) : ('lax' as const),
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth',
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie('bloom_refresh', token, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie('bloom_refresh', REFRESH_COOKIE_OPTIONS);
}

// ── Email Registration ──

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.registerUser(data);

    setRefreshCookie(res, result.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

// ── Email Login ──

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.loginUser(data);

    setRefreshCookie(res, result.refreshToken);

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

// ── Google Sign-In ──

export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { credential } = googleLoginSchema.parse(req.body);
    const result = await authService.googleLogin(credential);

    setRefreshCookie(res, result.refreshToken);

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

// ── Apple Sign-In ──

export async function appleLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = appleLoginSchema.parse(req.body);

    // Apple sends name only on first sign-in
    let userName: string | null = null;
    if (data.user?.name) {
      const parts = [data.user.name.firstName, data.user.name.lastName].filter(Boolean);
      if (parts.length > 0) {
        userName = parts.join(' ');
      }
    }

    const result = await authService.appleLogin(data.idToken, userName);

    setRefreshCookie(res, result.refreshToken);

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
}

// ── Token Refresh ──

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Accept refresh token from cookie OR request body (for mobile clients)
    const rawToken =
      req.cookies?.bloom_refresh ||
      refreshSchema.safeParse(req.body).data?.refreshToken;

    if (!rawToken) {
      throw new AppError('No refresh token provided', 401);
    }

    const result = await authService.refreshAccessToken(rawToken);

    setRefreshCookie(res, result.refreshToken);

    res.json({
      success: true,
      data: {
        token: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      clearRefreshCookie(res);
    }
    next(error);
  }
}

// ── Logout ──

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawToken =
      req.cookies?.bloom_refresh ||
      req.body?.refreshToken;

    if (rawToken) {
      await authService.logoutUser(rawToken);
    }

    clearRefreshCookie(res);

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
}

// ── Get Profile ──

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await authService.getUserById(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
