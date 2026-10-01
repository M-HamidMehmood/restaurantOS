# RestaurantOS — Master Backend Specification
**Phase 1: Customer QR Ordering Web App (Mobile-First)**

> **Document Version:** 1.0.0  
> **Target Audience:** Backend Engineers, System Architects, DevOps, QA  
> **Status:** Production-Ready Specification  
> **Client Application:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query

---

## Table of Contents
1. [Architecture & System Context](#1-architecture--system-context)
2. [Data Models & Schema (PostgreSQL & Prisma)](#2-data-models--schema-postgresql--prisma)
3. [REST API Endpoints Specification](#3-rest-api-endpoints-specification)
   - [3.1 Table Sessions & Routing](#31-table-sessions--routing)
   - [3.2 Menu & Modifiers Ingestion](#32-menu--modifiers-ingestion)
   - [3.3 Order Placement (Checkout Action)](#33-order-placement-checkout-action)
   - [3.4 Active Orders & Real-time Live Status](#34-active-orders--real-time-live-status)
   - [3.5 Service Actions (Waiter Call & Bill Request)](#35-service-actions-waiter-call--bill-request)
4. [Real-Time Event Engine (SSE & WebSockets)](#4-real-time-event-engine-sse--websockets)
5. [Business Logic, Calculation & Anti-Fraud Rules](#5-business-logic-calculation--anti-fraud-rules)
6. [Anti-Spam Rate Limiting (Redis Implementation)](#6-anti-spam-rate-limiting-redis-implementation)
7. [Error Handling & Standard Error Codes](#7-error-handling--standard-error-codes)
8. [Environment Variables & Configuration](#8-environment-variables--configuration)
9. [Verification & Curl Testing Recipes](#9-verification--curl-testing-recipes)

---

## 1. Architecture & System Context

The customer ordering interface operates without customer authentication (frictionless QR ordering). A customer scans a physical QR code placed at their table which encodes a URL containing the table identifier (e.g., `https://menu.cafe.com/table/T-04` or `https://menu.cafe.com/menu?table=T-04`).

```mermaid
flowchart TD
    Client["Customer Mobile Browser (Frontend)"]
    API["API Gateway / Backend Server (Express / NestJS / Fastify)"]
    DB[(PostgreSQL Database)]
    Redis[(Redis Cache & Pub/Sub)]
    KDS["Kitchen Display System (KDS)"]
    POS["Cashier / POS Terminal"]
    Staff["Waitstaff Smartwatch / Tablet"]

    Client -- "1. POST /api/orders" --> API
    API -- "Verify & Save" --> DB
    API -- "Publish 'order.created'" --> Redis
    Redis -- "Push Ticket" --> KDS
    KDS -- "Update: PREPARING / SERVED" --> API
    API -- "SSE Stream Event" --> Client

    Client -- "2. POST /api/service/call-waiter" --> API
    API -- "Check Redis 120s TTL" --> Redis
    API -- "Publish 'waiter.called'" --> Staff

    Client -- "3. POST /api/service/request-bill" --> API
    API -- "Publish 'bill.requested'" --> POS
```

---

## 2. Data Models & Schema (PostgreSQL & Prisma)

The relational schema must handle menu items, hierarchical modifier groups, active table sessions, multi-order tables, and audit logs.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ----------------------------------------------------
// ENUMS
// ----------------------------------------------------
enum TableStatus {
  AVAILABLE   // Table is empty, ready for guests
  OCCUPIED    // Guests seated, active order in progress
  BILLING     // Guests requested check
  CLEANING    // Table being sanitized
}

enum OrderStatus {
  RECEIVED    // Order accepted by kitchen POS/KDS
  PREPARING   // Chef cooking on grill / stove
  SERVED      // Food delivered to table
  COMPLETED   // Paid and closed
  CANCELLED   // Voided by staff
}

enum PaymentMethod {
  CASH
  CARD
  CONTACTLESS
  SPLIT
}

enum WaiterReason {
  GENERAL
  WATER
  CUTLERY
  CLEAN_TABLE
  ORDER_HELP
}

// ----------------------------------------------------
// 1. TABLE MANAGEMENT
// ----------------------------------------------------
model RestaurantTable {
  id              String           @id @default(uuid())
  tableNumber     String           @unique // e.g. "T-04"
  displayName     String           // e.g. "Table 04"
  capacity        Int              @default(4)
  qrCodeUrl       String?
  status          TableStatus      @default(AVAILABLE)
  currentSessionId String?         // Unique UUID per guest dining session
  orders          Order[]
  serviceRequests ServiceRequest[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([tableNumber])
  @@index([status])
}

// ----------------------------------------------------
// 2. MENU CATALOG & MODIFIERS
// ----------------------------------------------------
model Category {
  id        String     @id // e.g. "burgers", "shawarma", "tea"
  name      String     // e.g. "Burgers"
  icon      String     // Lucide icon name: e.g. "Sandwich", "Flame"
  badge     String?    // e.g. "Special", "Karak"
  sortOrder Int        @default(0)
  isActive  Boolean    @default(true)
  items     MenuItem[]

  @@index([sortOrder])
}

model MenuItem {
  id              String          @id // e.g. "burger-anda-shami"
  name            String
  description     String
  price           Int             // Stored in whole PKR (e.g. 280)
  image           String          // CDN image URL
  categoryId      String
  category        Category        @relation(fields: [categoryId], references: [id])
  isVegetarian    Boolean         @default(false)
  isVegan         Boolean         @default(false)
  isGlutenFree    Boolean         @default(false)
  spicyLevel      Int             @default(0) // 0 to 3
  isOutOfStock    Boolean         @default(false)
  isChefSpecial   Boolean         @default(false)
  isBestseller    Boolean         @default(false)
  calories        Int?
  preparationTime String?         // e.g. "8-10 min"
  allergens       String[]        // e.g. ["Eggs", "Gluten"]
  tags            String[]        // e.g. ["Street Food", "Karachi Special"]
  sortOrder       Int             @default(0)
  modifierGroups  ModifierGroup[]
  orderItems      OrderItem[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([categoryId])
  @@index([isOutOfStock])
}

model ModifierGroup {
  id          String           @id // e.g. "spice_level", "bun_choice", "burger_addons"
  name        String           // e.g. "Spice Level", "Add-ons & Extras"
  description String?          // e.g. "Choose your desired heat intensity"
  minSelect   Int              @default(0) // 1 = required, 0 = optional
  maxSelect   Int              @default(1) // 1 = radio (single), >1 = checkbox (multi)
  required    Boolean          @default(false)
  menuItemId  String
  menuItem    MenuItem         @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  options     ModifierOption[]
  sortOrder   Int              @default(0)

  @@index([menuItemId])
}

model ModifierOption {
  id          String        @id // e.g. "spice_teekha", "add_cheese"
  name        String        // e.g. "Teekha (+Rs. 20)", "Cheddar Cheese Slice"
  price       Int           @default(0) // Additional cost in PKR (e.g. 20, 60)
  isDefault   Boolean       @default(false)
  isAvailable Boolean       @default(true) // Out-of-stock toggle for specific option
  groupId     String
  group       ModifierGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  sortOrder   Int           @default(0)

  @@index([groupId])
}

// ----------------------------------------------------
// 3. ORDERS & ORDER ITEMS
// ----------------------------------------------------
model Order {
  id               String           @id // e.g. "ORD-2575"
  tableNumber      String           // e.g. "T-04"
  table            RestaurantTable  @relation(fields: [tableNumber], references: [tableNumber])
  sessionId        String?          // Groups multiple rounds placed by same table
  status           OrderStatus      @default(RECEIVED)
  subtotal         Int              // Base dishes + modifiers sum in PKR
  serviceCharge    Int              // 5% in PKR
  tax              Int              // 5% GST in PKR
  totalAmount      Int              // Final total payable in PKR
  notes            String?          // Order-wide kitchen instructions
  estimatedMinutes Int              @default(12)
  orderItems       OrderItem[]
  statusHistory    OrderStatusLog[]
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@index([tableNumber])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id                String                    @id @default(uuid())
  orderId           String
  order             Order                     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItemId        String
  menuItem          MenuItem                  @relation(fields: [menuItemId], references: [id])
  cartItemId        String                    // Composite ID from client
  quantity          Int                       @default(1)
  basePrice         Int                       // Base price of item at time of ordering
  unitPrice         Int                       // basePrice + sum of modifier options
  totalPrice        Int                       // unitPrice * quantity
  notes             String?                   // Item-specific cooking notes (e.g. "No onions")
  selectedModifiers OrderItemModifierOption[]

  @@index([orderId])
  @@index([menuItemId])
}

model OrderItemModifierOption {
  id          String    @id @default(uuid())
  orderItemId String
  orderItem   OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  groupId     String
  groupName   String    // Snapshot group name (e.g. "Spice Level")
  optionId    String
  optionName  String    // Snapshot option name (e.g. "Teekha (+Rs. 20)")
  price       Int       // In PKR

  @@index([orderItemId])
}

model OrderStatusLog {
  id        String      @id @default(uuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  message   String      // e.g. "Chef started cooking on grill"
  timestamp DateTime    @default(now())

  @@index([orderId])
}

// ----------------------------------------------------
// 4. SERVICE REQUESTS (WAITER & BILL)
// ----------------------------------------------------
model ServiceRequest {
  id            String          @id @default(uuid())
  tableNumber   String
  table         RestaurantTable @relation(fields: [tableNumber], references: [tableNumber])
  type          String          // "call_waiter" | "request_bill"
  reason        WaiterReason?
  paymentMethod PaymentMethod?
  splitCount    Int?
  customNote    String?
  status        String          @default("sent") // "sent" | "acknowledged" | "resolved"
  createdAt     DateTime        @default(now())

  @@index([tableNumber])
  @@index([type])
  @@index([status])
}
```

---

## 3. REST API Endpoints Specification

### 3.1 Table Sessions & Routing

#### `GET /api/tables/:tableId`
Validates that a QR code is valid and returns table metadata along with active session data.

- **URL Parameter:** `tableId` (String, e.g. `T-04` or `t-04`)
- **Normalization:** Always strip whitespace, uppercase, and match format `T-XX`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "tableNumber": "T-04",
    "displayName": "Table 04",
    "status": "OCCUPIED",
    "hasActiveOrders": true,
    "activeOrdersCount": 1,
    "waiterCooldownRemaining": 0,
    "isBillRequested": false
  }
}
```
- **Response `404 Not Found`:**
```json
{
  "success": false,
  "error": "TABLE_NOT_FOUND",
  "message": "Invalid table identifier scanned. Please consult cafe staff."
}
```

---

### 3.2 Menu & Modifiers Ingestion

#### `GET /api/menu`
Provides the full catalog of dishes, categories, and modifier groups.

- **Headers:** `Cache-Control: public, max-age=180, stale-while-revalidate=60`
- **Response `200 OK`:**
```json
{
  "restaurant": {
    "name": "Chaska & Chai Cafe",
    "tagline": "Authentic Pakistani Street Burgers, Shawarma & Karak Chai",
    "currencySymbol": "Rs. ",
    "serviceChargePercent": 5,
    "taxPercent": 5,
    "wifiName": "ChaskaCafe_Guest",
    "wifiPassword": "karakchai2026"
  },
  "categories": [
    { "id": "burgers", "name": "Burgers", "icon": "Sandwich", "badge": "Special" },
    { "id": "shawarma", "name": "Shawarma", "icon": "UtensilsCrossed", "badge": "Popular" }
  ],
  "items": [
    {
      "id": "burger-anda-shami",
      "name": "Anda Shami Burger",
      "description": "The legendary Pakistani street burger: spiced dal & beef shami patty, fried egg, shredded cabbage, and tangy mint raita in toasted sesame bun.",
      "price": 280,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
      "categoryId": "burgers",
      "isVegetarian": false,
      "isBestseller": true,
      "isChefSpecial": true,
      "isOutOfStock": false,
      "calories": 480,
      "preparationTime": "8-10 min",
      "allergens": ["Eggs", "Gluten"],
      "tags": ["Street Food", "Karachi Special"],
      "modifierGroups": [
        {
          "id": "spice_level",
          "name": "Spice Level",
          "description": "Choose your desired heat intensity",
          "minSelect": 1,
          "maxSelect": 1,
          "required": true,
          "options": [
            { "id": "spice_mild", "name": "Mild (Classic Mayo Slaw)", "price": 0, "isDefault": true },
            { "id": "spice_medium", "name": "Spicy Masala (Regular Desi)", "price": 0 },
            { "id": "spice_teekha", "name": "Teekha (Extra Green Chili & Chaat)", "price": 20 }
          ]
        },
        {
          "id": "burger_addons",
          "name": "Add-ons & Extras",
          "description": "Multi-select optional delicious toppings",
          "minSelect": 0,
          "maxSelect": 4,
          "required": false,
          "options": [
            { "id": "add_cheese", "name": "Cheddar Cheese Slice", "price": 60 },
            { "id": "add_egg", "name": "Crispy Fried Egg (Half/Full)", "price": 50 }
          ]
        }
      ]
    }
  ]
}
```

---

### 3.3 Order Placement (Checkout Action)

#### `POST /api/orders`
Dispatches a new customer order. Handles initial orders or subsequent rounds placed from the same table.

- **Request Headers:**
  - `Content-Type: application/json`
  - `Idempotency-Key: <unique-uuid>` *(prevents duplicate placement on network lag)*
- **Request Body Contract:**
```json
{
  "tableId": "T-04",
  "items": [
    {
      "cartItemId": "burger-anda-shami_[bun_choice:bun_sesame|burger_addons:add_cheese|spice_level:spice_teekha]_[extra mint raita]",
      "item": {
        "id": "burger-anda-shami",
        "name": "Anda Shami Burger",
        "price": 280
      },
      "quantity": 1,
      "selectedModifiers": [
        {
          "groupId": "spice_level",
          "groupName": "Spice Level",
          "optionId": "spice_teekha",
          "optionName": "Teekha (Extra Green Chili & Chaat)",
          "price": 20
        },
        {
          "groupId": "burger_addons",
          "groupName": "Add-ons & Extras",
          "optionId": "add_cheese",
          "optionName": "Cheddar Cheese Slice",
          "price": 60
        }
      ],
      "notes": "Extra mint raita, crispy shami",
      "unitPrice": 360,
      "totalPrice": 360
    }
  ],
  "totalAmount": 396,
  "notes": "Bring raita in separate cup"
}
```

- **Backend Calculation & Validation Pipeline:**
  1. Lookup `tableId` in database. If table doesn't exist $\rightarrow$ `404 TABLE_NOT_FOUND`.
  2. For each line item:
     - Verify `item.id` exists and `isOutOfStock == false`.
     - For each modifier group:
       - Validate `count(selectedModifiers) >= minSelect` (Required check).
       - Validate `count(selectedModifiers) <= maxSelect` (Single/multi constraint).
       - Verify option price against database `ModifierOption.price`.
     - Recalculate true unit price:
       $$\text{trueUnitPrice} = \text{MenuItem.price} + \sum \text{ModifierOption.price}$$
     - Recalculate line total:
       $$\text{trueLineTotal} = \text{trueUnitPrice} \times \text{quantity}$$
  3. Recalculate financial breakdown:
     $$\text{Subtotal} = \sum \text{trueLineTotal}$$
     $$\text{Service Charge} = \text{round}(\text{Subtotal} \times 0.05)$$
     $$\text{GST / Tax} = \text{round}(\text{Subtotal} \times 0.05)$$
     $$\text{Grand Total} = \text{Subtotal} + \text{Service Charge} + \text{GST}$$
  4. Compare `Grand Total` with client `totalAmount`. If $|Grand Total - client.totalAmount| > 1$, reject with `422 PRICE_MISMATCH`.
  5. Generate human-readable ticket ID: `ORD-` + random 4-digit sequence (e.g. `ORD-2575`).
  6. Transition table status to `OCCUPIED`.
  7. Publish event `order.created` to Redis pub/sub for KDS.

- **Response `201 Created`:**
```json
{
  "success": true,
  "orderId": "ORD-2575",
  "tableId": "T-04",
  "status": "received",
  "items": [ ... ],
  "subtotal": 360,
  "serviceCharge": 18,
  "tax": 18,
  "totalAmount": 396,
  "estimatedMinutes": 12,
  "createdAt": 1727452745000,
  "statusHistory": [
    {
      "status": "received",
      "timestamp": 1727452745000,
      "message": "Order received by the cafe kitchen"
    }
  ]
}
```

---

### 3.4 Active Orders & Real-time Live Status

#### `GET /api/tables/:tableId/active-orders`
Returns all active orders associated with this table session so a customer page refresh or new table guest sees current meal progress.

- **Response `200 OK`:**
```json
{
  "success": true,
  "tableId": "T-04",
  "activeOrders": [
    {
      "orderId": "ORD-2575",
      "tableId": "T-04",
      "status": "preparing",
      "totalAmount": 396,
      "estimatedMinutes": 8,
      "createdAt": 1727452745000,
      "statusHistory": [
        {
          "status": "received",
          "timestamp": 1727452745000,
          "message": "Order received by kitchen"
        },
        {
          "status": "preparing",
          "timestamp": 1727452765000,
          "message": "Chef is cooking dishes on grill & stove"
        }
      ],
      "items": [ ... ]
    }
  ]
}
```

#### `PATCH /api/orders/:orderId/status` (Kitchen / KDS Internal Endpoint)
Called by the kitchen display screen when a cook taps "Start Cooking" or "Serve".

- **Request Body:**
```json
{
  "status": "preparing", // "received" | "preparing" | "served" | "cancelled"
  "estimatedMinutes": 7,
  "message": "Dishes placed on charcoal grill"
}
```
- **Processing:**
  1. Updates `Order.status` and appends row to `OrderStatusLog`.
  2. Emits SSE / WebSocket event to client on channel `order:ORD-2575`.

---

### 3.5 Service Actions (Waiter Call & Bill Request)

#### `POST /api/service/call-waiter`
Notifies on-duty staff. Must enforce strict 2-minute (120-second) anti-spam rate limiting.

- **Request Body:**
```json
{
  "tableId": "T-04",
  "reason": "water", // "general" | "water" | "cutlery" | "clean_table" | "order_help"
  "customNote": "Need 2 cold water glasses"
}
```

- **Backend Rate Limit Logic (Redis):**
```typescript
const redisKey = `ratelimit:waiter:table:${tableId}`;
const exists = await redis.get(redisKey);

if (exists) {
  const ttl = await redis.ttl(redisKey);
  return res.status(429).json({
    success: false,
    error: "COOLDOWN_ACTIVE",
    remainingSeconds: ttl,
    message: `Please wait ${Math.floor(ttl / 60)}:${(ttl % 60).toString().padStart(2, '0')} before calling staff again.`
  });
}

// Set 120-second anti-spam lock
await redis.set(redisKey, "1", "EX", 120);

// Record in database and alert staff
await prisma.serviceRequest.create({
  data: { tableNumber: tableId, type: "call_waiter", reason, customNote }
});

await redisPubSub.publish("staff:alerts", JSON.stringify({
  type: "CALL_WAITER",
  tableId,
  reason,
  customNote,
  timestamp: Date.now()
}));

return res.status(200).json({
  success: true,
  tableId,
  status: "sent",
  cooldownSeconds: 120,
  message: "Server notified, someone will be with you shortly"
});
```

---

#### `POST /api/service/request-bill`
Alerts POS that customer wants to settle check.

- **Request Body:**
```json
{
  "tableId": "T-04",
  "paymentMethod": "card", // "card" | "cash" | "contactless" | "split"
  "splitCount": 2,
  "customNote": "Bring portable POS machine"
}
```

- **Processing:**
  1. Fetches all active non-completed orders for `tableId`.
  2. Calculates total table bill: $\sum \text{Order.totalAmount}$.
  3. Updates `RestaurantTable.status = BILLING`.
  4. Records `ServiceRequest(type: "request_bill")`.
  5. Publishes alert to Cashier POS screen.
- **Response `200 OK`:**
```json
{
  "success": true,
  "tableId": "T-04",
  "tableTotal": 902,
  "status": "bill_requested",
  "paymentMethod": "card",
  "message": "POS alerted: Table bill requested. A server is printing your check."
}
```

---

## 4. Real-Time Event Engine (SSE & WebSockets)

The frontend expects live transitions between `received` $\rightarrow$ `preparing` $\rightarrow$ `served`.

### Option A: Server-Sent Events (SSE) — *Recommended for Minimal Footprint*
#### `GET /api/orders/:orderId/stream`
Stream opened by customer browser when the Active Order Screen is visible.

- **Headers:**
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
- **Payload Event Types:**

```text
event: status_update
data: {"orderId":"ORD-2575","status":"preparing","estimatedMinutes":8,"message":"Chef started cooking"}

event: status_update
data: {"orderId":"ORD-2575","status":"served","estimatedMinutes":0,"message":"Dishes brought to Table 04"}

event: ping
data: {"timestamp":1727452800000}
```

### Option B: WebSockets (Socket.io / ws)
- **Room Subscriptions:** Client joins room `table:T-04`.
- **Inbound Events:**
  - `table.joined` $\rightarrow$ `{ tableId: "T-04" }`
- **Outbound Broadcasts:**
  - `order.status_changed` $\rightarrow$ `{ orderId, status, message, estimatedMinutes }`
  - `waiter.acknowledged` $\rightarrow$ `{ tableId, waiterName: "Ali" }`

---

## 5. Business Logic, Calculation & Anti-Fraud Rules

### 5.1 Financial Formula & Tax Rules
- Currency: **PKR (`Rs. `)**
- Fractional handling: Pakistan restaurant invoices use whole integer rupees (round to nearest whole rupee).
- Service Charge: **5%**
- General Sales Tax (GST / Provincial Sales Tax): **5%**

$$\text{Item Unit Price} = \text{MenuItem.basePrice} + \sum_{m \in \text{selectedModifiers}} m\text{.price}$$
$$\text{Line Item Total} = \text{Item Unit Price} \times \text{Quantity}$$
$$\text{Subtotal} = \sum \text{Line Item Total}$$
$$\text{Service Charge} = \text{Math.round}(\text{Subtotal} \times 0.05)$$
$$\text{GST / Tax} = \text{Math.round}(\text{Subtotal} \times 0.05)$$
$$\text{Grand Total} = \text{Subtotal} + \text{Service Charge} + \text{GST}$$

### 5.2 Modifier Group Constraints
Backend validation must reject orders with `422 UNPROCESSABLE_ENTITY` under any of these conditions:
1. `count(options) < group.minSelect` $\rightarrow$ Missing mandatory modifier (e.g. user didn't pick spice level).
2. `count(options) > group.maxSelect` $\rightarrow$ Selected too many options (e.g. selected 2 buns when max is 1).
3. Option marked `isAvailable == false` $\rightarrow$ Dish option ran out of stock.

---

## 6. Anti-Spam Rate Limiting (Redis Implementation)

### Rules Table

| Action | Rate Limit | Scope | Storage Backend | Rejection Code |
| :--- | :--- | :--- | :--- | :--- |
| **Call Waiter** | 1 request per 120s | Per `tableId` | Redis Key `ratelimit:waiter:{tableId}` | `429 COOLDOWN_ACTIVE` |
| **Order Placement** | 5 requests per 60s | Per `tableId` | Redis Sliding Window | `429 ORDER_RATE_LIMIT` |
| **Request Bill** | 2 requests per 180s | Per `tableId` | Redis Key `ratelimit:bill:{tableId}` | `429 BILL_ALREADY_REQUESTED` |

---

## 7. Error Handling & Standard Error Codes

All API errors must follow standard JSON structure:
```json
{
  "success": false,
  "error": "ERROR_CODE_STRING",
  "message": "Human-readable description for UI display",
  "details": {}
}
```

### Complete Error Code Enumeration

| HTTP Status | Error Code | Description / Client Recovery |
| :--- | :--- | :--- |
| `400` | `INVALID_PAYLOAD` | Malformed JSON or Zod schema validation failed. |
| `404` | `TABLE_NOT_FOUND` | Table number is not registered in system. |
| `409` | `ITEM_OUT_OF_STOCK` | One or more items in cart became unavailable. UI refetches `/api/menu`. |
| `422` | `MODIFIER_SELECTION_INVALID` | Violated `minSelect` or `maxSelect` constraint. |
| `422` | `PRICE_MISMATCH` | Client price differs from server verified price. UI updates cart. |
| `429` | `COOLDOWN_ACTIVE` | Waiter call submitted before 120-second cooldown elapsed. |
| `409` | `TABLE_ALREADY_BILLING` | Cannot place order while table check is being printed. |

---

## 8. Environment Variables & Configuration

Create `.env` file for backend environment:

```bash
# Server Port & Host
PORT=4000
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/resturant_os?schema=public"

# Redis (Caching, Pub/Sub & Rate Limiting)
REDIS_URL="redis://localhost:6379"

# Restaurant Financial Configuration
RESTAURANT_NAME="Chaska & Chai Cafe"
CURRENCY_CODE="PKR"
CURRENCY_SYMBOL="Rs. "
SERVICE_CHARGE_PERCENT=5
TAX_PERCENT=5

# CORS Whitelist (Frontend Origins)
ALLOWED_ORIGINS="http://localhost:3000,https://menu.chaskacafe.com"

# Anti-Spam Security
WAITER_COOLDOWN_SECONDS=120
ORDER_RATE_LIMIT_PER_MINUTE=5
```

---

## 9. Verification & Curl Testing Recipes

Backend engineers can verify their endpoints using the following curl commands:

### 1. Place an Order
```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "T-04",
    "items": [
      {
        "cartItemId": "burger-anda-shami_test",
        "item": { "id": "burger-anda-shami", "name": "Anda Shami Burger", "price": 280 },
        "quantity": 1,
        "selectedModifiers": [
          { "groupId": "spice_level", "groupName": "Spice Level", "optionId": "spice_teekha", "optionName": "Teekha", "price": 20 }
        ],
        "notes": "Extra crispy",
        "unitPrice": 300,
        "totalPrice": 300
      }
    ],
    "totalAmount": 330,
    "notes": "Table 04 test order"
  }'
```

### 2. Call Waiter (Test 120s Anti-Spam)
```bash
# First Call -> 200 OK
curl -X POST http://localhost:4000/api/service/call-waiter \
  -H "Content-Type: application/json" \
  -d '{"tableId": "T-04", "reason": "water", "customNote": "Cold water please"}'

# Immediate Second Call -> 429 Too Many Requests (COOLDOWN_ACTIVE)
curl -X POST http://localhost:4000/api/service/call-waiter \
  -H "Content-Type: application/json" \
  -d '{"tableId": "T-04", "reason": "general"}'
```

### 3. Update Order Status (KDS simulation)
```bash
curl -X PATCH http://localhost:4000/api/orders/ORD-2575/status \
  -H "Content-Type: application/json" \
  -d '{"status": "preparing", "estimatedMinutes": 8, "message": "Dishes placed on grill"}'
```

### 4. Request Bill
```bash
curl -X POST http://localhost:4000/api/service/request-bill \
  -H "Content-Type: application/json" \
  -d '{"tableId": "T-04", "paymentMethod": "card", "customNote": "Need separate receipts"}'
```
