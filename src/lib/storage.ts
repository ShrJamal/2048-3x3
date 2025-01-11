import { createRandTile } from "./Grid"
import { GameSchema, type GameSizeType, type GameType } from "./types"
import { parseNumber } from "./utils"

const GAME_ITEM_KEY = (size: GameSizeType) => `GAME-${size}x${size}`
const GAME_BESTSCORE_KEY = (size: GameSizeType) => `BEST_SCORE-${size}x${size}`

export function getLocalSavedGame(size: GameSizeType): GameType {
  try {
    const localGame = localStorage.getItem(GAME_ITEM_KEY(size))
    return GameSchema.parse(JSON.parse(localGame ?? ""))
  } catch (_e) {
    return createNewLocalGame(size)
  }
}

export function saveGameLocally(game: GameType) {
  game.topTile = game.tiles.map((t) => t.value).reduce((a, b) => Math.max(a, b))
  // Save game
  localStorage.setItem(GAME_ITEM_KEY(game.size), JSON.stringify(game))
  // Save best score
  localStorage.setItem(GAME_BESTSCORE_KEY(game.size), game.bestScore.toString())
}

export function createNewLocalGame(size: GameSizeType): GameType {
  const rand1 = createRandTile(size)
  const game: GameType = {
    id: Date.now().toString(),
    size: size,
    topTile: 2,
    score: 0,
    bestScore: parseNumber(localStorage.getItem(GAME_BESTSCORE_KEY(size))) ?? 0,
    movesCount: 0,
    tiles: [rand1, createRandTile(size, [rand1])],
  }
  localStorage.setItem(GAME_ITEM_KEY(size), JSON.stringify(game))
  return game
}

export function removeLocalGameData(size: GameSizeType) {
  localStorage.removeItem(GAME_ITEM_KEY(size))
}
