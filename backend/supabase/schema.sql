-- ==============================================================================
-- RESTAURANTOS — PHASE 2: DATABASE SCHEMA & DATA MODELS
-- Optimized for QR Ordering, POS Synchronization & Supabase Realtime
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE table_status AS ENUM ('available', 'occupied', 'bill_requested');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi/online');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_request_type AS ENUM ('call_waiter', 'bill_request');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_request_status AS ENUM ('pending', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. TABLES DEFINITIONS
-- ------------------------------------------------------------------------------

-- TABLE: tables
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number VARCHAR(50) NOT NULL UNIQUE,
    qr_slug VARCHAR(100) NOT NULL UNIQUE,
    status table_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- TABLE: menu_items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true, -- "86" Switch to immediately hide from menu
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: item_modifiers
CREATE TABLE IF NOT EXISTS item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_extra NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- TABLE: orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    payment_method payment_method,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    selected_modifiers JSONB DEFAULT '[]'::jsonb,
    notes TEXT
);

-- TABLE: service_requests
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    type service_request_type NOT NULL,
    status service_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES (Optimized for QR scan lookups, Kitchen KDS, and POS sync)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tables_qr_slug ON tables (qr_slug);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables (status);

CREATE INDEX IF NOT EXISTS idx_categories_sort_active ON categories (sort_order, is_active);

CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items (category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items (is_available);

CREATE INDEX IF NOT EXISTS idx_item_modifiers_menu_item_id ON item_modifiers (menu_item_id);

CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders (table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items (menu_item_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_table_id ON service_requests (table_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests (status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests (created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. SUPABASE REALTIME CONFIGURATION
-- ------------------------------------------------------------------------------
-- Enable real-time replication for kitchen tickets, waiter calls, and table states
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders, order_items, service_requests, tables;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;
