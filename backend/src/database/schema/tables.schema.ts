import { pgTable, text, integer, timestamp, index, uuid } from 'drizzle-orm/pg-core';

export const tableStatusEnum = ['available', 'occupied', 'bill_requested'] as const;
export type TableStatus = (typeof tableStatusEnum)[number];

export const tables = pgTable(
  'tables',
  {
    id: text('id').primaryKey(),
    tableNumber: text('table_number').notNull().unique(), // e.g. "T-01"
    qrSlug: text('qr_slug').notNull().unique(), // e.g. "table-1"
    status: text('status').$type<TableStatus>().default('available').notNull(),
    displayName: text('display_name'), // e.g. "Table 01" (optional display helper)
    capacity: integer('capacity').default(4),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_tables_number').on(table.tableNumber),
    index('idx_tables_qr_slug').on(table.qrSlug),
    index('idx_tables_status').on(table.status),
  ],
);

// Backward-compatible alias
export const restaurantTables = tables;

export type TableSelect = typeof tables.$inferSelect;
export type TableInsert = typeof tables.$inferInsert;
export type RestaurantTableSelect = TableSelect;
export type RestaurantTableInsert = TableInsert;
