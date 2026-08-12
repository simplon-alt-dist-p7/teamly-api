// employee.service.ts
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import type { RestaurantsRepository } from '../restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from '../restaurant/data-access/restaurants.repository';
import type { EmployeesRepository } from './data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from './data-access/employees.repository';
import { CreateEmployeeRequest } from './dtos/request/create-employee-dto';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly authService: AuthService,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
  ) {}

  async createEmployee(
    restaurantId: string,
    data: CreateEmployeeRequest,
    ownerId: string,
  ) {
    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce restaurant",
      );
    }

    const user = await this.authService.createUser({
      email: data.email,
      password: data.password,
      role: Role.EMPLOYEE,
    });

    return this.employeesRepository.create({
      userId: user.id,
      restaurantId,
      firstName: data.firstName,
      lastName: data.lastName,
    });
  }

  async getEmployeesByRestaurant(restaurantId: string, ownerId: string) {
    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce restaurant",
      );
    }

    return this.employeesRepository.findByRestaurantId(restaurantId);
  }
}
