# AGENTS.md — Agent & Assistant Guidelines

For comprehensive architecture details, database schemas, real-time event maps, operational workflows, and live deployment URLs, please refer to:

👉 **[`GEMINI.md`](./GEMINI.md)**

---

### Quick Summary for Autonomous Agents:
- **Project**: RestaurantOS (Chaska & Chai Cafe) — Real-Time Restaurant Operating System & POS.
- **Frontend**: Next.js 15.5 App Router + React 19 + Tailwind CSS + Lucide + Sonner + TanStack Query + Zustand.
  - Live on Vercel: [`https://restaurant-os-nine-fawn.vercel.app`](https://restaurant-os-nine-fawn.vercel.app)
- **Backend**: NestJS 10 + Fastify + Drizzle ORM + Remote Supabase PostgreSQL (`db.ivfvxnwciuqicqqnlbtx.supabase.co`).
  - Blueprint: [`backend/render.yaml`](backend/render.yaml)
- **Real-Time Pipeline**: Supabase Realtime channel `pos_staff` with WebSocket broadcasts (`order:new`, `service:call_waiter`, `service:bill_request`, `menu:item_toggled`, `order:status_updated`) + SSE fallback.
- **IDs**: Database IDs must be valid UUIDs (`crypto.randomUUID()`).
- **Modifier Format**: Serialized as `[GroupName | radio/checkbox | req/opt] OptionName`.
