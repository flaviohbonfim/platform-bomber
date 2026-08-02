import { FEEL, TILE } from '../config';

export interface JumpPhysics {
  /** Rise gravity (px/s²), y-down positive. */
  gravity: number;
  /** Initial jump velocity (negative = up). */
  jumpVelocity: number;
  /** Fall gravity (px/s²). */
  fallGravity: number;
  /** Horizontal acceleration on ground (px/s²). */
  groundAccel: number;
  /** Horizontal acceleration in air (px/s²). */
  airAccel: number;
}

/**
 * Derive platformer physics from height + time-to-apex (skill platformer Pattern 1).
 * y-axis points DOWN (Phaser / Canvas convention).
 */
export function deriveJumpPhysics(
  jumpHeightTiles: number = FEEL.jumpHeightTiles,
  timeToApex: number = FEEL.timeToApex,
  fallMultiplier: number = FEEL.fallMultiplier,
  maxRunSpeed: number = FEEL.maxRunSpeed,
  groundAccelTime: number = FEEL.groundAccelTime,
  airControl: number = FEEL.airControl,
): JumpPhysics {
  const jumpHeight = jumpHeightTiles * TILE;
  const gravity = (2 * jumpHeight) / (timeToApex * timeToApex);
  const jumpVelocity = -(2 * jumpHeight) / timeToApex;
  const fallGravity = gravity * fallMultiplier;
  const groundAccel = maxRunSpeed / Math.max(groundAccelTime, 0.001);
  const airAccel = groundAccel * airControl;

  return { gravity, jumpVelocity, fallGravity, groundAccel, airAccel };
}

/** Exponential-style approach for frame-rate independent smoothing. */
export function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}
