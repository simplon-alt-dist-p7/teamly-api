import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Product } from '../../domain/models/product.entity';
import { Supplier } from '../../domain/models/supplier.entity';
import { StockRepository, StockSending } from '../stock.repository';

@Injectable()
export class StockPrismaRepository implements StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSupplierById(supplierId: string): Promise<Supplier | null> {
    const row = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    return row ? this.toDomain(row) : null;
  }

  async findSupplierByName(
    restaurantId: string,
    name: string,
  ): Promise<Supplier | null> {
    const row = await this.prisma.supplier.findFirst({
      where: {
        restaurantId,
        name: { equals: name, mode: 'insensitive' },
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async findSuppliersByRestaurantId(restaurantId: string): Promise<Supplier[]> {
    const rows = await this.prisma.supplier.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findProductsByRestaurantId(restaurantId: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: { supplier: { restaurantId } },
      orderBy: { name: 'asc' },
    });

    return rows.map((row) => this.toProduct(row));
  }

  async findProductById(productId: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    return row ? this.toProduct(row) : null;
  }

  async updateProduct(product: Product): Promise<void> {
    await this.prisma.product.update({
      where: { id: product.id },
      data: {
        name: product.name,
        unit: product.unit,
        minQuantity: product.minQuantity,
      },
    });
  }

  async updateProductCount(product: Product): Promise<void> {
    await this.prisma.product.update({
      where: { id: product.id },
      data: { quantity: product.quantity, countedAt: product.countedAt },
    });
  }

  async findStockSending(restaurantId: string): Promise<StockSending> {
    const row = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { stockSentAt: true, stockSentBy: true },
    });

    return {
      sentAt: row?.stockSentAt ?? null,
      sentBy: row?.stockSentBy ?? null,
    };
  }

  async saveStockSending(
    restaurantId: string,
    sending: StockSending,
  ): Promise<void> {
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { stockSentAt: sending.sentAt, stockSentBy: sending.sentBy },
    });
  }

  async createSupplier(supplier: Supplier): Promise<void> {
    await this.prisma.supplier.create({
      data: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        restaurantId: supplier.restaurantId,
        orderedAt: supplier.orderedAt,
        createdAt: supplier.createdAt,
      },
    });
  }

  async createProduct(product: Product): Promise<void> {
    await this.prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        unit: product.unit,
        minQuantity: product.minQuantity,
        quantity: product.quantity,
        countedAt: product.countedAt,
        supplierId: product.supplierId,
        createdAt: product.createdAt,
      },
    });
  }

  private toProduct(row: {
    id: string;
    name: string;
    unit: string;
    minQuantity: number;
    quantity: number;
    countedAt: Date | null;
    supplierId: string;
    createdAt: Date;
  }): Product {
    return new Product({
      id: row.id,
      name: row.name,
      unit: row.unit,
      minQuantity: row.minQuantity,
      quantity: row.quantity,
      countedAt: row.countedAt,
      supplierId: row.supplierId,
      createdAt: row.createdAt,
    });
  }

  private toDomain(row: {
    id: string;
    name: string;
    phone: string | null;
    restaurantId: string;
    orderedAt: Date | null;
    createdAt: Date;
  }): Supplier {
    return new Supplier({
      id: row.id,
      name: row.name,
      phone: row.phone,
      restaurantId: row.restaurantId,
      orderedAt: row.orderedAt,
      createdAt: row.createdAt,
    });
  }
}
