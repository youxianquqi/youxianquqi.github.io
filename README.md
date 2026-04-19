# Hugo 本地博客系统

## 简介
一个最小化 Hugo 博客，使用 Markdown 撰写文章，无需数据库、无需编程。支持热重载、本地预览。

## 快速启动

### 1. 启动本地服务器
```powershell
cd d:/PCCodes/博客/hugo-site
./bin/hugo.exe server -D -p 1313
```

### 2. 打开浏览器
访问 http://localhost:1313

### 3. 新增文章
```powershell
./bin/hugo.exe new posts/my-article.md
```

### 4. 编辑文章
编辑 `content/posts/my-article.md`（Markdown 格式），保存后自动刷新。

### 5. 生成静态站点
```powershell
./bin/hugo.exe -D
```
生成的文件在 `public/` 目录下。

## 目录结构
```
hugo-site/
├── config.toml           # 网站配置
├── content/              # 文章内容
│   ├── _index.md         # 首页
│   └── posts/            # 博客文章
│       └── first-post.md
├── layouts/              # HTML 模板
│   └── _default/         # 默认布局
│       ├── baseof.html   # 基础模板
│       ├── list.html     # 列表页
│       └── single.html   # 单篇文章
├── static/               # 静态资源
│   └── css/style.css     # 样式表
├── bin/                  # Hugo 可执行文件
│   └── hugo.exe
└── public/               # 生成的静态网站（build 后）
```

## Markdown 文章格式示例
```markdown
+++
title = "文章标题"
date = "2026-04-18T12:00:00+08:00"
draft = false
tags = ["标签1", "标签2"]
description = "文章描述"
+++

文章正文用 Markdown 格式编写...
```

## 常用命令
| 命令 | 说明 |
|------|------|
| `./bin/hugo.exe server -D -p 1313` | 启动本地开发服务器 |
| `./bin/hugo.exe new posts/title.md` | 新建文章 |
| `./bin/hugo.exe -D` | 生成静态网站（含草稿） |
| `./bin/hugo.exe` | 生成静态网站（不含草稿） |

## 注意事项
- 文章 `draft = true` 时为草稿，`hugo server -D` 可预览，`hugo` 构建时不包含
- 修改 `config.toml` 后需重启服务器
- 静态资源放在 `static/` 目录，访问时不含该前缀（如 `static/img/demo.jpg` → `/img/demo.jpg`）
