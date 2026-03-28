# BC Exotix

Premium snake breeding business website. Built with Astro 6 + Cloudflare Workers.

## Quick Start

```bash
cp .env.local.example .env.local
# Fill in CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY from clerk.com

npm install
npm run dev        # http://localhost:4321
npm run preview    # Wrangler Workers runtime — http://localhost:8787
```

## Stack

- **Framework:** Astro 6 (SSR) + Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite) via Drizzle ORM
- **Auth:** Clerk (admin routes only)
- **Storage:** Cloudflare R2 (photos)
- **Styling:** Tailwind CSS v4

See `CLAUDE.md` for full development guide.
