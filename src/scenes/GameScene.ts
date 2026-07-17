import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss, BossAttackRequest } from '../entities/Boss';
import { SpawnManager } from '../systems/SpawnManager';
import { InputController } from '../systems/InputController';
import { SWEEPERS } from '../data/sweepers';
import { UPGRADES } from '../data/upgrades';
import { bossForIndex } from '../data/bosses';
import { ENEMIES } from '../data/enemies';
import { saveManager } from '../systems/SaveData';
import { DEPTH, WORLD_SIZE, BOSS_INTERVAL_MS, isMobileDevice } from '../config/constants';
import { SweeperId, UpgradeDef } from '../data/types';

interface EnemyProjectile {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  damage: number;
  life: number;
}
interface XpGem {
  sprite: Phaser.GameObjects.Image;
  value: number;
}
interface TrailZone {
  sprite: Phaser.GameObjects.Image;
  life: number;
  slows: boolean;
  dps: number;
}

const PLAYER_RADIUS = 22;

export class GameScene extends Phaser.Scene {
  private sweeperId!: SweeperId;
  private player!: Player;
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private xpGems: XpGem[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private trailZones: TrailZone[] = [];
  private spawner!: SpawnManager;
  private controller!: InputController;
  private isMobile = false;

  private elapsedMs = 0;
  private nextBossAtMs = BOSS_INTERVAL_MS;
  private bossIndex = 0;
  private bossKillsThisRun = 0;
  private spEarnedThisRun = 0;
  private continuousHitTimers = new Map<Enemy | Boss, number>();
  private trailHitTimers = new Map<Enemy | Boss, number>();
  private orbitAngle = 0;
  private runOver = false;

  private hpBarBg!: Phaser.GameObjects.Image;
  private hpBarFill!: Phaser.GameObjects.Image;
  private xpBarBg!: Phaser.GameObjects.Image;
  private xpBarFill!: Phaser.GameObjects.Image;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private spText!: Phaser.GameObjects.Text;
  private bossBanner!: Phaser.GameObjects.Text;
  private bossHpBg!: Phaser.GameObjects.Image;
  private bossHpFill!: Phaser.GameObjects.Image;
  private bossNameText!: Phaser.GameObjects.Text;
  private weaponGfx!: Phaser.GameObjects.Graphics;
  private telegraphGfx!: Phaser.GameObjects.Graphics;
  private orbitSprites: Phaser.GameObjects.Image[] = [];
  private auraSprite?: Phaser.GameObjects.Image;

  constructor() {
    super('Game');
  }

  init(data: { sweeperId: SweeperId }): void {
    this.sweeperId = data.sweeperId ?? 'manual';
    this.enemies = [];
    this.boss = null;
    this.xpGems = [];
    this.enemyProjectiles = [];
    this.trailZones = [];
    this.elapsedMs = 0;
    this.nextBossAtMs = BOSS_INTERVAL_MS;
    this.bossIndex = 0;
    this.bossKillsThisRun = 0;
    this.spEarnedThisRun = 0;
    this.continuousHitTimers = new Map();
    this.trailHitTimers = new Map();
    this.orbitAngle = 0;
    this.runOver = false;
    this.orbitSprites = [];
  }

  create(): void {
    this.isMobile = isMobileDevice();

    const half = WORLD_SIZE / 2;
    const ground = this.add.tileSprite(0, 0, WORLD_SIZE, WORLD_SIZE, 'tile-ground');
    ground.setDepth(DEPTH.GROUND);
    this.add
      .rectangle(0, 0, WORLD_SIZE, WORLD_SIZE, 0x000000, 0)
      .setStrokeStyle(6, 0x4a3f2a, 0.6);

    this.cameras.main.setBounds(-half, -half, WORLD_SIZE, WORLD_SIZE);

    this.player = new Player(this, 0, 0, SWEEPERS[this.sweeperId]);
    this.applyStartLevelBonus();

    this.player.onDamaged = () => {
      this.cameras.main.shake(120, 0.006);
      this.player.sprite.setTintFill(0xff5252);
      this.time.delayedCall(80, () => this.player.sprite.clearTint());
      this.refreshHud();
    };
    this.player.onXpChanged = () => this.refreshHud();
    this.player.onLevelUp = () => this.triggerLevelUpChoice();
    this.player.onDeath = () => this.handleGameOver();
    this.player.onRequestTrail = (x, y) => this.spawnTrail(x, y);
    this.player.onRequestShockwave = (x, y, radius, dmg, knockback) => this.doShockwave(x, y, radius, dmg, knockback);
    this.player.onRequestExplosion = (x, y, radius, dmg) => this.doExplosion(x, y, radius, dmg);
    this.player.onKillEnemy = () => {};

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

    this.spawner = new SpawnManager(this);
    this.controller = new InputController(this, this.isMobile);

    this.weaponGfx = this.add.graphics().setDepth(DEPTH.VFX);
    this.telegraphGfx = this.add.graphics().setDepth(DEPTH.VFX - 1);

    if (this.sweeperId === 'electric') {
      for (let i = 0; i < 2; i++) {
        const s = this.add.image(0, 0, 'vfx-dot').setDepth(DEPTH.PLAYER - 1).setTint(0x26c6da).setScale(2.4);
        this.orbitSprites.push(s);
      }
    }
    if (this.sweeperId === 'gas') {
      this.auraSprite = this.add
        .image(0, 0, 'vfx-ring')
        .setDepth(DEPTH.PLAYER - 1)
        .setTint(0xfb8c00)
        .setAlpha(0.25);
    }

    this.buildHud();
    this.refreshHud();

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.handleResize(size.width, size.height);
  }

  private handleResize(w: number, h: number): void {
    this.controller.resize(w, h);
    this.timerText.setPosition(w / 2, this.timerText.y);
    this.spText.setPosition(w / 2, this.spText.y);
    this.bossBanner.setPosition(w / 2, this.bossBanner.y);
    this.bossNameText.setPosition(w / 2, this.bossNameText.y);
    const bossBarW = 320;
    this.bossHpBg.setPosition(w / 2 - bossBarW / 2, this.bossHpBg.y);
    this.bossHpFill.setPosition(w / 2 - bossBarW / 2 + 2, this.bossHpFill.y);
  }

  // ------------------------------------------------------------------ HUD
  private buildHud(): void {
    const barW = 260;
    const x = 24;
    let y = 20;

    this.hpBarBg = this.add.image(x, y, 'ui-pixel').setOrigin(0, 0).setDisplaySize(barW, 18).setTint(0x330000).setScrollFactor(0).setDepth(DEPTH.UI);
    this.hpBarFill = this.add.image(x + 2, y + 2, 'ui-pixel').setOrigin(0, 0).setDisplaySize(barW - 4, 14).setTint(0xff5252).setScrollFactor(0).setDepth(DEPTH.UI + 1);

    y += 24;
    this.xpBarBg = this.add.image(x, y, 'ui-pixel').setOrigin(0, 0).setDisplaySize(barW, 10).setTint(0x1a2e1a).setScrollFactor(0).setDepth(DEPTH.UI);
    this.xpBarFill = this.add.image(x + 2, y + 2, 'ui-pixel').setOrigin(0, 0).setDisplaySize(barW - 4, 6).setTint(0x64ffda).setScrollFactor(0).setDepth(DEPTH.UI + 1);

    this.levelText = this.add
      .text(x, y + 18, 'Lv.1', { fontSize: '16px', color: '#e0f7fa', fontStyle: 'bold' })
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 1);

    this.timerText = this.add
      .text(this.scale.width / 2, 20, '00:00', { fontSize: '26px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 1);

    this.spText = this.add
      .text(this.scale.width / 2, 52, 'SP 0', { fontSize: '14px', color: '#ffd54f' })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 1);

    this.bossBanner = this.add
      .text(this.scale.width / 2, 90, '', { fontSize: '20px', color: '#ff8a65', fontStyle: 'bold' })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 1)
      .setAlpha(0);

    const bossBarW = 320;
    const bx = this.scale.width / 2 - bossBarW / 2;
    this.bossHpBg = this.add
      .image(bx, 128, 'ui-pixel')
      .setOrigin(0, 0)
      .setDisplaySize(bossBarW, 14)
      .setTint(0x2a1010)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI)
      .setVisible(false);
    this.bossHpFill = this.add
      .image(bx + 2, 130, 'ui-pixel')
      .setOrigin(0, 0)
      .setDisplaySize(bossBarW - 4, 10)
      .setTint(0xef5350)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 1)
      .setVisible(false);
    this.bossNameText = this.add
      .text(this.scale.width / 2, 112, '', { fontSize: '14px', color: '#ffab91' })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 1)
      .setVisible(false);
  }

  private refreshHud(): void {
    const hpRatio = Phaser.Math.Clamp(this.player.hp / this.player.maxHp, 0, 1);
    this.hpBarFill.setDisplaySize(256 * hpRatio, 14);
    const xpRatio = Phaser.Math.Clamp(this.player.xp / this.player.xpToNext, 0, 1);
    this.xpBarFill.setDisplaySize(256 * xpRatio, 6);
    this.levelText.setText(`Lv.${this.player.level}`);
    this.spText.setText(`SP ${saveManager.get().sp}`);

    if (this.boss) {
      const ratio = Phaser.Math.Clamp(this.boss.hp / this.boss.maxHp, 0, 1);
      this.bossHpFill.setDisplaySize(316 * ratio, 10);
    }
  }

  private applyStartLevelBonus(): void {
    const bonusLevels = saveManager.get().metaLevels.startLevel;
    for (let i = 0; i < bonusLevels; i++) {
      const choices = this.rollUpgradeChoices(1);
      if (choices[0]) this.player.addUpgrade(choices[0].id);
    }
  }

  // -------------------------------------------------------------- update
  update(_time: number, delta: number): void {
    if (this.runOver) return;
    const dt = Math.min(delta, 50) / 1000;
    this.elapsedMs += delta;

    this.updatePlayer(dt);
    this.updateWeapon(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateProjectiles(dt);
    this.updateTrails(dt);
    this.updateXpGems(dt);
    this.updateBossSchedule();

    const newly = this.spawner.update(dt, this.elapsedMs / 1000, this.player.x, this.player.y);
    this.enemies.push(...newly);

    this.timerText.setText(this.formatTime(this.elapsedMs));
    this.refreshHud();
  }

  private formatTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // ------------------------------------------------------------- player
  private findNearestTarget(): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    for (const e of this.enemies) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < bestDist) {
        bestDist = d;
        best = { x: e.x, y: e.y };
      }
    }
    if (this.boss) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
      if (d < bestDist) best = { x: this.boss.x, y: this.boss.y };
    }
    return best;
  }

  private updatePlayer(dt: number): void {
    const frame = this.controller.getFrame();
    const half = WORLD_SIZE / 2 - 24;

    this.player.move(frame.moveX, frame.moveY, dt);
    this.player.sprite.x = Phaser.Math.Clamp(this.player.sprite.x, -half, half);
    this.player.sprite.y = Phaser.Math.Clamp(this.player.sprite.y, -half, half);

    let facing = this.player.facing;
    if (frame.hasManualAim) {
      facing = Phaser.Math.Angle.Between(this.player.x, this.player.y, frame.aimWorldX, frame.aimWorldY);
    } else if (frame.moving) {
      facing = Math.atan2(frame.moveY, frame.moveX);
    } else {
      const target = this.findNearestTarget();
      if (target) facing = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    }
    this.player.faceAngle(facing);

    if (frame.dashPressed) this.player.tryDash();
    this.controller.setDashCooldownVisual(this.player.dashCooldownRatio);
    if (this.controller.isPausePressed()) this.openPauseMenu();

    const timers = this.player.updateTimers(dt);
    if (timers.staticPulse) this.doStaticPulse();
    if (timers.waterJet) this.doWaterJet();
  }

  // ------------------------------------------------------------- weapon
  private updateWeapon(dt: number): void {
    this.weaponGfx.clear();

    if (this.sweeperId === 'manual' || this.sweeperId === 'truck') {
      if (this.player.updateAttackTimer(dt)) this.doConeAttack();
    } else if (this.sweeperId === 'electric') {
      this.doTwinBrush(dt);
    } else if (this.sweeperId === 'gas') {
      this.doVacuumAura(dt);
    }
  }

  private allTargets(): (Enemy | Boss)[] {
    const list: (Enemy | Boss)[] = [...this.enemies];
    if (this.boss) list.push(this.boss);
    return list;
  }

  private targetRadius(t: Enemy | Boss): number {
    return t.sprite.displayWidth * 0.35;
  }

  private doConeAttack(): void {
    const range = this.player.attackRange;
    const halfAngle = (this.sweeperId === 'truck' ? 0.65 : 0.75) * Math.PI * 0.5;
    const facing = this.player.facing;
    const pullIn = this.player.upgrades['dust_devil'] > 0;

    const hitTargets: (Enemy | Boss)[] = [];
    for (const t of this.allTargets()) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y);
      if (d > range + this.targetRadius(t)) continue;
      const angleTo = Phaser.Math.Angle.Between(this.player.x, this.player.y, t.x, t.y);
      const diff = Math.abs(Phaser.Math.Angle.Wrap(angleTo - facing));
      if (diff <= halfAngle) hitTargets.push(t);
    }

    for (const t of hitTargets) {
      if (pullIn) {
        const pd = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y);
        const ang = Phaser.Math.Angle.Between(t.x, t.y, this.player.x, this.player.y);
        const pull = Math.min(18, pd * 0.15);
        t.sprite.x += Math.cos(ang) * pull;
        t.sprite.y += Math.sin(ang) * pull;
      }
      this.dealDamageTo(t, this.player.damage);
    }

    // visual arc
    this.weaponGfx.fillStyle(0xffffff, 0.28);
    this.weaponGfx.slice(this.player.x, this.player.y, range, facing - halfAngle, facing + halfAngle, false);
    this.weaponGfx.fillPath();
    this.time.delayedCall(90, () => this.weaponGfx.clear());
  }

  private doTwinBrush(dt: number): void {
    this.orbitAngle += dt * 5.2;
    const range = this.player.attackRange;
    const offsets = [this.orbitAngle, this.orbitAngle + Math.PI];
    const hitRadius = 22;

    offsets.forEach((a, i) => {
      const ox = this.player.x + Math.cos(a) * range * 0.55;
      const oy = this.player.y + Math.sin(a) * range * 0.55;
      if (this.orbitSprites[i]) this.orbitSprites[i].setPosition(ox, oy);

      for (const t of this.allTargets()) {
        const d = Phaser.Math.Distance.Between(ox, oy, t.x, t.y);
        if (d <= hitRadius + this.targetRadius(t)) {
          this.tryTickDamage(t, this.player.damage, this.player.attackRate);
        }
      }
    });
  }

  private doVacuumAura(dt: number): void {
    const range = this.player.attackRange;
    this.auraSprite?.setPosition(this.player.x, this.player.y).setDisplaySize(range * 2, range * 2);

    for (const t of this.allTargets()) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y);
      if (d <= range) {
        this.tryTickDamage(t, this.player.damage, this.player.attackRate);
        if (d > 30) {
          const ang = Phaser.Math.Angle.Between(t.x, t.y, this.player.x, this.player.y);
          t.sprite.x += Math.cos(ang) * 20 * dt;
          t.sprite.y += Math.sin(ang) * 20 * dt;
        }
      }
    }
    void dt;
  }

  private tryTickDamage(t: Enemy | Boss, dmg: number, rate: number): void {
    const now = this.time.now;
    const next = this.continuousHitTimers.get(t) ?? 0;
    if (now >= next) {
      this.continuousHitTimers.set(t, now + 1000 / rate);
      this.dealDamageTo(t, dmg);
    }
  }

  private dealDamageTo(t: Enemy | Boss, amount: number): void {
    const { crit } = this.player.registerHit();
    let dmg = amount;
    if (crit) {
      dmg *= 3;
      this.doChainZap(t.x, t.y, 2, amount);
    }
    t.takeDamage(dmg);
    if (t instanceof Enemy && t.isDead) this.handleEnemyDeath(t);
    if (t instanceof Boss && t.isDead) this.handleBossDeath(t);
  }

  private doChainZap(x: number, y: number, count: number, dmg: number): void {
    const targets = this.allTargets()
      .map((t) => ({ t, d: Phaser.Math.Distance.Between(x, y, t.x, t.y) }))
      .filter((o) => o.d < 160)
      .sort((a, b) => a.d - b.d)
      .slice(0, count);
    for (const { t } of targets) {
      this.weaponGfx.lineStyle(2, 0xfff176, 0.9);
      this.weaponGfx.beginPath();
      this.weaponGfx.moveTo(x, y);
      this.weaponGfx.lineTo(t.x, t.y);
      this.weaponGfx.strokePath();
      t.takeDamage(dmg * 0.6);
      if (t instanceof Enemy && t.isDead) this.handleEnemyDeath(t);
      if (t instanceof Boss && t.isDead) this.handleBossDeath(t);
    }
  }

  private doStaticPulse(): void {
    const targets = this.allTargets()
      .map((t) => ({ t, d: Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y) }))
      .filter((o) => o.d < 240)
      .sort((a, b) => a.d - b.d)
      .slice(0, 4);
    for (const { t } of targets) {
      this.weaponGfx.lineStyle(2, 0x80deea, 0.9);
      this.weaponGfx.beginPath();
      this.weaponGfx.moveTo(this.player.x, this.player.y);
      this.weaponGfx.lineTo(t.x, t.y);
      this.weaponGfx.strokePath();
      this.dealDamageTo(t, this.player.damage * 0.7);
    }
  }

  private doWaterJet(): void {
    const range = this.player.attackRange * 1.3;
    const facing = this.player.facing;
    const halfAngle = 0.5;
    this.telegraphGfx.fillStyle(0x81d4fa, 0.3);
    this.telegraphGfx.slice(this.player.x, this.player.y, range, facing - halfAngle, facing + halfAngle, false);
    this.telegraphGfx.fillPath();
    this.time.delayedCall(150, () => this.telegraphGfx.clear());

    for (const t of this.allTargets()) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y);
      if (d > range) continue;
      const angleTo = Phaser.Math.Angle.Between(this.player.x, this.player.y, t.x, t.y);
      if (Math.abs(Phaser.Math.Angle.Wrap(angleTo - facing)) > halfAngle) continue;
      this.dealDamageTo(t, this.player.damage * 1.4);
      if (t instanceof Enemy) {
        t.knockback(this.player.x, this.player.y, 90);
        t.stun(900);
      }
    }
  }

  private doShockwave(x: number, y: number, radius: number, dmg: number, knockback: boolean): void {
    const ring = this.add.image(x, y, 'vfx-ring').setDepth(DEPTH.VFX).setTint(0xffffff).setAlpha(0.8).setDisplaySize(10, 10);
    this.tweens.add({
      targets: ring,
      displayWidth: radius * 2,
      displayHeight: radius * 2,
      alpha: 0,
      duration: 350,
      onComplete: () => ring.destroy(),
    });
    for (const t of this.allTargets()) {
      const d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      if (d <= radius) {
        this.dealDamageTo(t, dmg);
        if (knockback && t instanceof Enemy) {
          t.knockback(x, y, 70);
          t.stun(500);
        }
      }
    }
  }

  private doExplosion(x: number, y: number, radius: number, dmg: number): void {
    const burst = this.add.image(x, y, 'vfx-ring').setDepth(DEPTH.VFX).setTint(0xff7043).setAlpha(0.9).setDisplaySize(6, 6);
    this.tweens.add({
      targets: burst,
      displayWidth: radius * 2,
      displayHeight: radius * 2,
      alpha: 0,
      duration: 300,
      onComplete: () => burst.destroy(),
    });
    for (const t of this.allTargets()) {
      const d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      if (d <= radius) this.dealDamageTo(t, dmg);
    }
  }

  private spawnTrail(x: number, y: number): void {
    const isGas = this.sweeperId === 'gas';
    const stacks = this.player.upgrades['scorched_trail'] ?? 0;
    const sprite = this.add
      .image(x, y, 'vfx-dot')
      .setDepth(DEPTH.TRAIL)
      .setScale(6)
      .setAlpha(0.35)
      .setTint(isGas ? 0x8d6e63 : 0xff7043);
    this.trailZones.push({
      sprite,
      life: 2,
      slows: isGas,
      dps: isGas ? 6 : 8 + stacks * 4,
    });
  }

  // ------------------------------------------------------------- enemies
  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const result = e.update(dt, this.player.x, this.player.y);

      if (result.wantsFire) this.spawnEnemyProjectile(e);

      const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
      const contactRange = PLAYER_RADIUS + this.targetRadius(e);
      if (dist <= contactRange && this.time.now - e.lastContactMs > e.def.contactCooldownMs) {
        e.lastContactMs = this.time.now;
        this.player.takeDamage(e.damage);
        if (this.player.upgrades['heavy_roller'] > 0) e.knockback(this.player.x, this.player.y, 60);
        if (this.player.upgrades['iron_bumper'] > 0 && this.player.currentMoveSpeed > this.player.stats.moveSpeed * 1.5) {
          this.dealDamageTo(e, this.player.maxHp * 0.2);
        }
      }

      if (e.isDead) this.handleEnemyDeath(e);
    }
  }

  private handleEnemyDeath(e: Enemy): void {
    const idx = this.enemies.indexOf(e);
    if (idx >= 0) this.enemies.splice(idx, 1);
    this.continuousHitTimers.delete(e);
    this.trailHitTimers.delete(e);

    this.player.registerKill(e);
    this.spawnXpGem(e.x, e.y, e.def.xp);
    if ((this.player.upgrades['salvage_engine'] ?? 0) > 0 && Math.random() < 0.1 * this.player.upgrades['salvage_engine']) {
      this.spawnXpGem(e.x + 10, e.y + 10, Math.ceil(e.def.xp * 0.5));
    }

    if (e.def.id === 'slime' && !e.isSplit) {
      for (let i = 0; i < 2; i++) {
        const ang = Math.random() * Math.PI * 2;
        const child = new Enemy(this, e.x + Math.cos(ang) * 14, e.y + Math.sin(ang) * 14, e.def, 1, true);
        this.enemies.push(child);
      }
    }

    e.destroy();
  }

  private spawnEnemyProjectile(e: Enemy): void {
    const angle = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
    const speed = 190;
    const sprite = this.add.image(e.x, e.y, 'proj-trash').setDepth(DEPTH.PROJECTILE);
    this.enemyProjectiles.push({
      sprite,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: e.damage,
      life: 3.5,
    });
  }

  // --------------------------------------------------------------- boss
  private updateBossSchedule(): void {
    if (!this.boss && this.elapsedMs >= this.nextBossAtMs) {
      this.spawnBoss();
    }
  }

  private spawnBoss(): void {
    const { def, hpMult, dmgMult } = bossForIndex(this.bossIndex);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.hypot(this.cameras.main.width, this.cameras.main.height) / 2 + 140;
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * radius, -WORLD_SIZE / 2 + 60, WORLD_SIZE / 2 - 60);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * radius, -WORLD_SIZE / 2 + 60, WORLD_SIZE / 2 - 60);

    this.boss = new Boss(this, x, y, def, hpMult, dmgMult);
    this.bossNameText.setText(def.name).setVisible(true);
    this.bossHpBg.setVisible(true);
    this.bossHpFill.setVisible(true);

    this.bossBanner.setText(`${def.name} APPROACHES`).setAlpha(1);
    this.tweens.add({
      targets: this.bossBanner,
      alpha: 0,
      delay: 2200,
      duration: 700,
    });
  }

  private updateBoss(dt: number): void {
    if (!this.boss) return;
    const boss = this.boss;
    const req = boss.update(dt, this.player.x, this.player.y);

    this.telegraphGfx.clear();
    if (boss.isTelegraphing) {
      const pos = boss.telegraphPos;
      this.telegraphGfx.lineStyle(4, 0xff5252, 0.5 + boss.telegraphProgress * 0.5);
      this.telegraphGfx.strokeCircle(pos.x, pos.y, pos.radius * boss.telegraphProgress);
    }

    if (req) this.handleBossAttack(req);

    const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
    const contactRange = PLAYER_RADIUS + this.targetRadius(boss);
    if (dist <= contactRange && this.time.now - boss.lastContactMs > 700) {
      boss.lastContactMs = this.time.now;
      this.player.takeDamage(boss.contactDamage);
    }

    if (boss.isDead) this.handleBossDeath(boss);
  }

  private handleBossAttack(req: BossAttackRequest): void {
    if (req.type === 'slam') {
      this.doShockwave(req.x, req.y, req.radius, this.boss ? this.boss.contactDamage * 1.6 : 20, true);
    } else if (req.type === 'summon') {
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const ex = req.x + Math.cos(ang) * 70;
        const ey = req.y + Math.sin(ang) * 70;
        this.enemies.push(new Enemy(this, ex, ey, ENEMIES.litter));
      }
    }
  }

  private handleBossDeath(boss: Boss): void {
    this.continuousHitTimers.delete(boss);
    this.bossHpBg.setVisible(false);
    this.bossHpFill.setVisible(false);
    this.bossNameText.setVisible(false);
    this.bossKillsThisRun += 1;

    saveManager.addSp(boss.def.spDrop);
    this.spEarnedThisRun += boss.def.spDrop;
    this.spawnSpBurst(boss.x, boss.y, boss.def.spDrop);

    this.bossBanner.setText(`${boss.def.name} DEFEATED  +${boss.def.spDrop} SP`).setAlpha(1);
    this.tweens.add({ targets: this.bossBanner, alpha: 0, delay: 2200, duration: 700 });

    boss.destroy();
    this.boss = null;
    this.bossIndex += 1;
    this.nextBossAtMs = this.elapsedMs + BOSS_INTERVAL_MS;
  }

  private spawnSpBurst(x: number, y: number, amount: number): void {
    const count = Math.min(8, 2 + Math.floor(amount / 4));
    for (let i = 0; i < count; i++) {
      const ox = x + Phaser.Math.Between(-40, 40);
      const oy = y + Phaser.Math.Between(-40, 40);
      const shard = this.add.image(x, y, 'pickup-sp').setDepth(DEPTH.VFX);
      this.tweens.add({
        targets: shard,
        x: ox,
        y: oy - 50,
        alpha: 0,
        duration: 650 + i * 40,
        delay: i * 30,
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy(),
      });
    }
  }

  // --------------------------------------------------------- projectiles
  private updateProjectiles(dt: number): void {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.life -= dt;

      const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, this.player.x, this.player.y);
      let hit = false;
      if (dist < 20) {
        this.player.takeDamage(p.damage);
        hit = true;
      }
      if (hit || p.life <= 0) {
        p.sprite.destroy();
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private updateTrails(dt: number): void {
    for (let i = this.trailZones.length - 1; i >= 0; i--) {
      const zone = this.trailZones[i];
      zone.life -= dt;
      if (zone.life <= 0) {
        zone.sprite.destroy();
        this.trailZones.splice(i, 1);
        continue;
      }
      zone.sprite.setAlpha(0.35 * Math.min(1, zone.life));

      for (const t of this.allTargets()) {
        const d = Phaser.Math.Distance.Between(zone.sprite.x, zone.sprite.y, t.x, t.y);
        if (d < 40) {
          if (zone.slows && t instanceof Enemy) t.applySlow(300);
          const now = this.time.now;
          const next = this.trailHitTimers.get(t) ?? 0;
          if (now >= next) {
            this.trailHitTimers.set(t, now + 400);
            this.dealDamageTo(t, zone.dps * 0.4);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------- pickups
  private spawnXpGem(x: number, y: number, value: number): void {
    const sprite = this.add.image(x, y, 'pickup-xp').setDepth(DEPTH.PICKUP);
    this.xpGems.push({ sprite, value });
  }

  private updateXpGems(dt: number): void {
    const pickupRadius = this.player.currentPickupRadius;
    for (let i = this.xpGems.length - 1; i >= 0; i--) {
      const gem = this.xpGems[i];
      const dist = Phaser.Math.Distance.Between(gem.sprite.x, gem.sprite.y, this.player.x, this.player.y);
      if (dist < pickupRadius) {
        const ang = Phaser.Math.Angle.Between(gem.sprite.x, gem.sprite.y, this.player.x, this.player.y);
        const speed = 260 + (pickupRadius - dist);
        gem.sprite.x += Math.cos(ang) * speed * dt;
        gem.sprite.y += Math.sin(ang) * speed * dt;
      }
      if (dist < 16) {
        this.player.addXp(gem.value);
        if ((this.player.upgrades['debris_magnet'] ?? 0) > 0) this.player.grantSpeedBurst();
        gem.sprite.destroy();
        this.xpGems.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------- level up
  private rollUpgradeChoices(count: number): UpgradeDef[] {
    const pool = UPGRADES.filter((u) => (this.player.upgrades[u.id] ?? 0) < u.maxStacks);
    const picks: UpgradeDef[] = [];
    const working = [...pool];
    for (let i = 0; i < count && working.length > 0; i++) {
      const totalWeight = working.reduce((s, u) => s + u.weight, 0);
      let r = Math.random() * totalWeight;
      let idx = 0;
      for (; idx < working.length; idx++) {
        r -= working[idx].weight;
        if (r <= 0) break;
      }
      const chosen = working.splice(Math.min(idx, working.length - 1), 1)[0];
      picks.push(chosen);
    }
    return picks;
  }

  private triggerLevelUpChoice(): void {
    const options = this.rollUpgradeChoices(3);
    if (options.length === 0) return;
    this.scene.pause();
    this.scene.launch('LevelUp', {
      options,
      onPick: (id: string) => {
        this.player.addUpgrade(id);
        this.refreshHud();
        this.scene.stop('LevelUp');
        this.scene.resume();
      },
    });
  }

  private openPauseMenu(): void {
    this.scene.pause();
    this.scene.launch('Pause', {
      onResume: () => {
        this.scene.stop('Pause');
        this.scene.resume();
      },
      onQuit: () => {
        this.scene.stop('Pause');
        this.scene.stop();
        this.controller.destroy();
        this.scene.start('MainMenu');
      },
    });
  }

  private handleGameOver(): void {
    this.runOver = true;
    const survivalSec = Math.floor(this.elapsedMs / 1000);
    const bonusSp = Math.floor(survivalSec / 30);
    saveManager.addSp(bonusSp);
    saveManager.recordRunEnd(survivalSec, this.bossKillsThisRun);

    this.controller.destroy();
    this.scene.start('GameOver', {
      survivalSec,
      level: this.player.level,
      bossKills: this.bossKillsThisRun,
      spEarned: this.spEarnedThisRun + bonusSp,
      sweeperName: this.player.def.name,
      sweeperId: this.sweeperId,
    });
  }
}
