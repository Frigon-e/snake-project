import { describe, expect, it } from 'vitest';
import { specimenFormSchema } from '../../../src/lib/forms';

const validSpecimen = {
  name: 'Juniper',
  slug: 'juniper',
  species: 'Ball python',
  description: '',
  priceDollars: '125.50',
  status: 'available',
};

describe('specimenFormSchema', () => {
  it('accepts real ISO hatch dates and converts dollar prices to cents', () => {
    const result = specimenFormSchema.safeParse({
      ...validSpecimen,
      hatchDate: '2024-02-29',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hatchDate).toBe('2024-02-29');
      expect(result.data.priceDollars).toBe(12_550);
    }
  });

  it('rejects impossible or malformed hatch dates', () => {
    expect(specimenFormSchema.safeParse({
      ...validSpecimen,
      hatchDate: '2024-02-30',
    }).success).toBe(false);
    expect(specimenFormSchema.safeParse({
      ...validSpecimen,
      hatchDate: 'not-a-date',
    }).success).toBe(false);
  });
});
