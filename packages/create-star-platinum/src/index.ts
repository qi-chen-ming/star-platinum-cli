// console.log('create-sp:正在进行本地调试！')
// import fs from 'node:fs'
// import path from 'node:path'
// import { fileURLToPath } from 'node:url'
// import spawn from 'cross-spawn'
// import prompts from 'prompts'
import minimist from 'minimist'

import argAction from './argvMap'

const args = minimist<{
  t?: string
  template?: string
}>(process.argv.slice(2), { string: ['_'] })
// console.log('args---', args)

argAction(args)
