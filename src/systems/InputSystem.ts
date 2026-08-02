import Phaser from 'phaser';

export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  jumpReleased: boolean;
  bombPressed: boolean;
  bombHeld: boolean;
  bombReleased: boolean;
  pausePressed: boolean;
}

/**
 * Keyboard input for the vertical slice.
 * Jump: Z / Space / Up
 * Bomb: X / J (wired later)
 */
export class InputSystem {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyZ: Phaser.Input.Keyboard.Key;
  private keyX: Phaser.Input.Keyboard.Key;
  private keyJ: Phaser.Input.Keyboard.Key;
  private keySpace: Phaser.Input.Keyboard.Key;
  private keyEsc: Phaser.Input.Keyboard.Key;
  private keyEnter: Phaser.Input.Keyboard.Key;

  private prevJump = false;
  private prevBomb = false;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) {
      throw new Error('Keyboard not available');
    }

    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyZ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyJ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyEsc = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyEnter = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  /** Call once per frame after reading state for edge detection. */
  update(): InputState {
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const down = this.cursors.down.isDown;

    const jumpHeld =
      this.keyZ.isDown || this.keySpace.isDown || this.cursors.up.isDown;
    const jumpPressed = jumpHeld && !this.prevJump;
    const jumpReleased = !jumpHeld && this.prevJump;

    const bombHeld = this.keyX.isDown || this.keyJ.isDown;
    const bombPressed = bombHeld && !this.prevBomb;
    const bombReleased = !bombHeld && this.prevBomb;

    const pausePressed =
      Phaser.Input.Keyboard.JustDown(this.keyEsc) ||
      Phaser.Input.Keyboard.JustDown(this.keyEnter);

    this.prevJump = jumpHeld;
    this.prevBomb = bombHeld;

    return {
      left,
      right,
      down,
      jumpPressed,
      jumpHeld,
      jumpReleased,
      bombPressed,
      bombHeld,
      bombReleased,
      pausePressed,
    };
  }
}
