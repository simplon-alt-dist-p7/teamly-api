import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'prisma/prisma.module';
import { EmployeeModule } from 'src/employee/employee.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { CountProductHandler } from './applications/use-cases/commands/count-product/count-product.handler';
import { CreateProductHandler } from './applications/use-cases/commands/create-product/create-product.handler';
import { CreateSupplierHandler } from './applications/use-cases/commands/create-supplier/create-supplier.handler';
import { SendStockHandler } from './applications/use-cases/commands/send-stock/send-stock.handler';
import { GetMyStockHandler } from './applications/use-cases/queries/get-my-stock/get-my-stock.handler';
import { GetProductsHandler } from './applications/use-cases/queries/get-products/get-products.handler';
import { GetSuppliersHandler } from './applications/use-cases/queries/get-suppliers/get-suppliers.handler';
import { StockPrismaRepository } from './data-access/adapters/stock-prisma.repository';
import { STOCK_REPOSITORY } from './data-access/stock.repository';
import { MyStockController } from './presentation/controller/my-stock.controller';
import { ProductController } from './presentation/controller/product.controller';
import { SupplierController } from './presentation/controller/supplier.controller';

@Module({
  imports: [CqrsModule, PrismaModule, RestaurantModule, EmployeeModule],
  providers: [
    { provide: STOCK_REPOSITORY, useClass: StockPrismaRepository },
    CreateSupplierHandler,
    GetSuppliersHandler,
    CreateProductHandler,
    GetProductsHandler,
    GetMyStockHandler,
    CountProductHandler,
    SendStockHandler,
  ],
  controllers: [SupplierController, ProductController, MyStockController],
})
export class StockModule {}
