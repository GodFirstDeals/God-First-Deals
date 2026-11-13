# God First Deals starter

## Files
- `index.html`: storefront page
- `styles.css`: responsive design
- `app.js`: search, category filters and safe affiliate-link rendering
- `products.json`: product catalogue

## Add products
Add another object to `products.json`:
```json
{
  "id": "unique-id",
  "name": "Product title",
  "category": "Electronics",
  "network": "Temu",
  "description": "Short factual description",
  "url": "PASTE YOUR EXACT APPROVED AFFILIATE URL",
  "image": "",
  "active": true
}
```
Use only the exact affiliate URL supplied by the programme and images you are allowed to use. Set `active` to `false` to hide an item without deleting it. Do not publish stale prices.

## Deploy free with Cloudflare Pages
1. Create/sign in at https://github.com/ and create a repository named `god-first-deals`.
2. Upload the four site files (`index.html`, `styles.css`, `app.js`, `products.json`) to the repository root.
3. Sign in at https://dash.cloudflare.com/
4. Open **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
5. Connect GitHub and select `god-first-deals`.
6. For a plain static site, leave the build command blank and use `/` as the output directory if requested.
7. Deploy. Cloudflare provides a `*.pages.dev` address.
8. Test on your phone and test every affiliate link before sharing it.

## Update products
Edit `products.json` in GitHub and commit the change. Cloudflare Pages redeploys automatically when connected to the repository.

This starter has no public admin dashboard or database. Product updates are made through the GitHub repository. A secure authenticated admin dashboard and database can be added in a later phase. Never put private database service keys in browser code.
