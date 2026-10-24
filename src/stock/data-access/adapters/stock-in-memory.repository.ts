import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/models/product.entity';
import { Supplier } from '../../domain/models/supplier.entity';
import { StockRepository, StockSending } from '../stock.repository';

@Injectable()
export class StockInMemoryRepository implements StockRepository {
  suppliers: Supplier[] = [];
  products: Product[] = [];
  sendings = new Map<string, StockSending>();

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
    return this.suppliers.filter(
      (supplier) => supplier.restaurantId === restaurantId,
    );
  }

  async findProductsByRestaurantId(restaurantId: string): Promise<Product[]> {
    const supplierIds = this.suppliers
      .filter((supplier) => supplier.restaurantId === restaurantId)
      .map((supplier) => supplier.id);

    return this.products.filter((product) =>
      supplierIds.includes(product.supplierId),
    );
  }

  async createSupplier(supplier: Supplier): Promise<void> {
    this.suppliers.push(supplier);
  }

  async createProduct(product: Product): Promise<void> {
    this.products.push(product);
  }

  async findProductById(productId: string): Promise<Product | null> {
    return this.products.find((product) => product.id === productId) ?? null;
  }

  async updateProduct(product: Product): Promise<void> {
    this.products = this.products.map((current) =>
      current.id === product.id ? product : current,
    );
  }

  async updateProductCount(product: Product): Promise<void> {
    this.products = this.products.map((current) =>
      current.id === product.id ? product : current,
    );
  }

  async findStockSending(restaurantId: string): Promise<StockSending> {
    return this.sendings.get(restaurantId) ?? { sentAt: null, sentBy: null };
  }

  async saveStockSending(
    restaurantId: string,
    sending: StockSending,
  ): Promise<void> {
    this.sendings.set(restaurantId, sending);
  }
}
