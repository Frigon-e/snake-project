import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wrangler = resolve(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler',
);
const environment = { ...process.env, WRANGLER_LOG: 'none' };

function runWrangler(label, args) {
  process.stdout.write(`${label}…\n`);
  const result = spawnSync(wrangler, args, {
    cwd: projectRoot,
    env: environment,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runWrangler('Applying local D1 migrations', [
  'd1',
  'migrations',
  'apply',
  'bc-exotix-db',
  '--local',
]);

const demoImages = [
  ['ball-python-v2.webp', 'snakes/demo/ball-python-v2.webp'],
  ['corn-snake-v2.webp', 'snakes/demo/corn-snake-v2.webp'],
  ['western-hognose-v2.webp', 'snakes/demo/western-hognose-v2.webp'],
  ['kenyan-sand-boa-v2.webp', 'snakes/demo/kenyan-sand-boa-v2.webp'],
];

for (const [fileName, key] of demoImages) {
  runWrangler(`Loading ${key}`, [
    'r2',
    'object',
    'put',
    `bc-exotix-assets/${key}`,
    '--local',
    '--file',
    resolve(projectRoot, 'public', 'demo', fileName),
    '--content-type',
    'image/webp',
    '--force',
  ]);
}

runWrangler('Loading fictional demo specimens', [
  'd1',
  'execute',
  'bc-exotix-db',
  '--local',
  '--file',
  resolve(projectRoot, 'src', 'db', 'seeds', 'demo.sql'),
]);

process.stdout.write('Demo collection ready. Run `npm run preview` and open /snakes.\n');
