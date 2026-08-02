import Phaser from 'phaser';
import { P } from './palette';
import { PixelCanvas } from './PixelCanvas';

/**
 * Procedural fallbacks for HUD/powerups/decor.
 * Skips keys that already exist (so polished PNGs from /assets/sprites win).
 */
export function generateAllSprites(scene: Phaser.Scene): void {
  genPlayer(scene);
  genBomb(scene);
  genTiles(scene);
  genSoftBlock(scene);
  genEnemies(scene);
  genBoss(scene);
  genExplosion(scene);
  genPowerUps(scene);
  genExit(scene);
  genHud(scene);
  genCheckpoint(scene);
  genSpore(scene);
  genBgDecor(scene);
}

// ---------------------------------------------------------------------------
// Player — White Bomber (24×28)
// ---------------------------------------------------------------------------
function genPlayer(scene: Phaser.Scene): void {
  if (!scene.textures.exists('player')) {
    const idle = new PixelCanvas(scene, 24, 28);
    drawBomber(idle, 0, 0, false);
    idle.bake('player');
  }
  if (!scene.textures.exists('player-walk')) {
    const walk = new PixelCanvas(scene, 24, 28);
    drawBomber(walk, 0, 0, true);
    walk.bake('player-walk');
  }
}

function drawBomber(c: PixelCanvas, ox: number, oy: number, walk: boolean): void {
  const L: Record<string, number | null> = {
    '#': P.ink,
    W: P.white,
    w: P.whiteShade,
    D: P.whiteDeep,
    V: P.visor,
    v: P.visorDark,
    R: P.antenna,
    r: P.antennaGlow,
    G: P.glove,
    B: P.boot,
    S: P.silver,
  };

  // 16×24 sprite inside 24×28 with padding
  const px = ox + 4;
  const py = oy + 2;

  // Antenna
  c.blit(px, py, [
    '....R.....',
    '....R.....',
    '...rR.....',
  ], L);

  // Helmet dome
  c.blit(px, py + 3, [
    '..#WWWW#..',
    '.#WWWWWW#.',
    '#WWWWWWWW#',
    '#WWWWWWWW#',
    '#WWvvvvWW#',
    '#WWvvvvWW#',
    '#WWWWWWWW#',
    '.#WWWWWW#.',
    '..#WWWW#..',
  ], L);

  // Body / suit
  const bodyY = py + 12;
  c.blit(px, bodyY, [
    '..#WWWW#..',
    '.#WWWWWW#.',
    '#W#WWWW#W#',
    '#G#WWWW#G#',
    '.#WWWWWW#.',
    '..#WWWW#..',
  ], L);

  // Legs
  const leg = walk
    ? [
        '..#B..B#..',
        '..#B..BB..',
        '..BB...B..',
      ]
    : [
        '..#B..B#..',
        '..#B..B#..',
        '..BB..BB..',
      ];
  c.blit(px, bodyY + 6, leg, L);

  // Soft highlight on helmet
  c.p(px + 3, py + 5, P.white, 0.9);
  c.p(px + 4, py + 5, P.silver, 0.7);
}

// ---------------------------------------------------------------------------
// Bomb 16×16
// ---------------------------------------------------------------------------
function genBomb(scene: Phaser.Scene): void {
  if (scene.textures.exists('bomb')) return;
  const c = new PixelCanvas(scene, 16, 16);
  const L: Record<string, number | null> = {
    '#': P.ink,
    B: P.bombBody,
    b: P.bombShine,
    F: P.fuse,
    Y: P.fuseTip,
    S: P.steel,
  };
  c.blit(0, 0, [
    '......Y.....',
    '.....FY.....',
    '....FF......',
    '...#BB#.....',
    '..#BBBBb#...',
    '.#BBBBBBb#..',
    '.#BBBBBBb#..',
    '#BBBBBBBBb#.',
    '#BBBBBBBBb#.',
    '#BBBBBBBBb#.',
    '.#BBBBBBb#..',
    '.#BBBBBBb#..',
    '..#BBBBb#...',
    '...#BB#.....',
    '............',
    '............',
  ], L);
  c.bake('bomb');
}

// ---------------------------------------------------------------------------
// Tiles 16×16
// ---------------------------------------------------------------------------
function genTiles(scene: Phaser.Scene): void {
  if (!scene.textures.exists('tile-hard')) {
    const c = new PixelCanvas(scene, 16, 16);
    // Stone block with grass top
    c.rect(0, 0, 16, 16, P.stone);
    c.rect(0, 0, 16, 4, P.grass);
    c.rect(0, 3, 16, 1, P.grassDark);
    // stone cracks / shading
    c.rect(0, 4, 16, 1, P.stoneLight);
    c.rect(0, 15, 16, 1, P.stoneDark);
    c.rect(0, 0, 1, 16, P.stoneDark);
    c.rect(15, 0, 1, 16, P.stoneDark);
    // pebbles
    c.p(3, 8, P.stoneDark);
    c.p(4, 8, P.stoneDark);
    c.p(10, 11, P.stoneDark);
    c.p(7, 13, P.stoneLight);
    c.bake('tile-hard');
  }

  if (!scene.textures.exists('tile-oneway')) {
    const c = new PixelCanvas(scene, 16, 16);
    // Only top band solid-looking; rest transparent-ish dark
    c.rect(0, 0, 16, 6, P.oneway);
    c.rect(0, 0, 16, 2, P.onewayLight);
    c.rect(0, 5, 16, 1, P.onewayDark);
    // chevrons
    for (let i = 0; i < 4; i++) {
      c.p(2 + i * 4, 3, P.onewayLight);
      c.p(3 + i * 4, 3, P.onewayDark);
    }
    c.bake('tile-oneway');
  }

  if (!scene.textures.exists('tile-empty')) {
    const c = new PixelCanvas(scene, 16, 16);
    c.bake('tile-empty');
  }

  // Variant hard for brick world (same key reused — we'll tint layers per level instead)
  if (!scene.textures.exists('tile-hard-brick')) {
    const c = new PixelCanvas(scene, 16, 16);
    c.rect(0, 0, 16, 16, 0xb45309);
    c.rect(0, 0, 16, 1, 0xfbbf24);
    c.hline(0, 7, 16, 0x78350f);
    c.vline(8, 0, 7, 0x78350f);
    c.vline(4, 8, 8, 0x78350f);
    c.vline(12, 8, 8, 0x78350f);
    c.hline(0, 15, 16, 0x78350f);
    c.bake('tile-hard-brick');
  }

  if (!scene.textures.exists('tile-hard-cave')) {
    const c = new PixelCanvas(scene, 16, 16);
    c.rect(0, 0, 16, 16, 0x4b5563);
    c.rect(0, 0, 16, 2, 0x6d28d9);
    c.p(2, 5, 0xa78bfa);
    c.p(9, 8, 0x7c3aed);
    c.p(5, 12, 0x8b5cf6);
    c.rect(0, 15, 16, 1, 0x1e1b4b);
    c.bake('tile-hard-cave');
  }
}

// ---------------------------------------------------------------------------
// Soft block crate 16×16
// ---------------------------------------------------------------------------
function genSoftBlock(scene: Phaser.Scene): void {
  if (scene.textures.exists('soft-block')) return;
  const c = new PixelCanvas(scene, 16, 16);
  const L: Record<string, number | null> = {
    '#': P.ink,
    C: P.crate,
    c: P.crateLight,
    D: P.crateDark,
    B: P.crateBand,
  };
  c.blit(0, 0, [
    '################',
    '#cccccccccccccc#',
    '#cCCCCCCCCCCCCc#',
    '#cCCCCCCCCCCCCc#',
    '#BBBBBBBBBBBBBB#',
    '#cCCCCCCCCCCCCc#',
    '#cCCCCCCCCCCCCc#',
    '#cCCCCCCCCCCCCc#',
    '#cCCCCCCCCCCCCc#',
    '#BBBBBBBBBBBBBB#',
    '#cCCCCCCCCCCCCc#',
    '#cCCCCCCCCCCCCc#',
    '#cCCCCCCCCCCCCc#',
    '#cDDDDDDDDDDDDc#',
    '#DDDDDDDDDDDDDD#',
    '################',
  ], L);
  c.bake('soft-block');
}

// ---------------------------------------------------------------------------
// Enemies 16×16
// ---------------------------------------------------------------------------
function genEnemies(scene: Phaser.Scene): void {
  if (!scene.textures.exists('enemy-ballom')) {
    const c = new PixelCanvas(scene, 16, 16);
    const L: Record<string, number | null> = {
      '#': P.ink,
      P: P.ballom,
      p: P.ballomDark,
      E: P.ballomEye,
      W: P.white,
    };
    c.blit(0, 0, [
      '................',
      '....##PPPP##....',
      '...#PPPPPPPP#...',
      '..#PPPPPPPPPP#..',
      '.#PPWPPPPWPPP#.',
      '.#PPEPPPPEPPP#.',
      '.#PPPPPPPPPPP#.',
      '.#PPPP##PPPPP#.',
      '.#PPPPPPPPPPP#.',
      '..#PPPPPPPPP#...',
      '...#PPPPPPPP#...',
      '....##PPPP##....',
      '......#pp#......',
      '......#pp#......',
      '.......##.......',
      '................',
    ], L);
    c.bake('enemy-ballom');
  }

  if (!scene.textures.exists('enemy-onil')) {
    const c = new PixelCanvas(scene, 16, 16);
    const L: Record<string, number | null> = {
      '#': P.ink,
      B: P.onil,
      b: P.onilDark,
      E: P.white,
      R: P.antenna,
      M: P.onilEye,
    };
    c.blit(0, 0, [
      '................',
      '....##BBBB##....',
      '...#BBBBBBBB#...',
      '..#BBBBBBBBBB#..',
      '.#BBE#BB#EBBB#.',
      '.#BBEMBBMEBBB#.',
      '.#BBBBBBBBBBB#.',
      '.#BBB####BBBB#.',
      '.#BB#RRRR#BBB#.',
      '..#BBBBBBBB#...',
      '...#BBBBBBBB#...',
      '....##BBBB##....',
      '......#bb#......',
      '.....######.....',
      '................',
      '................',
    ], L);
    c.bake('enemy-onil');
  }

  if (!scene.textures.exists('enemy-dahl')) {
    const c = new PixelCanvas(scene, 16, 16);
    const L: Record<string, number | null> = {
      '#': P.ink,
      G: P.dahl,
      g: P.dahlDark,
      E: P.dahlEye,
      Y: P.fuseTip,
      W: P.white,
    };
    c.blit(0, 0, [
      '................',
      '...##GGGGGG##...',
      '..#GGGGGGGGGG#..',
      '.#GGWGGGGWGGG#.',
      '.#GGEGGGGEGGG#.',
      '.#GGGGGGGGGGG#.',
      '.#GG######GGG#.',
      '.#GGGGGGGGGGG#.',
      '..#GGGGGGGGG#...',
      '...##GGGGGG##...',
      '....#G#..#G#....',
      '....#G#..#G#....',
      '....#gg..gg#....',
      '....####.####...',
      '................',
      '................',
    ], L);
    c.bake('enemy-dahl');
  }
}

function genSpore(scene: Phaser.Scene): void {
  if (scene.textures.exists('spore')) return;
  const c = new PixelCanvas(scene, 8, 8);
  c.circle(4, 4, 3.5, P.spore);
  c.circle(3, 3, 1.2, P.fuseTip);
  c.box(1, 1, 6, 6, P.ink);
  c.bake('spore');
}

// ---------------------------------------------------------------------------
// Boss 32×32
// ---------------------------------------------------------------------------
function genBoss(scene: Phaser.Scene): void {
  if (scene.textures.exists('boss-king')) return;
  const c = new PixelCanvas(scene, 32, 32);
  // Crown
  c.rect(8, 2, 16, 5, P.bossCrown);
  c.rect(8, 1, 3, 4, P.bossCrown);
  c.rect(14, 0, 4, 5, P.bossCrown);
  c.rect(21, 1, 3, 4, P.bossCrown);
  c.p(9, 2, P.bossGem);
  c.p(16, 1, P.portal);
  c.p(22, 2, P.bossGem);
  // Body
  c.circle(16, 18, 12, P.bombBody);
  c.circle(16, 18, 12, P.ink, 0); // outline via stroke
  c.g.lineStyle(1, P.ink, 1);
  c.g.strokeCircle(16, 18, 12);
  // Shine
  c.circle(11, 14, 3.5, P.bombShine);
  // Eyes angry
  c.rect(10, 15, 4, 3, P.antenna);
  c.rect(18, 15, 4, 3, P.antenna);
  c.p(11, 16, P.white);
  c.p(19, 16, P.white);
  // Mouth
  c.rect(13, 21, 6, 2, P.ink);
  c.p(12, 20, P.ink);
  c.p(19, 20, P.ink);
  // Fuse
  c.g.lineStyle(2, P.fuse, 1);
  c.g.lineBetween(16, 6, 20, 2);
  c.circle(20, 2, 2, P.fuseTip);
  c.bake('boss-king');
}

// ---------------------------------------------------------------------------
// Explosion frames (center cell look)
// ---------------------------------------------------------------------------
function genExplosion(scene: Phaser.Scene): void {
  if (scene.textures.exists('fx-explode')) return;
  const c = new PixelCanvas(scene, 16, 16);
  c.circle(8, 8, 7, P.fireEdge);
  c.circle(8, 8, 5, P.fireMid);
  c.circle(8, 8, 3, P.fireCore);
  c.p(5, 5, P.white);
  c.bake('fx-explode');
}

// ---------------------------------------------------------------------------
// Power-ups 16×16
// ---------------------------------------------------------------------------
function genPowerUps(scene: Phaser.Scene): void {
  const kinds: { key: string; draw: (c: PixelCanvas) => void }[] = [
    {
      key: 'powerup-bomb',
      draw: (c) => {
        frame(c);
        c.circle(8, 9, 4, P.bombBody);
        c.circle(7, 8, 1.5, P.bombShine);
        c.rect(7, 3, 2, 3, P.fuse);
        c.p(8, 2, P.fuseTip);
      },
    },
    {
      key: 'powerup-fire',
      draw: (c) => {
        frame(c);
        c.g.fillStyle(P.fireEdge, 1);
        c.g.fillTriangle(8, 3, 13, 13, 3, 13);
        c.g.fillStyle(P.fireMid, 1);
        c.g.fillTriangle(8, 6, 11, 13, 5, 13);
        c.g.fillStyle(P.fireCore, 1);
        c.g.fillTriangle(8, 9, 10, 13, 6, 13);
      },
    },
    {
      key: 'powerup-speed',
      draw: (c) => {
        frame(c);
        c.g.fillStyle(P.puSpeed, 1);
        c.g.fillTriangle(4, 4, 4, 12, 13, 8);
        c.g.fillStyle(P.white, 0.8);
        c.g.fillTriangle(5, 6, 5, 10, 10, 8);
      },
    },
    {
      key: 'powerup-life',
      draw: (c) => {
        frame(c);
        c.circle(5.5, 6.5, 2.8, P.puLife);
        c.circle(10.5, 6.5, 2.8, P.puLife);
        c.g.fillStyle(P.puLife, 1);
        c.g.fillTriangle(3, 7, 13, 7, 8, 13);
      },
    },
  ];

  for (const { key, draw } of kinds) {
    if (scene.textures.exists(key)) continue;
    const c = new PixelCanvas(scene, 16, 16);
    draw(c);
    c.bake(key);
  }
}

function frame(c: PixelCanvas): void {
  c.rect(1, 1, 14, 14, P.puFrame);
  c.box(1, 1, 14, 14, P.ink);
  c.rect(2, 2, 12, 1, P.white);
}

// ---------------------------------------------------------------------------
// Exit door 24×28
// ---------------------------------------------------------------------------
function genExit(scene: Phaser.Scene): void {
  if (scene.textures.exists('exit-door')) return;
  const c = new PixelCanvas(scene, 24, 28);
  // Stone frame
  c.rect(2, 0, 20, 28, P.stoneDark);
  c.rect(4, 2, 16, 24, P.ink);
  // Portal swirl
  c.circle(12, 14, 7, P.portalEdge);
  c.circle(12, 14, 5.5, P.portal);
  c.circle(12, 14, 3, P.portalCore);
  c.p(10, 12, P.white);
  // Stars
  c.p(7, 8, P.fuseTip);
  c.p(16, 18, P.fuseTip);
  c.bake('exit-door');
}

// ---------------------------------------------------------------------------
// HUD + flags
// ---------------------------------------------------------------------------
function genHud(scene: Phaser.Scene): void {
  if (!scene.textures.exists('hud-heart')) {
    const c = new PixelCanvas(scene, 14, 14);
    c.circle(4, 4, 3.2, P.puLife);
    c.circle(10, 4, 3.2, P.puLife);
    c.g.fillStyle(P.puLife, 1);
    c.g.fillTriangle(1, 5, 13, 5, 7, 13);
    c.p(3, 3, P.white);
    c.bake('hud-heart');
  }
  if (!scene.textures.exists('hud-bomb')) {
    const c = new PixelCanvas(scene, 12, 12);
    c.circle(6, 7, 4.5, P.bombBody);
    c.circle(5, 6, 1.5, P.bombShine);
    c.rect(5, 1, 2, 3, P.fuse);
    c.p(6, 1, P.fuseTip);
    c.bake('hud-bomb');
  }
  if (!scene.textures.exists('hud-fire')) {
    const c = new PixelCanvas(scene, 12, 12);
    c.g.fillStyle(P.fireEdge, 1);
    c.g.fillTriangle(6, 0, 11, 11, 1, 11);
    c.g.fillStyle(P.fireCore, 1);
    c.g.fillTriangle(6, 4, 9, 11, 3, 11);
    c.bake('hud-fire');
  }
}

function genCheckpoint(scene: Phaser.Scene): void {
  if (!scene.textures.exists('flag-pole')) {
    const c = new PixelCanvas(scene, 16, 28);
    c.rect(7, 0, 3, 26, P.steel);
    c.rect(6, 25, 5, 3, P.stoneDark);
    c.bake('flag-pole');
  }
  if (!scene.textures.exists('flag-off')) {
    const c = new PixelCanvas(scene, 14, 12);
    c.g.fillStyle(P.steel, 1);
    c.g.fillTriangle(0, 0, 13, 5, 0, 10);
    c.bake('flag-off');
  }
  if (!scene.textures.exists('flag-on')) {
    const c = new PixelCanvas(scene, 14, 12);
    c.g.fillStyle(P.fuse, 1);
    c.g.fillTriangle(0, 0, 13, 5, 0, 10);
    c.circle(4, 5, 2, P.fuseTip);
    c.bake('flag-on');
  }
}

// ---------------------------------------------------------------------------
// Background decor (clouds, hills) — large soft images
// ---------------------------------------------------------------------------
function genBgDecor(scene: Phaser.Scene): void {
  if (!scene.textures.exists('bg-cloud')) {
    const c = new PixelCanvas(scene, 48, 20);
    c.circle(12, 12, 8, P.white, 0.85);
    c.circle(24, 10, 10, P.white, 0.9);
    c.circle(36, 12, 7, P.white, 0.85);
    c.circle(20, 14, 6, P.silver, 0.5);
    c.bake('bg-cloud');
  }
  if (!scene.textures.exists('bg-hill')) {
    const c = new PixelCanvas(scene, 64, 32);
    c.g.fillStyle(P.grassDark, 0.9);
    c.g.fillEllipse(32, 32, 60, 40);
    c.g.fillStyle(P.grass, 0.85);
    c.g.fillEllipse(32, 34, 50, 32);
    c.bake('bg-hill');
  }
}
