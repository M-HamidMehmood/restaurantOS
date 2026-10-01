import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TablesModule } from '../tables/tables.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TablesModule, OrdersModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
