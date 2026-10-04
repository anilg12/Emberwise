// Renders hero avatars to standalone SVG strings (Svelte SSR), so promo images can use the
// exact in-app artwork at any resolution. Output: promo/out/avatars.json
// Usage: node scripts/promo-avatars.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'promo', 'out');
fs.mkdirSync(outDir, { recursive: true });

// A varied cast: different bodies, skin tones, hair and every kind of outfit.
const CAST = [
  { key: 'chef', look: { body: 'm', skin: 3, hair: 0, hairColor: 0, heroClass: 'chef', tone: 0 }, hat: 'hat_chef' },
  { key: 'artist', look: { body: 'f', skin: 0, hair: 4, hairColor: 4, heroClass: 'artist', tone: 0 }, hat: 'hat_beret' },
  { key: 'astronaut', look: { body: 'm', skin: 1, hair: 3, hairColor: 1, heroClass: 'astronaut', tone: 0 } },
  { key: 'wizard', look: { body: 'f', skin: 2, hair: 1, hairColor: 6, heroClass: 'wizard', tone: 0 }, hat: 'hat_wizard', pet: 'pet_cat' },
  { key: 'sovereign', look: { body: 'm', skin: 1, hair: 5, hairColor: 3, heroClass: 'sovereign', tone: 0 }, hat: 'hat_crown', level: 30 },
  { key: 'oracle', look: { body: 'f', skin: 4, hair: 2, hairColor: 0, heroClass: 'oracle', tone: 0 }, acc: 'acc_earrings' },
  { key: 'coder', look: { body: 'm', skin: 0, hair: 0, hairColor: 2, heroClass: 'coder', tone: 0 }, acc: 'acc_headphones' },
  { key: 'gardener', look: { body: 'f', skin: 5, hair: 3, hairColor: 0, heroClass: 'gardener', tone: 0 }, hat: 'hat_straw', pet: 'pet_bunny' },
  { key: 'ninja', look: { body: 'm', skin: 2, hair: 0, hairColor: 0, heroClass: 'ninja', tone: 0 }, hat: 'hat_headband' },
  { key: 'scientist', look: { body: 'f', skin: 1, hair: 4, hairColor: 3, heroClass: 'scientist', tone: 0 }, acc: 'acc_glasses' },
  { key: 'guardian', look: { body: 'm', skin: 3, hair: 5, hairColor: 4, heroClass: 'guardian', tone: 0 } },
  { key: 'pirate', look: { body: 'f', skin: 2, hair: 1, hairColor: 2, heroClass: 'pirate', tone: 0 }, hat: 'hat_tricorn' },
  { key: 'explorer', look: { body: 'm', skin: 4, hair: 3, hairColor: 0, heroClass: 'explorer', tone: 0 }, hat: 'hat_safari', pet: 'pet_fox' },
  { key: 'frost', look: { body: 'f', skin: 0, hair: 1, hairColor: 7, heroClass: 'frost', tone: 0 } },
  { key: 'timekeeper', look: { body: 'm', skin: 1, hair: 0, hairColor: 5, heroClass: 'timekeeper', tone: 0 }, hat: 'hat_fedora', acc: 'acc_monocle' },
];

const server = await createServer({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { render } = await server.ssrLoadModule('svelte/server');
  const { default: Avatar } = await server.ssrLoadModule('/src/components/Avatar.svelte');
  const out = {};
  for (const c of CAST) {
    const { body } = render(Avatar, {
      props: { look: c.look, hat: c.hat ?? null, pet: c.pet ?? null, acc: c.acc ?? null, level: c.level ?? 1, size: 200, animate: false, decorations: !!c.level },
    });
    out[c.key] = body.replace(/<!--[\s\S]*?-->/g, '');
  }
  fs.writeFileSync(path.join(outDir, 'avatars.json'), JSON.stringify(out));
  console.log('avatars', Object.keys(out).length);
} finally {
  await server.close();
}
