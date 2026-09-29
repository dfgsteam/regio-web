import type { APIRoute } from 'astro'

export const prerender = true

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('SITE_URL is required for robots.txt')

  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /toolbox/\n\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
