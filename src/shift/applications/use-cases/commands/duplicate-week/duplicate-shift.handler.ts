import {
  ConflictException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { addDays, endOfWeek, isWithinInterval, startOfWeek } from 'date-fns';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  SHIFT_REPOSITORY,
  type ShiftRepository,
} from 'src/shift/data-access/shifts.repository';
import { CreateShiftCommand } from '../create-shift/create-shift.command';
import { DuplicateWeekCommand } from './duplicate-shift.command';

@CommandHandler(DuplicateWeekCommand)
export class DuplicateWeekHandler implements ICommandHandler<DuplicateWeekCommand> {
  constructor(
    @Inject(SHIFT_REPOSITORY)
    private readonly shiftsRepository: ShiftRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
    private readonly commandBus: CommandBus,
  ) {}
  async execute(command: DuplicateWeekCommand) {
    const restaurant = await this.restaurantsRepository.findById(
      command.props.restaurantId,
    );
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (restaurant.ownerId !== command.props.ownerId) {
      throw new ForbiddenException('You are not the owner of this restaurant');
    }

    const allShifts = await this.shiftsRepository.findByRestaurantId(
      command.props.restaurantId,
    );

    const weekStart = startOfWeek(command.props.referenceDate, {
      weekStartsOn: 1,
    });
    const weekEnd = endOfWeek(command.props.referenceDate, { weekStartsOn: 1 });

    const weekShifts = allShifts.filter((shift) =>
      isWithinInterval(shift.timeRange.startTime, {
        start: weekStart,
        end: weekEnd,
      }),
    );

    for (const shift of weekShifts) {
      try {
        await this.commandBus.execute(
          new CreateShiftCommand(
            shift.employeeId,
            addDays(shift.startTime, 7),
            addDays(shift.endTime, 7),
            command.props.ownerId,
          ),
        );
      } catch (error) {
        if (error instanceof ConflictException) {
          continue;
        }
        throw error;
      }
    }
  }
}
