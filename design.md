# RestaurantOS Design System & Style Guide (`design.md`)

> **Single Source of Truth** for UI/UX consistency across the **Customer Digital QR Web Menu** and the **Admin & Operations Portal**.

---

## 1. Brand Identity & Design Philosophy

**RestaurantOS (Chaska & Chai Cafe)** balances high-turnover street cafe hospitality with high-speed POS operational clarity.

- **Customer Web (Mobile-First)**: Warm, appetizing, tactile, and frictionless. Diners browse menus, customize dishes, and call staff in 1–2 taps.
- **Admin Portal (Desktop/Tablet-First)**: High-density, high-contrast, distraction-free cockpit. Staff process kitchen tickets, settle bills, and toggle out-of-stock items instantaneously.
- **Hardware Printing (80mm ESC/POS)**: Utilitarian, high-contrast monochrome, zero-margin thermal output for kitchen order tickets (KOT) and customer receipts.

---

## 2. Color Palette & Semantic Tokens

The design system uses Tailwind CSS tokens with an **Amber & Warm Stone** palette:

### 2.1 Core Neutral Palette (Warm Stone)
| Token | Tailwind Class | Hex / HSL | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Light** | `bg-stone-50` | `#fafaf9` | Customer app background, admin workspace canvas |
| **Card White** | `bg-white` | `#ffffff` | Dish cards, table tiles, modal containers |
| **Subtle Neutral** | `bg-stone-100` | `#f5f5f4` | Search inputs, inactive category pills, icon badges |
| **Border / Divider** | `border-stone-200` | `#e7e5e4` | Standard hairline card borders, table dividers |
| **Secondary Text** | `text-stone-500` | `#78716c` | Helper labels, timestamps, preparation times |
| **Primary Text** | `text-stone-900` | `#1c1917` | Dish titles, modal headers, order totals |
| **Console Dark** | `bg-stone-950` | `#0c0a09` | Admin sidebar background, high-priority buttons |

### 2.2 Brand Accent Palette (Amber / Spiced Honey)
| Token | Tailwind Class | Usage |
| :--- | :--- | :--- |
| **Amber Tint** | `bg-amber-50` / `border-amber-200` | Highlighted selection card, modifier required badge |
| **Amber Light** | `bg-amber-100` / `text-amber-800` | Category badge tags (*Crispy*, *Popular*), icon backgrounds |
| **Amber Primary** | `bg-amber-600` / `hover:bg-amber-700` | Primary CTA buttons (*Add to Order*, *Accept Order*, *Settle*) |
| **Amber Contrast** | `bg-amber-500` / `text-stone-950` | Active sidebar navigation pill, prominent attention badges |

### 2.3 Semantic Status Indicators
Consistent across Kanban columns, table floor tiles, and notifications:

| Status | Color | Classes (Bg / Text / Border) | Application |
| :--- | :--- | :--- | :--- |
| **Available / In Stock** | 🟢 Emerald | `bg-emerald-50 text-emerald-700 border-emerald-200` | Table Vacant, 86 Switch IN STOCK, Order Delivered, Paid |
| **In Progress / Kitchen** | 🟠 Amber/Orange | `bg-amber-50 text-amber-700 border-amber-200` | Kitchen Cooking, Order In Kitchen, Bill Requested |
| **Pending / Occupied** | 🔵 Blue/Sky | `bg-blue-50 text-blue-700 border-blue-200` | Table Occupied, New Incoming Order |
| **Alert / 86'd / Waiter** | 🔴 Red/Rose | `bg-red-50 text-red-700 border-red-200` | Waiter Call Alert, 86'd Out of Stock, Order Rejected |

---

## 3. Typography & Hierarchy

- **Font Family**: System UI stack (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Data / Numerics**: `font-mono` for Currency (`Rs. 450`), Ticket numbers (`#ORD-102`), Table badges (`Table 04`), and elapsed timers.
- **Thermal Print**: Strict monospace (`Courier New, Courier, monospace`).

### Type Scale Hierarchy
| Level | Tailwind Classes | Usage |
| :--- | :--- | :--- |
| **Hero Title** | `text-2xl font-black tracking-tight` | Customer store banner, Admin KPI counters |
| **Page Title** | `text-lg sm:text-xl font-bold text-stone-900` | Section headings, Dashboard top bars |
| **Card Heading** | `text-sm sm:text-base font-bold text-stone-900` | Dish titles, Table numbers, Ticket cards |
| **Body Standard** | `text-xs sm:text-sm text-stone-600 font-normal` | Dish descriptions, order item notes |
| **Metadata / Micro** | `text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-400` | Category labels, modifier rules (`REQUIRED`, `CHOOSE 1`) |
| **Financial Monospace** | `text-xs sm:text-sm font-mono font-bold text-stone-900` | Prices (`Rs. 320`), Subtotal calculations, Change due |

---

## 4. Radii, Elevation & Motion

### 4.1 Border Radii
- **`rounded-full`**: Action pills, category tabs, status dots, quantity buttons (`+` / `-`).
- **`rounded-xl`** (`12px`): Standard inputs, form selects, table row action buttons.
- **`rounded-2xl`** (`16px`): Dish cards, Kanban ticket cards, Table floor grid tiles.
- **`rounded-3xl`** (`24px`): Modals, Customer bottom sheets, Billing side drawer.

### 4.2 Elevation & Shadows
- **Cards & Inputs**: Flat border design with subtle shadow (`border border-stone-200 shadow-xs`).
- **Floating Controls**: `shadow-md` for floating category nav, sticky cart bar.
- **Modals & Drawers**: `shadow-2xl` with backdrop blur (`bg-stone-900/60 backdrop-blur-xs`).

### 4.3 Motion & Transitions
- **Hover & Active States**: `transition-all duration-150 active:scale-[0.98]`.
- **Waiter Call Alert**: Soft pulsing animation (`animate-soft-pulse` or `animate-pulse ring-2 ring-red-500`).
- **Modals / Sheets**: Slide-up transition for mobile sheets (`slide-in-from-bottom`), fade-in for overlays (`animate-in fade-in`).

---

## 5. Component Design Standards

### 5.1 Buttons
- **Primary Action**:
  ```tsx
  <button className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2">
    Confirm Action
  </button>
  ```
- **Console Dark Action (Admin)**:
  ```tsx
  <button className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5">
    + New Dish
  </button>
  ```
- **Secondary / Cancel**:
  ```tsx
  <button className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all">
    Cancel
  </button>
  ```
- **Quick 86 Stock Switch**:
  - In Stock: `bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`
  - 86'd Out: `bg-red-50 text-red-700 border-red-200 hover:bg-red-100 line-through`

### 5.2 Badges & Dietary Tags
- **Bestseller**: `bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1`
- **Spicy Indicator**: `🌶️` with level badge (`spicyLevel > 0`)
- **Vegetarian**: Green dot or leaf badge (`bg-emerald-100 text-emerald-800`)
- **86'D Badge**: `bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider`

### 5.3 Form Controls & Inputs
- Text / Number input:
  ```tsx
  <input className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-stone-900" />
  ```
- Currency Input: Prepend absolute prefix `Rs.` inside input container with `pl-9`.

---

## 6. Portal vs. Web Layout Conventions

### 6.1 Customer Digital QR Web (`/`, `/table/[tableId]`)
- **Max Width**: Centered container constrained to `max-w-2xl` on tablet/desktop, fluid edge-to-edge on mobile.
- **Top Header**: Restaurant branding, table number pill badge, and quick action buttons (**Call Waiter**, **Request Bill**).
- **Category Navigation**: Horizontally scrollable pill tabs (`no-scrollbar`), sticky below header (`sticky top-14 z-30`).
- **Customization Modal**: Bottom sheet on mobile (`max-h-[85vh] rounded-t-3xl`), centered dialog on desktop.
- **Sticky Cart Bar**: Persistent bottom bar above safe area:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
  ```

### 6.2 Admin & Operations Console (`/admin/*`)
- **Sidebar Navigation**: Fixed left bar `w-64 bg-stone-950 text-stone-300 border-r border-stone-800`.
  - Active Item: `bg-amber-500 text-stone-950 font-bold rounded-xl`.
  - Inactive Item: `text-stone-400 hover:text-white hover:bg-stone-900 rounded-xl`.
- **Top Status Bar**:
  - Restaurant Online/Offline toggle with immediate localStorage + toast feedback.
  - Supabase Realtime live indicator (`🟢 Live Stream` / `🟡 Connecting`).
  - Active Orders counter badge.
- **Waitstaff Alert Banner**: High-priority alert banner fixed above work area when waiter assistance is requested:
  ```tsx
  <div className="bg-red-500 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
  ```

---

## 7. 80mm ESC/POS Thermal Printing Standards

Used in [`KotThermalTicket.tsx`](file:///Users/laptopchoice/Downloads/resturantOS/src/components/admin/KotThermalTicket.tsx) and [`CustomerBillTicket.tsx`](file:///Users/laptopchoice/Downloads/resturantOS/src/components/admin/floor/CustomerBillTicket.tsx).

### 7.1 Print CSS Rules (`@media print`)
```css
@media print {
  @page {
    size: 80mm auto;
    margin: 0mm;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    font-family: 'Courier New', Courier, monospace !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .no-print, nav, aside, header, button {
    display: none !important;
  }
}
```

### 7.2 Receipt Structural Guidelines
1. **Dimensions**: Set wrapper to `width: 72mm; margin: 0 auto; padding: 4mm 2mm;`.
2. **Contrast**: Use strict `#000000` text; never use light grey or color in receipt stylesheets.
3. **Dividers**: Dashed hairline borders (`border-t-2 border-dashed border-black my-2`).
4. **Kitchen Order Ticket (KOT)**:
   - Header: Large bold table title (e.g., `*** TABLE 04 ***`).
   - Line Items: High emphasis on quantity (e.g., `2x Zinger Burger`).
   - Preparation Notes: Indented, uppercase, bold (e.g., `>> NOTE: NO ONIONS, EXTRA SAUCE`).
5. **Customer Bill Ticket**:
   - Includes Cafe header, order ID, items list, subtotal, tax breakdown, discount, and **Final Total** in double-height bold font.

---

## 8. Modifier Structure & Display Rules

To maintain 100% interoperability between the Admin variant builder, the Customer modal, and thermal printing, all modifiers follow the serialized string convention:

$$\text{Format: } \texttt{[GroupName | rule | req/opt] OptionName}$$

- `[Choice of Patty | radio | req] Crispy Fried Fillet`
- `[Add-ons & Extras | checkbox | opt] Cheddar Cheese Slice`

### UI Rendering Rules
1. **`radio | req`**: Rendered as a mutually exclusive radio group with a red/amber `REQUIRED • CHOOSE 1` badge. Exactly one option must be selected before enabling "Add to Order".
2. **`checkbox | opt`**: Rendered as multi-select checkboxes with a grey `OPTIONAL` badge. Price delta formatted as `+Rs. 60` or `Free`.

---

## 9. Accessibility & Touch Ergonomics

- **Minimum Touch Target**: 44×44px for all mobile interactive elements.
- **Safe Area Insets**: Always apply `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to fixed header/footer containers.
- **Screen Reader Support**: Use standard semantic tags (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`) and provide explicit `aria-label`s on icon-only buttons.
- **Audible Alerts**: Staff audio chimes ([`src/lib/sound.ts`](file:///Users/laptopchoice/Downloads/resturantOS/src/lib/sound.ts)) use the Web Audio API with a persistent mute toggle in the top bar.
