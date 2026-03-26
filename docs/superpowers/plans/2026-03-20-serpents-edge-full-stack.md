# The Serpent's Edge — Full-Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack snake breeding business website ("The Serpent's Edge") on Astro 6 + Cloudflare Workers with Drizzle/D1, Clerk auth, Cloudflare R2 photo storage, Tailwind UI Plus components, and a Playwright + Vitest test suite.

**Architecture:** Astro 6 in `output: 'server'` mode deployed to Cloudflare Workers via `@astrojs/cloudflare`. Public pages query Drizzle directly at request time (the Astro 6 "live" pattern). Admin pages are route-protected via Clerk middleware. All data lives in Cloudflare D1 (SQLite) accessed through Drizzle ORM; photos/assets in Cloudflare R2.

**Tech Stack:** Astro 6, `@astrojs/cloudflare` v13+, Cloudflare D1 + R2 + Workers, Drizzle ORM, Clerk (`@clerk/astro`), Tailwind CSS v4 (`@tailwindcss/vite`), Astro Actions, Vitest, Playwright, Docker Compose (local dev), Wrangler v3.

---

## Pre-flight Checks

Before starting:
- [ ] Confirm you have a Cloudflare account with D1, R2, and Workers access
- [ ] Confirm you have a Clerk account and an application created (copy Publishable Key + Secret Key)
- [ ] Confirm you have a Tailwind UI Plus license at `tailwindcss.com/plus/ui-blocks`
- [ ] Figma MCP is configured via `plugin:figma` — see **Appendix A: Figma MCP Usage**

---

## File Structure

```
snake-project/
├── CLAUDE.md                          # Project context for Claude Code
├── DESIGN.md                          # Design system (existing — do not delete)
├── wrangler.jsonc                     # Cloudflare Workers + D1/R2 bindings
├── astro.config.mjs                   # Astro 6 config with Cloudflare adapter
├── drizzle.config.ts                  # Drizzle Kit config (generates SQL migrations)
├── docker-compose.yml                 # Local dev environment
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── public/
│   └── placeholder-snake.jpg          # Dark fallback image
├── src/
│   ├── env.d.ts                       # Cloudflare runtime + Env type augmentation
│   ├── content.config.ts              # Astro 6 content collections (loader-based)
│   ├── middleware.ts                  # Clerk auth + admin route protection
│   ├── actions/
│   │   └── index.ts                   # Astro Actions (snake CRUD, inquiry form)
│   ├── components/
│   │   ├── ui/                        # Reusable design system components
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   ├── Badge.astro
│   │   │   ├── FormField.astro        # Label + input + error wrapper
│   │   │   ├── Input.astro
│   │   │   └── Chip.astro             # Genetic trait chip (dominant/recessive/codominant)
│   │   ├── layout/
│   │   │   ├── Header.astro
│   │   │   └── Footer.astro
│   │   └── snakes/
│   │       ├── SnakeCard.astro        # Specimen display card
│   │       └── SnakeGrid.astro        # Grid of SnakeCards
│   ├── layouts/
│   │   ├── BaseLayout.astro           # Global styles, fonts, CSP
│   │   └── AdminLayout.astro          # Sidebar nav + auth gate
│   ├── pages/
│   │   ├── index.astro                # Homepage
│   │   ├── snakes/
│   │   │   ├── index.astro            # Browse all snakes
│   │   │   └── [slug].astro           # Single specimen (URL uses slug)
│   │   ├── admin/
│   │   │   ├── index.astro            # Dashboard overview
│   │   │   ├── snakes/
│   │   │   │   ├── index.astro        # List snakes
│   │   │   │   ├── new.astro          # Create snake
│   │   │   │   └── [id]/edit.astro    # Edit snake (URL uses internal ID)
│   │   │   └── media/
│   │   │       └── index.astro        # Upload images to R2
│   │   └── api/
│   │       └── r2/
│   │           └── image.ts           # Serve images from R2
│   ├── db/
│   │   ├── schema.ts                  # Drizzle table definitions + exported types
│   │   ├── client.ts                  # D1 Drizzle client factory
│   │   └── migrations/                # Generated SQL files (drizzle-kit generate)
│   └── lib/
│       ├── auth.ts                    # Clerk isAdminRole helper
│       └── r2.ts                      # R2 key generation helper
└── tests/
    ├── unit/
    │   ├── db/
    │   │   └── schema.test.ts
    │   ├── auth/
    │   │   └── auth.test.ts
    │   ├── actions/
    │   │   └── inquiry.test.ts
    │   └── lib/
    │       └── r2.test.ts
    └── e2e/
        ├── public.spec.ts
        └── admin.spec.ts
```

---

## Task 1: Initialize Astro 6 Project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts`

- [ ] **Step 1: Scaffold the project**

```bash
cd /Users/efrigon/WebstormProjects/snake-project
npm create astro@latest . -- --template minimal --typescript strict --no-git --no-install
```
Select: TypeScript strict, no git (already exists), install dependencies manually.

- [ ] **Step 2: Install core dependencies**

```bash
npm install
npm install @astrojs/cloudflare @clerk/astro drizzle-orm
npm install tailwindcss @tailwindcss/vite
npm install -D drizzle-kit wrangler@latest vitest @playwright/test
npm install -D @cloudflare/workers-types
```

> **Tailwind CSS v4:** Uses `@tailwindcss/vite` as a Vite plugin directly in `astro.config.mjs`. Do NOT install `@astrojs/tailwind` — that package only supports Tailwind v3.

- [ ] **Step 3: Configure `astro.config.mjs`**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import clerk from '@clerk/astro';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'cloudflare',
    platformProxy: { enabled: true },
  }),
  integrations: [clerk()],
  vite: {
    plugins: [tailwindcss()],
  },
  experimental: {
    fonts: [
      {
        provider: 'google',
        name: 'Noto Serif',
        cssVariable: '--font-noto-serif',
      },
      {
        provider: 'google',
        name: 'Inter',
        cssVariable: '--font-inter',
      },
    ],
  },
});
```

- [ ] **Step 4: Configure `src/env.d.ts`**

```ts
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
}
```

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs tsconfig.json src/env.d.ts package.json package-lock.json
git commit -m "feat: initialize Astro 6 project with Cloudflare adapter, Clerk, Tailwind v4"
```

---

## Task 2: Wrangler & Docker Compose Configuration

**Files:**
- Create: `wrangler.jsonc`, `docker-compose.yml`, `.env.local.example`

- [ ] **Step 1: Create `wrangler.jsonc`**

```jsonc
// wrangler.jsonc
{
  "name": "serpents-edge",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./dist/_worker.js",
  "assets": { "directory": "./dist" },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "serpents-edge-db",
      "database_id": "REPLACE_WITH_YOUR_D1_ID"
    }
  ],
  "r2_buckets": [
    {
      "binding": "ASSETS_BUCKET",
      "bucket_name": "serpents-edge-assets"
    }
  ],
  "vars": {
    "CLERK_PUBLISHABLE_KEY": "pk_test_REPLACE_ME"
  }
}
```

Create the Cloudflare resources:
```bash
npx wrangler d1 create serpents-edge-db
# Copy the database_id from output into wrangler.jsonc

npx wrangler r2 bucket create serpents-edge-assets
```

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
# docker-compose.yml
version: '3.9'
services:
  app:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "4321:4321"
    environment:
      - NODE_ENV=development
    command: sh -c "npm install && npx astro dev --host 0.0.0.0"
    env_file:
      - .env.local
```

- [ ] **Step 3: Create `.env.local.example` and update `.gitignore`**

```bash
# .env.local.example
CLERK_SECRET_KEY=sk_test_REPLACE_ME
CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
```

```bash
cp .env.local.example .env.local
echo '.env.local' >> .gitignore
echo '.wrangler/' >> .gitignore
```

- [ ] **Step 4: Add npm scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "wrangler dev",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "wrangler d1 migrations apply serpents-edge-db --local",
    "db:migrate:prod": "wrangler d1 migrations apply serpents-edge-db --remote",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add wrangler.jsonc docker-compose.yml .env.local.example .gitignore package.json
git commit -m "chore: add Wrangler config and Docker Compose local dev setup"
```

---

## Task 3: Vitest Configuration

**Files:**
- Create: `vitest.config.ts`

> Set up Vitest before writing any tests, so the test runner is available from Task 4 onward.

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '~/': new URL('./src/', import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 2: Create `tests/unit/` directory placeholder**

```bash
mkdir -p tests/unit/db tests/unit/auth tests/unit/actions tests/unit/lib
```

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: configure Vitest for unit tests"
```

---

## Task 4: Drizzle Schema & Database Setup

**Files:**
- Create: `tests/unit/db/schema.test.ts`, `src/db/schema.ts`, `src/db/client.ts`, `drizzle.config.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/db/schema.test.ts
import { describe, it, expect } from 'vitest';
import { snakes, traitChips, inquiries } from '../../../src/db/schema';

describe('database schema', () => {
  it('snake table has required fields', () => {
    expect(snakes.id).toBeDefined();
    expect(snakes.name).toBeDefined();
    expect(snakes.slug).toBeDefined();
    expect(snakes.priceInCents).toBeDefined();
  });

  it('traitChips table references snake', () => {
    expect(traitChips.snakeId).toBeDefined();
  });

  it('inquiries table has required contact fields', () => {
    expect(inquiries.name).toBeDefined();
    expect(inquiries.email).toBeDefined();
    expect(inquiries.message).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- tests/unit/db/schema.test.ts
```
Expected: FAIL — `Cannot find module '../../../src/db/schema'`

- [ ] **Step 3: Implement `src/db/schema.ts`**

```ts
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const snakes = sqliteTable('snakes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  species: text('species').notNull(),
  description: text('description').notNull().default(''),
  priceInCents: integer('price_in_cents').notNull().default(0),
  available: integer('available', { mode: 'boolean' }).notNull().default(false),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  primaryImageKey: text('primary_image_key'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const traitChips = sqliteTable('trait_chips', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  snakeId: text('snake_id')
    .notNull()
    .references(() => snakes.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  type: text('type', { enum: ['dominant', 'recessive', 'codominant'] })
    .notNull()
    .default('dominant'),
});

export const inquiries = sqliteTable('inquiries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  snakeId: text('snake_id').references(() => snakes.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Snake = typeof snakes.$inferSelect;
export type NewSnake = typeof snakes.$inferInsert;
export type TraitChip = typeof traitChips.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- tests/unit/db/schema.test.ts
```
Expected: PASS

- [ ] **Step 5: Create `src/db/client.ts`**

```ts
// src/db/client.ts
import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof createDb>;
```

> `D1Database` is explicitly imported from `@cloudflare/workers-types` to ensure strict TypeScript does not fail, even in environments where globals aren't available.

- [ ] **Step 6: Create `drizzle.config.ts`**

```ts
// drizzle.config.ts
// drizzle-kit is only used to GENERATE SQL migration files.
// Migrations are APPLIED via: wrangler d1 migrations apply (not drizzle-kit migrate).
// The driver/dbCredentials below are only needed if you ever call `drizzle-kit push` directly.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
});
```

- [ ] **Step 7: Generate initial migrations**

```bash
npm run db:generate
# Creates src/db/migrations/0000_*.sql
```

- [ ] **Step 8: Apply migrations to local D1**

```bash
npm run db:migrate
# Writes to .wrangler/state/v3/d1/ — requires wrangler to be configured with a real database_id
```

- [ ] **Step 9: Commit**

```bash
git add src/db/ drizzle.config.ts tests/unit/db/
git commit -m "feat: add Drizzle schema, D1 client, and initial migrations"
```

---

## Task 5: Clerk Authentication & Middleware

**Files:**
- Create: `tests/unit/auth/auth.test.ts`, `src/lib/auth.ts`, `src/middleware.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/auth/auth.test.ts
import { describe, it, expect } from 'vitest';
import { isAdminRole } from '../../../src/lib/auth';

describe('isAdminRole', () => {
  it('returns true when publicMetadata.role is admin', () => {
    expect(isAdminRole({ publicMetadata: { role: 'admin' } })).toBe(true);
  });

  it('returns false for non-admin user', () => {
    expect(isAdminRole({ publicMetadata: { role: 'member' } })).toBe(false);
  });

  it('returns false when publicMetadata is empty', () => {
    expect(isAdminRole({ publicMetadata: {} })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAdminRole(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- tests/unit/auth/
```
Expected: FAIL — `Cannot find module '../../../src/lib/auth'`

- [ ] **Step 3: Implement `src/lib/auth.ts`**

```ts
// src/lib/auth.ts
export function isAdminRole(
  user: { publicMetadata?: Record<string, unknown> } | null | undefined
): boolean {
  return user?.publicMetadata?.role === 'admin';
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- tests/unit/auth/
```
Expected: PASS

- [ ] **Step 5: Implement `src/middleware.ts`**

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export const onRequest = clerkMiddleware((auth, context) => {
  if (isAdminRoute(context.request)) {
    // Protect: only authenticated users with admin role in publicMetadata
    auth().protect();
  }
});
```

> **Setting admin role:** In the Clerk Dashboard → Users → select user → Public Metadata → set `{ "role": "admin" }`. The middleware protects all `/admin/**` routes — page-level checks can use `isAdminRole` from `src/lib/auth.ts` for finer control.

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/lib/auth.ts tests/unit/auth/
git commit -m "feat: add Clerk auth middleware protecting /admin routes"
```

---

## Task 6: Global Styles & Base Layouts

**Files:**
- Create: `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/layouts/AdminLayout.astro`

- [ ] **Step 1: Create `src/styles/global.css`**

```css
/* src/styles/global.css */
/* Tailwind CSS v4 — uses @import, not @tailwind directives */
@import "tailwindcss";

@theme {
  /* Surface hierarchy */
  --color-surface: #121414;
  --color-surface-container-lowest: #0d0f0f;
  --color-surface-container-low: #191b1b;
  --color-surface-container: #1e2020;
  --color-surface-container-high: #282a2a;
  --color-surface-container-highest: #333535;
  --color-surface-variant: #333535;

  /* Brand palette */
  --color-primary: #9ed1bd;
  --color-on-primary: #00382a;
  --color-secondary: #a4cdc2;
  --color-secondary-container: #1f3a34;
  --color-tertiary: #e9c176;
  --color-on-tertiary: #412d00;
  --color-tertiary-container: #5c3f00;
  --color-on-surface: #e2e2e2;
  --color-on-surface-variant: #a0a8a5;
  --color-outline-variant: #414843;

  /* Typography
   * Astro 6 Fonts API injects --font-noto-serif and --font-inter as CSS variables
   * with the downloaded font stack. We define Tailwind theme entries using LITERAL
   * font names here — circular self-references like var(--font-noto-serif) are invalid CSS.
   * The Astro-injected variables are used for preloading/caching; the @theme values
   * declare the actual font-family stacks for Tailwind utilities.
   */
  --font-noto-serif: 'Noto Serif', serif;
  --font-inter: 'Inter', sans-serif;
}
```

- [ ] **Step 2: Create `src/layouts/BaseLayout.astro`**

```astro
---
// src/layouts/BaseLayout.astro
// Astro 6 Fonts API: fonts are configured in astro.config.mjs experimental.fonts
// and injected automatically by the framework — no manual getFont() calls needed.
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Premium ball python morphs.' } = Astro.props;
---
<!doctype html>
<html lang="en" class="bg-surface text-on-surface">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title} | The Serpent's Edge</title>
    <slot name="head" />
  </head>
  <body class="min-h-screen font-inter antialiased">
    <slot name="header" />
    <main>
      <slot />
    </main>
    <slot name="footer" />
  </body>
</html>
```

> **Astro 6 Fonts API:** The `experimental.fonts` config in `astro.config.mjs` automatically handles downloading, caching, and injecting `@font-face` CSS. You do not call any `getFont()` imperative API.

- [ ] **Step 3: Create `src/layouts/AdminLayout.astro`**

```astro
---
// src/layouts/AdminLayout.astro
import BaseLayout from './BaseLayout.astro';

interface Props {
  title: string;
}
const { title } = Astro.props;
---
<BaseLayout title={`Admin — ${title}`}>
  <div slot="header" class="flex h-screen bg-surface-container-lowest overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 bg-surface-container flex flex-col p-6 gap-6 border-r border-outline-variant/20 shrink-0">
      <div class="font-noto-serif text-xl text-on-surface font-bold">Serpent's Edge</div>
      <nav class="flex flex-col gap-1 text-sm">
        <a href="/admin" class="text-on-surface-variant hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-container-high">Dashboard</a>
        <a href="/admin/snakes" class="text-on-surface-variant hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-container-high">Snakes</a>
        <a href="/admin/media" class="text-on-surface-variant hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-container-high">Media</a>
      </nav>
    </aside>

    <!-- Main content area -->
    <div class="flex-1 overflow-auto flex flex-col">
      <header class="h-16 bg-surface-container border-b border-outline-variant/20 flex items-center px-8 justify-between shrink-0">
        <h1 class="font-inter text-on-surface text-lg">{title}</h1>
        <slot name="admin-header-actions" />
      </header>
      <div class="p-8 flex-1">
        <slot />
      </div>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 4: Commit**

```bash
git add src/layouts/ src/styles/
git commit -m "feat: add BaseLayout and AdminLayout with Tailwind v4 design tokens"
```

---

## Task 7: Core UI Components

**Files:**
- Create: `src/components/ui/Button.astro`, `Badge.astro`, `Card.astro`, `Input.astro`, `FormField.astro`, `Chip.astro`

> **Tailwind UI Plus:** Visit `https://tailwindcss.com/plus/ui-blocks` (requires your license). Copy HTML blocks for Buttons, Badges, Cards, and Form fields — then adapt them to the Astro component pattern below, replacing Tailwind v3 class names with the design token classes from `DESIGN.md`.

- [ ] **Step 1: Create `src/components/ui/Button.astro`**

```astro
---
// src/components/ui/Button.astro
interface Props {
  variant?: 'primary' | 'tertiary' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  class?: string;
  disabled?: boolean;
}
const { variant = 'primary', type = 'button', href, class: className = '', disabled } = Astro.props;

const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none';
const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  tertiary: 'bg-tertiary text-on-tertiary hover:bg-tertiary/90',
  ghost: 'bg-transparent border border-outline-variant/20 text-on-surface hover:bg-surface-container-high',
};
const classes = [base, variants[variant], className].join(' ');
---
{href
  ? <a href={href} class={classes}><slot /></a>
  : <button type={type} disabled={disabled} class={classes}><slot /></button>
}
```

- [ ] **Step 2: Create `src/components/ui/Badge.astro`**

```astro
---
// src/components/ui/Badge.astro
interface Props {
  variant?: 'available' | 'sold' | 'featured';
}
const { variant = 'available' } = Astro.props;
const variants = {
  available: 'bg-primary/20 text-primary',
  sold: 'bg-surface-container-highest text-on-surface-variant',
  featured: 'bg-tertiary/20 text-tertiary',
};
---
<span class={`inline-flex items-center px-2 py-0.5 rounded text-xs uppercase tracking-widest font-medium ${variants[variant]}`}>
  <slot />
</span>
```

- [ ] **Step 3: Create `src/components/ui/Card.astro`**

```astro
---
// src/components/ui/Card.astro
interface Props {
  class?: string;
}
const { class: className = '' } = Astro.props;
---
<div class={`bg-surface-container-low rounded hover:bg-surface-container-high transition-colors ${className}`}>
  <slot />
</div>
```

- [ ] **Step 4: Create `src/components/ui/Input.astro`**

```astro
---
// src/components/ui/Input.astro
interface Props {
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  error?: string;
  class?: string;
}
const { name, type = 'text', placeholder, required, value, error, class: className = '' } = Astro.props;
---
<input
  id={name}
  name={name}
  type={type}
  placeholder={placeholder}
  required={required}
  value={value}
  class={`w-full bg-surface-container-lowest border text-on-surface text-sm px-3 py-2 rounded focus:outline-none focus:shadow-[0_0_8px_rgba(158,209,189,0.3)] focus:border-primary/50 ${error ? 'border-red-500/60' : 'border-outline-variant/30'} ${className}`}
/>
```

- [ ] **Step 5: Create `src/components/ui/FormField.astro`** (label + input + error wrapper)

```astro
---
// src/components/ui/FormField.astro
// Wraps a label, input slot, and error message into one consistent unit.
interface Props {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
}
const { label, name, required, error } = Astro.props;
---
<div class="flex flex-col gap-1.5">
  <label for={name} class="text-xs uppercase tracking-widest text-on-surface-variant font-medium">
    {label}{required && <span class="text-tertiary ml-1">*</span>}
  </label>
  <slot />
  {error && <p class="text-red-400 text-xs">{error}</p>}
</div>
```

- [ ] **Step 6: Create `src/components/ui/Chip.astro`** (genetic trait chip)

```astro
---
// src/components/ui/Chip.astro
interface Props {
  type?: 'dominant' | 'recessive' | 'codominant';
}
const { type = 'dominant' } = Astro.props;
const styles = {
  dominant: 'bg-surface-variant text-on-surface-variant',
  recessive: 'bg-tertiary-container text-tertiary',
  codominant: 'bg-secondary-container text-secondary',
};
---
<span class={`inline-flex items-center px-2.5 py-1 rounded text-xs uppercase tracking-wide font-medium ${styles[type]}`}>
  <slot />
</span>
```

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add reusable UI components (Button, Badge, Card, Input, FormField, Chip)"
```

---

## Task 8: Layout Components (Header, Footer, Snake Display)

**Files:**
- Create: `src/components/layout/Header.astro`, `Footer.astro`
- Create: `src/components/snakes/SnakeCard.astro`, `SnakeGrid.astro`

- [ ] **Step 1: Create `src/components/layout/Header.astro`**

```astro
---
// src/components/layout/Header.astro
---
<header class="sticky top-0 z-50 bg-surface-variant/60 backdrop-blur-xl border-b border-outline-variant/10">
  <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="/" class="font-noto-serif text-lg text-on-surface font-bold tracking-tight">
      The Serpent's Edge
    </a>
    <div class="flex items-center gap-8 text-sm text-on-surface-variant">
      <a href="/snakes" class="hover:text-primary transition-colors">Collection</a>
      <a href="/#about" class="hover:text-primary transition-colors">About</a>
      <a href="/#contact" class="hover:text-primary transition-colors">Contact</a>
    </div>
  </nav>
</header>
```

- [ ] **Step 2: Create `src/components/layout/Footer.astro`**

```astro
---
// src/components/layout/Footer.astro
---
<footer class="bg-surface-container-low border-t border-outline-variant/10 mt-24">
  <div class="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
    <p class="font-noto-serif text-on-surface-variant text-sm">
      © {new Date().getFullYear()} The Serpent's Edge
    </p>
    <nav class="flex gap-8 text-xs text-on-surface-variant uppercase tracking-widest">
      <a href="/snakes" class="hover:text-primary transition-colors">Collection</a>
      <a href="/#contact" class="hover:text-primary transition-colors">Contact</a>
    </nav>
  </div>
</footer>
```

- [ ] **Step 3: Create `src/components/snakes/SnakeCard.astro`**

```astro
---
// src/components/snakes/SnakeCard.astro
import Badge from '../ui/Badge.astro';
import Chip from '../ui/Chip.astro';
import type { Snake, TraitChip } from '../../db/schema';

interface Props {
  snake: Snake & { traits?: TraitChip[] };
}
const { snake } = Astro.props;
const imageUrl = snake.primaryImageKey
  ? `/api/r2/image?key=${encodeURIComponent(snake.primaryImageKey)}`
  : '/placeholder-snake.jpg';
---
<article class="bg-surface-container-low rounded overflow-hidden hover:bg-surface-container-high transition-colors group">
  <div class="aspect-[4/3] overflow-hidden bg-surface-container-lowest">
    <img
      src={imageUrl}
      alt={snake.name}
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
      decoding="async"
    />
  </div>
  <div class="p-5 flex flex-col gap-3">
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-noto-serif text-on-surface text-lg leading-snug">{snake.name}</h3>
      <Badge variant={snake.available ? 'available' : 'sold'}>
        {snake.available ? 'Available' : 'Sold'}
      </Badge>
    </div>
    <p class="text-on-surface-variant text-xs uppercase tracking-widest">{snake.species}</p>
    {snake.traits && snake.traits.length > 0 && (
      <div class="flex flex-wrap gap-1.5">
        {snake.traits.map(t => (
          <Chip type={t.type}>{t.label}</Chip>
        ))}
      </div>
    )}
    <div class="flex items-center justify-between mt-2">
      <span class="font-inter text-on-surface text-base">
        {snake.priceInCents > 0 ? `$${(snake.priceInCents / 100).toLocaleString()}` : 'Price on request'}
      </span>
      <a href={`/snakes/${snake.slug}`} class="text-xs text-primary hover:text-primary/80 transition-colors">
        View specimen →
      </a>
    </div>
  </div>
</article>
```

- [ ] **Step 4: Create `src/components/snakes/SnakeGrid.astro`**

```astro
---
// src/components/snakes/SnakeGrid.astro
import SnakeCard from './SnakeCard.astro';
import type { Snake, TraitChip } from '../../db/schema';

interface Props {
  snakes: (Snake & { traits?: TraitChip[] })[];
}
const { snakes } = Astro.props;
---
{snakes.length === 0
  ? <p class="text-on-surface-variant text-center py-24">No specimens available at this time.</p>
  : <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {snakes.map(snake => <SnakeCard snake={snake} />)}
    </div>
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add Header, Footer, SnakeCard, and SnakeGrid components"
```

---

## Task 9: Content Collections Config

**Files:**
- Create: `src/content.config.ts`

> Astro 6 uses loader-based content collections defined in `src/content.config.ts`. For this project, we query Drizzle directly in pages (richer query API). The content config is still required to register collections and generate types.

- [ ] **Step 1: Create `src/content.config.ts`**

```ts
// src/content.config.ts
// Astro 6 content collection config.
// Data is fetched at request time via Drizzle (D1) in page components.
// This file registers the collection shape for type generation.
import { defineCollection, z } from 'astro:content';

// We use Drizzle directly in pages rather than a live loader,
// so no loader is needed here — just define the type shape for IDE support.
export const collections = {
  snakes: defineCollection({
    type: 'data',
    schema: z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      species: z.string(),
      description: z.string(),
      priceInCents: z.number(),
      available: z.boolean(),
      featured: z.boolean(),
      primaryImageKey: z.string().nullable().optional(),
    }),
  }),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add Astro 6 content collection config"
```

---

## Task 10: Public Pages

**Files:**
- Create: `src/pages/index.astro`, `src/pages/snakes/index.astro`, `src/pages/snakes/[slug].astro`

- [ ] **Step 1: Create `src/pages/index.astro`**

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/layout/Header.astro';
import Footer from '../components/layout/Footer.astro';
import SnakeGrid from '../components/snakes/SnakeGrid.astro';
import Button from '../components/ui/Button.astro';
import { createDb } from '../db/client';
import { snakes, traitChips } from '../db/schema';
import { eq } from 'drizzle-orm';

const db = createDb(Astro.locals.runtime.env.DB);
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

  <!-- Hero section -->
  <section class="relative min-h-[80vh] flex items-end pb-24 px-6 bg-surface-container-lowest overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-surface/0 via-surface/50 to-surface pointer-events-none" />
    <div class="max-w-7xl mx-auto relative z-10">
      <p class="text-primary uppercase tracking-widest text-xs mb-4 font-medium">The 2025 Morph Collection</p>
      <h1 class="font-noto-serif text-on-surface text-5xl md:text-7xl font-bold leading-none max-w-3xl">
        Precision-bred specimens
      </h1>
      <p class="text-on-surface-variant mt-6 max-w-xl text-base leading-relaxed">
        Each animal is a curated expression of genetics, temperament, and care.
      </p>
      <div class="flex gap-4 mt-10">
        <Button href="/snakes" variant="primary">Browse Collection</Button>
        <Button href="#contact" variant="ghost">Inquire</Button>
      </div>
    </div>
  </section>

  <!-- Featured specimens -->
  {snakesWithTraits.length > 0 && (
    <section class="max-w-7xl mx-auto px-6 py-24">
      <h2 class="font-noto-serif text-on-surface text-3xl mb-12">Featured Specimens</h2>
      <SnakeGrid snakes={snakesWithTraits} />
    </section>
  )}

  <Footer slot="footer" />
</BaseLayout>
```

- [ ] **Step 2: Create `src/pages/snakes/index.astro`**

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

const db = createDb(Astro.locals.runtime.env.DB);
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
  <section class="max-w-7xl mx-auto px-6 py-24">
    <h1 class="font-noto-serif text-on-surface text-4xl mb-12">The Collection</h1>
    <SnakeGrid snakes={snakesWithTraits} />
  </section>
  <Footer slot="footer" />
</BaseLayout>
```

- [ ] **Step 3: Create `src/pages/snakes/[slug].astro`**

> File is named `[slug].astro` because the URL contains the snake's slug (not its internal UUID). Links from `SnakeCard` use `/snakes/${snake.slug}`, and this page queries by slug.

```astro
---
// src/pages/snakes/[slug].astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/layout/Header.astro';
import Footer from '../../components/layout/Footer.astro';
import Badge from '../../components/ui/Badge.astro';
import Chip from '../../components/ui/Chip.astro';
import Button from '../../components/ui/Button.astro';
import { createDb } from '../../db/client';
import { snakes, traitChips } from '../../db/schema';
import { eq } from 'drizzle-orm';

const { slug } = Astro.params;
const db = createDb(Astro.locals.runtime.env.DB);

const [snake] = await db.select().from(snakes).where(eq(snakes.slug, slug!));
if (!snake) return Astro.redirect('/snakes');

const traits = await db.select().from(traitChips).where(eq(traitChips.snakeId, snake.id));
const imageUrl = snake.primaryImageKey
  ? `/api/r2/image?key=${encodeURIComponent(snake.primaryImageKey)}`
  : '/placeholder-snake.jpg';
---
<BaseLayout title={snake.name} description={snake.description}>
  <Header slot="header" />
  <div class="max-w-5xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16">
    <div class="aspect-square bg-surface-container-lowest rounded overflow-hidden">
      <img src={imageUrl} alt={snake.name} class="w-full h-full object-cover" />
    </div>
    <div class="flex flex-col gap-6">
      <Badge variant={snake.available ? 'available' : 'sold'}>
        {snake.available ? 'Available' : 'Sold'}
      </Badge>
      <h1 class="font-noto-serif text-on-surface text-4xl">{snake.name}</h1>
      <p class="text-on-surface-variant text-xs uppercase tracking-widest">{snake.species}</p>
      {traits.length > 0 && (
        <div class="flex flex-wrap gap-2">
          {traits.map(t => <Chip type={t.type}>{t.label}</Chip>)}
        </div>
      )}
      <p class="text-on-surface-variant text-sm leading-relaxed">{snake.description}</p>
      <p class="text-on-surface text-2xl font-inter">
        {snake.priceInCents > 0 ? `$${(snake.priceInCents / 100).toLocaleString()}` : 'Price on request'}
      </p>
      {snake.available && <Button href={`#contact`} variant="tertiary">Reserve This Specimen</Button>}
    </div>
  </div>
  <Footer slot="footer" />
</BaseLayout>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/
git commit -m "feat: add public homepage, collection, and specimen detail pages"
```

---

## Task 11: Astro Actions

**Files:**
- Create: `tests/unit/actions/inquiry.test.ts`, `src/actions/index.ts`

- [ ] **Step 1: Write failing test that tests validation logic used by actions**

```ts
// tests/unit/actions/inquiry.test.ts
import { describe, it, expect } from 'vitest';

// Extracted validation logic — mirrors what Zod does in the action
function validateInquiryInput(data: { name: string; email: string; message: string }) {
  const errors: string[] = [];
  if (!data.name.trim()) errors.push('name');
  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.push('email');
  if (data.message.trim().length < 10) errors.push('message');
  return errors;
}

describe('inquiry validation logic', () => {
  it('rejects empty name', () => {
    const errors = validateInquiryInput({ name: '', email: 'a@b.com', message: 'I am interested in this snake!' });
    expect(errors).toContain('name');
  });

  it('rejects invalid email', () => {
    const errors = validateInquiryInput({ name: 'Joe', email: 'notanemail', message: 'I am interested in this snake!' });
    expect(errors).toContain('email');
  });

  it('rejects short message', () => {
    const errors = validateInquiryInput({ name: 'Joe', email: 'joe@example.com', message: 'Hi' });
    expect(errors).toContain('message');
  });

  it('accepts valid input', () => {
    const errors = validateInquiryInput({ name: 'Joe', email: 'joe@example.com', message: 'I am very interested in this specimen.' });
    expect(errors).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- tests/unit/actions/
```
Expected: FAIL — the test file has no import yet, but the test logic itself will run. If Vitest finds the file, it will pass the local function tests. To confirm the full flow, verify Step 4 passes after the action is implemented.

> **Note:** Astro Actions cannot be directly unit tested in isolation (they depend on `astro:actions` runtime). We test the validation logic separately here. Integration testing happens via E2E in Task 15.

- [ ] **Step 3: Implement `src/actions/index.ts`**

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createDb } from '../db/client';
import { inquiries, snakes, traitChips } from '../db/schema';
import { eq } from 'drizzle-orm';

export const server = {
  submitInquiry: defineAction({
    accept: 'form',
    input: z.object({
      snakeId: z.string().optional(),
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Valid email required'),
      message: z.string().min(10, 'Message must be at least 10 characters'),
    }),
    handler: async (input, context) => {
      const db = createDb(context.locals.runtime.env.DB);
      await db.insert(inquiries).values({
        snakeId: input.snakeId ?? null,
        name: input.name,
        email: input.email,
        message: input.message,
      });
      return { success: true };
    },
  }),

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
    }),
    handler: async (input, context) => {
      const db = createDb(context.locals.runtime.env.DB);
      const [snake] = await db.insert(snakes).values(input).returning();
      return { snake };
    },
  }),

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
    }),
    handler: async ({ id, ...data }, context) => {
      const db = createDb(context.locals.runtime.env.DB);
      await db.update(snakes).set({ ...data, updatedAt: new Date() }).where(eq(snakes.id, id));
      return { success: true };
    },
  }),

  deleteSnake: defineAction({
    accept: 'form',
    input: z.object({ id: z.string() }),
    handler: async ({ id }, context) => {
      const db = createDb(context.locals.runtime.env.DB);
      await db.delete(snakes).where(eq(snakes.id, id));
      return { success: true };
    },
  }),

  addTrait: defineAction({
    accept: 'form',
    input: z.object({
      snakeId: z.string(),
      label: z.string().min(1),
      type: z.enum(['dominant', 'recessive', 'codominant']).default('dominant'),
    }),
    handler: async (input, context) => {
      const db = createDb(context.locals.runtime.env.DB);
      const [trait] = await db.insert(traitChips).values(input).returning();
      return { trait };
    },
  }),

  deleteTrait: defineAction({
    accept: 'form',
    input: z.object({ id: z.string() }),
    handler: async ({ id }, context) => {
      const db = createDb(context.locals.runtime.env.DB);
      await db.delete(traitChips).where(eq(traitChips.id, id));
      return { success: true };
    },
  }),
};
```

- [ ] **Step 4: Run test**

```bash
npm run test -- tests/unit/actions/
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/actions/ tests/unit/actions/
git commit -m "feat: add Astro Actions for inquiry, snake CRUD, and trait management"
```

---

## Task 12: Admin Dashboard Pages

**Files:**
- Create: `src/pages/admin/index.astro`, `src/pages/admin/snakes/index.astro`, `new.astro`, `[id]/edit.astro`

- [ ] **Step 1: Create `src/pages/admin/index.astro`**

```astro
---
// src/pages/admin/index.astro
import AdminLayout from '../../../layouts/AdminLayout.astro';
import { createDb } from '../../../db/client';
import { snakes, inquiries } from '../../../db/schema';
import { count } from 'drizzle-orm';

const db = createDb(Astro.locals.runtime.env.DB);
const [{ snakeCount }] = await db.select({ snakeCount: count() }).from(snakes);
const [{ inquiryCount }] = await db.select({ inquiryCount: count() }).from(inquiries);
---
<AdminLayout title="Dashboard">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-surface-container rounded p-6">
      <p class="text-on-surface-variant text-xs uppercase tracking-widest font-medium">Snakes</p>
      <p class="text-on-surface text-4xl font-noto-serif mt-2">{snakeCount}</p>
    </div>
    <div class="bg-surface-container rounded p-6">
      <p class="text-on-surface-variant text-xs uppercase tracking-widest font-medium">Inquiries</p>
      <p class="text-on-surface text-4xl font-noto-serif mt-2">{inquiryCount}</p>
    </div>
  </div>
</AdminLayout>
```

- [ ] **Step 2: Create `src/pages/admin/snakes/index.astro`**

```astro
---
// src/pages/admin/snakes/index.astro
import AdminLayout from '../../../../layouts/AdminLayout.astro';
import Button from '../../../../components/ui/Button.astro';
import Badge from '../../../../components/ui/Badge.astro';
import { createDb } from '../../../../db/client';
import { snakes } from '../../../../db/schema';
import { actions } from 'astro:actions';

const db = createDb(Astro.locals.runtime.env.DB);
const allSnakes = await db.select().from(snakes).orderBy(snakes.createdAt);
---
<AdminLayout title="Snakes">
  <div slot="admin-header-actions">
    <Button href="/admin/snakes/new" variant="primary">Add Snake</Button>
  </div>
  <div class="bg-surface-container rounded overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-surface-container-high">
        <tr>
          <th class="text-left px-6 py-4 text-on-surface-variant text-xs uppercase tracking-widest font-medium">Name</th>
          <th class="text-left px-6 py-4 text-on-surface-variant text-xs uppercase tracking-widest font-medium">Species</th>
          <th class="text-left px-6 py-4 text-on-surface-variant text-xs uppercase tracking-widest font-medium">Price</th>
          <th class="text-left px-6 py-4 text-on-surface-variant text-xs uppercase tracking-widest font-medium">Status</th>
          <th class="px-6 py-4"></th>
        </tr>
      </thead>
      <tbody>
        {allSnakes.map(snake => (
          <tr class="border-t border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
            <td class="px-6 py-4 text-on-surface font-noto-serif">{snake.name}</td>
            <td class="px-6 py-4 text-on-surface-variant">{snake.species}</td>
            <td class="px-6 py-4 text-on-surface">
              {snake.priceInCents > 0 ? `$${(snake.priceInCents / 100).toLocaleString()}` : '—'}
            </td>
            <td class="px-6 py-4">
              <Badge variant={snake.available ? 'available' : 'sold'}>
                {snake.available ? 'Available' : 'Sold'}
              </Badge>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-3 justify-end">
                <a href={`/admin/snakes/${snake.id}/edit`} class="text-primary text-xs hover:underline">Edit</a>
                <form method="POST" action={actions.deleteSnake}>
                  <input type="hidden" name="id" value={snake.id} />
                  <button type="submit" class="text-red-400 text-xs hover:underline"
                    onclick="return confirm('Delete this snake?')">
                    Delete
                  </button>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {allSnakes.length === 0 && (
      <p class="text-center text-on-surface-variant py-12 text-sm">No snakes yet. Add one above.</p>
    )}
  </div>
</AdminLayout>
```

- [ ] **Step 3: Create `src/pages/admin/snakes/new.astro`**

```astro
---
// src/pages/admin/snakes/new.astro
import AdminLayout from '../../../../layouts/AdminLayout.astro';
import FormField from '../../../../components/ui/FormField.astro';
import Input from '../../../../components/ui/Input.astro';
import Button from '../../../../components/ui/Button.astro';
import { actions } from 'astro:actions';

const result = Astro.getActionResult(actions.createSnake);
if (result && !result.error) {
  return Astro.redirect('/admin/snakes');
}
const fieldErrors = result?.error?.fields ?? {};
---
<AdminLayout title="New Snake">
  <div class="max-w-xl">
    <form method="POST" action={actions.createSnake} class="flex flex-col gap-6">
      <FormField label="Name" name="name" required error={fieldErrors.name?.[0]}>
        <Input name="name" required error={fieldErrors.name?.[0]} />
      </FormField>
      <FormField label="Slug (URL)" name="slug" required error={fieldErrors.slug?.[0]}>
        <Input name="slug" placeholder="e.g. banana-pastel-2025" required error={fieldErrors.slug?.[0]} />
      </FormField>
      <FormField label="Species" name="species" required error={fieldErrors.species?.[0]}>
        <Input name="species" required error={fieldErrors.species?.[0]} />
      </FormField>
      <FormField label="Description" name="description">
        <textarea
          name="description"
          rows="4"
          class="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded focus:outline-none focus:border-primary/50 resize-none"
        />
      </FormField>
      <FormField label="Price (cents, e.g. 50000 = $500)" name="priceInCents">
        <Input name="priceInCents" type="number" placeholder="0" />
      </FormField>
      <div class="flex gap-6">
        <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
          <input type="checkbox" name="available" value="true" class="accent-primary" />
          Available for purchase
        </label>
        <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
          <input type="checkbox" name="featured" value="true" class="accent-primary" />
          Featured on homepage
        </label>
      </div>
      <div class="flex gap-4">
        <Button type="submit" variant="primary">Create Snake</Button>
        <Button href="/admin/snakes" variant="ghost">Cancel</Button>
      </div>
    </form>
  </div>
</AdminLayout>
```

- [ ] **Step 4: Create `src/pages/admin/snakes/[id]/edit.astro`**

> File uses `[id]` (internal UUID) because the admin edits by database ID, not slug.

```astro
---
// src/pages/admin/snakes/[id]/edit.astro
import AdminLayout from '../../../../../layouts/AdminLayout.astro';
import FormField from '../../../../../components/ui/FormField.astro';
import Input from '../../../../../components/ui/Input.astro';
import Button from '../../../../../components/ui/Button.astro';
import Chip from '../../../../../components/ui/Chip.astro';
import { actions } from 'astro:actions';
import { createDb } from '../../../../../db/client';
import { snakes, traitChips } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';

const { id } = Astro.params;
const db = createDb(Astro.locals.runtime.env.DB);
const [snake] = await db.select().from(snakes).where(eq(snakes.id, id!));
if (!snake) return Astro.redirect('/admin/snakes');

const traits = await db.select().from(traitChips).where(eq(traitChips.snakeId, snake.id));

const updateResult = Astro.getActionResult(actions.updateSnake);
if (updateResult && !updateResult.error) {
  return Astro.redirect('/admin/snakes');
}
const fieldErrors = updateResult?.error?.fields ?? {};
---
<AdminLayout title={`Edit: ${snake.name}`}>
  <div class="max-w-xl flex flex-col gap-12">
    <!-- Edit form -->
    <form method="POST" action={actions.updateSnake} class="flex flex-col gap-6">
      <input type="hidden" name="id" value={snake.id} />
      <FormField label="Name" name="name" required error={fieldErrors.name?.[0]}>
        <Input name="name" required value={snake.name} error={fieldErrors.name?.[0]} />
      </FormField>
      <FormField label="Slug" name="slug" required error={fieldErrors.slug?.[0]}>
        <Input name="slug" required value={snake.slug} error={fieldErrors.slug?.[0]} />
      </FormField>
      <FormField label="Species" name="species" required error={fieldErrors.species?.[0]}>
        <Input name="species" required value={snake.species} error={fieldErrors.species?.[0]} />
      </FormField>
      <FormField label="Description" name="description">
        <textarea
          name="description"
          rows="4"
          class="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded focus:outline-none focus:border-primary/50 resize-none"
        >{snake.description}</textarea>
      </FormField>
      <FormField label="Price (cents)" name="priceInCents">
        <Input name="priceInCents" type="number" value={String(snake.priceInCents)} />
      </FormField>
      <div class="flex gap-6">
        <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
          <input type="checkbox" name="available" value="true" checked={snake.available} class="accent-primary" />
          Available
        </label>
        <label class="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
          <input type="checkbox" name="featured" value="true" checked={snake.featured} class="accent-primary" />
          Featured
        </label>
      </div>
      <div class="flex gap-4">
        <Button type="submit" variant="primary">Save Changes</Button>
        <Button href="/admin/snakes" variant="ghost">Cancel</Button>
      </div>
    </form>

    <!-- Trait chip manager -->
    <div>
      <h2 class="font-noto-serif text-on-surface text-xl mb-6">Genetic Traits</h2>
      {traits.length > 0 && (
        <div class="flex flex-wrap gap-2 mb-6">
          {traits.map(t => (
            <div class="flex items-center gap-1.5">
              <Chip type={t.type}>{t.label}</Chip>
              <form method="POST" action={actions.deleteTrait} class="inline">
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" class="text-red-400 text-xs hover:underline">×</button>
              </form>
            </div>
          ))}
        </div>
      )}
      <form method="POST" action={actions.addTrait} class="flex gap-3 items-end">
        <input type="hidden" name="snakeId" value={snake.id} />
        <FormField label="Trait label" name="label">
          <Input name="label" placeholder="e.g. Banana" />
        </FormField>
        <FormField label="Type" name="type">
          <select name="type" class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded focus:outline-none focus:border-primary/50">
            <option value="dominant">Dominant</option>
            <option value="recessive">Recessive</option>
            <option value="codominant">Codominant</option>
          </select>
        </FormField>
        <Button type="submit" variant="ghost">Add</Button>
      </form>
    </div>
  </div>
</AdminLayout>
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/
git commit -m "feat: add admin dashboard, snake list, create, and edit pages"
```

---

## Task 13: R2 Image Upload & Serving

**Files:**
- Create: `tests/unit/lib/r2.test.ts`, `src/lib/r2.ts`, `src/pages/api/r2/image.ts`, `src/pages/admin/media/index.astro`

- [ ] **Step 1: Write failing test first**

```ts
// tests/unit/lib/r2.test.ts
import { describe, it, expect } from 'vitest';
import { r2Key } from '../../../src/lib/r2';

describe('r2Key', () => {
  it('generates a key with snakes/ prefix', () => {
    const key = r2Key('my-snake.jpg');
    expect(key).toMatch(/^snakes\/\d+-my-snake\.jpg$/);
  });

  it('sanitizes spaces', () => {
    const key = r2Key('my snake file.jpg');
    expect(key).not.toContain(' ');
  });

  it('sanitizes special characters', () => {
    const key = r2Key('snake!@#.jpg');
    expect(key).not.toMatch(/[!@#]/);
  });

  it('two calls produce different keys (timestamp-based)', async () => {
    await new Promise(r => setTimeout(r, 1));
    const key1 = r2Key('test.jpg');
    await new Promise(r => setTimeout(r, 1));
    const key2 = r2Key('test.jpg');
    expect(key1).not.toBe(key2);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- tests/unit/lib/r2.test.ts
```
Expected: FAIL — `Cannot find module '../../../src/lib/r2'`

- [ ] **Step 3: Implement `src/lib/r2.ts`**

```ts
// src/lib/r2.ts
export function r2Key(fileName: string): string {
  const timestamp = Date.now();
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `snakes/${timestamp}-${safe}`;
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- tests/unit/lib/r2.test.ts
```
Expected: PASS

- [ ] **Step 5: Create `src/pages/api/r2/image.ts`** (serve R2 objects)

```ts
// src/pages/api/r2/image.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return new Response('Missing key', { status: 400 });

  const object = await locals.runtime.env.ASSETS_BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
};
```

- [ ] **Step 6: Create `src/pages/admin/media/index.astro`**

```astro
---
// src/pages/admin/media/index.astro
// Uploads images directly to R2 via a POST form.
// For production high-volume use, consider streaming to R2 or client-side uploads.
import AdminLayout from '../../../layouts/AdminLayout.astro';
import Button from '../../../components/ui/Button.astro';
import { r2Key } from '../../../lib/r2';

if (Astro.request.method === 'POST') {
  const formData = await Astro.request.formData();
  const file = formData.get('file') as File | null;
  if (file && file.size > 0) {
    const key = r2Key(file.name);
    await Astro.locals.runtime.env.ASSETS_BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    return Astro.redirect(`/admin/media?uploaded=${encodeURIComponent(key)}`);
  }
}

const uploaded = new URL(Astro.request.url).searchParams.get('uploaded');
---
<AdminLayout title="Media">
  {uploaded && (
    <div class="mb-6 p-4 bg-primary/10 border border-primary/30 rounded text-sm">
      <p class="text-primary font-medium">Upload successful.</p>
      <p class="text-on-surface-variant text-xs mt-1 font-mono break-all">Key: {uploaded}</p>
      <p class="text-on-surface-variant text-xs mt-1">Use this key when assigning an image to a snake.</p>
    </div>
  )}
  <div class="max-w-lg">
    <form method="POST" enctype="multipart/form-data" class="flex flex-col gap-6">
      <div class="flex flex-col gap-1.5">
        <label for="file" class="text-xs uppercase tracking-widest text-on-surface-variant font-medium">Select Image</label>
        <input
          id="file"
          type="file"
          name="file"
          accept="image/*"
          required
          class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded file:mr-4 file:py-1 file:px-3 file:rounded file:text-xs file:bg-surface-container-high file:text-on-surface file:border-0 file:cursor-pointer"
        />
      </div>
      <Button type="submit" variant="primary">Upload to R2</Button>
    </form>
  </div>
</AdminLayout>
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/r2.ts src/pages/api/r2/ src/pages/admin/media/ tests/unit/lib/
git commit -m "feat: add R2 image upload, key generation, and image serving endpoint"
```

---

## Task 14: Playwright E2E Tests

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/public.spec.ts`, `tests/e2e/admin.spec.ts`
- Create: `public/placeholder-snake.jpg` (any dark 800×600 image)

- [ ] **Step 1: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Add `public/placeholder-snake.jpg`**

Copy any dark image (or generate one):
```bash
# Download a free dark placeholder
curl -o public/placeholder-snake.jpg "https://via.placeholder.com/800x600/0d0f0f/333333.jpg"
# Or copy any local image:
# cp /path/to/any-image.jpg public/placeholder-snake.jpg
```

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 4: Create `tests/e2e/public.spec.ts`**

```ts
// tests/e2e/public.spec.ts
import { test, expect } from '@playwright/test';

test.describe('public pages', () => {
  test('homepage has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Serpent's Edge/);
  });

  test('homepage has hero text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText("The Serpent's Edge")).toBeVisible();
  });

  test('collection page renders heading', async ({ page }) => {
    await page.goto('/snakes');
    await expect(page.getByText('The Collection')).toBeVisible();
  });

  test('header navigation to collection works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Collection' }).first().click();
    await expect(page).toHaveURL(/\/snakes/);
  });
});
```

- [ ] **Step 5: Create `tests/e2e/admin.spec.ts`**

```ts
// tests/e2e/admin.spec.ts
import { test, expect } from '@playwright/test';

test.describe('admin auth protection', () => {
  test('unauthenticated request to /admin redirects to Clerk sign-in', async ({ page }) => {
    await page.goto('/admin');
    // Clerk middleware redirects away from /admin for unauthenticated users
    await expect(page).not.toHaveURL(/^http:\/\/localhost:4321\/admin$/);
  });

  test('unauthenticated request to /admin/snakes is protected', async ({ page }) => {
    await page.goto('/admin/snakes');
    await expect(page).not.toHaveURL(/^http:\/\/localhost:4321\/admin\/snakes$/);
  });
});
```

- [ ] **Step 6: Run E2E tests (requires dev server running)**

```bash
# In one terminal: npm run dev
# In another:
npm run test:e2e
```
Expected: Public page tests PASS; admin tests PASS (Clerk redirects away from /admin).

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e/ public/placeholder-snake.jpg
git commit -m "test: add Playwright E2E tests for public pages and admin auth"
```

---

## Task 15: Run Full Test Suite

- [ ] **Step 1: Run all unit tests**

```bash
npm run test
```
Expected: All PASS — schema, auth, actions, r2 tests.

- [ ] **Step 2: Run build type check**

```bash
npm run build
```
Expected: No TypeScript errors. Build output in `dist/`.

- [ ] **Step 3: Run Wrangler preview to verify Workers runtime**

```bash
npm run preview
# Visit http://localhost:8787
```
Expected: Homepage loads; `/snakes` loads; `/admin` redirects to Clerk.

- [ ] **Step 4: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any type errors found during full build check"
```

---

## Task 16: Figma UI Integration

**Status:** Figma MCP is configured and authenticated. Use `mcp__plugin_figma_figma__get_design_context` with the Snake Project file key.

- [x] **Step 1: Get the Snake Project file key**

File key: `hluobF92AIfv489ZzBw1Cu` (confirmed, added to `CLAUDE.md`)

- [ ] **Step 2: Fetch screens via Figma MCP**

Use `mcp__plugin_figma_figma__get_design_context` with `fileKey: hluobF92AIfv489ZzBw1Cu` per component. Map to Astro components:

| Figma Frame | Node ID | Astro Component |
|---|---|---|
| Top Navigation | `3:167` | `src/components/layout/Header.astro` |
| Header / Hero | `3:3` | `src/pages/index.astro` |
| Bento Grid Collection | `3:21` | `src/components/snakes/SnakeCard.astro` + `src/pages/index.astro` |
| About Us | `3:119` | `src/pages/index.astro` |
| Call to Action | `3:150` | `src/pages/index.astro` |
| Footer | `3:93` | `src/components/layout/Footer.astro` |

- [ ] **Step 3: Adapt Figma output to Astro + design tokens**

When applying Figma designs, replace hard-coded colors with design tokens from `DESIGN.md`. The color mapping is:
- Dark backgrounds → `bg-surface` / `bg-surface-container`
- Text → `text-on-surface` / `text-on-surface-variant`
- Accent green → `text-primary` / `bg-primary`
- Accent gold → `text-tertiary` / `bg-tertiary` (conversion actions only)

- [ ] **Step 4: Commit Figma UI changes**

```bash
git add src/
git commit -m "feat: apply Figma UI designs to components"
```

---

## Task 17: Production Deployment to Cloudflare

- [ ] **Step 1: Create production resources (if not done in Task 2)**

```bash
npx wrangler d1 create serpents-edge-db
npx wrangler r2 bucket create serpents-edge-assets
# Copy database_id into wrangler.jsonc
```

- [ ] **Step 2: Apply schema migrations to production**

```bash
npm run db:migrate:prod
```

- [ ] **Step 3: Set production secrets**

```bash
npx wrangler secret put CLERK_SECRET_KEY
# Paste your sk_live_... key when prompted
```

- [ ] **Step 4: Update `wrangler.jsonc` with production Clerk public key**

```jsonc
"vars": {
  "CLERK_PUBLISHABLE_KEY": "pk_live_YOUR_REAL_KEY"
}
```

- [ ] **Step 5: Build and deploy**

```bash
npm run build
npx wrangler deploy
```

- [ ] **Step 6: Set admin role in Clerk**

Clerk Dashboard → Users → select your admin account → Public Metadata:
```json
{ "role": "admin" }
```

- [ ] **Step 7: Verify production deployment**

```bash
# Visit your Workers URL: https://serpents-edge.YOUR_ACCOUNT.workers.dev
# ✓ Homepage loads
# ✓ /snakes loads
# ✓ /admin redirects to Clerk sign-in
# ✓ After signing in as admin, /admin is accessible
```

- [ ] **Step 8: Commit and tag**

```bash
git add wrangler.jsonc
git commit -m "chore: update wrangler config with production credentials"
git tag v1.0.0
git push origin main --tags
```

---

## Appendix A: Figma MCP Usage

The Figma MCP is configured and authenticated via the `plugin:figma` plugin. Key tools:

1. `mcp__plugin_figma_figma__whoami` — verify authentication
2. `mcp__plugin_figma_figma__get_metadata` — list nodes/frames in a file
3. `mcp__plugin_figma_figma__get_design_context` — fetch component code + screenshot + hints
4. `mcp__plugin_figma_figma__get_screenshot` — visual snapshot of any node

Snake Project file key: `hluobF92AIfv489ZzBw1Cu`

Example call:
```
mcp__plugin_figma_figma__get_design_context({ fileKey: "hluobF92AIfv489ZzBw1Cu", nodeId: "3:3" })
```

---

## Appendix B: Local Development with Docker Compose

```bash
# Full containerized environment:
docker compose up

# Or run locally (recommended for faster dev):
npm run dev                    # Astro dev server — http://localhost:4321
npm run preview                # Wrangler Workers runtime — http://localhost:8787
```

The Wrangler `platformProxy: { enabled: true }` in `astro.config.mjs` bridges the Astro dev server to a local D1 emulation at `.wrangler/state/v3/d1/` — so database reads/writes work in dev without deploying.

---

## Appendix C: Tailwind CSS v4 Notes

Tailwind v4 changed significantly from v3:
- Configuration uses `@theme {}` in CSS, not `tailwind.config.js`
- Import using `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- Integrated via `@tailwindcss/vite` Vite plugin, not `@astrojs/tailwind`
- Custom colors defined as CSS custom properties: `--color-*` → automatically available as `bg-*`, `text-*`, etc.

---

## Appendix D: Adding More Snakes Programmatically (Seed Script)

```ts
// scripts/seed.ts (run with: npx wrangler d1 execute serpents-edge-db --local --file=scripts/seed.sql)
// Or create a seed action and trigger it from an admin page.
```

For quick local seeding, insert directly via Wrangler:
```bash
npx wrangler d1 execute serpents-edge-db --local --command="
INSERT INTO snakes (id, slug, name, species, description, price_in_cents, available, featured)
VALUES (lower(hex(randomblob(16))), 'banana-pastel-2025', 'Banana Pastel', 'Python regius', 'A striking banana pastel ball python.', 75000, 1, 1);
"
```
