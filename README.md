# BC Exotix

Small-breeder snake showcase and inquiry website. Built with Astro 7 + Cloudflare Workers.

## Quick Start

```bash
cp .env.local.example .env.local
# Fill in CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY from clerk.com

npm install
npm run dev        # http://localhost:4321
npm run preview    # Wrangler Workers runtime — http://localhost:8787
```

To load the clearly labelled fictional collection used for local UI demos:

```bash
npm run db:seed:demo
```

The seed is idempotent, updates only reserved `demo-*` records, and loads illustrative images into local R2. It never writes to production.

## Stack

- **Framework:** Astro 7 (SSR) + Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite) via Drizzle ORM
- **Auth:** Clerk (admin routes only)
- **Storage:** Cloudflare R2 (photos)
- **Styling:** Tailwind CSS v4

See `CLAUDE.md` for full development guide.
