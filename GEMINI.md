# GEMINI.md — RestaurantOS Project Context & Agent Guide

> **Quick AI Context Rule**: Read this document first. It contains the architecture, schema definitions, operational flows, live URLs, and gotchas for **RestaurantOS**. Avoid re-scanning the entire codebase unless inspecting a specific bug.

---

## 1. Project Overview & Architecture

**RestaurantOS** is a full-stack, real-time restaurant operating system and POS terminal designed for high-turnover casual dining, street food cafes, and cloud kitchens (branded as *Chaska & Chai Cafe*).

### Live Infrastructure & Deployments
- **GitHub Repository**: [`https://github.com/M-HamidMehmood/restaurantOS`](https://github.com/M-HamidMehmood/restaurantOS) (Public, `main` branch)
- **Frontend (Vercel)**: [`https://restaurant-os-nine-fawn.vercel.app`](https://restaurant-os-nine-fawn.vercel.app)
  - Vercel Project: `hamid2117s-projects/restaurant-os`
  - Connected for automated deployments on every `git push origin main`
- **Backend (Render Blueprint)**: [`backend/render.yaml`](file:///Users/laptopchoice/Downloads/resturantOS/backend/render.yaml)
- **Database & Realtime Engine**: Remote Supabase PostgreSQL (`db.ivfvxnwciuqicqqnlbtx.supabase.co`) with Supabase Realtime WebSockets (`pos_staff`, `pos_menu`)

---

## 2. Tech Stack

### Frontend (`/src`)
- **Framework**: Next.js 15.5 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, warm amber/stone palette, Lucide React icons
- **State Management**: Zustand (`useMenuStore.ts`), TanStack React Query v5
- **Toasts & Feedback**: Sonner (`toast.success`, `toast.error`, `toast.info`), Web Audio API chimes (`src/lib/sound.ts`)
- **Forms & Validation**: Zod, React Hook Form, Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-radio-group`, `@radix-ui/react-checkbox`)

### Backend (`/backend`)
- **Framework**: NestJS 10 with Fastify HTTP adapter (`@nestjs/platform-fastify`)
- **ORM & DB**: Drizzle ORM, `postgres` driver (connecting with SSL to Supabase)
- **Realtime**: `@supabase/supabase-js` RealtimeChannel broadcasts + RxJS Subjects for Server-Sent Events (SSE) fallback
- **Validation**: Zod Validation Pipe (`backend/src/common/pipes/zod-validation.pipe.ts`), class-validator

---

## 3. Real-Time Data Pipeline

```
[Customer Mobile / Admin Action]
             │
             ▼ (HTTP REST)
  [Fastify NestJS Backend]
             │
             ├─► [Supabase PostgreSQL (Drizzle ORM)]
             │
             ▼
  [RealtimeService Broadcast]
             │
             ▼ (WebSocket)
  [Supabase Realtime Channel: 'pos_staff']
             │
   ┌─────────┴─────────┐
   ▼                   ▼
[Customer View]    [Admin Portal]
(greys out 86'd,   (plays chime, updates
 updates orders)    Kanban/Floor/Stats)
```

### Broadcast Channels & Events
- **Primary Channel**: `pos_staff` (Supabase Realtime WebSockets)
- **Events**:
  - `order:new`: Placed order with items, modifiers, total. Triggers kitchen chime + toast.
  - `order:status_updated`: `pending` ➔ `in_kitchen` ➔ `ready` (plays ready chime) ➔ `delivered` ➔ `completed`.
  - `service:call_waiter`: Diner pressed "Call Waiter". Triggers pulsing red border on Floor grid + banner alert.
  - `service:bill_request`: Diner requested bill settlement (cash/card). Triggers orange badge on Floor grid.
  - `table:settled`: Order marked paid, resets table status to `available`.
  - `menu:item_toggled`: 1-click 86-stock switch (`is_available`). Customer QR menus grey it out without reload.
- **Secondary SSE Fallback**: `/api/orders/stream/staff`, `/api/orders/stream/table/:id`

---

## 4. Database Schema & Conventions

> [!IMPORTANT]
> **Database IDs are strictly UUIDs**. When creating records in `categories`, `menu_items`, `item_modifiers`, or `tables`, always use `crypto.randomUUID()`. Strings like `mod-123` or `b123` will trigger Postgres error `invalid input syntax for type uuid`.
> Remote DB user has **DML privileges only** (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). Do not run DDL `ALTER TABLE`.

### Core Tables & Models (`backend/src/database/schema/`)
1. **`tables`**: `id` (UUID), `tableNumber` ("Table 01"), `capacity`, `status` (`available`, `occupied`, `reserved`, `maintenance`), `activeSessionToken`.
2. **`categories`**: `id` (UUID), `name`, `badge` (e.g. "Crispy", "Popular"), `icon`, `sortOrder` (integer rank), `isActive` (boolean).
3. **`menu_items`**: `id` (UUID), `categoryId`, `name`, `description`, `basePrice` (PKR integer), `imageUrl`, `isAvailable` (boolean 86 switch), `isVegetarian`, `isBestseller`, `isChefSpecial`, `spicyLevel` (0-3), `preparationTime`, `sortOrder`.
4. **`item_modifiers`**:
   - `id` (UUID), `menuItemId` (UUID), `name` (string), `priceExtra` (integer in PKR).
   - **Structured Group Convention**: Modifier groups and selection rules are serialized into the name column using format:
     `[GroupName | rule | req/opt] OptionName`
     *Examples*:
     - `[Choice of Patty | radio | req] Crispy Fried Fillet` (+Rs. 0)
     - `[Add-ons & Extras | checkbox | opt] Cheddar Cheese Slice` (+Rs. 60)
   - Parsed automatically by [`menu-modifier.utils.ts`](file:///Users/laptopchoice/Downloads/resturantOS/backend/src/modules/admin/menu-modifier.utils.ts) for customer customization modal and admin variant builder.
5. **`orders` & `order_items`**: `id`, `tableId`, `status`, `paymentStatus` (`unpaid`, `paid`), `paymentMethod` (`cash`, `card`, `online`), `totalAmount`.
6. **`service_requests`**: `id`, `tableId`, `type` (`call_waiter`, `bill_request`), `status` (`pending`, `resolved`).

---

## 5. Core Portals & Key Files Map

| Module | Route / File | Description |
| :--- | :--- | :--- |
| **Customer QR Menu** | `src/app/page.tsx`<br>`src/app/table/[tableId]/page.tsx` | Mobile-first digital menu with category tabs, search, item customization sheet, cart sheet, waiter call, and bill request dialogs. |
| **Operations Live Feed** | `src/app/admin/page.tsx`<br>`src/app/admin/live/page.tsx` | Split/toggle Kanban ("Pending", "In Kitchen", "Ready to Serve") & compact list views, waiter call banner, 80mm KOT thermal printing. |
| **Floor & Bill Settlement** | `src/app/admin/floor/page.tsx` | Visual card grid representing all tables with color-coded status badges, sliding billing drawer with multi-round aggregation, manual adjustments, tax & discounts, cash change calculator, and 80mm Customer Final Bill printing. |
| **Menu Manager & 86 Switch** | `src/app/admin/menu/page.tsx` | Daily Quick-Toggle 86 switch board with instant availability toggles, Category manager modal with rank reordering, paginated catalog table, and multi-tab dish & variant builder modal. |
| **80mm Thermal Printing** | `src/components/admin/KotThermalTicket.tsx`<br>`src/components/admin/floor/CustomerBillTicket.tsx` | Standard 80mm ESC/POS thermal printing with `@media print`, 72mm printable width, zero margins, monochrome contrast, bold preparation notes. |
| **Admin Operations Hook** | `src/hooks/useAdminOperations.ts` | Subscribes to Supabase Realtime `pos_staff` + SSE fallback, manages orders, waiter calls, audible chimes, and optimistic status updates. |
| **Admin Menu Hook** | `src/hooks/useAdminMenu.ts` | Optimistic 86 toggle, category CRUD & reordering, dish & modifier CRUD with instant cache rollback on failure. |
| **Floor Management Hook** | `src/hooks/useFloorManagement.ts` | Real-time table states, occupancy timers, order aggregation, and POST `/api/admin/tables/:id/settle` checkout. |
| **Backend Entry & CORS** | `backend/src/main.ts` | Fastify bootstrap on `0.0.0.0`, dynamic CORS origin validation (permits `*.vercel.app` & localhost), OpenAPI Swagger docs. |
| **Admin Controller & Service** | `backend/src/modules/admin/` | All POS management REST endpoints (`GET /menu/all`, `POST /menu/items`, `PATCH /menu/categories/reorder`, `POST /tables/:id/settle`, etc.). |

---

## 6. Fast Project Run & Operational Commands

### ⚡ Quick-Start (Run Both in 2 Steps)

```bash
# Terminal 1: Start Backend (Port 4000)
# NOTE: Connects to remote Supabase DB (use BypassSandbox: true if executing via agent)
cd backend && node dist/src/main.js

# Terminal 2: Start Frontend (Port 3000)
npm run dev
```

### 🧭 Active Local Portals & URLs
- **Customer QR Menu**: [`http://localhost:3000`](http://localhost:3000)
- **Live Kitchen Operations (KDS & Kanban)**: [`http://localhost:3000/admin/live`](http://localhost:3000/admin/live)
- **Floor Grid & Bill Settlement**: [`http://localhost:3000/admin/floor`](http://localhost:3000/admin/floor)
- **Menu Manager & 86 Switches**: [`http://localhost:3000/admin/menu`](http://localhost:3000/admin/menu)
- **Backend Health Check**: [`http://localhost:4000/api/health`](http://localhost:4000/api/health)
- **OpenAPI Swagger Docs**: [`http://localhost:4000/docs`](http://localhost:4000/docs)

### 🧹 Port Conflicts & Process Management
If ports 4000 or 3000 are already bound:
```bash
# Clear hanging processes on ports 4000, 3000, 3001
lsof -ti :4000,3000,3001 | xargs kill -9 2>/dev/null

# If port 3000 is occupied by another app, run frontend on 3001:
npm run dev -- -p 3001
```

### 🔄 Rebuilding Backend After Code Changes
```bash
cd backend && npm run build && node dist/src/main.js
```

### 🧪 Fast Health & Simulation Verification
```bash
# 1. Verify Backend is responding
curl -s http://localhost:4000/api/health

# 2. Dispatch a quick simulated order to Table T-04
curl -s -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"tableId":"T-04","items":[{"menuItemId":"c0000000-0000-0000-0000-000000000001","quantity":1,"selectedModifiers":[],"notes":"Fast verify order"}]}'
```

### 🚀 Git & Deployment
```bash
# Commit & push changes (Vercel automatically redeploys production frontend)
git add .
git commit -m "feat/fix: description"
git push origin main

# Deploy frontend manually via Vercel CLI (if needed)
npx --yes vercel build --prod --yes && npx --yes vercel deploy --prebuilt --prod --yes
```

---

## 7. Rules & Best Practices for Future AI Turns

1. **Token Conservation**:
   - Refer to this document (`GEMINI.md`) for architecture and file paths instead of running exploratory search or `find` commands.
   - Do NOT run full-code replacements on large files (>200 lines); use `replace_file_content` with concise line ranges.
2. **Database Integrity**:
   - Use `crypto.randomUUID()` for all newly created database entities.
   - Respect the serialized modifier convention: `[Group Name | rule | req/opt] Option Name`.
3. **Thermal Receipt Safety**:
   - Never remove `@media print` CSS classes from `KotThermalTicket.tsx` and `CustomerBillTicket.tsx`.
   - Maintain high contrast monochrome typography (no light grey text in print stylesheets).
4. **Environment Variables**:
   - Root `.env.local`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Backend `.env`: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `CORS_ORIGINS`.
   - NEVER commit `.env` or `.env.local` files to Git.
