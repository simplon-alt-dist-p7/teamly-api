import { Query } from '@nestjs/cqrs';
import { Shift } from 'src/shift/domain/models/shift.entity';

type GetMyShiftsProps = {
  userId: string;
  startDate: Date;
};

export class GetMyShiftsQuery extends Query<Shift[]> {
  constructor(public readonly props: GetMyShiftsProps) {
    super();
  }
}
