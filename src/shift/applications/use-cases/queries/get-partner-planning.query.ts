import { Query } from '@nestjs/cqrs';
import { Shift } from 'src/shift/domain/models/shift.entity';

type GetPartnerPlanningProps = {
  userId: string;
};

export type PartnerPlanning = {
  myEmployeeId: string;
  partners: { id: string; firstName: string; lastName: string }[];
  shifts: Shift[];
};

export class GetPartnerPlanningQuery extends Query<PartnerPlanning> {
  constructor(public readonly props: GetPartnerPlanningProps) {
    super();
  }
}
