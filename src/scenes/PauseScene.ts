import Phaser from 'phaser';
import { DEPTH } from '../config/constants';

interface PauseData {
  onResume: () => void;
  onQuit: () => void;
}

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: PauseData): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75).setDepth(DEPTH.UI);
    this.add.text(w / 2, h / 2 - 90, 'PAUSED', { fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(DEPTH.UI + 1);

    this.makeButton(w / 2, h / 2, 'RESUME', 0x2e7d32, 0x66bb6a, data.onResume);
    this.makeButton(w / 2, h / 2 + 64, 'QUIT TO MENU', 0x424242, 0x757575, data.onQuit);
  }

  private makeButton(x: number, y: number, label: string, fill: number, stroke: number, onClick: () => void): void {
    const bg = this.add
      .rectangle(x, y, 220, 48, fill, 1)
      .setStrokeStyle(2, stroke)
      .setDepth(DEPTH.UI + 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(DEPTH.UI + 2);
    bg.on('pointerdown', onClick);
  }
}
