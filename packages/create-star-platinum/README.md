# 这里是 create-star-platinum 的主页

这是一个叫做白金之星的脚手架，在模仿 vite 的官方脚手架 create-vite 的基础上，添加了自定义模板、自动化创建组件、远程仓库、eslint 代码检测等功能。

## 安装

```
全局安装
npm install -g create-star-platinum
```

安装后，在命令行输入：

```
create-sp -v
或者
create-sp --version
```

命令行返回结果，证明安装成功。

## 使用脚手架创建项目

create-star-platinum 提供了 vue 和 react 和对应的 ts 项目的创建，创建项目的命令可以是

```
//快速创建
create-sp
//直接把项目模板的文件下载到当前路径下，而不是创建一个项目名同名的文件夹，在文件夹下下载项目模板
create-sp .
//后面加入路径 表示在此路径下创建项目，前提是此目录内容为空，否则将询问是否删除文件夹下的内容再创建项目
create-sp  ./xxx/xxx
//确定模板类型 template参数的值可以是vue、vue-ts、react、react-ts
create-sp --template=vue-ts
```

## 使用 github 上自定义的模板创建项目

你也可以把自定义的模板放到自己的 github 上，通过脚手架创建项目。

```
create-sp githubTep
```

## 自动化创建组件

脚手架可以自动化的创建你需要的组件模板。

```
create-sp add --name=componentName
或者 指定组件的下载位置 默认是/src/components
create-sp add --name=componentName --path=./xxxx/xxxx
```

当你第一次执行命令的时候，会让你选择项目使用的事什么框架，是否使用 ts，不同的框架也有不同的组件特点，例如 react 的可以创建一个类组件也可以创建一个函数组件。

如果你在第一次的时候选错了框架类型，可以在 sp.config.json 中修改*frame*属性的值，如果你不记得了它的值，最简单的方式就是把*frame*属性设置为空字符串，或者直接删除 sp.config.json 脚手架的配置文件，再重新执行命令。

> 现在提供的组件模板还不全，只有 vue2、vue3+ts、vue3+ts+setup，之后会进行更新

## 自动创建 github 远程仓库

```
create-sp repo
```

这个命令可以让你在本地创建一个 github 的远程仓库。

> 注意，这需要你在你的 github 上设置 token，你可以在网络上搜索 *github 创建 token*的关键词进行操作

之后在 sp.config.json 中输入 token、repoName、githubUserName 属性的值，再次执行命令，即可完成远程仓库的创建。

repoName 是你创建的远程仓库的名字，githubUserName 是你的 github 名字。这三个属性是必选项。

## 初始化配置文件

```
create-sp initSP
或者 强制初始化当前的配置文件（会把配置文件之前的内容清空）
create-sp initSP -f
```

## eslint 代码检测

类似于 eslint 脚手架的作用，让你选择自己的框架，然后自动下载相关 eslint 的依赖。你可以在 sp.config.json 的 esLint 属性中修改 eslint 的规则。

```
//需要先执行这个命令 下载相关eslint的依赖
create-sp lint --init
```

之后 每次代码检测

```
create-sp lint
```
