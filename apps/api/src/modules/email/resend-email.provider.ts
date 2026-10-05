import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error-handler.js';
import type {
  IEmailProvider,
  EmailPayload,
  EmailResult,
} from './email.interface.js';

export class ResendEmailProvider implements IEmailProvider {
  readonly name = 'RESEND';
  private apiKey: string;
  private defaultFrom = 'Resumind <notifications@resumind.app>';

  constructor() {
    this.apiKey = env.RESEND_API_KEY || '';
  }

  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    if (!this.apiKey) {
      throw new AppError(
        'Resend email provider is not configured. Missing RESEND_API_KEY.',
        503,
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from || this.defaultFrom,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new AppError(
        `Failed to send email via Resend: ${response.statusText} (${errText})`,
        502,
      );
    }

    const data: any = await response.json();
    return {
      id: data.id,
      delivered: true,
    };
  }
}
