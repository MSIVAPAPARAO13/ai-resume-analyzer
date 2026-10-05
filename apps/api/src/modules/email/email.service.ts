import { env } from '../../config/env.js';
import type { IEmailProvider } from './email.interface.js';
import { MockEmailProvider } from './mock-email.provider.js';
import { ResendEmailProvider } from './resend-email.provider.js';

export class EmailService {
  private provider: IEmailProvider;

  constructor(provider?: IEmailProvider) {
    if (provider) {
      this.provider = provider;
    } else if (env.RESEND_API_KEY && env.NODE_ENV !== 'test') {
      this.provider = new ResendEmailProvider();
    } else {
      this.provider = new MockEmailProvider();
    }
  }

  getProvider(): IEmailProvider {
    return this.provider;
  }

  setProvider(provider: IEmailProvider) {
    this.provider = provider;
  }

  async sendInterviewScheduledEmail(params: {
    to: string;
    userName: string;
    interviewTitle: string;
    company?: string | null;
    role: string;
    scheduledTime: string;
  }) {
    const { to, userName, interviewTitle, company, role, scheduledTime } =
      params;
    const companyText = company ? ` at ${company}` : '';

    return this.provider.sendEmail({
      to,
      subject: `Interview Scheduled: ${role}${companyText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Interview Scheduled</h2>
          <p>Hi ${userName},</p>
          <p>Your interview preparation session or live interview has been confirmed:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Session:</strong> ${interviewTitle}</p>
            <p><strong>Target Role:</strong> ${role}${companyText}</p>
            <p><strong>Time:</strong> ${new Date(scheduledTime).toLocaleString()}</p>
          </div>
          <p>Prepare thoroughly in Resumind to ensure you are ready with concrete, evidence-backed answers.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Best regards,<br/>The Resumind Team</p>
        </div>
      `,
    });
  }

  async sendInterviewReminderEmail(params: {
    to: string;
    userName: string;
    interviewTitle: string;
    role: string;
    scheduledTime: string;
  }) {
    const { to, userName, interviewTitle, role, scheduledTime } = params;

    return this.provider.sendEmail({
      to,
      subject: `Reminder: Upcoming Interview for ${role}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d97706;">Interview Reminder</h2>
          <p>Hi ${userName},</p>
          <p>This is a quick reminder about your scheduled interview for <strong>${role}</strong>.</p>
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p><strong>Session:</strong> ${interviewTitle}</p>
            <p><strong>Time:</strong> ${new Date(scheduledTime).toLocaleString()}</p>
          </div>
          <p>Review your STAR stories, technical preparation checklist, and elevator pitch.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Best regards,<br/>The Resumind Team</p>
        </div>
      `,
    });
  }

  async sendInterviewPreparationCompletedEmail(params: {
    to: string;
    userName: string;
    interviewTitle: string;
    overallScore: number;
  }) {
    const { to, userName, interviewTitle, overallScore } = params;

    return this.provider.sendEmail({
      to,
      subject: `Preparation Complete: ${interviewTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">Interview Preparation Complete</h2>
          <p>Hi ${userName},</p>
          <p>Congratulations on completing your interview preparation session <strong>${interviewTitle}</strong>!</p>
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <p><strong>Preparation Score:</strong> ${overallScore} / 100</p>
          </div>
          <p>Check your final readiness report in Resumind to review strongest areas and evidence gaps.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Best regards,<br/>The Resumind Team</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
