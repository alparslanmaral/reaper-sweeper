import Phaser from 'phaser';
import { SweeperId } from '../data/types';
import { saveManager } from '../systems/SaveData';

interface GameOverData {
  survivalSec: number;
  level: number;
  bossKills: number;
  spEarned: number;
  sweeperName: string;
  sweeperId: SweeperId;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data: GameOverData): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor('#0d0f12');

    this.add.text(w / 2, h * 0.18, 'SWEPT AWAY', { fontSize: '32px', color: '#ff5252', fontStyle: 'bold' }).setOrigin(0.5);
    this.add
      .text(w / 2, h * 0.18 + 40, `${data.sweeperName} ran out of charge`, { fontSize: '14px', color: '#8a93a3' })
      .setOrigin(0.5);

    const stats: [string, string][] = [
      ['Survived', this.fmtTime(data.survivalSec)],
      ['Level Reached', `${data.level}`],
      ['Bosses Defeated', `${data.bossKills}`],
      ['SP Earned', `+${data.spEarned}`],
    ];

    let y = h * 0.36;
    stats.forEach(([label, val]) => {
      this.add.text(w / 2 - 110, y, label, { fontSize: '15px', color: '#c7cdd6' });
      this.add.text(w / 2 + 110, y, val, { fontSize: '15px', color: '#ffd54f', fontStyle: 'bold' }).setOrigin(1, 0);
      y += 30;
    });

    this.add
      .text(w / 2, y + 20, `Total SP: ${saveManager.get().sp}`, { fontSize: '13px', color: '#5f6b7a' })
      .setOrigin(0.5);

    this.makeButton(w / 2, y + 90, 'TRY AGAIN', 0x2e7d32, 0x66bb6a, () => {
      this.scene.start('Game', { sweeperId: data.sweeperId });
    });
    this.makeButton(w / 2, y + 150, 'BACK TO MENU', 0x424242, 0x757575, () => {
      this.scene.start('MainMenu');
    });
  }

  private fmtTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private makeButton(x: number, y: number, label: string, fill: number, stroke: number, onClick: () => void): void {
    const bg = this.add
      .rectangle(x, y, 220, 48, fill, 1)
      .setStrokeStyle(2, stroke)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    bg.on('pointerdown', onClick);
  }
}
