import {
  Controller,
  Patch,
  Post,
  Get,
  Delete,
  Query,
  Sse,
  Param,
  Body,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { AdminService } from './admin.service';
import { SseService, StaffStreamEvent } from '../orders/sse.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  toggleMenuItemSchema,
  ToggleMenuItemInput,
  updateOrderStatusSchema,
  UpdateOrderStatusInput,
  settleTableSchema,
  SettleTableInput,
  createMenuItemSchema,
  CreateMenuItemInput,
  updateMenuItemSchema,
  UpdateMenuItemInput,
  createCategorySchema,
  CreateCategoryInput,
  updateCategorySchema,
  UpdateCategoryInput,
  reorderCategoriesSchema,
  ReorderCategoriesInput,
} from '../../common/schemas/api.schemas';

@ApiTags('Admin & POS Operations')
@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly sseService: SseService,
  ) {}

  /**
   * 5. PATCH /api/admin/menu/:id/toggle
   * Admin endpoint to toggle item availability (the "86" switch).
   */
  @Patch('menu/:id/toggle')
  @Public() // Can be secured with @UseGuards(SupabaseAuthGuard) in production
  @UsePipes(new ZodValidationPipe(toggleMenuItemSchema))
  @ApiOperation({ summary: "Toggle menu item availability (the '86' switch)" })
  @ApiParam({ name: 'id', example: 'c0000000-0000-0000-0000-000000000001' })
  @ApiResponse({ status: 200, description: 'Item availability state toggled' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async toggleMenuItem(
    @Param('id') id: string,
    @Body() body: ToggleMenuItemInput,
  ) {
    return this.adminService.toggleMenuItemAvailability(id, body?.isAvailable);
  }

  /**
   * 6. PATCH /api/admin/orders/:id/status
   * Updates order status ('accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled').
   */
  @Patch('orders/:id/status')
  @Public()
  @UsePipes(new ZodValidationPipe(updateOrderStatusSchema))
  @ApiOperation({ summary: 'Update order cooking/delivery status from POS or Kitchen KDS' })
  @ApiParam({ name: 'id', example: 'ORD-1001' })
  @ApiResponse({ status: 200, description: 'Order status updated and SSE event emitted' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusInput,
  ) {
    return this.adminService.updateOrderStatus(id, body.status as any, body.message);
  }

  /**
   * 7. POST /api/admin/tables/:tableId/settle
   * Marks table orders as paid, logs payment method, and resets table status to 'available'.
   */
  @Post('tables/:tableId/settle')
  @Public()
  @UsePipes(new ZodValidationPipe(settleTableSchema))
  @ApiOperation({ summary: 'Settle table check at POS terminal and reset table to available' })
  @ApiParam({ name: 'tableId', example: 'T-02' })
  @ApiResponse({ status: 200, description: 'Table orders marked paid, table status reset to available' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async settleTable(
    @Param('tableId') tableId: string,
    @Body() body: SettleTableInput,
  ) {
    return this.adminService.settleTable(tableId, body.paymentMethod as any, body.notes);
  }

  /**
   * 8. GET /api/admin/orders
   * Lists orders for Operations Kanban & KDS
   */
  @Get('orders')
  @Public()
  @ApiOperation({ summary: 'List all restaurant orders for operations dashboard' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled'] })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async getOrders(
    @Query('status') status?: any,
    @Query('active') active?: string,
  ) {
    const activeOnly = active === 'true' || active === '1';
    return this.adminService.getAllOrders(status, activeOnly);
  }

  /**
   * 9. GET /api/admin/service-requests
   * Lists active service requests (waiter calls & bill requests)
   */
  @Get('service-requests')
  @Public()
  @ApiOperation({ summary: 'List pending waiter calls and billing requests' })
  async getServiceRequests() {
    return this.adminService.getActiveServiceRequests();
  }

  /**
   * 10. PATCH /api/admin/service-requests/:id/resolve
   * Resolves/dismisses a waiter call
   */
  @Patch('service-requests/:id/resolve')
  @Public()
  @ApiOperation({ summary: 'Dismiss/resolve an active waiter call or bill request' })
  @ApiParam({ name: 'id', example: 'sr-12345' })
  async resolveServiceRequest(@Param('id') id: string) {
    return this.adminService.resolveServiceRequest(id);
  }

  /**
   * 11. SSE /api/admin/stream
   * Live Server-Sent Events stream for kitchen & operations staff
   */
  @Sse('stream')
  @Public()
  @ApiOperation({ summary: 'Live real-time stream of all restaurant events for operations portal' })
  streamOperations(): Observable<{ data: StaffStreamEvent }> {
    return this.sseService.subscribeToStaff();
  }

  /**
   * 12. GET /api/admin/menu/all
   * Fetches all categories, dishes (available + 86'd), and modifier groups
   */
  @Get('menu/all')
  @Public()
  @ApiOperation({ summary: 'Fetch entire menu catalog for admin manager' })
  async getAllMenu() {
    return this.adminService.getAllMenu();
  }

  /**
   * 13. POST /api/admin/menu/items
   * Creates a new menu item with optional modifier groups
   */
  @Post('menu/items')
  @Public()
  @UsePipes(new ZodValidationPipe(createMenuItemSchema))
  @ApiOperation({ summary: 'Create a new dish/menu item' })
  async createMenuItem(@Body() body: CreateMenuItemInput) {
    return this.adminService.createMenuItem(body);
  }

  /**
   * 14. PATCH /api/admin/menu/items/:id
   * Updates an existing menu item and its modifier groups
   */
  @Patch('menu/items/:id')
  @Public()
  @UsePipes(new ZodValidationPipe(updateMenuItemSchema))
  @ApiOperation({ summary: 'Update dish details, price, flags, and modifiers' })
  @ApiParam({ name: 'id', example: 'c0000000-0000-0000-0000-000000000001' })
  async updateMenuItem(
    @Param('id') id: string,
    @Body() body: UpdateMenuItemInput,
  ) {
    return this.adminService.updateMenuItem(id, body);
  }

  /**
   * 15. DELETE /api/admin/menu/items/:id
   * Deletes a dish and associated modifiers
   */
  @Delete('menu/items/:id')
  @Public()
  @ApiOperation({ summary: 'Delete a menu item' })
  @ApiParam({ name: 'id', example: 'c0000000-0000-0000-0000-000000000001' })
  async deleteMenuItem(@Param('id') id: string) {
    return this.adminService.deleteMenuItem(id);
  }

  /**
   * 16. POST /api/admin/menu/categories
   * Creates a new menu category
   */
  @Post('menu/categories')
  @Public()
  @UsePipes(new ZodValidationPipe(createCategorySchema))
  @ApiOperation({ summary: 'Create a new menu category' })
  async createCategory(@Body() body: CreateCategoryInput) {
    return this.adminService.createCategory(body);
  }

  /**
   * 17. PATCH /api/admin/menu/categories/reorder
   * Batch update categories sorting order
   */
  @Patch('menu/categories/reorder')
  @Public()
  @UsePipes(new ZodValidationPipe(reorderCategoriesSchema))
  @ApiOperation({ summary: 'Reorder categories rank order' })
  async reorderCategories(@Body() body: ReorderCategoriesInput) {
    return this.adminService.reorderCategories(body.categories);
  }

  /**
   * 18. PATCH /api/admin/menu/categories/:id
   * Updates an existing category
   */
  @Patch('menu/categories/:id')
  @Public()
  @UsePipes(new ZodValidationPipe(updateCategorySchema))
  @ApiOperation({ summary: 'Update category name, icon, or badge' })
  @ApiParam({ name: 'id', example: 'b0000000-0000-0000-0000-000000000001' })
  async updateCategory(
    @Param('id') id: string,
    @Body() body: UpdateCategoryInput,
  ) {
    return this.adminService.updateCategory(id, body);
  }

  /**
   * 19. DELETE /api/admin/menu/categories/:id
   * Deletes a category if empty
   */
  @Delete('menu/categories/:id')
  @Public()
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', example: 'b0000000-0000-0000-0000-000000000001' })
  async deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }
}


