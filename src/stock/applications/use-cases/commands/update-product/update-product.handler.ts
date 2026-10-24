import {
  BadRequestException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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
import { UpdateProductCommand } from './update-product.command';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<
  UpdateProductCommand,
  Product
> {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<Product> {
    const { restaurantId, ownerId, productId, name, unit, minQuantity } =
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

    const product = await this.stockRepository.findProductById(productId);
    const supplier = product
      ? await this.stockRepository.findSupplierById(product.supplierId)
      : null;
    if (!product || !supplier || supplier.restaurantId !== restaurantId) {
      throw new NotFoundException('Produit introuvable');
    }

    try {
      const updatedProduct = product.update({ name, unit, minQuantity });
      await this.stockRepository.updateProduct(updatedProduct);
      return updatedProduct;
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
