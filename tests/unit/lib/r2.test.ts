import { describe, it, expect } from 'vitest';
import {
  hasImageSignature,
  isSpecimenImageKey,
  isSpecimenImageType,
  r2Key,
} from '../../../src/lib/r2';

describe('r2Key', () => {
  it('generates a key with snakes/ prefix', () => {
    const key = r2Key('my-snake.jpg');
    expect(key).toMatch(/^snakes\/[0-9a-f-]+-my-snake\.jpg$/);
  });

  it('sanitizes spaces', () => {
    const key = r2Key('my snake file.jpg');
    expect(key).not.toContain(' ');
  });

  it('sanitizes special characters', () => {
    const key = r2Key('snake!@#.jpg');
    expect(key).not.toMatch(/[!@#]/);
  });

  it('allows only specimen image keys and MIME types', () => {
    expect(isSpecimenImageKey('snakes/abc-photo.webp')).toBe(true);
    expect(isSpecimenImageKey('private/admin.html')).toBe(false);
    expect(isSpecimenImageType('image/webp')).toBe(true);
    expect(isSpecimenImageType('text/html')).toBe(false);
  });

  it('checks file signatures instead of trusting the declared MIME type', () => {
    expect(hasImageSignature(
      new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
      'image/jpeg',
    )).toBe(true);
    expect(hasImageSignature(
      new TextEncoder().encode('<script>alert(1)</script>'),
      'image/jpeg',
    )).toBe(false);
  });
});
