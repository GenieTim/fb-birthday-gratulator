#!/usr/bin/env node

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execute } from '@oclif/core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await execute({ development: false, dir: __dirname })

