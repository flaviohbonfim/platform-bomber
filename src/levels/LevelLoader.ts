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

/** Ensure tiles exist (SpriteFactory should have run in Preload). */
export function ensureTileTextures(scene: Phaser.Scene): void {
  void scene;
  void COLORS;
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

  // Theme-specific ground tileset
  let hardKey = 'tile-hard';
  if (def.id.includes('w1-2')) hardKey = 'tile-hard-brick';
  else if (def.id.includes('w1-3') || def.id.includes('boss')) hardKey = 'tile-hard-cave';
  if (!scene.textures.exists(hardKey)) hardKey = 'tile-hard';

  const map = scene.make.tilemap({
    data: solidData,
    tileWidth: TILE,
    tileHeight: TILE,
  });

  const solidTiles = map.addTilesetImage(hardKey, hardKey, TILE, TILE, 0, 0, 1);
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


