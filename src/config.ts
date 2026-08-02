/** Global game + platformer feel knobs (tune by outcome, not magic numbers). */

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

/** Tile size in world pixels. */
export const TILE = 16;

/** Platformer feel — derived into gravity/jump in feel.ts */
export const FEEL = {
  /** Max jump height in tiles. */
  jumpHeightTiles: 3.5,
  /** Seconds to reach apex. */
  timeToApex: 0.35,
  /** Fall gravity as multiple of rise gravity. */
  fallMultiplier: 1.8,
  /** Coyote time after leaving ground (seconds). */
  coyoteTime: 0.1,
  /** Jump buffer before landing (seconds). */
  jumpBuffer: 0.12,
  /** Cut upward velocity on jump release (variable height). */
  jumpCutMultiplier: 0.45,
  /** Near-apex gravity scale for hang. */
  apexHangMultiplier: 0.55,
  /** |vy| below this (px/s) counts as apex for hang. */
  apexHangThreshold: 40,
  /** Horizontal top speed (px/s). */
  maxRunSpeed: 150,
  /** Seconds to reach top speed on ground. */
  groundAccelTime: 0.08,
  /** Air control as fraction of ground accel. */
  airControl: 0.7,
  /** Ground friction when no input (multiplier applied toward 0). */
  groundFriction: 0.75,
  /** Terminal fall speed (px/s). */
  maxFallSpeed: 420,
  /** Corner correction nudge (px). */
  cornerCorrection: 4,
} as const;

export const PLAYER = {
  width: 14,
  height: 22,
  /** Visual size (placeholder rect). */
  displayWidth: 16,
  displayHeight: 24,
  /** Starting simultaneous bombs. */
  startMaxBombs: 1,
  /** Starting explosion range (tiles from center). */
  startFireRange: 1,
} as const;

export const LIVES = {
  /** Starting lives. */
  start: 3,
  /** Max lives (1-up cap). */
  max: 5,
  /** Invulnerability after hit / respawn (seconds). */
  iFrameDuration: 1.5,
  /** Death anim before respawn (seconds). */
  deathAnimDuration: 0.85,
  /** Soft block score. */
  scoreSoft: 100,
  /** Checkpoint activate score. */
  scoreCheckpoint: 50,
  /** Enemy kill scores by type. */
  scoreBallom: 200,
  scoreOnil: 300,
  scoreDahl: 400,
  /** Power-up collect score. */
  scorePowerUp: 150,
} as const;

export const POWERUP = {
  maxBombs: 5,
  maxFire: 5,
  maxSpeedStacks: 3,
  /** Extra run speed per speed stack. */
  speedPerStack: 0.14,
  /** Soft-block drop weights (relative). */
  dropWeights: {
    bomb: 35,
    fire: 35,
    speed: 25,
    life: 5,
  },
} as const;

export const ENEMY = {
  gravity: 900,
  maxFall: 380,
  ballomSpeed: 45,
  onilSpeed: 70,
  dahlSpeed: 55,
  dahlJumpVy: -260,
  dahlShootCooldown: 2.2,
  sporeSpeed: 90,
  sporeLife: 3.5,
} as const;

export const BOSS = {
  maxHp: 12,
  walkSpeed: 55,
  plantCooldown: 2.0,
  throwCooldown: 1.6,
  slamCooldown: 3.2,
  slamTelegraph: 0.7,
  hitIFrames: 0.45,
  phase2HpRatio: 0.66,
  phase3HpRatio: 0.33,
  plantFireRange: 1,
  throwFireRange: 2,
  rageFireRange: 3,
  scoreDefeat: 5000,
  gravity: 1000,
} as const;

/** Bomb / explosion knobs. */
export const BOMB = {
  /** Fuse time in seconds. */
  fuseTime: 2.0,
  /** Active fire duration (hit frames). */
  fireDuration: 0.4,
  /** Facing bias when planting (px). */
  plantFacingBias: 6,
  /** Soft block power-up drop chance (0–1). */
  softDropChance: 0.25,
  /** Screen shake on explode. */
  shakeIntensity: 0.004,
  shakeDuration: 120,
  /** Hold shorter than this = plant at feet (seconds). */
  tapMaxTime: 0.15,
  /** Hold time for full throw charge (seconds). */
  chargeFullTime: 0.85,
  /** Throw horizontal speed min/max (px/s). */
  throwSpeedMin: 130,
  throwSpeedMax: 290,
  /** Throw upward speed min/max (negative = up, px/s). */
  throwUpMin: -150,
  throwUpMax: -300,
  /** Gravity for airborne bombs (px/s²). */
  throwGravity: 780,
  /** Max fall speed while airborne. */
  throwMaxFall: 400,
} as const;

export const COLORS = {
  bg: 0x1a1a2e,
  skyTop: 0x2d4a6f,
  skyBottom: 0x1a1a2e,
  hard: 0x6b7280,
  hardEdge: 0x4b5563,
  oneway: 0x34d399,
  onewayEdge: 0x059669,
  soft: 0xd97706,
  softDark: 0xb45309,
  softLight: 0xfbbf24,
  bomb: 0x1e1e24,
  bombHighlight: 0x3f3f46,
  fuse: 0xf97316,
  fireCore: 0xfef08a,
  fireMid: 0xfb923c,
  fireEdge: 0xef4444,
  player: 0xf5f5f5,
  playerOutline: 0x1e293b,
  playerAntenna: 0xef4444,
  hud: 0xffffff,
  debug: 0xfbbf24,
  powerup: 0x38bdf8,
} as const;
