<script lang="ts">
  import { scale } from 'svelte/transition'
  import Tile from '~/models/Tile'
  import { COLORS } from '~/lib/consts'

  export let tile: Tile

  const x = tile._x
  const y = tile._y
  const _value = tile._value
  const scaleVal = tile.scale

  $: value = $_value
</script>

<div
  class="cell tile absolute flex justify-center items-center font-bold"
  style="--x: {$x}; --y: {$y}; scale: {$scaleVal};"
  style:background-color={COLORS.get(value)?.bg ?? ''}
  in:scale={{ duration: 200, opacity: 0.5 }}
>
  <span style:color={COLORS.get(value)?.fg ?? ''}>{value}</span>
</div>

<style>
  .tile {
    top: calc(
      var(--grid-padding) + var(--y) * (var(--cell-size) + var(--grid-gap))
    );
    left: calc(
      var(--grid-padding) + var(--x) * (var(--cell-size) + var(--grid-gap))
    );
  }
</style>
