import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export interface OrderNewEvent {
  orderId: string;
  tableNumber: string;
  tableId: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers?: Array<{ name: string; priceExtra: number }>;
    notes?: string;
  }>;
  subtotal: number;
  serviceCharge: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  timestamp: number;
}

export interface ServiceCallWaiterEvent {
  requestId: string;
  tableNumber: string;
  tableId: string;
  reason: string;
  customNote?: string;
  timestamp: number;
}

export interface ServiceBillRequestEvent {
  requestId: string;
  tableNumber: string;
  tableId: string;
  paymentMethod: string;
  splitCount?: number;
  tableTotal: number;
  customNote?: string;
  timestamp: number;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  tableNumber: string;
  status: string;
  estimatedMinutes?: number;
  message: string;
  timestamp: number;
}

export interface TableSettledEvent {
  tableNumber: string;
  tableId: string;
  totalSettledAmount: number;
  paymentMethod: string;
  timestamp: number;
}

export interface MenuItemToggledEvent {
  itemId: string;
  name: string;
  isAvailable: boolean;
  timestamp: number;
}

@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);
  private supabase: SupabaseClient | null = null;
  private posStaffChannel: RealtimeChannel | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('example.supabase.co')) {
      this.logger.warn('Supabase Realtime not initialized: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is placeholder or missing.');
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 20,
          },
        },
      });

      // 1. Establish dedicated pos_staff room for incoming kitchen & cashier alerts
      this.posStaffChannel = this.supabase.channel('pos_staff', {
        config: {
          broadcast: { self: false, ack: true },
        },
      });

      this.posStaffChannel
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.logger.log('🟢 Supabase Realtime connected: Listening & broadcasting on room "pos_staff"');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isConnected = false;
            this.logger.warn(`Supabase Realtime room "pos_staff" status: ${status}`);
          }
        });

      // 2. Also listen for PostgreSQL Database WAL Changes on public schema
      this.supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            this.logger.log(`⚡ DB Postgres change on "orders": ${payload.eventType}`);
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'service_requests' },
          (payload) => {
            this.logger.log(`⚡ DB Postgres change on "service_requests": ${payload.eventType}`);
          },
        )
        .subscribe();
    } catch (error) {
      this.logger.error('Failed to initialize Supabase Realtime client', error);
    }
  }

  /**
   * Check connection status
   */
  getRealtimeStatus() {
    return {
      connected: this.isConnected,
      rooms: ['pos_staff', 'table_{tableNumber}', 'order_{orderId}'],
      provider: 'Supabase Realtime (WebSockets)',
    };
  }

  /**
   * Broadcasts: Customer -> POS Broadcasts
   * 1. order:new
   */
  async broadcastNewOrder(payload: OrderNewEvent) {
    if (!this.posStaffChannel) {
      this.logger.warn(`Cannot broadcast "order:new": Realtime channel not ready.`);
      return;
    }

    await this.posStaffChannel.send({
      type: 'broadcast',
      event: 'order:new',
      payload,
    });

    this.logger.log(`📡 Broadcasted [order:new] for Table ${payload.tableNumber} (Order: ${payload.orderId})`);
  }

  /**
   * Broadcasts: Customer -> POS Broadcasts
   * 2. service:call_waiter
   */
  async broadcastCallWaiter(payload: ServiceCallWaiterEvent) {
    if (!this.posStaffChannel) {
      this.logger.warn(`Cannot broadcast "service:call_waiter": Realtime channel not ready.`);
      return;
    }

    await this.posStaffChannel.send({
      type: 'broadcast',
      event: 'service:call_waiter',
      payload,
    });

    this.logger.log(`📡 Broadcasted [service:call_waiter] for Table ${payload.tableNumber} (Reason: ${payload.reason})`);
  }

  /**
   * Broadcasts: Customer -> POS Broadcasts
   * 3. service:bill_request
   */
  async broadcastBillRequest(payload: ServiceBillRequestEvent) {
    if (!this.posStaffChannel) {
      this.logger.warn(`Cannot broadcast "service:bill_request": Realtime channel not ready.`);
      return;
    }

    await this.posStaffChannel.send({
      type: 'broadcast',
      event: 'service:bill_request',
      payload,
    });

    this.logger.log(`📡 Broadcasted [service:bill_request] for Table ${payload.tableNumber} (Total: Rs. ${payload.tableTotal})`);
  }

  /**
   * Broadcasts: POS -> Customer Broadcasts
   * order:status_updated -> Pushed to table_{tableNumber} and pos_staff
   */
  async broadcastOrderStatusUpdated(payload: OrderStatusUpdatedEvent) {
    if (!this.supabase) {
      this.logger.warn(`Cannot broadcast "order:status_updated": Supabase client not ready.`);
      return;
    }

    // 1. Broadcast to table-specific room so customer mobile screen updates live without polling
    const tableChannel = this.supabase.channel(`table_${payload.tableNumber}`);
    await tableChannel.send({
      type: 'broadcast',
      event: 'order:status_updated',
      payload,
    });

    // 2. Also notify pos_staff
    if (this.posStaffChannel) {
      await this.posStaffChannel.send({
        type: 'broadcast',
        event: 'order:status_updated',
        payload,
      });
    }

    this.logger.log(`📡 Broadcasted [order:status_updated] to room "table_${payload.tableNumber}" -> Status: ${payload.status}`);
  }

  /**
   * Broadcasts: POS -> Customer & Staff Broadcasts
   * table:settled -> Pushed to table_{tableNumber} and pos_staff
   */
  async broadcastTableSettled(payload: TableSettledEvent) {
    if (!this.supabase) {
      this.logger.warn(`Cannot broadcast "table:settled": Supabase client not ready.`);
      return;
    }

    // 1. Broadcast to table-specific room so customer mobile screen resets
    const tableChannel = this.supabase.channel(`table_${payload.tableNumber}`);
    await tableChannel.send({
      type: 'broadcast',
      event: 'table:settled',
      payload,
    });

    // 2. Also notify pos_staff
    if (this.posStaffChannel) {
      await this.posStaffChannel.send({
        type: 'broadcast',
        event: 'table:settled',
        payload,
      });
    }

    this.logger.log(`📡 Broadcasted [table:settled] for Table ${payload.tableNumber} (Total: Rs. ${payload.totalSettledAmount})`);
  }

  /**
   * Broadcasts: Menu Item 86-Stock Availability Toggle
   * menu:item_toggled -> Pushed to pos_staff and pos_menu rooms
   */
  async broadcastMenuItemToggled(payload: MenuItemToggledEvent) {
    if (this.posStaffChannel) {
      await this.posStaffChannel.send({
        type: 'broadcast',
        event: 'menu:item_toggled',
        payload,
      });
    }

    if (this.supabase) {
      const menuChannel = this.supabase.channel('pos_menu');
      await menuChannel.send({
        type: 'broadcast',
        event: 'menu:item_toggled',
        payload,
      });
    }

    this.logger.log(
      `📡 Broadcasted [menu:item_toggled] for "${payload.name}" -> ${
        payload.isAvailable ? 'IN STOCK' : "86'D (OUT OF STOCK)"
      }`,
    );
  }

  async onModuleDestroy() {
    if (this.supabase) {
      this.logger.log('Disconnecting Supabase Realtime channels...');
      await this.supabase.removeAllChannels();
    }
  }
}
