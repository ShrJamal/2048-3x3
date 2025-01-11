import type { DirType } from "./consts"
import type { GameSizeType, TileType } from "./types"

export type CellType = {
  readonly x: number
  readonly y: number
  tile: TileType | null
  mergedTile: TileType | null
}

export class Grid {
  readonly size: number
  private readonly cells: CellType[][]

  constructor(size: GameSizeType, initTiles?: TileType[]) {
    this.size = +size
    this.cells = Array.from({ length: this.size }, (_, y) =>
      Array.from({ length: this.size }, (_, x) => {
        const tile = initTiles?.find((t) => t.x === x && t.y === y)
        return {
          x,
          y,
          tile: tile ? { ...tile } : null,
          mergedTile: null,
        }
      }),
    )
  }

  // Returns the cell at the given coordinates.
  getCellAt(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size)
      throw new Error("Invalid cell coordinates")
    return this.cells[y]![x]!
  }

  // Returns all tiles in the grid.
  get tiles() {
    return this.cells
      .flat()
      .filter((cell) => cell.tile)
      .map((cell) => cell.tile!)
  }

  // Adds a tile to a grid's cell.
  addTile(tile: TileType | null | undefined) {
    if (!tile) return
    this.getCellAt(tile.x, tile.y).tile = tile
  }

  // Get a random tile from random empty cell.
  getRandTile(): TileType | null {
    const emptyCells = this.cells.flat().filter((c) => !c.tile)
    // If there are no empty cells, do nothing.
    if (!emptyCells.length) return null
    const randCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]!
    return createTile([randCell.x, randCell.y])
  }

  // Get cells ordered by the given direction.
  getCellsByDir(dir: DirType): CellType[][] {
    switch (dir) {
      case "Left":
        return this.cells
      case "Right":
        return this.cells.map((row) => [...row].reverse())
      case "Up":
        return Array.from({ length: this.size }, (_, x) =>
          Array.from({ length: this.size }, (_, y) => this.getCellAt(x, y)),
        )
      default:
        return Array.from({ length: this.size }, (_, x) =>
          Array.from({ length: this.size }, (_, y) =>
            this.getCellAt(x, this.size - 1 - y),
          ),
        )
    }
  }
}

export function createTile(
  [x, y]: [number, number],
  _value?: number,
  _id?: string,
) {
  return {
    id: _id ?? `tile-${x}-${y}-${Math.random().toString(36).substring(2, 15)}`,
    x,
    y,
    value: _value ?? (Math.random() < 0.9 ? 2 : 4),
  }
}

export function createRandTile(
  size: GameSizeType,
  existingTiles: TileType[] = [],
) {
  const x = Math.floor(Math.random() * +size)
  const y = Math.floor(Math.random() * +size)
  if (existingTiles.some((t) => t.x === x && t.y === y))
    return createRandTile(size, existingTiles)
  const val = Math.random() < 0.9 ? 2 : 4
  // return `X${x}Y${y}V${val}` as RandTile
  return createTile([x, y], val)
}
