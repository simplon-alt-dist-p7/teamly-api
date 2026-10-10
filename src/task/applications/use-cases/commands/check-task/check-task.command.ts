import { Command } from '@nestjs/cqrs';
import { TaskCheck } from 'src/task/domain/models/task-check.entity';
type CheckTaskCommandProps = {
  readonly taskId: string;
  readonly userId: string;
};
export class CheckTaskCommand extends Command<TaskCheck> {
  constructor(public readonly props: CheckTaskCommandProps) {
    super();
  }
}
