# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (prisma generate + migrate deploy + next build)
npm run lint         # ESLint
npm run test         # Run test suite (Vitest, ~43 tests, ~1s)
npm run test:watch   # Vitest in watch mode
npm run db:migrate   # Run Prisma migrations (npx prisma migrate dev)
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (DB browser)
```

## Architecture

**Next.js 15 App Router** — all routes use server components by default; client interactivity is in separate `*Client.tsx` files co-located with their server page.

**Prisma 6 + Supabase PostgreSQL** — uses `@prisma/adapter-pg`. DATABASE_URL points to Supabase (production: txsjqmpdrocvvvpuqjdl). The Prisma client singleton is in `src/lib/prisma.ts`.

**Multi-tenant** — each restaurant is a `Tenant` with a unique `slug` (e.g. "imperial"). All routes are scoped under `[locale]/[tenant]/`. Tenant config lives in DB.

**Mercado Pago** — sole payment processor (Stripe removed). CLP is zero-decimal: `amount: 5000` = $5,000 CLP. Never multiply by 100. Webhook at `/api/payments/mp-webhook?tenant=<slug>` validates HMAC-SHA256 signature before trusting any payment data.

**Admin auth** — httpOnly cookie + JWT (jose library). Roles: OWNER / KITCHEN / BAR. Login via `/api/admin/login` (adminKey) or `/api/admin/login-pin` (PIN for kitchen/bar roles).

**Zustand cart** (`src/store/cartStore.ts`) — persisted to `sessionStorage` (v3) so each browser tab is isolated. Cart stores `tableId` + `customerName` + items. Computed values (`getSubtotal`, `getTip`, `getTotal`) are functions, not stored state.

**Rate limiting** — in-memory sliding window in `src/middleware.ts`. Limits per bucket: waiter 10/min, orders/payments 5/min, admin/login 10/min, general API 60/min. DEUDA DT-3B: migrate to Upstash Redis at 10+ active tenants.

**AES-256-GCM encryption** (`src/lib/crypto.ts`) — sensitive tenant data (MP tokens, webhook secrets) encrypted at rest. Requires `ENCRYPTION_KEY` env var (64 hex chars = 32 bytes).

## Route map

| Path | What it does |
|------|-------------|
| `/` | Redirects to `/admin` |
| `/[locale]/[tenant]/mesa/[tableId]` | Name entry for customer (validates table exists) |
| `/[locale]/[tenant]/mesa/[tableId]/menu` | Menu browser + cart drawer |
| `/[locale]/[tenant]/mesa/[tableId]/pago` | Checkout — creates Order then MP preference |
| `/[locale]/[tenant]/mesa/[tableId]/gracias` | Post-payment confirmation, clears cart |
| `/[locale]/[tenant]/admin` | Dashboard with today's stats |
| `/[locale]/[tenant]/admin/mesas` | Table CRUD + QR code generation/download |
| `/[locale]/[tenant]/admin/carta` | Category + product management |
| `/[locale]/[tenant]/admin/pedidos` | Live order view with 5s polling; admin advances order status |
| `/[locale]/[tenant]/kiosk/cocina` | Kitchen display (role: KITCHEN) |
| `/[locale]/[tenant]/kiosk/bar` | Bar display (role: BAR) |

## Customer payment flow

1. `POST /api/orders` — creates Order with computed subtotal/tip/total, snapshots product prices
2. `POST /api/mercadopago` — creates MP preference, returns `init_point` URL
3. Customer redirected to MP checkout page
4. MP webhook: `POST /api/payments/mp-webhook?tenant=<slug>` validates HMAC signature, queries MP API for payment details, validates amount matches order, sets `order.status = "PAID"`

## Monetary values

All prices stored as integers (CLP pesos). `formatCLP()` in `src/lib/utils.ts` formats for display. `calcTip()` computes tip with `Math.round()`.

## Tests (`src/tests/`)

| File | What it covers |
|------|---------------|
| `mp-webhook.test.ts` | HMAC signature, amount validation, idempotency, cross-tenant security |
| `orders.test.ts` | Body validation, CLP calculation, price snapshot, DB error cases |
| `admin-auth.test.ts` | Plain/bcrypt adminKey, inactive tenant, missing fields |

Tests use Vitest + vi.mock for Prisma and fetch. No real DB or HTTP server needed.

## Environment variables

```
DATABASE_URL=postgresql://...   # Supabase connection string
DIRECT_URL=postgresql://...     # Supabase direct URL (for migrations)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ENCRYPTION_KEY=<64 hex chars>   # AES-256-GCM key for MP credentials
JWT_SECRET=<any string>         # Admin session JWT signing
ADMIN_SESSION_SECRET=<any string>
```

For local MP webhook testing: use ngrok or similar to expose localhost, configure webhook URL in MP dashboard.
