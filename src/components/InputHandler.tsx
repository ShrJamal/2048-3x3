import type { ComponentProps } from "solid-js"
import { onCleanup, onMount } from "solid-js"
import { type DirType, GAME_KEYS, type GameKey } from "~/lib/consts"

const THRESHOLD_DISTANCE = 60

type Props = ComponentProps<"div"> & {
  onMove: (dir: DirType) => void
}

export default function InputHandler({ onMove, ...props }: Props) {
  // Record touch/mouse start position
  let moveStart = { x: 0, y: 0 }
  let ref: HTMLElement | null = null
  onMount(() => {
    document.addEventListener("keydown", handleKeydown)
    ref?.addEventListener("touchstart", handleTouchStart, { passive: false })
    ref?.addEventListener("touchend", handleTouchEnd, { passive: false })
  })
  onCleanup(() => {
    if (typeof window === "undefined") return
    document.removeEventListener("keydown", handleKeydown)
    ref?.removeEventListener("touchstart", handleTouchStart)
    ref?.removeEventListener("touchend", handleTouchEnd)
  })

  async function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
    const dir = GAME_KEYS[e.code as GameKey]
    if (!dir) return
    e.preventDefault()
    onMove(dir)
  }

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault()
    // Ignore multi-touch
    if (e.touches.length > 1) return
    const touchData = e.touches[0]
    if (!touchData) return
    moveStart = {
      x: touchData.pageX,
      y: touchData.pageY,
    }
  }
  function handleTouchEnd(e: TouchEvent) {
    e.preventDefault()
    const endTouchData = e.changedTouches[0]
    if (!endTouchData) return
    const dir = getDirFromMoveOffset([
      endTouchData.pageX - moveStart.x,
      endTouchData.pageY - moveStart.y,
    ])
    if (!dir) return
    onMove(dir)
  }

  function getDirFromMoveOffset([dx, dy]: [number, number]) {
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (Math.max(absDx, absDy) < THRESHOLD_DISTANCE) return null
    if (absDx >= absDy) {
      return dx > 0 ? "Right" : "Left"
    }
    return dy > 0 ? "Down" : "Up"
  }

  return (
    <div
      {...props}
      ref={(r) => {
        ref = r
      }}
      ontouchmove={(e) => e.preventDefault()}
      onmousedown={(e) => {
        moveStart = {
          x: e.pageX,
          y: e.pageY,
        }
      }}
      onmouseup={(e) => {
        e.preventDefault()
        const dir = getDirFromMoveOffset([
          e.pageX - moveStart.x,
          e.pageY - moveStart.y,
        ])
        if (!dir) return
        onMove(dir)
      }}
    />
  )
}
