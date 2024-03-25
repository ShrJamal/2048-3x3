import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  return new Response(
    `
	User-agent: *
	Allow: /
	`,
    {
      headers: {
        'content-type': 'text/plain',
        'Cache-Control': 'public, max-age=604800', // 1 week cache
      },
    },
  )
}
