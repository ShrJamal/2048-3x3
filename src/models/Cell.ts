import Tile from './Tile'

/**
 * Represents a cell in the game grid.
 */
export default class Cell {
  private _x: number
  private _y: number
  private _tile: Tile | null = null
  private _mergedTile: Tile | null = null

  /**
   * Constructs a cell with specified coordinates.
   * @param x - The x-coordinate of the cell.
   * @param y - The y-coordinate of the cell.
   */
  constructor(x: number, y: number) {
    this._x = x
    this._y = y
  }

  /** Gets the x-coordinate of the cell. */
  get x(): number {
    return this._x
  }

  /** Gets the y-coordinate of the cell. */
  get y(): number {
    return this._y
  }

  /** Gets the tile currently in the cell. */
  get tile(): Tile | null {
    return this._tile
  }

  /**
   * Sets the tile in the cell and updates the tile's position.
   * @param tile - The tile to be placed in the cell.
   */
  async setTile(tile: Tile | null) {
    this._tile = tile
    await tile?.moveTo([this._x, this._y])
  }

  /**
   * Sets the merging tile and updates its position.
   * @param tile - The tile that is merging with the cell's current tile.
   */
  async setMergedTile(tile: Tile | null) {
    this._mergedTile = tile
    if (!tile) return
    await tile.moveTo([this._x, this._y])
  }

  /**
   * Checks if a given tile can be accepted into the cell.
   * A cell can accept a tile if it's empty or if it can merge with the current tile.
   * @param tile - The tile to check.
   * @returns True if the cell can accept the tile, false otherwise.
   */
  canAccept(tile: Tile | null): boolean {
    if (!tile) return false
    return !this._tile || (!this._mergedTile && this._tile.value === tile.value)
  }

  /**
   * Merges the current tile and the merging tile.
   * @returns The new value of the merged tile, or 0 if no merge occurred.
   */
  async mergeTiles() {
    if (!this._tile || !this._mergedTile) return
    this.tile!.value *= 2
    // Remove the merging tile and reset the mergeTile property.
    this.setMergedTile(null)
    // Trigger a pop animation on the merged tile.
    await this.tile?.pop()
  }

  /**
   * Removes the current tile from the cell.
   */
  removeTile() {
    this._tile = null
  }

  setRandTile() {
    if (this._tile) {
      console.error('tile already exists')
      return
    }
    this._tile = new Tile([this._x, this._y])
  }
}
