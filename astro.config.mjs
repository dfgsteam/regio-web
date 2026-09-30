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

import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

function devPhpProxyPlugin() {
  return {
    name: 'dev-php-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next()
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:4321'}`)
        if (urlObj.pathname === '/toolbox-auth/civicrm-api.php') {
          if (!fs.existsSync(path.resolve(process.cwd(), 'private/config.php'))) {
            res.statusCode = 503
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify({
              success: false,
              message: 'Live-CiviCRM-Daten benötigen lokal eine PHP-Konfiguration und eine gültige Toolbox-Anmeldung.',
            }))
            return
          }
          const chunks = []
          req.on('data', (chunk) => chunks.push(chunk))
          req.on('end', () => {
            const bodyBuffer = Buffer.concat(chunks)
            const scriptPath = path.resolve(process.cwd(), 'public/toolbox-auth/civicrm-api.php')

            const phpBin = fs.existsSync('/opt/homebrew/bin/php-cgi')
              ? '/opt/homebrew/bin/php-cgi'
              : fs.existsSync('/usr/local/bin/php-cgi')
              ? '/usr/local/bin/php-cgi'
              : 'php-cgi'

            const child = spawn(phpBin, [], {
              env: {
                ...process.env,
                REQUEST_METHOD: req.method || 'GET',
                QUERY_STRING: urlObj.search.replace(/^\?/, ''),
                SCRIPT_FILENAME: scriptPath,
                CONTENT_TYPE: req.headers['content-type'] || '',
                CONTENT_LENGTH: String(bodyBuffer.length),
                HTTP_HOST: req.headers.host || 'localhost:4321',
                HTTP_COOKIE: req.headers.cookie || '',
                REDIRECT_STATUS: '200',
              },
            })

            const outChunks = []
            child.stdout.on('data', (c) => outChunks.push(c))
            child.stderr.on('data', (e) => console.error('[dev-php-cgi error]', e.toString()))

            child.on('close', () => {
              const full = Buffer.concat(outChunks)
              const sepIdx = full.indexOf('\r\n\r\n')
              if (sepIdx !== -1) {
                const headerStr = full.slice(0, sepIdx).toString('utf-8')
                const body = full.slice(sepIdx + 4)
                for (const line of headerStr.split('\r\n')) {
                  const colonIdx = line.indexOf(':')
                  if (colonIdx !== -1) {
                    const name = line.slice(0, colonIdx).trim()
                    const val = line.slice(colonIdx + 1).trim()
                    if (name.toLowerCase() === 'status') {
                      const code = parseInt(val, 10)
                      if (!isNaN(code)) res.statusCode = code
                    } else {
                      res.setHeader(name, val)
                    }
                  }
                }
                res.end(body)
              } else {
                res.statusCode = 502
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: false, message: 'Die lokale PHP-Bridge hat keine gültige Antwort geliefert.' }))
              }
            })

            child.on('error', (err) => {
              console.error('[dev-php-cgi spawn error]', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ success: false, message: 'php-cgi execution error: ' + err.message }))
            })

            if (bodyBuffer.length > 0) {
              child.stdin.write(bodyBuffer)
            }
            child.stdin.end()
          })
          return
        }
        next()
      })
    },
  }
}

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
    plugins: [tailwindcss(), devPhpProxyPlugin()],
  },
})
