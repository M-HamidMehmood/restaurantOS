import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Sse,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { OrdersService } from './orders.service';
import { SseService, OrderStatusEvent } from './sse.service';
import { Public } from '../../common/decorators/public.decorator';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createOrderSchema,
  CreateOrderInput,
  updateOrderStatusSchema,
  UpdateOrderStatusInput,
} from '../../common/schemas/api.schemas';

@ApiTags('Orders & Checkout')
@Controller('api')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly sseService: SseService,
  ) {}

  /**
   * 2. POST /api/orders
   * Public endpoint. Validates table ID, calculates prices server-side against the DB,
   * creates the order and order items, and updates table status to 'occupied'.
   */
  @Post('orders')
  @Public()
  @UsePipes(new ZodValidationPipe(createOrderSchema))
  @ApiOperation({ summary: 'Dispatch and place a new customer table order' })
  @ApiResponse({ status: 201, description: 'Order successfully verified and queued in kitchen' })
  @ApiResponse({ status: 404, description: 'Table or menu item not found' })
  @ApiResponse({ status: 409, description: 'Dish out of stock (86 switch) or table billing' })
  async createOrder(@Body() body: CreateOrderInput) {
    return this.ordersService.createOrder(body);
  }

  /**
   * 3. GET /api/orders/table/:tableId
   * Fetches active, uncompleted orders for that table session.
   */
  @Get('orders/table/:tableId')
  @Public()
  @ApiOperation({ summary: 'Fetches active, uncompleted orders for that table session' })
  @ApiParam({ name: 'tableId', example: 'T-01', description: 'Table number, slug, or UUID' })
  @ApiResponse({ status: 200, description: 'List of active orders for the dining session' })
  async getActiveOrdersForTableSession(@Param('tableId') tableId: string) {
    return this.ordersService.getActiveOrdersForTable(tableId);
  }

  // Alias for backward compatibility with frontend
  @Get('tables/:tableId/active-orders')
  @Public()
  @ApiOperation({ summary: 'Retrieve active orders for table (alias)' })
  @ApiParam({ name: 'tableId', example: 'T-01' })
  async getActiveOrders(@Param('tableId') tableId: string) {
    return this.ordersService.getActiveOrdersForTable(tableId);
  }

  @Get('orders/:orderId')
  @Public()
  @ApiOperation({ summary: 'Retrieve single order details' })
  @ApiParam({ name: 'orderId', example: 'ORD-1234' })
  async getOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }

  @Patch('orders/:orderId/status')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ZodValidationPipe(updateOrderStatusSchema))
  @ApiOperation({ summary: 'Update order cooking status' })
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusInput,
  ) {
    return this.ordersService.updateOrderStatus(orderId, dto as any);
  }

  @Sse('orders/:orderId/stream')
  @Public()
  @ApiOperation({ summary: 'Live Server-Sent Events (SSE) status stream for active order' })
  streamOrderStatus(@Param('orderId') orderId: string): Observable<{ data: OrderStatusEvent }> {
    return this.sseService.subscribeToOrder(orderId);
  }
}
