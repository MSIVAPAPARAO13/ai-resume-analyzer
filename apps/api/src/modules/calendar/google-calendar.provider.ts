import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error-handler.js';
import type {
  ICalendarProvider,
  CalendarEventPayload,
  CalendarEventResult,
} from './calendar.interface.js';

export class GoogleCalendarProvider implements ICalendarProvider {
  readonly name = 'GOOGLE_CALENDAR';

  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = env.GOOGLE_CALENDAR_REDIRECT_URI;
  }

  getAuthUrl(state: string): string {
    if (!this.clientId) {
      throw new AppError(
        'Google Calendar is not configured. Missing GOOGLE_CLIENT_ID.',
        503,
      );
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new AppError(
        'Google Calendar client credentials are not configured.',
        503,
      );
    }

    const params = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new AppError(
        `Failed to exchange Google OAuth code: ${response.statusText} (${errText})`,
        502,
      );
    }

    const data: any = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  async createEvent(
    accessToken: string,
    event: CalendarEventPayload,
  ): Promise<CalendarEventResult> {
    const body = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startTime,
        timeZone: event.timeZone || 'UTC',
      },
      end: {
        dateTime: event.endTime,
        timeZone: event.timeZone || 'UTC',
      },
      attendees: event.attendees?.map((email) => ({ email })),
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new AppError(
        `Google Calendar event creation failed: ${response.statusText} (${errText})`,
        502,
      );
    }

    const resJson: any = await response.json();
    return {
      id: resJson.id,
      htmlLink: resJson.htmlLink,
      summary: resJson.summary || event.summary,
      start: resJson.start?.dateTime || event.startTime,
      end: resJson.end?.dateTime || event.endTime,
    };
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
    } catch {
      // Safe ignore revocation errors
    }
  }
}
