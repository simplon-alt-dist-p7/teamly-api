import { Query } from '@nestjs/cqrs';
import { TaskList } from 'src/task/domain/models/task-list.entity';

type GetTaskListsByRestaurantProps = {
  readonly restaurantId: string;
  readonly ownerId: string;
};

export class GetTaskListsByRestaurantQuery extends Query<TaskList[]> {
  constructor(public readonly props: GetTaskListsByRestaurantProps) {
    super();
  }
}
