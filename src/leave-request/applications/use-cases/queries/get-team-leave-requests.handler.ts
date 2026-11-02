import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  LEAVE_REQUEST_REPOSITORY,
  type LeaveRequestRepository,
} from 'src/leave-request/data-access/leave-requests.repository';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  GetTeamLeaveRequestsQuery,
  TeamLeaveRequestView,
} from './get-team-leave-requests.query';

@QueryHandler(GetTeamLeaveRequestsQuery)
export class GetTeamLeaveRequestsHandler implements IQueryHandler<
  GetTeamLeaveRequestsQuery,
  TeamLeaveRequestView[]
> {
  constructor(
    @Inject(LEAVE_REQUEST_REPOSITORY)
    private readonly leaveRequestsRepository: LeaveRequestRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(
    query: GetTeamLeaveRequestsQuery,
  ): Promise<TeamLeaveRequestView[]> {
    const restaurant = await this.restaurantsRepository.findById(
      query.props.restaurantId,
    );
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (restaurant.ownerId !== query.props.ownerId) {
      throw new ForbiddenException('You are not the owner of this restaurant');
    }

    const teamLeaveRequests =
      await this.leaveRequestsRepository.findByRestaurantId(restaurant.id);

    return teamLeaveRequests.map(({ leaveRequest, firstName, lastName }) => ({
      id: leaveRequest.id,
      employeeId: leaveRequest.employeeId,
      firstName,
      lastName,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      status: leaveRequest.status,
      createdAt: leaveRequest.createdAt,
      managerNote: leaveRequest.managerNote,
    }));
  }
}
