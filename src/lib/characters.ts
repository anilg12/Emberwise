import type { HeroClass } from './types';

/** outfit color variant. alt = second garment (shirt, stripes, fur...) */
export interface Tone {
  main: string;
  dark: string;
  trim: string;
  alt: string;
  /** sleeve color if different from dark */
  sleeve?: string;
}

export interface CharacterDef {
  id: HeroClass;
  tier: 'free' | 'shop' | 'login';
  legs?: string;
  boots?: string;
  /** gloves instead of bare hands */
  gloves?: string;
  tones: Tone[];
}

const T = (main: string, dark: string, trim: string, alt = main, sleeve?: string): Tone => ({ main, dark, trim, alt, sleeve });

export const CHARACTERS: CharacterDef[] = [
  // free
  {
    id: 'wizard',
    tier: 'free',
    tones: [T('#5b4fa8', '#433a86', '#f2c45a'), T('#2f6f8f', '#245770', '#f2c45a'), T('#8f3b5c', '#722f49', '#f5d38a'), T('#2f3b57', '#232c42', '#9fc6ff')],
  },
  {
    id: 'knight',
    tier: 'free',
    tones: [T('#a7b2c4', '#7c889c', '#f0743e'), T('#c9a35c', '#a6823f', '#8a2f3a'), T('#6e7f99', '#55647b', '#4fb0a0'), T('#5a5767', '#423f4f', '#e5484d')],
  },
  {
    id: 'ranger',
    tier: 'free',
    tones: [T('#3f7f5b', '#2f6347', '#a87443'), T('#7a5a3a', '#5f452c', '#c9a35c'), T('#5a6b3a', '#46542c', '#d0a24f'), T('#2f5f6f', '#244a57', '#c98b5a')],
  },
  {
    id: 'bard',
    tier: 'free',
    tones: [T('#b6455a', '#923547', '#f2c45a'), T('#3f6fb6', '#30579a', '#f2c45a'), T('#5f8a3a', '#4b6e2d', '#f5e6b0'), T('#8a4fb0', '#6d3d8c', '#ffd98a')],
  },
  {
    id: 'scientist',
    tier: 'free',
    tones: [
      T('#f6f4ef', '#d9d4ca', '#2a9d8f', '#8fb3e0', '#f6f4ef'),
      T('#f6f4ef', '#d9d4ca', '#e76f51', '#f1cf7a', '#f6f4ef'),
      T('#f6f4ef', '#d9d4ca', '#6d597a', '#d8a7b1', '#f6f4ef'),
      T('#e6f2ef', '#c4dbd5', '#3a5a9a', '#f6f4ef', '#e6f2ef'),
    ],
  },
  {
    id: 'chef',
    tier: 'free',
    legs: '#2f2c38',
    boots: '#2a2326',
    tones: [
      T('#f8f6f1', '#dedad0', '#e04f3f', '#f8f6f1', '#f8f6f1'),
      T('#f8f6f1', '#dedad0', '#3a86c8', '#f8f6f1', '#f8f6f1'),
      T('#f8f6f1', '#dedad0', '#2a9d6f', '#f8f6f1', '#f8f6f1'),
      T('#34303d', '#25222c', '#f2c45a', '#34303d', '#34303d'),
    ],
  },
  {
    id: 'gardener',
    tier: 'free',
    tones: [
      T('#4f7cac', '#3d6189', '#f2c45a', '#f4d35e', '#f4d35e'),
      T('#5f8d4e', '#4a6f3c', '#f6e7cb', '#f6e7cb', '#f6e7cb'),
      T('#a0522d', '#7f4124', '#f2c45a', '#cfe8d0', '#cfe8d0'),
      T('#e07a5f', '#c4644b', '#fff4dc', '#f2efe6', '#f2efe6'),
    ],
  },
  {
    id: 'artist',
    tier: 'free',
    legs: '#2f3b57',
    tones: [
      T('#f6f2ea', '#d8d2c6', '#e94f37', '#2f4b7c', '#2f4b7c'),
      T('#f6f2ea', '#d8d2c6', '#2a9d8f', '#c0392b', '#c0392b'),
      T('#f6f2ea', '#d8d2c6', '#f2c45a', '#3a3a48', '#3a3a48'),
      T('#fdf0f3', '#e8cfd6', '#7b5ea7', '#e5739a', '#e5739a'),
    ],
  },

  // shop
  {
    id: 'explorer',
    tier: 'shop',
    legs: '#6b5a44',
    boots: '#4a3326',
    tones: [T('#d8b878', '#b8995c', '#7a4e2d', '#3f7f5b'), T('#9aa36b', '#7e8753', '#6b4a2f', '#c0533f'), T('#c9a07a', '#a8805c', '#4a3326', '#2f6f8f'), T('#e3d3b0', '#c4b28c', '#7a4e2d', '#b6455a')],
  },
  {
    id: 'coder',
    tier: 'shop',
    legs: '#33415c',
    boots: '#e9e6df',
    tones: [T('#3a6fd8', '#2f5bb3', '#f2f2f2', '#2b2d42'), T('#3d3f4a', '#2c2e37', '#ff9f43', '#d9dce4'), T('#2e8b6e', '#237158', '#f2f2f2', '#2b2d42'), T('#e07aa0', '#c45f85', '#fff', '#3a3550')],
  },
  {
    id: 'pirate',
    tier: 'shop',
    legs: '#3b3247',
    boots: '#2a2326',
    tones: [
      T('#f6f2ea', '#3b2f3f', '#d4a24c', '#c0392b', '#f6f2ea'),
      T('#f6f2ea', '#24364f', '#d4a24c', '#24364f', '#f6f2ea'),
      T('#f6f2ea', '#5a3326', '#e8c36a', '#2a7f7a', '#f6f2ea'),
      T('#f6f2ea', '#2a2a2e', '#d4a24c', '#7a3fa0', '#f6f2ea'),
    ],
  },
  {
    id: 'detective',
    tier: 'shop',
    legs: '#3b3a44',
    boots: '#2f2622',
    tones: [T('#c8a46e', '#a8854f', '#5a3f2a', '#e8e1d2'), T('#8d8f94', '#6f7176', '#2b2d42', '#e8e1d2'), T('#3b4b6b', '#2d3a55', '#c9a35c', '#e8e1d2'), T('#7a7a4f', '#5f5f3c', '#3b2f22', '#efe8d8')],
  },
  {
    id: 'ninja',
    tier: 'shop',
    legs: '#23263a',
    boots: '#1b1d2b',
    tones: [T('#2b2f45', '#1f2234', '#e5484d', '#c9ccd8'), T('#2a2a2e', '#1c1c20', '#f2c45a', '#bfb8a8'), T('#2f4a3a', '#22372b', '#e9c46a', '#cfd6c8'), T('#3e2a4a', '#2d1e37', '#ff8fab', '#d8cbe0')],
  },
  {
    id: 'astronaut',
    tier: 'shop',
    legs: '#e3e7ee',
    boots: '#9aa6b8',
    gloves: '#d4dae4',
    tones: [
      T('#eef1f5', '#c9d1dc', '#f08a24', '#3a6fd8', '#eef1f5'),
      T('#eef1f5', '#c9d1dc', '#e5484d', '#2a9d8f', '#eef1f5'),
      T('#eef1f5', '#c9d1dc', '#8a6bd1', '#f2c45a', '#eef1f5'),
      T('#f3ead8', '#d8ccb2', '#c0533f', '#2f4b7c', '#f3ead8'),
    ],
  },

  // login path only
  {
    id: 'guardian',
    tier: 'login',
    legs: '#4a2a2a',
    boots: '#3a2222',
    tones: [T('#d9663a', '#b24e2b', '#ffd27a', '#7a2f2a'), T('#b8323a', '#932730', '#ffd27a', '#4a1f24'), T('#c98b6b', '#a86d50', '#fff0c4', '#6b3f3a'), T('#7a3f6f', '#5f2f56', '#ffb35c', '#3a1f36')],
  },
  {
    id: 'oracle',
    tier: 'login',
    tones: [T('#2c2a6b', '#1f1d52', '#e8e6ff', '#9fb4ff'), T('#4b2a6b', '#381f52', '#f1e6ff', '#d3a6ff'), T('#1f4b5f', '#163847', '#e6fbff', '#8fe0f0'), T('#6b2a4b', '#521f38', '#ffe6f1', '#ffb3d1')],
  },
  {
    id: 'frost',
    tier: 'login',
    legs: '#5c7a99',
    boots: '#e8f1f8',
    tones: [T('#8fc8e8', '#63a9d2', '#ffffff', '#f2f8fc'), T('#b7a9e6', '#9584cf', '#ffffff', '#f6f2fc'), T('#93d9c0', '#6cc0a3', '#ffffff', '#f0fbf7'), T('#c3cfdc', '#a3b1c2', '#ffffff', '#f7f9fb')],
  },
  {
    id: 'timekeeper',
    tier: 'login',
    legs: '#3b3242',
    boots: '#2f2626',
    tones: [T('#2f5f5f', '#244a4a', '#d4a24c', '#8a5a3b'), T('#6b2f3a', '#52242d', '#d4a24c', '#8a5a3b'), T('#2f3f6b', '#243154', '#d4a24c', '#8a5a3b'), T('#6b4f2f', '#523c24', '#e8c36a', '#2f5f5f')],
  },
  {
    id: 'sovereign',
    tier: 'login',
    legs: '#4a2a2a',
    boots: '#c9952b',
    tones: [T('#c9302c', '#a32420', '#ffd54f', '#ff9f43'), T('#6a3fb0', '#53308f', '#ffd54f', '#ff9f43'), T('#2a2440', '#1d192f', '#ffd54f', '#ff7a45'), T('#f3eee4', '#d9d1c1', '#e0a93a', '#ffb347')],
  },
];

export const CHARACTER_IDS = CHARACTERS.map((c) => c.id);

export function character(id: HeroClass | string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

export function toneOf(id: HeroClass | string, tone: number): Tone {
  const c = character(id);
  return c.tones[tone] ?? c.tones[0];
}

// item that unlocks a character, null if it's free
export function charItemId(id: HeroClass): string | null {
  return character(id).tier === 'free' ? null : `char_${id}`;
}
