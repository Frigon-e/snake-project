import { desc, eq } from 'drizzle-orm';
import type { Db } from './client';
import { snakes, traitChips, type Snake, type TraitChip } from './schema';

export type SpecimenWithTraits = Snake & { traits: TraitChip[] };
export type SpecimenJoinRow = {
  snakes: Snake;
  trait_chips: TraitChip | null;
};

interface ListSpecimensOptions {
  featuredOnly?: boolean;
  limit?: number;
}

export function groupSpecimenRows(
  rows: SpecimenJoinRow[],
): SpecimenWithTraits[] {
  const specimens = new Map<string, SpecimenWithTraits>();

  for (const row of rows) {
    const specimen = specimens.get(row.snakes.id) ?? {
      ...row.snakes,
      traits: [],
    };

    if (row.trait_chips) specimen.traits.push(row.trait_chips);
    specimens.set(specimen.id, specimen);
  }

  return [...specimens.values()];
}

export async function listSpecimens(
  db: Db,
  options: ListSpecimensOptions = {},
): Promise<SpecimenWithTraits[]> {
  const query = db
    .select()
    .from(snakes)
    .leftJoin(traitChips, eq(traitChips.snakeId, snakes.id))
    .where(options.featuredOnly ? eq(snakes.featured, true) : undefined)
    .orderBy(desc(snakes.createdAt));

  const rows = await query;
  const list = groupSpecimenRows(rows);
  return options.limit ? list.slice(0, options.limit) : list;
}

export async function getSpecimenById(
  db: Db,
  id: string,
): Promise<SpecimenWithTraits | null> {
  const [specimen] = await db.select().from(snakes).where(eq(snakes.id, id));
  if (!specimen) return null;

  const traits = await db
    .select()
    .from(traitChips)
    .where(eq(traitChips.snakeId, specimen.id));

  return { ...specimen, traits };
}

export async function getSpecimenBySlug(
  db: Db,
  slug: string,
): Promise<SpecimenWithTraits | null> {
  const [specimen] = await db.select().from(snakes).where(eq(snakes.slug, slug));
  if (!specimen) return null;

  const traits = await db
    .select()
    .from(traitChips)
    .where(eq(traitChips.snakeId, specimen.id));

  return { ...specimen, traits };
}
