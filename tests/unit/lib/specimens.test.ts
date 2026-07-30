import { describe, expect, it } from 'vitest';
import {
  formatPrice,
  formatHatchDate,
  getSpecimenStatus,
  getStatusLabel,
  isDemoSpecimen,
  specimenImageAlt,
  specimenImageUrl,
} from '../../../src/lib/specimens';

describe('specimen presentation', () => {
  it('uses the status field as the availability source of truth', () => {
    expect(getSpecimenStatus({ status: 'reserved', available: true })).toBe('reserved');
    expect(getSpecimenStatus({ status: null, available: true })).toBe('available');
  });

  it('uses keeper-friendly labels', () => {
    expect(getStatusLabel('sold')).toBe('Placed');
  });

  it('identifies seeded demo records without marking real inventory', () => {
    expect(isDemoSpecimen({ slug: 'demo-juniper-ball-python' })).toBe(true);
    expect(isDemoSpecimen({ slug: 'juniper-ball-python' })).toBe(false);
  });

  it('formats stored cents as Canadian dollars', () => {
    expect(formatPrice(125_00)).toBe('$125');
    expect(formatPrice(125_50)).toBe('$125.50');
    expect(formatPrice(0)).toBeNull();
  });

  it('formats valid hatch dates and safely ignores invalid legacy values', () => {
    expect(formatHatchDate('2024-02-29')).toContain('2024');
    expect(formatHatchDate('2024-02-30')).toBeNull();
    expect(formatHatchDate('not-a-date')).toBeNull();
  });

  it('provides a placeholder when no R2 image exists', () => {
    expect(specimenImageUrl({ primaryImageKey: null })).toBe('/placeholder-snake.svg');
    expect(specimenImageUrl({ primaryImageKey: 'snakes/a b.jpg' })).toContain('a%20b.jpg');
  });

  it('labels demo imagery as illustrative without adding noise to placeholders', () => {
    expect(specimenImageAlt({
      name: 'Juniper',
      slug: 'demo-juniper',
      primaryImageKey: 'snakes/demo/juniper.png',
    })).toBe('Illustrative demo image for Juniper');
    expect(specimenImageAlt({
      name: 'Juniper',
      slug: 'demo-juniper',
      primaryImageKey: null,
    })).toBe('');
  });
});
