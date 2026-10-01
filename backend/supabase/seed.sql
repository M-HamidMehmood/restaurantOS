-- ==============================================================================
-- RESTAURANTOS — PHASE 2: SEED DATA
-- 3 Tables, 3 Categories, 8 Dishes with Item Modifiers
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED TABLES (3 Tables: available, occupied, bill_requested)
-- ------------------------------------------------------------------------------
INSERT INTO tables (id, table_number, qr_slug, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'T-01', 'table-1', 'available'),
    ('a0000000-0000-0000-0000-000000000002', 'T-02', 'table-2', 'occupied'),
    ('a0000000-0000-0000-0000-000000000003', 'T-03', 'table-3', 'bill_requested')
ON CONFLICT (table_number) DO UPDATE
SET qr_slug = EXCLUDED.qr_slug, status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 2. SEED CATEGORIES (3 Categories)
-- ------------------------------------------------------------------------------
INSERT INTO categories (id, name, sort_order, is_active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Burgers', 1, true),
    ('b0000000-0000-0000-0000-000000000002', 'Shawarma', 2, true),
    ('b0000000-0000-0000-0000-000000000003', 'Chai & Beverages', 3, true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ------------------------------------------------------------------------------
-- 3. SEED MENU ITEMS (8 Authentic Cafe Dishes)
-- ------------------------------------------------------------------------------
INSERT INTO menu_items (id, category_id, name, description, base_price, image_url, is_available)
VALUES
    -- 1. Anda Shami Burger
    (
        'c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'Anda Shami Burger',
        'The legendary Pakistani street burger: spiced dal & beef shami patty, fried egg, shredded cabbage, and tangy mint raita in toasted sesame bun.',
        280.00,
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        true
    ),
    -- 2. Zinger Burger
    (
        'c0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000001',
        'Zinger Burger',
        'Crunchy golden fried spiced chicken breast fillet, creamy mayo garlic sauce, and crisp iceberg lettuce in a toasted bun.',
        490.00,
        'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
        true
    ),
    -- 3. Kababish Burger
    (
        'c0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000001',
        'Kababish Burger',
        'Smoky charcoal-grilled chicken seekh kebab wrapped with sliced onions, melted cheese, and mint chutney in a fresh bun.',
        390.00,
        'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        true
    ),
    -- 4. Chicken Shawarma
    (
        'c0000000-0000-0000-0000-000000000004',
        'b0000000-0000-0000-0000-000000000002',
        'Chicken Shawarma',
        'Slow-roasted spit chicken shaved thin, rolled in soft pita bread with Lebanese garlic toum and crispy french fries.',
        260.00,
        'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
        true
    ),
    -- 5. Zinger Shawarma
    (
        'c0000000-0000-0000-0000-000000000005',
        'b0000000-0000-0000-0000-000000000002',
        'Zinger Shawarma',
        'Crispy spiced chicken fillet strips tossed in fiery peri-peri dressing and wrapped with pickled jalapeños in grilled pita.',
        350.00,
        'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=800&q=80',
        true
    ),
    -- 6. Loaded Fries with Chicken
    (
        'c0000000-0000-0000-0000-000000000006',
        'b0000000-0000-0000-0000-000000000001',
        'Loaded Fries with Chicken',
        'Jumbo crispy skin-on fries smothered in hot cheddar cheese sauce, roasted shredded chicken, and smoky jalapeño ranch.',
        420.00,
        'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
        true
    ),
    -- 7. Karak Everyday Chai
    (
        'c0000000-0000-0000-0000-000000000007',
        'b0000000-0000-0000-0000-000000000003',
        'Karak Everyday Chai',
        'Traditional strong street tea brewed with loose black leaves, crushed cardamom pods, and evaporated milk.',
        100.00,
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
        true
    ),
    -- 8. Special Doodh Patti Chai
    (
        'c0000000-0000-0000-0000-000000000008',
        'b0000000-0000-0000-0000-000000000003',
        'Special Doodh Patti Chai',
        'Cooked exclusively in pure whole buffalo milk without a single drop of water. Rich, velvety, and deeply aromatic.',
        130.00,
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
        true
    )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, base_price = EXCLUDED.base_price;

-- ------------------------------------------------------------------------------
-- 4. SEED ITEM MODIFIERS
-- ------------------------------------------------------------------------------
INSERT INTO item_modifiers (id, menu_item_id, name, price_extra)
VALUES
    -- Anda Shami Burger Modifiers
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Cheddar Cheese Slice', 60.00),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Crispy Fried Egg (Half/Full)', 50.00),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Extra Shami Kebab Patty', 90.00),
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Teekha Masala & Green Chili', 20.00),

    -- Zinger Burger Modifiers
    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'Cheddar Cheese Slice', 60.00),
    ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Garlic Mayo Dip Shot', 30.00),

    -- Chicken Shawarma Modifiers
    ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'Extra Shredded Chicken', 80.00),
    ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', 'Melted Mozzarella Cheese', 70.00),

    -- Doodh Patti Chai Modifiers
    ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000008', 'Thick Malai Dollop', 30.00),
    ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000008', 'Kashmiri Zafran (Saffron)', 50.00)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. SAMPLE ORDERS & ORDER ITEMS (For Table 2: Occupied)
-- ------------------------------------------------------------------------------
INSERT INTO orders (id, table_id, status, total_amount, payment_status, payment_method)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000002', -- Table T-02
        'preparing',
        770.00,
        'unpaid',
        'cash'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, selected_modifiers, notes)
VALUES
    (
        'f0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001', -- Anda Shami Burger
        2,
        340.00, -- Base 280 + 60 cheese
        '[{"name": "Cheddar Cheese Slice", "price_extra": 60.00}]'::jsonb,
        'Extra crispy shami patty please'
    ),
    (
        'f0000000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000007', -- Karak Everyday Chai
        1,
        100.00,
        '[]'::jsonb,
        'Serve hot after burger'
    )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. SAMPLE SERVICE REQUEST (For Table 3: Bill Requested)
-- ------------------------------------------------------------------------------
INSERT INTO service_requests (id, table_id, type, status)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000003', -- Table T-03
        'bill_request',
        'pending'
    )
ON CONFLICT (id) DO NOTHING;
