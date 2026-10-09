export interface CalendarEventPayload {
  summary: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  timeZone?: string;
  attendees?: string[];
}

export interface CalendarEventResult {
  id: string;
  htmlLink?: string;
  summary: string;
  start: string;
  end: string;
}

export interface ICalendarProvider {
  readonly name: string;
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
  }>;
  createEvent(
    accessToken: string,
    event: CalendarEventPayload,
  ): Promise<CalendarEventResult>;
  revokeToken?(token: string): Promise<void>;
}
