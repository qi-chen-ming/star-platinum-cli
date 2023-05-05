import { green, bgRed } from 'kolorist'
import prompts from 'prompts'
import { ESLint } from 'eslint'
import {
  installEslintDep,
  eslintAction,
  cwd,
  getConfig,
  parseESLintResult
} from './utils'

export default async function (args: any) {
  if (args._[0] === 'lint' && args.init) {
    console.log(green('create-sp lint --init的执行逻辑'))
    try {
      const usedFramework: { value: 'vue' | 'vue+ts' | 'react' | 'react+ts' } =
        await prompts([
          {
            type: 'select',
            name: 'value',
            message: 'Pick a framework',
            choices: [
              { title: 'vue', value: 'vue' },
              { title: 'vue+ts', value: 'vue_ts' },
              { title: 'react', value: 'react' },
              { title: 'react+ts', value: 'react_ts' }
            ],
            initial: 1
          }
        ])
      installEslintDep(usedFramework.value)
      eslintAction(usedFramework.value)
      console.log('eslint初始化配置完成')
      return
    } catch (cancelled: any) {
      console.log(cancelled.message)
      process.exit(1)
    }
  }
  if (args._[0] === 'lint' && !args.init) {
    // console.log('create-sp lint的执行逻辑')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = getConfig()
    if (!config.esLint) {
      console.log(bgRed('请先执行create-sp lint --init命令'))
      process.exit(1)
    }

    const eslint = new ESLint({ cwd, overrideConfig: config.esLint })

    // console.log('lintFilesArr', config.lintFilesArr)
    // const results = await eslint.lintFiles([
    //   './src/**/*.ts',
    //   './src/*.ts',
    //   './src/**/*.vue'
    // ])
    const results = await eslint.lintFiles(config.lintFilesArr)
    // console.log('results', results)
    const formatter = await eslint.loadFormatter('stylish')
    const resultText = formatter.format(results)

    if (resultText !== '') {
      // console.log('resultText', resultText)
      console.log(resultText)
      const eslintResult = parseESLintResult(resultText)
      // console.log('eslintResult', eslintResult)
      console.log(
        green(`esLint检查完毕
    共有:${eslintResult.problems}个问题
    错误:${eslintResult.errors}
    警告:${eslintResult.warnings}`)
      )
    } else {
      console.log(green('你的项目没有检查到错误'))
    }
    process.exit(0)
  }
}
