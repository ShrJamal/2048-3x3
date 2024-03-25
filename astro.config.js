import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'
import tailwind from '@astrojs/tailwind'
import metaTags from 'astro-meta-tags'
import svelte, { vitePreprocess } from '@astrojs/svelte'

const env = loadEnv(process.env.NODE_ENV, process.cwd(), '')

// https://astro.build/config
export default defineConfig({
  site: env.SITE,
  integrations: [
    tailwind(),
    metaTags(),
    svelte({
      configFile: false,
      preprocess: [vitePreprocess()],
    }),
  ],
})
