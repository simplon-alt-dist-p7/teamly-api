import { Product } from '../domain/models/product.entity';
import { Supplier } from '../domain/models/supplier.entity';

export type StockSending = {
  readonly sentAt: Date | null;
  readonly sentBy: string | null;
};

export interface StockRepository {
  findSupplierById(supplierId: string): Promise<Supplier | null>;
  findSupplierByName(
    restaurantId: string,
    name: string,
  ): Promise<Supplier | null>;
  findSuppliersByRestaurantId(restaurantId: string): Promise<Supplier[]>;
  findProductsByRestaurantId(restaurantId: string): Promise<Product[]>;
  createSupplier(supplier: Supplier): Promise<void>;
  createProduct(product: Product): Promise<void>;
  findProductById(productId: string): Promise<Product | null>;
  updateProduct(product: Product): Promise<void>;
  updateProductCount(product: Product): Promise<void>;
  findStockSending(restaurantId: string): Promise<StockSending>;
  saveStockSending(restaurantId: string, sending: StockSending): Promise<void>;
}

export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
