import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import ejs from 'ejs'
import spawn from 'cross-spawn'
import ora from 'ora'
import { bgCyan, bgRed, bgGreen } from 'kolorist'

export const cwd = process.cwd()
export const configRoot: string = path.join(cwd, 'sp.config.json')

import { lintFilesArr, react, react_ts, vue, vue_ts } from '../tep-eslint'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function ejsCompile(templatePath: any, data = {}, options = {}) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, { data }, options, (err, str) => {
      if (err) {
        reject(err)
        return
      }
      resolve(str)
    })
  })
}

export const mkdirSync = (dirname: string) => {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    // 不存在,判断父亲文件夹是否存在？
    if (mkdirSync(path.dirname(dirname))) {
      // 存在父亲文件，就直接新建该文件
      fs.mkdirSync(dirname)
      return true
    }
  }
}

export const writeFile = (path: any, content: any) => {
  if (fs.existsSync(path)) {
    console.log('the file already exists~')
    return
  }
  return fs.promises.writeFile(path, content)
}

export async function handleEjsToFile(
  name: any,
  dest: any,
  template: any,
  filename: any
) {
  // console.log(name, dest, template, filename)
  // 1.获取模块引擎的路径
  const templatePath = path.resolve(__dirname, template)
  const cpnPath = dest + `/${filename}`
  const result = await ejsCompile(templatePath, {
    name,
    lowerName: name.toLowerCase(),
    cpnPath
  })

  // 2.写入文件中
  // 判断文件不存在,那么就创建文件
  mkdirSync(dest)
  const targetPath = path.resolve(dest, filename)
  writeFile(targetPath, result)
}

export async function renderComponent(
  name: any,
  dest: any,
  frame: any
): Promise<any> {
  const renderFrame = '../tep-ejs/component_' + frame + '.ejs'
  const suffix = frame.includes('vue')
    ? 'vue'
    : frame.includes('ts')
    ? 'ts'
    : 'js'
  const renderCpnName = `${name}.${suffix}`
  handleEjsToFile(name, dest, renderFrame, renderCpnName)
  // handleEjsToFile(
  //   name,
  //   dest,
  //   '../tep-ejs/component_vue3_ts_su.ejs',
  //   `${name}.vue`
  // )
}

export function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '')
}

export function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

export function isValidPackageName(projectName: string) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName
  )
}

export function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

export function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

export function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1]
  }
}

export function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

export function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}
interface configSP {
  componentsPath?: string
  frame?: string
  token?: string
  repoName?: string
  githubUserName?: string
  eslint?: any
}

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
    ? console.log('正在初始化配置文件sp.config.json')
    : console.log('在此路径上没有找到sp.config.json,开始初始化一个配置文件。')
  fs.copyFileSync(
    path.resolve(__dirname, '../tep-config/sp.config.json'),
    configRoot
  )
}

export function loadCmd(command: any, args: any, text: any) {
  try {
    const loading = ora()
    loading.start(`${text}: 命令执行中...\n`)
    const { stdout } = spawn.sync(command, args, {
      // stdio: 'inherit'
    })
    // console.log('stdout', stdout)
    if (stdout.toString())
      console.log(bgCyan('sp-cli-info '), stdout.toString())
    loading.succeed(`${text}: 命令执行完成`)
  } catch (error: any) {
    console.log(bgRed(error))
    process.exit(1)
  }
}

export function installEslintDep(type: string) {
  switch (type) {
    case 'vue':
      loadCmd(
        'npm',
        ['install', '-D', 'eslint-plugin-vue'],
        '安装eslint-plugin-vue'
      )
      loadCmd('npm', ['install', '-D', 'eslint'], '安装eslint')
      break
    case 'vue_ts':
      loadCmd(
        'npm',
        [
          'install',
          '-D',
          'eslint-plugin-vue@latest',
          'eslint-config-standard-with-typescript@latest',
          '@typescript-eslint/eslint-plugin@^5.43.0',
          'eslint@^8.0.1',
          'eslint-plugin-import@^2.25.2',
          'eslint-plugin-n@^15.0.0',
          'eslint-plugin-promise@^6.0.0',
          'typescript@*'
        ],
        '安装vue+ts相关依赖'
      )

      break
    case 'react':
      loadCmd(
        'npm',
        [
          'install',
          '-D',
          'eslint-plugin-react@latest',
          'eslint-config-standard@latest',
          'eslint@^8.0.1',
          'eslint-plugin-import@^2.25.2',
          'eslint-plugin-n@^15.0.0',
          'eslint-plugin-promise@^6.0.0'
        ],
        '安装react相关依赖'
      )
      break
    case 'react_ts':
      loadCmd(
        'npm',
        [
          'install',
          '-D',
          'eslint-plugin-react@latest',
          'eslint-config-standard-with-typescript@latest',
          '@typescript-eslint/eslint-plugin@^5.43.0',
          'eslint@^8.0.1',
          'eslint-plugin-import@^2.25.2',
          'eslint-plugin-n@^15.0.0',
          'eslint-plugin-promise@^6.0.0',
          'typescript@*'
        ],
        '安装react+ts相关依赖'
      )
      console.log('wait......')
      break

    default:
      console.log(`Sorry, we are out of ${type}.`)
  }
}

export function eslintAction(type: string) {
  const spConfig = getConfig()
  const addEslintConfig = Object.assign({}, spConfig)
  const getType: any = { vue, vue_ts, react, react_ts }
  for (const item in getType) {
    if (item === type) {
      addEslintConfig.esLint = getType[item]
      addEslintConfig.lintFilesArr = lintFilesArr[item]
    }
  }
  fs.writeFileSync(configRoot, JSON.stringify(addEslintConfig, null, 2))
}

export function parseESLintResult(resultText: any) {
  const problems = extractEsLint(resultText, 'problems')
  const errors = extractEsLint(resultText, 'errors')
  const warnings = extractEsLint(resultText, 'warnings')
  return {
    problems: +problems || 0,
    errors: +errors || 0,
    warnings: +warnings || 0
  }
}

export function extractEsLint(resultText: any, type: string) {
  const problems = /([0-9]+) problems/
  const warnings = /([0-9]+) warnings/
  const errors = /([0-9]+) errors/
  switch (type) {
    case 'problems':
      return resultText.match(problems)[0].match(/[0-9]+/)[0]
    case 'warnings':
      return resultText.match(warnings)[0].match(/[0-9]+/)[0]
    case 'errors':
      return resultText.match(errors)[0].match(/[0-9]+/)[0]
    default:
      console.log(bgGreen('当前项目没有检测出错误'))
      return
  }
}
