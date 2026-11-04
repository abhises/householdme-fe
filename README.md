# householdme-fe

Next.js 16 (App Router, TypeScript) frontend for HouseholdMe: the public website, built in the theme of
`../HouseholdMe/Householdme v2.dc.html`, plus the admin panel at `/admin`.

All data comes from the Express API in `../householdme-be`; the frontend has no database access of its own.

## Quick start

Start the backend first (see `../householdme-be/README.md`), then:

```bash
cp .env.example .env.local      # API_URL defaults to http://localhost:4100
npm install
npm run dev                     # http://localhost:3100
```

- Site: http://localhost:3100
- Admin: http://localhost:3100/admin (sign in with the seeded admin account)

## How it talks to the backend

- **Server components** (public pages) call `API_URL/api/public/*` directly with `cache: "no-store"`,
  so admin edits show up on the next page load.
- **The browser** only talks to this origin: `next.config.ts` rewrites `/api/*` and `/uploads/*` to the
  backend. The admin session cookie (`hm_admin`, httpOnly) is therefore first-party, and no CORS setup is needed.
- `src/proxy.ts` (Next 16's replacement for middleware) redirects `/admin/*` to the login page when there is no
  session cookie. The backend verifies the session on every admin request.

## Pages

| URL | Page |
| --- | --- |
| `/` | Home: hero guide, trust facts, latest guides, categories, test method, testers, newsletter |
| `/category/[slug]` | Category with its buying guides |
| `/guide/[slug]` | Buying guide: picks, results table, FAQ; long-form guides add comparison table, deep dives, results by test, buying advice, glossary, sticky buy bar and newsletter popup |
| `/review/[slug]` | Product review with gallery, score card, price history, results, specs, alternatives |
| `/author/[slug]`, `/team` | Editorial team |
| `/how-we-test`, `/info/[slug]` | Method and transparency pages |
| `/deals`, `/search`, `/newsletter` | Deals, search, newsletter signup |

## Admin panel

Dashboard, buying guides (including every long-form section), products and reviews, categories, authors,
deals, info pages, media library (upload, pick and delete), subscribers (CSV export), site/home/method
settings, and password change.

## Layout

```
src/app/(site)/      public pages (server components)
src/app/admin/       login + (panel)/ admin screens (client components)
src/components/site/ header, footer, cards, newsletter form, guide/review client widgets
src/components/admin/ form fields, repeatable list editor, media picker, tables
src/lib/             API clients and shared types
src/app/globals.css  theme tokens and styles ported from the design
```
