import solidJs from "@astrojs/solid-js"
import tailwind from "@astrojs/tailwind"
import { defineConfig } from "astro/config"
import { loadEnv } from "vite"

// @ts-ignore
const env = loadEnv(process.env.NODE_ENV, process.cwd(), "")
export default defineConfig({
  site: "https://shrjamal.github.io",
  base: env.NODE_ENV === "production" ? "2048-3x3" : "",
  trailingSlash: "never",
  integrations: [tailwind({ applyBaseStyles: false }), solidJs()],
})
