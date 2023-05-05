import { red } from 'kolorist'
import { loadCmd, getConfig } from './utils'

export default function () {
  // console.log('处理create-sp repo 操作的逻辑')
  // 1 判断本地是否有配置文件 没有就生成 填写配置文件的token repoName githubUserName这三个字段
  const { token, repoName, githubUserName } = getConfig()
  // 2 如果有值为空 就告诉需要填写 如果写的不对就报错
  // token: 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
  // repoName: hello - world - test
  // githubUserName:qi-chen-ming
  const isEmpty = [token, repoName, githubUserName].every((item) => item != '')
  // console.log(token, repoName, githubUserName)
  if (!isEmpty) {
    console.log(
      red('您没有在配置文件中设置token、repoName、githubUserName属性的值')
    )
    process.exit(0)
  }
  // 3 得到值后执行
  loadCmd('git', ['init'], 'git初始化')
  loadCmd(
    'curl',
    [
      '-L',
      '-X',
      'POST',
      '-H',
      'Accept:application/vnd.github+json',
      '-H',
      `Authorization:Bearer ${token}`,
      '-H',
      'X-GitHub-Api-Version:2022-11-28',
      'https://api.github.com/user/repos',
      '-d',
      `{"name":"${repoName}","description":"This is your first repo!"}`
    ],
    '创建Github仓库'
  )
  loadCmd(
    'git',
    [
      'remote',
      'add',
      'origin',
      `https://github.com/${githubUserName}/${repoName}.git`
    ],
    '关联远端仓库'
  )
  loadCmd('git', ['add', '.'], '执行git add')
  loadCmd('git', ['commit', '-a', '-m', '初始化提交'], '执行git commit')
  loadCmd('git', ['branch', '-M', 'main'], '重命名当前分支为main')
  loadCmd('git', ['push', '--set-upstream', 'origin', 'main'], '执行git push')
  process.exit(0)
}
