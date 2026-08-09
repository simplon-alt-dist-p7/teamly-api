import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { RestaurantService } from '../../restaurant.service';

describe('RestaurantService', () => {
  let service: RestaurantService;

  const prismaMock = {
    restaurant: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException if name is missing', async () => {
    await expect(
      service.createRestaurant({ name: '' }, 'owner-1'),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.restaurant.create).not.toHaveBeenCalled();
  });
});
