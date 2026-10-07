import { Module } from '@nestjs/common';
import { BrevoEmailSender } from './adapters/brevo-email.sender';
import { ConsoleEmailSender } from './adapters/console-email.sender';
import { EMAIL_SENDER } from './email-sender';

@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      useClass: process.env.BREVO_API_KEY
        ? BrevoEmailSender
        : ConsoleEmailSender,
    },
  ],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
