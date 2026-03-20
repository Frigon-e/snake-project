// drizzle.config.ts
// drizzle-kit generates SQL migration files only.
// Apply migrations via: wrangler d1 migrations apply (not drizzle-kit migrate).
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
});
