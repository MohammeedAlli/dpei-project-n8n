# Electronics Souk | سوق الإلكترونيات

A production-oriented bilingual (Arabic/English) electronics marketplace for the Egyptian market. Compare prices across shops, get AI assistance, order from multiple partner shops with one checkout, receive separate shipments, and track each independently.

## Tech Stack

- **Frontend:** Next.js 13.5 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **Auth:** Supabase Auth (admin dashboard only)
- **Edge Functions:** Supabase Edge Functions (Deno) for checkout and order tracking
- **Fonts:** Cairo (Arabic), Inter (English)
- **Icons:** Lucide React

## Features

### Customer-facing
- Bilingual Arabic (RTL, default) + English (LTR) with localStorage persistence
- Product catalog with search, category/brand/price/availability filters, and sorting
- Product detail pages with comparable shop offers
- Price comparison page
- AI assistant (catalog-powered search)
- Persistent cart (localStorage) with shop grouping, delivery fees, free-delivery progress
- Guest checkout (cash on delivery) with order splitting per shop
- Order confirmation with tracking link
- Public order tracking by code + phone (secure edge function)
- Shipment status timeline with WhatsApp contact links

### Admin dashboard (`/admin`)
- Supabase Auth login with admin role authorization
- Daily operations overview (new orders, preparing, out for delivery, etc.)
- Orders management with search, status filter, shipment detail, status updates, internal notes, webhook retry, WhatsApp message copy
- Shop management (edit name, partner status, commission, delivery fees, WhatsApp, active status)
- Commission reports with shop/date filters and CSV export

### Security
- RLS on all tables: public catalog read, orders locked to admin-only
- `is_admin()` SECURITY DEFINER function checks JWT `app_metadata.role`
- Server-side price revalidation in checkout edge function
- Idempotency keys prevent duplicate orders
- Tracking requires both order code AND phone number match
- Service-role keys never reach the browser

## Project Structure

```
app/
  page.tsx                    # Home
  products/                   # Catalog + product detail
  categories/                 # Categories grid
  compare/                    # Price comparison
  assistant/                  # AI assistant
  cart/                       # Shopping cart
  checkout/                   # Guest checkout
  order-confirmation/         # Success page
  track/                      # Order tracking
  admin/
    page.tsx                  # Admin login
    dashboard/
      layout.tsx              # Auth guard
      page.tsx                # Dashboard with tabs

components/
  admin/                      # Admin tab components
  providers/                  # Language, Cart, Theme, Admin providers
  ui/                         # shadcn/ui components
  product-card.tsx
  site-header.tsx
  site-footer.tsx

lib/
  supabase.ts                 # Supabase client
  types.ts                    # TypeScript types
  i18n.ts                     # Bilingual translations
  format.ts                   # EGP/date/relative formatting
  catalog.ts                  # Catalog query helpers

supabase/
  config.toml                 # Edge function config
  functions/
    checkout/index.ts         # Secure checkout (validation, splitting, n8n)
    track-order/index.ts      # Secure order tracking lookup
  migrations/
    001_init_catalog_schema.sql
    002_seed_demo_data.sql
    003_add_idempotency_key.sql
    004_admin_authorization.sql
```

## Database Migrations

Applied via Supabase MCP tools (not the CLI):

1. **001_init_catalog_schema** — Categories, shops, products (with tsvector search), offers, settings, orders, shop_orders, order_items, product_lowest_offer view. RLS: public catalog read; orders locked.
2. **002_seed_demo_data** — 9 categories, 10 shops (5 partner, 5 non-partner), ~50 products, ~200 offers, 6 public settings.
3. **003_add_idempotency_key** — Unique idempotency_key column on orders for duplicate prevention.
4. **004_admin_authorization** — `is_admin()` function + RLS policies granting admin SELECT/UPDATE on order tables.

## RLS Policies

| Table | anon | authenticated | admin |
|-------|------|---------------|-------|
| categories | SELECT | SELECT | — |
| shops (active) | SELECT | SELECT | UPDATE |
| products | SELECT | SELECT | — |
| offers | SELECT | SELECT | — |
| settings (public) | SELECT | SELECT | — |
| orders | — | SELECT/UPDATE (is_admin) | — |
| shop_orders | — | SELECT/UPDATE (is_admin) | — |
| order_items | — | SELECT (is_admin) | — |

## Edge Functions

### `checkout` (POST, verify_jwt: false)
Validates customer input, revalidates offer prices and partner eligibility server-side, calculates totals/commissions, creates parent order + shop orders + item snapshots, forwards to n8n webhook, returns order code.

### `track-order` (GET, verify_jwt: false)
Validates order code + phone match, returns order summary and shipment details with items, status, shop contact info.

## Environment Variables

Pre-populated in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-side (automatically configured for edge functions):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (for n8n integration):
- `N8N_WEBHOOK_URL` — n8n webhook endpoint for order forwarding
- `N8N_WEBHOOK_SECRET` — shared secret for webhook authentication

## Remaining Manual Setup

### 1. Create an admin account
1. Go to your Supabase Dashboard → Authentication → Users
2. Click "Add user" and create an account with email/password
3. After creation, edit the user and add to `raw_app_meta_data`:
   ```json
   { "role": "admin" }
   ```
4. Use those credentials to log in at `/admin`

### 2. Configure n8n webhook (optional)
1. Set `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET` as edge function secrets in the Supabase Dashboard
2. Create an n8n workflow that receives the `shop_order.created` payload
3. Without this, webhook status will show as "skipped" (orders still work)

### 3. AI assistant
The assistant currently uses catalog search as a fallback. To connect a real LLM:
1. Set an AI endpoint URL as an edge function secret
2. The assistant page can be extended to call a dedicated edge function that proxies the AI API

## Development

```bash
npm install
npm run dev      # Development server
npm run build    # Production build
npm run typecheck # Type checking
```

## Demo Data

10 sample shops, ~50 products, ~200 offers. Commission rates vary (4-7%), delivery fees (35-50 EGP), free-delivery thresholds (400-600 EGP). Clearly sample data for development only.
