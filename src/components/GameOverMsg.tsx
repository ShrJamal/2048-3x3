import { type Accessor, Show } from "solid-js"
import clsx from "~/lib/clsx"
import { removeLocalGameData } from "~/lib/storage"
import type { GameSizeType } from "~/lib/types"

interface Props {
  status: Accessor<string>
  size: GameSizeType
}
export default function GameOver({ status, size }: Props) {
  return (
    <Show when={status() !== "playing"}>
      <div
        id="game-message"
        class={clsx(
          "bg-base-300",
          "absolute inset-0 z-10 rounded bg-opacity-80 ",
          "flex flex-col items-center justify-center gap-4",
          "fade-in-50 animate-in duration-1000",
        )}
      >
        <p class="text-6xl">Game Over</p>
        <a
          href={`https://2048.club/${size}x${size}`}
          class="btn btn-primary btn-lg rounded"
          title="Play 2048 3x3 Game"
          onClick={(e) => {
            if (import.meta.env.DEV) e.preventDefault()
            removeLocalGameData(size)
          }}
        >
          Play Again
        </a>
      </div>
    </Show>
  )
}
