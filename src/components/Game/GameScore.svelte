<script setup lang="ts">
  import { scale } from 'svelte/transition'
  import { NUMBER_FORMATTER } from '~/lib/utils'
  import GameManager from '~/models/GameManager'

  export let game: GameManager
  const gameState = game.state

  let prevScore = 0
  let scoreDiff = 0
  $: {
    const score = $gameState.score
    if (prevScore !== 0 && score > prevScore) {
      scoreDiff = score - prevScore
    }
    prevScore = score
  }
</script>

<div class="flex gap-2">
  <div class="score-container">
    <span>SCORE</span>
    <div class="relative">
      {#key $gameState.score}
        <!-- content here -->
        <div in:scale={{ duration: 100, opacity: 0.5 }}>
          {NUMBER_FORMATTER.format($gameState.score)}
        </div>
      {/key}

      {#if scoreDiff !== 0}
        {@const rand = Math.random()}
        <span
          class="additional-score absolute text-grid-bg text-2xl left-1/2 bottom-1/2"
          on:animationend={() => (scoreDiff = 0)}
          style="
            --end-x: {50 + (rand < 0.5 ? 1 : -1) * 50 * (rand + 1)}%;
            --end-y: {300 + rand * 50}%;
          "
        >
          +{scoreDiff}
        </span>
      {/if}
    </div>
  </div>
  <!-- Best Score -->
  <div class="score-container">
    <span class="">BEST</span>
    <span>{$gameState.bestScore}</span>
  </div>
</div>

<style>
  .score-container {
    @apply w-16 px-2 py-1 bg-[#454545] rounded text-white text-sm font-bold text-center;
    @apply flex flex-col;
  }

  .additional-score {
    animation: additionalScoreFade 500ms ease-in-out;
  }

  @keyframes additionalScoreFade {
    100% {
      opacity: 0.2;
      scale: 0.8;
      left: var(--end-x);
      bottom: var(--end-y);
    }
  }
</style>
