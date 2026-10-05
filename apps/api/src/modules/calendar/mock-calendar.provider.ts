import type {
  ICalendarProvider,
  CalendarEventPayload,
  CalendarEventResult,
} from './calendar.interface.js';

export class MockCalendarProvider implements ICalendarProvider {
  readonly name = 'MOCK_CALENDAR';

  getAuthUrl(state: string): string {
    return `https://accounts.google.com/o/oauth2/v2/auth?mock=true&state=${encodeURIComponent(state)}`;
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
  }> {
    return {
      accessToken: `mock_gcal_access_token_${code.slice(0, 8)}`,
      refreshToken: 'mock_gcal_refresh_token_deterministic',
      expiresIn: 3600,
      scope: 'https://www.googleapis.com/auth/calendar.events',
    };
  }

  async createEvent(
    _accessToken: string,
    event: CalendarEventPayload,
  ): Promise<CalendarEventResult> {
    const mockId = `mock_event_${Date.now()}`;
    return {
      id: mockId,
      summary: event.summary,
      start: event.startTime,
      end: event.endTime,
      htmlLink: `https://calendar.google.com/calendar/r/eventedit/${mockId}`,
    };
  }

  async revokeToken(_token: string): Promise<void> {
    // Deterministic no-op for mock provider
  }
}
