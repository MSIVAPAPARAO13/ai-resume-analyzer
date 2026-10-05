export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailResult {
  id: string;
  delivered: boolean;
}

export interface IEmailProvider {
  readonly name: string;
  sendEmail(payload: EmailPayload): Promise<EmailResult>;
}
