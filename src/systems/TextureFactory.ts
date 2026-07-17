import Phaser from 'phaser';

/**
 * Bakes every sprite in the game as a flat-design vector texture at boot time.
 * No external image files are used — everything is drawn with Graphics and
 * rasterized into the texture manager. Swap any generateXxx() body for a
 * `scene.load.image(...)` call later without touching the rest of the game.
 */
export class TextureFactory {
  private scene: Phaser.Scene;
  private g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.g = scene.make.graphics({ x: 0, y: 0 }, false);
  }

  generateAll(): void {
    this.genGroundTile();
    this.genSweepers();
    this.genEnemies();
    this.genBosses();
    this.genPickups();
    this.genProjectiles();
    this.genVfx();
    this.genUi();
    this.g.destroy();
  }

  private bake(key: string, w: number, h: number): void {
    this.g.generateTexture(key, w, h);
    this.g.clear();
  }

  // ---------------------------------------------------------------- ground
  private genGroundTile(): void {
    const s = 128;
    const g = this.g;
    g.fillStyle(0x2a2d33, 1);
    g.fillRect(0, 0, s, s);
    g.lineStyle(2, 0x33373f, 1);
    g.strokeRect(1, 1, s - 2, s - 2);
    g.fillStyle(0x24262b, 1);
    for (let i = 0; i < 6; i++) {
      const x = (i * 37) % s;
      const y = (i * 53) % s;
      g.fillCircle(x, y, 3 + (i % 3));
    }
    this.bake('tile-ground', s, s);
  }

  // ------------------------------------------------------------- sweepers
  // All bodies face +X (right) by convention; rotated at runtime.
  private genSweepers(): void {
    this.genManualSweeper();
    this.genElectricSweeper();
    this.genGasSweeper();
    this.genTruckSweeper();
  }

  private genManualSweeper(): void {
    const g = this.g;
    const w = 72,
      h = 56;
    const cx = w / 2,
      cy = h / 2;
    // wheels
    g.fillStyle(0x1b1e22, 1);
    g.fillCircle(cx - 8, cy - 18, 8);
    g.fillCircle(cx - 8, cy + 18, 8);
    // handle
    g.lineStyle(5, 0x6d4c41, 1);
    g.beginPath();
    g.moveTo(cx - 24, cy);
    g.lineTo(cx - 4, cy);
    g.strokePath();
    // body (bin)
    g.fillStyle(0xcfd8dc, 1);
    g.fillRoundedRect(cx - 6, cy - 16, 26, 32, 6);
    g.lineStyle(3, 0x455a64, 1);
    g.strokeRoundedRect(cx - 6, cy - 16, 26, 32, 6);
    // broom bristles (front, +x)
    g.fillStyle(0xffb300, 1);
    g.fillTriangle(cx + 20, cy - 20, cx + 20, cy + 20, cx + 34, cy);
    g.lineStyle(2, 0xff8f00, 1);
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(cx + 22, cy + i * 5.5);
      g.lineTo(cx + 33, cy + i * 3.2);
      g.strokePath();
    }
    // accent stripe
    g.fillStyle(0x455a64, 1);
    g.fillRect(cx - 6, cy - 3, 26, 6);
    this.bake('sweeper-manual', w, h);
  }

  private genElectricSweeper(): void {
    const g = this.g;
    const w = 64,
      h = 52;
    const cx = w / 2,
      cy = h / 2;
    // side brushes (orbiting, drawn subtly at rest)
    g.fillStyle(0x00838f, 1);
    g.fillCircle(cx - 2, cy - 20, 7);
    g.fillCircle(cx - 2, cy + 20, 7);
    // pod body
    g.fillStyle(0x26c6da, 1);
    g.fillRoundedRect(cx - 22, cy - 15, 40, 30, 12);
    g.lineStyle(3, 0x006064, 1);
    g.strokeRoundedRect(cx - 22, cy - 15, 40, 30, 12);
    // nose light
    g.fillStyle(0xe0f7fa, 1);
    g.fillCircle(cx + 16, cy, 5);
    // energy stripe
    g.fillStyle(0x80deea, 1);
    g.fillRect(cx - 18, cy - 3, 30, 6);
    this.bake('sweeper-electric', w, h);
  }

  private genGasSweeper(): void {
    const g = this.g;
    const w = 84,
      h = 64;
    const cx = w / 2,
      cy = h / 2;
    // wheels
    g.fillStyle(0x1b1e22, 1);
    g.fillCircle(cx - 14, cy - 22, 9);
    g.fillCircle(cx - 14, cy + 22, 9);
    g.fillCircle(cx + 14, cy - 22, 9);
    g.fillCircle(cx + 14, cy + 22, 9);
    // chassis
    g.fillStyle(0xfb8c00, 1);
    g.fillRoundedRect(cx - 26, cy - 18, 52, 36, 8);
    g.lineStyle(3, 0xe65100, 1);
    g.strokeRoundedRect(cx - 26, cy - 18, 52, 36, 8);
    // vacuum nozzle (front)
    g.fillStyle(0x424242, 1);
    g.fillCircle(cx + 30, cy, 12);
    g.fillStyle(0x212121, 1);
    g.fillCircle(cx + 30, cy, 6);
    // exhaust
    g.fillStyle(0x616161, 1);
    g.fillRoundedRect(cx - 30, cy - 26, 6, 10, 2);
    // stripe
    g.fillStyle(0xffe0b2, 1);
    g.fillRect(cx - 22, cy - 3, 40, 6);
    this.bake('sweeper-gas', w, h);
  }

  private genTruckSweeper(): void {
    const g = this.g;
    const w = 108,
      h = 78;
    const cx = w / 2,
      cy = h / 2;
    // wheels
    g.fillStyle(0x1b1e22, 1);
    g.fillCircle(cx - 22, cy - 28, 11);
    g.fillCircle(cx - 22, cy + 28, 11);
    g.fillCircle(cx + 20, cy - 28, 11);
    g.fillCircle(cx + 20, cy + 28, 11);
    // chassis
    g.fillStyle(0xfdd835, 1);
    g.fillRoundedRect(cx - 34, cy - 22, 68, 44, 10);
    g.lineStyle(4, 0x2b2b2b, 1);
    g.strokeRoundedRect(cx - 34, cy - 22, 68, 44, 10);
    // hazard stripes
    g.fillStyle(0x212121, 1);
    for (let i = -2; i <= 2; i++) {
      g.fillRect(cx - 6 + i * 10, cy - 22, 5, 44);
    }
    // cab
    g.fillStyle(0xffee58, 1);
    g.fillRoundedRect(cx - 34, cy - 14, 18, 28, 6);
    // rotating brush drum (front)
    g.fillStyle(0x6d4c41, 1);
    g.fillCircle(cx + 40, cy, 16);
    g.lineStyle(3, 0x3e2723, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx + 40, cy);
      g.lineTo(cx + 40 + Math.cos(a) * 16, cy + Math.sin(a) * 16);
      g.strokePath();
    }
    this.bake('sweeper-truck', w, h);
  }

  // -------------------------------------------------------------- enemies
  private genEnemies(): void {
    this.genLitterBug();
    this.genDustMite();
    this.genGrimeSlime();
    this.genTrashSpitter();
    this.genRustCrawler();
    this.genStaticCling();
  }

  private genLitterBug(): void {
    const g = this.g;
    const s = 28;
    const c = s / 2;
    g.fillStyle(0x8bc34a, 1);
    g.fillTriangle(c, c - 12, c - 11, c + 10, c + 11, c + 10);
    g.lineStyle(2, 0x33691e, 1);
    g.strokeTriangle(c, c - 12, c - 11, c + 10, c + 11, c + 10);
    g.fillStyle(0xc5e1a5, 1);
    g.fillCircle(c - 4, c + 2, 2.5);
    g.fillCircle(c + 4, c + 2, 2.5);
    this.bake('enemy-litter', s, s);
  }

  private genDustMite(): void {
    const g = this.g;
    const s = 18;
    const c = s / 2;
    g.lineStyle(1.5, 0x78909c, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.beginPath();
      g.moveTo(c, c);
      g.lineTo(c + Math.cos(a) * 9, c + Math.sin(a) * 9);
      g.strokePath();
    }
    g.fillStyle(0xcfd8dc, 1);
    g.fillCircle(c, c, 5);
    this.bake('enemy-mite', s, s);
  }

  private genGrimeSlime(): void {
    const g = this.g;
    const s = 34;
    const c = s / 2;
    g.fillStyle(0x556b2f, 1);
    g.fillCircle(c, c + 2, 14);
    g.fillStyle(0x33691e, 1);
    g.fillCircle(c - 4, c - 2, 5);
    g.fillCircle(c + 5, c + 4, 3.5);
    g.lineStyle(2, 0x263500, 1);
    g.strokeCircle(c, c + 2, 14);
    this.bake('enemy-slime', s, s);
  }

  private genTrashSpitter(): void {
    const g = this.g;
    const s = 30;
    const c = s / 2;
    g.fillStyle(0x7e57c2, 1);
    g.fillRoundedRect(c - 10, c - 13, 20, 26, 6);
    g.lineStyle(2, 0x4527a0, 1);
    g.strokeRoundedRect(c - 10, c - 13, 20, 26, 6);
    g.fillStyle(0x311b92, 1);
    g.fillCircle(c + 11, c, 5);
    this.bake('enemy-spitter', s, s);
  }

  private genRustCrawler(): void {
    const g = this.g;
    const s = 40;
    const c = s / 2;
    g.fillStyle(0x8d5524, 1);
    const pts: number[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push(c + Math.cos(a) * 17, c + Math.sin(a) * 17);
    }
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath();
    g.fillPath();
    g.lineStyle(3, 0x4e342e, 1);
    g.strokePath();
    g.fillStyle(0xd7ccc8, 1);
    g.fillCircle(c - 5, c - 3, 2.5);
    g.fillCircle(c + 5, c - 3, 2.5);
    this.bake('enemy-crawler', s, s);
  }

  private genStaticCling(): void {
    const g = this.g;
    const s = 24;
    const c = s / 2;
    g.fillStyle(0xffee58, 1);
    g.beginPath();
    g.moveTo(c - 6, c - 10);
    g.lineTo(c + 2, c - 2);
    g.lineTo(c - 3, c);
    g.lineTo(c + 6, c + 10);
    g.lineTo(c - 2, c + 1);
    g.lineTo(c + 3, c - 1);
    g.closePath();
    g.fillPath();
    g.lineStyle(1.5, 0xf9a825, 1);
    g.strokePath();
    this.bake('enemy-static', s, s);
  }

  // ---------------------------------------------------------------- bosses
  private genBosses(): void {
    this.genLandfillKing();
    this.genGreaseBehemoth();
  }

  private genLandfillKing(): void {
    const g = this.g;
    const s = 140;
    const c = s / 2;
    g.fillStyle(0x6d6a4d, 1);
    g.fillRoundedRect(c - 55, c - 45, 110, 90, 14);
    g.lineStyle(6, 0x33311f, 1);
    g.strokeRoundedRect(c - 55, c - 45, 110, 90, 14);
    g.fillStyle(0xfdd835, 1);
    for (let i = -1; i <= 1; i++) {
      g.fillRect(c - 55, c - 6 + i * 22, 110, 8);
    }
    g.fillStyle(0x2e2b1a, 1);
    g.fillCircle(c - 20, c, 10);
    g.fillCircle(c + 20, c, 10);
    g.fillStyle(0xff5252, 1);
    g.fillCircle(c - 20, c, 4);
    g.fillCircle(c + 20, c, 4);
    this.bake('boss-landfill', s, s);
  }

  private genGreaseBehemoth(): void {
    const g = this.g;
    const s = 150;
    const c = s / 2;
    g.fillStyle(0x37474f, 1);
    g.fillCircle(c, c, 62);
    g.fillStyle(0x4e5d2f, 1);
    g.fillCircle(c - 15, c - 10, 20);
    g.fillCircle(c + 20, c + 15, 16);
    g.fillCircle(c + 10, c - 20, 12);
    g.lineStyle(6, 0x1c2529, 1);
    g.strokeCircle(c, c, 62);
    g.fillStyle(0xff8a65, 1);
    g.fillCircle(c - 18, c - 4, 6);
    g.fillCircle(c + 18, c - 4, 6);
    g.fillStyle(0x1c2529, 1);
    g.fillCircle(c - 18, c - 4, 3);
    g.fillCircle(c + 18, c - 4, 3);
    this.bake('boss-grease', s, s);
  }

  // -------------------------------------------------------------- pickups
  private genPickups(): void {
    const g = this.g;
    // xp gem
    let s = 16;
    let c = s / 2;
    g.fillStyle(0x64ffda, 1);
    g.fillTriangle(c, c - 8, c - 7, c, c, c + 8);
    g.fillTriangle(c, c - 8, c + 7, c, c, c + 8);
    g.lineStyle(1.5, 0x00bfa5, 1);
    g.strokeTriangle(c, c - 8, c - 7, c, c, c + 8);
    g.strokeTriangle(c, c - 8, c + 7, c, c, c + 8);
    this.bake('pickup-xp', s, s);

    // sp shard (boss drop, rare bonus)
    s = 18;
    c = s / 2;
    g.fillStyle(0xffd54f, 1);
    g.fillCircle(c, c, 7);
    g.lineStyle(2, 0xff8f00, 1);
    g.strokeCircle(c, c, 7);
    g.fillStyle(0xfff3c4, 1);
    g.fillCircle(c - 2, c - 2, 2);
    this.bake('pickup-sp', s, s);
  }

  // ----------------------------------------------------------- projectiles
  private genProjectiles(): void {
    const g = this.g;
    let s = 14;
    let c = s / 2;
    g.fillStyle(0x795548, 1);
    g.fillCircle(c, c, 6);
    g.lineStyle(1.5, 0x3e2723, 1);
    g.strokeCircle(c, c, 6);
    this.bake('proj-trash', s, s);

    s = 20;
    c = s / 2;
    g.fillStyle(0x81d4fa, 1);
    g.fillRoundedRect(0, c - 3, s, 6, 3);
    g.fillStyle(0xe1f5fe, 1);
    g.fillRoundedRect(0, c - 1.5, s, 3, 1.5);
    this.bake('proj-water', s, s);
  }

  // ------------------------------------------------------------------ vfx
  private genVfx(): void {
    const g = this.g;
    // soft dust puff (radial gradient approximated via layered circles)
    let s = 32;
    let c = s / 2;
    g.fillStyle(0xcfd8dc, 0.5);
    g.fillCircle(c, c, 15);
    g.fillStyle(0xcfd8dc, 0.8);
    g.fillCircle(c, c, 8);
    this.bake('vfx-dust', s, s);

    // spark
    s = 12;
    c = s / 2;
    g.fillStyle(0xfff176, 1);
    g.fillTriangle(c, 0, c - 3, c, c, s);
    g.fillTriangle(c, 0, c + 3, c, c, s);
    this.bake('vfx-spark', s, s);

    // ring (AoE telegraph / shockwave)
    s = 128;
    c = s / 2;
    g.lineStyle(6, 0xffffff, 1);
    g.strokeCircle(c, c, c - 4);
    this.bake('vfx-ring', s, s);

    // soft white pixel for tinted particles
    s = 8;
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    this.bake('vfx-dot', s, s);
  }

  // ------------------------------------------------------------------- ui
  private genUi(): void {
    const g = this.g;
    // joystick base
    let s = 140;
    let c = s / 2;
    g.fillStyle(0xffffff, 0.12);
    g.fillCircle(c, c, c - 4);
    g.lineStyle(3, 0xffffff, 0.35);
    g.strokeCircle(c, c, c - 4);
    this.bake('ui-joy-base', s, s);

    // joystick thumb
    s = 64;
    c = s / 2;
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(c, c, c - 4);
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeCircle(c, c, c - 4);
    this.bake('ui-joy-thumb', s, s);

    // action button
    s = 96;
    c = s / 2;
    g.fillStyle(0xff7043, 0.85);
    g.fillCircle(c, c, c - 4);
    g.lineStyle(3, 0xffffff, 0.6);
    g.strokeCircle(c, c, c - 4);
    this.bake('ui-button', s, s);

    // 1x1 white pixel for tint/scale UI bars
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    this.bake('ui-pixel', 4, 4);
  }
}
