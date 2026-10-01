import * as dotenv from 'dotenv';
dotenv.config();

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

async function seed() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL or DIRECT_URL is required to run seed.');
    process.exit(1);
  }

  console.log('🌱 Connecting to database for Phase 2 seeding...');
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });

  try {
    // ----------------------------------------------------
    // 1. SEED 3 TABLES (available, occupied, bill_requested)
    // ----------------------------------------------------
    console.log('🍽️ Seeding 3 restaurant tables...');
    const tablesData: Array<typeof schema.tables.$inferInsert> = [
      { id: 'a0000000-0000-0000-0000-000000000001', tableNumber: 'T-01', qrSlug: 'table-1', displayName: 'Table 01', status: 'available', capacity: 2 },
      { id: 'a0000000-0000-0000-0000-000000000002', tableNumber: 'T-02', qrSlug: 'table-2', displayName: 'Table 02', status: 'occupied', capacity: 4 },
      { id: 'a0000000-0000-0000-0000-000000000003', tableNumber: 'T-03', qrSlug: 'table-3', displayName: 'Table 03', status: 'bill_requested', capacity: 4 },
    ];

    for (const tbl of tablesData) {
      await db
        .insert(schema.tables)
        .values(tbl)
        .onConflictDoUpdate({
          target: schema.tables.tableNumber,
          set: { qrSlug: tbl.qrSlug, status: tbl.status, displayName: tbl.displayName },
        });
    }

    // ----------------------------------------------------
    // 2. SEED 3 CATEGORIES
    // ----------------------------------------------------
    console.log('📂 Seeding 3 food categories...');
    const categoriesData: Array<typeof schema.categories.$inferInsert> = [
      { id: 'b0000000-0000-0000-0000-000000000001', name: 'Burgers', sortOrder: 1, isActive: true, icon: 'Sandwich', badge: 'Special' },
      { id: 'b0000000-0000-0000-0000-000000000002', name: 'Shawarma', sortOrder: 2, isActive: true, icon: 'UtensilsCrossed', badge: 'Popular' },
      { id: 'b0000000-0000-0000-0000-000000000003', name: 'Chai & Beverages', sortOrder: 3, isActive: true, icon: 'Coffee', badge: 'Karak' },
    ];

    for (const cat of categoriesData) {
      await db
        .insert(schema.categories)
        .values(cat)
        .onConflictDoUpdate({
          target: schema.categories.id,
          set: { name: cat.name, sortOrder: cat.sortOrder, isActive: cat.isActive },
        });
    }

    // ----------------------------------------------------
    // 3. SEED 8 DISHES WITH ITEM MODIFIERS
    // ----------------------------------------------------
    console.log('🍔 Seeding 8 authentic cafe dishes and item modifiers...');

    type DishSeed = typeof schema.menuItems.$inferInsert & {
      modifiersList: Array<{ name: string; priceExtra: number }>;
    };

    const dishesToSeed: DishSeed[] = [
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        categoryId: 'b0000000-0000-0000-0000-000000000001',
        name: 'Anda Shami Burger',
        description: 'The legendary Pakistani street burger: spiced dal & beef shami patty, fried egg, shredded cabbage, and tangy mint raita in toasted sesame bun.',
        basePrice: 280,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        isChefSpecial: true,
        sortOrder: 1,
        modifiersList: [
          { name: 'Cheddar Cheese Slice', priceExtra: 60 },
          { name: 'Crispy Fried Egg (Half/Full)', priceExtra: 50 },
          { name: 'Extra Shami Kebab Patty', priceExtra: 90 },
          { name: 'Teekha Masala & Green Chili', priceExtra: 20 },
        ],
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        categoryId: 'b0000000-0000-0000-0000-000000000001',
        name: 'Zinger Burger',
        description: 'Crunchy golden fried spiced chicken breast fillet, creamy mayo garlic sauce, and crisp iceberg lettuce in a toasted bun.',
        basePrice: 490,
        imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        sortOrder: 2,
        modifiersList: [
          { name: 'Cheddar Cheese Slice', priceExtra: 60 },
          { name: 'Garlic Mayo Dip Shot', priceExtra: 30 },
        ],
      },
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        categoryId: 'b0000000-0000-0000-0000-000000000001',
        name: 'Kababish Burger',
        description: 'Smoky charcoal-grilled chicken seekh kebab wrapped with sliced onions, melted cheese, and mint chutney in a fresh bun.',
        basePrice: 390,
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isChefSpecial: true,
        sortOrder: 3,
        modifiersList: [
          { name: 'Extra Seekh Kebab', priceExtra: 90 },
          { name: 'Desi Mint Chutney', priceExtra: 20 },
        ],
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        categoryId: 'b0000000-0000-0000-0000-000000000002',
        name: 'Chicken Shawarma',
        description: 'Slow-roasted spit chicken shaved thin, rolled in soft pita bread with Lebanese garlic toum and crispy french fries.',
        basePrice: 260,
        imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        sortOrder: 4,
        modifiersList: [
          { name: 'Extra Shredded Chicken', priceExtra: 80 },
          { name: 'Melted Mozzarella Cheese', priceExtra: 70 },
        ],
      },
      {
        id: 'c0000000-0000-0000-0000-000000000005',
        categoryId: 'b0000000-0000-0000-0000-000000000002',
        name: 'Zinger Shawarma',
        description: 'Crispy spiced chicken fillet strips tossed in fiery peri-peri dressing and wrapped with pickled jalapeños in grilled pita.',
        basePrice: 350,
        imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        sortOrder: 5,
        modifiersList: [
          { name: 'Fiery Peri Peri Sauce', priceExtra: 20 },
          { name: 'Pickled Jalapeño Slices', priceExtra: 30 },
        ],
      },
      {
        id: 'c0000000-0000-0000-0000-000000000006',
        categoryId: 'b0000000-0000-0000-0000-000000000001',
        name: 'Loaded Fries with Chicken',
        description: 'Jumbo crispy skin-on fries smothered in hot cheddar cheese sauce, roasted shredded chicken, and smoky jalapeño ranch.',
        basePrice: 420,
        imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isChefSpecial: true,
        sortOrder: 6,
        modifiersList: [
          { name: 'Extra Hot Cheddar Sauce', priceExtra: 50 },
        ],
      },
      {
        id: 'c0000000-0000-0000-0000-000000000007',
        categoryId: 'b0000000-0000-0000-0000-000000000003',
        name: 'Karak Everyday Chai',
        description: 'Traditional strong street tea brewed with loose black leaves, crushed cardamom pods, and evaporated milk.',
        basePrice: 100,
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isBestseller: true,
        sortOrder: 7,
        modifiersList: [
          { name: 'Crushed Cardamom Pods', priceExtra: 20 },
          { name: 'Natural Brown Gur (Jaggery)', priceExtra: 20 },
        ],
      },
      {
        id: 'c0000000-0000-0000-0000-000000000008',
        categoryId: 'b0000000-0000-0000-0000-000000000003',
        name: 'Special Doodh Patti Chai',
        description: 'Cooked exclusively in pure whole buffalo milk without a single drop of water. Rich, velvety, and deeply aromatic.',
        basePrice: 130,
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
        isChefSpecial: true,
        sortOrder: 8,
        modifiersList: [
          { name: 'Thick Malai Dollop', priceExtra: 30 },
          { name: 'Kashmiri Zafran (Saffron)', priceExtra: 50 },
        ],
      },
    ];

    for (const dish of dishesToSeed) {
      const { modifiersList, ...dishData } = dish;

      await db
        .insert(schema.menuItems)
        .values(dishData)
        .onConflictDoUpdate({
          target: schema.menuItems.id,
          set: {
            name: dishData.name,
            description: dishData.description,
            basePrice: dishData.basePrice,
            imageUrl: dishData.imageUrl,
            isAvailable: dishData.isAvailable,
          },
        });

      for (const [index, mod] of modifiersList.entries()) {
        const modId = `mod-${dishData.id}-${index + 1}`;
        await db
          .insert(schema.itemModifiers)
          .values({
            id: modId,
            menuItemId: dishData.id,
            name: mod.name,
            priceExtra: mod.priceExtra,
          })
          .onConflictDoUpdate({
            target: schema.itemModifiers.id,
            set: {
              name: mod.name,
              priceExtra: mod.priceExtra,
            },
          });
      }
    }

    // ----------------------------------------------------
    // 4. SEED SAMPLE ACTIVE ORDER (Table 2: Occupied)
    // ----------------------------------------------------
    console.log('📝 Seeding sample active order for Table T-02...');
    const sampleOrderId = 'e0000000-0000-0000-0000-000000000001';
    await db
      .insert(schema.orders)
      .values({
        id: sampleOrderId,
        tableId: 'a0000000-0000-0000-0000-000000000002', // T-02
        tableNumber: 'T-02',
        status: 'preparing',
        paymentStatus: 'unpaid',
        paymentMethod: 'cash',
        totalAmount: 770,
        subtotal: 700,
        serviceCharge: 35,
        tax: 35,
        notes: 'Extra crispy shami patty please',
      })
      .onConflictDoNothing();

    await db
      .insert(schema.orderItems)
      .values([
        {
          id: 'f0000000-0000-0000-0000-000000000001',
          orderId: sampleOrderId,
          menuItemId: 'c0000000-0000-0000-0000-000000000001', // Anda Shami Burger
          quantity: 2,
          unitPrice: 340,
          selectedModifiers: [{ name: 'Cheddar Cheese Slice', priceExtra: 60 }],
          notes: 'Extra mint raita',
        },
        {
          id: 'f0000000-0000-0000-0000-000000000002',
          orderId: sampleOrderId,
          menuItemId: 'c0000000-0000-0000-0000-000000000007', // Karak Chai
          quantity: 1,
          unitPrice: 100,
          selectedModifiers: [],
          notes: 'Serve hot',
        },
      ])
      .onConflictDoNothing();

    // ----------------------------------------------------
    // 5. SEED SAMPLE SERVICE REQUEST (Table 3: Bill Requested)
    // ----------------------------------------------------
    console.log('🛎️ Seeding sample bill request for Table T-03...');
    await db
      .insert(schema.serviceRequests)
      .values({
        id: '00000000-0000-0000-0000-000000000001',
        tableId: 'a0000000-0000-0000-0000-000000000003', // T-03
        tableNumber: 'T-03',
        type: 'bill_request',
        status: 'pending',
        paymentMethod: 'card',
      })
      .onConflictDoNothing();

    console.log('✅ Phase 2 Seeding completed successfully! 3 Tables, 3 Categories, 8 Dishes seeded.');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end({ timeout: 5 });
  }
}

seed();
