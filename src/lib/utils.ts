export const isBrowser = typeof window !== "undefined"
export const isServer = !isBrowser

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function captilize(str: string) {
  if (!str) return ""
  return str
    .split(" ")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ")
}

export function parseNumber(val: any) {
  if (typeof val === "number") return val
  const num = +val
  if (Number.isNaN(num)) return null
  return num
}

export const range = (n: number) => Array.from({ length: n }, (_v, i) => i)
