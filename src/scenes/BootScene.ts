import Phaser from 'phaser';
import { TextureFactory } from '../systems/TextureFactory';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    new TextureFactory(this).generateAll();
    this.scene.start('MainMenu');
  }
}
