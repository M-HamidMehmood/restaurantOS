import { z } from 'zod';

// ----------------------------------------------------
// 1. ORDERS SCHEMAS
// ----------------------------------------------------
export const modifierItemSchema = z.object({
  id: z.string().optional(),
  optionId: z.string().optional(),
  name: z.string().min(1, 'Modifier name is required'),
  optionName: z.string().optional(),
  priceExtra: z.number().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
});

export const orderLineItemSchema = z
  .object({
    menuItemId: z.string().optional(),
    item: z
      .object({
        id: z.string(),
        name: z.string().optional(),
        price: z.number().optional(),
      })
      .optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
    selectedModifiers: z.array(modifierItemSchema).default([]),
    notes: z.string().optional(),
    cartItemId: z.string().optional(),
    unitPrice: z.number().optional(),
    totalPrice: z.number().optional(),
  })
  .transform((data) => {
    // Normalize menuItemId from either menuItemId or item.id
    const resolvedMenuItemId = data.menuItemId || data.item?.id;
    if (!resolvedMenuItemId) {
      throw new Error('menuItemId or item.id is required');
    }
    return {
      ...data,
      menuItemId: resolvedMenuItemId,
      selectedModifiers: (data.selectedModifiers || []).map((mod) => ({
        id: mod.id || mod.optionId,
        name: mod.name || mod.optionName || 'Modifier',
        priceExtra: mod.priceExtra ?? mod.price ?? 0,
      })),
    };
  });

export const createOrderSchema = z.object({
  tableId: z.string().min(1, 'tableId is required'),
  items: z.array(orderLineItemSchema).min(1, 'Order must contain at least one item'),
  notes: z.string().optional(),
  totalAmount: z.number().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ----------------------------------------------------
// 2. SERVICE REQUEST SCHEMA
// ----------------------------------------------------
export const serviceRequestSchema = z.object({
  tableId: z.string().min(1, 'tableId is required'),
  type: z.enum(['call_waiter', 'bill_request'], {
    errorMap: () => ({ message: "Type must be either 'call_waiter' or 'bill_request'" }),
  }),
  reason: z.enum(['general', 'water', 'cutlery', 'clean_table', 'order_help']).optional(),
  paymentMethod: z.enum(['cash', 'card', 'upi/online']).optional(),
  splitCount: z.number().int().min(1).optional(),
  customNote: z.string().optional(),
});

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;

// ----------------------------------------------------
// 3. ADMIN MENU TOGGLE SCHEMA ("86" Switch)
// ----------------------------------------------------
export const toggleMenuItemSchema = z.object({
  isAvailable: z.boolean().optional(),
}).optional();

export type ToggleMenuItemInput = z.infer<typeof toggleMenuItemSchema>;

// ----------------------------------------------------
// 4. ADMIN ORDER STATUS UPDATE SCHEMA
// ----------------------------------------------------
export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    {
      errorMap: () => ({ message: 'Invalid order lifecycle status' }),
    },
  ),
  estimatedMinutes: z.number().int().min(0).optional(),
  message: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// ----------------------------------------------------
// 5. ADMIN TABLE SETTLE SCHEMA (POS Settlement)
// ----------------------------------------------------
export const settleTableSchema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'upi/online']).default('cash'),
  notes: z.string().optional(),
});

export type SettleTableInput = z.infer<typeof settleTableSchema>;

// ----------------------------------------------------
// 6. ADMIN MENU ITEM & MODIFIER SCHEMAS
// ----------------------------------------------------
export const modifierOptionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Option name is required'),
  priceExtra: z.number().int().nonnegative().default(0),
});

export type ModifierOptionInput = z.infer<typeof modifierOptionInputSchema>;

export const modifierGroupInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Group name is required'),
  rule: z.enum(['radio', 'checkbox']).default('checkbox'),
  required: z.boolean().default(false),
  options: z.array(modifierOptionInputSchema).default([]),
});

export type ModifierGroupInput = z.infer<typeof modifierGroupInputSchema>;

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Item title is required'),
  categoryId: z.string().min(1, 'Category is required'),
  basePrice: z.number().int().positive('Price must be greater than 0'),
  description: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
  isVegetarian: z.boolean().optional().default(false),
  isBestseller: z.boolean().optional().default(false),
  isChefSpecial: z.boolean().optional().default(false),
  spicyLevel: z.number().int().min(0).max(3).optional().default(0),
  preparationTime: z.string().optional().default('10-15 mins'),
  sortOrder: z.number().int().optional().default(0),
  isAvailable: z.boolean().optional().default(true),
  modifierGroups: z.array(modifierGroupInputSchema).optional().default([]),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  basePrice: z.number().int().positive().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isVegetarian: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isChefSpecial: z.boolean().optional(),
  spicyLevel: z.number().int().min(0).max(3).optional(),
  preparationTime: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isAvailable: z.boolean().optional(),
  modifierGroups: z.array(modifierGroupInputSchema).optional(),
});

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

// ----------------------------------------------------
// 7. ADMIN CATEGORY SCHEMAS
// ----------------------------------------------------
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().optional().default('Utensils'),
  badge: z.string().optional().default(''),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const reorderCategoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int(),
    })
  ).min(1, 'At least one category is required'),
});

export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;

