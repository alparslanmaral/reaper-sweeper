export const WORLD_SIZE = 3200;

export const DEPTH = {
  GROUND: 0,
  TRAIL: 5,
  PICKUP: 10,
  ENEMY: 20,
  PLAYER: 25,
  PROJECTILE: 30,
  VFX: 40,
  UI: 100,
};

export const STORAGE_KEY = 'reaper-sweeper-save-v1';

export const BOSS_INTERVAL_MS = 3 * 60 * 1000; // every 3 minutes

export function isMobileDevice(): boolean {
  const ua = navigator.userAgent || '';
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  return touch && (mobileUA || window.innerWidth < 900);
}
