import crypto from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

const workspaceId = crypto.createHash('sha256').update(process.cwd()).digest('hex').slice(0, 16)
export const localToolboxRoot = path.join(os.tmpdir(), `smj-regio-toolbox-${workspaceId}`)
