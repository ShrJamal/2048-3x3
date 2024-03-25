import { DirType } from '~/lib/types'
import Cell from './Cell'
import Tile from './Tile'
import { range } from '~/lib/utils'
import { writable } from 'svelte/store'

/**
 * Represents the grid in a tile-based game like 2048.
 */
export default class Grid {
  // Array to store cells of the grid
  private _cells: Cell[] = []
  tiles = writable<Tile[]>([])
  /**
   * Constructs a grid with a specified size.
   * Initializes the grid and adds two random tiles.
   * @param size - The size of the grid (number of cells in one row or column).
   */
  constructor(cells?: Cell[]) {
    if (cells) {
      this._cells = cells
    }
  }

  /**
   * Initializes the grid by creating and placing cells in each position.
   * @returns An array of Cell objects representing the grid.
   */
  initializeGrid() {
    // Create cells for ach position in the grid
    this._cells = Array.from({ length: 9 }, (_, idx) => {
      // Calculate x and y coordinates for each cell
      return new Cell(idx % 3, Math.floor(idx / 3))
    })
    // Add two random tiles to start the game
    this.addRandTile()
    this.addRandTile()
  }

  /**
   * Getter for accessing the cells of the grid.
   */
  get cells(): Cell[] {
    return this._cells
  }

  /**
   * Check if tiles can be moved in a specified direction.
   */
  checkIfCanMoveTiles(dir: DirType): boolean {
    const cells = this.getCellsInDirection(dir)
    return cells.some((line) => {
      return line.some((cell, idx) => {
        if (!idx || !cell?.tile) return false
        const moveToCell = line[idx - 1]
        return moveToCell?.canAccept(cell.tile)
      })
    })
  }

  /**
   * Moves and merges tiles on the board in a specified direction.
   *
   * @param dir The direction in which to move the tiles.
   * @returns The total score added from tile merges during this move.
   */
  async moveTiles(dir: DirType): Promise<number> {
    // Holds promises for tile transition animations.
    const animationPromises: Array<Promise<any>> = []

    // Tracks the additional score gained from merges in this move.
    let addedScore = 0

    // Iterate through each line of cells in the given direction.
    for (const line of this.getCellsInDirection(dir)) {
      // Process each cell in the current line for potential moves or merges.
      line.forEach((cell, i) => {
        // Skip processing if the cell is the first in the line or has no tile.
        if (i === 0 || !cell?.tile) return

        // Find the furthest cell the current tile can move to.
        let moveToCell
        for (let j = i - 1; j >= 0; j--) {
          const c = line[j]
          // Stop if the tile cannot be moved or merged into cell `c`.
          if (!c?.canAccept(cell.tile)) break
          moveToCell = c
        }

        // Skip if there's no valid cell to move the tile into.
        if (!moveToCell) return

        // Move or merge the tile and collect the animation promise.
        if (moveToCell.tile) {
          // Merge tiles and accumulate added score from the merge.
          animationPromises.push(moveToCell.setMergedTile(cell.tile))
          addedScore += cell.tile.value * 2
        } else {
          // Move the tile to the empty cell.
          animationPromises.push(moveToCell.setTile(cell.tile))
        }

        // Clear the original cell's tile.
        cell.setTile(null)
      })
    }

    // Wait for all tile animations to complete.
    await Promise.all(animationPromises)

    // Finalize merges and clear merged tiles.
    this.cells.forEach((cell) => cell.mergeTiles())

    // Add a new random tile to the board.
    this.addRandTile()

    // Return the score gained from this move.
    return addedScore
  }

  /**
   * Retrieves the cells in the grid based on the specified direction.
   * This method is used to determine the order of cells for the movement logic.
   * @param dir - The direction of movement.
   * @returns A 2D array of cells organized based on the movement direction.
   */
  private getCellsInDirection(dir: DirType): Cell[][] {
    switch (dir) {
      case 'Left':
        return range(3).map((y) =>
          range(3).map((x) => this.cells.find((c) => c.x === x && c.y === y)!),
        )
      case 'Right':
        return range(3).map((y) =>
          range(3)
            .map((x) => this.cells.find((c) => c.x === x && c.y === y)!)
            .reverse(),
        )
      case 'Up':
        return range(3).map((x) =>
          range(3).map((y) => this.cells.find((c) => c.x === x && c.y === y)!),
        )
      default:
        return range(3).map((x) =>
          range(3)
            .map((y) => this.cells.find((c) => c.x === x && c.y === y)!)
            .reverse(),
        )
    }
  }

  /**
   * Adds a random tile to an empty cell in the grid.
   * This method is used to introduce new tiles into the game.
   */
  addRandTile(): void {
    // Filter out cells that already have a tile
    const emptyCells = this.cells.filter((cell) => !cell.tile)
    // If there are no empty cells, log an error and return
    if (!emptyCells.length) {
      console.error('No empty cells or count < 1')
      return
    }
    // Select a random empty cell
    const randIdx = Math.floor(Math.random() * emptyCells.length)
    emptyCells[randIdx]!.setRandTile()
  }

  checkIfWon(): boolean {
    return this.cells.some((cell) => cell.tile?.value === 2048)
  }
  checkIfLost(): boolean {
    return Object.values(DirType).every((dir) => !this.checkIfCanMoveTiles(dir))
  }

  reset() {
    this.cells.forEach((cell) => cell.setTile(null))
  }

  toJSON() {
    return {
      size: 3,
      cells: this._cells.map((c) => ({
        x: c.x,
        y: c.y,
        tile: c.tile?.toJSON(),
      })),
    }
  }

  static fromJSON(data: any) {
    const grid = new Grid(
      data.cells.map((c: any) => {
        const cell = new Cell(c.x, c.y)
        if (c.tile) {
          const { x, y, value } = c.tile
          cell.setTile(new Tile([x, y], value))
        }
        return cell
      }),
    )
    return grid
  }
}
