# UR — The Thoughtful Edit

UR is an affiliate product discovery website. Visitors can explore curated
recommendations and follow links to participating retailers. UR does not
process payments or fulfill orders.

## Features

- Responsive editorial storefront with product, category, collection, search,
  contact, legal, and affiliate disclosure pages.
- MongoDB-backed catalog, featured homepage content, settings, and contact
  inbox.
- Protected administrator dashboard for products, categories, collections,
  site settings, contact messages, and click analytics.
- Server-side affiliate URL allowlisting and click redirects.
- Signed Cloudinary uploads; Cloudinary credentials are used only on the
  server.
- Initial admin bootstrap and clearly labeled, unpublished demo seed data.

## Requirements and configuration

- Node.js 20.19+ (Node 24 recommended) and pnpm.
- MongoDB connection string.
- A random `SESSION_SECRET` with at least 32 characters.
- Cloudinary account credentials for image uploads.
- Public production site URL for metadata and sitemap generation.
- Retailer affiliate accounts and compliant affiliate links before products are
  published.

Copy `.env.example` to `.env.local` and replace every placeholder. Do not commit
`.env.local` or production credentials. `AFFILIATE_ALLOWED_HOSTS` accepts a
comma-separated list of retailer hosts; default allowlisting is
`amazon.com,amazon.in,meesho.com`. The app rejects affiliate links outside this
allowlist.

## Local setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). MongoDB is required for
catalog, admin, contact, and analytics functionality. Without it, those
integrations report service/configuration errors; the app does not pretend to
use a live or mock catalog.

Create the first admin user after setting `MONGODB_URI`, `ADMIN_EMAIL`, and
`ADMIN_PASSWORD`:

```bash
pnpm admin:bootstrap
```

The bootstrap command only creates the initial admin and refuses to overwrite
an existing account. The demo seed is optional and creates only unpublished
categories/products and an unpublished collection:

```bash
pnpm seed
```

Replace demo content and verify retailer links, image rights, prices, claims,
and disclosures before publishing. No reviews or product endorsements are
fabricated by the seed.

## Validation and production

```bash
pnpm lint
pnpm test
pnpm build
pnpm start
```

Deploy to a supported Next.js host (for example, Vercel) with all server
environment variables configured. Set `NEXT_PUBLIC_SITE_URL` to the exact
canonical HTTPS origin. Configure MongoDB network access and Cloudinary
credentials for the deployment environment. Bootstrap the first administrator
against the production database from a trusted environment, then remove or
rotate bootstrap credentials from the deployment environment.

Before launch, verify:

1. Admin login, session expiry, logout, protected routes, and CRUD operations.
2. Cloudinary upload, image reorder/removal, and image cleanup behavior.
3. Contact submission and expiry policy, plus the admin inbox.
4. Affiliate redirects for every configured retailer and click analytics.
5. Homepage featured content, settings, SEO metadata, sitemap, and robots.
6. Desktop and mobile layouts, keyboard navigation, focus behavior, and
   horizontal overflow.
7. Legal content and affiliate disclosures for each retailer and jurisdiction.

Live database and Cloudinary integrations require credentials and have not
been verified against external services in a credential-free workspace.
