# Astro 6 Polish: Live Collections, Schema Expansion & DX Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `Astro.locals.runtime` TypeScript error, migrate to Astro 6 live content collections backed by Cloudflare D1, expand the snakes schema to cover all Edit Specimen fields, extract reusable form components, purge unused assets, and seed the local database with demo data.

**Architecture:** All Cloudflare binding access migrates from `Astro.locals.runtime.env.*` to `import { env } from 'cloudflare:workers'` — the Astro 6 / `@astrojs/cloudflare` v13 pattern. A custom D1 live loader wraps Drizzle queries so pages consume snakes through `getLiveCollection` / `getLiveEntry` instead of raw Drizzle. Schema gains five new columns (sex, hatchDate, weightGrams, lengthCm, generation) and a `snakeImages` table for gallery management. Reusable `Textarea`, `Select`, and `FileInput` components replace inline HTML in forms.

**Tech Stack:** Astro 6, `@astrojs/cloudflare` v13, `cloudflare:workers`, Drizzle ORM + D1, `astro/zod` (Zod 4), Vitest, Playwright.

---

## File Structure — what changes

```
snake-project/
├── src/
│   ├── content.config.ts          DELETE — replaced by live.config.ts
│   ├── live.config.ts             NEW — defineLiveCollection for snakes
│   ├── loaders/
│   │   └── snakes-loader.ts       NEW — LiveLoader backed by Drizzle/D1
│   ├── env.d.ts                   MODIFY — remove Runtime<Env> augmentation
│   ├── actions/index.ts           MODIFY — cloudflare:workers env + new schema fields
│   ├── db/
│   │   ├── schema.ts              MODIFY — add sex, hatchDate, weightGrams, lengthCm, generation, snakeImages table
│   │   └── migrations/            ADD — 0001 migration for new columns + table
│   ├── components/ui/
│   │   ├── Textarea.astro         NEW
│   │   ├── Select.astro           NEW
│   │   └── FileInput.astro        NEW
│   ├── pages/
│   │   ├── index.astro            MODIFY — cloudflare:workers env + getLiveCollection
│   │   ├── snakes/
│   │   │   ├── index.astro        MODIFY — cloudflare:workers env + getLiveCollection
│   │   │   └── [slug].astro       MODIFY — cloudflare:workers env + getLiveEntry
│   │   ├── admin/
│   │   │   ├── snakes/
│   │   │   │   ├── index.astro    MODIFY — cloudflare:workers env
│   │   │   │   ├── new.astro      MODIFY — new fields + new components
│   │   │   │   └── [id]/edit.astro MODIFY — new fields + new components + image gallery
│   │   │   └── media/index.astro  MODIFY — cloudflare:workers env + FileInput component
│   │   └── api/r2/image.ts        MODIFY — cloudflare:workers env
├── scripts/
│   └── seed.sql                   NEW — demo snakes, traits, images for local dev
├── src/assets/                    DELETE all 5 blog-placeholder-*.jpg files
└── public/fonts/                  DELETE atkinson-bold.woff + atkinson-regular.woff
```

---

## Task 1: Fix `runtime` TypeScript Error — Migrate to `cloudflare:workers`

The `runtime does not exist on type 'Locals'` error occurs because `@astrojs/cloudflare` v13 no longer injects a `runtime` object into `App.Locals`. The correct pattern in Astro 6 is `import { env } from 'cloudflare:workers'`.

**Files:**
- Modify: `src/env.d.ts`
- Modify: `src/db/client.ts`
- Modify: `src/actions/index.ts`
- Modify: `src/pages/api/r2/image.ts`
- Modify: `src/pages/admin/media/index.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/snakes/index.astro`
- Modify: `src/pages/snakes/[slug].astro`
- Modify: `src/pages/admin/snakes/index.astro`
- Modify: `src/pages/admin/snakes/[id]/edit.astro`

- [ ] **Step 1: Run `wrangler types` to generate typed binding definitions**

This generates a `worker-configuration.d.ts` (or updates `.cloudflare/`) that gives TypeScript full knowledge of your D1 and R2 binding shapes. Run it once now and re-run it if you add new bindings to `wrangler.jsonc`.

```bash
npx wrangler types
```

Expected: Outputs something like `✓ Wrote 1 interface to worker-configuration.d.ts`. Check the file in — it defines `interface Env { DB: D1Database; ASSETS_BUCKET: R2Bucket; ... }` which the `cloudflare:workers` module uses for typing.

- [ ] **Step 2: Update `src/env.d.ts`**

Remove the `Runtime<Env>` augmentation — `cloudflare:workers` now provides typed access via the generated `worker-configuration.d.ts`.

```typescript
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

// Cloudflare Workers bindings are accessed via `import { env } from 'cloudflare:workers'`
// Binding types are provided by the generated worker-configuration.d.ts (run: wrangler types)

declare namespace App {
  interface Locals {
    // Add any custom locals here (Clerk adds its own via the integration)
  }
}
```

- [ ] **Step 3: Update `src/db/client.ts` to accept `env` directly**

```typescript
// src/db/client.ts
import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof createDb>;
```

No change to the function signature — callers will now pass `env.DB` from `cloudflare:workers` instead of `Astro.locals.runtime.env.DB`.

- [ ] **Step 4: Update `src/pages/api/r2/image.ts`**

```typescript
// src/pages/api/r2/image.ts
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return new Response('Missing key', { status: 400 });

  const object = await (env as { ASSETS_BUCKET: R2Bucket }).ASSETS_BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
};
```

- [ ] **Step 5: Update `src/actions/index.ts` — replace `context.locals.runtime.env.*`**

Replace every `context.locals.runtime.env.DB` with:

```typescript
import { env } from 'cloudflare:workers';
// ...
const db = createDb((env as { DB: D1Database }).DB);
```

The full updated file:

```typescript
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';
import { createDb } from '../db/client';
import { inquiries, snakes, traitChips } from '../db/schema';
import { eq } from 'drizzle-orm';

function getDb() {
  return createDb((env as unknown as { DB: D1Database }).DB);
}

export const server = {
  submitInquiry: defineAction({
    accept: 'form',
    input: z.object({
      snakeId: z.string().optional(),
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Valid email required'),
      message: z.string().min(10, 'Message must be at least 10 characters'),
    }),
    handler: async (input) => {
      const db = getDb();
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
      sex: z.enum(['male', 'female', 'unknown']).default('unknown'),
      hatchDate: z.string().optional(),
      weightGrams: z.coerce.number().int().min(0).optional(),
      lengthCm: z.coerce.number().int().min(0).optional(),
      generation: z.enum(['CB', 'CBB', 'WC', 'LTC', 'F1', 'F2']).default('CB'),
    }),
    handler: async (input) => {
      const db = getDb();
      const [snake] = await db.insert(snakes).values({
        ...input,
        hatchDate: input.hatchDate ? new Date(input.hatchDate) : null,
      }).returning();
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
      sex: z.enum(['male', 'female', 'unknown']).default('unknown'),
      hatchDate: z.string().optional(),
      weightGrams: z.coerce.number().int().min(0).optional(),
      lengthCm: z.coerce.number().int().min(0).optional(),
      generation: z.enum(['CB', 'CBB', 'WC', 'LTC', 'F1', 'F2']).default('CB'),
    }),
    handler: async ({ id, hatchDate, ...data }) => {
      const db = getDb();
      await db.update(snakes)
        .set({ ...data, hatchDate: hatchDate ? new Date(hatchDate) : null, updatedAt: new Date() })
        .where(eq(snakes.id, id));
      return { success: true };
    },
  }),

  deleteSnake: defineAction({
    accept: 'form',
    input: z.object({ id: z.string() }),
    handler: async ({ id }) => {
      const db = getDb();
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
    handler: async (input) => {
      const db = getDb();
      const [trait] = await db.insert(traitChips).values(input).returning();
      return { trait };
    },
  }),

  deleteTrait: defineAction({
    accept: 'form',
    input: z.object({ id: z.string() }),
    handler: async ({ id }) => {
      const db = getDb();
      await db.delete(traitChips).where(eq(traitChips.id, id));
      return { success: true };
    },
  }),

  addSnakeImage: defineAction({
    accept: 'form',
    input: z.object({
      snakeId: z.string(),
      imageKey: z.string().min(1),
      isPrimary: z.coerce.boolean().default(false),
    }),
    handler: async ({ snakeId, imageKey, isPrimary }) => {
      const db = getDb();
      const existing = await db.select().from(snakeImages).where(eq(snakeImages.snakeId, snakeId));
      const sortOrder = existing.length;
      const [image] = await db.insert(snakeImages).values({ snakeId, imageKey, sortOrder }).returning();
      if (isPrimary || existing.length === 0) {
        await db.update(snakes).set({ primaryImageKey: imageKey }).where(eq(snakes.id, snakeId));
      }
      return { image };
    },
  }),

  deleteSnakeImage: defineAction({
    accept: 'form',
    input: z.object({ id: z.string(), snakeId: z.string() }),
    handler: async ({ id, snakeId }) => {
      const db = getDb();
      const [deleted] = await db.delete(snakeImages).where(eq(snakeImages.id, id)).returning();
      // If the deleted image was primary, promote the next image
      const [snake] = await db.select().from(snakes).where(eq(snakes.id, snakeId));
      if (snake?.primaryImageKey === deleted?.imageKey) {
        const remaining = await db.select().from(snakeImages)
          .where(eq(snakeImages.snakeId, snakeId))
          .orderBy(snakeImages.sortOrder)
          .limit(1);
        await db.update(snakes)
          .set({ primaryImageKey: remaining[0]?.imageKey ?? null })
          .where(eq(snakes.id, snakeId));
      }
      return { success: true };
    },
  }),

  setPrimaryImage: defineAction({
    accept: 'form',
    input: z.object({ snakeId: z.string(), imageKey: z.string() }),
    handler: async ({ snakeId, imageKey }) => {
      const db = getDb();
      await db.update(snakes).set({ primaryImageKey: imageKey }).where(eq(snakes.id, snakeId));
      return { success: true };
    },
  }),
};
```

Note: `snakeImages` import will be added in Task 2.

- [ ] **Step 6: Update the five Astro pages that use `Astro.locals.runtime.env.DB`**

In each page, replace:
```typescript
const db = createDb(Astro.locals.runtime.env.DB);
```
With:
```typescript
import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';
// ...
const db = createDb((env as unknown as { DB: D1Database }).DB);
```

Pages to update: `src/pages/index.astro`, `src/pages/snakes/index.astro`, `src/pages/snakes/[slug].astro`, `src/pages/admin/snakes/index.astro`, `src/pages/admin/snakes/[id]/edit.astro`

- [ ] **Step 7: Update `src/pages/admin/media/index.astro`**

Replace `Astro.locals.runtime.env.ASSETS_BUCKET` with:
```typescript
import { env } from 'cloudflare:workers';
import type { R2Bucket } from '@cloudflare/workers-types';
// ...
await (env as unknown as { ASSETS_BUCKET: R2Bucket }).ASSETS_BUCKET.put(key, await file.arrayBuffer(), {
  httpMetadata: { contentType: file.type },
});
```

- [ ] **Step 8: Write a test for the env migration**

```typescript
// tests/unit/lib/env-pattern.test.ts
import { describe, it, expect } from 'vitest';

// Verify the cloudflare:workers import pattern is used — no runtime.env references
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function scanFiles(dir: string, ext: string[]): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...scanFiles(full, ext));
    } else if (entry.isFile() && ext.some(e => full.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

describe('cloudflare:workers env migration', () => {
  it('no source file uses locals.runtime.env', () => {
    const src = join(process.cwd(), 'src');
    const files = scanFiles(src, ['.ts', '.astro']);
    const violations = files.filter(f => readFileSync(f, 'utf-8').includes('locals.runtime'));
    expect(violations, `Files still using locals.runtime: ${violations.join(', ')}`).toHaveLength(0);
  });
});
```

- [ ] **Step 9: Run tests**

```bash
npm run test
```

Expected: `cloudflare:workers env migration > no source file uses locals.runtime.env` PASSES

- [ ] **Step 10: Build check**

```bash
npm run build
```

Expected: No TypeScript errors about `runtime` not existing on type `Locals`.

- [ ] **Step 11: Commit**

```bash
git add src/env.d.ts src/db/client.ts src/actions/index.ts src/pages/api/r2/image.ts \
  src/pages/admin/media/index.astro src/pages/index.astro src/pages/snakes/index.astro \
  src/pages/snakes/\[slug\].astro src/pages/admin/snakes/index.astro \
  src/pages/admin/snakes/\[id\]/edit.astro tests/unit/lib/env-pattern.test.ts
git commit -m "fix: migrate from locals.runtime to cloudflare:workers env (Astro 6 / @astrojs/cloudflare v13)"
```

---

## Task 2: Expand Schema for Full Edit Specimen Support

> **Do Task 2 (this task) before Task 3.** Task 3's live loader references schema columns added here; if you do Task 3 first the build will fail.

The current schema is missing fields the Edit Specimen page needs: biological attributes and a multi-image gallery.

**Files:**
- Modify: `src/db/schema.ts`
- Add: `src/db/migrations/0001_specimen_fields.sql` (generated by drizzle-kit)

- [ ] **Step 1: Write failing test for new schema columns**

```typescript
// tests/unit/db/schema.test.ts — add to existing describe block
it('snake table has biological fields', () => {
  expect(snakes.sex).toBeDefined();
  expect(snakes.hatchDate).toBeDefined();
  expect(snakes.weightGrams).toBeDefined();
  expect(snakes.lengthCm).toBeDefined();
  expect(snakes.generation).toBeDefined();
});

it('snakeImages table exists and references snake', () => {
  // Import snakeImages in test file header: import { ..., snakeImages } from '../../../src/db/schema';
  expect(snakeImages).toBeDefined();
  expect(snakeImages.snakeId).toBeDefined();
  expect(snakeImages.imageKey).toBeDefined();
  expect(snakeImages.sortOrder).toBeDefined();
});
```

- [ ] **Step 2: Run to verify failures**

```bash
npm run test -- tests/unit/db/schema.test.ts
```

Expected: FAIL — `snakes.sex` and `snakeImages` are undefined

- [ ] **Step 3: Update `src/db/schema.ts`**

```typescript
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
  sex: text('sex', { enum: ['male', 'female', 'unknown'] }).notNull().default('unknown'),
  hatchDate: integer('hatch_date', { mode: 'timestamp' }),
  weightGrams: integer('weight_grams'),
  lengthCm: integer('length_cm'),
  generation: text('generation', { enum: ['CB', 'CBB', 'WC', 'LTC', 'F1', 'F2'] }).notNull().default('CB'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const snakeImages = sqliteTable('snake_images', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  snakeId: text('snake_id')
    .notNull()
    .references(() => snakes.id, { onDelete: 'cascade' }),
  imageKey: text('image_key').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
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
export type SnakeImage = typeof snakeImages.$inferSelect;
export type TraitChip = typeof traitChips.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
```

- [ ] **Step 4: Update the import in the test file**

In `tests/unit/db/schema.test.ts`, add `snakeImages` to the import line:
```typescript
import { snakes, traitChips, inquiries, snakeImages } from '../../../src/db/schema';
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test -- tests/unit/db/schema.test.ts
```

Expected: PASS

- [ ] **Step 6: Generate the migration**

```bash
npm run db:generate
```

Expected: Creates `src/db/migrations/0001_specimen_fields.sql` with ALTER TABLE statements.

- [ ] **Step 7: Apply migration locally**

```bash
npm run db:migrate
```

Expected: Applied to local D1 SQLite file. No errors.

- [ ] **Step 8: Also add `snakeImages` import to `src/actions/index.ts`**

The `addSnakeImage`, `deleteSnakeImage`, and `setPrimaryImage` actions added in Task 1 reference `snakeImages`. Add to imports at top of file:
```typescript
import { inquiries, snakes, traitChips, snakeImages } from '../db/schema';
```

- [ ] **Step 9: Commit**

```bash
git add src/db/schema.ts src/db/migrations/ src/actions/index.ts tests/unit/db/schema.test.ts
git commit -m "feat: expand snakes schema with biological fields and snake_images gallery table"
```

---

## Task 3: Create Live Content Collections for Snakes

> **Requires Task 2 to be complete first** — the live loader references `sex`, `hatchDate`, etc. which Task 2 adds to the schema.

Replace the defunct `src/content.config.ts` (which incorrectly defined a build-time `type: 'data'` collection) with Astro 6 live collections backed by the D1 live loader.

**Files:**
- Create: `src/loaders/snakes-loader.ts`
- Create: `src/live.config.ts`
- Delete: `src/content.config.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/snakes/index.astro`
- Modify: `src/pages/snakes/[slug].astro`

- [ ] **Step 1: Write failing test for the live loader**

```typescript
// tests/unit/loaders/snakes-loader.test.ts
import { describe, it, expect, vi } from 'vitest';

// The live loader shape contract: must expose name, loadCollection, loadEntry
describe('snakes live loader shape', () => {
  it('exports a function that returns a loader with required methods', async () => {
    // Dynamic import so the cloudflare:workers mock is in place before import
    const { snakesLoader } = await import('../../../src/loaders/snakes-loader');
    const loader = snakesLoader();
    expect(loader.name).toBe('snakes-loader');
    expect(typeof loader.loadCollection).toBe('function');
    expect(typeof loader.loadEntry).toBe('function');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test -- tests/unit/loaders/snakes-loader.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `src/loaders/snakes-loader.ts`**

```typescript
// src/loaders/snakes-loader.ts
import type { LiveLoader } from 'astro/loaders';
import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';
import { createDb } from '../db/client';
import { snakes, traitChips } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface SnakeEntry {
  id: string;
  slug: string;
  name: string;
  species: string;
  description: string;
  priceInCents: number;
  available: boolean;
  featured: boolean;
  primaryImageKey: string | null;
  sex: 'male' | 'female' | 'unknown';
  hatchDate: Date | null;
  weightGrams: number | null;
  lengthCm: number | null;
  generation: string;
  traits: Array<{ id: string; label: string; type: 'dominant' | 'recessive' | 'codominant' }>;
}

export interface SnakeCollectionFilter {
  featured?: boolean;
  available?: boolean;
}

export interface SnakeEntryFilter {
  id?: string;
  slug?: string;
}

function getDb() {
  return createDb((env as unknown as { DB: D1Database }).DB);
}

async function attachTraits(db: ReturnType<typeof getDb>, snakeRows: (typeof snakes.$inferSelect)[]) {
  return Promise.all(
    snakeRows.map(async (snake) => ({
      ...snake,
      traits: await db.select().from(traitChips).where(eq(traitChips.snakeId, snake.id)),
    }))
  );
}

export function snakesLoader(): LiveLoader<SnakeEntry, SnakeEntryFilter, SnakeCollectionFilter> {
  return {
    name: 'snakes-loader',
    loadCollection: async ({ filter }) => {
      const db = getDb();
      // Collect conditions to AND — calling .where() twice replaces rather than ANDs in Drizzle
      const conditions = [];
      if (filter?.featured !== undefined) conditions.push(eq(snakes.featured, filter.featured));
      if (filter?.available !== undefined) conditions.push(eq(snakes.available, filter.available));
      const rows = await db.select().from(snakes)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(snakes.createdAt);
      const entries = await attachTraits(db, rows);
      return {
        entries: entries.map((e) => ({ id: e.slug, data: e as SnakeEntry })),
      };
    },
    loadEntry: async ({ filter }) => {
      if (!filter?.slug && !filter?.id) return undefined;
      const db = getDb();
      const [row] = filter.slug
        ? await db.select().from(snakes).where(eq(snakes.slug, filter.slug))
        : await db.select().from(snakes).where(eq(snakes.id, filter.id!));
      if (!row) return undefined;
      const [entry] = await attachTraits(db, [row]);
      return { id: entry.slug, data: entry as SnakeEntry };
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- tests/unit/loaders/snakes-loader.test.ts
```

Expected: PASS

- [ ] **Step 5: Create `src/live.config.ts`**

```typescript
// src/live.config.ts
import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import { snakesLoader } from './loaders/snakes-loader';

const snakes = defineLiveCollection({
  loader: snakesLoader(),
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
    sex: z.enum(['male', 'female', 'unknown']),
    hatchDate: z.date().nullable().optional(),
    weightGrams: z.number().nullable().optional(),
    lengthCm: z.number().nullable().optional(),
    generation: z.string(),
    traits: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['dominant', 'recessive', 'codominant']),
    })),
  }),
});

export const collections = { snakes };
```

- [ ] **Step 6: Delete `src/content.config.ts`**

```bash
rm src/content.config.ts
```

- [ ] **Step 7: Update `src/pages/index.astro` to use `getLiveCollection`**

`getLiveCollection` returns `{ entries, cacheHint }` — destructure `entries` directly (no `error` property on collection results).

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/layout/Header.astro';
import Footer from '../components/layout/Footer.astro';
import SnakeGrid from '../components/snakes/SnakeGrid.astro';
import Button from '../components/ui/Button.astro';
import { getLiveCollection } from 'astro:content';

const { entries: featuredEntries } = await getLiveCollection('snakes', { featured: true });
const featuredSnakes = featuredEntries.slice(0, 6).map(e => e.data);
---
<!-- rest of template is unchanged — replace snakesWithTraits with featuredSnakes -->
```

Each entry already includes `.traits` from the loader, so the `Promise.all` trait-fetching loop is no longer needed.

- [ ] **Step 8: Update `src/pages/snakes/index.astro`**

```astro
---
// src/pages/snakes/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/layout/Header.astro';
import Footer from '../../components/layout/Footer.astro';
import SnakeGrid from '../../components/snakes/SnakeGrid.astro';
import { getLiveCollection } from 'astro:content';

const { entries } = await getLiveCollection('snakes');
const allSnakes = entries.map(e => e.data);
---
<!-- template unchanged — replace snakesWithTraits with allSnakes -->
```

- [ ] **Step 9: Update `src/pages/snakes/[slug].astro`**

`getLiveEntry` returns `{ entry, cacheHint }` on success or `{ error }` if not found. Access the snake via `entry.data`. Note: only `getLiveEntry` has an `error` property; `getLiveCollection` does not.

```astro
---
// src/pages/snakes/[slug].astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/layout/Header.astro';
import Footer from '../../components/layout/Footer.astro';
import Badge from '../../components/ui/Badge.astro';
import Chip from '../../components/ui/Chip.astro';
import Button from '../../components/ui/Button.astro';
import { getLiveEntry } from 'astro:content';

const { slug } = Astro.params;
const { entry, error } = await getLiveEntry('snakes', { slug: slug! });
if (error) return Astro.redirect('/snakes');
const snake = entry.data;
const traits = snake.traits;
const imageUrl = snake.primaryImageKey
  ? `/api/r2/image?key=${encodeURIComponent(snake.primaryImageKey)}`
  : '/placeholder-snake.jpg';
---
<!-- rest of template unchanged -->
```

- [ ] **Step 10: Build check**

```bash
npm run build
```

Expected: No errors. Live collection types resolve correctly.

- [ ] **Step 11: Commit**

```bash
git add src/live.config.ts src/loaders/snakes-loader.ts src/pages/index.astro \
  src/pages/snakes/index.astro src/pages/snakes/\[slug\].astro \
  tests/unit/loaders/snakes-loader.test.ts
git rm src/content.config.ts
git commit -m "feat: replace build-time content config with Astro 6 live collection backed by D1 live loader"
```

---

## Task 4: Extract Reusable Form Components

The `<textarea>` and `<select>` are currently inlined in `new.astro` and `edit.astro`. A `FileInput` is inlined in `media/index.astro`. Extract these for consistency.

**Files:**
- Create: `src/components/ui/Textarea.astro`
- Create: `src/components/ui/Select.astro`
- Create: `src/components/ui/FileInput.astro`
- Modify: `src/pages/admin/snakes/new.astro`
- Modify: `src/pages/admin/snakes/[id]/edit.astro`
- Modify: `src/pages/admin/media/index.astro`

- [ ] **Step 1: Write tests for component props contract**

```typescript
// tests/unit/components/form-components.test.ts
import { describe, it, expect } from 'vitest';

// These are purely structural contracts — they verify the components exist and
// have the expected file shape (not rendering, which requires Astro runtime).
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Textarea component', () => {
  it('exists and accepts name prop', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/ui/Textarea.astro'), 'utf-8');
    expect(src).toContain('name');
    expect(src).toContain('<textarea');
  });
});

describe('Select component', () => {
  it('exists and renders a select element', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/ui/Select.astro'), 'utf-8');
    expect(src).toContain('<select');
    expect(src).toContain('options');
  });
});

describe('FileInput component', () => {
  it('exists and renders a file input', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/ui/FileInput.astro'), 'utf-8');
    expect(src).toContain('type="file"');
  });
});
```

- [ ] **Step 2: Run to verify failures**

```bash
npm run test -- tests/unit/components/form-components.test.ts
```

Expected: FAIL — files don't exist

- [ ] **Step 3: Create `src/components/ui/Textarea.astro`**

```astro
---
interface Props {
  name: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  value?: string;
  error?: string;
  class?: string;
}
const { name, rows = 4, placeholder, required, value, error, class: className = '' } = Astro.props;
---
<textarea
  id={name}
  name={name}
  rows={rows}
  placeholder={placeholder}
  required={required}
  class={`w-full bg-surface-container-lowest border text-on-surface text-sm px-3 py-2 rounded focus:outline-none focus:shadow-[0_0_8px_rgba(158,209,189,0.3)] focus:border-primary/50 resize-none ${error ? 'border-red-500/60' : 'border-outline-variant/30'} ${className}`}
>{value}</textarea>
```

- [ ] **Step 4: Create `src/components/ui/Select.astro`**

```astro
---
interface SelectOption {
  value: string;
  label: string;
}
interface Props {
  name: string;
  options: SelectOption[];
  value?: string;
  required?: boolean;
  error?: string;
  class?: string;
}
const { name, options, value, required, error, class: className = '' } = Astro.props;
---
<select
  id={name}
  name={name}
  required={required}
  class={`w-full bg-surface-container-lowest border text-on-surface text-sm px-3 py-2 rounded focus:outline-none focus:shadow-[0_0_8px_rgba(158,209,189,0.3)] focus:border-primary/50 ${error ? 'border-red-500/60' : 'border-outline-variant/30'} ${className}`}
>
  {options.map(opt => (
    <option value={opt.value} selected={opt.value === value}>{opt.label}</option>
  ))}
</select>
```

- [ ] **Step 5: Create `src/components/ui/FileInput.astro`**

```astro
---
interface Props {
  name: string;
  accept?: string;
  required?: boolean;
  label?: string;
  class?: string;
}
const { name, accept = 'image/*', required, label = 'Select file', class: className = '' } = Astro.props;
---
<div class={`flex flex-col gap-1.5 ${className}`}>
  {label && (
    <label for={name} class="text-xs uppercase tracking-widest text-on-surface-variant font-medium">{label}</label>
  )}
  <input
    id={name}
    type="file"
    name={name}
    accept={accept}
    required={required}
    class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-sm px-3 py-2 rounded file:mr-4 file:py-1 file:px-3 file:rounded file:text-xs file:bg-surface-container-high file:text-on-surface file:border-0 file:cursor-pointer"
  />
</div>
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test -- tests/unit/components/form-components.test.ts
```

Expected: PASS

- [ ] **Step 7: Update `src/pages/admin/media/index.astro`**

Replace the inline file input with `<FileInput>`:

```astro
---
import AdminLayout from '../../../layouts/AdminLayout.astro';
import Button from '../../../components/ui/Button.astro';
import FileInput from '../../../components/ui/FileInput.astro';
import { env } from 'cloudflare:workers';
import type { R2Bucket } from '@cloudflare/workers-types';
import { r2Key } from '../../../lib/r2';

if (Astro.request.method === 'POST') {
  const formData = await Astro.request.formData();
  const file = formData.get('file') as File | null;
  if (file && file.size > 0) {
    const key = r2Key(file.name);
    await (env as unknown as { ASSETS_BUCKET: R2Bucket }).ASSETS_BUCKET.put(key, await file.arrayBuffer(), {
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
      <FileInput name="file" accept="image/*" required label="Select Image" />
      <Button type="submit" variant="primary">Upload to R2</Button>
    </form>
  </div>
</AdminLayout>
```

- [ ] **Step 8: Update `src/pages/admin/snakes/new.astro`**

Replace inline `<textarea>` with `<Textarea>` component:

```astro
---
import AdminLayout from '../../../layouts/AdminLayout.astro';
import FormField from '../../../components/ui/FormField.astro';
import Input from '../../../components/ui/Input.astro';
import Textarea from '../../../components/ui/Textarea.astro';
import Select from '../../../components/ui/Select.astro';
import Button from '../../../components/ui/Button.astro';
import { actions, isInputError } from 'astro:actions';

const SEX_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const GENERATION_OPTIONS = [
  { value: 'CB', label: 'CB — Captive Bred' },
  { value: 'CBB', label: 'CBB — Captive Born & Bred' },
  { value: 'WC', label: 'WC — Wild Caught' },
  { value: 'LTC', label: 'LTC — Long-Term Captive' },
  { value: 'F1', label: 'F1' },
  { value: 'F2', label: 'F2' },
];

const result = Astro.getActionResult(actions.createSnake);
if (result && !result.error) {
  return Astro.redirect('/admin/snakes');
}
const fieldErrors = result?.error && isInputError(result.error) ? result.error.fields : {};
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
        <Textarea name="description" rows={4} />
      </FormField>
      <FormField label="Price (cents, e.g. 50000 = $500)" name="priceInCents">
        <Input name="priceInCents" type="number" placeholder="0" />
      </FormField>
      <div class="grid grid-cols-2 gap-6">
        <FormField label="Sex" name="sex">
          <Select name="sex" options={SEX_OPTIONS} value="unknown" />
        </FormField>
        <FormField label="Generation" name="generation">
          <Select name="generation" options={GENERATION_OPTIONS} value="CB" />
        </FormField>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <FormField label="Hatch Date" name="hatchDate">
          <Input name="hatchDate" type="date" />
        </FormField>
        <FormField label="Weight (grams)" name="weightGrams">
          <Input name="weightGrams" type="number" placeholder="0" />
        </FormField>
      </div>
      <FormField label="Length (cm)" name="lengthCm">
        <Input name="lengthCm" type="number" placeholder="0" />
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

- [ ] **Step 9: Update `src/pages/admin/snakes/[id]/edit.astro`**

Replace inline `<textarea>` with `<Textarea>` and `<select>` with `<Select>`. Add new biological fields section. Add image gallery management.

```astro
---
import AdminLayout from '../../../../layouts/AdminLayout.astro';
import FormField from '../../../../components/ui/FormField.astro';
import Input from '../../../../components/ui/Input.astro';
import Textarea from '../../../../components/ui/Textarea.astro';
import Select from '../../../../components/ui/Select.astro';
import Button from '../../../../components/ui/Button.astro';
import Chip from '../../../../components/ui/Chip.astro';
import { actions, isInputError } from 'astro:actions';
import { createDb } from '../../../../db/client';
import { snakes, traitChips, snakeImages } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';

const SEX_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];
const GENERATION_OPTIONS = [
  { value: 'CB', label: 'CB — Captive Bred' },
  { value: 'CBB', label: 'CBB — Captive Born & Bred' },
  { value: 'WC', label: 'WC — Wild Caught' },
  { value: 'LTC', label: 'LTC — Long-Term Captive' },
  { value: 'F1', label: 'F1' },
  { value: 'F2', label: 'F2' },
];

const { id } = Astro.params;
const db = createDb((env as unknown as { DB: D1Database }).DB);
const [snake] = await db.select().from(snakes).where(eq(snakes.id, id!));
if (!snake) return Astro.redirect('/admin/snakes');

const traits = await db.select().from(traitChips).where(eq(traitChips.snakeId, snake.id));
const images = await db.select().from(snakeImages)
  .where(eq(snakeImages.snakeId, snake.id))
  .orderBy(snakeImages.sortOrder);

const updateResult = Astro.getActionResult(actions.updateSnake);
if (updateResult && !updateResult.error) {
  return Astro.redirect('/admin/snakes');
}
const fieldErrors = updateResult?.error && isInputError(updateResult.error) ? updateResult.error.fields : {};

const hatchDateValue = snake.hatchDate
  ? snake.hatchDate.toISOString().split('T')[0]
  : '';
---
<AdminLayout title={`Edit: ${snake.name}`}>
  <div class="max-w-xl flex flex-col gap-12">
    <!-- Core details -->
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
        <Textarea name="description" rows={4} value={snake.description} />
      </FormField>
      <FormField label="Price (cents)" name="priceInCents">
        <Input name="priceInCents" type="number" value={String(snake.priceInCents)} />
      </FormField>
      <div class="grid grid-cols-2 gap-6">
        <FormField label="Sex" name="sex">
          <Select name="sex" options={SEX_OPTIONS} value={snake.sex} />
        </FormField>
        <FormField label="Generation" name="generation">
          <Select name="generation" options={GENERATION_OPTIONS} value={snake.generation} />
        </FormField>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <FormField label="Hatch Date" name="hatchDate">
          <Input name="hatchDate" type="date" value={hatchDateValue} />
        </FormField>
        <FormField label="Weight (grams)" name="weightGrams">
          <Input name="weightGrams" type="number" value={snake.weightGrams ? String(snake.weightGrams) : ''} />
        </FormField>
      </div>
      <FormField label="Length (cm)" name="lengthCm">
        <Input name="lengthCm" type="number" value={snake.lengthCm ? String(snake.lengthCm) : ''} />
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

    <!-- Image gallery -->
    <div>
      <h2 class="font-noto-serif text-on-surface text-xl mb-6">Images</h2>
      {images.length > 0 && (
        <div class="grid grid-cols-3 gap-3 mb-6">
          {images.map(img => (
            <div class="relative group aspect-square bg-surface-container-lowest rounded overflow-hidden">
              <img
                src={`/api/r2/image?key=${encodeURIComponent(img.imageKey)}`}
                alt=""
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-surface/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {img.imageKey !== snake.primaryImageKey && (
                  <form method="POST" action={actions.setPrimaryImage}>
                    <input type="hidden" name="snakeId" value={snake.id} />
                    <input type="hidden" name="imageKey" value={img.imageKey} />
                    <button type="submit" class="text-primary text-xs hover:underline">Set primary</button>
                  </form>
                )}
                {img.imageKey === snake.primaryImageKey && (
                  <span class="text-primary text-xs font-medium">Primary</span>
                )}
                <form method="POST" action={actions.deleteSnakeImage}>
                  <input type="hidden" name="id" value={img.id} />
                  <input type="hidden" name="snakeId" value={snake.id} />
                  <button type="submit" class="text-red-400 text-xs hover:underline">Remove</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
      <form method="POST" action={actions.addSnakeImage} class="flex gap-3 items-end flex-wrap">
        <input type="hidden" name="snakeId" value={snake.id} />
        <FormField label="R2 Image Key" name="imageKey">
          <Input name="imageKey" placeholder="snakes/1234567890-photo.jpg" />
        </FormField>
        <Button type="submit" variant="ghost">Add Image</Button>
      </form>
      <p class="text-on-surface-variant text-xs mt-2">
        Upload images at <a href="/admin/media" class="text-primary hover:underline">Admin → Media</a>, then paste the key above.
      </p>
    </div>

    <!-- Genetic traits -->
    <div>
      <h2 class="font-noto-serif text-on-surface text-xl mb-6">Genetic Traits</h2>
      {traits.length > 0 && (
        <div class="flex flex-wrap gap-2 mb-6">
          {traits.map(t => (
            <div class="flex items-center gap-1.5">
              <Chip type={t.type}>{t.label}</Chip>
              <form method="POST" action={actions.deleteTrait} class="inline">
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" class="text-red-400 text-xs hover:underline leading-none">×</button>
              </form>
            </div>
          ))}
        </div>
      )}
      <form method="POST" action={actions.addTrait} class="flex gap-3 items-end flex-wrap">
        <input type="hidden" name="snakeId" value={snake.id} />
        <FormField label="Trait label" name="label">
          <Input name="label" placeholder="e.g. Banana" />
        </FormField>
        <FormField label="Type" name="type">
          <Select name="type" options={[
            { value: 'dominant', label: 'Dominant' },
            { value: 'recessive', label: 'Recessive' },
            { value: 'codominant', label: 'Codominant' },
          ]} value="dominant" />
        </FormField>
        <Button type="submit" variant="ghost">Add Trait</Button>
      </form>
    </div>
  </div>
</AdminLayout>
```

- [ ] **Step 10: Build check**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 11: Commit**

```bash
git add src/components/ui/Textarea.astro src/components/ui/Select.astro \
  src/components/ui/FileInput.astro src/pages/admin/snakes/new.astro \
  src/pages/admin/snakes/\[id\]/edit.astro src/pages/admin/media/index.astro \
  tests/unit/components/form-components.test.ts
git commit -m "feat: extract Textarea/Select/FileInput components; update edit form with new specimen fields and image gallery"
```

---

## Task 5: Delete Unused Assets

The Astro starter template left behind 5 blog placeholder images and 2 Atkinson Hyperlegible font files. Neither is referenced anywhere in the snake project source code.

**Files:**
- Delete: `src/assets/blog-placeholder-1.jpg`
- Delete: `src/assets/blog-placeholder-2.jpg`
- Delete: `src/assets/blog-placeholder-3.jpg`
- Delete: `src/assets/blog-placeholder-4.jpg`
- Delete: `src/assets/blog-placeholder-about.jpg`
- Delete: `public/fonts/atkinson-bold.woff`
- Delete: `public/fonts/atkinson-regular.woff`

- [ ] **Step 1: Verify no references exist**

```bash
grep -r "blog-placeholder\|atkinson" src/ public/ --include="*.astro" --include="*.ts" --include="*.css" --include="*.mjs"
```

Expected: No output (zero matches)

- [ ] **Step 2: Delete the files**

```bash
rm src/assets/blog-placeholder-1.jpg \
   src/assets/blog-placeholder-2.jpg \
   src/assets/blog-placeholder-3.jpg \
   src/assets/blog-placeholder-4.jpg \
   src/assets/blog-placeholder-about.jpg \
   public/fonts/atkinson-bold.woff \
   public/fonts/atkinson-regular.woff
```

- [ ] **Step 3: Remove the now-empty fonts directory if empty**

```bash
rmdir public/fonts 2>/dev/null || true
```

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: No errors. No references to deleted files.

- [ ] **Step 5: Commit**

```bash
git rm src/assets/blog-placeholder-*.jpg public/fonts/atkinson-*.woff
git commit -m "chore: remove unused blog placeholder images and Atkinson font files from starter template"
```

---

## Task 6: Seed Demo Data for Local Development

Without seed data, every fresh `npm run dev` session starts with an empty database — no snakes to test layouts, filters, or the detail page. A seed SQL file plus an npm script fixes this.

**Files:**
- Create: `scripts/seed.sql`
- Modify: `package.json` (add `db:seed` script)

- [ ] **Step 1: Create `scripts/seed.sql`**

```sql
-- scripts/seed.sql
-- Demo seed for local development. Run: npm run db:seed
-- Safe to run multiple times (uses INSERT OR IGNORE).

INSERT OR IGNORE INTO snakes (id, slug, name, species, description, price_in_cents, available, featured, sex, generation, weight_grams, length_cm, created_at, updated_at)
VALUES
  ('seed-001', 'banana-pastel-2024', 'Citrus Dream', 'Python regius',
   'A vivid Banana Pastel ball python with exceptional contrast. CB 2024. Feeding reliably on frozen/thawed.',
   75000, 1, 1, 'male', 'CB', 420, 61,
   strftime('%s','now') * 1000, strftime('%s','now') * 1000),

  ('seed-002', 'mystic-pied-female', 'Phantom Mist', 'Python regius',
   'Striking Mystic Pied female. Deep charcoal base with ivory piebald expression. CB 2023.',
   185000, 1, 1, 'female', 'CB', 1050, 118,
   strftime('%s','now') * 1000, strftime('%s','now') * 1000),

  ('seed-003', 'clown-enchi-2025', 'Desert Clown', 'Python regius',
   'Enchi Clown male, 2025 hatchling. Bright orange and white patterning. Eating well.',
   95000, 1, 0, 'male', 'CB', 85, 38,
   strftime('%s','now') * 1000, strftime('%s','now') * 1000),

  ('seed-004', 'not-for-sale-queen', 'Obsidian Queen', 'Python regius',
   'Our prized breeding female — Black Pastel Super Cinnamon. Not available for sale.',
   0, 0, 0, 'female', 'CB', 2100, 147,
   strftime('%s','now') * 1000, strftime('%s','now') * 1000);

INSERT OR IGNORE INTO trait_chips (id, snake_id, label, type)
VALUES
  ('trait-001', 'seed-001', 'Banana', 'codominant'),
  ('trait-002', 'seed-001', 'Pastel', 'codominant'),
  ('trait-003', 'seed-002', 'Mystic', 'dominant'),
  ('trait-004', 'seed-002', 'Piebald', 'recessive'),
  ('trait-005', 'seed-003', 'Clown', 'recessive'),
  ('trait-006', 'seed-003', 'Enchi', 'codominant'),
  ('trait-007', 'seed-004', 'Black Pastel', 'codominant'),
  ('trait-008', 'seed-004', 'Cinnamon', 'codominant');
```

- [ ] **Step 2: Add seed script to `package.json`**

Add to `scripts`:
```json
"db:seed": "wrangler d1 execute serpents-edge-db --local --file=scripts/seed.sql"
```

- [ ] **Step 3: Run seed against local D1**

```bash
npm run db:seed
```

Expected: Output shows 4 rows inserted into `snakes` and 8 into `trait_chips`. No errors.

- [ ] **Step 4: Start dev server and verify seed data renders**

```bash
npm run dev
```

Open `http://localhost:4321` — the homepage should show 2 featured specimens ("Citrus Dream" and "Phantom Mist").
Open `http://localhost:4321/snakes` — all 4 snakes should be listed.
Open `http://localhost:4321/snakes/banana-pastel-2024` — detail page for Citrus Dream.

- [ ] **Step 5: Write a test that validates the seed SQL is syntactically parseable**

```typescript
// tests/unit/db/seed.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('seed.sql', () => {
  it('exists and contains snake inserts', () => {
    const sql = readFileSync(join(process.cwd(), 'scripts/seed.sql'), 'utf-8');
    expect(sql).toContain('INSERT OR IGNORE INTO snakes');
    expect(sql).toContain('INSERT OR IGNORE INTO trait_chips');
  });

  it('has at least 3 snakes', () => {
    const sql = readFileSync(join(process.cwd(), 'scripts/seed.sql'), 'utf-8');
    const snakeInsertCount = (sql.match(/\('seed-\d+'/g) ?? []).length;
    expect(snakeInsertCount).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 6: Run test**

```bash
npm run test -- tests/unit/db/seed.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add scripts/seed.sql package.json tests/unit/db/seed.test.ts
git commit -m "feat: add local dev seed data with 4 demo snakes and traits; add db:seed script"
```

---

## Task 7: Full Test Suite & Build Verification

Run all tests and a complete build to confirm nothing is broken across the changes.

- [ ] **Step 1: Run all unit tests**

```bash
npm run test
```

Expected: All tests pass. No failures.

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: TypeScript check passes, no `runtime` errors, no missing module errors.

- [ ] **Step 3: Smoke test the dev server**

```bash
npm run dev
```

Verify manually:
- `http://localhost:4321` — homepage loads, featured snakes appear
- `http://localhost:4321/snakes` — collection grid loads
- `http://localhost:4321/snakes/banana-pastel-2024` — detail page renders
- `http://localhost:4321/admin/snakes` — admin list page renders (sign in with Clerk if prompted)
- `http://localhost:4321/admin/snakes/seed-001/edit` — edit form shows all fields including new biological fields

- [ ] **Step 4: Final commit**

```bash
git add -A
git status  # review any remaining changes
git commit -m "chore: full verification pass — all tests green, build clean"
```

---

## Appendix: Key Reference

| Issue | Root Cause | Fix |
|---|---|---|
| `runtime does not exist on type 'Locals'` | `@astrojs/cloudflare` v13 removed `runtime` injection | `import { env } from 'cloudflare:workers'` |
| `{ z } from 'astro:content'` deprecated | Zod 4 / Astro 6 moved z | Use `z` from `astro/zod` (live.config.ts) or `astro:schema` (actions — already correct) |
| Build-time collection for runtime data | `content.config.ts` used `type:'data'` which is build-time | Replace with `live.config.ts` + `defineLiveCollection()` |
| Schema missing biological fields | Schema only has basic fields | Migration adds sex, hatchDate, weightGrams, lengthCm, generation, snakeImages table |
| Inline `<textarea>` / `<select>` / file input | No shared components | `Textarea.astro`, `Select.astro`, `FileInput.astro` |
| No seed data | Never implemented | `scripts/seed.sql` + `db:seed` npm script |