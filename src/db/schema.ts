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
