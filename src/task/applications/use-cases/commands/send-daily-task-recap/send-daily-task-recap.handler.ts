import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { EmailSender } from 'src/email/email-sender';
import { EMAIL_SENDER } from 'src/email/email-sender';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  TASK_LISTS_REPOSITORY,
  type TaskListsRepository,
} from 'src/task/data-access/task-lists.repository';
import { dailyTaskRecapEmail } from 'src/task/emails/daily-task-recap.email';
import { SendDailyTaskRecapCommand } from './send-daily-task-recap.command';

@CommandHandler(SendDailyTaskRecapCommand)
export class SendDailyTaskRecapHandler implements ICommandHandler<
  SendDailyTaskRecapCommand,
  void
> {
  constructor(
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
    @Inject(TASK_LISTS_REPOSITORY)
    private readonly taskListsRepository: TaskListsRepository,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
  ) {}

  async execute(command: SendDailyTaskRecapCommand): Promise<void> {
    const { day } = command.props;
    const restaurants = await this.restaurantsRepository.findAll();

    for (const restaurant of restaurants) {
      const taskLists = await this.taskListsRepository.findByRestaurantId(
        restaurant.id,
        day,
      );
      const lists = taskLists
        .map((taskList) => ({
          name: taskList.name,
          tasks: taskList.tasks
            .filter((task) => task.requiresValidation)
            .map((task) => ({
              label: task.label,
              employeeFirstName: task.todayCheck?.employeeFirstName,
              employeeLastName: task.todayCheck?.employeeLastName,
              checkedAt: task.todayCheck?.checkedAt,
            })),
        }))
        .filter((taskList) => taskList.tasks.length > 0);

      if (lists.length === 0) {
        continue;
      }

      try {
        await this.emailSender.send(
          dailyTaskRecapEmail({
            to: restaurant.ownerEmail,
            restaurantName: restaurant.name,
            day,
            lists,
          }),
        );
      } catch (error) {
        console.error(
          `Échec de l'envoi du récap pour ${restaurant.name} :`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }
}
