import { pgTable, text, integer, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { tables } from './tables.schema';
import { menuItems } from './menu.schema';

export const orderStatusEnum = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof orderStatusEnum)[number];

export const paymentStatusEnum = ['unpaid', 'paid'] as const;
export type PaymentStatus = (typeof paymentStatusEnum)[number];

export const paymentMethodEnum = ['cash', 'card', 'upi/online'] as const;
export type PaymentMethod = (typeof paymentMethodEnum)[number];

export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(), // e.g. "ORD-1001" or uuid
    tableId: text('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'restrict' }),
    status: text('status').$type<OrderStatus>().default('pending').notNull(),
    totalAmount: integer('total_amount').notNull(), // Final total in whole PKR
    paymentStatus: text('payment_status').$type<PaymentStatus>().default('unpaid').notNull(),
    paymentMethod: text('payment_method').$type<PaymentMethod>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    // Extra helpers for POS calculation & table linking
    tableNumber: text('table_number'), // Denormalized for display convenience
    subtotal: integer('subtotal'),
    serviceCharge: integer('service_charge'),
    tax: integer('tax'),
    notes: text('notes'),
    estimatedMinutes: integer('estimated_minutes').default(12),
  },
  (table) => [
    index('idx_orders_table_id').on(table.tableId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_payment_status').on(table.paymentStatus),
    index('idx_orders_created_at').on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    menuItemId: text('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').default(1).notNull(),
    unitPrice: integer('unit_price').notNull(), // verified price at order time in PKR
    selectedModifiers: jsonb('selected_modifiers').default('[]').$type<Array<{
      id?: string;
      name: string;
      priceExtra: number;
    }>>(),
    notes: text('notes'),
    cartItemId: text('cart_item_id'),
  },
  (table) => [
    index('idx_order_items_order_id').on(table.orderId),
    index('idx_order_items_menu_item_id').on(table.menuItemId),
  ],
);

export const orderStatusLogs = pgTable(
  'order_status_logs',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    status: text('status').$type<OrderStatus>().notNull(),
    message: text('message').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_order_logs_order').on(table.orderId)],
);

export type OrderSelect = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
export type OrderItemSelect = typeof orderItems.$inferSelect;
export type OrderItemInsert = typeof orderItems.$inferInsert;
export type OrderStatusLogSelect = typeof orderStatusLogs.$inferSelect;
export type OrderStatusLogInsert = typeof orderStatusLogs.$inferInsert;
