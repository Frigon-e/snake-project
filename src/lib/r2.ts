// src/lib/r2.ts
export const specimenImageTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type SpecimenImageType = (typeof specimenImageTypes)[number];

export function r2Key(fileName: string): string {
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
  return `snakes/${crypto.randomUUID()}-${safe}`;
}

export function isSpecimenImageKey(key: string): boolean {
  return key.startsWith('snakes/')
    && key.length > 'snakes/'.length
    && !key.includes('\0');
}

export function isSpecimenImageType(value: string | undefined): value is SpecimenImageType {
  return specimenImageTypes.includes(value as SpecimenImageType);
}

export function hasImageSignature(
  bytes: Uint8Array,
  contentType: SpecimenImageType,
): boolean {
  if (contentType === 'image/jpeg') {
    return bytes.length >= 3
      && bytes[0] === 0xff
      && bytes[1] === 0xd8
      && bytes[2] === 0xff;
  }

  if (contentType === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length
      && signature.every((value, index) => bytes[index] === value);
  }

  return bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}
