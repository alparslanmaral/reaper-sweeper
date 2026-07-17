import Phaser from 'phaser';
import { DEPTH } from '../config/constants';
import { BossDef } from '../data/types';

type BossState = 'chase' | 'telegraph' | 'recover';

export interface BossAttackRequest {
  type: 'slam' | 'summon';
  x: number;
  y: number;
  radius: number;
}

export class Boss {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Image;
  def: BossDef;
  hp: number;
  maxHp: number;
  speed: number;
  contactDamage: number;
  isDead = false;
  lastContactMs = -99999;
  name: string;

  private state: BossState = 'chase';
  private stateTimer = 0;
  private attackTimer = 3;
  private attackCount = 0;
  private telegraphRadius = 150;
  private telegraphX = 0;
  private telegraphY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, def: BossDef, hpMult: number, dmgMult: number) {
    this.scene = scene;
    this.def = def;
    this.name = def.name;
    this.hp = Math.round(def.baseHp * hpMult);
    this.maxHp = this.hp;
    this.speed = def.speed;
    this.contactDamage = Math.round(def.contactDamage * dmgMult);
    this.sprite = scene.add.image(x, y, def.texture).setDepth(DEPTH.ENEMY).setScale(def.scale);
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }

  update(dt: number, targetX: number, targetY: number): BossAttackRequest | null {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.sprite.setRotation(Math.atan2(dy, dx));

    let result: BossAttackRequest | null = null;

    if (this.state === 'chase') {
      this.sprite.x += (dx / dist) * this.speed * dt;
      this.sprite.y += (dy / dist) * this.speed * dt;

      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.state = 'telegraph';
        this.stateTimer = 0.9;
        this.telegraphX = targetX;
        this.telegraphY = targetY;
        this.attackCount += 1;
      }
    } else if (this.state === 'telegraph') {
      this.stateTimer -= dt;
      // slowly drift toward the telegraphed spot
      const tdx = this.telegraphX - this.x;
      const tdy = this.telegraphY - this.y;
      const tdist = Math.hypot(tdx, tdy) || 1;
      this.sprite.x += (tdx / tdist) * this.speed * 0.3 * dt;
      this.sprite.y += (tdy / tdist) * this.speed * 0.3 * dt;

      if (this.stateTimer <= 0) {
        const summon = this.attackCount % 3 === 0;
        result = {
          type: summon ? 'summon' : 'slam',
          x: this.x,
          y: this.y,
          radius: this.telegraphRadius,
        };
        this.state = 'recover';
        this.stateTimer = 1.1;
        this.attackTimer = 3.4;
      }
    } else if (this.state === 'recover') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.state = 'chase';
    }

    return result;
  }

  get isTelegraphing(): boolean {
    return this.state === 'telegraph';
  }
  get telegraphProgress(): number {
    return this.state === 'telegraph' ? 1 - Phaser.Math.Clamp(this.stateTimer / 0.9, 0, 1) : 0;
  }
  get telegraphPos(): { x: number; y: number; radius: number } {
    return { x: this.telegraphX, y: this.telegraphY, radius: this.telegraphRadius };
  }

  takeDamage(amount: number): void {
    if (this.isDead) return;
    this.hp -= amount;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
