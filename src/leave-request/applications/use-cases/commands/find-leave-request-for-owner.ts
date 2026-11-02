import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import type { LeaveRequestRepository } from 'src/leave-request/data-access/leave-requests.repository';
import { LeaveRequest } from 'src/leave-request/domain/models/leave-request.entity';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';

// Retrouve la demande et vérifie que celui qui décide est le gérant du restaurant de l'employé.
export async function findLeaveRequestForOwner(
  leaveRequestId: string,
  ownerId: string,
  leaveRequestsRepository: LeaveRequestRepository,
  employeesRepository: EmployeesRepository,
  restaurantsRepository: RestaurantsRepository,
): Promise<LeaveRequest> {
  const leaveRequest = await leaveRequestsRepository.findById(leaveRequestId);
  if (!leaveRequest) {
    throw new NotFoundException('Leave request not found');
  }

  const employee = await employeesRepository.findById(leaveRequest.employeeId);
  if (!employee) {
    throw new NotFoundException('Employee not found');
  }

  const restaurant = await restaurantsRepository.findById(
    employee.restaurantId,
  );
  if (!restaurant || restaurant.ownerId !== ownerId) {
    throw new ForbiddenException('You are not the owner of this restaurant');
  }

  return leaveRequest;
}
