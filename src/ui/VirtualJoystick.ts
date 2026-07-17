import Phaser from 'phaser';
import { DEPTH } from '../config/constants';

/**
 * Fixed-position virtual joystick pinned to the camera (screen space).
 * Any pointer that goes down inside `zoneRadius` of the anchor claims the
 * stick until released; returns a normalized -1..1 vector.
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Image;
  private thumb: Phaser.GameObjects.Image;
  private anchorX: number;
  private anchorY: number;
  private zoneRadius: number;
  private maxThrow = 46;
  private pointerId: number | null = null;
  private vec = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, anchorX: number, anchorY: number, zoneRadius = 130) {
    this.scene = scene;
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.zoneRadius = zoneRadius;

    this.base = scene.add
      .image(anchorX, anchorY, 'ui-joy-base')
      .setScrollFactor(0)
      .setDepth(DEPTH.UI)
      .setAlpha(0.9);
    this.thumb = scene.add
      .image(anchorX, anchorY, 'ui-joy-thumb')
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 1);

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.pointerId !== null) return;
    const d = Phaser.Math.Distance.Between(p.x, p.y, this.anchorX, this.anchorY);
    if (d <= this.zoneRadius) {
      this.pointerId = p.id;
      this.updateFromPointer(p);
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (this.pointerId === p.id) this.updateFromPointer(p);
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (this.pointerId === p.id) {
      this.pointerId = null;
      this.vec.set(0, 0);
      this.thumb.setPosition(this.anchorX, this.anchorY);
    }
  }

  private updateFromPointer(p: Phaser.Input.Pointer): void {
    const dx = p.x - this.anchorX;
    const dy = p.y - this.anchorY;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), this.maxThrow);
    const angle = Math.atan2(dy, dx);
    const tx = this.anchorX + Math.cos(angle) * dist;
    const ty = this.anchorY + Math.sin(angle) * dist;
    this.thumb.setPosition(tx, ty);
    this.vec.set((tx - this.anchorX) / this.maxThrow, (ty - this.anchorY) / this.maxThrow);
  }

  getVector(): Phaser.Math.Vector2 {
    return this.vec;
  }

  setAnchor(x: number, y: number): void {
    this.anchorX = x;
    this.anchorY = y;
    this.base.setPosition(x, y);
    if (this.pointerId === null) this.thumb.setPosition(x, y);
  }

  setVisible(v: boolean): void {
    this.base.setVisible(v);
    this.thumb.setVisible(v);
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onDown, this);
    this.scene.input.off('pointermove', this.onMove, this);
    this.scene.input.off('pointerup', this.onUp, this);
    this.scene.input.off('pointerupoutside', this.onUp, this);
    this.base.destroy();
    this.thumb.destroy();
  }
}
