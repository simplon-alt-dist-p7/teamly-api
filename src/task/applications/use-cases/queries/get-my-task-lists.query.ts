import { Query } from '@nestjs/cqrs';
import { TaskList } from 'src/task/domain/models/task-list.entity';

type GetMyTaskListsProps = {
  readonly userId: string;
};

export class GetMyTaskListsQuery extends Query<TaskList[]> {
  constructor(public readonly props: GetMyTaskListsProps) {
    super();
  }
}
