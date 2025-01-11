import { For, onMount } from "solid-js"
import { createGameManager } from "~/hooks/gameManager.ts"
import type { DirType } from "~/lib/consts.ts"
import {
  getLocalSavedGame,
  removeLocalGameData,
  saveGameLocally,
} from "~/lib/storage.ts"
import type { GameSizeType } from "~/lib/types.ts"
import GameOver from "./GameOverMsg.tsx"
import GameScore from "./GameScore.tsx"
import InputHandler from "./InputHandler.tsx"
import TileComponent from "./Tile.tsx"

interface Props {
  size: GameSizeType
}

export default function GameBoard({ size }: Props) {
  const gm = createGameManager(size, getLocalSavedGame(size))

  onMount(() => {
    document.querySelector("#board-skeleton")?.remove()
  })
  let isMoving = false
  async function moveHandler(dir: DirType) {
    if (isMoving || gm.status() !== "playing") return
    isMoving = true
    try {
      await gm.moveHandler(dir)
      saveGameLocally(gm.game)
    } finally {
      isMoving = false
    }
  }

  return (
    <section class="flex flex-col items-center gap-2 justify-center">
      <div class="w-full flex justify-between">
        <a
          class="btn btn-outline border-neutral/30 gap-1 rounded px-3 "
          href={`https://2048.club/${size}x${size}`}
          title="New Game"
          onClick={(e) => {
            if (import.meta.env.DEV) e.preventDefault()
            removeLocalGameData(size)
          }}
        >
          <i class="icon-[lucide--plus] text-3xl" />
          <span class="hidden font-bold md:inline">New Game</span>
        </a>
        <GameScore
          score={gm.score}
          bestScore={gm.bestScore}
        />
      </div>

      <InputHandler
        class="game-board relative grid aspect-square w-full select-none rounded bg-grid-bg bg-opacity-70"
        onMove={moveHandler}
      >
        <For each={Array.from({ length: Number.parseInt(size) ** 2 })}>
          {() => <span class="cell bg-grid-cell bg-opacity-70" />}
        </For>

        <For each={gm.tiles}>{(tile) => <TileComponent tile={tile} />}</For>
        <GameOver
          status={gm.status}
          size={size}
        />
      </InputHandler>
    </section>
  )
}
