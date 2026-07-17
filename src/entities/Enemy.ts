import Phaser from 'phaser';
import { DEPTH } from '../config/constants';
import { EnemyDef } from '../data/types';

export class Enemy {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Image;
  def: EnemyDef;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  isDead = false;
  lastContactMs = -99999;
  isSplit: boolean;
  private rangedCooldown = 0;
  private slowUntilMs = 0;
  private stunnedUntilMs = 0;
  private wobble = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef, hpMult = 1, isSplit = false) {
    this.scene = scene;
    this.def = def;
    this.isSplit = isSplit;
    this.hp = Math.round(def.hp * hpMult) * (isSplit ? 0.45 : 1);
    this.maxHp = this.hp;
    this.speed = def.speed;
    this.damage = def.damage;
    const scale = def.scale * (isSplit ? 0.65 : 1);
    this.sprite = scene.add.image(x, y, def.texture).setDepth(DEPTH.ENEMY).setScale(scale);
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }

  applySlow(ms: number): void {
    this.slowUntilMs = Math.max(this.slowUntilMs, this.scene.time.now + ms);
  }

  stun(ms: number): void {
    this.stunnedUntilMs = Math.max(this.stunnedUntilMs, this.scene.time.now + ms);
  }

  knockback(fromX: number, fromY: number, force: number): void {
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const d = Math.hypot(dx, dy) || 1;
    this.sprite.x += (dx / d) * force;
    this.sprite.y += (dy / d) * force;
  }

  private get slowFactor(): number {
    return this.scene.time.now < this.slowUntilMs ? 0.5 : 1;
  }

  /** Returns a fired-projectile request point if this tick it should shoot. */
  update(dt: number, targetX: number, targetY: number): { wantsFire: boolean } {
    if (this.scene.time.now < this.stunnedUntilMs) {
      return { wantsFire: false };
    }
    this.wobble += dt * 4;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    let wantsFire = false;

    if (this.def.ranged) {
      const preferredDist = 260;
      const dir = dist < preferredDist - 20 ? -1 : dist > preferredDist + 20 ? 1 : 0;
      const nx = (dx / dist) * dir;
      const ny = (dy / dist) * dir;
      this.sprite.x += nx * this.speed * this.slowFactor * dt;
      this.sprite.y += ny * this.speed * this.slowFactor * dt;

      this.rangedCooldown -= dt;
      if (this.rangedCooldown <= 0 && dist < 420) {
        this.rangedCooldown = 2.2;
        wantsFire = true;
      }
    } else {
      const jitter = this.def.id === 'mite' ? Math.sin(this.wobble) * 0.5 : 0;
      const angle = Math.atan2(dy, dx) + jitter;
      this.sprite.x += Math.cos(angle) * this.speed * this.slowFactor * dt;
      this.sprite.y += Math.sin(angle) * this.speed * this.slowFactor * dt;
    }

    this.sprite.setRotation(Math.atan2(dy, dx));
    return { wantsFire };
  }

  takeDamage(amount: number): void {
    if (this.isDead) return;
    this.hp -= amount;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
    if (this.hp <= 0) {
      this.isDead = true;
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
