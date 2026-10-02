import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/tokens.js';
import { env } from '../../config/env.js';

// ─── Password Hashing ─────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

// ─── Safe User Type ───────────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  plan: string;
  createdAt: Date;
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  plan: true,
  createdAt: true,
} as const;

// ─── Register ─────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error('EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      careerProfile: {
        create: {},
      },
    },
    select: userSelect,
  });

  return user as SafeUser;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginInput): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: {
      ...userSelect,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const passwordValid = await verifyPassword(user.passwordHash, input.password);
  if (!passwordValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const { passwordHash: _ph, ...safeUser } = user;
  return safeUser as SafeUser;
}

// ─── Token Pair ───────────────────────────────────────────────────────────────

export async function issueTokenPair(user: SafeUser) {
  const tokenId = uuidv4();

  const refreshExpiresAt = new Date();
  const refreshDays = parseInt(env.JWT_REFRESH_EXPIRES_IN); // "7d" -> 7
  refreshExpiresAt.setDate(
    refreshExpiresAt.getDate() + (isNaN(refreshDays) ? 7 : refreshDays),
  );

  const refreshTokenStr = signRefreshToken({ tokenId, userId: user.id });

  await (prisma as any).refreshToken.create({
    data: {
      id: tokenId,
      token: refreshTokenStr,
      userId: user.id,
      expiresAt: refreshExpiresAt,
    },
  });

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken, refreshToken: refreshTokenStr };
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshTokenStr: string) {
  try {
    verifyRefreshToken(refreshTokenStr);
  } catch {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const storedToken = await (prisma as any).refreshToken.findUnique({
    where: { token: refreshTokenStr },
    include: {
      user: { select: userSelect },
    },
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt < new Date()
  ) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const newTokenId = uuidv4();
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

  const newRefreshTokenStr = signRefreshToken({
    tokenId: newTokenId,
    userId: storedToken.userId,
  });

  await (prisma as any).$transaction([
    (prisma as any).refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    }),
    (prisma as any).refreshToken.create({
      data: {
        id: newTokenId,
        token: newRefreshTokenStr,
        userId: storedToken.userId,
        expiresAt: refreshExpiresAt,
      },
    }),
  ]);

  const accessToken = signAccessToken({
    userId: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
  });

  return {
    accessToken,
    refreshToken: newRefreshTokenStr,
    user: storedToken.user as SafeUser,
  };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(refreshTokenStr: string) {
  await (prisma as any).refreshToken.updateMany({
    where: { token: refreshTokenStr, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ─── Get Me ───────────────────────────────────────────────────────────────────

export async function getUserById(userId: string): Promise<SafeUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userSelect,
      updatedAt: true,
    },
  }) as Promise<SafeUser | null>;
}
