import { get, writable } from 'svelte/store'
import Grid from './Grid'
import type { DirType } from '~/lib/types'
import type Tile from './Tile'

export type GameStatus = 'playing' | 'over' | 'won'

export default class GameManager {
  grid: Grid
  tiles = writable<Tile[]>([])
  state = writable({
    score: 0,
    bestScore: 0,
    status: 'playing',
  })

  constructor() {
    this.grid = new Grid()
  }

  initGame() {
    try {
      const savedState = JSON.parse(localStorage.getItem('gameState') ?? '{}')
      this.state.update((s) => ({
        ...s,
        bestScore: savedState.bestScore ?? 0,
        score: savedState.score ?? 0,
      }))

      if (savedState?.grid?.cells?.length) {
        this.grid = Grid.fromJSON(savedState.grid)
      } else {
        this.grid.initializeGrid()
      }
      this.updateTiles()
    } catch (e) {
      console.error(e)
      this.grid.initializeGrid()
    }
  }

  updateTiles() {
    this.tiles.update(() => [
      ...this.grid.cells.filter((c) => c.tile).map((c) => c.tile!),
    ])
  }
  restartGame() {
    this.grid.reset()
    localStorage.setItem(
      'gameState',
      JSON.stringify({
        bestScore: get(this.state).bestScore,
      }),
    )
    this.state.update((s) => ({
      ...s,
      status: 'playing',
      score: 0,
    }))
    this.initGame()
  }

  async moveHandler(dir: DirType) {
    if (get(this.state).status !== 'playing') return
    if (!this.grid.checkIfCanMoveTiles(dir)) return
    const addedScore = await this.grid.moveTiles(dir)
    this.updateTiles()

    this.state.update((s) => {
      const score = s.score + addedScore
      const bestScore = Math.max(s.bestScore, s.score + addedScore)

      localStorage.setItem(
        'gameState',
        JSON.stringify({
          grid: this.grid.toJSON(),
          score,
          bestScore,
        }),
      )
      return {
        ...s,
        status: this.grid.checkIfLost() ? 'over' : 'playing',
        score,
        bestScore,
      }
    })
  }
}
