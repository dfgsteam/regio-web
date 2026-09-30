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
import { localToolboxRoot } from './scripts/local-toolbox-path.mjs'

function devPhpProxyPlugin() {
  const phpRoutes = new Set(['login.php', 'callback.php', 'logout.php', 'civicrm-api.php'])
  return {
    name: 'dev-php-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next()
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:4321'}`)
        const phpRoute = urlObj.pathname.startsWith('/toolbox-auth/')
          ? urlObj.pathname.slice('/toolbox-auth/'.length)
          : ''
        if (phpRoutes.has(phpRoute)) {
          const remoteAddress = req.socket.remoteAddress || ''
          if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress) ||
              !['localhost:4321', '127.0.0.1:4321'].includes(req.headers.host || '')) {
            res.statusCode = 403
            res.end('Local Toolbox access only')
            return
          }
          if (!fs.existsSync(path.join(localToolboxRoot, 'private/config.php'))) {
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
            const scriptPath = path.join(localToolboxRoot, 'public/toolbox-auth', phpRoute)

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
                SCRIPT_NAME: urlObj.pathname,
                REQUEST_URI: req.url,
                SERVER_PROTOCOL: 'HTTP/1.1',
                SERVER_NAME: 'localhost',
                SERVER_PORT: '4321',
                REMOTE_ADDR: remoteAddress,
                CONTENT_TYPE: req.headers['content-type'] || '',
                CONTENT_LENGTH: String(bodyBuffer.length),
                HTTP_HOST: req.headers.host || 'localhost:4321',
                HTTP_COOKIE: req.headers.cookie || '',
                HTTP_ORIGIN: req.headers.origin || '',
                REDIRECT_STATUS: '200',
              },
            })

            const outChunks = []
            let spawnFailed = false
            child.stdout.on('data', (c) => outChunks.push(c))
            child.stderr.on('data', (e) => console.error('[dev-php-cgi error]', e.toString()))

            child.on('close', () => {
              if (spawnFailed) return
              const full = Buffer.concat(outChunks)
              const headerEnd = full.toString('latin1').match(/\r?\n\r?\n/)
              const sepIdx = headerEnd?.index ?? -1
              if (sepIdx !== -1) {
                const headerStr = full.slice(0, sepIdx).toString('utf-8')
                const body = full.slice(sepIdx + headerEnd[0].length)
                const cookies = []
                for (const line of headerStr.split(/\r?\n/)) {
                  const colonIdx = line.indexOf(':')
                  if (colonIdx !== -1) {
                    const name = line.slice(0, colonIdx).trim()
                    const val = line.slice(colonIdx + 1).trim()
                    if (name.toLowerCase() === 'status') {
                      const code = parseInt(val, 10)
                      if (!isNaN(code)) res.statusCode = code
                    } else if (name.toLowerCase() === 'set-cookie') {
                      cookies.push(val)
                    } else {
                      res.setHeader(name, val)
                    }
                  }
                }
                if (cookies.length) res.setHeader('Set-Cookie', cookies)
                res.end(body)
              } else {
                res.statusCode = 502
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: false, message: 'Die lokale PHP-Bridge hat keine gültige Antwort geliefert.' }))
              }
            })

            child.on('error', (err) => {
              spawnFailed = true
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
