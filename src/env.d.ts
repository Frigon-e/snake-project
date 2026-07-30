// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  INQUIRY_RATE_LIMITER: RateLimit;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
}
