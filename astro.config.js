import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import metaTags from 'astro-meta-tags'
import svelte, { vitePreprocess } from '@astrojs/svelte'

// https://astro.build/config
export default defineConfig({
  site: 'https://shrjamal.github.io/2048-3x3',
  integrations: [
    tailwind(),
    metaTags(),
    svelte({
      configFile: false,
      preprocess: [vitePreprocess()],
    }),
  ],
})
