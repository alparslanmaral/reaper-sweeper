import { STORAGE_KEY } from '../config/constants';
import { META_UPGRADES, metaUpgradeById } from '../data/metaUpgrades';
import { SWEEPER_ORDER } from '../data/sweepers';
import { MetaUpgradeId, SweeperId } from '../data/types';

export interface SaveState {
  sp: number;
  unlockedSweepers: SweeperId[];
  metaLevels: Record<MetaUpgradeId, number>;
  stats: {
    runsPlayed: number;
    bossKillsTotal: number;
    bestSurvivalSec: number;
  };
}

function defaultSave(): SaveState {
  return {
    sp: 0,
    unlockedSweepers: ['manual'],
    metaLevels: {
      maxHp: 0,
      damage: 0,
      moveSpeed: 0,
      pickupRadius: 0,
      armor: 0,
      startLevel: 0,
      spGain: 0,
    },
    stats: { runsPlayed: 0, bossKillsTotal: 0, bestSurvivalSec: 0 },
  };
}

class SaveManager {
  private state: SaveState;

  constructor() {
    this.state = this.load();
  }

  private load(): SaveState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      // merge with defaults so new fields added later don't break old saves
      const d = defaultSave();
      return {
        ...d,
        ...parsed,
        metaLevels: { ...d.metaLevels, ...(parsed.metaLevels ?? {}) },
        stats: { ...d.stats, ...(parsed.stats ?? {}) },
      };
    } catch {
      return defaultSave();
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  get(): Readonly<SaveState> {
    return this.state;
  }

  addSp(amount: number): void {
    if (amount <= 0) return;
    const bonus = 1 + this.state.metaLevels.spGain * metaUpgradeById('spGain').valuePerLevel;
    this.state.sp += Math.round(amount * bonus);
    this.persist();
  }

  spendSp(amount: number): boolean {
    if (this.state.sp < amount) return false;
    this.state.sp -= amount;
    this.persist();
    return true;
  }

  metaCost(id: MetaUpgradeId): number | null {
    const def = metaUpgradeById(id);
    const level = this.state.metaLevels[id];
    if (level >= def.maxLevel) return null;
    return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
  }

  buyMetaUpgrade(id: MetaUpgradeId): boolean {
    const cost = this.metaCost(id);
    if (cost === null) return false;
    if (!this.spendSp(cost)) return false;
    this.state.metaLevels[id] += 1;
    this.persist();
    return true;
  }

  unlockSweeper(id: SweeperId, cost: number): boolean {
    if (this.state.unlockedSweepers.includes(id)) return true;
    if (!this.spendSp(cost)) return false;
    this.state.unlockedSweepers.push(id);
    this.persist();
    return true;
  }

  isUnlocked(id: SweeperId): boolean {
    return this.state.unlockedSweepers.includes(id);
  }

  recordRunEnd(survivalSec: number, bossKills: number): void {
    this.state.stats.runsPlayed += 1;
    this.state.stats.bossKillsTotal += bossKills;
    if (survivalSec > this.state.stats.bestSurvivalSec) {
      this.state.stats.bestSurvivalSec = survivalSec;
    }
    this.persist();
  }

  metaBonus(id: MetaUpgradeId): number {
    return this.state.metaLevels[id] * metaUpgradeById(id).valuePerLevel;
  }
}

export const saveManager = new SaveManager();

export function allMetaDefs() {
  return META_UPGRADES;
}

export function allSweeperIds(): SweeperId[] {
  return [...SWEEPER_ORDER];
}
