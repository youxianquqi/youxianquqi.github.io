+++
title = "Hugo 博客部署到 GitHub Pages 的踩坑总结"
date = 2026-04-19T10:00:00+08:00
draft = false
tags = ["Hugo", "GitHub Pages", "部署", "踩坑总结"]
description = "把 Hugo 博客部署到 GitHub Pages 的完整过程、关键步骤和真实踩坑记录。"
+++

把 Hugo 博客部署到 GitHub Pages，本来以为就是“推上去就能看”。真正做了一遍之后才发现，能跑通和能稳定跑通不是一回事。中间踩了几个很典型的坑，整理下来正好当作一篇实战记录。

这篇文章不讲太多概念，直接讲能落地的步骤和容易出错的地方。对刚开始做 Hugo 静态博客的人来说，少走很多弯路。

## 先说结论

如果你想让 Hugo 博客稳定发布到 GitHub Pages，建议使用这套流程：

1. 仓库命名为 `username.github.io`
2. `config.toml` 里把 `baseURL` 改成真实域名
3. 使用 GitHub Actions 官方 Pages 流程部署
4. 在仓库的 `Settings -> Pages` 里选择 `GitHub Actions`
5. 每次推送到 `main` 后自动构建和发布

这样最稳，也最适合后续持续写文章。

## 第一步：确认仓库和站点地址

如果是个人主页站点，仓库名最好就是：

```text
username.github.io
```

我这次使用的是：

```text
youxianquqi.github.io
```

对应的远程仓库是：

```text
https://github.com/youxianquqi/youxianquqi.github.io.git
```

这个地方看似简单，但如果仓库名、`baseURL` 和实际访问地址不一致，后面很容易出现静态资源路径错误或者 404。

## 第二步：修改 Hugo 配置

Hugo 的 `config.toml` 里，`baseURL` 一定要改成真实站点地址。

```toml
baseURL = "https://youxianquqi.github.io/"
languageCode = "zh-CN"
title = "我的 Hugo 博客"
paginate = 10
```

这里有个很容易忽略的问题：很多教程里会先写成占位符，比如 `https://username.github.io/`。如果忘了改，页面能打开，资源路径却可能不对。

## 第三步：不要再依赖旧的 gh-pages 推送流程

我最开始用的是旧方案，工作流里通过 `peaceiris/actions-gh-pages` 把 `public/` 推到 `gh-pages` 分支。看起来能用，但在这次实际部署里遇到了权限问题。

报错核心是：

```text
Permission to ... denied to github-actions[bot]
```

本质上是 GitHub 对这类推送方式的权限策略和仓库设置不匹配。最直接的解决方式，是改成 GitHub Pages 官方推荐的 Actions 流程。

## 第四步：使用 GitHub Pages 官方 Actions

工作流需要大致包含这三个动作：

- `actions/configure-pages`
- `actions/upload-pages-artifact`
- `actions/deploy-pages`

再配上必要权限：

- `pages: write`
- `id-token: write`

这样推送到 `main` 后，GitHub 会先构建站点，再把构建产物发布到 Pages。

我现在使用的思路就是：

1. `main` 分支触发 workflow
2. Hugo 构建生成 `public/`
3. 上传构建产物
4. 发布到 GitHub Pages

这套流程比手动推 `gh-pages` 更稳，也更容易排查问题。

## 第五步：去对地方开 Pages

这个坑我自己也踩了，就是一开始进错了设置页。

正确入口不是头像菜单里的账号设置，而是仓库里的：

```text
Settings -> Pages
```

然后把 `Build and deployment` 的 `Source` 设成：

```text
GitHub Actions
```

如果这里还停留在 `Deploy from a branch`，就很容易和新的 workflow 配置打架。

## 第六步：本地先验证构建

在推送前，我建议先本地跑一次 Hugo 构建。

```powershell
$env:HUGO_CACHEDIR='D:\PCCodes\blog\hugo-site\.hugo_cache'
.\bin\hugo.exe --gc --minify
```

我这里还遇到过一个本地权限问题，Hugo 默认想往用户目录写缓存，但当前环境没有权限。把缓存目录改到项目目录里，就顺利解决了。

本地先能过，线上就少很多不确定性。

## 这次踩到的几个坑

### 1. 进错了 Pages 页面

我一开始打开的是账号级别的 `Pages` 页面，那里主要是域名验证，不是仓库发布入口。

正确位置始终是仓库自己的 `Settings -> Pages`。

### 2. 旧工作流还在运行

Actions 里如果看到的是老的 `Deploy Hugo Blog`，说明仓库里还在跑旧配置。

要检查：

- 新的 workflow 文件有没有提交
- 有没有推到 `main`
- Actions 运行名称是不是已经变成新的 workflow

### 3. 403 权限拒绝

旧的 `gh-pages` 推送流程会碰到 bot 权限问题。

解决思路不是“再试一次”，而是直接切换到官方 Pages Actions。

### 4. Hugo 缓存目录无权限

这个问题不属于站点本身，而是本地环境的目录权限。

处理方式是显式指定：

```powershell
$env:HUGO_CACHEDIR='D:\PCCodes\blog\hugo-site\.hugo_cache'
```

## 日常更新怎么做

文章写好以后，最短流程就是：

```powershell
.\bin\hugo.exe new posts/my-post.md
# 编辑文章
git add .
git commit -m "Add new post"
git push origin main
```

GitHub Actions 会自动重新构建，通常一两分钟后站点就会更新。

## 最后

如果只记住一件事，那就是：Hugo 博客部署到 GitHub Pages，关键不是“能不能发上去”，而是“以后每次写新文章时，能不能稳定自动发布”。

这次把流程理顺之后，后面就真的只是写 Markdown 了。
