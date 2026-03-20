import { describe, it, expect } from 'vitest';
import { r2Key } from '../../../src/lib/r2';

describe('r2Key', () => {
  it('generates a key with snakes/ prefix', () => {
    const key = r2Key('my-snake.jpg');
    expect(key).toMatch(/^snakes\/\d+-my-snake\.jpg$/);
  });

  it('sanitizes spaces', () => {
    const key = r2Key('my snake file.jpg');
    expect(key).not.toContain(' ');
  });

  it('sanitizes special characters', () => {
    const key = r2Key('snake!@#.jpg');
    expect(key).not.toMatch(/[!@#]/);
  });
});
