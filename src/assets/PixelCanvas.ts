import Phaser from 'phaser';

/**
 * Tiny pixel canvas helper: draw with integer pixels, then bake to texture.
 * Coordinates are in source pixels before any scale.
 */
export class PixelCanvas {
  readonly g: Phaser.GameObjects.Graphics;
  readonly w: number;
  readonly h: number;

  constructor(
    private scene: Phaser.Scene,
    w: number,
    h: number,
  ) {
    this.w = w;
    this.h = h;
    this.g = scene.make.graphics({ x: 0, y: 0 });
  }

  clear(): this {
    this.g.clear();
    return this;
  }

  /** Filled rectangle (pixel-perfect). */
  rect(x: number, y: number, w: number, h: number, color: number, alpha = 1): this {
    this.g.fillStyle(color, alpha);
    this.g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    return this;
  }

  /** Single pixel. */
  p(x: number, y: number, color: number, alpha = 1): this {
    return this.rect(x, y, 1, 1, color, alpha);
  }

  /** Outline rectangle (1px). */
  box(x: number, y: number, w: number, h: number, color: number): this {
    this.g.lineStyle(1, color, 1);
    this.g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    return this;
  }

  /** Filled circle (Phaser approx). */
  circle(cx: number, cy: number, r: number, color: number, alpha = 1): this {
    this.g.fillStyle(color, alpha);
    this.g.fillCircle(cx, cy, r);
    return this;
  }

  /** Horizontal line of pixels. */
  hline(x: number, y: number, w: number, color: number): this {
    return this.rect(x, y, w, 1, color);
  }

  /** Vertical line. */
  vline(x: number, y: number, h: number, color: number): this {
    return this.rect(x, y, 1, h, color);
  }

  /**
   * Draw a row of colors from a string map.
   * Legend: char -> color | null for transparent.
   */
  blit(
    x0: number,
    y0: number,
    rows: string[],
    legend: Record<string, number | null>,
  ): this {
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === ' ' || ch === '.') continue;
        const c = legend[ch];
        if (c == null) continue;
        this.p(x0 + x, y0 + y, c);
      }
    }
    return this;
  }

  bake(key: string): void {
    if (this.scene.textures.exists(key)) {
      this.scene.textures.remove(key);
    }
    this.g.generateTexture(key, this.w, this.h);
    this.g.destroy();
  }

  /** Bake without destroying graphics (for multi-frame). */
  bakeKeep(key: string): void {
    if (this.scene.textures.exists(key)) {
      this.scene.textures.remove(key);
    }
    this.g.generateTexture(key, this.w, this.h);
  }

  destroy(): void {
    this.g.destroy();
  }
}
