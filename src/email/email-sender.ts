export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export type EmailMessage = {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
};

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
