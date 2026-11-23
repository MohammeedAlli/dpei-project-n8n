# Part 4 — Price comparison + Product details

Needs Parts 1–3 applied. No new npm packages.

REPLACE: app/compare/page.tsx, app/products/[id]/page.tsx, app/globals.css, lib/use-add-to-cart.ts (adds useAddOffer + useAddMany)
NEW:     components/compare/{offer-row,price-bars,price-history-chart,alert-dialog,offers-panel,compare-drawer,product-list}.tsx
         components/product/{gallery,buy-box,bundle}.tsx
         components/ui/simple-tabs.tsx
         lib/{freshness,compare-store,price-data,bundles}.ts
OPTIONAL: supabase/part4.sql  → run once in the Supabase SQL editor to enable the price-history chart and price alerts.

globals.css change: light-mode --accent darkened (173 82% 36% → 29%) and --accent-foreground is now white,
so teal text/buttons reach WCAG AA (4.6:1) on light backgrounds. Dark mode is unchanged.
