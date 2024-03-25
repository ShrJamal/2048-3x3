export enum DirType {
  Left = 'Left',
  Right = 'Right',
  Up = 'Up',
  Down = 'Down',
}

export const GAME_KEYS = {
  // Left
  ArrowLeft: DirType.Left,
  KeyA: DirType.Left, // A
  KeyH: DirType.Left, // Vim left
  // Right
  ArrowRight: DirType.Right,
  KeyD: DirType.Right, // D
  KeyL: DirType.Right, // Vim right
  // Up
  ArrowUp: DirType.Up,
  KeyW: DirType.Up, // W
  KeyK: DirType.Up, // Vim up
  // Down
  ArrowDown: DirType.Down,
  KeyS: DirType.Down, // S
  KeyJ: DirType.Down, // Vim down
} as const

export type GameKey = keyof typeof GAME_KEYS
