export function invariant(
  condition: any,
  message: string | (() => string) = 'Invariant failed',
): asserts condition {
  if (condition) return
  if (import.meta.env.PROD) throw new Error('Invariant failed')
  throw new Error(typeof message === 'function' ? message() : message)
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const range = (n: number) => Array.from({ length: n }, (_v, i) => i)

export const NUMBER_FORMATTER = new Intl.NumberFormat(undefined)
export const TIME_FORMATTER = new Intl.NumberFormat(undefined, {
  minimumIntegerDigits: 2,
})
