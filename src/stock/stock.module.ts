import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'prisma/prisma.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { CreateProductHandler } from './applications/use-cases/commands/create-product/create-product.handler';
import { CreateSupplierHandler } from './applications/use-cases/commands/create-supplier/create-supplier.handler';
import { GetProductsHandler } from './applications/use-cases/queries/get-products/get-products.handler';
import { GetSuppliersHandler } from './applications/use-cases/queries/get-suppliers/get-suppliers.handler';
import { StockPrismaRepository } from './data-access/adapters/stock-prisma.repository';
import { STOCK_REPOSITORY } from './data-access/stock.repository';
import { ProductController } from './presentation/controller/product.controller';
import { SupplierController } from './presentation/controller/supplier.controller';

@Module({
  imports: [CqrsModule, PrismaModule, RestaurantModule],
  providers: [
    { provide: STOCK_REPOSITORY, useClass: StockPrismaRepository },
    CreateSupplierHandler,
    GetSuppliersHandler,
    CreateProductHandler,
    GetProductsHandler,
  ],
  controllers: [SupplierController, ProductController],
})
export class StockModule {}
