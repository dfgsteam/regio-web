import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import node from '@astrojs/node'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

const siteUrl = process.env.SITE_URL || 'https://regio.hnld.de'

export default defineConfig({
  site: siteUrl,
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), sitemap()],
  redirects: {
    '/zeltlager': '/abenteuer/zeltlager/',
    '/zeltlager-2026': '/abenteuer/zeltlager-2026/',
    '/zeltlager-2027': '/abenteuer/zeltlager-2027/',
    '/abenteuer/zeltlager/2026': '/abenteuer/zeltlager-2026/',
    '/abenteuer/zeltlager/2027': '/abenteuer/zeltlager-2027/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
