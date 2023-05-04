import prompts from 'prompts'
import download from 'download-git-repo'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs'
const downloadRepo = promisify(download)

import { cwd, emptyDir } from './utils'

export default async function (args: any) {
  try {
    // let result: prompts.Answers<'projectName' | 'repoAddress'>
    const questions: any = [
      {
        type: 'text',
        name: 'projectName',
        message: 'What is the name of the project you want to create?',
        initial: 'myGithubTepProject'
      },
      {
        type: 'text',
        name: 'repoAddress',
        message: "What's your github address",
        initial: 'https://github.com/youGithubName/youRepoName.git'
      }
    ]
    const result = await prompts(questions)
    const targetDir = path.join(cwd, result.projectName)
    console.log('targetDir', targetDir)
    console.log('github模板信息是---', result)
    if (fs.existsSync(targetDir)) {
      const result = await prompts({
        type: 'confirm',
        name: 'value',
        message:
          'The folder exists, do you need to create a new folder to cover it?',
        initial: true
      })
      console.log(result)
      result.value === true ? emptyDir(targetDir) : process.exit(0)
      console.log('删除了原文件夹里全部的内容')
    }

    await downloadRepo(`direct:${result.repoAddress}`, result.projectName, {
      clone: true
    })
    console.log('模板创建成功！')
  } catch (error: any) {
    console.log(error.message)
    process.exit(0)
  }
}
