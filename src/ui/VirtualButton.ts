import Phaser from 'phaser';
import { DEPTH } from '../config/constants';

export class VirtualButton {
  private scene: Phaser.Scene;
  private img: Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private pointerId: number | null = null;
  private _pressed = false;
  private justPressed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, radius = 48, tint = 0xff7043) {
    this.scene = scene;
    this.img = scene.add
      .image(x, y, 'ui-button')
      .setScrollFactor(0)
      .setDepth(DEPTH.UI)
      .setDisplaySize(radius * 2, radius * 2)
      .setTint(tint)
      .setInteractive({ useHandCursor: true });
    this.label = scene.add
      .text(x, y, text, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 1);

    this.img.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.pointerId !== null) return;
      this.pointerId = p.id;
      this._pressed = true;
      this.justPressed = true;
      this.img.setAlpha(0.6);
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (this.pointerId === p.id) {
        this.pointerId = null;
        this._pressed = false;
        this.img.setAlpha(1);
      }
    };
    this.img.on('pointerup', release);
    this.img.on('pointerupoutside', release);
  }

  get pressed(): boolean {
    return this._pressed;
  }

  consumeJustPressed(): boolean {
    const v = this.justPressed;
    this.justPressed = false;
    return v;
  }

  setPosition(x: number, y: number): void {
    this.img.setPosition(x, y);
    this.label.setPosition(x, y);
  }

  setCooldownVisual(ratio: number): void {
    // ratio 0..1, 0 = ready
    this.img.setAlpha(ratio > 0 ? 0.35 + 0.35 * (1 - ratio) : 1);
  }

  destroy(): void {
    this.img.destroy();
    this.label.destroy();
  }
}
