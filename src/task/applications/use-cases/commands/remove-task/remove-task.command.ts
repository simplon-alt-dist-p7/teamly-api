import { Command } from '@nestjs/cqrs';

type RemoveTaskCommandProps = {
  readonly restaurantId: string;
  readonly taskListId: string;
  readonly taskId: string;
  readonly ownerId: string;
};

export class RemoveTaskCommand extends Command<void> {
  constructor(public readonly props: RemoveTaskCommandProps) {
    super();
  }
}
