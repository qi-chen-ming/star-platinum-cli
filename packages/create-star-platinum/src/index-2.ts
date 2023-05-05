import path from 'node:path'
import fs from 'node:fs'
console.log('hello-ceshi')
// const config = require('../tep-config/sp.config.json')
// console.log('config', config.ad)
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const cwd = process.cwd()
export const configRoot: string = path.join(cwd, 'sp.config.json')
export function getConfig() {
  // const configRoot: string = path.join(cwd, 'sp.config.json')
  // if (fs.existsSync(root)) {
  //   const data = fs.readFileSync(root, 'utf8')
  //   return data
  // } else {
  //   throw new Error(red('当前目录下没有找到sp.config.js这个文件'))
  // }
  if (!fs.existsSync(configRoot)) initConfigFile()
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // const loadDir = require(configRoot)
  // const loadDir: configSP = await import(configRoot, {
  //   assert: {
  //     type: 'json'
  //   }
  // })
  // console.log('loadDir', loadDir)
  // console.log('root', root)
  const data = fs.readFileSync(configRoot, 'utf8')

  // parse JSON string to JSON object
  const loadDir = JSON.parse(data)
  return loadDir
}

export function initConfigFile(force?: boolean) {
  force
    ? console.log('正在强制初始化配置文件sp.config.json')
    : console.log('在此路径上没有找到sp.config.json,开始初始化一个配置文件。')
  fs.copyFileSync(
    path.resolve(__dirname, '../tep-config/sp.config.json'),
    configRoot
  )
}
