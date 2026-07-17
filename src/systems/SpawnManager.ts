import Phaser from 'phaser';
import { ENEMIES, ENEMY_ORDER } from '../data/enemies';
import { Enemy } from '../entities/Enemy';
import { WORLD_SIZE } from '../config/constants';

export class SpawnManager {
  private scene: Phaser.Scene;
  private spawnAccum = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private availableEnemyIds(elapsedSec: number): string[] {
    return ENEMY_ORDER.filter((id) => ENEMIES[id].minTimeSec <= elapsedSec);
  }

  private pickEnemyId(elapsedSec: number): string {
    const pool = this.availableEnemyIds(elapsedSec);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private spawnPoint(playerX: number, playerY: number): { x: number; y: number } {
    const camera = this.scene.cameras.main;
    const margin = 80;
    const radius = Math.hypot(camera.width, camera.height) / 2 + margin;
    const angle = Math.random() * Math.PI * 2;
    let x = playerX + Math.cos(angle) * radius;
    let y = playerY + Math.sin(angle) * radius;
    const half = WORLD_SIZE / 2;
    x = Phaser.Math.Clamp(x, -half + 20, half - 20);
    y = Phaser.Math.Clamp(y, -half + 20, half - 20);
    return { x, y };
  }

  /** Call every frame; returns any enemies spawned this tick. */
  update(dt: number, elapsedSec: number, playerX: number, playerY: number): Enemy[] {
    const spawned: Enemy[] = [];

    const interval = Math.max(0.22, 1.4 - elapsedSec / 130);
    const packSize = 1 + Math.floor(elapsedSec / 75);
    const hpMult = 1 + elapsedSec / 210;

    this.spawnAccum += dt;
    if (this.spawnAccum >= interval) {
      this.spawnAccum = 0;
      for (let i = 0; i < packSize; i++) {
        const id = this.pickEnemyId(elapsedSec);
        const def = ENEMIES[id];
        const { x, y } = this.spawnPoint(playerX, playerY);
        spawned.push(new Enemy(this.scene, x, y, def, hpMult));
      }
    }

    return spawned;
  }
}
