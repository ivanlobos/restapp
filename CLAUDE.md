# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:migrate   # Run Prisma migrations (npx prisma migrate dev)
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (DB browser)
```

## Architecture

**Next.js 14 App Router** — all routes use server components by default; client interactivity is in separate `*Client.tsx` files co-located with their server page.

**Prisma 7 + SQLite** — uses the `@prisma/adapter-libsql` driver adapter (required by Prisma 7 — the URL is NOT in `schema.prisma`, it lives in `prisma.config.ts` and is passed to the adapter constructor). The Prisma client singleton is in `src/lib/prisma.ts`.

**Stripe (CLP)** — CLP is a zero-decimal currency: `amount: 5000` = $5,000 CLP. Never multiply by 100. Webhook raw body must be read with `request.text()` before passing to `stripe.webhooks.constructEvent()`.

**Zustand cart** (`src/store/cartStore.ts`) — persisted to `sessionStorage` so each browser tab is isolated. Cart stores `tableId` + `customerName` + items. Computed values (`getSubtotal`, `getTip`, `getTotal`) are functions, not stored state.

## Route map

| Path | What it does |
|------|-------------|
| `/` | Redirects to `/admin` |
| `/mesa/[tableId]` | Name entry for customer (validates table exists) |
| `/mesa/[tableId]/menu` | Menu browser + cart drawer (guards: needs name in cart store) |
| `/mesa/[tableId]/pago` | Checkout — creates Order then PaymentIntent then renders Stripe Elements |
| `/mesa/[tableId]/gracias` | Post-payment confirmation, clears cart |
| `/admin` | Dashboard with today's stats |
| `/admin/mesas` | Table CRUD + QR code generation/download |
| `/admin/carta` | Category + product management |
| `/admin/pedidos` | Live order view with 5s polling; admin advances order status |

## Customer payment flow

1. `POST /api/orders` — creates Order with computed subtotal/tip/total, snapshots product prices
2. `POST /api/payments/create-intent` — creates Stripe PaymentIntent (amount = `order.total`, currency = `"clp"`)
3. Stripe webhooks confirm payment: `POST /api/payments/webhook` sets `order.status = "PAID"`

## Monetary values

All prices stored as integers (CLP pesos). `formatCLP()` in `src/lib/utils.ts` formats for display. `calcTip()` computes 10% with `Math.round()`.

## Environment variables

```
DATABASE_URL=file:./dev.db
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # Used for QR code URLs
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

For local Stripe webhook testing: `stripe listen --forward-to localhost:3000/api/payments/webhook`
