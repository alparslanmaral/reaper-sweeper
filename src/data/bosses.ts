import { BossDef } from './types';

export const BOSSES: Record<string, BossDef> = {
  landfill: {
    id: 'landfill',
    name: 'The Landfill King',
    texture: 'boss-landfill',
    scale: 1,
    baseHp: 700,
    speed: 55,
    contactDamage: 22,
    spDrop: 12,
  },
  grease: {
    id: 'grease',
    name: 'Grease Trap Behemoth',
    texture: 'boss-grease',
    scale: 1,
    baseHp: 950,
    speed: 48,
    contactDamage: 26,
    spDrop: 16,
  },
};

export const BOSS_CYCLE = ['landfill', 'grease'] as const;

/** Boss index is 0-based (0 = first boss at 3:00). HP/damage scale up each cycle. */
export function bossForIndex(index: number): { def: BossDef; hpMult: number; dmgMult: number } {
  const id = BOSS_CYCLE[index % BOSS_CYCLE.length];
  const cycle = Math.floor(index / BOSS_CYCLE.length);
  const hpMult = 1 + cycle * 0.65;
  const dmgMult = 1 + cycle * 0.35;
  return { def: BOSSES[id], hpMult, dmgMult };
}
