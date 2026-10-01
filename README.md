# RestaurantOS — Unified Restaurant Operating System & POS

A modern, full-stack real-time restaurant operating system built with **Next.js 15**, **NestJS**, **Supabase PostgreSQL & Realtime**, **Tailwind CSS**, and **shadcn/ui**.

---

## 🍽️ System Overview

RestaurantOS integrates all guest-facing and back-of-house operations into a single cohesive platform:

1. **Customer Digital QR Ordering (`/`, `/table/[tableId]`)**:
   - Dynamic digital menu with dietary badges, real-time item availability ("86" switches), and instant search.
   - Interactive customization sheets with single-choice mandatory radios and multi-choice add-on checkboxes.
   - Real-time waiter calling, bill requests, and order status tracking.
2. **Operations Dashboard & Kitchen Stream (`/admin`, `/admin/live`)**:
   - Kanban board ("Pending", "In Kitchen", "Ready to Serve") and compact list views.
   - Live SSE & Supabase Realtime alerts with audible chimes.
   - One-click Kitchen Order Ticket (KOT) 80mm thermal receipt printing.
3. **Floor Grid & Bill Settlement Terminal (`/admin/floor`)**:
   - Live visual card grid with color-coded table occupancy badges (`Available`, `Occupied`, `Bill Requested`, `Call Waiter`).
   - Sliding billing drawer with multi-round order aggregation, manual adjustments, tax & discounts.
   - Settle & Clear workflow with 80mm Customer Final Bill printing and automatic table release.
4. **Centralized Menu Management & "86" Stock Switch (`/admin/menu`)**:
   - Daily 1-click Quick-Toggle 86 switch board with instant WebSocket & SSE broadcasts.
   - Complete category management with rank-based reordering.
   - Paginated menu catalog table with full-text search and category filtering.
   - Modifier & Variant Builder supporting custom groups, rules, and price deltas.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons, Sonner toasts, TanStack React Query, Zustand.
- **Backend**: NestJS, Drizzle ORM, Server-Sent Events (SSE), Supabase Realtime, Zod validation pipes.
- **Database**: PostgreSQL (Supabase) with Realtime replication enabled.
- **Printing**: Zero-margin high-contrast `@media print` thermal printing for 80mm ESC/POS hardware.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18
- npm or pnpm

### 2. Environment Configuration

Create `.env.local` in the root:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Create `backend/.env`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 3. Installation & Running

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Start backend server
cd backend && npm run start:dev

# Start frontend application
npm run dev
```

The web application runs at `http://localhost:3000` and the API server at `http://localhost:4000`.

---

## 📄 License

MIT
