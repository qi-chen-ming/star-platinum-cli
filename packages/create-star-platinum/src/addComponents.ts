import fs from 'node:fs'
import path from 'node:path'
import prompts from 'prompts'
import { renderComponent, getConfig, cwd } from './utils'

export default async function (args: any) {
  // console.log('这里是add命令的执行逻辑,create-sp add --name=NavBar ')
  // 1 当前路径下是否有配置文件 如果没有 新建一个 如果有得到componentsPath和frame
  const root = path.join(cwd, 'sp.config.json')
  const initConfig = getConfig()
  const questions: any = {
    type: 'select',
    name: 'value',
    message: 'Pick a frame',
    choices: [
      { title: 'react+fn', value: 'react_fn' },
      { title: 'react+class', value: 'react_class' },
      { title: 'react+ts+fn', value: 'react_ts_fn' },
      { title: 'react+ts+class', value: 'react_ts_class' },
      { title: 'vue2', value: 'vue2' },
      { title: 'vue3', value: 'vue3' },
      { title: 'vue3+setup', value: 'vue3_su' },
      { title: 'vue3+ts', value: 'vue3_ts' },
      { title: 'vue3+ts+setup', value: 'vue3_ts_su' }
    ],
    initial: 3
  }

  // console.log('frame', frame)
  // 2 如果frame有值就使用 如果没有 设置一个弹出框 得到值后写入当前的配置文件;如果设置了命令行有path
  if (!initConfig.frame) {
    const { value } = await prompts(questions)
    initConfig.frame = value
    fs.writeFileSync(root, JSON.stringify(initConfig, null, 2))
  }
  // 3 得到componentsPath 命令行的优先级大于配置文件 ,渲染对应frame的组件模板到指定的path下
  const cpnPath = args.path || initConfig.componentsPath
  // 4 把得到componentsPath和frame传入addComponent函数中
  renderComponent(args.name, cpnPath, initConfig.frame)
}
