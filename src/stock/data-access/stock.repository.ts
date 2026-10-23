import { Product } from '../domain/models/product.entity';
import { Supplier } from '../domain/models/supplier.entity';

export interface StockRepository {
  findSupplierById(supplierId: string): Promise<Supplier | null>;
  findSupplierByName(
    restaurantId: string,
    name: string,
  ): Promise<Supplier | null>;
  findSuppliersByRestaurantId(restaurantId: string): Promise<Supplier[]>;
  createSupplier(supplier: Supplier): Promise<void>;
  createProduct(product: Product): Promise<void>;
}

export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
