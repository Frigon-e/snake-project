-- scripts/seed.sql
-- Demo seed for local development. Run: npm run db:seed
-- Safe to run multiple times (uses INSERT OR IGNORE).

INSERT OR IGNORE INTO snakes (id, slug, name, species, description, price_in_cents, available, featured, created_at, updated_at)
VALUES
  ('seed-001', 'banana-pastel-2024', 'Citrus Dream', 'Python regius',
   'A vivid Banana Pastel ball python with exceptional contrast. CB 2024. Feeding reliably on frozen/thawed.',
   75000, 1, 1,
   unixepoch() * 1000, unixepoch() * 1000),

  ('seed-002', 'mystic-pied-female', 'Phantom Mist', 'Python regius',
   'Striking Mystic Pied female. Deep charcoal base with ivory piebald expression. CB 2023.',
   185000, 1, 1,
   unixepoch() * 1000, unixepoch() * 1000),

  ('seed-003', 'clown-enchi-2025', 'Desert Clown', 'Python regius',
   'Enchi Clown male, 2025 hatchling. Bright orange and white patterning. Eating well.',
   95000, 1, 0,
   unixepoch() * 1000, unixepoch() * 1000),

  ('seed-004', 'obsidian-queen', 'Obsidian Queen', 'Python regius',
   'Our prized breeding female — Black Pastel Super Cinnamon. Not available for sale.',
   0, 0, 0,
   unixepoch() * 1000, unixepoch() * 1000);

INSERT OR IGNORE INTO trait_chips (id, snake_id, label, type)
VALUES
  ('trait-001', 'seed-001', 'Banana', 'codominant'),
  ('trait-002', 'seed-001', 'Pastel', 'codominant'),
  ('trait-003', 'seed-002', 'Mystic', 'dominant'),
  ('trait-004', 'seed-002', 'Piebald', 'recessive'),
  ('trait-005', 'seed-003', 'Clown', 'recessive'),
  ('trait-006', 'seed-003', 'Enchi', 'codominant'),
  ('trait-007', 'seed-004', 'Black Pastel', 'codominant'),
  ('trait-008', 'seed-004', 'Cinnamon', 'codominant');
