import { twMerge } from "tailwind-merge"

type ClassValue =
  | ClassArray
  | ClassDictionary
  | string
  | number
  | null
  | boolean
  | undefined
type ClassDictionary = Record<string, any>
type ClassArray = ClassValue[]

export default function clsx(...inputs: ClassValue[]) {
  let str = ""
  for (const inp of inputs) {
    if (!inp) continue
    const val = toVal(inp)
    if (!val) continue
    if (str) str += " "
    str += val
  }
  return twMerge(str)
}

function toVal(mix: ClassValue) {
  let str = ""
  if (mix && typeof mix === "object") {
    if (Array.isArray(mix)) {
      for (const m of mix) {
        if (!m) continue
        const val = toVal(m)
        if (str) str += " "
        str += val
      }
    } else {
      for (const k in mix) {
        if (!mix[k]) continue
        if (str) str += " "
        str += k
      }
    }
  } else if (typeof mix === "string" || typeof mix === "number") {
    if (str) str += " "
    str += mix
  }
  return str
}
