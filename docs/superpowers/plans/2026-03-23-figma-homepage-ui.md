# Figma Homepage UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage and shared layout components to match the Figma Snake Project design (file key: `hluobF92AIfv489ZzBw1Cu`) with production-quality Astro code and demo images for DB-driven content.

**Architecture:** Update shared `Header` and `Footer` in `src/components/layout/`, rebuild `src/pages/index.astro` with 5 Figma sections (Hero, Featured Bento Grid, About, CTA, Footer), add `SnakeBentoCard` and `SnakeBentoGrid` components for the asymmetric card layout. Use existing design tokens from `global.css` — no hardcoded hex values. Demo images downloaded from Figma assets go in `public/demo/` as static fallbacks when snakes have no R2 image.

**Tech Stack:** Astro 6, Tailwind CSS v4 (tokens in `src/styles/global.css`), Noto Serif + Inter (Google Fonts), Cloudflare D1 via Drizzle ORM

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Delete | `src/components/Header.astro` | Old duplicate — not used by any page |
| Delete | `src/components/Footer.astro` | Old duplicate — not used by any page |
| Modify | `src/components/layout/Header.astro` | Figma nav: glassmorphism, Noto Serif links, no border |
| Modify | `src/components/layout/Footer.astro` | Figma footer: logo, two link columns |
| Modify | `src/pages/index.astro` | All 5 sections + new imports |
| Modify | `src/pages/snakes/index.astro` | Polish heading/padding to match design system |
| Create | `src/components/snakes/SnakeBentoCard.astro` | Three bento card variants (large/small/horizontal) |
| Create | `src/components/snakes/SnakeBentoGrid.astro` | Asymmetric 12-col bento layout |
| Create | `public/demo/*.jpg` | Demo images from Figma assets |

---

## Figma Reference

All sections are in file `hluobF92AIfv489ZzBw1Cu`, frame `3:2` (Landing Page):

| Section | Node ID | Key visual notes |
|---|---|---|
| Top Navigation | `3:167` | `bg-surface-container-low/60 backdrop-blur`, Noto Serif bold links, no border |
| Hero | `3:3` | Full-viewport, bg image right side, left-to-right gradient, 96px display heading mixed colors |
| Bento Grid | `3:21` | 12-col asymmetric: large(8)+small(4) row 1, small(4)+horizontal(8) row 2 |
| About Us | `3:119` | `bg-surface-container-low`, two-col, grayscale photo + gold stat overlay |
| CTA | `3:150` | `bg-surface` outer, dark rounded card, radial glow, gold+dark buttons |
| Footer | `3:93` | `bg-surface-container-low`, logo left, Pages+Social columns right |

**Demo image asset URLs** (valid ~7 days from 2026-03-23; re-fetch from Figma node IDs above if expired):
- Hero background: `https://www.figma.com/api/mcp/asset/3264bb3f-8987-44b7-a339-f70cbf37c372`
- About facility: `https://www.figma.com/api/mcp/asset/4310da3e-0e5e-4913-bab0-93283301e35f`
- Bento large card: `https://www.figma.com/api/mcp/asset/1eb87a95-cb87-4198-ae66-cbef445f5179`
- Bento small 1: `https://www.figma.com/api/mcp/asset/4160cbcd-ee1f-41a9-8f3b-567c375d4627`
- Bento small 2: `https://www.figma.com/api/mcp/asset/584c6149-794d-4fcd-aaf5-7f926b2571e6`
- Bento horizontal: `https://www.figma.com/api/mcp/asset/685d1aea-16a1-4196-a5e2-b2514087d645`

---

## Task 0: Download Demo Assets & Remove Duplicates

**Files:**
- Delete: `src/components/Header.astro`
- Delete: `src/components/Footer.astro`
- Create: `public/demo/hero-bg.jpg`
- Create: `public/demo/about-facility.jpg`
- Create: `public/demo/snake-palmetto.jpg`
- Create: `public/demo/snake-morph1.jpg`
- Create: `public/demo/snake-morph2.jpg`
- Create: `public/demo/snake-morph3.jpg`

- [ ] **Step 1: Create `public/demo/` and download Figma images**

```bash
mkdir -p public/demo
curl -L "https://www.figma.com/api/mcp/asset/3264bb3f-8987-44b7-a339-f70cbf37c372" -o public/demo/hero-bg.jpg
curl -L "https://www.figma.com/api/mcp/asset/4310da3e-0e5e-4913-bab0-93283301e35f" -o public/demo/about-facility.jpg
curl -L "https://www.figma.com/api/mcp/asset/1eb87a95-cb87-4198-ae66-cbef445f5179" -o public/demo/snake-palmetto.jpg
curl -L "https://www.figma.com/api/mcp/asset/4160cbcd-ee1f-41a9-8f3b-567c375d4627" -o public/demo/snake-morph1.jpg
curl -L "https://www.figma.com/api/mcp/asset/584c6149-794d-4fcd-aaf5-7f926b2571e6" -o public/demo/snake-morph2.jpg
curl -L "https://www.figma.com/api/mcp/asset/685d1aea-16a1-4196-a5e2-b2514087d645" -o public/demo/snake-morph3.jpg
```

- [ ] **Step 2: Verify downloads succeeded**

```bash
ls -lh public/demo/
```
Expected: 6 files, each ≥ 10KB. If any are tiny (< 5KB), the URL expired — re-fetch using the Figma node IDs listed in the reference table above via `mcp__plugin_figma_figma__get_design_context`.

- [ ] **Step 3: Remove old duplicate components**

```bash
git rm src/components/Header.astro src/components/Footer.astro
```

- [ ] **Step 4: Commit**

```bash
git add public/demo/
git commit -m "chore: add Figma demo assets, remove unused duplicate Header/Footer"
```

---

## Task 1: Redesign Header

**Figma:** `3:167` — glassmorphism nav bar, Noto Serif bold links, user icon button, **no** bottom border.

**Files:**
- Modify: `src/components/layout/Header.astro`

- [ ] **Step 1: Rewrite `src/components/layout/Header.astro`**

```astro
---
// src/components/layout/Header.astro
---
<header class="sticky top-0 z-50 bg-surface-container-low/60 backdrop-blur-md">
  <div class="max-w-[1280px] mx-auto px-8 h-[68px] flex items-center justify-between">
    <a href="/" class="font-noto-serif text-2xl text-on-surface font-bold tracking-tight shrink-0">
      The Serpent's Edge
    </a>
    <nav class="flex items-center gap-8">
      <a href="/snakes" class="font-noto-serif text-lg font-bold text-on-surface hover:text-primary transition-colors">Collection</a>
      <a href="/#about" class="font-noto-serif text-lg font-bold text-on-surface hover:text-primary transition-colors">About</a>
      <a href="/#contact" class="font-noto-serif text-lg font-bold text-on-surface hover:text-primary transition-colors">Contact</a>
    </nav>
    <a
      href="/admin"
      class="flex items-center justify-center w-9 h-9 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors"
      aria-label="Admin"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="8" r="4" />
        <path stroke-linecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </a>
  </div>
</header>
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Header.astro
git commit -m "feat: redesign header to match Figma — glassmorphism, Noto Serif links, no border"
```

---

## Task 2: Redesign Footer

**Figma:** `3:93` — `bg-surface-container-low`, no border, logo + copyright on left, two link columns (Pages + Social) on right.

**Files:**
- Modify: `src/components/layout/Footer.astro`

- [ ] **Step 1: Rewrite `src/components/layout/Footer.astro`**

```astro
---
// src/components/layout/Footer.astro
---
<footer class="bg-surface-container-low">
  <div class="max-w-[1280px] mx-auto px-8 py-12 flex items-start justify-between gap-8">
    <div class="flex flex-col gap-2">
      <p class="font-noto-serif text-on-surface font-bold text-xl">The Serpent's Edge</p>
      <p class="text-on-surface-variant text-xs tracking-[0.1em] uppercase">
        &copy; {new Date().getFullYear()} All rights reserved
      </p>
    </div>
    <div class="flex gap-12">
      <div class="flex flex-col gap-2">
        <p class="text-on-surface-variant text-xs uppercase tracking-[0.1em] font-semibold mb-1">Pages</p>
        <a href="/snakes" class="text-on-surface text-sm hover:text-primary transition-colors">Collection</a>
        <a href="/#about" class="text-on-surface text-sm hover:text-primary transition-colors">About</a>
        <a href="/#contact" class="text-on-surface text-sm hover:text-primary transition-colors">Contact</a>
      </div>
      <div class="flex flex-col gap-2">
        <p class="text-on-surface-variant text-xs uppercase tracking-[0.1em] font-semibold mb-1">Social</p>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="text-on-surface text-sm hover:text-primary transition-colors">Instagram</a>
        <a href="https://morphmarket.com" target="_blank" rel="noopener noreferrer" class="text-on-surface text-sm hover:text-primary transition-colors">MorphMarket</a>
      </div>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Footer.astro
git commit -m "feat: redesign footer — logo, Pages + Social link columns, no border"
```

---

## Task 3: Create SnakeBentoCard Component

**Figma:** Three card layouts from the bento grid (`3:21`):
- **large** — full-bleed image, gradient overlay, status chip + name bottom-left, price bottom-right
- **small** — square image top, text + ghost button panel below
- **horizontal** — half image / half text, price + icon-button bottom

The `fallbackImage` prop lets `SnakeBentoGrid` inject a demo image per slot position when a snake has no R2 key.

**Files:**
- Create: `src/components/snakes/SnakeBentoCard.astro`

- [ ] **Step 1: Create `src/components/snakes/SnakeBentoCard.astro`**

```astro
---
// src/components/snakes/SnakeBentoCard.astro
import type { Snake, TraitChip } from '../../db/schema';

interface Props {
  snake: Snake & { traits?: TraitChip[] };
  variant: 'large' | 'small' | 'horizontal';
  fallbackImage?: string;
}

const { snake, variant, fallbackImage = '/placeholder-snake.svg' } = Astro.props;

const imageUrl = snake.primaryImageKey
  ? `/api/r2/image?key=${encodeURIComponent(snake.primaryImageKey)}`
  : fallbackImage;

const price = snake.priceInCents > 0
  ? `$${(snake.priceInCents / 100).toLocaleString()}`
  : null;

const statusLabel = snake.available ? 'Available' : 'Sold';
// Use design tokens only — no hardcoded hex
const statusClass = snake.available
  ? 'bg-secondary-container text-primary'
  : 'bg-surface-container-highest/80 backdrop-blur-md text-on-surface-variant';
---

{variant === 'large' && (
  <a
    href={`/snakes/${snake.slug}`}
    class="relative bg-surface-container-low rounded overflow-hidden group block h-full"
    style="min-height: 500px;"
  >
    <div class="absolute inset-0">
      <img
        src={imageUrl}
        alt={snake.name}
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        loading="lazy"
        decoding="async"
      />
      <!-- Use surface token, not raw black, per design system rules -->
      <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-transparent"></div>
    </div>
    <div class="absolute bottom-6 left-6 right-6 flex items-end justify-between">
      <div class="flex flex-col gap-2">
        <div class="flex gap-2 flex-wrap">
          <span class={`${statusClass} text-[10px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full`}>
            {statusLabel}
          </span>
          {snake.species && (
            <span class="bg-surface-variant/60 backdrop-blur-md text-on-surface text-[10px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full">
              {snake.species}
            </span>
          )}
        </div>
        <h3 class="font-noto-serif text-on-surface text-2xl font-bold leading-tight">{snake.name}</h3>
      </div>
      {price && (
        <span class="font-bold text-tertiary text-xl shrink-0 ml-4">{price}</span>
      )}
    </div>
  </a>
)}

{variant === 'small' && (
  <div class="bg-surface-container-low rounded overflow-hidden flex flex-col h-full">
    <div class="relative overflow-hidden flex-shrink-0" style="aspect-ratio: 1 / 1;">
      <img
        src={imageUrl}
        alt={snake.name}
        class="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <span class={`absolute top-4 right-4 ${statusClass} text-[10px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full`}>
        {statusLabel}
      </span>
    </div>
    <div class="p-6 flex flex-col gap-1">
      <h3 class="font-noto-serif text-on-surface text-xl font-bold leading-tight">{snake.name}</h3>
      {snake.description && (
        <p class="text-on-surface/60 text-sm mb-3 line-clamp-2">{snake.description}</p>
      )}
      <a
        href={`/snakes/${snake.slug}`}
        class="w-full border border-outline-variant/20 text-on-surface text-sm font-semibold py-3 rounded-md text-center hover:border-outline-variant/40 hover:bg-surface-container-high transition-colors block mt-auto"
      >
        View Details
      </a>
    </div>
  </div>
)}

{variant === 'horizontal' && (
  <div class="bg-surface-container-low rounded overflow-hidden flex h-full">
    <div class="flex-1 min-w-0 relative overflow-hidden">
      <img
        src={imageUrl}
        alt={snake.name}
        class="w-full h-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </div>
    <div class="flex-1 p-8 flex flex-col justify-center min-w-0">
      <p class="text-primary text-xs font-bold uppercase tracking-[0.1em] mb-3">New Arrival</p>
      <h3 class="font-noto-serif text-on-surface text-3xl font-bold leading-tight mb-4">{snake.name}</h3>
      {snake.description && (
        <p class="text-on-surface/60 text-sm leading-relaxed max-w-[280px] line-clamp-3">{snake.description}</p>
      )}
      <div class="flex items-center justify-between mt-auto pt-8">
        {price
          ? <span class="font-bold text-tertiary text-2xl">{price}</span>
          : <span class="text-on-surface-variant text-sm">Price on request</span>
        }
        <a
          href={`/snakes/${snake.slug}`}
          class="bg-primary text-on-primary p-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center flex-shrink-0"
          aria-label={`View ${snake.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/snakes/SnakeBentoCard.astro
git commit -m "feat: add SnakeBentoCard with large/small/horizontal Figma variants"
```

---

## Task 4: Create SnakeBentoGrid Component

**Figma:** `3:32` — 12-column grid, two rows. Row 1: large card (cols 1–8) + small card (cols 9–12). Row 2: small card (cols 1–4) + horizontal card (cols 5–12). Falls back to `SnakeGrid` if fewer than 3 snakes.

**Files:**
- Create: `src/components/snakes/SnakeBentoGrid.astro`

- [ ] **Step 1: Create `src/components/snakes/SnakeBentoGrid.astro`**

```astro
---
// src/components/snakes/SnakeBentoGrid.astro
import SnakeBentoCard from './SnakeBentoCard.astro';
import SnakeGrid from './SnakeGrid.astro';
import type { Snake, TraitChip } from '../../db/schema';

interface Props {
  snakes: (Snake & { traits?: TraitChip[] })[];
}

// Use `snakeList` to avoid shadowing the `snakes` DB table name if ever imported
const { snakes: snakeList } = Astro.props;

const [large, small1, small2, horizontal] = snakeList;

// Slot-specific demo fallback images (used when snake has no R2 image)
const demoImages = [
  '/demo/snake-palmetto.jpg',
  '/demo/snake-morph1.jpg',
  '/demo/snake-morph2.jpg',
  '/demo/snake-morph3.jpg',
];
---

{snakeList.length < 3
  ? <SnakeGrid snakes={snakeList} />
  : (
    <div class="grid grid-cols-12 gap-6">
      <!-- Row 1: large (8 cols) + small (4 cols) -->
      <div class="col-span-12 lg:col-span-8 min-h-[500px]">
        <SnakeBentoCard snake={large} variant="large" fallbackImage={demoImages[0]} />
      </div>
      <div class="col-span-12 lg:col-span-4">
        <SnakeBentoCard snake={small1} variant="small" fallbackImage={demoImages[1]} />
      </div>
      <!-- Row 2: small (4 cols) + horizontal (8 cols) -->
      {small2 && (
        <div class="col-span-12 lg:col-span-4">
          <SnakeBentoCard snake={small2} variant="small" fallbackImage={demoImages[2]} />
        </div>
      )}
      {horizontal && (
        <div class="col-span-12 lg:col-span-8 min-h-[400px]">
          <SnakeBentoCard snake={horizontal} variant="horizontal" fallbackImage={demoImages[3]} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/snakes/SnakeBentoGrid.astro
git commit -m "feat: add SnakeBentoGrid — asymmetric 12-col bento layout with demo image fallbacks"
```

---

## Task 5: Rebuild `index.astro` with All Sections

**Figma sections in order:** Hero → Bento Grid → About Us → CTA

Replace the entire file. The frontmatter DB query stays the same — only the template changes.

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace `src/pages/index.astro`**

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/layout/Header.astro';
import Footer from '../components/layout/Footer.astro';
import SnakeBentoGrid from '../components/snakes/SnakeBentoGrid.astro';
import { createDb } from '../db/client';
import { snakes, traitChips } from '../db/schema';
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';

const db = createDb((env as unknown as { DB: D1Database }).DB);
const featuredSnakes = await db.select().from(snakes).where(eq(snakes.featured, true)).limit(6);
const snakesWithTraits = await Promise.all(
  featuredSnakes.map(async snake => ({
    ...snake,
    traits: await db.select().from(traitChips).where(eq(traitChips.snakeId, snake.id)),
  }))
);
---
<BaseLayout title="Home">
  <Header slot="header" />

  <!-- ─── Hero ─────────────────────────────────────────────── -->
  <section class="relative min-h-screen flex items-center overflow-hidden bg-surface">
    <!-- Background image -->
    <div class="absolute inset-0">
      <img
        src="/demo/hero-bg.jpg"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 w-full h-full object-cover object-center"
      />
      <!-- Left-to-right gradient matching Figma: solid surface → transparent -->
      <div class="absolute inset-0 bg-gradient-to-r from-surface via-surface/40 to-transparent"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 px-20 pt-[68px] max-w-[896px]">
      <p class="text-primary uppercase tracking-[0.1em] text-xs font-bold mb-4">The 2024 Collection</p>
      <h1
        class="font-noto-serif font-bold tracking-tight mb-4"
        style="font-size: clamp(3rem, 7vw, 6rem); line-height: 1.0;"
      >
        <span class="text-on-surface block">The Serpent's</span>
        <span class="text-on-surface block">Edge.</span>
        <span class="text-primary block">Hand-Selected</span>
        <span class="text-primary block">Exotics.</span>
      </h1>
      <p class="text-on-surface/70 text-lg max-w-[576px] mt-6 mb-10 leading-relaxed">
        Elevating the art of reptile keeping through precision genetics and elite husbandry.
        Discover the rare, the beautiful, and the extraordinary.
      </p>
      <div class="flex gap-4 flex-wrap">
        <a
          href="/snakes"
          class="inline-flex items-center gap-2 bg-primary text-on-primary font-semibold px-8 py-[17px] rounded-md hover:bg-primary/90 transition-colors text-sm"
        >
          View Collection <span aria-hidden="true">→</span>
        </a>
        <a
          href="/#about"
          class="inline-flex items-center px-8 py-[17px] rounded-md border border-outline-variant/20 text-on-surface font-semibold hover:border-outline-variant/40 hover:bg-surface-container-high transition-colors text-sm"
        >
          Our Story
        </a>
      </div>
    </div>
  </section>

  <!-- ─── Featured Specimens (Bento Grid) ──────────────────── -->
  {snakesWithTraits.length > 0 && (
    <section class="bg-surface px-20 py-24">
      <div class="max-w-[1280px] mx-auto">
        <div class="flex items-end justify-between mb-16 gap-8">
          <div class="max-w-[600px]">
            <h2 class="font-noto-serif text-on-surface text-[36px] font-bold mb-4">
              Featured Specimens
            </h2>
            <p class="text-on-surface/60 text-base leading-relaxed">
              A curated look at our most recent successful pairings. Each animal is backed
              by complete genetic documentation.
            </p>
          </div>
          <a
            href="/snakes"
            class="flex items-center gap-2 text-primary font-semibold text-base hover:text-primary/80 transition-colors shrink-0"
          >
            Explore all listings <span aria-hidden="true">↗</span>
          </a>
        </div>
        <SnakeBentoGrid snakes={snakesWithTraits} />
      </div>
    </section>
  )}

  <!-- ─── About Us ──────────────────────────────────────────── -->
  <section id="about" class="bg-surface-container-low px-20 py-32">
    <div class="max-w-[1280px] mx-auto grid grid-cols-2 gap-16 items-center">
      <!-- Left: image with gold stat overlay -->
      <div class="relative pb-8 pr-8">
        <div class="aspect-square overflow-hidden rounded">
          <img
            src="/demo/about-facility.jpg"
            alt="Breeding facility"
            class="w-full h-full object-cover grayscale"
            loading="lazy"
            decoding="async"
          />
        </div>
        <!-- Gold stat card — offset outside image bounds -->
        <div class="absolute bottom-0 right-0 bg-tertiary rounded p-8 shadow-2xl">
          <p class="font-noto-serif font-bold text-on-tertiary text-4xl leading-tight">15+</p>
          <p class="text-on-tertiary/70 text-xs uppercase tracking-[0.1em] font-medium mt-1">Years of Passion</p>
        </div>
      </div>

      <!-- Right: copy -->
      <div class="flex flex-col gap-6">
        <p class="text-primary text-xs uppercase tracking-[0.2em] font-bold">Our Ethos</p>
        <h2 class="font-noto-serif text-on-surface font-bold leading-tight" style="font-size: 3rem;">
          Ethics. Genetics.<br />Design.
        </h2>
        <div class="flex flex-col gap-6 text-on-surface/70 text-base leading-relaxed">
          <p>
            At The Serpent's Edge, we view reptile breeding as a marriage between biological
            science and aesthetic appreciation. Every animal in our facility is a product of
            years of careful lineage tracking and meticulous environmental control.
          </p>
          <p>
            We don't just produce snakes; we curate living art. Our commitment to husbandry
            excellence ensures that every specimen arrives healthy, socialized, and ready to
            become the centerpiece of your collection.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-8 pt-4">
          <div>
            <h4 class="font-inter font-bold text-on-surface text-base mb-2">Scientific Rigor</h4>
            <p class="text-on-surface/50 text-xs leading-relaxed">
              Strict genetic screening and lineage certification for every animal sold.
            </p>
          </div>
          <div>
            <h4 class="font-inter font-bold text-on-surface text-base mb-2">Global Shipping</h4>
            <p class="text-on-surface/50 text-xs leading-relaxed">
              Professional live-arrival guaranteed shipping across North America and EU.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ─── CTA ───────────────────────────────────────────────── -->
  <section id="contact" class="bg-surface px-20 py-24">
    <div class="max-w-[1280px] mx-auto">
      <div class="bg-surface-container-high rounded-2xl overflow-hidden relative px-28 py-24 text-center">
        <!-- Subtle radial glow -->
        <div
          class="absolute inset-0 pointer-events-none opacity-10"
          style="background: radial-gradient(ellipse at 50% 50%, var(--color-primary) 0%, transparent 60%);"
        ></div>
        <div class="relative flex flex-col items-center gap-8 max-w-[896px] mx-auto">
          <h2
            class="font-noto-serif font-bold text-on-surface leading-tight"
            style="font-size: clamp(2rem, 5vw, 3.75rem);"
          >
            Ready to evolve your<br />collection?
          </h2>
          <p class="text-on-surface/60 text-lg leading-relaxed max-w-[680px]">
            We specialize in bespoke consultations and investment-grade morphs. For inquiries,
            current availability, or to discuss a specific pairing, connect with us on Instagram.
          </p>
          <div class="flex gap-6 flex-wrap justify-center">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-3 bg-tertiary text-on-tertiary font-bold text-lg px-10 py-5 rounded-md hover:bg-tertiary/90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Inquire on Instagram
            </a>
            <a
              href="/#contact"
              class="inline-flex items-center gap-3 bg-surface-container-highest text-on-surface-variant font-bold text-lg px-10 py-5 rounded-md hover:text-on-surface transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Join Waitlist
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <Footer slot="footer" />
</BaseLayout>
```

- [ ] **Step 2: Build check — must pass cleanly**

```bash
npm run build 2>&1 | tail -30
```
Expected: no TypeScript errors, no build failures. If `cloudflare:workers` type errors appear check that `wrangler.jsonc` has the correct `compatibility_flags`.

- [ ] **Step 3: Run unit tests**

```bash
npm run test
```
Expected: all existing tests still pass (no regressions — this task only modifies template markup).

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: rebuild homepage with Figma sections — hero, bento grid, about, CTA"
```

---

## Task 6: Polish Collection Page

Apply consistent section padding and typography to `snakes/index.astro` to match the design system.

**Files:**
- Modify: `src/pages/snakes/index.astro`

- [ ] **Step 1: Write the complete `src/pages/snakes/index.astro`**

Replace the entire file (frontmatter + template) to avoid partial-snippet ambiguity:

```astro
---
// src/pages/snakes/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/layout/Header.astro';
import Footer from '../../components/layout/Footer.astro';
import SnakeGrid from '../../components/snakes/SnakeGrid.astro';
import { createDb } from '../../db/client';
import { snakes, traitChips } from '../../db/schema';
import { eq } from 'drizzle-orm';

import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';

const db = createDb((env as unknown as { DB: D1Database }).DB);
const allSnakes = await db.select().from(snakes).orderBy(snakes.createdAt);
const snakesWithTraits = await Promise.all(
  allSnakes.map(async s => ({
    ...s,
    traits: await db.select().from(traitChips).where(eq(traitChips.snakeId, s.id)),
  }))
);
---
<BaseLayout title="Collection">
  <Header slot="header" />
  <section class="bg-surface px-20 py-24">
    <div class="max-w-[1280px] mx-auto">
      <p class="text-primary uppercase tracking-[0.1em] text-xs font-bold mb-4">Our Specimens</p>
      <h1 class="font-noto-serif text-on-surface font-bold mb-16" style="font-size: 3.5rem;">
        The Collection
      </h1>
      <SnakeGrid snakes={snakesWithTraits} />
    </div>
  </section>
  <Footer slot="footer" />
</BaseLayout>
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/snakes/index.astro
git commit -m "feat: polish collection page — consistent padding, display heading treatment"
```

---

## Task 7: Final Visual Verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```
Expected output includes: `Local: http://localhost:4321`

> **Note:** If Clerk middleware errors on startup with a missing `PUBLIC_CLERK_PUBLISHABLE_KEY`, add a dev key to `.env.local`. Public pages (homepage, collection) do not require an admin login.

- [ ] **Step 2: Open browser and check each section against the Figma screenshots**

Navigate to `http://localhost:4321` and verify:

**Header:**
- [ ] Glassmorphism background (semi-transparent with blur)
- [ ] Noto Serif bold nav links — no bottom border line
- [ ] Admin icon button on the right

**Hero:**
- [ ] Snake photo fills the right side
- [ ] Left-to-right gradient (dark surface on left → transparent)
- [ ] "THE 2024 COLLECTION" label in primary green
- [ ] Large display heading: first two lines in `on-surface`, last two in `primary`
- [ ] "View Collection →" (green primary) and "Our Story" (ghost border) buttons

**Bento Grid:**
- [ ] Large card spans 8 columns, small card 4 columns
- [ ] Row 2: small card (4) + horizontal card (8)
- [ ] Demo images visible (not the generic SVG placeholder)
- [ ] Status chips on cards (Available/Sold)

**About Section:**
- [ ] `bg-surface-container-low` background (distinct from surface)
- [ ] Two-column layout: greyscale facility photo on left, text on right
- [ ] Gold "15+ Years of Passion" card offset in bottom-right corner of photo

**CTA Section:**
- [ ] Dark rounded card (`surface-container-high`)
- [ ] Subtle radial green glow visible
- [ ] Gold "Inquire on Instagram" button (tertiary color)
- [ ] Dark "Join Waitlist" button

**Footer:**
- [ ] `bg-surface-container-low` — no top border line
- [ ] Logo + copyright on left
- [ ] Pages column (Collection, About, Contact) + Social column (Instagram, MorphMarket)

**Design system rules (cross-cutting):**
- [ ] No pure white (`#ffffff`) visible anywhere — use on-surface `#e2e2e2`
- [ ] No divider lines between sections — background color shifts only
- [ ] Gold (`tertiary`) used only on the "Inquire on Instagram" CTA button

- [ ] **Step 3: Verify responsive layout at tablet width (768px)**

Resize the browser to 768px wide (or use DevTools device emulation) and confirm:
- [ ] Bento cards stack to full-width single column (no horizontal overflow)
- [ ] Hero heading doesn't clip — `clamp()` sizing scales gracefully
- [ ] About section two-column stacks to single column
- [ ] No horizontal scroll on any section

- [ ] **Step 4: Fix any regressions or visual issues found in steps 2–3**

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Figma-to-production homepage UI — all sections match design"
```

---

## Appendix: Design Token Quick Reference

All values are from `src/styles/global.css @theme`. Use Tailwind utilities, never raw hex.

| Token | Tailwind Class | Hex Value |
|:---|:---|:---|
| Surface | `bg-surface` | `#121414` |
| Surface container lowest | `bg-surface-container-lowest` | `#0d0f0f` |
| Surface container low | `bg-surface-container-low` | `#191b1b` |
| Surface container | `bg-surface-container` | `#1e2020` |
| Surface container high | `bg-surface-container-high` | `#282a2a` |
| Surface container highest | `bg-surface-container-highest` | `#333535` |
| Secondary container (available chip) | `bg-secondary-container` | `#1f3a34` |
| Primary | `text-primary` / `bg-primary` | `#9ed1bd` |
| On-primary | `text-on-primary` | `#00382a` |
| Tertiary (gold — CTA only) | `text-tertiary` / `bg-tertiary` | `#e9c176` |
| On-tertiary | `text-on-tertiary` | `#412d00` |
| On-surface | `text-on-surface` | `#e2e2e2` |
| On-surface-variant | `text-on-surface-variant` | `#a0a8a5` |
| Outline-variant | `border-outline-variant` | `#414843` |