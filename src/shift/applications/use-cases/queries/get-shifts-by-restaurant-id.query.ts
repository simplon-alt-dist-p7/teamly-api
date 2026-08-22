import { Query } from '@nestjs/cqrs';
import { Shift } from 'src/shift/domain/models/shift.entity';

type GetShiftsByRestaurantProps = {
  restaurantId: string;
  ownerId: string;
};

export class GetShiftsByRestaurantQuery extends Query<Shift[]> {
  constructor(public readonly props: GetShiftsByRestaurantProps) {
    super();
  }
}
