import { Command } from '@nestjs/cqrs';
import { Task } from 'src/task/domain/models/task.entity';

type AddTaskCommandProps = {
  readonly restaurantId: string;
  readonly taskListId: string;
  readonly label: string;
  readonly ownerId: string;
};

export class AddTaskCommand extends Command<Task> {
  constructor(public readonly props: AddTaskCommandProps) {
    super();
  }
}
