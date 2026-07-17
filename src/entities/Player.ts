import Phaser from 'phaser';
import { DEPTH } from '../config/constants';
import { SweeperDef, SweeperStats } from '../data/types';
import { saveManager } from '../systems/SaveData';
import { Enemy } from './Enemy';

export interface UpgradeStacks {
  [upgradeId: string]: number;
}

const DASH_COOLDOWN_MS = 3200;
const DASH_DURATION_MS = 220;
const DASH_SPEED_MULT = 3.2;
const DASH_IFRAME_MS = 260;

export class Player {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Image;
  def: SweeperDef;
  stats: SweeperStats;
  hp: number;
  maxHp: number;
  facing = 0; // radians
  upgrades: UpgradeStacks = {};

  level = 1;
  xp = 0;
  xpToNext = 10;

  private momentum = 0; // manual sweeper passive, 0..1
  private lastMoveAngle: number | null = null;

  private attackCooldown = 0;
  private staticCooldown = 0;
  private waterJetCooldown = 0;
  private dashCooldownMs = 0;
  private dashTimeRemaining = 0;
  private iframeMs = 0;
  private hitCounter = 0; // for overcharge_coil
  private killsSinceCompactor = 0;
  private adrenalineStacks = 0;
  private adrenalineTimer = 0;
  private secondWindCharges = 0;
  private speedBurstTimer = 0;

  private regenAccum = 0;
  private trailAccum = 0;

  invulnerable = false;
  isDead = false;

  onDamaged?: (dmg: number) => void;
  onKillEnemy?: (enemy: Enemy) => void;
  onXpChanged?: () => void;
  onLevelUp?: () => void;
  onDeath?: () => void;
  onRequestTrail?: (x: number, y: number) => void;
  onRequestShockwave?: (x: number, y: number, radius: number, dmg: number, knockback: boolean) => void;
  onRequestExplosion?: (x: number, y: number, radius: number, dmg: number) => void;
  onRequestChainZap?: (originX: number, originY: number, count: number, dmg: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, def: SweeperDef) {
    this.scene = scene;
    this.def = def;

    this.stats = this.computeBaseStats(def);
    this.maxHp = this.stats.maxHp;
    this.hp = this.maxHp;

    this.sprite = scene.add.image(x, y, def.texture).setDepth(DEPTH.PLAYER).setScale(def.scale);
  }

  private computeBaseStats(def: SweeperDef): SweeperStats {
    const s = def.stats;
    return {
      maxHp: Math.round(s.maxHp + saveManager.metaBonus('maxHp')),
      moveSpeed: s.moveSpeed * (1 + saveManager.metaBonus('moveSpeed')),
      damage: s.damage * (1 + saveManager.metaBonus('damage')),
      attackRange: s.attackRange,
      attackRate: s.attackRate,
      pickupRadius: s.pickupRadius * (1 + saveManager.metaBonus('pickupRadius')),
      armor: Math.min(0.75, s.armor + saveManager.metaBonus('armor')),
    };
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }

  private stackCount(id: string): number {
    return this.upgrades[id] ?? 0;
  }

  addUpgrade(id: string): void {
    this.upgrades[id] = (this.upgrades[id] ?? 0) + 1;
    if (id === 'reinforced_chassis') {
      this.maxHp += 20;
      this.hp += 20;
    }
    if (id === 'heavy_roller') {
      this.maxHp *= 1.15;
      this.hp = Math.min(this.hp * 1.15, this.maxHp);
    }
    if (id === 'second_wind') {
      this.secondWindCharges += 1;
    }
  }

  private effectiveStats() {
    let dmgMult = 1;
    let rangeMult = 1;
    let rateMult = 1;
    let speedMult = 1;
    let pickupMult = 1;
    let armorAdd = 0;

    dmgMult += 0.15 * this.stackCount('sharpened_bristles');
    speedMult += 0.1 * this.stackCount('nimble_wheels');
    rangeMult += 0.15 * this.stackCount('wide_sweep');
    rateMult += 0.15 * this.stackCount('rapid_cycle');
    pickupMult += 0.25 * this.stackCount('extended_reach');
    armorAdd += 0.08 * this.stackCount('insulated_plating');

    if (this.stackCount('turbo_brush')) {
      rateMult += 0.3;
      rangeMult -= 0.15;
    }
    if (this.stackCount('debris_magnet')) {
      pickupMult *= 2;
    }

    // momentum (manual sweeper passive)
    dmgMult *= 1 + this.momentum * 0.5;

    // adrenaline battery
    if (this.adrenalineStacks > 0) {
      const b = this.adrenalineStacks * 0.02;
      speedMult += b;
      rateMult += b;
    }

    if (this.speedBurstTimer > 0) speedMult += 0.4;

    return { dmgMult, rangeMult, rateMult, speedMult, pickupMult, armorAdd };
  }

  get currentPickupRadius(): number {
    return this.stats.pickupRadius * this.effectiveStats().pickupMult;
  }

  get currentMoveSpeed(): number {
    const dashMult = this.dashTimeRemaining > 0 ? DASH_SPEED_MULT : 1;
    return this.stats.moveSpeed * this.effectiveStats().speedMult * dashMult;
  }

  addXp(amount: number): void {
    this.xp += amount;
    this.onXpChanged?.();
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = Math.round(10 + this.level * 6.5);
      this.onLevelUp?.();
    }
  }

  takeDamage(amount: number): void {
    if (this.isDead || this.invulnerable || this.iframeMs > 0) return;
    const armor = this.stats.armor + this.effectiveStats().armorAdd;
    const dmg = Math.max(1, Math.round(amount * (1 - Math.min(0.85, armor))));

    if (this.hp - dmg <= 0 && this.secondWindCharges > 0) {
      this.secondWindCharges -= 1;
      this.hp = 1;
      this.iframeMs = 800;
      this.onRequestShockwave?.(this.x, this.y, 220, this.stats.damage * 3, true);
      this.onDamaged?.(dmg);
      return;
    }

    this.hp -= dmg;
    this.onDamaged?.(dmg);

    const backdraftStacks = this.stackCount('backdraft_plating');
    if (backdraftStacks > 0 && Math.random() < 0.2) {
      this.onRequestShockwave?.(this.x, this.y, 130 + backdraftStacks * 20, this.stats.damage * 0.8, true);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.onDeath?.();
    }
  }

  tryDash(): boolean {
    if (this.dashCooldownMs > 0 || this.dashTimeRemaining > 0) return false;
    this.dashTimeRemaining = DASH_DURATION_MS;
    this.dashCooldownMs = DASH_COOLDOWN_MS;
    this.iframeMs = Math.max(this.iframeMs, DASH_IFRAME_MS);
    return true;
  }

  get dashCooldownRatio(): number {
    return Phaser.Math.Clamp(this.dashCooldownMs / DASH_COOLDOWN_MS, 0, 1);
  }

  move(dx: number, dy: number, dt: number): void {
    const speed = this.currentMoveSpeed;
    this.sprite.x += dx * speed * dt;
    this.sprite.y += dy * speed * dt;

    if (dx !== 0 || dy !== 0) {
      const angle = Math.atan2(dy, dx);
      if (this.lastMoveAngle !== null) {
        const diff = Phaser.Math.Angle.Wrap(angle - this.lastMoveAngle);
        if (Math.abs(diff) < 0.35) {
          this.momentum = Math.min(1, this.momentum + dt * 0.6);
        } else {
          this.momentum = Math.max(0, this.momentum - dt * 2.5);
        }
      }
      this.lastMoveAngle = angle;

      // Iron Bumper handled by GameScene via collision check (needs speed context)

      // Fumes / Scorched Trail leave a damaging trail periodically
      const wantsTrail = this.def.id === 'gas' || this.stackCount('scorched_trail') > 0;
      if (wantsTrail) {
        this.trailAccum += dt;
        if (this.trailAccum > 0.12) {
          this.trailAccum = 0;
          this.onRequestTrail?.(this.x, this.y);
        }
      }
    } else {
      this.momentum = Math.max(0, this.momentum - dt * 1.5);
    }
  }

  faceAngle(angle: number): void {
    this.facing = angle;
    this.sprite.setRotation(angle);
  }

  registerHit(): { crit: boolean } {
    this.hitCounter += 1;
    const overcharge = this.stackCount('overcharge_coil') > 0 && this.hitCounter % 5 === 0;
    return { crit: overcharge };
  }

  registerKill(enemy: Enemy): void {
    this.onKillEnemy?.(enemy);

    if (this.stackCount('adrenaline_battery') > 0) {
      this.adrenalineStacks = Math.min(5, this.adrenalineStacks + 1);
      this.adrenalineTimer = 4000;
    }

    const compactorStacks = this.stackCount('waste_compactor');
    if (compactorStacks > 0) {
      this.killsSinceCompactor += 1;
      if (this.killsSinceCompactor >= 15) {
        this.killsSinceCompactor = 0;
        this.onRequestExplosion?.(enemy.x, enemy.y, 90 + compactorStacks * 20, this.stats.damage * 2.5);
      }
    }
  }

  get damage(): number {
    return this.stats.damage * this.effectiveStats().dmgMult;
  }
  get attackRange(): number {
    return this.stats.attackRange * this.effectiveStats().rangeMult;
  }
  get attackRate(): number {
    return this.stats.attackRate * this.effectiveStats().rateMult;
  }

  /** returns true when it's time to fire based on internal cooldown */
  updateAttackTimer(dt: number): boolean {
    this.attackCooldown -= dt;
    if (this.attackCooldown <= 0) {
      this.attackCooldown = 1 / this.attackRate;
      return true;
    }
    return false;
  }

  updateTimers(dt: number): {
    staticPulse: boolean;
    waterJet: boolean;
  } {
    const dtMs = dt * 1000;
    if (this.dashCooldownMs > 0) this.dashCooldownMs -= dtMs;
    if (this.dashTimeRemaining > 0) this.dashTimeRemaining -= dtMs;
    if (this.iframeMs > 0) this.iframeMs -= dtMs;
    if (this.speedBurstTimer > 0) this.speedBurstTimer -= dtMs;
    if (this.adrenalineTimer > 0) {
      this.adrenalineTimer -= dtMs;
      if (this.adrenalineTimer <= 0) {
        this.adrenalineStacks = Math.max(0, this.adrenalineStacks - 1);
        this.adrenalineTimer = this.adrenalineStacks > 0 ? 4000 : 0;
      }
    }

    // regen
    if (this.stackCount('auto_repair') > 0 && this.hp < this.maxHp) {
      this.regenAccum += dt * this.stackCount('auto_repair');
      if (this.regenAccum >= 1) {
        const heal = Math.floor(this.regenAccum);
        this.regenAccum -= heal;
        this.hp = Math.min(this.maxHp, this.hp + heal);
      }
    }

    let staticPulse = false;
    const hasStatic = this.def.id === 'electric' || this.stackCount('static_overload') > 0;
    if (hasStatic) {
      const interval = this.def.id === 'electric' ? 6 : 8;
      const speedFactor = this.stackCount('static_overload') > 0 && this.def.id === 'electric' ? 0.6 : 1;
      this.staticCooldown -= dt;
      if (this.staticCooldown <= 0) {
        this.staticCooldown = interval * speedFactor;
        staticPulse = true;
      }
    }

    let waterJet = false;
    if (this.def.id === 'truck') {
      this.waterJetCooldown -= dt;
      if (this.waterJetCooldown <= 0) {
        this.waterJetCooldown = 7;
        waterJet = true;
      }
    }

    return { staticPulse, waterJet };
  }

  grantSpeedBurst(): void {
    this.speedBurstTimer = 1500;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
