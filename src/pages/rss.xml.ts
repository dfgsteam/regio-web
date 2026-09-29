import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

export const prerender = true

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    }
    return entities[character] ?? character
  })
}

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('SITE_URL is required for rss.xml')

  const posts = await getCollection('posts', ({ data }) =>
    !data.draft && !data.disabled && data.active !== false,
  )
  const latestPosts = posts
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
    .slice(0, 20)

  const feedUrl = new URL('/rss.xml', site).toString()
  const journalUrl = new URL('/aktuelles/', site).toString()
  const items = latestPosts.map((post) => {
    const postUrl = new URL(`/aktuelles/${post.id}/`, site).toString()
    return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <pubDate>${post.data.publishedAt.toUTCString()}</pubDate>
      <description>${escapeXml(post.data.description)}</description>
    </item>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Aktuelles – SMJ Regio Wegweiser</title>
    <link>${escapeXml(journalUrl)}</link>
    <description>Berichte, Geschichten und Neuigkeiten der SMJ Regio Wegweiser.</description>
    <language>de-DE</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
