import { describe, expect, it } from 'vitest';
import { groupSpecimenRows } from '../../../src/db/specimens';
import type { Snake, TraitChip } from '../../../src/db/schema';

const specimen = {
  id: 'snake-1',
  slug: 'juniper',
  name: 'Juniper',
  species: 'Ball python',
  description: '',
  priceInCents: 0,
  available: true,
  featured: false,
  primaryImageKey: null,
  sex: null,
  hatchDate: null,
  personality: null,
  feedingNotes: null,
  diet: null,
  shedFrequency: null,
  temperature: null,
  humidity: null,
  weightGrams: null,
  complementaryGenetics: null,
  status: 'available',
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Snake;

describe('groupSpecimenRows', () => {
  it('returns one specimen with every joined trait', () => {
    const dominant = {
      id: 'trait-1',
      snakeId: specimen.id,
      label: 'Pastel',
      type: 'dominant',
    } satisfies TraitChip;
    const recessive = {
      id: 'trait-2',
      snakeId: specimen.id,
      label: 'Clown',
      type: 'recessive',
    } satisfies TraitChip;

    const result = groupSpecimenRows([
      { snakes: specimen, trait_chips: dominant },
      { snakes: specimen, trait_chips: recessive },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.traits).toEqual([dominant, recessive]);
  });

  it('keeps specimens that have no traits', () => {
    const result = groupSpecimenRows([
      { snakes: specimen, trait_chips: null },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.traits).toEqual([]);
  });
});
