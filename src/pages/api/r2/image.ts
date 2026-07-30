// src/pages/api/r2/image.ts
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { isSpecimenImageKey, isSpecimenImageType } from '../../../lib/r2';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return new Response('Missing key', { status: 400 });
  const placeholder = new URL('/placeholder-snake.svg', request.url);

  if (!isSpecimenImageKey(key)) {
    return Response.redirect(placeholder, 302);
  }

  const object = await (env as unknown as Env).ASSETS_BUCKET.get(key);
  const contentType = object?.httpMetadata?.contentType;
  if (!object || !isSpecimenImageType(contentType)) {
    return Response.redirect(placeholder, 302);
  }

  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body as unknown as BodyInit, { headers });
};
