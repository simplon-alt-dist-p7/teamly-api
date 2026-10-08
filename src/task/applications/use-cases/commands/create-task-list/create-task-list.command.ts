import { Command } from '@nestjs/cqrs';
import { TaskList } from 'src/task/domain/models/task-list.entity';

type CreateTaskListCommandProps = {
  readonly restaurantId: string;
  readonly name: string;
  readonly ownerId: string;
};

export class CreateTaskListCommand extends Command<TaskList> {
  constructor(public readonly props: CreateTaskListCommandProps) {
    super();
  }
}
