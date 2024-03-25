import type { APIRoute } from 'astro'
import { AppConfig } from '~/app'

export const GET: APIRoute = async () => {
  return new Response(
    `
	User-agent: *
	Allow: /
	Sitemap: ${AppConfig.site}/sitemap.xml
	`,
    {
      headers: {
        'content-type': 'text/plain',
        'Cache-Control': 'public, max-age=604800', // 1 week cache
      },
    },
  )
}
