import { pgTable, text, integer, boolean, timestamp, index, numeric } from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    icon: text('icon'), // optional Lucide icon name
    badge: text('badge'),
  },
  (table) => [
    index('idx_categories_sort').on(table.sortOrder),
    index('idx_categories_active').on(table.isActive),
  ],
);

export const menuItems = pgTable(
  'menu_items',
  {
    id: text('id').primaryKey(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    basePrice: integer('base_price').notNull(), // in PKR (e.g. 280)
    imageUrl: text('image_url'),
    isAvailable: boolean('is_available').default(true).notNull(), // "86" switch for instant availability toggle
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    // Legacy/extra UI attributes for richer mobile customer view
    isVegetarian: boolean('is_vegetarian').default(false),
    isBestseller: boolean('is_bestseller').default(false),
    isChefSpecial: boolean('is_chef_special').default(false),
    spicyLevel: integer('spicy_level').default(0),
    preparationTime: text('preparation_time'),
    sortOrder: integer('sort_order').default(0),
  },
  (table) => [
    index('idx_menu_items_category').on(table.categoryId),
    index('idx_menu_items_available').on(table.isAvailable),
    index('idx_menu_items_sort').on(table.sortOrder),
  ],
);

export const itemModifiers = pgTable(
  'item_modifiers',
  {
    id: text('id').primaryKey(),
    menuItemId: text('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // e.g. "Cheddar Cheese Slice"
    priceExtra: integer('price_extra').default(0).notNull(), // e.g. 60
  },
  (table) => [index('idx_item_modifiers_item').on(table.menuItemId)],
);

export type CategorySelect = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
export type MenuItemSelect = typeof menuItems.$inferSelect;
export type MenuItemInsert = typeof menuItems.$inferInsert;
export type ItemModifierSelect = typeof itemModifiers.$inferSelect;
export type ItemModifierInsert = typeof itemModifiers.$inferInsert;
