import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/**
 * Smooth follow with deadzone + horizontal look-ahead.
 * Vertical follow is dampened so normal jumps don't bob the camera.
 */
export class CameraSystem {
  private lookAhead = 0;
  private readonly lookAheadMax = 48;
  private readonly lookAheadLerp = 6;
  private readonly followLerp = 8;

  constructor(
    private scene: Phaser.Scene,
    private target: Phaser.GameObjects.GameObject & { x: number; y: number },
    bounds: { width: number; height: number },
  ) {
    const cam = scene.cameras.main;
    cam.setBounds(0, 0, bounds.width, bounds.height);
    cam.setDeadzone(GAME_WIDTH * 0.2, GAME_HEIGHT * 0.35);
    // Start centered on player
    cam.centerOn(target.x, target.y);
  }

  update(dt: number, facing: number, velocityX: number): void {
    const cam = this.scene.cameras.main;
    const desiredLook =
      Math.sign(facing) * this.lookAheadMax * (Math.min(Math.abs(velocityX) / 150, 1) * 0.6 + 0.4);
    // Frame-rate independent lerp
    const k = 1 - Math.exp(-this.lookAheadLerp * dt);
    this.lookAhead += (desiredLook - this.lookAhead) * k;

    const targetX = this.target.x + this.lookAhead;
    // Soft vertical: only follow large Y changes (lerp slower on Y)
    const targetY = this.target.y - 16;

    const kx = 1 - Math.exp(-this.followLerp * dt);
    const ky = 1 - Math.exp(-this.followLerp * 0.45 * dt);

    const midX = cam.scrollX + cam.width / 2;
    const midY = cam.scrollY + cam.height / 2;

    // Respect deadzone manually for smoother control
    const dzW = cam.deadzone ? cam.deadzone.width / 2 : 40;
    const dzH = cam.deadzone ? cam.deadzone.height / 2 : 50;

    let newMidX = midX;
    let newMidY = midY;

    if (targetX < midX - dzW) newMidX = targetX + dzW;
    else if (targetX > midX + dzW) newMidX = targetX - dzW;
    else newMidX = midX + (targetX - midX) * kx * 0.15;

    if (targetY < midY - dzH) newMidY = midY + (targetY - (midY - dzH)) * ky;
    else if (targetY > midY + dzH) newMidY = midY + (targetY - (midY + dzH)) * ky;
    else newMidY = midY + (targetY - midY) * ky * 0.1;

    cam.centerOn(newMidX, newMidY);
  }
}
