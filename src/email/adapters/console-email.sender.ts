import { Injectable } from '@nestjs/common';
import { EmailMessage, EmailSender } from '../email-sender';

@Injectable()
export class ConsoleEmailSender implements EmailSender {
  send(message: EmailMessage): Promise<void> {
    console.log(`Email à ${message.to} : ${message.subject}\n${message.text}`);
    return Promise.resolve();
  }
}
