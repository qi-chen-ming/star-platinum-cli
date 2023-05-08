// import { getConfig } from './utils'
// import { getConfig } from './index-2'

import getVersion from './getVersion'
import createTep from './createTep'
import createGithubTep from './createGithubTep'
// import fn from './one.js'

import addComponents from './addComponents'
import initSP from './initSP'
import createRepo from './createRepo'
import lint from './lint'
const argvMap: any = new Map()

argvMap.set(['-v', '--version'], getVersion)
argvMap.set(['', '/', '.', '--template'], createTep)
argvMap.set(['githubTep'], createGithubTep)
argvMap.set(['add --name --path', 'add --name'], addComponents)
argvMap.set(['initSP', 'initSP -f'], initSP)
// // 自动创建github远程仓库
argvMap.set(['repo'], createRepo)
argvMap.set(['lint', 'lint --init'], lint)

// argvMap.set(['test'], (args: any) => {
//   // console.log('得到args', args)
//   // const { componentsPath } = getConfig()
//   // console.log('这是测试命令,白金之星脚手架启动成功了！')
//   // console.log('配置文件中的componentsPath', componentsPath)
//   // console.log('' || 1 || 2 || 3)
// })

function argAction(args: any) {
  //命令行参数映射
  let command
  const argoption = []
  for (const arg in args) {
    if (arg === '_') {
      command = args[arg][0] ?? ''
    } else {
      if (arg.length == 1 && typeof args[arg] == 'boolean')
        argoption.push('-' + arg)
      else {
        argoption.push('--' + arg)
      }
    }
  }
  const argOptionResult = argoption
    .reduce((pre, cur) => {
      return pre + cur + ' '
    }, '')
    .slice(0, -1)
  const noSpace = command === '' || (command && !argOptionResult)
  const getCommandArg =
    (noSpace ? command + '' : command + ' ') + argOptionResult

  try {
    let action = null
    argvMap.forEach((value: null, key: string[]) => {
      const comfirm = key.some((item) => {
        return item === getCommandArg
      })
      if (comfirm) {
        action = key
      }
    })
    // console.log('action', action)
    const result = argvMap.get(action)
    result(args)
  } catch (error) {
    console.log('您输入的指令不正确')
    // console.log(error)
  }
}

export default argAction
