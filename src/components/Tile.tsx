import { createEffect, createSignal } from "solid-js"
import { COLORS, CSS_POS_CALC } from "~/lib/consts"
import type { TileType } from "~/lib/types"

interface Props {
  tile: TileType
  theme?: string
}

export default function TileComponent({ tile }: Props) {
  const [popAnimation, setPopAnimation] = createSignal("")

  createEffect(() => {
    tile.value
    setPopAnimation("pop")
  })

  return (
    <div
      class="tile absolute font-bold"
      id={tile.id}
      style={{
        left: CSS_POS_CALC(tile.x),
        top: CSS_POS_CALC(tile.y),
        "background-color": COLORS.get(tile.value)?.bg,
        animation: popAnimation() ? "pop 200ms ease-in-out" : "none",
      }}
      onAnimationEnd={() => setPopAnimation("")}
    >
      <span
        style={{
          color: COLORS.get(tile.value)?.fg ?? "",
        }}
      >
        {tile.value}
      </span>
    </div>
  )
}
