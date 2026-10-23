import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/models/product.entity';
import { Supplier } from '../../domain/models/supplier.entity';
import { StockRepository } from '../stock.repository';

@Injectable()
export class StockInMemoryRepository implements StockRepository {
  suppliers: Supplier[] = [];
  products: Product[] = [];

  async findSupplierById(supplierId: string): Promise<Supplier | null> {
    return (
      this.suppliers.find((supplier) => supplier.id === supplierId) ?? null
    );
  }

  async findSupplierByName(
    restaurantId: string,
    name: string,
  ): Promise<Supplier | null> {
    const normalizedName = name.toLowerCase();

    return (
      this.suppliers.find(
        (supplier) =>
          supplier.restaurantId === restaurantId &&
          supplier.name.toLowerCase() === normalizedName,
      ) ?? null
    );
  }

  async findSuppliersByRestaurantId(restaurantId: string): Promise<Supplier[]> {
    return this.suppliers
      .filter((supplier) => supplier.restaurantId === restaurantId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createSupplier(supplier: Supplier): Promise<void> {
    this.suppliers.push(supplier);
  }

  async createProduct(product: Product): Promise<void> {
    this.products.push(product);
  }
}
