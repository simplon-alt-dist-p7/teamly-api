import {
  BadRequestException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from 'src/stock/data-access/stock.repository';
import {
  EmptyProductNameError,
  EmptyProductUnitError,
  NegativeMinQuantityError,
} from 'src/stock/domain/errors/stock.errors';
import { Product } from 'src/stock/domain/models/product.entity';
import { CreateProductCommand } from './create-product.command';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<
  CreateProductCommand,
  Product
> {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    const { restaurantId, ownerId, name, unit, minQuantity, supplierId } =
      command.props;

    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce restaurant",
      );
    }

    const supplier = await this.stockRepository.findSupplierById(supplierId);
    if (!supplier || supplier.restaurantId !== restaurantId) {
      throw new NotFoundException('Fournisseur introuvable');
    }

    try {
      const product = new Product({
        id: randomUUID(),
        name,
        unit,
        minQuantity,
        quantity: 0,
        countedAt: null,
        supplierId: supplier.id,
        createdAt: new Date(),
      });

      await this.stockRepository.createProduct(product);
      return product;
    } catch (error) {
      if (error instanceof EmptyProductNameError) {
        throw new BadRequestException('Le nom du produit est obligatoire');
      }
      if (error instanceof EmptyProductUnitError) {
        throw new BadRequestException("L'unité est obligatoire");
      }
      if (error instanceof NegativeMinQuantityError) {
        throw new BadRequestException(
          'La quantité minimale doit être positive ou nulle',
        );
      }
      throw error;
    }
  }
}
