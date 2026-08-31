import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaModule } from 'prisma/prisma.module';
import { PrismaService } from 'prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { RestaurantService } from 'src/restaurant/restaurant.service';

describe('RestaurantService Integration', () => {
  let service: RestaurantService;
  let prisma: PrismaService;
  let authService: AuthService;

  const validRestaurantData = {
    name: 'Le Bistrot',
    address: '10 rue de Paris, 75001 Paris',
    phone: '+33612345678',
    email: 'contact@lebistrot.fr',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule, RestaurantModule, PrismaModule],
    }).compile();

    service = module.get(RestaurantService);
    prisma = module.get(PrismaService);
    authService = module.get(AuthService);

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

  describe('createRestaurant', () => {
    it('creates restaurant in DB when owner is valid', async () => {
      const owner = await authService.createUser({
        email: 'owner@test.com',
        password: 'secret123',
        role: Role.OWNER,
      });

      const result = await service.createRestaurant(
        validRestaurantData,
        owner.id,
      );

      expect(result.name).toBe(validRestaurantData.name);
      expect(result.ownerId).toBe(owner.id);

      const saved = await prisma.restaurant.findUnique({
        where: { id: result.id },
      });
      expect(saved).not.toBeNull();
      expect(saved?.ownerId).toBe(owner.id);
    });

    it('does not create restaurant in DB when name is missing', async () => {
      const owner = await authService.createUser({
        email: 'owner@test.com',
        password: 'secret123',
        role: Role.OWNER,
      });

      await expect(
        service.createRestaurant(
          { ...validRestaurantData, name: '' },
          owner.id,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(await prisma.restaurant.findMany()).toHaveLength(0);
    });
  });

  describe('findByOwnerId', () => {
    it('returns all restaurants for the given owner', async () => {
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

      await service.createRestaurant(
        { ...validRestaurantData, name: 'restaurantA' },
        owner.id,
      );

      await service.createRestaurant(
        { ...validRestaurantData, name: 'restaurantB', email: 'b@test.com' },
        owner.id,
      );

      await service.createRestaurant(
        {
          ...validRestaurantData,
          name: 'otherRestaurantC',
          email: 'c@test.com',
        },
        otherOwner.id,
      );

      const result = await service.findByOwnerId(owner.id);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.ownerId === owner.id)).toBe(true);
      expect(result.map((r) => r.name).sort()).toEqual([
        'restaurantA',
        'restaurantB',
      ]);
    });

    it('returns empty array when owner has no restaurants', async () => {
      const owner = await authService.createUser({
        email: 'owner@test.com',
        password: 'secret123',
        role: Role.OWNER,
      });

      const result = await service.findByOwnerId(owner.id);

      expect(result).toEqual([]);
    });
  });
});
