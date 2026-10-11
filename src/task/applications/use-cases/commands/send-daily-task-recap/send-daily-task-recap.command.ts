import { Command } from '@nestjs/cqrs';

type SendDailyTaskRecapCommandProps = {
  readonly day: Date;
};

export class SendDailyTaskRecapCommand extends Command<void> {
  constructor(public readonly props: SendDailyTaskRecapCommandProps) {
    super();
  }
}
