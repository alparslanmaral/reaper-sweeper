import Phaser from 'phaser';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { VirtualButton } from '../ui/VirtualButton';

export interface FrameInput {
  moveX: number;
  moveY: number;
  moving: boolean;
  hasManualAim: boolean;
  aimWorldX: number;
  aimWorldY: number;
  dashPressed: boolean;
}

export class InputController {
  private scene: Phaser.Scene;
  private isMobile: boolean;
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    dash: Phaser.Input.Keyboard.Key;
  };
  private joystick?: VirtualJoystick;
  private dashButton?: VirtualButton;
  private pauseButton?: VirtualButton;
  private mouseMoved = false;

  constructor(scene: Phaser.Scene, isMobile: boolean) {
    this.scene = scene;
    this.isMobile = isMobile;

    if (scene.input.keyboard) {
      this.keys = {
        up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        dash: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      };
    }

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isMobile) this.mouseMoved = true;
      void p;
    });

    const w = scene.scale.width;
    const h = scene.scale.height;

    if (this.isMobile) {
      this.joystick = new VirtualJoystick(scene, 130, h - 150, 140);
      this.dashButton = new VirtualButton(scene, w - 100, h - 150, 'DASH', 46, 0xff7043);
      this.pauseButton = new VirtualButton(scene, w - 50, 50, '⏸', 30, 0x546e7a);
    } else {
      this.pauseButton = new VirtualButton(scene, w - 50, 50, '⏸', 26, 0x546e7a);
    }
  }

  resize(w: number, h: number): void {
    if (this.isMobile && this.joystick) {
      this.joystick.setAnchor(130, h - 150);
      this.dashButton?.setPosition(w - 100, h - 150);
      this.pauseButton?.setPosition(w - 50, 50);
    } else {
      this.pauseButton?.setPosition(w - 50, 50);
    }
  }

  isPausePressed(): boolean {
    return !!this.pauseButton?.consumeJustPressed();
  }

  setDashCooldownVisual(ratio: number): void {
    this.dashButton?.setCooldownVisual(ratio);
  }

  getFrame(): FrameInput {
    let moveX = 0;
    let moveY = 0;
    let dashPressed = false;

    if (this.isMobile && this.joystick) {
      const v = this.joystick.getVector();
      moveX = v.x;
      moveY = v.y;
      dashPressed = !!this.dashButton?.consumeJustPressed();
    } else {
      if (this.keys.left.isDown) moveX -= 1;
      if (this.keys.right.isDown) moveX += 1;
      if (this.keys.up.isDown) moveY -= 1;
      if (this.keys.down.isDown) moveY += 1;
      if (Phaser.Input.Keyboard.JustDown(this.keys.dash)) dashPressed = true;
      const len = Math.hypot(moveX, moveY);
      if (len > 1) {
        moveX /= len;
        moveY /= len;
      }
    }

    const pointer = this.scene.input.activePointer;
    const hasManualAim = !this.isMobile && this.mouseMoved;
    const aimWorldX = pointer.worldX;
    const aimWorldY = pointer.worldY;

    const len = Math.hypot(moveX, moveY);
    return {
      moveX,
      moveY,
      moving: len > 0.08,
      hasManualAim,
      aimWorldX,
      aimWorldY,
      dashPressed,
    };
  }

  destroy(): void {
    this.joystick?.destroy();
    this.dashButton?.destroy();
    this.pauseButton?.destroy();
  }
}
