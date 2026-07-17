import { SweeperDef } from './types';

export const SWEEPERS: Record<string, SweeperDef> = {
  manual: {
    id: 'manual',
    name: 'Push Broom',
    tagline: 'Cheap. Honest. Relentless.',
    description:
      'A hand-pushed bin-and-broom rig. No engine, no battery — just elbow grease. Keep moving in one direction and it hits harder.',
    texture: 'sweeper-manual',
    scale: 1,
    unlockCost: 0,
    stats: {
      maxHp: 100,
      moveSpeed: 150,
      damage: 11,
      attackRange: 78,
      attackRate: 2.2,
      pickupRadius: 70,
      armor: 0,
    },
    passiveName: 'Momentum',
    passiveDescription:
      'Holding a straight heading builds Momentum, up to +50% sweep damage. Sharp turns or stopping resets it.',
    weaponName: 'Broom Arc',
    weaponDescription: 'A wide frontal sweep that hits everything in the cone in front of you.',
  },
  electric: {
    id: 'electric',
    name: 'Electro Compact',
    tagline: 'Small, quick, always buzzing.',
    description:
      'A battery-powered pod with twin spinning side brushes. Fragile, but nothing outruns it, and it periodically discharges static into the crowd.',
    texture: 'sweeper-electric',
    scale: 1,
    unlockCost: 60,
    stats: {
      maxHp: 65,
      moveSpeed: 220,
      damage: 6,
      attackRange: 58,
      attackRate: 4.5,
      pickupRadius: 90,
      armor: 0,
    },
    passiveName: 'Static Charge',
    passiveDescription: 'Every 6s, releases a static pulse that zaps up to 4 nearby enemies.',
    weaponName: 'Twin Brushes',
    weaponDescription: 'Two orbiting side-brushes deal rapid low damage to anything they touch.',
  },
  gas: {
    id: 'gas',
    name: 'Fume Hauler',
    tagline: 'Heavy-duty and always running hot.',
    description:
      'A gas-powered vacuum unit that pulls debris — and enemies — toward its intake, and burns a lingering trail of exhaust into the ground behind it.',
    texture: 'sweeper-gas',
    scale: 1,
    unlockCost: 150,
    stats: {
      maxHp: 150,
      moveSpeed: 120,
      damage: 8,
      attackRange: 100,
      attackRate: 3,
      pickupRadius: 80,
      armor: 0.08,
    },
    passiveName: 'Fumes',
    passiveDescription: 'Leaves a trail of exhaust that damages and slows enemies standing in it.',
    weaponName: 'Vacuum Aura',
    weaponDescription: 'A continuous pulling aura around the machine that drags in and damages nearby enemies.',
  },
  truck: {
    id: 'truck',
    name: 'Titan Roller',
    tagline: 'Slow as sin. Twice as heavy.',
    description:
      'An industrial street-sweeper truck. Barely turns, but its rotating brush drum and water cannon flatten anything unlucky enough to be in front of it.',
    texture: 'sweeper-truck',
    scale: 1,
    unlockCost: 320,
    stats: {
      maxHp: 240,
      moveSpeed: 90,
      damage: 18,
      attackRange: 95,
      attackRate: 1.6,
      pickupRadius: 65,
      armor: 0.15,
    },
    passiveName: 'Water Jet',
    passiveDescription: 'Every 7s, fires a knockback cone that stuns and pushes back everything it hits.',
    weaponName: 'Brush Drum',
    weaponDescription: 'A powerful rotating drum on the front deals heavy damage in a short arc.',
  },
};

export const SWEEPER_ORDER = ['manual', 'electric', 'gas', 'truck'] as const;
