import type { CellType, Grid } from "./Grid"
import { CSS_POS_CALC, type DirType } from "./consts"
import type { TileType } from "./types"

/** Slide tiles in the given direction.
 * @param grid The grid to slide tiles on.
 * @param dir The direction to slide the tiles.
 * @return The total score added from merging tiles and whether any tiles were moved.
 */
export async function slideTiles(
  grid: Grid,
  dir: DirType,
  shouldAnimate = true,
) {
  let addedScore = 0
  // Holds promises for tile transition animations.
  const animationPromises: Array<Promise<any>> = []
  const afterAnimationFn: Array<() => void> = []
  // Iterate through each line of cells in the given direction.
  const cellsByline = grid.getCellsByDir(dir)
  for (const line of cellsByline) {
    // Process each cell in the current line for potential moves or merges.
    line.forEach((currentCell, i) => {
      // Skip the first line's cell as it's the cell we're moving from.
      // Or if the cell is empty, (no tile to move).
      if (i === 0 || !currentCell?.tile) return
      const currentTile = currentCell.tile
      // Find the furthest cell the current tile can move to.
      const dstCell = findDestinationCell(line, i, currentTile)
      // Skip if there's no valid cell to move the tile into.
      if (!dstCell) return
      // Remove the tile from the source cell, as it's will move or merge.
      currentCell.tile = null
      animationPromises.push(
        moveTileWithAnimation(currentTile, [dstCell.x, dstCell.y]),
      )
      // After the animation, update the tile's position.
      afterAnimationFn.push(() => {
        Object.assign(currentTile, { x: dstCell.x, y: dstCell.y })
      })
      // Check if the cell to move into already has a tile. If so, merge the tiles.
      if (dstCell.tile) {
        const dstTile = dstCell.tile
        dstCell.mergedTile = currentTile
        // After the animation, update the tile's value and remove the merged tile.
        afterAnimationFn.push(() => {
          dstCell.mergedTile = null
          dstTile.value *= 2
          addedScore += dstTile.value
        })
      } else {
        dstCell.tile = currentTile
      }
    })
  }
  // Wait for all tile animations to complete.
  if (shouldAnimate && animationPromises.length)
    await Promise.all(animationPromises)
  afterAnimationFn.forEach((fn) => fn())

  return { addedScore, hasMoved: animationPromises.length > 0 }
}

/**
 * Helper function to find the furthest cell a tile can move to.
 * @returns The cell to move the tile into, or null if there's no valid cell.
 */
function findDestinationCell(
  line: CellType[],
  startIndex: number,
  tile: TileType,
): CellType | null {
  let dstCell: CellType | null = null

  for (let j = startIndex - 1; j >= 0; j--) {
    const cell = line[j]!
    // Check if the provided tile can be moved into this cell. (means this cell is empty or can merge with the tile).
    // If so then move set dstCell to this cell, and continue the loop to find the furthest cell.
    if (!cell.tile || (!cell.mergedTile && cell.tile.value === tile.value)) {
      dstCell = cell
    }
    // else return the last valid cell found.
    else return dstCell
  }
  return dstCell
}

/**
 * Check if tiles can be moved in a specified direction.
 */
export function checkForPossibleMoveInDir(grid: Grid, dir: DirType) {
  for (const line of grid.getCellsByDir(dir)) {
    for (const [idx, currentCell] of line.entries()) {
      if (!idx || !currentCell?.tile) continue
      const dstCell = findDestinationCell(line, idx, currentCell.tile)
      // If there's a valid cell to move the tile into, means there's a possible move.
      if (dstCell) return true
    }
  }
  return false
}

/** Animate a tile to a new position. */
async function moveTileWithAnimation(
  tile: TileType,
  [newX, newY]: [number, number],
) {
  // @ts-ignore
  if (typeof window === "undefined") return
  // @ts-ignore
  const el = document.querySelector(`#${tile.id}`)
  if (!el) return
  await el.animate(
    {
      left: [CSS_POS_CALC(tile.x), CSS_POS_CALC(newX)],
      top: [CSS_POS_CALC(tile.y), CSS_POS_CALC(newY)],
    },
    {
      duration: 100,
      easing: "ease-in-out",
    },
  ).finished
}
