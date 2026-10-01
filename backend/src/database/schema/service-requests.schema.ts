import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { tables } from './tables.schema';

export const serviceRequestTypeEnum = ['call_waiter', 'bill_request'] as const;
export type ServiceRequestType = (typeof serviceRequestTypeEnum)[number];

export { paymentMethodEnum, PaymentMethod } from './orders.schema';

export const serviceRequestStatusEnum = ['pending', 'resolved'] as const;
export type ServiceRequestStatus = (typeof serviceRequestStatusEnum)[number];

export const waiterReasonEnum = [
  'general',
  'water',
  'cutlery',
  'clean_table',
  'order_help',
] as const;
export type WaiterReason = (typeof waiterReasonEnum)[number];

export const serviceRequests = pgTable(
  'service_requests',
  {
    id: text('id').primaryKey(),
    tableId: text('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'cascade' }),
    type: text('type').$type<ServiceRequestType>().notNull(),
    status: text('status').$type<ServiceRequestStatus>().default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    // Extra metadata for waitstaff / POS processing
    tableNumber: text('table_number'),
    reason: text('reason').$type<WaiterReason>(),
    paymentMethod: text('payment_method'),
    splitCount: integer('split_count'),
    customNote: text('custom_note'),
  },
  (table) => [
    index('idx_service_requests_table_id').on(table.tableId),
    index('idx_service_requests_status').on(table.status),
    index('idx_service_requests_created_at').on(table.createdAt),
  ],
);

export type ServiceRequestSelect = typeof serviceRequests.$inferSelect;
export type ServiceRequestInsert = typeof serviceRequests.$inferInsert;
