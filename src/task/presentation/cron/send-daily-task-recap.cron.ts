import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';
import { SendDailyTaskRecapCommand } from 'src/task/applications/use-cases/commands/send-daily-task-recap/send-daily-task-recap.command';
import { getCalendarDay } from 'src/task/domain/services/get-calendar-day';

@Injectable()
export class SendDailyTaskRecapCron {
  constructor(private readonly commandBus: CommandBus) {}

  @Cron('45 23 * * *', { timeZone: 'Europe/Paris' })
  sendDailyTaskRecap(): Promise<void> {
    const day = getCalendarDay(new Date(), 'Europe/Paris');

    return this.commandBus.execute(new SendDailyTaskRecapCommand({ day }));
  }
}
