import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SseService } from './sse.service';
import { TablesModule } from '../tables/tables.module';

@Module({
  imports: [TablesModule],
  controllers: [OrdersController],
  providers: [OrdersService, SseService],
  exports: [OrdersService, SseService],
})
export class OrdersModule {}
