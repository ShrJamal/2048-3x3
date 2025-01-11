import { type Accessor, createEffect, createSignal } from "solid-js"

/**
 * A hook that calculates the difference between the current and previous values.
 * @param value An accessor function that returns the current number value.
 * @returns An object containing the calculated difference and a setter function.
 */
export function useValueDifference(
  value: Accessor<number>,
  initValue?: number,
) {
  const [diff, setDiff] = createSignal(0)
  let prevValue = initValue ?? value()

  createEffect(() => {
    const currentValue = value()
    if (currentValue !== prevValue) {
      setDiff(currentValue - prevValue)
    }
    prevValue = currentValue
  })

  return [diff, setDiff] as const
}
