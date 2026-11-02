import { Query } from '@nestjs/cqrs';
import { LeaveRequest } from 'src/leave-request/domain/models/leave-request.entity';

export class GetMyLeaveRequestsQuery extends Query<LeaveRequest[]> {
  constructor(public readonly userId: string) {
    super();
  }
}
