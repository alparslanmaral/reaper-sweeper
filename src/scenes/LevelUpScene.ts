import Phaser from 'phaser';
import { UpgradeDef } from '../data/types';
import { DEPTH } from '../config/constants';

interface LevelUpData {
  options: UpgradeDef[];
  onPick: (id: string) => void;
}

export class LevelUpScene extends Phaser.Scene {
  constructor() {
    super('LevelUp');
  }

  create(data: LevelUpData): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.72).setDepth(DEPTH.UI);

    this.add
      .text(w / 2, h * 0.22, 'LEVEL UP!', { fontSize: '32px', color: '#ffd54f', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 1);
    this.add
      .text(w / 2, h * 0.22 + 36, 'Choose an upgrade', { fontSize: '14px', color: '#c7cdd6' })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 1);

    const count = data.options.length;
    const cardW = Math.min(220, (w - 60) / count - 16);
    const cardH = 260;
    const gap = 20;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = w / 2 - totalW / 2 + cardW / 2;
    const y = h / 2 + 30;

    data.options.forEach((opt, i) => {
      const x = startX + i * (cardW + gap);
      this.buildCard(x, y, cardW, cardH, opt, () => data.onPick(opt.id));
    });
  }

  private buildCard(x: number, y: number, w: number, h: number, def: UpgradeDef, onPick: () => void): void {
    const isCreative = def.category === 'creative';
    const accent = isCreative ? 0x64ffda : 0xffb300;

    const bg = this.add
      .rectangle(x, y, w, h, 0x181b20, 1)
      .setStrokeStyle(3, accent)
      .setDepth(DEPTH.UI + 1)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y - h / 2 + 18, isCreative ? 'CREATIVE' : 'UPGRADE', {
        fontSize: '10px',
        color: isCreative ? '#64ffda' : '#ffb300',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 2);

    this.add
      .text(x, y - h / 2 + 46, def.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.UI + 2);

    this.add
      .text(x, y - h / 2 + 100, def.description, {
        fontSize: '12px',
        color: '#c7cdd6',
        align: 'center',
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.UI + 2);

    this.add
      .text(x, y + h / 2 - 20, def.maxStacks > 1 ? `stacks up to ${def.maxStacks}` : 'unique effect', {
        fontSize: '10px',
        color: '#5f6b7a',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 2);

    bg.on('pointerdown', onPick);
    bg.on('pointerover', () => bg.setFillStyle(0x232830));
    bg.on('pointerout', () => bg.setFillStyle(0x181b20));
  }
}
