<script lang="ts">
  import { onMount } from 'svelte'
  import GameManager from '~/models/GameManager'
  import InputHandler from './InputHandler.svelte'
  import Tile from './Tile.svelte'
  import GameScore from './GameScore.svelte'
  import GameOver from './GameOver.svelte'

  const game = new GameManager()
  const tiles = game.tiles

  onMount(() => {
    game.initGame()
  })
</script>

<InputHandler {game}>
  <section class="my-4 w-full flex flex-col gap-2 items-center">
    <!-- Above Game section -->
    <article class="w-full justify-between flex gap-1">
      <button
        class="btn btn-accent px-3 rounded text-white hover:text-base-100 max-w-[10rem]"
        title="New Game"
        on:click={() => game.restartGame()}
      >
        <span class="icon-[lucide--rotate-ccw] text-2xl" />
        <span class="hidden md:inline">New Game</span>
      </button>
      <GameScore {game} />
    </article>

    <article
      id="game-board"
      class="w-full bg-grid-bg relative select-none"
      style="--gridSize: 3; "
    >
      <!-- Empty Cells -->
      {#each Array.from({ length: 9 }) as _, i (i)}
        <span class="cell bg-grid-cell" />
      {/each}
      <!-- Tiles -->
      {#each $tiles as tile (tile.id)}
        <Tile {tile} />
      {/each}
      <GameOver {game} />
    </article>
  </section>
</InputHandler>

<style>
  :global(#game-board) {
    --grid-padding: calc(var(--board-size) / var(--gridSize) / 10);
    --grid-gap: calc(var(--grid-padding) / 2);
    --cell-size: calc(
      (
          var(--board-size) - 2 * var(--grid-padding) - (var(--gridSize)) *
            var(--grid-gap)
        ) / var(--gridSize)
    );
    --cell-radius: calc(var(--cell-size) / 20);
    margin: auto 0;
    padding: var(--grid-padding);
    min-height: var(--board-size);
    font-size: calc(var(--cell-size) / 8 * 3);
    border-radius: var(--cell-radius);
    display: grid;
    grid-template-rows: repeat(var(--gridSize), var(--cell-size));
    grid-template-columns: repeat(var(--gridSize), var(--cell-size));
    gap: var(--grid-gap);
  }

  :global(.cell) {
    width: var(--cell-size);
    height: var(--cell-size);
    border-radius: var(--cell-radius);
  }
</style>
