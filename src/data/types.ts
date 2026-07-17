export type SweeperId = 'manual' | 'electric' | 'gas' | 'truck';

export interface SweeperStats {
  maxHp: number;
  moveSpeed: number; // px/s
  damage: number; // base weapon damage
  attackRange: number; // px
  attackRate: number; // attacks per second
  pickupRadius: number;
  armor: number; // flat damage reduction, 0..1
}

export interface SweeperDef {
  id: SweeperId;
  name: string;
  tagline: string;
  description: string;
  texture: string;
  scale: number;
  unlockCost: number; // SP cost, 0 = unlocked from the start
  stats: SweeperStats;
  passiveName: string;
  passiveDescription: string;
  weaponName: string;
  weaponDescription: string;
}

export type EnemyId = 'litter' | 'mite' | 'slime' | 'spitter' | 'crawler' | 'static';

export interface EnemyDef {
  id: EnemyId;
  name: string;
  texture: string;
  scale: number;
  hp: number;
  speed: number;
  damage: number;
  xp: number;
  contactCooldownMs: number;
  ranged?: boolean;
  minTimeSec: number; // earliest it can spawn, in run seconds
}

export type BossId = 'landfill' | 'grease';

export interface BossDef {
  id: BossId;
  name: string;
  texture: string;
  scale: number;
  baseHp: number;
  speed: number;
  contactDamage: number;
  spDrop: number;
}

export type UpgradeCategory = 'stat' | 'creative';

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  maxStacks: number;
  weight: number;
}

export type MetaUpgradeId =
  | 'maxHp'
  | 'damage'
  | 'moveSpeed'
  | 'pickupRadius'
  | 'armor'
  | 'startLevel'
  | 'spGain';

export interface MetaUpgradeDef {
  id: MetaUpgradeId;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  valuePerLevel: number;
}
