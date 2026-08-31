import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaModule } from 'prisma/prisma.module';
import { PrismaService } from 'prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import {
  RESTAURANTS_REPOSITORY,
  RestaurantsRepository,
} from 'src/restaurant/data-access/restaurants.repository';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { EmployeesPrismaRepository } from '../data-access/adapters/employees-prisma.repository';
import { EMPLOYEES_REPOSITORY } from '../data-access/employees.repository';
import { EmployeeService } from '../employee.service';

describe('employee service ', () => {
  let service: EmployeeService;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurants: RestaurantsRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule, RestaurantModule, PrismaModule],
      providers: [
        EmployeeService,
        { provide: EMPLOYEES_REPOSITORY, useClass: EmployeesPrismaRepository },
      ],
    }).compile();

    service = module.get(EmployeeService);
    prisma = module.get(PrismaService);
    authService = module.get(AuthService);
    restaurants = module.get(RESTAURANTS_REPOSITORY);

    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.shift.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const employeeDto = {
    email: 'alice@test.com',
    password: 'secret123',
    firstName: 'Alice',
    lastName: 'Martin',
  };

  it('creates employee in DB when owner is valid', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const otherOwner = await authService.createUser({
      email: 'other@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const restaurant = await restaurants.create(
      {
        name: 'test',
        email: 'test@mail.com',
        address: '33 rue sadi carnot',
        phone: '0767395015',
      },
      owner.id,
    );

    await restaurants.create(
      {
        name: 'autre',
        email: 'autre@mail.com',
        address: '1 rue distractor',
        phone: '0612345678',
      },
      otherOwner.id,
    );

    const employee = await service.createEmployee(
      restaurant.id,
      employeeDto,
      owner.id,
    );

    expect(employee.firstName).toBe('Alice');
    expect(employee.restaurantId).toBe(restaurant.id);

    const userSaved = await prisma.employee.findUnique({
      where: { id: employee.id },
    });
    expect(userSaved).not.toBeNull();

    const allEmployees = await prisma.employee.findMany();
    expect(allEmployees).toHaveLength(1);
    expect(allEmployees[0].restaurantId).toBe(restaurant.id);
  });

  it('does not create employee in DB when owner is not valid', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const otherOwner = await authService.createUser({
      email: 'otherOwner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const restaurant = await restaurants.create(
      {
        name: 'test',
        email: 'restaurant@mail.com',
        address: '33 rue sadi carnot',
        phone: '0767395015',
      },
      owner.id,
    );

    await restaurants.create(
      {
        name: 'test',
        email: 'otherRestaurant@mail.com',
        address: '33 rue sadi carnot',
        phone: '0767395015',
      },
      otherOwner.id,
    );

    await expect(
      service.createEmployee(restaurant.id, employeeDto, otherOwner.id),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when restaurant does not exist', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    await expect(
      service.createEmployee(
        '00000000-0000-0000-0000-000000000000',
        employeeDto,
        owner.id,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not create employee if email already exists', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const restaurant = await restaurants.create(
      {
        name: 'test',
        email: 'test@mail.com',
        address: '33 rue sadi carnot',
        phone: '0767395015',
      },
      owner.id,
    );

    await restaurants.create(
      {
        name: 'autre',
        email: 'autre@mail.com',
        address: '1 rue distractor',
        phone: '0612345678',
      },
      owner.id,
    );

    await authService.createUser({
      email: employeeDto.email,
      password: 'test123',
      role: Role.EMPLOYEE,
    });

    await expect(
      service.createEmployee(restaurant.id, employeeDto, owner.id),
    ).rejects.toThrow(BadRequestException);

    expect(await prisma.employee.findMany()).toHaveLength(0);
  });

  describe('getEmployeeByRestaurant', () => {
    const employeeDto = {
      email: 'alice@test.com',
      password: 'secret123',
      firstName: 'Alice',
      lastName: 'Martin',
    };

    it('should return all employees, given restaurantId', async () => {
      const owner = await authService.createUser({
        email: 'owner@test.com',
        password: 'secret123',
        role: Role.OWNER,
      });

      const ownerOther = await authService.createUser({
        email: 'otherOwner@test.com',
        password: 'secret123',
        role: Role.OWNER,
      });

      const restaurant = await restaurants.create(
        {
          name: 'test',
          email: 'test@mail.com',
          address: '33 rue sadi carnot',
          phone: '0767395015',
        },
        owner.id,
      );

      const otherRestaurant = await restaurants.create(
        {
          name: 'test',
          email: 'otherTest@mail.com',
          address: '33 rue sadi carnot',
          phone: '0767395015',
        },
        ownerOther.id,
      );

      await service.createEmployee(
        restaurant.id,
        { ...employeeDto, email: 'employee1@mail.com' },
        owner.id,
      );

      await service.createEmployee(
        restaurant.id,
        { ...employeeDto, email: 'employee2@mail.com' },
        owner.id,
      );

      await service.createEmployee(
        otherRestaurant.id,
        employeeDto,
        ownerOther.id,
      );

      const employeeFromRestaurant = await service.getEmployeesByRestaurant(
        restaurant.id,
        owner.id,
      );

      expect(
        employeeFromRestaurant.every(
          (employee) => employee.restaurantId === restaurant.id,
        ),
      );

      expect(employeeFromRestaurant).toHaveLength(2);
      expect(
        employeeFromRestaurant.every((e) => e.restaurantId === restaurant.id),
      ).toBe(true);
    });

    it('throws ForbiddenException when owner is not valid', async () => {
      const owner = await authService.createUser({
        email: 'owner@test.com',
        password: 'secret123',
        role: Role.OWNER,
      });

      const otherOwner = await authService.createUser({
        email: 'otherOwner@test.com',
        password: 'secret123',
        role: Role.OWNER,
      });

      const restaurant = await restaurants.create(
        {
          name: 'test',
          email: 'test@mail.com',
          address: '33 rue sadi carnot',
          phone: '0767395015',
        },
        owner.id,
      );

      await expect(
        service.getEmployeesByRestaurant(restaurant.id, otherOwner.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when restaurant does not exist', async () => {
      const owner = await authService.createUser({
        email: 'owner@test.com',
        password: 'secret123',
        role: Role.OWNER,
      });

      await expect(
        service.getEmployeesByRestaurant(
          '00000000-0000-0000-0000-000000000000',
          owner.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns empty array when restaurant has no employees', async () => {
      const owner = await authService.createUser({
        email: 'owner@test.com',
        password: 'secret123',
        role: Role.OWNER,
      });

      const restaurant = await restaurants.create(
        {
          name: 'test',
          email: 'test@mail.com',
          address: '33 rue sadi carnot',
          phone: '0767395015',
        },
        owner.id,
      );

      const employees = await service.getEmployeesByRestaurant(
        restaurant.id,
        owner.id,
      );

      expect(employees).toHaveLength(0);
    });
  });
});
