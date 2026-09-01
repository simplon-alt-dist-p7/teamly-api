// data-access/adapters/employees-prisma.repository.ts
import { Injectable } from '@nestjs/common';
import { Employee } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  EmployeeListRecord,
  EmployeesRepository,
} from '../employees.repository';

@Injectable()
export class EmployeesPrismaRepository implements EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    restaurantId: string;
    firstName: string;
    lastName: string;
  }): Promise<Employee> {
    return this.prisma.employee.create({ data });
  }

  async findByRestaurantId(
    restaurantId: string,
  ): Promise<EmployeeListRecord[]> {
    const employees = await this.prisma.employee.findMany({
      where: { restaurantId },
      include: {
        user: { select: { email: true } },
      },
    });

    return employees.map((employee) => ({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      restaurantId: employee.restaurantId,
      email: employee.user.email,
    }));
  }

  async findById(employeeId: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { id: employeeId } });
  }
}
