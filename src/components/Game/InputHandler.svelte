<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { GAME_KEYS, type GameKey, DirType } from '~/lib/types'
  import type GameManager from '~/models/GameManager'

  export let game: GameManager

  const THRESHOLD_DISTANCE = 60

  // Record touch/mouse start position
  let moveStart = { x: 0, y: 0 }

  onMount(() => {
    if (typeof window === 'undefined') return
    document.addEventListener('keydown', handleKeydown)
  })
  onDestroy(() => {
    if (typeof window === 'undefined') return
    document.removeEventListener('keydown', handleKeydown)
  })

  async function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
    const dir = GAME_KEYS[e.code as GameKey]
    if (!dir) return
    e.preventDefault()
    await game.moveHandler(dir)
  }

  function getDirFromMove(dx: number, dy: number) {
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (Math.max(absDx, absDy) < THRESHOLD_DISTANCE) return null
    if (absDx >= absDy) {
      return dx > 0 ? DirType.Right : DirType.Left
    } else {
      return dy > 0 ? DirType.Down : DirType.Up
    }
  }
</script>

<button
  on:touchstart|passive={(e) => {
    e.preventDefault()
    // Ignore multi-touch
    if (e.touches.length > 1) return
    const touchData = e.touches[0]
    if (!touchData) return
    moveStart = {
      x: touchData.pageX,
      y: touchData.pageY,
    }
  }}
  on:touchend|passive={(e) => {
    e.preventDefault()
    const endTouchData = e.changedTouches[0]
    if (!endTouchData) return
    const dir = getDirFromMove(
      endTouchData.pageX - moveStart.x,
      endTouchData.pageY - moveStart.y,
    )
    if (!dir) return
    game.moveHandler(dir)
  }}
  on:touchmove|preventDefault
  on:mousedown|preventDefault={(e) => {
    moveStart = {
      x: e.pageX,
      y: e.pageY,
    }
  }}
  on:mouseup|preventDefault={(e) => {
    const dir = getDirFromMove(e.pageX - moveStart.x, e.pageY - moveStart.y)
    if (!dir) return
    game.moveHandler(dir)
  }}
>
  <slot />
</button>
