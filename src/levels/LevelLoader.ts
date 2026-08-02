import Phaser from 'phaser';
import { COLORS, TILE } from '../config';
import type { LevelDef } from './types';

export interface LoadedLevel {
  def: LevelDef;
  map: Phaser.Tilemaps.Tilemap;
  solidLayer: Phaser.Tilemaps.TilemapLayer;
  onewayLayer: Phaser.Tilemaps.TilemapLayer;
  width: number;
  height: number;
}

/** Generate placeholder tile textures. */
export function ensureTileTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('tile-hard')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.hard, 1);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(COLORS.hardEdge, 1);
    g.fillRect(0, 0, TILE, 2);
    g.fillRect(0, TILE - 2, TILE, 2);
    g.lineStyle(1, 0x374151, 0.5);
    g.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
    g.generateTexture('tile-hard', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('tile-oneway')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.oneway, 1);
    g.fillRect(0, 0, TILE, 6);
    g.fillStyle(COLORS.onewayEdge, 1);
    g.fillRect(0, 0, TILE, 2);
    g.fillStyle(0xa7f3d0, 0.6);
    for (let i = 0; i < TILE; i += 4) {
      g.fillRect(i, 2, 2, 4);
    }
    g.generateTexture('tile-oneway', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('tile-empty')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, TILE, TILE);
    g.generateTexture('tile-empty', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('exit-door')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Door frame
    g.fillStyle(0x334155, 1);
    g.fillRoundedRect(2, 0, 20, 28, 2);
    g.fillStyle(0x0f172a, 1);
    g.fillRect(5, 4, 14, 22);
    // Portal glow
    g.fillStyle(0xa78bfa, 0.9);
    g.fillEllipse(12, 15, 10, 16);
    g.fillStyle(0xe9d5ff, 0.7);
    g.fillEllipse(12, 15, 5, 10);
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(16, 16, 1.5);
    g.generateTexture('exit-door', 24, 28);
    g.destroy();
  }
}

/**
 * Build tilemap layers from a LevelDef grid.
 * Tile index 0 = empty, 1 = hard, 2 = oneway.
 */
export function loadLevel(scene: Phaser.Scene, def: LevelDef): LoadedLevel {
  ensureTileTextures(scene);

  const { width: gw, height: gh, grid } = def;
  const solidData: number[][] = [];
  const onewayData: number[][] = [];

  for (let y = 0; y < gh; y++) {
    solidData[y] = [];
    onewayData[y] = [];
    for (let x = 0; x < gw; x++) {
      const v = grid[y][x];
      solidData[y][x] = v === 1 ? 1 : 0;
      onewayData[y][x] = v === 2 ? 1 : 0;
    }
  }

  const map = scene.make.tilemap({
    data: solidData,
    tileWidth: TILE,
    tileHeight: TILE,
  });

  const solidTiles = map.addTilesetImage('tile-hard', 'tile-hard', TILE, TILE, 0, 0, 1);
  if (!solidTiles) throw new Error('Failed to add solid tileset');

  const solidLayer = map.createLayer(0, solidTiles, 0, 0);
  if (!solidLayer) throw new Error('Failed to create solid layer');
  solidLayer.setCollision([1]);
  solidLayer.setDepth(1);

  const onewayMap = scene.make.tilemap({
    data: onewayData,
    tileWidth: TILE,
    tileHeight: TILE,
  });
  const onewayTiles = onewayMap.addTilesetImage(
    'tile-oneway',
    'tile-oneway',
    TILE,
    TILE,
    0,
    0,
    1,
  );
  if (!onewayTiles) throw new Error('Failed to add oneway tileset');

  const onewayLayer = onewayMap.createLayer(0, onewayTiles, 0, 0);
  if (!onewayLayer) throw new Error('Failed to create oneway layer');
  onewayLayer.setCollision([1]);
  onewayLayer.setDepth(2);

  return {
    def,
    map,
    solidLayer,
    onewayLayer,
    width: gw * TILE,
    height: gh * TILE,
  };
}


