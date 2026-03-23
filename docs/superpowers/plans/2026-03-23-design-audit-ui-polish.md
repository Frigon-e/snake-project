# Design Audit & UI Polish: The Serpent's Edge

**Date:** 2026-03-23  
**Goal:** Audit the live dev site (http://localhost:4321) against `DESIGN.md` tokens and the Stitch project design (ID: `13100941290012229994`). Identify gaps and produce a prioritized fix list.

**Status at time of audit:**
- Dev server running at http://localhost:4321 ✅
- Seed data applied (Citrus Dream, Phantom Mist, Desert Clown, Obsidian Queen) ✅
- `Astro.locals.runtime.env` migration complete (cloudflare:workers) ✅
- Stitch MCP not yet configured in Claude Desktop — Stitch comparison deferred until MCP OAuth is set up

---

## Blocking Fix (Applied During This Session)

### ✅ BF-1: `Astro.locals.runtime.env` removed in Astro 6
- **Impact:** Every page 500'd; site completely non-functional in dev
- **Fix:** Migrated all 8 affected files to `import { env } from 'cloudflare:workers'`
- **Files fixed:**
  - `src/actions/index.ts`
  - `src/pages/index.astro`
  - `src/pages/snakes/index.astro`
  - `src/pages/snakes/[slug].astro`
  - `src/pages/admin/index.astro`
  - `src/pages/admin/snakes/index.astro`
  - `src/pages/admin/snakes/[id]/edit.astro`
  - `src/pages/admin/media/index.astro`
  - `src/pages/api/r2/image.ts`

### ✅ BF-2: `PUBLIC_CLERK_PUBLISHABLE_KEY` missing
- **Impact:** Clerk middleware crashed before serving any page
- **Fix:** Added `PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env.local` and corrected `wrangler.jsonc` `vars` entry

### ✅ BF-3: No seed data
- **Impact:** Database empty — hero shows no featured snakes, collection is blank
- **Fix:** Created `scripts/seed.sql` with 4 demo snakes + 8 trait chips; applied via `wrangler d1 execute --local`

---

## Design Audit: Current Implementation vs DESIGN.md

### ✅ Passing — Correctly Implemented

| Rule | Where | Status |
|---|---|---|
| Surface tokens (`#121414`, `#1e2020`, etc.) | `global.css @theme` | ✅ Correct |
| No 100% white — uses `on-surface: #e2e2e2` | All components | ✅ Correct |
| Primary `#9ed1bd` for primary actions | Button, Badge, links | ✅ Correct |
| Tertiary `#e9c176` only for Reserve/Buy | Button tertiary variant, SnakeCard reserve | ✅ Correct |
| Noto Serif for display/headlines | h1, h2, card titles, logo | ✅ Correct |
| Inter for body/UI | Body, badges, chips, labels | ✅ Correct |
| Glassmorphism header | `bg-surface-variant/60 backdrop-blur-xl` | ✅ Correct |
| Ghost borders at outline-variant opacity | Cards, inputs, ghost button | ✅ Correct |
| Trait chips: codominant=secondary-container, recessive=tertiary-container | Chip.astro | ✅ Correct |
| No divider lines — uses background shifts | Table rows, section spacing | ✅ Correct |

### ⚠️ Gaps Found — Visual/Polish Issues

#### GAP-1: Hero section lacks a background image
- **DESIGN.md intent:** "treat images not as boxed content, but as focal specimens housed within sophisticated, layered glass containers." The hero should have a full-bleed atmospheric specimen image, not a flat `surface-container-lowest` background.
- **Current:** `bg-surface-container-lowest` — plain dark background
- **Fix:** Add a hero specimen image (from R2 or a placeholder) with overlay gradient. Use a `<img class="absolute inset-0 w-full h-full object-cover opacity-30">` pattern under the gradient.

#### GAP-2: Snake card "View specimen →" link text is empty
- **Current:** `<a href="/snakes/banana-pastel-2024" class="text-xs text-primary ...">` — renders blank in the HTML (the arrow `→` content is there in the template but visible in HTML) — visually present but low prominence
- **Fix:** Acceptable as-is, but could be styled as a small pill/link with more presence

#### GAP-3: Hero headline breathing room / asymmetric layout not implemented
- **DESIGN.md:** "headlines bleed into margins, content tucked in 6-column grid on the right" — asymmetric editorial layout
- **Current:** Simple left-aligned block in a centered max-w-7xl container — symmetric, functional but not editorial
- **Fix (nice-to-have):** Apply asymmetric grid to hero — headline `col-span-2` bleeding left, body text and CTAs in right columns

#### GAP-4: No `label-sm` pairing for scientific labels on collection page
- **DESIGN.md:** "pair `display-lg` with `label-sm` in primary for a technical, scientific feel"
- **Current:** Species text is `text-xs uppercase tracking-widest text-on-surface-variant` — close, but not in `primary` color
- **Fix:** Change species label color from `text-on-surface-variant` to `text-primary` on detail page and cards, to reinforce the scientific/technical feel

#### GAP-5: Input focus glow missing explicit `shadow` style in global CSS
- **DESIGN.md:** "soft `0px 0px 8px` glow of the primary green" for inputs
- **Current:** `focus:border-primary/50` (border color change) but no `focus:shadow-[0_0_8px_rgba(158,209,189,0.3)]`
- **Fix:** Add `focus:shadow-[0_0_8px_rgba(158,209,189,0.3)]` to `Input.astro` and inline textareas/selects

#### GAP-6: Footer has a `border-t` divider line
- **DESIGN.md:** "The No-Line Rule — Sectioning must be achieved through background shifts, never through 1px solid lines"
- **Current:** `border-t border-outline-variant/10` on footer
- **Fix:** Remove `border-t border-outline-variant/10`; the `bg-surface-container-low` background shift from `bg-surface` already provides visual separation

#### GAP-7: Header has a `border-b` divider line
- **Current:** `border-b border-outline-variant/10` on the sticky header
- **DESIGN.md:** "Ghost Border" — "should be felt, not seen" — at 10% opacity it's borderline acceptable, but the spirit is no border
- **Fix (minor):** Remove or reduce to 5% opacity; the glassmorphism blur provides sufficient visual layering

#### GAP-8: Ambient shadow not applied to hero section cards
- **DESIGN.md:** "For high-priority floating elements (Modals), use shadow: `0px 20px 40px rgba(0, 0, 0, 0.4)`"
- **Current:** Snake detail page image container has no shadow
- **Fix (nice-to-have):** Add `shadow-[0_20px_40px_rgba(0,0,0,0.4)]` to the specimen image container on the detail page

#### GAP-9: Collection page `<h1>` uses non-editorial sizing
- **Current:** `text-4xl` — functional but could use `display-lg` (3.5rem / text-6xl) with more breathing room above
- **Fix:** Adjust collection page heading to use the editorial display-lg treatment matching the homepage hero

#### GAP-10: Placeholder image is referenced but doesn't exist
- **Current:** `/placeholder-snake.jpg` is referenced in `SnakeCard.astro` and `[slug].astro` when no R2 image is set
- **Fix:** Either add a placeholder SVG/gradient to `public/`, or replace with an inline CSS gradient placeholder (more premium feel)

---

## Priority Order for Fixes

| # | Gap | Impact | Effort |
|---|---|---|---|
| 1 | GAP-10: Placeholder image 404 | High — cards show broken image | Low |
| 2 | GAP-5: Input focus glow | Medium — form UX | Low |
| 3 | GAP-6: Footer border-t | Medium — design principle violation | Low |
| 4 | GAP-7: Header border-b | Low — barely visible | Low |
| 5 | GAP-4: Species label color | Medium — editorial feel | Low |
| 6 | GAP-1: Hero background image | High — visual impact | Medium |
| 7 | GAP-9: Collection h1 size | Low — cosmetic | Low |
| 8 | GAP-3: Asymmetric hero layout | High — matches Stitch editorial intent | High |
| 9 | GAP-8: Ambient shadow on detail | Low — subtle | Low |

---

## Stitch MCP — Deferred

The Stitch MCP tools (`mcp__stitch__list_screens`, `mcp__stitch__get_screen`) require Google OAuth to be configured in Claude Desktop's `mcpServers` config. The design comparison against the Stitch project (`13100941290012229994`) should be done once the MCP is connected.

To configure, add to `~/.config/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@google/generative-ai-stitch-mcp"],
      "env": {}
    }
  }
}
```
Then restart Claude Code and run a new session — the tools will appear and screens can be fetched for pixel-accurate comparison.

---

## Next Implementation Tasks

### Immediate (Low-effort, high-impact)

- [ ] **Fix-1:** Add a placeholder SVG gradient to `public/placeholder-snake.svg`; update `SnakeCard.astro` and `[slug].astro` to use it
- [ ] **Fix-2:** Add `focus:shadow-[0_0_8px_rgba(158,209,189,0.3)]` to `Input.astro` focus state  
- [ ] **Fix-3:** Remove `border-t border-outline-variant/10` from `Footer.astro`
- [ ] **Fix-4:** Remove `border-b border-outline-variant/10` from `Header.astro`
- [ ] **Fix-5:** Change species label from `text-on-surface-variant` to `text-primary` in `SnakeCard.astro` and `[slug].astro`

### Medium effort

- [ ] **Fix-6:** Add a hero background image with overlay (placeholder or seeded R2 image)
- [ ] **Fix-7:** Apply `display-lg` treatment to collection page `<h1>`

### After Stitch MCP is connected

- [ ] **Fix-8:** Fetch all Stitch screens and do pixel-level comparison
- [ ] **Fix-9:** Implement asymmetric editorial hero layout matching Stitch design
- [ ] **Fix-10:** Apply any additional component-level changes revealed by Stitch comparison
