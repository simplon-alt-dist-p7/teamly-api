import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { RestaurantsInMemoryRepository } from '../../data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from '../../data-access/restaurants.repository';
import { RestaurantService } from '../../restaurant.service';
import { RestaurantDataAccessUnitTestModule } from '../utils/restaurant-data-access-unit.test-module';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let repo: RestaurantsInMemoryRepository;

  const validRestaurantData = {
    name: 'Le Bistrot',
    address: '10 rue de Paris, 75001 Paris',
    phone: '+33612345678',
    email: 'contact@lebistrot.fr',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RestaurantDataAccessUnitTestModule],
      providers: [RestaurantService],
    }).compile();

    service = module.get(RestaurantService);
    repo = module.get(RESTAURANTS_REPOSITORY);
    repo.restaurants = [];
  });

  it('should throw BadRequestException if name is missing', async () => {
    await expect(
      service.createRestaurant({ ...validRestaurantData, name: '' }, 'owner-1'),
    ).rejects.toThrow(BadRequestException);

    expect(repo.restaurants).toHaveLength(0);
  });
  it('should create and persist a restaurant', async () => {
    const result = await service.createRestaurant(
      validRestaurantData,
      'owner-1',
    );

    expect(repo.restaurants).toHaveLength(1);
    expect(result.name).toBe(validRestaurantData.name);
    expect(result.address).toBe(validRestaurantData.address);
    expect(result.phone).toBe(validRestaurantData.phone);
    expect(result.email).toBe(validRestaurantData.email);
    expect(result.ownerId).toBe('owner-1');
  });

  describe('findByOwnerId', () => {
    it('should throw BadRequestException if ownerId is missing', async () => {
      await expect(service.findByOwnerId('')).rejects.toThrow(
        BadRequestException,
      );

      expect(repo.restaurants).toHaveLength(0);
    });

    it('should return all restaurants, given ownerId linked to restaurant ', async () => {
      const ownerId = randomUUID();
      const otherOwnerId = randomUUID();

      await service.createRestaurant(
        { ...validRestaurantData, name: 'restaurantA' },
        ownerId,
      );

      await service.createRestaurant(
        { ...validRestaurantData, name: 'restaurantB' },
        ownerId,
      );

      await service.createRestaurant(
        { ...validRestaurantData, name: 'otherRestaurantC' },
        otherOwnerId,
      );

      const result = await service.findByOwnerId(ownerId);

      expect(result).toHaveLength(2);
      expect(result.every((restaurant) => restaurant.ownerId === ownerId)).toBe(
        true,
      );
      expect(result.map((r) => r.name).sort()).toEqual([
        'restaurantA',
        'restaurantB',
      ]);
    });

    it('returns empty array when owner has no restaurants', async () => {
      const result = await service.findByOwnerId(randomUUID());
      expect(result).toEqual([]);
    });
  });
});
