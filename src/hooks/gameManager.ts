import { createSignal } from "solid-js"
import { createStore, reconcile } from "solid-js/store"
import { Grid } from "~/lib/Grid"
import { DIRECTIONS, type DirType, type GameStatus } from "~/lib/consts"
import { checkForPossibleMoveInDir, slideTiles } from "~/lib/slideTiles"
import type { GameSizeType, GameType, TileType } from "~/lib/types"

export type GameManager = ReturnType<typeof createGameManager>

export function createGameManager(size: GameSizeType, initGame: GameType) {
  const grid = new Grid(size, initGame.tiles)
  const [tiles, setTiles] = createStore<TileType[]>(initGame.tiles)
  const [score, setScore] = createSignal(initGame.score)
  const [bestScore, setBestScore] = createSignal(initGame.bestScore)
  const [status, setStatus] = createSignal<GameStatus>(
    initGame.isOver ? "over" : "playing",
  )

  async function moveHandler(
    dir: DirType,
    newTile?: TileType | null,
  ): Promise<{ newTile: TileType | null; hasMoved: boolean }> {
    const { addedScore, hasMoved } = await slideTiles(grid, dir)
    if (!hasMoved) return { newTile: null, hasMoved: false }

    // If the new tile is not provided, add a new random tile.
    if (typeof newTile === "undefined") newTile = grid.getRandTile()
    grid.addTile(newTile)
    setTiles(reconcile(grid.tiles.map((t) => ({ ...t }))))

    // Update Score
    if (addedScore > 0) {
      setScore((pre) => {
        const score = pre + addedScore
        if (score > bestScore()) setBestScore(score)
        return score
      })
    }
    // Check if the game is over.
    if (isGameOver()) setStatus("over")

    return { newTile, hasMoved }
  }

  function isGameOver() {
    return DIRECTIONS.every((dir) => !checkForPossibleMoveInDir(grid, dir))
  }

  return {
    get size() {
      return size
    },
    get grid() {
      return grid
    },
    score,
    bestScore,
    status,
    tiles,
    moveHandler,
    get game() {
      return {
        size: size,
        score: score(),
        bestScore: bestScore(),
        tiles,
      } as GameType
    },
  }
}
