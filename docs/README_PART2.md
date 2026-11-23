# Part 2 — Navbar + Hero

Copy over (same paths):
- app/globals.css            (Part 1 + new block at the bottom — replaces the Part 1 file)
- app/page.tsx               (home: hero section replaced by <Hero/>, rest unchanged)
- components/site-header.tsx (replaces old header)
- components/search-box.tsx  (new; used by header, hero and mobile sheet)
- components/home/*          (new: hero, hero-visual, hero-background, count-up)

Install:  npm i framer-motion
Needs Part 1 (Chip, Button, tokens, fonts). Sheet component is no longer used by the header.
