# God First Deals

A mobile-first affiliate shopping discovery site for curated marketplace finds. Built with Astro for fast static pages and straightforward deployment to Cloudflare Pages.

## Run locally

- Install Node.js 20+.
- Run `npm install`.
- Run `npm run dev` and open the local URL shown in your terminal.
- Run `npm run check` and `npm run build` before publishing.

## Product updates

All product records live in `src/data/products.ts`. Add or update products there; use exact approved affiliate URLs, accurate product descriptions, and image links supplied by the owner. Never invent prices, reviews, ratings, specifications, or discounts. Set `active: false` until a product has an approved affiliate URL and images. The Itel reference remains inactive and is not used as an affiliate link. The fifth item is an intentionally empty placeholder.

## Deployment

The project generates static files in `dist/`. Deploy this directory using Cloudflare Pages with build command `npm run build` and output directory `dist`. No deployment has been configured or performed. Replace the example canonical domain in `astro.config.mjs` and `src/layouts/BaseLayout.astro` with the production domain before launch.

## Future-ready, not yet integrated

This version uses a central TypeScript catalog and static pages. Admin tools, a database, click tracking, analytics, imports, price monitoring, and user accounts are not connected.
