import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and, notInArray, or, desc, inArray, asc } from 'drizzle-orm';
import crypto from 'node:crypto';
import { DatabaseService } from '../../database/database.service';
import { tables } from '../../database/schema/tables.schema';
import { menuItems, categories, itemModifiers } from '../../database/schema/menu.schema';
import {
  orders,
  orderStatusLogs,
  OrderStatus,
  PaymentMethod,
} from '../../database/schema/orders.schema';
import { serviceRequests } from '../../database/schema/service-requests.schema';
import { SseService } from '../orders/sse.service';
import { TablesService } from '../tables/tables.service';
import { RealtimeService } from '../realtime/realtime.service';
import { parseModifierGroups, serializeModifierGroups } from './menu-modifier.utils';
import {
  CreateMenuItemInput,
  UpdateMenuItemInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../common/schemas/api.schemas';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tablesService: TablesService,
    private readonly sseService: SseService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /**
   * 5. PATCH /api/admin/menu/:id/toggle
   * Admin endpoint to toggle item availability (the "86" switch).
   */
  async toggleMenuItemAvailability(menuItemId: string, explicitState?: boolean) {
    const item = await this.databaseService.db.query.menuItems.findFirst({
      where: eq(menuItems.id, menuItemId),
    });

    if (!item) {
      throw new NotFoundException({
        success: false,
        error: 'ITEM_NOT_FOUND',
        message: `Menu item "${menuItemId}" not found.`,
      });
    }

    const nextState = explicitState !== undefined ? explicitState : !item.isAvailable;

    await this.databaseService.db
      .update(menuItems)
      .set({ isAvailable: nextState })
      .where(eq(menuItems.id, menuItemId));

    const statusLabel = nextState ? 'Available' : "86'd (Unavailable)";
    this.logger.log(`Admin toggled menu item [${item.name}] -> ${statusLabel}`);

    // Broadcast live to Supabase Realtime & SSE so customer menus grey out immediately
    await this.realtimeService.broadcastMenuItemToggled({
      itemId: item.id,
      name: item.name,
      isAvailable: nextState,
      timestamp: Date.now(),
    });

    this.sseService.emitStaffEvent({
      event: 'menu:item_toggled',
      data: {
        itemId: item.id,
        name: item.name,
        isAvailable: nextState,
      },
      timestamp: Date.now(),
    });

    return {
      id: item.id,
      name: item.name,
      isAvailable: nextState,
      message: `Dish "${item.name}" is now ${statusLabel.toLowerCase()}.`,
    };
  }

  /**
   * 6. PATCH /api/admin/orders/:id/status
   * Updates order status ('accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled').
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, customMessage?: string) {
    const order = await this.databaseService.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      throw new NotFoundException({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: `Order "${orderId}" not found.`,
      });
    }

    const defaultMessages: Record<OrderStatus, string> = {
      pending: 'Order pending kitchen review',
      accepted: 'Kitchen confirmed order',
      preparing: 'Chef is cooking dishes on grill & stove',
      ready: 'Dishes are plated and ready at pass counter',
      served: 'Delivered to your table',
      completed: 'Order completed and settled',
      cancelled: 'Order has been cancelled / voided',
    };

    const message = customMessage || defaultMessages[status] || `Status updated to ${status}`;

    // Update order
    await this.databaseService.db
      .update(orders)
      .set({
        status,
        ...(status === 'completed' ? { paymentStatus: 'paid' } : {}),
      })
      .where(eq(orders.id, orderId));

    // Append to status history log
    await this.databaseService.db.insert(orderStatusLogs).values({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      status,
      message,
    });

    // Broadcast SSE update
    this.sseService.emitStatus({
      orderId,
      tableId: order.tableNumber || '',
      status,
      estimatedMinutes: status === 'ready' || status === 'served' ? 0 : order.estimatedMinutes ?? 5,
      message,
      timestamp: Date.now(),
    });

    // Broadcast Supabase Realtime event
    this.realtimeService.broadcastOrderStatusUpdated({
      orderId,
      tableNumber: order.tableNumber || '',
      status,
      estimatedMinutes: status === 'ready' || status === 'served' ? 0 : order.estimatedMinutes ?? 5,
      message,
      timestamp: Date.now(),
    });

    // Broadcast staff SSE event
    this.sseService.emitStaffEvent({
      event: 'order:status_updated',
      data: {
        orderId,
        tableNumber: order.tableNumber || '',
        status,
        message,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });

    this.logger.log(`Order [${orderId}] status transitioned -> ${status}`);

    return {
      orderId,
      status,
      message,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 7. POST /api/admin/tables/:tableId/settle
   * Marks table orders as paid, logs payment method, and resets table status to 'available'.
   */
  async settleTable(
    tableIdentifier: string,
    paymentMethod: PaymentMethod = 'cash',
    notes?: string,
  ) {
    // 1. Find Table
    const table = await this.tablesService.findTable(tableIdentifier);

    if (!table) {
      throw new NotFoundException({
        success: false,
        error: 'TABLE_NOT_FOUND',
        message: `Table "${tableIdentifier}" not found.`,
      });
    }

    // 2. Find all active uncompleted orders for this table
    const activeOrders = await this.databaseService.db.query.orders.findMany({
      where: and(
        eq(orders.tableId, table.id),
        notInArray(orders.status, ['completed', 'cancelled']),
      ),
    });

    let totalSettledAmount = 0;

    for (const order of activeOrders) {
      totalSettledAmount += order.totalAmount;

      // Mark order as completed and paid
      await this.databaseService.db
        .update(orders)
        .set({
          status: 'completed',
          paymentStatus: 'paid',
          paymentMethod,
        })
        .where(eq(orders.id, order.id));

      // Append log entry
      await this.databaseService.db.insert(orderStatusLogs).values({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderId: order.id,
        status: 'completed',
        message: `Order settled via ${paymentMethod} at POS terminal. ${notes ? `(${notes})` : ''}`,
      });

      // Emit SSE order completion
      this.sseService.emitStatus({
        orderId: order.id,
        tableId: table.tableNumber,
        status: 'completed',
        estimatedMinutes: 0,
        message: 'Order paid and closed. Thank you for dining with us!',
        timestamp: Date.now(),
      });
    }

    // 3. Resolve any pending service requests for this table
    await this.databaseService.db
      .update(serviceRequests)
      .set({ status: 'resolved' })
      .where(and(eq(serviceRequests.tableId, table.id), eq(serviceRequests.status, 'pending')));

    // 4. Reset table status to 'available'
    await this.databaseService.db
      .update(tables)
      .set({ status: 'available' })
      .where(eq(tables.id, table.id));

    this.logger.log(
      `Table [${table.tableNumber}] settled: Rs. ${totalSettledAmount} via ${paymentMethod}. Table status reset to AVAILABLE.`,
    );

    // 5. Broadcast table:settled event so all screens & customer device reset
    await this.realtimeService.broadcastTableSettled({
      tableNumber: table.tableNumber,
      tableId: table.id,
      totalSettledAmount,
      paymentMethod,
      timestamp: Date.now(),
    });

    return {
      tableId: table.id,
      tableNumber: table.tableNumber,
      tableStatus: 'available',
      ordersSettledCount: activeOrders.length,
      totalSettledAmount,
      paymentMethod,
      settledAt: new Date().toISOString(),
      message: `Table ${table.tableNumber} bill settled successfully (${paymentMethod}). Table is now available.`,
    };
  }

  /**
   * 8. GET /api/admin/orders
   * Retrieves all orders, optionally filtered by status or activeOnly
   */
  async getAllOrders(status?: OrderStatus, activeOnly = false) {
    const activeStatuses: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'served'];

    let filterCondition;
    if (status) {
      filterCondition = eq(orders.status, status);
    } else if (activeOnly) {
      filterCondition = inArray(orders.status, activeStatuses);
    }

    const orderRows = await this.databaseService.db.query.orders.findMany({
      where: filterCondition,
      orderBy: [desc(orders.createdAt)],
      with: {
        orderItems: {
          with: {
            menuItem: true,
          },
        },
        statusHistory: {
          orderBy: [desc(orderStatusLogs.timestamp)],
        },
      },
    });

    return {
      success: true,
      data: orderRows.map((o) => ({
        id: o.id,
        tableId: o.tableId,
        tableNumber: o.tableNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        subtotal: o.subtotal,
        serviceCharge: o.serviceCharge,
        tax: o.tax,
        totalAmount: o.totalAmount,
        estimatedMinutes: o.estimatedMinutes,
        notes: o.notes,
        createdAt: o.createdAt,
        items: (o.orderItems || []).map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.menuItem?.name || 'Dish Item',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          selectedModifiers: item.selectedModifiers || [],
          notes: item.notes,
        })),
        statusHistory: o.statusHistory || [],
      })),
    };
  }

  /**
   * 9. GET /api/admin/service-requests
   * Retrieves pending waiter calls and bill requests
   */
  async getActiveServiceRequests() {
    const list = await this.databaseService.db.query.serviceRequests.findMany({
      where: eq(serviceRequests.status, 'pending'),
      orderBy: [desc(serviceRequests.createdAt)],
    });

    return {
      success: true,
      data: list,
    };
  }

  /**
   * 10. PATCH /api/admin/service-requests/:id/resolve
   * Resolves/dismisses a waiter call or bill request
   */
  async resolveServiceRequest(requestId: string) {
    const existing = await this.databaseService.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.id, requestId),
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: 'REQUEST_NOT_FOUND',
        message: `Service request "${requestId}" not found.`,
      });
    }

    await this.databaseService.db
      .update(serviceRequests)
      .set({ status: 'resolved' })
      .where(eq(serviceRequests.id, requestId));

    this.logger.log(`Service request [${requestId}] resolved for table [${existing.tableNumber}]`);

    return {
      success: true,
      data: {
        id: requestId,
        status: 'resolved',
        tableNumber: existing.tableNumber,
      },
    };
  }

  /**
   * Helper: Retrieve single menu item with parsed modifier groups
   */
  async getMenuItemById(id: string) {
    const item = await this.databaseService.db.query.menuItems.findFirst({
      where: eq(menuItems.id, id),
      with: {
        modifiers: true,
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundException({
        success: false,
        error: 'ITEM_NOT_FOUND',
        message: `Menu item "${id}" not found.`,
      });
    }

    return {
      ...item,
      categoryName: item.category?.name || 'Uncategorized',
      price: item.basePrice,
      image: item.imageUrl,
      modifierGroups: parseModifierGroups(item.modifiers),
    };
  }

  /**
   * 12. GET /api/admin/menu/all
   * Returns all categories and items (both in-stock and 86'd) with parsed modifier groups
   */
  async getAllMenu() {
    const allCategories = await this.databaseService.db.query.categories.findMany({
      orderBy: [asc(categories.sortOrder)],
    });

    const allItems = await this.databaseService.db.query.menuItems.findMany({
      orderBy: [asc(menuItems.sortOrder)],
      with: {
        modifiers: true,
        category: true,
      },
    });

    const parsedItems = allItems.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      categoryName: item.category?.name || 'Uncategorized',
      name: item.name,
      description: item.description || '',
      basePrice: item.basePrice,
      price: item.basePrice,
      imageUrl: item.imageUrl || '',
      image: item.imageUrl || '',
      isAvailable: item.isAvailable,
      isVegetarian: item.isVegetarian ?? false,
      isBestseller: item.isBestseller ?? false,
      isChefSpecial: item.isChefSpecial ?? false,
      spicyLevel: item.spicyLevel ?? 0,
      preparationTime: item.preparationTime || '10-15 mins',
      sortOrder: item.sortOrder ?? 0,
      createdAt: item.createdAt,
      modifiers: item.modifiers,
      modifierGroups: parseModifierGroups(item.modifiers),
    }));

    const totalItems = parsedItems.length;
    const inStockCount = parsedItems.filter((i) => i.isAvailable).length;
    const outOfStockCount = parsedItems.filter((i) => !i.isAvailable).length;

    return {
      success: true,
      data: {
        categories: allCategories,
        items: parsedItems,
        stats: {
          totalItems,
          inStockCount,
          outOfStockCount,
          categoriesCount: allCategories.length,
        },
      },
    };
  }

  /**
   * 13. POST /api/admin/menu/items
   * Creates a new menu item and persists its modifier groups
   */
  async createMenuItem(input: CreateMenuItemInput) {
    const itemId = crypto.randomUUID();

    await this.databaseService.db.insert(menuItems).values({
      id: itemId,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description || '',
      basePrice: input.basePrice,
      imageUrl: input.imageUrl || '',
      isAvailable: input.isAvailable !== undefined ? input.isAvailable : true,
      isVegetarian: input.isVegetarian ?? false,
      isBestseller: input.isBestseller ?? false,
      isChefSpecial: input.isChefSpecial ?? false,
      spicyLevel: input.spicyLevel ?? 0,
      preparationTime: input.preparationTime || '10-15 mins',
      sortOrder: input.sortOrder ?? 0,
    });

    if (input.modifierGroups && input.modifierGroups.length > 0) {
      const modifierRows = serializeModifierGroups(input.modifierGroups, itemId);
      if (modifierRows.length > 0) {
        await this.databaseService.db.insert(itemModifiers).values(modifierRows);
      }
    }

    const created = await this.getMenuItemById(itemId);
    this.logger.log(`Created menu item: ${created.name} [${itemId}]`);

    return {
      success: true,
      data: created,
    };
  }

  /**
   * 14. PATCH /api/admin/menu/items/:id
   * Updates menu item details and modifier groups
   */
  async updateMenuItem(id: string, input: UpdateMenuItemInput) {
    const existing = await this.databaseService.db.query.menuItems.findFirst({
      where: eq(menuItems.id, id),
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: 'ITEM_NOT_FOUND',
        message: `Menu item "${id}" not found.`,
      });
    }

    const updatePayload: Partial<typeof menuItems.$inferInsert> = {};
    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.categoryId !== undefined) updatePayload.categoryId = input.categoryId;
    if (input.basePrice !== undefined) updatePayload.basePrice = input.basePrice;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.imageUrl !== undefined) updatePayload.imageUrl = input.imageUrl;
    if (input.isVegetarian !== undefined) updatePayload.isVegetarian = input.isVegetarian;
    if (input.isBestseller !== undefined) updatePayload.isBestseller = input.isBestseller;
    if (input.isChefSpecial !== undefined) updatePayload.isChefSpecial = input.isChefSpecial;
    if (input.spicyLevel !== undefined) updatePayload.spicyLevel = input.spicyLevel;
    if (input.preparationTime !== undefined) updatePayload.preparationTime = input.preparationTime;
    if (input.sortOrder !== undefined) updatePayload.sortOrder = input.sortOrder;
    if (input.isAvailable !== undefined) updatePayload.isAvailable = input.isAvailable;

    if (Object.keys(updatePayload).length > 0) {
      await this.databaseService.db
        .update(menuItems)
        .set(updatePayload)
        .where(eq(menuItems.id, id));
    }

    if (input.modifierGroups !== undefined) {
      await this.databaseService.db
        .delete(itemModifiers)
        .where(eq(itemModifiers.menuItemId, id));

      if (input.modifierGroups.length > 0) {
        const modifierRows = serializeModifierGroups(input.modifierGroups, id);
        if (modifierRows.length > 0) {
          await this.databaseService.db.insert(itemModifiers).values(modifierRows);
        }
      }
    }

    // Broadcast availability change if it changed
    if (input.isAvailable !== undefined && input.isAvailable !== existing.isAvailable) {
      await this.realtimeService.broadcastMenuItemToggled({
        itemId: existing.id,
        name: input.name || existing.name,
        isAvailable: input.isAvailable,
        timestamp: Date.now(),
      });
      this.sseService.emitStaffEvent({
        event: 'menu:item_toggled',
        data: {
          itemId: existing.id,
          name: input.name || existing.name,
          isAvailable: input.isAvailable,
        },
        timestamp: Date.now(),
      });
    }

    const updated = await this.getMenuItemById(id);
    this.logger.log(`Updated menu item: ${updated.name} [${id}]`);

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * 15. DELETE /api/admin/menu/items/:id
   * Deletes a menu item and its modifiers
   */
  async deleteMenuItem(id: string) {
    const existing = await this.databaseService.db.query.menuItems.findFirst({
      where: eq(menuItems.id, id),
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: 'ITEM_NOT_FOUND',
        message: `Menu item "${id}" not found.`,
      });
    }

    await this.databaseService.db.delete(itemModifiers).where(eq(itemModifiers.menuItemId, id));
    await this.databaseService.db.delete(menuItems).where(eq(menuItems.id, id));

    this.logger.log(`Deleted menu item: ${existing.name} [${id}]`);

    return {
      success: true,
      data: {
        id,
        name: existing.name,
        message: `Menu item "${existing.name}" has been deleted.`,
      },
    };
  }

  /**
   * 16. POST /api/admin/menu/categories
   * Creates a new menu category
   */
  async createCategory(input: CreateCategoryInput) {
    const id = crypto.randomUUID();
    await this.databaseService.db.insert(categories).values({
      id,
      name: input.name,
      icon: input.icon || 'Utensils',
      badge: input.badge || null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive !== undefined ? input.isActive : true,
    });

    const cat = await this.databaseService.db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    return {
      success: true,
      data: cat,
    };
  }

  /**
   * 17. PATCH /api/admin/menu/categories/:id
   * Updates a menu category
   */
  async updateCategory(id: string, input: UpdateCategoryInput) {
    const existing = await this.databaseService.db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: `Category "${id}" not found.`,
      });
    }

    const updatePayload: Partial<typeof categories.$inferInsert> = {};
    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.icon !== undefined) updatePayload.icon = input.icon;
    if (input.badge !== undefined) updatePayload.badge = input.badge;
    if (input.sortOrder !== undefined) updatePayload.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

    await this.databaseService.db
      .update(categories)
      .set(updatePayload)
      .where(eq(categories.id, id));

    const updated = await this.databaseService.db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * 18. DELETE /api/admin/menu/categories/:id
   * Deletes a category if it has no associated items
   */
  async deleteCategory(id: string) {
    const existing = await this.databaseService.db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: `Category "${id}" not found.`,
      });
    }

    const items = await this.databaseService.db.query.menuItems.findMany({
      where: eq(menuItems.categoryId, id),
    });

    if (items.length > 0) {
      throw new BadRequestException({
        success: false,
        error: 'CATEGORY_NOT_EMPTY',
        message: `Cannot delete category "${existing.name}" because it contains ${items.length} item(s). Reassign or delete those items first.`,
      });
    }

    await this.databaseService.db.delete(categories).where(eq(categories.id, id));

    return {
      success: true,
      data: {
        id,
        name: existing.name,
        message: `Category "${existing.name}" deleted.`,
      },
    };
  }

  /**
   * 19. PATCH /api/admin/menu/categories/reorder
   * Batch updates category sort orders
   */
  async reorderCategories(reorderList: Array<{ id: string; sortOrder: number }>) {
    for (const item of reorderList) {
      await this.databaseService.db
        .update(categories)
        .set({ sortOrder: item.sortOrder })
        .where(eq(categories.id, item.id));
    }

    const updatedCategories = await this.databaseService.db.query.categories.findMany({
      orderBy: [asc(categories.sortOrder)],
    });

    return {
      success: true,
      data: updatedCategories,
    };
  }
}


