import fs from 'node:fs'
import { configRoot, initConfigFile } from './utils'

export default function (args: any) {
  //初始化配置文件的逻辑
  if (args.f || !fs.existsSync(configRoot)) {
    // 当强制初始化时
    initConfigFile(true)
  } else
    console.log(
      '文件已存在，如果需要强制初始化配置文件，可以执行 `create-sp initSP -f` 命令'
    )
}
