# PART 5 — Assistant, Track, Footer, Floating chat, Dark mode, Polish

Install: `npm i framer-motion` (once, if you haven't), copy the files over your project, restart `npm run dev`.
Optional: run `supabase/part5.sql` (footer newsletter table) and `supabase/part4.sql` (price history / alerts).
Merge the keys in `next.config.part5.js` into your own `next.config.js`.

## Files
| File | What |
|---|---|
| `app/assistant/page.tsx` + `components/chat/*` | Full-height chat: gradient header + animated sparkle avatar, teal user bubbles, glass assistant bubbles, typing dots, streamed reveal, suggestion chips (vanish after 1st message), inline product cards, copy / regenerate, New chat, composer with attach + voice waveform + morphing send button |
| `lib/chat-session.ts` | "New chat" = clears `souk-chat-session` so n8n memory restarts |
| `app/track/page.tsx` + `components/track/*` | Centered card, truck illustration, floating-label inputs, validation, spinner button, vertical animated timeline, WhatsApp button |
| `components/site-footer.tsx`, `lib/contact.ts` | Dark-navy circuit footer, **WhatsApp fix**, partner logos, COD badge, lang/theme toggles, newsletter |
| `components/floating-chat.tsx` | Pulse ring, tooltip, popup (full-screen sheet on phones) |
| `app/layout.tsx`, `app/template.tsx`, `app/loading.tsx`, `app/not-found.tsx`, `app/error.tsx` | Fonts, skip link, MotionConfig, page transitions, branded loader, 404 illustration |
| `components/back-to-top.tsx`, `components/reveal.tsx`, `components/ui/toast.tsx`, `components/providers/motion-provider.tsx` | Back-to-top, scroll-reveal wrapper, glass toasts, reduced-motion switch |
| `components/compare/compare-drawer.tsx` | Lifted above the mobile chat/bottom area |
| `app/globals.css` | Part 4 CSS + Part 5 block (scrollbar, focus ring, dark image treatment, `.img-plate`, micro-interactions) |

## WhatsApp bug (root cause + fix)
`getSettings()` returns `support_whatsapp: ''` when unset, and the old code used `settings?.support_whatsapp ?? '…'`; `??` doesn't fall back on `''`, so the link had no number.
Now: digits are normalised (`0100…`, `+20…`, `0020…` → `20100…`), fallback `NEXT_PUBLIC_SUPPORT_WHATSAPP` / `NEXT_PUBLIC_SUPPORT_EMAIL`, and **the link is hidden if no number exists** (no fake number is ever shown).
Set it in Supabase: `update settings set support_whatsapp = '201XXXXXXXXX';` or add the env var.

## Things you should know (honest notes)
- **Nothing here was run in a browser** (sandbox has no network / no framer-motion). Every file passes a TypeScript syntax transpile; types and visuals are unverified → run `npm run build` first.
- **Timeline** has 5 visual steps over the 5 DB statuses. The DB has no separate "Shipped" status, so step 3 maps `preparing` and is labelled "Preparing & shipped". Only *placed* and *current-step* timestamps exist (the DB stores `created_at`/`updated_at` only). **Courier** isn't in the DB, so it's shown only if you pass `courier` to `ShipmentTimeline`. Shop WhatsApp comes from `shops.contact_whatsapp`.
- Order-code validation accepts `SQ-` + 4–10 letters/digits. If your real codes differ, edit `CODE_RE` in `app/track/page.tsx`.
- **Newsletter** needs `supabase/part5.sql`. Without it the form says "not available yet" (it never pretends to subscribe). Nothing sends emails yet — it only collects addresses.
- "Streaming" is a client-side typing reveal of the finished reply (n8n returns the whole reply at once), capped at ~2 s.
- Floating chat: lifted to `bottom-24` on phones, slides away while scrolling down, hidden on phones on product-detail / cart / checkout and on `/assistant`.
- Dark images: every `img.object-contain` gets a light plate + `brightness(.92)`. Opt out with `data-no-plate` / `data-no-dim`.
- Lighthouse > 90 can't be promised from here. Done for it: lazy images, AVIF/WebP config, `optimizePackageImports`, transform/opacity-only animation, `next/font` swap, reduced-motion. Measure with `npm run build && npm start` + Lighthouse in an incognito window. Biggest risks: hero images from external hosts, and `getProducts` loading all rows before limiting.
- If `images.unoptimized: true` is in your `next.config.js`, AVIF/WebP won't apply.

## Changelog (Parts 1–5)
1. Design system: tokens (light/dark), fonts, Button/Badge/Card/Chip/Skeleton/Select, glass, PCB pattern.
2. Navbar + hero (mesh, count-up, search dropdown, language/theme toggles).
3. Category bento with 13 duotone icons, new product card (fly-to-cart, wishlist, quick view), Lowest prices rail, Products page (filters, bottom sheet, pagination, empty state).
4. Compare page (two-panel, freshness, bars, history chart, alerts, pin-to-compare), product details (gallery, buy box, tabs, bundle).
5. This part (see table).

## VERIFICATION CHECKLIST — to be run by you (I could not run it)
Test each at **375 px**, **768 px**, **1440 px**, in **AR (RTL)** and **EN (LTR)**, **light** and **dark**. Tick when done.

| Page | 375 | 768 | 1440 | What to look for |
|---|:-:|:-:|:-:|---|
| Home `/` | ☐ | ☐ | ☐ | Hero search dropdown not clipped; bento; lowest-prices rail snaps |
| Products `/products` | ☐ | ☐ | ☐ | Filter sheet on mobile, sidebar on desktop; pagination; empty state |
| Product `/products/[id]` | ☐ | ☐ | ☐ | Gallery, buy box sticky only on lg; chat button hidden on phone |
| Compare `/compare` | ☐ | ☐ | ☐ | Drawer doesn't hit chat button; chart LTR axis |
| Assistant `/assistant` | ☐ | ☐ | ☐ | Composer above mobile keyboard; chips vanish after 1st msg; product cards scroll; mic waveform (needs HTTPS) |
| Track `/track` | ☐ | ☐ | ☐ | Floating labels; button disabled until valid; timeline line fills; mirrored in RTL |
| Cart / Checkout | ☐ | ☐ | ☐ | No chat button on phone; toasts at top |
| Footer (every page) | ☐ | ☐ | ☐ | WhatsApp shows a number or is hidden; logos strip; toggles work |
| 404 `/zzz` | ☐ | ☐ | ☐ | Illustration, 3 buttons |
| Global | ☐ | ☐ | ☐ | Page fade/slide; back-to-top (start side); Tab focus rings; skip link; OS "reduce motion" |
