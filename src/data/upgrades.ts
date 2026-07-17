import { UpgradeDef } from './types';

// In-run only — reset every run. Mix of plain stat boosts and Hades-style
// creative effects that change how you play, not just numbers.
export const UPGRADES: UpgradeDef[] = [
  // --- stat basics ---
  {
    id: 'sharpened_bristles',
    name: 'Sharpened Bristles',
    description: '+15% sweep damage.',
    category: 'stat',
    maxStacks: 5,
    weight: 10,
  },
  {
    id: 'nimble_wheels',
    name: 'Nimble Wheels',
    description: '+10% move speed.',
    category: 'stat',
    maxStacks: 5,
    weight: 10,
  },
  {
    id: 'reinforced_chassis',
    name: 'Reinforced Chassis',
    description: '+20 max HP, healed instantly.',
    category: 'stat',
    maxStacks: 6,
    weight: 10,
  },
  {
    id: 'wide_sweep',
    name: 'Wide Sweep',
    description: '+15% attack range.',
    category: 'stat',
    maxStacks: 5,
    weight: 9,
  },
  {
    id: 'rapid_cycle',
    name: 'Rapid Cycle',
    description: '+15% attack speed.',
    category: 'stat',
    maxStacks: 5,
    weight: 9,
  },
  {
    id: 'extended_reach',
    name: 'Extended Reach',
    description: '+25% pickup radius.',
    category: 'stat',
    maxStacks: 4,
    weight: 7,
  },
  {
    id: 'insulated_plating',
    name: 'Insulated Plating',
    description: '+8% damage reduction.',
    category: 'stat',
    maxStacks: 4,
    weight: 8,
  },
  {
    id: 'auto_repair',
    name: 'Auto-Repair',
    description: '+1 HP regenerated per second.',
    category: 'stat',
    maxStacks: 5,
    weight: 8,
  },

  // --- creative / build-defining ---
  {
    id: 'dust_devil',
    name: 'Dust Devil',
    description: 'Your sweep now pulls enemies toward the center of the arc before it hits.',
    category: 'creative',
    maxStacks: 1,
    weight: 6,
  },
  {
    id: 'overcharge_coil',
    name: 'Overcharge Coil',
    description: 'Every 5th hit deals 3x damage and arcs to 2 nearby enemies.',
    category: 'creative',
    maxStacks: 1,
    weight: 6,
  },
  {
    id: 'scorched_trail',
    name: 'Scorched Trail',
    description: 'Leave a trail of cleaning fluid that burns enemies standing in it for 2s.',
    category: 'creative',
    maxStacks: 3,
    weight: 6,
  },
  {
    id: 'backdraft_plating',
    name: 'Backdraft Plating',
    description: '20% chance on taking damage to shockwave-stun and knock back nearby enemies.',
    category: 'creative',
    maxStacks: 3,
    weight: 6,
  },
  {
    id: 'second_wind',
    name: 'Second Wind',
    description: 'The next fatal hit instead leaves you at 1 HP and unleashes a massive shockwave. (once per stack)',
    category: 'creative',
    maxStacks: 2,
    weight: 4,
  },
  {
    id: 'debris_magnet',
    name: 'Debris Magnet',
    description: 'Doubles pickup radius. Collecting XP grants a brief speed burst.',
    category: 'creative',
    maxStacks: 1,
    weight: 6,
  },
  {
    id: 'waste_compactor',
    name: 'Waste Compactor',
    description: 'Every 15 enemies swept, drop an explosive trash pile that detonates for area damage.',
    category: 'creative',
    maxStacks: 2,
    weight: 5,
  },
  {
    id: 'turbo_brush',
    name: 'Turbo Brush',
    description: '+30% attack speed, -15% attack range.',
    category: 'creative',
    maxStacks: 1,
    weight: 5,
  },
  {
    id: 'static_overload',
    name: 'Static Overload',
    description: 'Periodically release a static pulse that zaps nearby enemies (faster if you already have one).',
    category: 'creative',
    maxStacks: 2,
    weight: 6,
  },
  {
    id: 'heavy_roller',
    name: 'Heavy Roller',
    description: '+15% max HP. Enemies you touch while moving are knocked back.',
    category: 'creative',
    maxStacks: 2,
    weight: 5,
  },
  {
    id: 'adrenaline_battery',
    name: 'Adrenaline Battery',
    description: 'Killing an enemy grants a stacking +2% move & attack speed for 4s (up to 5 stacks).',
    category: 'creative',
    maxStacks: 1,
    weight: 6,
  },
  {
    id: 'salvage_engine',
    name: 'Salvage Engine',
    description: '10% chance for defeated enemies to drop a bonus XP gem.',
    category: 'creative',
    maxStacks: 2,
    weight: 6,
  },
  {
    id: 'iron_bumper',
    name: 'Iron Bumper',
    description: 'Ramming an enemy at high speed deals bonus impact damage equal to 20% of your max HP.',
    category: 'creative',
    maxStacks: 1,
    weight: 5,
  },
];

export function upgradeById(id: string): UpgradeDef {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) throw new Error(`Unknown upgrade: ${id}`);
  return u;
}
