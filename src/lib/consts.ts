export const CSS_POS_CALC = (pos: number) =>
  `calc(var(--grid-pad) + ${pos} * ( var(--cell-size) + var(--grid-gap) ))`

export const COLORS = new Map([
  [2, { bg: "#eee4da", fg: "#776e65" }],
  [4, { bg: "#ede0c8", fg: "#776e65" }],
  [8, { bg: "#f2b179", fg: "#f9f6f2" }],
  [16, { bg: "#f59563", fg: "#f9f6f2" }],
  [32, { bg: "#f67c5f", fg: "#f9f6f2" }],
  [64, { bg: "#f65e3b", fg: "#f9f6f2" }],
  [128, { bg: "#edcf72", fg: "#f9f6f2" }],
  [256, { bg: "#edcc61", fg: "#f9f6f2" }],
  [512, { bg: "#edc850", fg: "#f9f6f2" }],
  [1024, { bg: "#edc53f", fg: "#f9f6f2" }],
  [2048, { bg: "#edc22e", fg: "#f9f6f2" }],
  // Extended values
  [4096, { fg: "#f9f6f2", bg: "#ccbf3f" }], // Olive green, for a new hue
  [8192, { fg: "#f9f6f2", bg: "#33a4d8" }], // Soft blue, for contrast
  [16384, { fg: "#f9f6f2", bg: "#a06cd5" }], // Gentle purple, for distinctiveness
  [32768, { fg: "#f9f6f2", bg: "#f07b7b" }], // Soft red, for a clear distinction
  [65536, { fg: "#f9f6f2", bg: "#7acba5" }], // Sea green, offering a cool, fresh look
  [131072, { fg: "#f9f6f2", bg: "#ffb347" }], // A brighter orange, for high contrast
])

export type GameStatus = "playing" | "over" | "won"

export const DIRECTIONS = ["Up", "Down", "Left", "Right"] as const
export type DirType = (typeof DIRECTIONS)[number]

export const GAME_KEYS: Record<string, DirType> = {
  // Left
  ArrowLeft: "Left",
  KeyA: "Left", // A
  KeyH: "Left", // Vim left
  // Right
  ArrowRight: "Right",
  KeyD: "Right", // D
  KeyL: "Right", // Vim right
  // Up
  ArrowUp: "Up",
  KeyW: "Up", // W
  KeyK: "Up", // Vim up
  // Down
  ArrowDown: "Down",
  KeyS: "Down", // S
  KeyJ: "Down", // Vim down
} as const

export type GameKey = keyof typeof GAME_KEYS
