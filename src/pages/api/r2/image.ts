// src/pages/api/r2/image.ts
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import type { R2Bucket } from '@cloudflare/workers-types';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return new Response('Missing key', { status: 400 });

  const object = await (env as unknown as { ASSETS_BUCKET: R2Bucket }).ASSETS_BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
};
