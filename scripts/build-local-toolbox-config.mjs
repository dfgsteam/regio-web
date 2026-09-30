#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { loadEnv } from 'vite'
import { localToolboxRoot } from './local-toolbox-path.mjs'

const root = path.resolve(import.meta.dirname, '..')
const env = loadEnv('development', root, '')
const required = ['CIVICRM_API_KEY']
const missing = required.filter((name) => !env[name]?.trim())
if (missing.length) {
  throw new Error(`Für die lokale Toolbox fehlen in .env: ${missing.join(', ')}`)
}

const groups = env.TOOLBOX_ALLOWED_GROUPS?.trim() || '*'
if (groups.startsWith('[') || groups.endsWith(']')) {
  throw new Error('TOOLBOX_ALLOWED_GROUPS erwartet Gruppennamen ohne eckige Klammern oder * für alle angemeldeten Nutzer.')
}
const settings = {
  TOOLBOX_ALLOWED_GROUPS: groups,
  TOOLBOX_REDIRECT_URI: 'http://localhost:4321/toolbox-auth/callback.php',
  TOOLBOX_LOCAL_DEV: true,
  CIVICRM_BASE_URL: 'https://civi.smj-wegweiser.de',
  CIVICRM_API_KEY: env.CIVICRM_API_KEY,
  CIVICRM_SITE_KEY: env.CIVICRM_SITE_KEY || '',
}

const privateDir = path.join(localToolboxRoot, 'private')
fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 })
fs.chmodSync(privateDir, 0o700)
fs.copyFileSync(path.join(root, 'server/toolbox/config.php'), path.join(privateDir, 'config.php'))
fs.chmodSync(path.join(privateDir, 'config.php'), 0o600)
const phpDir = path.join(localToolboxRoot, 'public/toolbox-auth')
fs.mkdirSync(phpDir, { recursive: true, mode: 0o700 })
for (const route of ['login.php', 'callback.php', 'logout.php', 'civicrm-api.php']) {
  fs.copyFileSync(path.join(root, 'public/toolbox-auth', route), path.join(phpDir, route))
  fs.chmodSync(path.join(phpDir, route), 0o600)
}
const encoded = Buffer.from(JSON.stringify(settings), 'utf8').toString('base64')
const generated = `<?php\nreturn json_decode(base64_decode('${encoded}'), true, 512, JSON_THROW_ON_ERROR);\n`
fs.writeFileSync(path.join(privateDir, 'generated-config.php'), generated, { mode: 0o600 })
fs.chmodSync(path.join(privateDir, 'generated-config.php'), 0o600)
console.log('Lokale Toolbox-Konfiguration außerhalb des Projektverzeichnisses erzeugt (nicht in Git).')
console.log('Lokale Authentik-Anmeldung deaktiviert; Zugriff nur über 127.0.0.1:4321 oder localhost:4321.')
