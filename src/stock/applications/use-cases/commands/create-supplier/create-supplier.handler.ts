import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from 'src/stock/data-access/stock.repository';
import { EmptySupplierNameError } from 'src/stock/domain/errors/stock.errors';
import { Supplier } from 'src/stock/domain/models/supplier.entity';
import { CreateSupplierCommand } from './create-supplier.command';

@CommandHandler(CreateSupplierCommand)
export class CreateSupplierHandler implements ICommandHandler<
  CreateSupplierCommand,
  Supplier
> {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(command: CreateSupplierCommand): Promise<Supplier> {
    const { restaurantId, ownerId, name, phone } = command.props;

    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce restaurant",
      );
    }

    let supplier: Supplier;
    try {
      supplier = new Supplier({
        id: randomUUID(),
        name,
        phone: phone ?? null,
        restaurantId,
        orderedAt: null,
        createdAt: new Date(),
      });
    } catch (error) {
      if (error instanceof EmptySupplierNameError) {
        throw new BadRequestException('Le nom du fournisseur est obligatoire');
      }
      throw error;
    }

    const existingSupplier = await this.stockRepository.findSupplierByName(
      restaurantId,
      supplier.name,
    );
    if (existingSupplier) {
      throw new ConflictException('Un fournisseur porte déjà ce nom');
    }

    try {
      await this.stockRepository.createSupplier(supplier);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Un fournisseur porte déjà ce nom');
      }
      throw error;
    }

    return supplier;
  }
}
