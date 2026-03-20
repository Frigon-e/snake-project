// src/content.config.ts
// Astro 6 content collection config.
// Data is fetched at request time via Drizzle (D1) in page components.
// This file defines the collection shape for Astro type generation.
import { defineCollection, z } from 'astro:content';

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
