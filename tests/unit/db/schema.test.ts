import { describe, it, expect } from 'vitest';
import { snakes, traitChips, inquiries } from '../../../src/db/schema';

describe('database schema', () => {
  it('snake table has required fields', () => {
    expect(snakes.id).toBeDefined();
    expect(snakes.name).toBeDefined();
    expect(snakes.slug).toBeDefined();
    expect(snakes.priceInCents).toBeDefined();
  });

  it('traitChips table references snake', () => {
    expect(traitChips.snakeId).toBeDefined();
  });

  it('inquiries table has required contact fields', () => {
    expect(inquiries.name).toBeDefined();
    expect(inquiries.email).toBeDefined();
    expect(inquiries.message).toBeDefined();
  });
});
