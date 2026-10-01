import { relations } from 'drizzle-orm';
import { tables } from './tables.schema';
import { categories, menuItems, itemModifiers } from './menu.schema';
import { orders, orderItems, orderStatusLogs } from './orders.schema';
import { serviceRequests } from './service-requests.schema';

export const tablesRelations = relations(tables, ({ many }) => ({
  orders: many(orders),
  serviceRequests: many(serviceRequests),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  modifiers: many(itemModifiers),
  orderItems: many(orderItems),
}));

export const itemModifiersRelations = relations(itemModifiers, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [itemModifiers.menuItemId],
    references: [menuItems.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  orderItems: many(orderItems),
  statusHistory: many(orderStatusLogs),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const orderStatusLogsRelations = relations(orderStatusLogs, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusLogs.orderId],
    references: [orders.id],
  }),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  table: one(tables, {
    fields: [serviceRequests.tableId],
    references: [tables.id],
  }),
}));
