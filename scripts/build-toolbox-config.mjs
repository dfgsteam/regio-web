#!/usr/bin/env node

// Only the deploy job runs this after Astro has built dist/. Secrets stay in
// the PHP artifact and never enter Astro pages, client bundles or build logs.
import fs from 'node:fs'
import path from 'node:path'

const required = ['AUTHENTIK_CLIENT_ID', 'AUTHENTIK_CLIENT_SECRET', 'TOOLBOX_APP_SECRET', 'TOOLBOX_ALLOWED_GROUPS']
const missing = required.filter((name) => !process.env[name]?.trim())
if (missing.length) {
  throw new Error(`Toolbox-Deployment gestoppt: GitHub-Werte fehlen: ${missing.join(', ')}`)
}

const siteUrl = new URL(process.env.SITE_URL || 'https://smj-wegweiser.de')
if (siteUrl.protocol !== 'https:' || siteUrl.username || siteUrl.password || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
  throw new Error('SITE_URL muss eine HTTPS-Domain ohne Pfad oder Parameter sein.')
}

const authentikUrl = new URL(process.env.AUTHENTIK_URL || 'https://auth.smj-wegweiser.de')
if (authentikUrl.protocol !== 'https:' || authentikUrl.username || authentikUrl.password || authentikUrl.pathname !== '/' || authentikUrl.search || authentikUrl.hash) {
  throw new Error('AUTHENTIK_URL muss eine HTTPS-Domain ohne Pfad oder Parameter sein.')
}

const appSecret = process.env.TOOLBOX_APP_SECRET.trim()
if (Buffer.byteLength(appSecret, 'utf8') < 32) {
  throw new Error('TOOLBOX_APP_SECRET muss mindestens 32 Zeichen lang sein.')
}

const rawAllowedGroups = process.env.TOOLBOX_ALLOWED_GROUPS.trim()
if (rawAllowedGroups.startsWith('[') || rawAllowedGroups.endsWith(']')) {
  throw new Error('TOOLBOX_ALLOWED_GROUPS erwartet Gruppennamen ohne Klammern, z. B. Gruppenleiter. [] erlaubt niemanden.')
}
const allowedGroups = rawAllowedGroups.split(',').map((group) => group.trim()).filter(Boolean)
if (allowedGroups.length === 0) {
  throw new Error('TOOLBOX_ALLOWED_GROUPS muss mindestens einen Authentik-Gruppennamen enthalten.')
}

const settings = {
  AUTHENTIK_URL: authentikUrl.origin,
  AUTHENTIK_CLIENT_ID: process.env.AUTHENTIK_CLIENT_ID.trim(),
  AUTHENTIK_CLIENT_SECRET: process.env.AUTHENTIK_CLIENT_SECRET.trim(),
  TOOLBOX_APP_SECRET: appSecret,
  TOOLBOX_REDIRECT_URI: new URL('/toolbox-auth/callback.php', siteUrl).href,
  TOOLBOX_ALLOWED_GROUPS: allowedGroups.join(','),
}

const output = path.resolve(process.argv[2] || 'dist/toolbox-auth/generated-config.php')
if (!fs.existsSync(path.dirname(output))) {
  throw new Error('Astro-Build fehlt: dist/toolbox-auth/ wurde nicht gefunden.')
}

const encoded = Buffer.from(JSON.stringify(settings), 'utf8').toString('base64')
const php = `<?php
// Generated during deployment. Do not edit or commit this file.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'generated-config.php') {
    http_response_code(403);
    exit('Access Denied');
}
return json_decode(base64_decode('${encoded}'), true, 512, JSON_THROW_ON_ERROR);
`
fs.writeFileSync(output, php, { mode: 0o600 })
console.log('Toolbox-Konfiguration für den PHP-Server erstellt.')
