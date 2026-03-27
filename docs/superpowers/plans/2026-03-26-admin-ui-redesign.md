# Admin UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all admin screens to match the Figma "Admin Dashboard (with Featured status)" and "Edit Specimen (Featured Toggle)" designs. Tasks 1–7 (completed) handled the visual shell. Tasks 8–11 add the missing Figma fields: Sex, Hatch Date, Personality & Temperament, Health & Feeding Habits (+ sub-fields), Weight, 3-state Availability (Available/Reserved/Sold), and Complementary Genetics.

**Architecture:** Tasks 8–11 follow the same pattern: schema → actions → edit form → create form. Each task commits independently. DB migration uses `npm run db:generate` + `npm run db:migrate`.

**Tech Stack:** Astro 6 SSR, Tailwind CSS v4, Drizzle ORM on Cloudflare D1, existing Astro Actions, existing `src/components/ui/` components.

---

## Figma Reference

| Screen | Node ID | Key Decisions |
|---|---|---|
| Admin Dashboard | `3:882` | Sidebar brand block, 3-stat grid, redesigned inventory table |
| Edit Specimen | `3:180` | 12-col 7+5 layout, card sections, featured toggle, trait chips |

## Schema

**Existing fields (Tasks 1–7):** `name`, `slug`, `species`, `description`, `priceInCents`, `available` (boolean), `featured` (boolean), `primaryImageKey`.

**New fields added in Tasks 8–11:** `sex`, `hatchDate`, `personality`, `feedingNotes`, `diet`, `shedFrequency`, `temperature`, `humidity`, `weightGrams`, `complementaryGenetics`, `status`.

Availability model: add `status TEXT` column ('available' | 'reserved' | 'sold'). Keep `available` boolean and sync it: `available = status === 'available'`. Migration backfills: `status = 'available'` where `available = 1`, else `status = 'sold'`.

## Files to Change

| File | Action | Responsibility |
|---|---|---|
| `src/layouts/AdminLayout.astro` | Modify | Sidebar redesign + glassmorphism header |
| `src/pages/admin/index.astro` | Modify | Editorial header, 3 stat cards, inventory table |
| `src/pages/admin/snakes/index.astro` | Modify | Standalone inventory page (keep for direct nav) |
| `src/pages/admin/snakes/new.astro` | Modify | Card-section create form |
| `src/pages/admin/snakes/[id]/edit.astro` | Modify | 2-col edit form with media panel + featured toggle |
| `src/pages/admin/media/index.astro` | Modify | Image preview, copy-key button |
| `CLAUDE.md` | Modify | Add admin Figma node IDs |
| `src/db/schema.ts` | Modify | Add 11 new columns |
| `src/actions/index.ts` | Modify | updateSnake + createSnake with new fields |
| `src/pages/admin/snakes/[id]/edit.astro` | Modify (again) | Add missing Figma cards + 3-button availability |
| `src/pages/admin/snakes/new.astro` | Modify (again) | Add new fields to create form |

---

## Design Tokens Reference

Use only design system tokens — no hardcoded hex:

```
bg-surface                  = #121414
bg-surface-container-low    = #191b1b  (card backgrounds)
bg-surface-container        = #1e2020  (sidebar, table header)
bg-surface-container-high   = #282a2a  (hover states)
bg-surface-container-lowest = #0d0f0f  (inputs)
text-primary                = #9ed1bd  (green accent, active nav, section labels)
text-tertiary               = #e9c176  (gold — prices, Save button only)
text-on-surface             = #e2e2e2
text-on-surface/70          = rgba(226,226,226,0.7)
bg-primary/10               = rgba(158,209,189,0.1)  (active nav bg)
ghost-border                = shadow-[0px_0px_0px_1px_rgba(65,72,67,0.1)]
```

---

## Task 1: AdminLayout — Sidebar + Header Redesign

**Files:**
- Modify: `src/layouts/AdminLayout.astro`

### Sidebar design (256px, `bg-surface-container`, right ghost border)

**Brand block (top):**
- `bg-primary/10 rounded-sm w-10 h-10` icon container (gold snake SVG or initials)
- Brand name in `font-noto-serif text-tertiary font-bold text-lg`
- "Admin Portal" label: `text-[10px] uppercase tracking-[2px] text-on-surface/60`

**Nav items:**
- Active: `bg-primary/10 text-primary rounded-md`
- Inactive: `text-on-surface/70 hover:bg-surface-container-high rounded-md`
- Each item: icon (20x20) + label, `px-3 py-[10px]`
- Detect active with `Astro.url.pathname`
- Items: Inventory (`/admin/snakes`), Inquiries (`/admin` for now), Media (`/admin/media`)

**Bottom block (below separator):**
- Ghost border top: `border-t border-outline-variant/10 pt-4`
- "New Specimen" primary button: `w-full bg-primary text-on-primary font-bold py-3 rounded-md`
- Support link below (text only, subdued)

### Header design (glassmorphism)

- `backdrop-blur-md bg-surface/60 border-b border-outline-variant/15`
- Left: page title slot (Noto Serif, `text-primary`, 20px)
- Right: `header-actions` slot + vertical divider + "CURATOR ADMIN" label + avatar circle

- [ ] **Step 1: Read the current AdminLayout to understand slot structure**

```bash
# Read current file
```

- [ ] **Step 2: Rewrite AdminLayout.astro with new sidebar + header**

Full replacement — preserve `title` prop and two slots (`header-actions`, default).

**IMPORTANT — slot name migration:** The existing slot is named `admin-header-actions`. After rewriting the layout to use `header-actions`, you must also update every admin page that references the old name. Search for `slot="admin-header-actions"` across all files in `src/pages/admin/` and replace with `slot="header-actions"`.

```astro
---
// src/layouts/AdminLayout.astro
interface Props {
  title: string;
}
const { title } = Astro.props;
const pathname = Astro.url.pathname;

const navItems = [
  { label: 'Inventory',  href: '/admin/snakes',  icon: '...' },
  { label: 'Inquiries',  href: '/admin',         icon: '...' },
  { label: 'Media',      href: '/admin/media',   icon: '...' },
];
---
<div class="flex h-screen bg-surface overflow-hidden">
  <!-- Sidebar: 256px fixed -->
  <aside class="w-64 shrink-0 bg-surface-container border-r border-outline-variant/15 flex flex-col h-full">
    <!-- Brand block -->
    <div class="px-4 pt-4 pb-8">
      <div class="flex items-center gap-3 px-2">
        <div class="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center shrink-0">
          <!-- snake SVG icon -->
        </div>
        <div class="flex flex-col gap-1">
          <p class="font-noto-serif text-tertiary font-bold text-lg leading-none">The Serpent's Edge</p>
          <p class="text-[10px] uppercase tracking-[2px] text-on-surface/60">Admin Portal</p>
        </div>
      </div>
    </div>
    <!-- Nav -->
    <nav class="flex-1 flex flex-col gap-1 px-2 pt-2">
      {navItems.map(item => (
        <a
          href={item.href}
          class:list={[
            'flex items-center gap-3 px-3 py-[10px] rounded-md text-sm transition-colors',
            pathname.startsWith(item.href) && item.href !== '/admin'
              ? 'bg-primary/10 text-primary'
              : pathname === item.href
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface/70 hover:bg-surface-container-high'
          ]}
        >
          <!-- icon slot -->
          {item.label}
        </a>
      ))}
    </nav>
    <!-- Bottom actions -->
    <div class="px-2 pt-4 pb-4 bg-surface-container-lowest rounded-b-none">
      <a href="/admin/snakes/new"
        class="flex items-center justify-center gap-2 w-full bg-primary text-on-primary font-bold py-3 rounded-md text-sm hover:bg-primary/90 transition-colors mb-4">
        + New Specimen
      </a>
    </div>
  </aside>
  <!-- Main -->
  <div class="flex-1 flex flex-col min-w-0 overflow-auto">
    <!-- Top bar -->
    <header class="sticky top-0 z-10 backdrop-blur-md bg-surface/60 border-b border-outline-variant/15 flex items-center justify-between px-6 h-14 shrink-0">
      <h1 class="font-noto-serif text-primary text-xl font-bold">{title}</h1>
      <div class="flex items-center gap-4">
        <slot name="header-actions" />
        <div class="w-px h-8 bg-outline-variant/20"></div>
        <span class="text-[10px] uppercase tracking-[1px] text-on-surface/80 font-medium">Curator Admin</span>
        <div class="w-8 h-8 rounded-full border border-primary/20 bg-surface-container-high flex items-center justify-center">
          <svg ...user icon... />
        </div>
      </div>
    </header>
    <!-- Content -->
    <main class="flex-1 p-10">
      <slot />
    </main>
  </div>
</div>
```

- [ ] **Step 3: Add correct SVG icons for each nav item**

Use inline SVGs from heroicons (outline style, 20x20):
- Inventory: tag/collection icon
- Inquiries: inbox/envelope icon
- Media: photo icon

- [ ] **Step 4: Verify dev server compiles with no errors**

```bash
npm run dev
# Check http://localhost:4321/admin — layout should render
```

- [ ] **Step 5: Commit**

```bash
git add src/layouts/AdminLayout.astro
git commit -m "feat: redesign AdminLayout — branded sidebar, glassmorphism header, active nav"
```

---

## Task 2: Admin Dashboard — Stats + Inventory Table

**Files:**
- Modify: `src/pages/admin/index.astro`

### Design

**Page structure (inside `<main>`):**

```
gap-10 flex flex-col
├── Dashboard header (eyebrow + H2 + subtitle + Export button)
├── Stats grid (3 cols)
│   ├── Stat Card 1: Total Specimens (all snakes count)
│   ├── Stat Card 2: Active Listings (available=true count)
│   └── Stat Card 3: Pending Inquiries (all inquiries count)
└── Specimen Registry table card
    ├── Table header: "Specimen Registry" + species filter (static for now)
    ├── Table body (same data as snakes list)
    └── Pagination footer (static "Showing X of Y Specimens")
```

**Stat card structure:**
```astro
<div class="bg-surface-container-low rounded-lg p-6 border border-outline-variant/5 flex flex-col gap-4">
  <!-- top row: icon + trend badge -->
  <div class="flex items-start justify-between">
    <div class="w-9 h-9 ...icon container..."></div>
    <span class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">+N this week</span>
  </div>
  <!-- value -->
  <div>
    <p class="text-[10px] uppercase tracking-[1.2px] text-on-surface/60 font-medium mb-1">Total Specimens</p>
    <p class="font-noto-serif text-on-surface text-3xl font-bold">{snakeCount}</p>
  </div>
</div>
```

**Table row structure:**
```
Columns: SPECIMEN | SPECIES | MORPH DETAILS | STATUS | PRICE | ACTIONS
- SPECIMEN: 48x48 thumbnail (primaryImageKey → /api/r2/image or placeholder) + name (Inter medium 14px) + "FEATURED" gold badge if featured + ID subtext
- SPECIES: Inter 14px text-on-surface/70
- MORPH DETAILS: trait chips (Chip component, flex-wrap gap-1)
- STATUS: colored dot (bg-primary if available, bg-tertiary/70 if sold) + "AVAILABLE"/"SOLD" text
- PRICE: font-noto-serif text-tertiary text-sm
- ACTIONS: pencil icon link + trash icon form (no confirm(), use inline delete)
```

**Table header row:** `bg-surface-container` with uppercase tracking-[1.5px] labels

**Table data queries:**
```typescript
const snakeCount = await db.select({ count: count() }).from(snakes);
const availableCount = await db.select({ count: count() }).from(snakes).where(eq(snakes.available, true));
const inquiryCount = await db.select({ count: count() }).from(inquiries);
const allSnakes = await db.select().from(snakes).orderBy(desc(snakes.createdAt)).limit(10);
const snakesWithTraits = await Promise.all(
  allSnakes.map(async s => ({
    ...s,
    traits: await db.select().from(traitChips).where(eq(traitChips.snakeId, s.id)),
  }))
);
```

- [ ] **Step 1: Read current admin/index.astro**

```bash
# Read src/pages/admin/index.astro
```

- [ ] **Step 2: Rewrite admin/index.astro**

Complete file replacement. Keep the same DB imports/queries but add `count()` and `availableCount`.

```astro
---
// src/pages/admin/index.astro
import AdminLayout from '../../layouts/AdminLayout.astro';
import Chip from '../../components/ui/Chip.astro';
import { createDb } from '../../db/client';
import { snakes, traitChips, inquiries } from '../../db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';

const db = createDb((env as unknown as { DB: D1Database }).DB);
const [{ value: snakeCount }] = await db.select({ value: count() }).from(snakes);
const [{ value: availableCount }] = await db.select({ value: count() }).from(snakes).where(eq(snakes.available, true));
const [{ value: inquiryCount }] = await db.select({ value: count() }).from(inquiries);
const allSnakes = await db.select().from(snakes).orderBy(desc(snakes.createdAt)).limit(10);
const snakesWithTraits = await Promise.all(
  allSnakes.map(async s => ({
    ...s,
    traits: await db.select().from(traitChips).where(eq(traitChips.snakeId, s.id)),
  }))
);
---
<AdminLayout title="Inventory Overview">
  <div class="flex flex-col gap-10">
    <!-- Dashboard header -->
    <div class="flex items-end justify-between">
      <div>
        <p class="text-primary text-[10px] uppercase tracking-[3px] font-bold mb-2">Ecosystem Health</p>
        <h2 class="font-noto-serif text-on-surface font-bold text-5xl tracking-tight mb-3">Inventory Overview</h2>
        <p class="text-on-surface/70 text-lg">Managing the finest lineages of rare morphs and captive-bred specimens.</p>
      </div>
      <a href="/admin/snakes" class="flex items-center gap-2 bg-surface-container border border-outline-variant/20 text-on-surface text-sm font-medium px-5 py-[11px] rounded-md hover:bg-surface-container-high transition-colors">
        View All →
      </a>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-3 gap-6">
      <!-- Total Specimens -->
      <div class="bg-surface-container-low rounded-lg p-6 border border-outline-variant/5 flex flex-col gap-4">
        <div class="flex items-start justify-between">
          <div class="w-9 h-9 bg-primary/10 rounded-sm flex items-center justify-center">
            <svg ...collection icon... />
          </div>
          <span class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">All time</span>
        </div>
        <div>
          <p class="text-[10px] uppercase tracking-[1.2px] text-on-surface/60 font-medium mb-1">Total Specimens</p>
          <p class="font-noto-serif text-on-surface text-3xl font-bold">{snakeCount}</p>
        </div>
      </div>

      <!-- Active Listings -->
      <div class="bg-surface-container-low rounded-lg p-6 border border-outline-variant/5 flex flex-col gap-4">
        <div class="flex items-start justify-between">
          <div class="w-9 h-9 bg-tertiary/10 rounded-sm flex items-center justify-center">
            <svg ...tag icon... />
          </div>
          <span class="bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full">Available</span>
        </div>
        <div>
          <p class="text-[10px] uppercase tracking-[1.2px] text-on-surface/60 font-medium mb-1">Active Listings</p>
          <p class="font-noto-serif text-on-surface text-3xl font-bold">{availableCount}</p>
        </div>
      </div>

      <!-- Pending Inquiries -->
      <div class="bg-surface-container-low rounded-lg p-6 border border-outline-variant/5 flex flex-col gap-4">
        <div class="flex items-start justify-between">
          <div class="w-9 h-9 bg-secondary-container/20 rounded-sm flex items-center justify-center">
            <svg ...inbox icon... />
          </div>
          <span class="bg-secondary-container/20 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">Inbox</span>
        </div>
        <div>
          <p class="text-[10px] uppercase tracking-[1.2px] text-on-surface/60 font-medium mb-1">Pending Inquiries</p>
          <p class="font-noto-serif text-on-surface text-3xl font-bold">{inquiryCount}</p>
        </div>
      </div>
    </div>

    <!-- Specimen Registry table -->
    <div class="bg-surface-container-low rounded-lg border border-outline-variant/5 overflow-hidden">
      <!-- Table header -->
      <div class="flex items-center justify-between px-6 py-6 border-b border-outline-variant/10">
        <h3 class="font-noto-serif text-on-surface text-xl font-bold">Specimen Registry</h3>
        <a href="/admin/snakes/new" class="bg-primary text-on-primary font-bold text-sm px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
          + New Specimen
        </a>
      </div>
      <!-- Table -->
      <table class="w-full">
        <thead>
          <tr class="bg-surface-container">
            <th class="text-left px-6 py-4 text-[10px] uppercase tracking-[1.5px] text-on-surface/80 font-bold">Specimen</th>
            <th class="text-left px-6 py-4 text-[10px] uppercase tracking-[1.5px] text-on-surface/80 font-bold">Species</th>
            <th class="text-left px-6 py-4 text-[10px] uppercase tracking-[1.5px] text-on-surface/80 font-bold">Morph Details</th>
            <th class="text-left px-6 py-4 text-[10px] uppercase tracking-[1.5px] text-on-surface/80 font-bold">Status</th>
            <th class="text-left px-6 py-4 text-[10px] uppercase tracking-[1.5px] text-on-surface/80 font-bold">Price</th>
            <th class="text-right px-6 py-4 text-[10px] uppercase tracking-[1.5px] text-on-surface/80 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {snakesWithTraits.map(snake => (
            <tr class="even:bg-surface-container hover:bg-surface-container-high/40 transition-colors">
              <!-- Specimen cell: thumbnail + name + featured badge -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-sm bg-surface-container-highest overflow-hidden shrink-0">
                    {snake.primaryImageKey
                      ? <img src={`/api/r2/image?key=${encodeURIComponent(snake.primaryImageKey)}`} alt={snake.name} class="w-full h-full object-cover" />
                      : <img src="/placeholder-snake.svg" alt="" class="w-full h-full object-cover opacity-40" />
                    }
                  </div>
                  <div>
                    <p class="text-on-surface text-sm font-medium">{snake.name}</p>
                    {snake.featured && (
                      <span class="inline-block bg-tertiary/20 text-tertiary text-[9px] font-bold uppercase tracking-[0.45px] px-1.5 py-0.5 rounded-sm mt-0.5">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <!-- Species -->
              <td class="px-6 py-4 text-sm text-on-surface/70">{snake.species}</td>
              <!-- Morph details -->
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  {snake.traits.map(t => <Chip type={t.type}>{t.label}</Chip>)}
                  {snake.traits.length === 0 && <span class="text-on-surface/30 text-xs">—</span>}
                </div>
              </td>
              <!-- Status -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class:list={['w-2 h-2 rounded-full', snake.available ? 'bg-primary' : 'bg-on-surface/30']}></div>
                  <span class="text-[10px] uppercase tracking-[0.5px] font-bold text-on-surface">{snake.available ? 'Available' : 'Sold'}</span>
                </div>
              </td>
              <!-- Price -->
              <td class="px-6 py-4">
                <span class="font-noto-serif text-tertiary text-sm font-bold">
                  {snake.priceInCents > 0 ? `$${(snake.priceInCents / 100).toLocaleString()}` : '—'}
                </span>
              </td>
              <!-- Actions -->
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-1">
                  <a href={`/admin/snakes/${snake.id}/edit`} class="p-1.5 rounded text-on-surface/50 hover:text-on-surface hover:bg-surface-container-high transition-colors" aria-label={`Edit ${snake.name}`}>
                    <svg ...pencil icon 14px... />
                  </a>
                  <form method="POST" action={actions.deleteSnake}>
                    <input type="hidden" name="id" value={snake.id} />
                    <button type="submit" class="p-1.5 rounded text-on-surface/50 hover:text-red-400 hover:bg-red-400/10 transition-colors" aria-label={`Delete ${snake.name}`}>
                      <svg ...trash icon 14px... />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {snakesWithTraits.length === 0 && (
            <tr><td colspan="6" class="px-6 py-12 text-center text-on-surface/40 text-sm">No specimens yet.</td></tr>
          )}
        </tbody>
      </table>
      <!-- Footer -->
      <div class="bg-surface-container px-6 py-4">
        <p class="text-[10px] uppercase tracking-[1px] text-on-surface/60">Showing {snakesWithTraits.length} of {snakeCount} specimens</p>
      </div>
    </div>
  </div>
</AdminLayout>
```

Note: The delete action currently lives in `/admin/snakes/index.astro` via Astro Actions. Keep using `actions.deleteSnake` with a form POST — no raw `/admin/snakes/:id/delete` route needed. Use the existing pattern.

- [ ] **Step 3: Fix delete form to use Astro Actions syntax**

The delete should use `action={actions.deleteSnake}` with a hidden `id` input — same as the existing snakes list page. Copy that pattern.

- [ ] **Step 4: Verify dev server, check dashboard renders stat cards and table**

```bash
npm run dev
# Navigate to http://localhost:4321/admin
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/index.astro
git commit -m "feat: redesign admin dashboard — stat cards, inventory table with featured badges"
```

---

## Task 3: Snake List Page (`/admin/snakes`) — Match Dashboard Table Style

**Files:**
- Modify: `src/pages/admin/snakes/index.astro`

This page should use the same table design from Task 2. It also needs to support the delete action via Astro Actions.

- [ ] **Step 1: Read current snakes list page**

- [ ] **Step 2: Rewrite to use the same table structure as the dashboard**

Keep the same table HTML as Task 2 (copy-paste) but:
- Fetch ALL snakes (no `.limit(10)`)
- Use the `header-actions` slot for "New Specimen" button
- Rename `AdminLayout` title to "Inventory"
- Keep delete via `actions.deleteSnake` (existing pattern)

```astro
---
// src/pages/admin/snakes/index.astro
import AdminLayout from '../../../layouts/AdminLayout.astro';
import Chip from '../../../components/ui/Chip.astro';
import { actions } from 'astro:actions';
// ... same DB imports ...

const result = Astro.getActionResult(actions.deleteSnake);
// ... same queries as dashboard but no limit ...
---
<AdminLayout title="Inventory">
  <div slot="header-actions">
    <a href="/admin/snakes/new" class="bg-primary text-on-primary font-bold text-sm px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
      + New Specimen
    </a>
  </div>
  <!-- Same table structure as dashboard, no stat cards -->
</AdminLayout>
```

- [ ] **Step 3: Verify page loads, add/delete still works**

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/snakes/index.astro
git commit -m "feat: redesign snake inventory list to match dashboard table style"
```

---

## Task 4: Edit Specimen Form — 2-Column Layout + Featured Toggle

**Files:**
- Modify: `src/pages/admin/snakes/[id]/edit.astro`

### Layout

```
12-col grid (gap-8):
├── Left col (col-span-7): form card sections (scrollable)
│   ├── Genetic Profile card (name, slug, species — 2-col grid)
│   ├── Genotype Breakdown card (trait chips + add trait form)
│   ├── Narrative card (description textarea)
│   └── Metrics & Pricing card (price input + availability toggle + featured toggle)
└── Right col (col-span-5): media panel card (sticky)
    ├── Primary image preview
    ├── Thumbnail grid placeholder (4 slots)
    └── Upload zone
```

### Card section template

```astro
<section class="bg-surface-container-low rounded-lg shadow-[0px_0px_0px_1px_rgba(65,72,67,0.1)] p-8 flex flex-col gap-6">
  <div class="flex items-center gap-2">
    <svg ...section icon... class="w-3 h-3 text-primary" />
    <p class="text-primary text-xs uppercase tracking-[1.8px] font-normal">Section Label</p>
  </div>
  <!-- content -->
</section>
```

### Availability toggle (2-button segmented control, not checkbox)

```astro
<div class="flex rounded-md overflow-hidden border border-outline-variant/20">
  <button type="button" id="status-available"
    class:list={['status-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors',
      snake.available ? 'bg-primary/10 text-primary shadow-[0px_0px_0px_1px_rgba(158,209,189,0.3)]' : 'bg-surface-container-lowest text-on-surface/60'
    ]}
    onclick="document.getElementById('available-hidden').value='true'; updateStatus(this)">
    Available
  </button>
  <button type="button" id="status-sold"
    class:list={['status-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors',
      !snake.available ? 'bg-surface-container text-on-surface' : 'bg-surface-container-lowest text-on-surface/60'
    ]}
    onclick="document.getElementById('available-hidden').value='false'; updateStatus(this)">
    Sold
  </button>
  <input type="hidden" name="available" id="available-hidden" value={snake.available ? 'true' : 'false'} />
</div>
```

### Featured toggle (iOS-style switch)

```astro
<div class="flex items-center justify-between pt-6 mt-2 bg-surface-container rounded-lg px-4 py-4">
  <div>
    <p class="text-xs uppercase tracking-[0.6px] text-on-surface font-medium mb-1">Featured Specimen</p>
    <p class="text-on-surface/60 text-[10px]">Highlight this specimen on the public landing page gallery.</p>
  </div>
  <label class="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" name="featured" value="true" class="sr-only peer" checked={snake.featured} />
    <div class="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary/40 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-on-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:bg-primary"></div>
  </label>
</div>
```

### Media panel (right column, sticky)

```astro
<div class="col-span-5 sticky top-4">
  <section class="bg-surface-container-low rounded-lg shadow-[0px_0px_0px_1px_rgba(65,72,67,0.1)] p-8 flex flex-col gap-6">
    <div class="flex items-center gap-2">
      <p class="text-primary text-xs uppercase tracking-[1.8px]">Specimen Gallery</p>
    </div>
    <!-- Main preview -->
    <div class="rounded bg-surface-container-lowest aspect-video overflow-hidden shadow-[0px_0px_0px_1px_rgba(65,72,67,0.1)]">
      {snake.primaryImageKey
        ? <img src={`/api/r2/image?key=${encodeURIComponent(snake.primaryImageKey)}`} alt={snake.name} class="w-full h-full object-cover" />
        : <div class="w-full h-full flex items-center justify-center"><img src="/placeholder-snake.svg" alt="" class="w-32 opacity-20" /></div>
      }
    </div>
    <!-- Upload zone -->
    <div class="bg-surface-container-lowest rounded border border-outline-variant/15 flex items-center justify-between px-4 py-4">
      <div class="flex items-center gap-3">
        <svg ...upload icon... class="w-5 h-4 text-on-surface/50" />
        <div>
          <p class="text-on-surface text-xs font-bold uppercase tracking-wide">Drag & Drop</p>
          <p class="text-on-surface/60 text-[10px]">Max size: 10MB</p>
        </div>
      </div>
      <a href="/admin/media" class="text-primary text-[10px] uppercase tracking-[1px] font-bold hover:text-primary/80 transition-colors">Browse</a>
    </div>
    <!-- R2 key display if set -->
    {snake.primaryImageKey && (
      <div class="text-[10px] text-on-surface/40 font-mono break-all">{snake.primaryImageKey}</div>
    )}
  </section>
</div>
```

### Page header (before grid)

```astro
<div class="flex items-end justify-between mb-10">
  <div>
    <div class="bg-secondary-container/30 inline-flex px-2 py-1 rounded-sm mb-3">
      <span class="text-primary text-[10px] font-bold uppercase tracking-[2px]">Specimen Management</span>
    </div>
    <h1 class="font-noto-serif text-on-surface text-5xl font-bold tracking-tight mb-3">Edit Specimen</h1>
    <p class="text-on-surface/70 text-base">Update genetic traits, pricing, and visibility for this specimen.</p>
  </div>
  <div class="flex items-center gap-3">
    <a href="/admin/snakes" class="bg-surface-container text-on-surface font-medium text-sm px-6 py-[10px] rounded-md hover:bg-surface-container-high transition-colors">
      Cancel
    </a>
    <button type="submit" form="snake-edit-form" class="bg-tertiary text-on-tertiary font-bold text-sm px-6 py-[10px] rounded-md hover:bg-tertiary/90 transition-colors">
      Save Changes
    </button>
  </div>
</div>
```

Note: The Save button is `bg-tertiary` (gold) — the only place in admin where gold is used. This matches the Figma "Save Changes" button which represents a final conversion action.

### Delete action (bottom, outside grid)

```astro
<div class="mt-8 pt-2 flex justify-end">
  <form method="POST" action={actions.deleteSnake}>
    <input type="hidden" name="id" value={snake.id} />
    <button type="submit" class="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-[1.2px] hover:text-red-400/70 transition-colors">
      <svg ...trash icon... />
      Remove Specimen Record
    </button>
  </form>
</div>
```

Note: Use `text-red-400` — no `--color-error` token is defined in this project's design system.

- [ ] **Step 1: Read current edit.astro in full**

- [ ] **Step 2: Rewrite edit.astro with the 2-column layout**

Preserve ALL existing:
- Frontmatter DB queries (snake + traits)
- Action result handling (`getActionResult`)
- Form `id="snake-edit-form"` attribute on the `<form>`
- All hidden inputs for the `updateSnake` action
- Trait form uses `actions.addTrait` / `actions.deleteTrait`

Trait chips in the new design:
```astro
<!-- Genotype Breakdown card -->
<div class="flex flex-wrap gap-2 items-center">
  {traits.map(trait => (
    <form method="POST" class="inline-flex">
      <input type="hidden" name="id" value={trait.id} />
      <button type="submit"
        formaction={actions.deleteTrait}
        class:list={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors',
          trait.type === 'dominant' ? 'bg-surface-container border border-outline-variant/20 text-on-surface' : '',
          trait.type === 'recessive' ? 'bg-tertiary-container/30 border border-tertiary/20 text-tertiary' : '',
          trait.type === 'codominant' ? 'bg-secondary-container/30 border border-primary/20 text-primary' : '',
        ]}
      >
        {trait.label} <span class="opacity-50 text-[10px]">×</span>
      </button>
    </form>
  ))}
  <!-- Add trait inline form -->
  <details class="relative">
    <summary class="border border-dashed border-outline-variant/40 text-on-surface/50 text-xs px-3 py-1.5 rounded-sm cursor-pointer hover:border-outline-variant/60 hover:text-on-surface/70 transition-colors list-none">
      + Add Tag
    </summary>
    <div class="absolute top-full left-0 mt-2 bg-surface-container-high rounded-md p-4 z-10 shadow-xl flex flex-col gap-3 min-w-[200px]">
      <form method="POST">
        <input type="hidden" name="snakeId" value={snake.id} />
        <input type="text" name="label" placeholder="e.g. Banana" class="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md mb-2 focus:outline-none focus:border-primary/50" required />
        <select name="type" class="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md mb-3 focus:outline-none focus:border-primary/50">
          <option value="dominant">Dominant</option>
          <option value="recessive">Recessive</option>
          <option value="codominant">Co-Dominant</option>
        </select>
        <button type="submit" formaction={actions.addTrait} class="w-full bg-primary text-on-primary text-xs font-bold py-2 rounded-md">
          Add
        </button>
      </form>
    </div>
  </details>
</div>
```

- [ ] **Step 3: Add inline JS for availability toggle state**

```html
<script>
  function updateStatus(activeBtn) {
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.classList.remove('bg-primary/10', 'text-primary');
      btn.classList.add('bg-surface-container-lowest', 'text-on-surface/60');
    });
    activeBtn.classList.add('bg-primary/10', 'text-primary');
    activeBtn.classList.remove('bg-surface-container-lowest', 'text-on-surface/60');
  }
</script>
```

- [ ] **Step 4: Verify form submits correctly (save changes, add/remove traits all work)**

```bash
npm run dev
# Test: edit a snake, change available/featured, add/remove traits
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/snakes/[id]/edit.astro
git commit -m "feat: redesign edit form — 2-col layout, featured toggle, availability segmented control"
```

---

## Task 5: Create Specimen Form — Card Sections

**Files:**
- Modify: `src/pages/admin/snakes/new.astro`

Same card-section aesthetic as the edit form, but single-column (no media panel on create — snake has no image yet).

### Layout

```
Single column, max-w-2xl, flex flex-col gap-6
├── Page header (eyebrow + H1 + Cancel button)
├── Genetic Profile card (name + slug 2-col, species, auto-slug JS)
├── Narrative card (description textarea)
└── Metrics & Pricing card (price + availability toggle + featured toggle + Submit)
```

### Auto-slug generation (client-side JS)

```html
<script>
  const nameInput = document.getElementById('name-input');
  const slugInput = document.getElementById('slug-input');
  let userEditedSlug = false;

  slugInput.addEventListener('input', () => { userEditedSlug = true; });
  nameInput.addEventListener('input', () => {
    if (userEditedSlug) return;
    slugInput.value = nameInput.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  });
</script>
```

- [ ] **Step 1: Read current new.astro**

- [ ] **Step 2: Rewrite with card sections + auto-slug**

Keep `actions.createSnake` and error handling. Apply the same card template from Task 4.

- [ ] **Step 3: Verify form creates a snake correctly**

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/snakes/new.astro
git commit -m "feat: redesign create form — card sections, auto-slug generation"
```

---

## Task 6: Media Upload — Image Preview + Copy Key

**Files:**
- Modify: `src/pages/admin/media/index.astro`

### Changes

1. After successful upload, show the image using `/api/r2/image?key=...`
2. Add a copy-to-clipboard button for the R2 key
3. Improve upload form styling to match the drag-and-drop zone from Figma

```astro
<!-- Success state -->
{uploadedKey && (
  <div class="bg-surface-container-low rounded-lg p-6 border border-outline-variant/5 mb-8">
    <div class="aspect-video max-w-sm rounded overflow-hidden mb-4 bg-surface-container-lowest">
      <img src={`/api/r2/image?key=${encodeURIComponent(uploadedKey)}`} alt="Uploaded" class="w-full h-full object-contain" />
    </div>
    <p class="text-primary text-xs uppercase tracking-[1.2px] font-bold mb-2">Upload successful — R2 Key</p>
    <div class="flex items-center gap-2">
      <code class="flex-1 bg-surface-container-lowest text-on-surface/60 font-mono text-xs px-3 py-2 rounded break-all">{uploadedKey}</code>
      <button
        onclick={`navigator.clipboard.writeText('${uploadedKey}').then(() => this.textContent = 'Copied!')`}
        class="shrink-0 text-primary text-xs font-bold uppercase tracking-[1px] hover:text-primary/80 transition-colors px-2"
      >
        Copy
      </button>
    </div>
    <p class="text-on-surface/40 text-xs mt-2">Paste this key into a specimen's image field.</p>
  </div>
)}

<!-- Upload zone -->
<div class="bg-surface-container-low rounded-lg shadow-[0px_0px_0px_1px_rgba(65,72,67,0.1)] p-8">
  <form method="POST" enctype="multipart/form-data">
    <div class="bg-surface-container-lowest rounded-md border border-outline-variant/15 flex items-center justify-between px-4 py-5 mb-4">
      <div class="flex items-center gap-3">
        <svg ...upload icon... class="w-5 h-4 text-on-surface/50" />
        <div>
          <p class="text-on-surface text-xs font-bold uppercase tracking-wide">Select Image</p>
          <p class="text-on-surface/50 text-[10px]">Max size: 10MB · JPG, PNG, WebP</p>
        </div>
      </div>
      <input type="file" name="file" accept="image/*" required class="..." />
    </div>
    <button type="submit" class="bg-primary text-on-primary font-bold text-sm px-6 py-3 rounded-md hover:bg-primary/90 transition-colors w-full">
      Upload
    </button>
  </form>
</div>
```

- [ ] **Step 1: Read current media/index.astro**

- [ ] **Step 2: Rewrite with image preview and copy button**

- [ ] **Step 3: Verify upload works, preview loads, copy button works**

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/media/index.astro
git commit -m "feat: improve media upload — image preview and copy-to-clipboard for R2 key"
```

---

## Task 7: Update CLAUDE.md with Admin Figma Node IDs

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add admin node IDs to Figma MCP section**

```markdown
Admin screens (Admin canvas):
| Screen | Node ID |
|---|---|
| Admin Dashboard | `3:882` |
| Edit Specimen | `3:180` |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add admin Figma node IDs to CLAUDE.md"
```

---

---

## Task 8: DB Schema — Add Missing Specimen Fields

**Files:**
- Modify: `src/db/schema.ts`
- Run: `npm run db:generate` then `npm run db:migrate`

### New columns on `snakes` table

```typescript
// Add to the snakes sqliteTable definition:
sex: text('sex'),                             // 'male' | 'female' | null
hatchDate: text('hatch_date'),                // ISO date string e.g. '2024-06-15' | null
personality: text('personality'),             // free text | null
feedingNotes: text('feeding_notes'),          // free text | null
diet: text('diet'),                           // short text e.g. 'Frozen/thawed mice' | null
shedFrequency: text('shed_frequency'),        // short text e.g. 'Every 4–6 weeks' | null
temperature: text('temperature'),             // short text e.g. '88°F / 78°F' | null
humidity: text('humidity'),                   // short text e.g. '50–60%' | null
weightGrams: integer('weight_grams'),         // integer grams | null
complementaryGenetics: text('complementary_genetics'), // free text | null
status: text('status'),                       // 'available' | 'reserved' | 'sold' | null
```

All new columns are nullable — no default needed (SQLite will store NULL for existing rows).

### Migration notes

After running `npm run db:generate`, also create a manual backfill migration or run via Wrangler:
```sql
-- backfill status from available boolean
UPDATE snakes SET status = CASE WHEN available = 1 THEN 'available' ELSE 'sold' END WHERE status IS NULL;
```

Add this SQL at the bottom of the generated migration file (after the ALTER TABLE statements).

- [ ] **Step 1: Read `src/db/schema.ts` to see the current snakes table definition**

- [ ] **Step 2: Add the 11 new columns to the `snakes` sqliteTable**

Maintain correct column order (after `primaryImageKey`, before `createdAt`):

```typescript
sex: text('sex'),
hatchDate: text('hatch_date'),
personality: text('personality'),
feedingNotes: text('feeding_notes'),
diet: text('diet'),
shedFrequency: text('shed_frequency'),
temperature: text('temperature'),
humidity: text('humidity'),
weightGrams: integer('weight_grams'),
complementaryGenetics: text('complementary_genetics'),
status: text('status'),
```

- [ ] **Step 3: Run `npm run db:generate`**

```bash
npm run db:generate
```

Check the generated migration in `src/db/migrations/` — it should contain 11 `ALTER TABLE snakes ADD COLUMN` statements.

- [ ] **Step 4: Add backfill SQL to the generated migration**

Open the new migration file and append at the end:
```sql
UPDATE snakes SET status = CASE WHEN available = 1 THEN 'available' ELSE 'sold' END WHERE status IS NULL;
```

- [ ] **Step 5: Run `npm run db:migrate`**

```bash
npm run db:migrate
```

- [ ] **Step 6: Verify the dev server still starts without errors**

```bash
npm run dev
```

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat: add sex, hatchDate, personality, feeding, weight, status columns to snakes"
```

---

## Task 9: Update Astro Actions — New Fields + 3-State Status

**Files:**
- Modify: `src/actions/index.ts`

### Changes to `updateSnake`

Add all new fields to the Zod input schema and persist them in the handler. When `status` is set, also sync `available` boolean.

```typescript
updateSnake: defineAction({
  accept: 'form',
  input: z.object({
    id: z.string(),
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    species: z.string().min(1),
    description: z.string().default(''),
    priceInCents: z.coerce.number().int().min(0).default(0),
    available: z.coerce.boolean().default(false),
    featured: z.coerce.boolean().default(false),
    primaryImageKey: z.string().optional().transform(v => v?.trim() || undefined),
    // New fields — all optional
    status: z.enum(['available', 'reserved', 'sold']).optional(),
    sex: z.string().optional().transform(v => v?.trim() || undefined),
    hatchDate: z.string().optional().transform(v => v?.trim() || undefined),
    personality: z.string().optional().transform(v => v?.trim() || undefined),
    feedingNotes: z.string().optional().transform(v => v?.trim() || undefined),
    diet: z.string().optional().transform(v => v?.trim() || undefined),
    shedFrequency: z.string().optional().transform(v => v?.trim() || undefined),
    temperature: z.string().optional().transform(v => v?.trim() || undefined),
    humidity: z.string().optional().transform(v => v?.trim() || undefined),
    weightGrams: z.coerce.number().int().min(0).optional().transform(v => v || undefined),
    complementaryGenetics: z.string().optional().transform(v => v?.trim() || undefined),
  }),
  handler: async ({ id, primaryImageKey, status, ...data }) => {
    const db = getDb();
    // If status is provided, sync the available boolean
    const availableSync = status ? { available: status === 'available' } : {};
    await db.update(snakes).set({
      ...data,
      ...availableSync,
      primaryImageKey: primaryImageKey ?? null,
      status: status ?? null,
      sex: data.sex ?? null,
      hatchDate: data.hatchDate ?? null,
      personality: data.personality ?? null,
      feedingNotes: data.feedingNotes ?? null,
      diet: data.diet ?? null,
      shedFrequency: data.shedFrequency ?? null,
      temperature: data.temperature ?? null,
      humidity: data.humidity ?? null,
      weightGrams: data.weightGrams ?? null,
      complementaryGenetics: data.complementaryGenetics ?? null,
      updatedAt: new Date(),
    }).where(eq(snakes.id, id));
    return { success: true };
  },
}),
```

### Changes to `createSnake`

Add the same new optional fields. They're all nullable, so `undefined` values just won't be set (SQLite defaults to NULL).

```typescript
createSnake: defineAction({
  accept: 'form',
  input: z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
    species: z.string().min(1, 'Species is required'),
    description: z.string().default(''),
    priceInCents: z.coerce.number().int().min(0).default(0),
    available: z.coerce.boolean().default(false),
    featured: z.coerce.boolean().default(false),
    // New optional fields
    status: z.enum(['available', 'reserved', 'sold']).optional(),
    sex: z.string().optional().transform(v => v?.trim() || undefined),
    hatchDate: z.string().optional().transform(v => v?.trim() || undefined),
    personality: z.string().optional().transform(v => v?.trim() || undefined),
    weightGrams: z.coerce.number().int().min(0).optional().transform(v => v || undefined),
  }),
  handler: async ({ status, ...input }) => {
    const db = getDb();
    const availableSync = status ? { available: status === 'available' } : {};
    const [snake] = await db.insert(snakes).values({
      ...input,
      ...availableSync,
      status: status ?? null,
      sex: input.sex ?? null,
      hatchDate: input.hatchDate ?? null,
      personality: input.personality ?? null,
      weightGrams: input.weightGrams ?? null,
    }).returning();
    return { snake };
  },
}),
```

- [ ] **Step 1: Read `src/actions/index.ts`**

- [ ] **Step 2: Update `updateSnake` action with all new fields**

- [ ] **Step 3: Update `createSnake` action with new optional fields**

- [ ] **Step 4: Verify the dev server starts without TypeScript errors**

```bash
npm run dev
```

- [ ] **Step 5: Commit**

```bash
git add src/actions/index.ts
git commit -m "feat: extend updateSnake and createSnake actions with sex, hatchDate, personality, feeding, weight, status"
```

---

## Task 10: Edit Form — Add Missing Figma Sections

**Files:**
- Modify: `src/pages/admin/snakes/[id]/edit.astro`

This is the most involved task. Read the current file carefully before making changes — preserve all working functionality (trait chips, media panel, delete form, etc.). This task adds 5 new sections and modifies 2 existing ones.

### Changes to existing cards

#### Genetic Profile card — add Sex + Hatch Date

After the species row, add a 2-col grid row with Sex (segmented control) and Hatch Date (date input):

```astro
<!-- Sex segmented control -->
<div class="flex flex-col gap-2">
  <fieldset>
    <legend class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium mb-2">Sex</legend>
    <div class="flex rounded-md overflow-hidden border border-outline-variant/20">
      <button type="button" id="sex-male"
        class:list={['sex-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors',
          snake.sex === 'male' ? 'bg-primary/10 text-primary' : 'bg-surface-container-lowest text-on-surface/60'
        ]}
        onclick="updateSex('male')">
        Male
      </button>
      <button type="button" id="sex-female"
        class:list={['sex-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors',
          snake.sex === 'female' ? 'bg-primary/10 text-primary' : 'bg-surface-container-lowest text-on-surface/60'
        ]}
        onclick="updateSex('female')">
        Female
      </button>
    </div>
    <input type="hidden" name="sex" id="sex-hidden" value={snake.sex ?? ''} />
  </fieldset>
</div>

<!-- Hatch Date -->
<div class="flex flex-col gap-2">
  <label for="hatch-date" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Hatch Date</label>
  <input
    type="date"
    id="hatch-date"
    name="hatchDate"
    value={snake.hatchDate ?? ''}
    class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50"
  />
</div>
```

#### Metrics & Pricing card — add Weight + 3-button Availability

Add Weight field before the availability control:

```astro
<!-- Weight (Grams) -->
<div class="flex flex-col gap-2">
  <label for="weight-grams" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Weight (Grams)</label>
  <input
    type="number"
    id="weight-grams"
    name="weightGrams"
    value={snake.weightGrams ?? ''}
    min="0"
    placeholder="e.g. 450"
    class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50"
  />
</div>
```

Update Availability from 2-button to 3-button (Available / Reserved / Sold):

```astro
<fieldset>
  <legend class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium mb-2">Availability</legend>
  <div class="flex rounded-md overflow-hidden border border-outline-variant/20">
    <button type="button" id="status-available" aria-pressed={snake.status === 'available' || (!snake.status && snake.available)}
      class:list={['status-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors',
        (snake.status === 'available' || (!snake.status && snake.available))
          ? 'bg-primary/10 text-primary shadow-[0px_0px_0px_1px_rgba(158,209,189,0.3)]'
          : 'bg-surface-container-lowest text-on-surface/60'
      ]}
      onclick="updateStatus(this, false)">
      Available
    </button>
    <button type="button" id="status-reserved" aria-pressed={snake.status === 'reserved'}
      class:list={['status-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors',
        snake.status === 'reserved'
          ? 'bg-secondary-container/30 text-secondary shadow-[0px_0px_0px_1px_rgba(100,120,110,0.3)]'
          : 'bg-surface-container-lowest text-on-surface/60'
      ]}
      onclick="updateStatus(this, false, 'reserved')">
      Reserved
    </button>
    <button type="button" id="status-sold" aria-pressed={snake.status === 'sold' || (!snake.status && !snake.available)}
      class:list={['status-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors',
        (snake.status === 'sold' || (!snake.status && !snake.available))
          ? 'bg-surface-container text-on-surface'
          : 'bg-surface-container-lowest text-on-surface/60'
      ]}
      onclick="updateStatus(this, true)">
      Sold
    </button>
  </div>
  <input type="hidden" name="status" id="status-hidden" value={snake.status ?? (snake.available ? 'available' : 'sold')} />
  <!-- Keep available hidden input for backwards compatibility; updated by JS -->
  <input type="hidden" name="available" id="available-hidden" value={snake.available ? 'true' : 'false'} />
</fieldset>
```

Update `updateStatus` JS to handle 3 states and the reserved button:

```html
<script is:inline>
  function updateStatus(activeBtn, isSoldVariant, forceStatus) {
    const statusHidden = document.getElementById('status-hidden');
    const availableHidden = document.getElementById('available-hidden');
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.classList.remove(
        'bg-primary/10', 'text-primary',
        'bg-secondary-container/30', 'text-secondary',
        'bg-surface-container', 'text-on-surface',
        'shadow-[0px_0px_0px_1px_rgba(158,209,189,0.3)]',
        'shadow-[0px_0px_0px_1px_rgba(100,120,110,0.3)]'
      );
      btn.classList.add('bg-surface-container-lowest', 'text-on-surface/60');
      btn.setAttribute('aria-pressed', 'false');
    });
    activeBtn.classList.remove('bg-surface-container-lowest', 'text-on-surface/60');
    activeBtn.setAttribute('aria-pressed', 'true');
    const id = activeBtn.id;
    if (id === 'status-available') {
      activeBtn.classList.add('bg-primary/10', 'text-primary', 'shadow-[0px_0px_0px_1px_rgba(158,209,189,0.3)]');
      statusHidden.value = 'available';
      availableHidden.value = 'true';
    } else if (id === 'status-reserved') {
      activeBtn.classList.add('bg-secondary-container/30', 'text-secondary', 'shadow-[0px_0px_0px_1px_rgba(100,120,110,0.3)]');
      statusHidden.value = 'reserved';
      availableHidden.value = 'false';
    } else {
      activeBtn.classList.add('bg-surface-container', 'text-on-surface');
      statusHidden.value = 'sold';
      availableHidden.value = 'false';
    }
  }
  function updateSex(value) {
    document.getElementById('sex-hidden').value = value;
    document.querySelectorAll('.sex-btn').forEach(btn => {
      btn.classList.remove('bg-primary/10', 'text-primary');
      btn.classList.add('bg-surface-container-lowest', 'text-on-surface/60');
    });
    const activeId = value === 'male' ? 'sex-male' : 'sex-female';
    const activeBtn = document.getElementById(activeId);
    activeBtn.classList.remove('bg-surface-container-lowest', 'text-on-surface/60');
    activeBtn.classList.add('bg-primary/10', 'text-primary');
  }
</script>
```

### New card: Personality & Temperament

Insert after Genotype Breakdown card, before Narrative card. Replace existing "Narrative" card (which mapped to `description`) — keep Narrative card for the species description, add this as a separate card for personality.

Actually: keep the existing Narrative card (`description` field) as-is. Add a new Personality & Temperament card that maps to the new `personality` column.

```astro
<section class="bg-surface-container-low rounded-lg shadow-[0px_0px_0px_1px_rgba(65,72,67,0.1)] p-8 flex flex-col gap-6">
  <div class="flex items-center gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <p class="text-primary text-xs uppercase tracking-[1.8px] font-normal">Personality & Temperament</p>
  </div>
  <div class="flex flex-col gap-2">
    <label for="personality" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Personality Notes</label>
    <textarea
      id="personality"
      name="personality"
      rows="4"
      placeholder="Describe the specimen's handling temperament, disposition, and notable behavioral traits..."
      class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md resize-none focus:outline-none focus:border-primary/50"
    >{snake.personality ?? ''}</textarea>
  </div>
</section>
```

### New card: Health & Feeding Habits

Insert after Personality & Temperament card.

```astro
<section class="bg-surface-container-low rounded-lg shadow-[0px_0px_0px_1px_rgba(65,72,67,0.1)] p-8 flex flex-col gap-6">
  <div class="flex items-center gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
      <path d="M4.5 9.5V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v4.5M2 19h20M12 3v4M8 7h8"/>
    </svg>
    <p class="text-primary text-xs uppercase tracking-[1.8px] font-normal">Health & Feeding Habits</p>
  </div>
  <!-- General feeding notes textarea -->
  <div class="flex flex-col gap-2">
    <label for="feeding-notes" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Feeding Notes</label>
    <textarea
      id="feeding-notes"
      name="feedingNotes"
      rows="3"
      placeholder="Feeding history, prey preference, feeding response..."
      class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md resize-none focus:outline-none focus:border-primary/50"
    >{snake.feedingNotes ?? ''}</textarea>
  </div>
  <!-- 2-col grid: Diet / Shed Frequency / Temperature / Humidity -->
  <div class="grid grid-cols-2 gap-4">
    <div class="flex flex-col gap-2">
      <label for="diet" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Diet</label>
      <input
        type="text"
        id="diet"
        name="diet"
        value={snake.diet ?? ''}
        placeholder="e.g. Frozen/thawed mice"
        class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50"
      />
    </div>
    <div class="flex flex-col gap-2">
      <label for="shed-frequency" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Shed Frequency</label>
      <input
        type="text"
        id="shed-frequency"
        name="shedFrequency"
        value={snake.shedFrequency ?? ''}
        placeholder="e.g. Every 4–6 weeks"
        class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50"
      />
    </div>
    <div class="flex flex-col gap-2">
      <label for="temperature" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Temperature</label>
      <input
        type="text"
        id="temperature"
        name="temperature"
        value={snake.temperature ?? ''}
        placeholder="e.g. 88°F hot / 78°F cool"
        class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50"
      />
    </div>
    <div class="flex flex-col gap-2">
      <label for="humidity" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Humidity</label>
      <input
        type="text"
        id="humidity"
        name="humidity"
        value={snake.humidity ?? ''}
        placeholder="e.g. 50–60%"
        class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50"
      />
    </div>
  </div>
</section>
```

### New card: Complementary Genetics

Insert after the Narrative card (before Metrics & Pricing).

```astro
<section class="bg-surface-container-low rounded-lg shadow-[0px_0px_0px_1px_rgba(65,72,67,0.1)] p-8 flex flex-col gap-6">
  <div class="flex items-center gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
      <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1"/>
    </svg>
    <p class="text-primary text-xs uppercase tracking-[1.8px] font-normal">Complementary Genetics</p>
  </div>
  <p class="text-on-surface/60 text-xs leading-relaxed">
    Reference specimens with complementary genetics that pair well with this specimen.
  </p>
  <div class="flex flex-col gap-2">
    <label for="complementary-genetics" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">
      Related Specimen Slugs or Notes
    </label>
    <textarea
      id="complementary-genetics"
      name="complementaryGenetics"
      rows="3"
      placeholder="e.g. banana-lesser-ball-python, pastel-spider-female (comma-separated slugs or notes)"
      class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md resize-none focus:outline-none focus:border-primary/50"
    >{snake.complementaryGenetics ?? ''}</textarea>
  </div>
</section>
```

### Final card order in left column

1. Genetic Profile (name, slug, species, sex, hatchDate)
2. Genotype Breakdown (trait chips)
3. Personality & Temperament (personality textarea)
4. Health & Feeding Habits (feedingNotes + diet/shedFrequency/temperature/humidity grid)
5. Narrative (description — existing)
6. Complementary Genetics (complementaryGenetics textarea)
7. Metrics & Pricing (weightGrams, 3-button status, featured toggle)

- [ ] **Step 1: Read the current `src/pages/admin/snakes/[id]/edit.astro` in full**

- [ ] **Step 2: Add sex + hatchDate to Genetic Profile card**

Insert after the species row (which is already a 2-col or 1-col row). Add a new 2-col grid row with Sex segmented control and Hatch Date date input.

- [ ] **Step 3: Add Personality & Temperament card**

Insert new `<section>` card after the Genotype Breakdown card.

- [ ] **Step 4: Add Health & Feeding Habits card**

Insert new `<section>` card after the Personality & Temperament card.

- [ ] **Step 5: Add Complementary Genetics card**

Insert new `<section>` card after the existing Narrative (description) card.

- [ ] **Step 6: Update Metrics & Pricing card**

Add `weightGrams` input field. Update availability from 2-button to 3-button (Available / Reserved / Sold) using `status` hidden input.

- [ ] **Step 7: Update `updateStatus` JS to handle 3 states + add `updateSex` function**

Replace the existing `<script is:inline>` block with the updated version from this spec.

- [ ] **Step 8: Verify all cards render and form saves correctly**

```bash
npm run dev
# Edit an existing snake:
# - Set sex, hatch date → save → reload → values should persist
# - Set personality → save → reload → value should persist
# - Set feeding notes + diet + shed freq + temp + humidity → save → reload → persist
# - Set complementary genetics → save → persist
# - Set weight → save → persist
# - Click Reserved → save → reload → Reserved button should be active
```

- [ ] **Step 9: Commit**

```bash
git add src/pages/admin/snakes/[id]/edit.astro
git commit -m "feat: add sex, hatchDate, personality, health/feeding, complementaryGenetics, weight, 3-state availability to edit form"
```

---

## Task 11: Create Form — Add New Fields

**Files:**
- Modify: `src/pages/admin/snakes/new.astro`

Add the relevant subset of new fields to the create form. Skip feeding sub-fields (diet, shedFrequency, temperature, humidity, feedingNotes) and complementaryGenetics — those are better filled after creation. Include: sex, hatchDate, personality, weightGrams, status (3-button).

### Changes

**Genetic Profile card:** Add Sex segmented control + Hatch Date (same markup as edit form, but default to empty).

```astro
<!-- Sex segmented control (defaults to no selection) -->
<div class="flex flex-col gap-2">
  <fieldset>
    <legend class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium mb-2">Sex</legend>
    <div class="flex rounded-md overflow-hidden border border-outline-variant/20">
      <button type="button" id="sex-male" class="sex-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors bg-surface-container-lowest text-on-surface/60"
        onclick="updateSex('male')">Male</button>
      <button type="button" id="sex-female" class="sex-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors bg-surface-container-lowest text-on-surface/60"
        onclick="updateSex('female')">Female</button>
    </div>
    <input type="hidden" name="sex" id="sex-hidden" value="" />
  </fieldset>
</div>

<!-- Hatch Date -->
<div class="flex flex-col gap-2">
  <label for="hatch-date" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Hatch Date</label>
  <input type="date" id="hatch-date" name="hatchDate" value=""
    class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50" />
</div>
```

**Add Personality & Temperament card** (same textarea as edit form, after Genetic Profile card):

```astro
<section class="bg-surface-container-low rounded-lg shadow-[0px_0px_0px_1px_rgba(65,72,67,0.1)] p-8 flex flex-col gap-6">
  <div class="flex items-center gap-2">
    <p class="text-primary text-xs uppercase tracking-[1.8px]">Personality & Temperament</p>
  </div>
  <div class="flex flex-col gap-2">
    <label for="personality" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Personality Notes</label>
    <textarea id="personality" name="personality" rows="4"
      placeholder="Handling temperament, disposition, behavioral traits..."
      class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md resize-none focus:outline-none focus:border-primary/50"></textarea>
  </div>
</section>
```

**Metrics & Pricing card:** Add Weight + update to 3-button status (same markup as edit form with empty defaults).

```astro
<!-- Weight (Grams) -->
<div class="flex flex-col gap-2">
  <label for="weight-grams" class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium">Weight (Grams)</label>
  <input type="number" id="weight-grams" name="weightGrams" value="" min="0" placeholder="e.g. 450"
    class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50" />
</div>

<!-- 3-button Status -->
<fieldset>
  <legend class="text-[10px] uppercase tracking-[1px] text-on-surface/60 font-medium mb-2">Availability</legend>
  <div class="flex rounded-md overflow-hidden border border-outline-variant/20">
    <button type="button" id="status-available" aria-pressed="true"
      class="status-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors bg-primary/10 text-primary shadow-[0px_0px_0px_1px_rgba(158,209,189,0.3)]"
      onclick="updateStatus(this, false)">Available</button>
    <button type="button" id="status-reserved" aria-pressed="false"
      class="status-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors bg-surface-container-lowest text-on-surface/60"
      onclick="updateStatus(this, false, 'reserved')">Reserved</button>
    <button type="button" id="status-sold" aria-pressed="false"
      class="status-btn flex-1 py-3 text-[10px] font-bold uppercase tracking-[1px] transition-colors bg-surface-container-lowest text-on-surface/60"
      onclick="updateStatus(this, true)">Sold</button>
  </div>
  <input type="hidden" name="status" id="status-hidden" value="available" />
  <input type="hidden" name="available" id="available-hidden" value="true" />
</fieldset>
```

**Update JS block** to include `updateSex` + updated `updateStatus` (same as edit form).

- [ ] **Step 1: Read current `src/pages/admin/snakes/new.astro`**

- [ ] **Step 2: Add sex + hatchDate to Genetic Profile card**

- [ ] **Step 3: Add Personality & Temperament card after Genetic Profile card**

- [ ] **Step 4: Add weight to Metrics card + update availability to 3-button**

- [ ] **Step 5: Update `<script is:inline>` with `updateSex` + 3-state `updateStatus`**

- [ ] **Step 6: Verify create form — submit a new snake with sex, hatchDate, personality, weight, status**

```bash
npm run dev
# Create a new snake, set all new fields, verify they appear on the edit form after creation
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/snakes/new.astro
git commit -m "feat: add sex, hatchDate, personality, weight, 3-state availability to create form"
```

---

## Verification Checklist

After all tasks complete (Tasks 1–11):

- [ ] AdminLayout sidebar shows brand block, active nav states, "New Specimen" CTA
- [ ] Dashboard renders 3 stat cards with live DB counts
- [ ] Dashboard inventory table shows thumbnails, featured badges, trait chips, status dots, gold prices
- [ ] Edit form uses 2-column layout (7+5), card sections, working featured toggle (persists to DB)
- [ ] Availability shows 3 buttons (Available / Reserved / Sold), status persists via `actions.updateSnake`
- [ ] Sex segmented control persists (Male / Female / empty)
- [ ] Hatch Date persists as ISO date string
- [ ] Personality & Temperament card textarea persists
- [ ] Health & Feeding Habits card (notes + diet + shed freq + temp + humidity) all persist
- [ ] Weight (Grams) persists
- [ ] Complementary Genetics textarea persists
- [ ] Trait chips have × delete and inline "Add Tag" form — both still functional
- [ ] Create form has auto-slug generation + new fields (sex, hatchDate, personality, weight, status)
- [ ] Media upload shows image preview and copy button
- [ ] No hardcoded hex colors anywhere in new code
- [ ] Gold (`bg-tertiary`) used only on "Save Changes" button
- [ ] Dev server runs with no TS/build errors