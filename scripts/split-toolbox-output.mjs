#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const publicToolbox = path.resolve('dist/toolbox')
const privateToolbox = path.resolve('dist-private/toolbox')
if (!fs.existsSync(publicToolbox) || !fs.statSync(publicToolbox).isDirectory()) {
  throw new Error('Astro-Build enthält kein dist/toolbox/-Verzeichnis.')
}

fs.mkdirSync(path.dirname(privateToolbox), { recursive: true })
fs.rmSync(privateToolbox, { recursive: true, force: true })
fs.renameSync(publicToolbox, privateToolbox)
console.log('Toolbox-Dateien aus dem öffentlichen Build nach dist-private/ verschoben.')
