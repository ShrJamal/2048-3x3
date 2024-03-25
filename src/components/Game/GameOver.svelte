<script setup lang="ts">
  import { fade } from 'svelte/transition'
  import GameManager from '~/models/GameManager'

  export let game: GameManager
  const state = game.state
</script>

{#if $state.status !== 'playing'}
  <article
    id="game-message"
    class="absolute rounded-xl top-0 w-full h-full bg-grid-cell z-10 bg-opacity-70 flex flex-col gap-4 justify-center items-center"
    transition:fade
  >
    <p class="font-bold text-6xl text-black">Game Over</p>
    <div class="lower">
      <!-- <a class="keep-playing-button">Keep going</a> -->
      <button
        class="btn btn-lg btn-accent text-white hover:text-base-100"
        on:click={() => {
          game.restartGame()
          window.location.reload()
        }}
      >
        Try again
      </button>
    </div>
  </article>
{/if}
