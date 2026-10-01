import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, inArray, desc, or } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { tables } from '../../database/schema/tables.schema';
import { menuItems } from '../../database/schema/menu.schema';
import {
  orders,
  orderItems,
  orderStatusLogs,
  OrderStatus,
} from '../../database/schema/orders.schema';
import { CreateOrderInput } from '../../common/schemas/api.schemas';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { TablesService } from '../tables/tables.service';
import { SseService } from './sse.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly tablesService: TablesService,
    private readonly sseService: SseService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /**
   * POST /api/orders
   * Public endpoint. Validates table ID, calculates prices server-side against the DB,
   * creates the order and order items, and updates table status to 'occupied'.
   */
  async createOrder(dto: CreateOrderInput) {
    // 1. Validate Table Existence & Status
    const table = await this.tablesService.findTable(dto.tableId);

    if (!table) {
      throw new NotFoundException({
        success: false,
        error: 'TABLE_NOT_FOUND',
        message: `Table identifier "${dto.tableId}" does not exist in the restaurant system.`,
      });
    }

    if (table.status === 'bill_requested') {
      throw new ConflictException({
        success: false,
        error: 'TABLE_ALREADY_BILLING',
        message: 'Cannot place new order while current table bill is being finalized.',
      });
    }

    // 2. Fetch dishes & calculate verified prices server-side
    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      selectedModifiers: Array<{ id?: string; name: string; priceExtra: number }>;
      notes?: string;
      cartItemId?: string;
    }> = [];

    for (const lineItem of dto.items) {
      const dbItem = await this.databaseService.db.query.menuItems.findFirst({
        where: eq(menuItems.id, lineItem.menuItemId),
        with: {
          modifiers: true,
        },
      });

      if (!dbItem) {
        throw new NotFoundException({
          success: false,
          error: 'ITEM_NOT_FOUND',
          message: `Dish with ID "${lineItem.menuItemId}" was not found.`,
        });
      }

      // Check "86" switch (availability)
      if (!dbItem.isAvailable) {
        throw new ConflictException({
          success: false,
          error: 'ITEM_OUT_OF_STOCK',
          message: `Dish "${dbItem.name}" is currently 86'd (out of stock).`,
        });
      }

      // Calculate verified modifiers cost against DB
      let itemModifiersTotal = 0;
      const selectedModifiersJson: Array<{ id?: string; name: string; priceExtra: number }> = [];

      for (const mod of lineItem.selectedModifiers || []) {
        const dbMod = dbItem.modifiers.find(
          (m) =>
            m.id === mod.id ||
            m.name.toLowerCase() === (mod.name || '').toLowerCase(),
        );

        const priceExtra = dbMod ? dbMod.priceExtra : (mod.priceExtra ?? 0);
        itemModifiersTotal += priceExtra;
        selectedModifiersJson.push({
          id: dbMod?.id || mod.id,
          name: dbMod?.name || mod.name,
          priceExtra,
        });
      }

      const verifiedUnitPrice = dbItem.basePrice + itemModifiersTotal;
      const verifiedLineTotal = verifiedUnitPrice * lineItem.quantity;
      calculatedSubtotal += verifiedLineTotal;

      validatedItems.push({
        menuItemId: dbItem.id,
        name: dbItem.name,
        quantity: lineItem.quantity,
        unitPrice: verifiedUnitPrice,
        totalPrice: verifiedLineTotal,
        selectedModifiers: selectedModifiersJson,
        notes: lineItem.notes,
        cartItemId: lineItem.cartItemId,
      });
    }

    // 3. Financial Recalculation (PKR whole rupee rounding)
    const servicePercent = this.configService.get<number>('SERVICE_CHARGE_PERCENT', 5);
    const taxPercent = this.configService.get<number>('TAX_PERCENT', 5);

    const calculatedServiceCharge = Math.round(calculatedSubtotal * (servicePercent / 100));
    const calculatedTax = Math.round(calculatedSubtotal * (taxPercent / 100));
    const calculatedGrandTotal = calculatedSubtotal + calculatedServiceCharge + calculatedTax;

    // Optional Anti-Fraud check if client submitted total
    if (dto.totalAmount && Math.abs(calculatedGrandTotal - dto.totalAmount) > 1) {
      this.logger.warn(
        `Price mismatch detected for table ${table.tableNumber}. Client: ${dto.totalAmount}, Server: ${calculatedGrandTotal}`,
      );
      throw new UnprocessableEntityException({
        success: false,
        error: 'PRICE_MISMATCH',
        message: 'The submitted order total does not match verified server pricing.',
        details: {
          clientAmount: dto.totalAmount,
          verifiedTotal: calculatedGrandTotal,
          verifiedSubtotal: calculatedSubtotal,
        },
      });
    }

    // 4. Generate Readable Order ID
    const randomTicketSeq = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${randomTicketSeq}`;
    const initialMinutes = 12;

    // 5. Persist Order and Order Items (Modifiers saved as JSONB)
    await this.databaseService.db.insert(orders).values({
      id: orderId,
      tableId: table.id,
      tableNumber: table.tableNumber,
      status: 'pending',
      paymentStatus: 'unpaid',
      totalAmount: calculatedGrandTotal,
      subtotal: calculatedSubtotal,
      serviceCharge: calculatedServiceCharge,
      tax: calculatedTax,
      notes: dto.notes,
      estimatedMinutes: initialMinutes,
    });

    for (const vItem of validatedItems) {
      const orderItemId = `oi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await this.databaseService.db.insert(orderItems).values({
        id: orderItemId,
        orderId,
        menuItemId: vItem.menuItemId,
        cartItemId: vItem.cartItemId,
        quantity: vItem.quantity,
        unitPrice: vItem.unitPrice,
        selectedModifiers: vItem.selectedModifiers,
        notes: vItem.notes,
      });
    }

    // Append initial status log
    await this.databaseService.db.insert(orderStatusLogs).values({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      status: 'pending',
      message: 'Order created via QR menu and received in kitchen (Pending)',
    });

    // 6. Update table status to 'occupied'
    await this.databaseService.db
      .update(tables)
      .set({ status: 'occupied' })
      .where(eq(tables.id, table.id));

    // 7. Emit live SSE event
    this.sseService.emitStatus({
      orderId,
      tableId: table.tableNumber,
      status: 'pending',
      estimatedMinutes: initialMinutes,
      message: 'Order received by the cafe kitchen',
      timestamp: Date.now(),
    });

    // 8. Broadcast order:new to Supabase Realtime "pos_staff" room
    const staffOrderPayload = {
      orderId,
      tableNumber: table.tableNumber,
      tableId: table.id,
      items: validatedItems.map((vi) => ({
        name: vi.name,
        quantity: vi.quantity,
        unitPrice: vi.unitPrice,
        totalPrice: vi.totalPrice,
        modifiers: vi.selectedModifiers,
        notes: vi.notes,
      })),
      subtotal: calculatedSubtotal,
      serviceCharge: calculatedServiceCharge,
      tax: calculatedTax,
      totalAmount: calculatedGrandTotal,
      notes: dto.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    this.realtimeService.broadcastNewOrder(staffOrderPayload);

    // 9. Emit to staff SSE stream
    this.sseService.emitStaffEvent({
      event: 'order:new',
      data: staffOrderPayload,
      timestamp: Date.now(),
    });

    return {
      orderId,
      tableId: table.id,
      tableNumber: table.tableNumber,
      status: 'pending',
      paymentStatus: 'unpaid',
      itemsCount: validatedItems.length,
      subtotal: calculatedSubtotal,
      serviceCharge: calculatedServiceCharge,
      tax: calculatedTax,
      totalAmount: calculatedGrandTotal,
      estimatedMinutes: initialMinutes,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * GET /api/orders/table/:tableId
   * Fetches active, uncompleted orders for that table session.
   */
  async getActiveOrdersForTable(tableIdentifier: string) {
    const table = await this.tablesService.findTable(tableIdentifier);

    if (!table) {
      throw new NotFoundException({
        success: false,
        error: 'TABLE_NOT_FOUND',
        message: `Table "${tableIdentifier}" not found.`,
      });
    }

    const activeList = await this.databaseService.db.query.orders.findMany({
      where: and(
        eq(orders.tableId, table.id),
        inArray(orders.status, ['pending', 'accepted', 'preparing', 'ready', 'served']),
      ),
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
      tableId: table.id,
      tableNumber: table.tableNumber,
      tableStatus: table.status,
      activeOrdersCount: activeList.length,
      orders: activeList,
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.databaseService.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
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

    if (!order) {
      throw new NotFoundException({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: `Order "${orderId}" not found.`,
      });
    }

    return order;
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
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
      pending: 'Order placed by guest',
      accepted: 'Order accepted by cashier / kitchen',
      preparing: 'Chef is cooking your dishes on grill & stove',
      ready: 'Dishes ready on pass counter',
      served: 'Dishes delivered hot to your table',
      completed: 'Table order settled and completed',
      cancelled: 'Order has been voided by cafe staff',
    };

    const logMessage =
      dto.message || defaultMessages[dto.status] || `Status updated to ${dto.status}`;

    await this.databaseService.db
      .update(orders)
      .set({
        status: dto.status,
        ...(dto.status === 'completed' ? { paymentStatus: 'paid' } : {}),
        ...(dto.estimatedMinutes !== undefined
          ? { estimatedMinutes: dto.estimatedMinutes }
          : {}),
      })
      .where(eq(orders.id, orderId));

    await this.databaseService.db.insert(orderStatusLogs).values({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      status: dto.status,
      message: logMessage,
    });

    this.sseService.emitStatus({
      orderId,
      tableId: order.tableNumber || '',
      status: dto.status,
      estimatedMinutes: dto.estimatedMinutes ?? order.estimatedMinutes ?? 10,
      message: logMessage,
      timestamp: Date.now(),
    });

    this.realtimeService.broadcastOrderStatusUpdated({
      orderId,
      tableNumber: order.tableNumber || '',
      status: dto.status,
      estimatedMinutes: dto.estimatedMinutes ?? order.estimatedMinutes ?? 10,
      message: logMessage,
      timestamp: Date.now(),
    });

    return {
      orderId,
      status: dto.status,
      message: logMessage,
    };
  }
}
