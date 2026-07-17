import Phaser from 'phaser';
import { SWEEPERS, SWEEPER_ORDER } from '../data/sweepers';
import { allMetaDefs, saveManager } from '../systems/SaveData';
import { SweeperId } from '../data/types';

type Tab = 'sweepers' | 'upgrades';

const PANEL_BG = 0x181b20;
const PANEL_LINE = 0x2c313a;
const ACCENT = 0xffb300;

export class MainMenuScene extends Phaser.Scene {
  private selected: SweeperId = 'manual';
  private tab: Tab = 'sweepers';
  private root!: Phaser.GameObjects.Container;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0d0f12');
    this.root = this.add.container(0, 0);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.layout();
  }

  private onResize(): void {
    this.layout();
  }

  private layout(): void {
    this.root.removeAll(true);
    const w = this.scale.width;
    const h = this.scale.height;

    this.root.add(this.add.text(w / 2, 34, 'REAPER SWEEPER', { fontSize: '34px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
    this.root.add(
      this.add
        .text(w / 2, 68, 'clean the streets. survive the night.', { fontSize: '13px', color: '#8a93a3' })
        .setOrigin(0.5),
    );

    const save = saveManager.get();
    this.root.add(
      this.add
        .text(w - 20, 20, `SP ${save.sp}`, { fontSize: '18px', color: '#ffd54f', fontStyle: 'bold' })
        .setOrigin(1, 0),
    );
    this.root.add(
      this.add
        .text(
          w - 20,
          44,
          `Runs: ${save.stats.runsPlayed}   Bosses: ${save.stats.bossKillsTotal}   Best: ${this.fmtTime(save.stats.bestSurvivalSec)}`,
          { fontSize: '11px', color: '#5f6b7a' },
        )
        .setOrigin(1, 0),
    );

    // tabs
    const tabY = 104;
    this.root.add(this.makeTabButton(w / 2 - 90, tabY, 'SWEEPERS', 'sweepers'));
    this.root.add(this.makeTabButton(w / 2 + 90, tabY, 'UPGRADES', 'upgrades'));

    if (this.tab === 'sweepers') {
      this.buildSweeperTab(w, h);
    } else {
      this.buildUpgradesTab(w, h);
    }
  }

  private fmtTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private makeTabButton(x: number, y: number, label: string, tab: Tab): Phaser.GameObjects.Container {
    const active = this.tab === tab;
    const bg = this.add
      .rectangle(0, 0, 160, 34, active ? ACCENT : PANEL_BG, 1)
      .setStrokeStyle(2, active ? ACCENT : PANEL_LINE)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(0, 0, label, { fontSize: '14px', color: active ? '#1a1a1a' : '#c7cdd6', fontStyle: 'bold' })
      .setOrigin(0.5);
    bg.on('pointerdown', () => {
      this.tab = tab;
      this.layout();
    });
    return this.add.container(x, y, [bg, text]);
  }

  // ------------------------------------------------------------ sweepers
  private buildSweeperTab(w: number, h: number): void {
    const save = saveManager.get();
    const listX = 140;
    const startY = 170;
    const gap = 96;

    SWEEPER_ORDER.forEach((id, i) => {
      const def = SWEEPERS[id];
      const y = startY + i * gap;
      const unlocked = save.unlockedSweepers.includes(id);
      const isSelected = this.selected === id;

      const bg = this.add
        .rectangle(listX, y, 220, 80, isSelected ? 0x232830 : PANEL_BG, 1)
        .setStrokeStyle(2, isSelected ? ACCENT : PANEL_LINE)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.selected = id;
        this.layout();
      });
      this.root.add(bg);

      const icon = this.add.image(listX - 78, y, def.texture).setScale(def.scale * 0.65);
      if (!unlocked) icon.setTint(0x555555);
      this.root.add(icon);

      const nameText = this.add
        .text(listX - 30, y - 18, def.name, { fontSize: '15px', color: unlocked ? '#ffffff' : '#787f88', fontStyle: 'bold' })
        .setOrigin(0, 0.5);
      this.root.add(nameText);

      if (!unlocked) {
        const lock = this.add
          .text(listX - 30, y + 6, `🔒 ${def.unlockCost} SP`, { fontSize: '12px', color: '#ffb300' })
          .setOrigin(0, 0.5);
        this.root.add(lock);
      } else {
        const tag = this.add
          .text(listX - 30, y + 6, def.tagline, { fontSize: '11px', color: '#8a93a3', wordWrap: { width: 150 } })
          .setOrigin(0, 0.5);
        this.root.add(tag);
      }
    });

    this.buildDetailPanel(w, h);
  }

  private buildDetailPanel(w: number, h: number): void {
    const save = saveManager.get();
    const def = SWEEPERS[this.selected];
    const unlocked = save.unlockedSweepers.includes(this.selected);
    const px = 300;
    const py = 170;
    const pw = Math.max(280, w - px - 40);

    const panel = this.add.rectangle(px, py, pw, 380, PANEL_BG, 1).setStrokeStyle(2, PANEL_LINE).setOrigin(0, 0);
    this.root.add(panel);

    let y = py + 24;
    this.root.add(this.add.text(px + 24, y, def.name, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }));
    y += 30;
    this.root.add(this.add.text(px + 24, y, def.tagline, { fontSize: '13px', color: '#ffb300' }));
    y += 28;
    this.root.add(
      this.add.text(px + 24, y, def.description, { fontSize: '13px', color: '#c7cdd6', wordWrap: { width: pw - 48 } }),
    );
    y += 56;

    const statRows: [string, string][] = [
      ['Max HP', `${def.stats.maxHp}`],
      ['Move Speed', `${def.stats.moveSpeed}`],
      ['Damage', `${def.stats.damage}`],
      ['Attack Range', `${def.stats.attackRange}`],
      ['Attack Rate', `${def.stats.attackRate}/s`],
      ['Armor', `${Math.round(def.stats.armor * 100)}%`],
    ];
    statRows.forEach(([label, val], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = px + 24 + col * (pw / 2 - 24);
      const sy = y + row * 22;
      this.root.add(this.add.text(sx, sy, label, { fontSize: '12px', color: '#8a93a3' }));
      this.root.add(this.add.text(sx + 130, sy, val, { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }));
    });
    y += 22 * 3 + 14;

    this.root.add(this.add.text(px + 24, y, `Passive — ${def.passiveName}`, { fontSize: '13px', color: '#64ffda', fontStyle: 'bold' }));
    y += 18;
    this.root.add(
      this.add.text(px + 24, y, def.passiveDescription, { fontSize: '12px', color: '#c7cdd6', wordWrap: { width: pw - 48 } }),
    );
    y += 36;

    this.root.add(this.add.text(px + 24, y, `Weapon — ${def.weaponName}`, { fontSize: '13px', color: '#ff8a65', fontStyle: 'bold' }));
    y += 18;
    this.root.add(
      this.add.text(px + 24, y, def.weaponDescription, { fontSize: '12px', color: '#c7cdd6', wordWrap: { width: pw - 48 } }),
    );

    const btnY = py + 380 - 36;
    if (unlocked) {
      const startBtn = this.add
        .rectangle(px + pw / 2, btnY, 220, 46, 0x2e7d32, 1)
        .setStrokeStyle(2, 0x66bb6a)
        .setInteractive({ useHandCursor: true });
      const startText = this.add.text(px + pw / 2, btnY, 'START RUN', { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      startBtn.on('pointerdown', () => this.startRun());
      this.root.add(startBtn);
      this.root.add(startText);
    } else {
      const canAfford = save.sp >= def.unlockCost;
      const unlockBtn = this.add
        .rectangle(px + pw / 2, btnY, 220, 46, canAfford ? 0xef6c00 : 0x33261a, 1)
        .setStrokeStyle(2, canAfford ? 0xffb74d : 0x4a3f2a)
        .setInteractive({ useHandCursor: true });
      const unlockText = this.add
        .text(px + pw / 2, btnY, `UNLOCK — ${def.unlockCost} SP`, { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);
      unlockBtn.on('pointerdown', () => {
        if (saveManager.unlockSweeper(this.selected, def.unlockCost)) this.layout();
      });
      this.root.add(unlockBtn);
      this.root.add(unlockText);
    }
  }

  private startRun(): void {
    this.scene.start('Game', { sweeperId: this.selected });
  }

  // ------------------------------------------------------------ upgrades
  private buildUpgradesTab(w: number, h: number): void {
    const save = saveManager.get();
    const defs = allMetaDefs();
    const cols = w > 700 ? 2 : 1;
    const colW = (w - 80) / cols;
    const rowH = 96;

    defs.forEach((def, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 40 + col * colW;
      const y = 170 + row * rowH;
      const level = save.metaLevels[def.id];
      const cost = saveManager.metaCost(def.id);
      const maxed = cost === null;

      const bg = this.add.rectangle(x, y, colW - 20, rowH - 14, PANEL_BG, 1).setStrokeStyle(2, PANEL_LINE).setOrigin(0, 0);
      this.root.add(bg);

      this.root.add(
        this.add.text(x + 16, y + 10, `${def.name}  (Lv ${level}/${def.maxLevel})`, {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
        }),
      );
      this.root.add(
        this.add.text(x + 16, y + 32, def.description, {
          fontSize: '11px',
          color: '#8a93a3',
          wordWrap: { width: colW - 130 },
        }),
      );

      const btnX = x + colW - 90;
      const btnY = y + (rowH - 14) / 2;
      const canAfford = !maxed && save.sp >= (cost ?? 0);
      const btn = this.add
        .rectangle(btnX, btnY, 130, 34, maxed ? 0x22262c : canAfford ? 0x1565c0 : 0x22262c, 1)
        .setStrokeStyle(2, maxed ? PANEL_LINE : canAfford ? 0x64b5f6 : PANEL_LINE)
        .setInteractive({ useHandCursor: !maxed });
      const btnText = this.add
        .text(btnX, btnY, maxed ? 'MAXED' : `${cost} SP`, { fontSize: '13px', color: maxed ? '#555c66' : '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);
      if (!maxed) {
        btn.on('pointerdown', () => {
          if (saveManager.buyMetaUpgrade(def.id)) this.layout();
        });
      }
      this.root.add(btn);
      this.root.add(btnText);
    });
    void h;
  }
}
