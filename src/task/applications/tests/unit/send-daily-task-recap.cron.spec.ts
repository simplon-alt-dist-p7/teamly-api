import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { SendDailyTaskRecapCommand } from '../../use-cases/commands/send-daily-task-recap/send-daily-task-recap.command';
import { SendDailyTaskRecapCron } from 'src/task/presentation/cron/send-daily-task-recap.cron';

jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
}));

describe('SendDailyTaskRecapCron', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends the recap for the Paris day at 23:45', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-11T21:45:00.000Z'));

    const execute = jest.fn().mockResolvedValue(undefined);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendDailyTaskRecapCron,
        { provide: CommandBus, useValue: { execute } },
      ],
    }).compile();
    const cron = module.get(SendDailyTaskRecapCron);

    await cron.sendDailyTaskRecap();

    const command = execute.mock.calls[0][0] as SendDailyTaskRecapCommand;
    expect(command.props.day).toEqual(new Date('2026-10-11T00:00:00.000Z'));
  });
});
