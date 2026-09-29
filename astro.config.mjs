import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'
import { eventProvider, getSlugVariants } from './src/lib/events'

const envSiteUrl = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'SITE_URL').SITE_URL
const siteUrl = process.env.SITE_URL || envSiteUrl || 'https://regio.hnld.de'

// Precompute canonical event slugs once at config load so the sitemap
// filter can stay synchronous (the integration rejects async filters).
const events = await eventProvider.getEvents()
const canonicalEventSlugs = new Set(
  events.flatMap((event) => {
    const variants = getSlugVariants(event.slug, event.title, event.start.getFullYear())
    return variants.includes(event.slug) ? [event.slug] : []
  }),
)

export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        const url = new URL(page)

        // Internal team tool pages (/toolbox/*) are noindex and excluded
        if (url.pathname.startsWith('/toolbox')) return false

        // Event slug variants exist so legacy WordPress URLs keep
        // working, but only the canonical slug belongs in the sitemap.
        const segments = url.pathname.split('/').filter(Boolean)
        if (segments[0] === 'abenteuer' && segments.length === 2) {
          return canonicalEventSlugs.has(segments[1] ?? '')
        }

        return true
      },
    }),
  ],
  redirects: {
    // New site structure
    '/zeltlager': '/abenteuer/zeltlager/',
    '/zeltlager-2026': '/abenteuer/zeltlager-2026/',
    '/zeltlager-2027': '/abenteuer/zeltlager-2027/',
    '/abenteuer/zeltlager/2026': '/abenteuer/zeltlager-2026/',
    '/abenteuer/zeltlager/2027': '/abenteuer/zeltlager-2027/',

    // Legacy WordPress aliases — verify against the real old URL
    // structure before relying on these in production.
    '/wordpress': '/',
    '/veranstaltungen': '/abenteuer/',
    '/vereinsberichte': '/aktuelles/',
    '/category/vereinsberichte': '/aktuelles/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
