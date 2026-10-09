import type {
  IEmailProvider,
  EmailPayload,
  EmailResult,
} from './email.interface.js';

export class MockEmailProvider implements IEmailProvider {
  readonly name = 'MOCK_EMAIL';
  public sentEmails: EmailPayload[] = [];

  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    this.sentEmails.push(payload);
    return {
      id: `mock_email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      delivered: true,
    };
  }

  clear() {
    this.sentEmails = [];
  }
}
