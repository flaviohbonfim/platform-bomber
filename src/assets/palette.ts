/**
 * Unified Bomberman-inspired pixel palette (bright, saturated, readable).
 * Keep all art on this set for visual cohesion.
 */
export const P = {
  // Ink / outline
  ink: 0x1a1523,
  inkSoft: 0x2d2640,

  // Whites / grays (hero suit)
  white: 0xf7f3ea,
  whiteShade: 0xd4cfc4,
  whiteDeep: 0xa8a29e,
  silver: 0xe8eef5,
  steel: 0x64748b,

  // Hero accents
  antenna: 0xef4444,
  antennaGlow: 0xfca5a5,
  visor: 0x0ea5e9,
  visorDark: 0x0369a1,
  glove: 0xfbbf24,
  boot: 0x1e293b,

  // Bomb
  bombBody: 0x1e1b2e,
  bombShine: 0x4b5563,
  fuse: 0xf97316,
  fuseTip: 0xfef08a,

  // Fire
  fireCore: 0xfef9c3,
  fireMid: 0xfb923c,
  fireEdge: 0xdc2626,
  fireSmoke: 0x78716c,

  // Soft blocks (crate)
  crate: 0xd97706,
  crateLight: 0xfbbf24,
  crateDark: 0x92400e,
  crateBand: 0x78350f,

  // Hard ground
  stone: 0x6b7280,
  stoneLight: 0x9ca3af,
  stoneDark: 0x374151,
  grass: 0x4ade80,
  grassDark: 0x16a34a,
  dirt: 0xa16207,

  // One-way
  oneway: 0x34d399,
  onewayLight: 0xa7f3d0,
  onewayDark: 0x059669,

  // Enemies
  ballom: 0xf9a8d4,
  ballomDark: 0xdb2777,
  ballomEye: 0x831843,
  onil: 0x60a5fa,
  onilDark: 0x1d4ed8,
  onilEye: 0x0f172a,
  dahl: 0x4ade80,
  dahlDark: 0x15803d,
  dahlEye: 0x14532d,
  spore: 0xa3e635,

  // Boss
  bossCrown: 0xfbbf24,
  bossGem: 0xef4444,

  // Portal / magic
  portal: 0xa78bfa,
  portalCore: 0xe9d5ff,
  portalEdge: 0x6d28d9,

  // Power-ups
  puBomb: 0x1e1b2e,
  puFire: 0xf97316,
  puSpeed: 0x38bdf8,
  puLife: 0xef4444,
  puFrame: 0xf8fafc,

  // Sky themes
  skyGardenTop: 0x7dd3fc,
  skyGardenBot: 0xbbf7d0,
  skyBrickTop: 0xfcd34d,
  skyBrickBot: 0x78716c,
  skyCaveTop: 0x4c1d95,
  skyCaveBot: 0x1e1b4b,
  skyBossTop: 0x9f1239,
  skyBossBot: 0x1c0a0e,
} as const;
