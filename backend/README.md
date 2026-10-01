# RestaurantOS Backend — Production NestJS Starter

Production-grade, modular NestJS starter configured with **TypeScript**, **Drizzle ORM**, **PostgreSQL (Supabase)**, and the high-performance **Fastify engine**.

---

## 🛠️ Tech Stack Specifications

- **Framework:** NestJS (TypeScript) with `@nestjs/platform-fastify`
- **Database:** PostgreSQL on Supabase (pooled connections for runtime & direct connection for migrations)
- **ORM:** Drizzle ORM (`drizzle-orm`) paired with `postgres` (postgres.js driver)
- **Migration Tooling:** `drizzle-kit`
- **Config & Validation:** `@nestjs/config` with strict Zod validation
- **DTO Validation:** `class-validator` & `class-transformer`
- **Documentation:** `@nestjs/swagger` with `@fastify/static`
- **Auth Integration:** Supabase JWT validation strategy (Bearer auth guard with `@Public()` decorator support)

---

## 📂 Project Directory Structure

```
backend/
├── drizzle/                      # Generated SQL migration files (drizzle-kit)
│   └── 0000_dear_ben_grimm.sql
├── src/
│   ├── common/                   # Shared guards, decorators, filters, interceptors
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   │   ├── public.decorator.ts        # @Public()
│   │   │   └── roles.decorator.ts         # @Roles()
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts   # Global Fastify exception filter
│   │   ├── guards/
│   │   │   └── supabase-auth.guard.ts     # Global Supabase JWT guard
│   │   └── interceptors/
│   │       ├── logging.interceptor.ts     # Request latency logger
│   │       └── transform.interceptor.ts   # Response envelope
│   ├── config/                   # Zod environment schemas & validation
│   │   ├── env.schema.ts
│   │   └── env.validation.ts
│   ├── database/                 # Drizzle module, schemas, relations, seeders
│   │   ├── schema/
│   │   │   ├── tables.schema.ts           # restaurant_tables
│   │   │   ├── menu.schema.ts             # categories, menu_items, modifier_groups, options
│   │   │   ├── orders.schema.ts           # orders, order_items, logs
│   │   │   ├── service-requests.schema.ts # service_requests
│   │   │   ├── relations.ts               # Drizzle entity relations
│   │   │   └── index.ts
│   │   ├── database.constants.ts          # Injection tokens
│   │   ├── database.service.ts            # DrizzleDB provider & ping
│   │   ├── database.module.ts             # Global DatabaseModule
│   │   └── seed.ts                        # Master Pakistani Cafe seeder
│   ├── modules/                  # Modular feature domain modules
│   │   ├── auth/                          # Supabase JWT passport strategy & user profile
│   │   ├── health/                        # Health check & DB ping
│   │   ├── tables/                        # QR lookup, session binding, table statuses
│   │   ├── menu/                          # Menu catalog & modifier options
│   │   ├── orders/                        # Order placement, anti-fraud calculations, SSE stream
│   │   └── service-requests/              # Call waiter (120s cooldown), request bill
│   ├── app.module.ts             # Root AppModule
│   └── main.ts                   # Fastify bootstrap & Swagger setup
├── drizzle.config.ts             # Drizzle Kit config
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
├── .env
└── README.md
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase connection strings:
```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL`: Supabase Transaction Pooler connection string (`port 6543`, `prepare: false` handled automatically).
- `DIRECT_URL`: Supabase Direct connection string (`port 5432`) used by Drizzle Kit for schema migrations.
- `SUPABASE_JWT_SECRET`: JWT secret from Supabase Dashboard $\rightarrow$ Project Settings $\rightarrow$ API.

### 3. Generate & Run Database Migrations
```bash
# Generate SQL migration files from schema
npm run db:generate

# Push schema directly to database (development)
npm run db:push

# Or run migration scripts
npm run db:migrate
```

### 4. Seed Pakistani Cafe Menu & Tables
```bash
npm run db:seed
```
Seeds 10 restaurant tables (`T-01` to `T-10`), 8 categories, and full authentic dishes (Anda Shami Burger, Zinger Burger, Shawarma, Loaded Fries, Karak Doodh Patti Chai, etc.) with modifier groups.

### 5. Start Development Server
```bash
npm run start:dev
```
- API Base: `http://localhost:4000`
- Interactive Swagger OpenAPI UI: **`http://localhost:4000/docs`**

---

## 📡 REST API & Real-Time Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System and database ping health check |
| `GET` | `/api/tables/:tableId` | Public | Validate table QR code and dining session |
| `GET` | `/api/tables` | Public | List all restaurant tables |
| `GET` | `/api/menu` | Public | Full dish catalog and modifier options (cached) |
| `POST` | `/api/orders` | Public | Place order (recalculates prices server-side, anti-fraud check) |
| `GET` | `/api/orders/:orderId` | Public | Retrieve order status and items |
| `GET` | `/api/tables/:tableId/active-orders` | Public | Get active orders for a customer dining session |
| `PATCH` | `/api/orders/:orderId/status` | Bearer Auth | Update order cooking status (Kitchen KDS) |
| `GET` | `/api/orders/:orderId/stream` | Public | **Server-Sent Events (SSE)** real-time order tracking |
| `GET` | `/api/tables/:tableId/stream` | Public | **SSE** stream for whole-table events |
| `POST` | `/api/service/call-waiter` | Public | Alert staff with **120-second anti-spam cooldown** |
| `POST` | `/api/service/request-bill` | Public | Finalize dining check and alert cashier POS |
| `GET` | `/api/service/active` | Bearer Auth | List unresolved service alerts (Staff / POS) |
| `GET` | `/api/auth/me` | Bearer Auth | Get current authenticated Supabase user profile |

---

## 🔒 Supabase Auth & Security Architecture

1. **Global Auth Guard with `@Public()` Exemption:**
   `SupabaseAuthGuard` is registered globally. Customer-facing mobile ordering endpoints are explicitly decorated with `@Public()`. Protected staff/KDS endpoints require a valid Supabase JWT Bearer token.
2. **Server-Authoritative Pricing (Anti-Fraud):**
   The client-submitted `unitPrice` and `totalAmount` are never trusted. The backend queries PostgreSQL for real base prices, adds selected modifier prices, applies taxes (5% Service + 5% GST), and rejects tampering with `422 PRICE_MISMATCH`.
3. **Anti-Spam Rate Limiting:**
   `POST /api/service/call-waiter` enforces a strict 120-second cooldown per table, rejecting rapid successive requests with `429 COOLDOWN_ACTIVE`.
