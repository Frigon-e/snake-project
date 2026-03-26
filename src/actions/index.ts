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
      status: z.enum(['available', 'reserved', 'sold']).optional(),
      sex: z.string().optional().transform(v => v?.trim() || undefined),
      hatchDate: z.string().optional().transform(v => v?.trim() || undefined),
      personality: z.string().optional().transform(v => v?.trim() || undefined),
      weightGrams: z.coerce.number().int().min(0).optional().transform(v => v || undefined),
    }),
    handler: async ({ status, available, ...input }) => {
      const db = getDb();
      const resolvedAvailable = status ? status === 'available' : available;
      const [snake] = await db.insert(snakes).values({
        ...input,
        available: resolvedAvailable,
        status: status ?? null,
        sex: input.sex ?? null,
        hatchDate: input.hatchDate ?? null,
        personality: input.personality ?? null,
        weightGrams: input.weightGrams ?? null,
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
      primaryImageKey: z.string().optional().transform(v => v?.trim() || undefined),
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
    handler: async ({ id, primaryImageKey, status, available, ...data }) => {
      const db = getDb();
      const resolvedAvailable = status ? status === 'available' : available;
      await db.update(snakes).set({
        ...data,
        available: resolvedAvailable,
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
};
