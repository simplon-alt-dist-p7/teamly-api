import { Query } from '@nestjs/cqrs';
import { LeaveStatus } from 'src/leave-request/domain/models/leave-request.entity';

export type TeamLeaveRequestView = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
  createdAt: Date;
  managerNote: string | null;
};

type GetTeamLeaveRequestsProps = {
  restaurantId: string;
  ownerId: string;
};

export class GetTeamLeaveRequestsQuery extends Query<TeamLeaveRequestView[]> {
  constructor(public readonly props: GetTeamLeaveRequestsProps) {
    super();
  }
}
