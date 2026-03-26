# CLAUDE.md — The Serpent's Edge

## Project Overview
Snake breeding e-commerce/showcase site with a premium editorial aesthetic ("The Curated Terrarium"). Design tokens and visual language are fully documented in `DESIGN.md` — always consult it before adding UI.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Astro 6 (`output: 'server'`) |
| Deployment | Cloudflare Workers via `@astrojs/cloudflare` v13+ |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Auth | Clerk (`@clerk/astro`) — admin routes only |
| Storage | Cloudflare R2 (photos/assets) |
| Styling | Tailwind CSS v4 + Tailwind UI Plus components |
| Forms | Astro Actions (`astro:actions`) |
| Testing | Vitest (unit) + Playwright (E2E) |
| Local Dev | Docker Compose + Wrangler dev (platformProxy) |

## Key Conventions

### Database
- All DB access goes through `src/db/client.ts` via `createDb(Astro.locals.runtime.env.DB)`
- Never import D1 directly in pages
- Schema lives in `src/db/schema.ts` — run `npm run db:generate` after any changes, then `npm run db:migrate`
- Migrations are in `src/db/migrations/`

### Forms & Actions
- All form mutations use Astro Actions from `src/actions/index.ts`
- Use `Astro.getActionResult(actions.actionName)` in pages to handle results
- Client-side validation via HTML attributes; server-side via Zod in action `input` schemas

### Auth
- Admin routes (`/admin/**`) protected by Clerk middleware in `src/middleware.ts`
- Set `role: 'admin'` in a user's Clerk Public Metadata to grant admin access
- `isAdminRole()` helper in `src/lib/auth.ts`

### UI Components
- Reusable components live in `src/components/ui/` — use these everywhere
- Follow DESIGN.md token system: no 100% white, no divider lines, use background shifts
- Surface hierarchy: `surface` → `surface-container-low` → `surface-container` → `surface-container-high` → `surface-container-highest`
- Gold (`tertiary: #e9c176`) is only for final conversion actions (Buy, Reserve)
- Fonts: Noto Serif for display/headlines, Inter for body/UI

### R2 Storage
- R2 keys generated via `r2Key()` in `src/lib/r2.ts`
- Images served via `/api/r2/image?key=...`
- Admin upload at `/admin/media`

### Live Content Collections (Astro 6)
- Config in `src/live.config.ts`
- Pages query Drizzle directly for richer query capabilities

### Figma MCP (UI Designs)
- File key: `hluobF92AIfv489ZzBw1Cu`
- Tools: `mcp__plugin_figma_figma__get_design_context`, `mcp__plugin_figma_figma__get_screenshot`, `mcp__plugin_figma_figma__get_metadata`
- Usage: Pass `fileKey` and `nodeId` to `get_design_context` to pull component designs

Key node IDs (Landing Page canvas `0:1` → frame `3:2`):
| Section | Node ID |
|---|---|
| Top Navigation | `3:167` |
| Header / Hero | `3:3` |
| Bento Grid Collection | `3:21` |
| About Us | `3:119` |
| Call to Action | `3:150` |
| Footer | `3:93` |

## Commands
```bash
npm run dev              # Astro dev server (http://localhost:4321)
npm run build            # Type-check + production build
npm run preview          # Wrangler local Workers preview (http://localhost:8787)
npm run db:generate      # drizzle-kit generate migrations from schema changes
npm run db:migrate       # Apply migrations to local D1 (via Wrangler)
npm run db:migrate:prod  # Apply migrations to production D1
npm run test             # Vitest unit tests
npm run test:watch       # Vitest in watch mode
npm run test:e2e         # Playwright E2E tests
docker compose up        # Full containerized local dev environment
```

## Important Files
| File | Purpose |
|---|---|
| `DESIGN.md` | Design system — colors, typography, components |
| `src/db/schema.ts` | Drizzle table definitions |
| `src/db/client.ts` | D1 Drizzle client factory |
| `src/live.config.ts` | Astro 6 Live Content Collections |
| `src/middleware.ts` | Clerk auth + route protection |
| `src/actions/index.ts` | Astro Actions (all form handlers) |
| `src/lib/auth.ts` | Clerk role helpers |
| `src/lib/r2.ts` | R2 key generation |
| `wrangler.jsonc` | Cloudflare Workers + D1/R2 bindings |
| `drizzle.config.ts` | Drizzle Kit migration config |

## Deployment
```bash
npm run build
npx wrangler deploy
```
Set secrets: `npx wrangler secret put CLERK_SECRET_KEY`

### Cloudflare Resources
- D1 database: `serpents-edge-db`
- R2 bucket: `serpents-edge-assets`
- Workers binding names: `DB` (D1), `ASSETS_BUCKET` (R2)

## Implementation Plan
Full plan at: `docs/superpowers/plans/2026-03-20-serpents-edge-full-stack.md`
