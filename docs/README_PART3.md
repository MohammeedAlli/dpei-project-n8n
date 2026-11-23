# Part 3 — Categories, Product card, Lowest prices, Products page

Copy over (same paths). Needs Part 1 + Part 2 already applied (framer-motion, Chip, tokens).

REPLACE: app/page.tsx, app/products/page.tsx, app/globals.css, components/product-card.tsx,
         components/site-header.tsx (only change: data-cart-target on the cart button, for the fly-to-cart animation)
NEW:     components/category-art.tsx, components/quick-view.tsx,
         components/home/category-bento.tsx, components/home/lowest-prices.tsx,
         components/products/filter-panel.tsx, components/products/empty-state.tsx,
         components/ui/overlay.tsx, components/ui/price-slider.tsx, components/ui/toggle-switch.tsx,
         lib/offers-summary.ts, lib/wishlist.ts, lib/fly-to-cart.ts, lib/product-images.ts, lib/use-add-to-cart.ts

No new npm packages (uses @radix-ui/react-slider already in your package.json).

Notes
- Repeated placeholder photo: any image_url used by 3+ products (or whose URL contains "placeholder/resistor/default")
  is replaced by a category illustration. Cleaner long-term fix is in the DB — find them with:
    select image_url, count(*) from products group by 1 having count(*) > 1 order by 2 desc;
  and set those image_url values to NULL.
- Sparkline = the prices different shops charge for the product (cheapest highlighted). There is no price-history
  table, so a real over-time trend isn't possible yet.
- Offers (shop avatars, stock dot, sparkline) are fetched for ALL visible cards in one batched query.
