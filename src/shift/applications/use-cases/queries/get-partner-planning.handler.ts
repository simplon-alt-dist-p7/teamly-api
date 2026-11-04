import { ForbiddenException, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  SHIFT_REPOSITORY,
  type ShiftRepository,
} from 'src/shift/data-access/shifts.repository';
import { isPartnerPlanning } from 'src/shift/partner-planning';
import {
  GetPartnerPlanningQuery,
  PartnerPlanning,
} from './get-partner-planning.query';

@QueryHandler(GetPartnerPlanningQuery)
export class GetPartnerPlanningHandler implements IQueryHandler<
  GetPartnerPlanningQuery,
  PartnerPlanning
> {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    @Inject(SHIFT_REPOSITORY)
    private readonly shiftsRepository: ShiftRepository,
  ) {}

  async execute(query: GetPartnerPlanningQuery): Promise<PartnerPlanning> {
    const me = await this.employeesRepository.findByUserId(query.props.userId);

    if (!me || !isPartnerPlanning(me.restaurantId)) {
      throw new ForbiddenException('Planning des associés non disponible');
    }

    const partners = await this.employeesRepository.findByRestaurantId(
      me.restaurantId,
    );
    const shifts = await this.shiftsRepository.findByRestaurantId(
      me.restaurantId,
    );

    return {
      myEmployeeId: me.id,
      partners: partners.map(({ id, firstName, lastName }) => ({
        id,
        firstName,
        lastName,
      })),
      shifts,
    };
  }
}
