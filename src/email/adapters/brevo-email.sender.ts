import { BrevoClient } from '@getbrevo/brevo';
import { Injectable } from '@nestjs/common';
import { EmailMessage, EmailSender } from '../email-sender';

@Injectable()
export class BrevoEmailSender implements EmailSender {
  private readonly client = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY ?? '',
  });

  async send(message: EmailMessage): Promise<void> {
    const fromEmail = process.env.MAIL_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error('MAIL_FROM_EMAIL is not set');
    }

    await this.client.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.MAIL_FROM_NAME ?? 'Teamly',
        email: fromEmail,
      },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
    });
  }
}
