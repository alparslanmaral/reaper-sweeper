import { MetaUpgradeDef } from './types';

// Persistent, purchased with SP (Sweeper Points) between runs. Carries over forever.
export const META_UPGRADES: MetaUpgradeDef[] = [
  {
    id: 'maxHp',
    name: 'Max Health',
    description: '+10 max HP on every sweeper, every run.',
    baseCost: 15,
    costGrowth: 1.18,
    maxLevel: 10,
    valuePerLevel: 10,
  },
  {
    id: 'damage',
    name: 'Base Damage',
    description: '+4% weapon damage on every sweeper, every run.',
    baseCost: 20,
    costGrowth: 1.2,
    maxLevel: 10,
    valuePerLevel: 0.04,
  },
  {
    id: 'moveSpeed',
    name: 'Move Speed',
    description: '+3% move speed on every sweeper, every run.',
    baseCost: 18,
    costGrowth: 1.2,
    maxLevel: 8,
    valuePerLevel: 0.03,
  },
  {
    id: 'pickupRadius',
    name: 'Pickup Range',
    description: '+8% pickup radius on every sweeper, every run.',
    baseCost: 10,
    costGrowth: 1.15,
    maxLevel: 8,
    valuePerLevel: 0.08,
  },
  {
    id: 'armor',
    name: 'Armor Plating',
    description: '+1.5% damage reduction, every run.',
    baseCost: 25,
    costGrowth: 1.25,
    maxLevel: 8,
    valuePerLevel: 0.015,
  },
  {
    id: 'startLevel',
    name: 'Head Start',
    description: 'Begin every run one level higher (one free level-up upgrade).',
    baseCost: 60,
    costGrowth: 1.6,
    maxLevel: 5,
    valuePerLevel: 1,
  },
  {
    id: 'spGain',
    name: 'Efficient Recycling',
    description: '+10% SP earned from bosses and runs.',
    baseCost: 40,
    costGrowth: 1.3,
    maxLevel: 6,
    valuePerLevel: 0.1,
  },
];

export function metaUpgradeById(id: string): MetaUpgradeDef {
  const u = META_UPGRADES.find((x) => x.id === id);
  if (!u) throw new Error(`Unknown meta upgrade: ${id}`);
  return u;
}
