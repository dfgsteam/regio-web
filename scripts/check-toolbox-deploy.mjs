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

await expectStatus('/toolbox-auth/generated-config.php', 403)
await expectStatus('/toolbox-auth/civicrm-api.php?action=groups', 401)
await expectStatus('/toolbox/', 302)
