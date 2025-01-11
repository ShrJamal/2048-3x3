import z from "zod"

export type GameSizeType = "3" | "4" | "5" | "6"

export const TileSchema = z.object({
  id: z.string(),
  x: z.number().int().min(0).max(5),
  y: z.number().int().min(0).max(5),
  value: z.number().int().min(2),
})
export type TileType = z.infer<typeof TileSchema>

export const GameSchema = z.object({
  id: z.string(),
  size: z.enum(["3", "4", "5", "6"]),
  topTile: z.number().int().min(2),
  score: z.number().int().min(0),
  bestScore: z.number().int().min(0),
  tiles: TileSchema.array(),
  movesCount: z.number().int().min(0),
  theme: z.string().nullish(),
  isLive: z.boolean().nullish(),
  isOver: z.boolean().nullish(),
})
export type GameType = z.infer<typeof GameSchema>
export type GameWithUser = GameType & {
  user: {
    username: string
    avatar: string
  }
}
