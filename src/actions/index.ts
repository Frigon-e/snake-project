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
