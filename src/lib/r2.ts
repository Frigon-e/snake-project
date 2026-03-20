// src/lib/r2.ts
export function r2Key(fileName: string): string {
  const timestamp = Date.now();
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `snakes/${timestamp}-${safe}`;
}
