import type { Accessor } from "solid-js"
import { useValueDifference } from "~/hooks/useValueDiff"
import clsx from "~/lib/clsx"

const nbrFormat = new Intl.NumberFormat(undefined)

interface Props {
  score: Accessor<number>
  bestScore: Accessor<number>
}
const scoreBtnClass = clsx(
  "flex flex-col gap-1",
  "relative w-[5.2rem] h-[2.8rem]",
  "rounded bg-[#454545] font-bold text-sm",
  "items-center justify-center",
)
export default function GameScoreWithBestScore({ score, bestScore }: Props) {
  const [bestScoreDiff, setBestScoreDiff] = useValueDifference(bestScore)
  return (
    <div class="flex gap-1">
      <GameScore score={score} />
      <div class={scoreBtnClass}>
        <span class="text-xs">TOP SCORE</span>
        <div
          style={{
            animation: bestScoreDiff() !== 0 ? "pop 200ms ease-in-out" : "none",
          }}
          onanimationend={() => {
            setBestScoreDiff(0)
          }}
        >
          {nbrFormat.format(bestScore())}
        </div>
      </div>
    </div>
  )
}

export function GameScore({ score }: { score: Accessor<number> }) {
  const [scoreDiff, setScoreDiff] = useValueDifference(score)

  return (
    <div class={scoreBtnClass}>
      <span class="text-xs">SCORE</span>
      <div
        style={{
          animation: scoreDiff() !== 0 ? "pop 200ms ease-in-out" : "none",
        }}
      >
        {nbrFormat.format(score())}
      </div>

      <div
        class="absolute text-2xl"
        style={{
          opacity: scoreDiff() > 0 ? 1 : 0,
          animation: scoreDiff() > 0 ? "zoomAndFade 500ms ease-in-out" : "none",
        }}
        onanimationend={() => {
          setScoreDiff(0)
        }}
      >
        +{scoreDiff()}
      </div>
    </div>
  )
}
