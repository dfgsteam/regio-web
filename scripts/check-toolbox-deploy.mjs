#!/usr/bin/env node

const site = new URL(process.env.SITE_URL || 'https://smj-wegweiser.de')

async function expectStatus(path, expected) {
  const response = await fetch(new URL(path, site), {
    method: 'HEAD',
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
  })
  if (response.status !== expected) {
    throw new Error(`${path}: HTTP ${response.status} statt ${expected}`)
  }
  console.log(`${path}: HTTP ${response.status}`)
}

async function expectHidden(path) {
  const response = await fetch(new URL(path, site), {
    method: 'HEAD',
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
  })
  if (response.status !== 403 && response.status !== 404) {
    throw new Error(`${path}: HTTP ${response.status} statt 403 oder 404`)
  }
  console.log(`${path}: HTTP ${response.status}`)
}

await expectStatus('/toolbox-auth/generated-config.php', 403)
await expectStatus('/private/generated-config.php', 404)
await expectStatus('/private/toolbox/index.html', 404)
await expectHidden('/.ftp-deploy-sync-state.json')
await expectStatus('/toolbox-auth/civicrm-api.php?action=groups', 401)
await expectStatus('/toolbox-auth/civicrm-api.php?action=contacts&group_id=12', 401)
await expectStatus('/toolbox/', 302)
