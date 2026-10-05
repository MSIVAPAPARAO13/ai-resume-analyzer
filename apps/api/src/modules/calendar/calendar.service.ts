import crypto from 'node:crypto';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error-handler.js';
import { encryptToken, decryptToken } from '../../utils/crypto.js';
import type {
  ICalendarProvider,
  CalendarEventPayload,
  CalendarEventResult,
} from './calendar.interface.js';
import { GoogleCalendarProvider } from './google-calendar.provider.js';
import { MockCalendarProvider } from './mock-calendar.provider.js';

export class CalendarService {
  private provider: ICalendarProvider;

  constructor(provider?: ICalendarProvider) {
    if (provider) {
      this.provider = provider;
    } else if (
      env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_SECRET &&
      env.NODE_ENV !== 'test'
    ) {
      this.provider = new GoogleCalendarProvider();
    } else {
      this.provider = new MockCalendarProvider();
    }
  }

  setProvider(provider: ICalendarProvider) {
    this.provider = provider;
  }

  generateState(userId: string): string {
    const raw = `${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
    const hmac = crypto
      .createHmac('sha256', env.GITHUB_ENCRYPTION_KEY)
      .update(raw)
      .digest('hex');
    return Buffer.from(`${raw}:${hmac}`).toString('base64url');
  }

  validateState(state: string): string {
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 4) {
        throw new AppError('Invalid state format', 400);
      }
      const [userId, timestamp, randomHex, hmac] = parts;
      const raw = `${userId}:${timestamp}:${randomHex}`;
      const expectedHmac = crypto
        .createHmac('sha256', env.GITHUB_ENCRYPTION_KEY)
        .update(raw)
        .digest('hex');

      if (
        !crypto.timingSafeEqual(
          Buffer.from(hmac, 'hex'),
          Buffer.from(expectedHmac, 'hex'),
        )
      ) {
        throw new AppError('State verification failed (tampered)', 400);
      }

      const elapsed = Date.now() - parseInt(timestamp, 10);
      if (elapsed > 15 * 60 * 1000) {
        throw new AppError('State expired', 400);
      }

      return userId;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Malformed state parameter', 400);
    }
  }

  getConnectUrl(userId: string): string {
    const state = this.generateState(userId);
    return this.provider.getAuthUrl(state);
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ userId: string }> {
    const userId = this.validateState(state);
    const tokenData = await this.provider.exchangeCode(code);

    const encryptedAccessToken = encryptToken(tokenData.accessToken);
    const encryptedRefreshToken = tokenData.refreshToken
      ? encryptToken(tokenData.refreshToken)
      : null;

    const expiresAt = tokenData.expiresIn
      ? new Date(Date.now() + tokenData.expiresIn * 1000)
      : null;

    await (prisma as any).calendarConnection.upsert({
      where: { userId },
      update: {
        provider: 'GOOGLE',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        scope: tokenData.scope,
      },
      create: {
        userId,
        provider: 'GOOGLE',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        scope: tokenData.scope,
      },
    });

    return { userId };
  }

  async getStatus(userId: string) {
    const conn = await (prisma as any).calendarConnection.findUnique({
      where: { userId },
      select: {
        id: true,
        provider: true,
        scope: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      connected: !!conn,
      connection: conn,
    };
  }

  async disconnect(userId: string): Promise<void> {
    const conn = await (prisma as any).calendarConnection.findUnique({
      where: { userId },
    });

    if (conn) {
      try {
        const decryptedToken = decryptToken(conn.accessToken);
        if (this.provider.revokeToken) {
          await this.provider.revokeToken(decryptedToken);
        }
      } catch {
        // Safe to ignore token decryption/revocation failure on disconnect
      }

      await (prisma as any).calendarConnection.delete({
        where: { userId },
      });
    }
  }

  async createInterviewCalendarEvent(
    userId: string,
    eventPayload: CalendarEventPayload,
  ): Promise<CalendarEventResult> {
    const conn = await (prisma as any).calendarConnection.findUnique({
      where: { userId },
    });

    if (!conn) {
      throw new AppError(
        'Google Calendar is not connected. Please connect your calendar first.',
        400,
        'CALENDAR_NOT_CONNECTED',
      );
    }

    const decryptedAccessToken = decryptToken(conn.accessToken);
    return this.provider.createEvent(decryptedAccessToken, eventPayload);
  }
}

export const calendarService = new CalendarService();
