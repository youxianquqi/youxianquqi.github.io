# Agent 约定

讨论时先质疑方案是否必要（性能 / 成本 / 复杂度）；有歧义先问，不要无原则迎合。  
改完必须本地预览或 `hugo --gc --minify`，不要只口头说 done。

## 1. 仓库与站点现状


| 项         | 现状                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| 工作区       | `D:\PCCodes\blog\`（Cursor 打开根）                                                                                              |
| **Git 根** | `hugo-site/` → [https://github.com/youxianquqi/youxianquqi.github.io](https://github.com/youxianquqi/youxianquqi.github.io) |
| 线上        | [https://youxianquqi.github.io/](https://youxianquqi.github.io/)                                                            |
| 形态        | Hugo 静态站，Markdown 内容，无数据库、无表单后端                                                                                             |
| 部署        | push `main` → `.github/workflows/deploy.yml`（`hugo --gc --minify`）→ Pages                                                   |
| 本文件       | `hugo-site/AGENTS.md`（与工作区根 `blog/AGENTS.md` 保持同步）                                                                          |


下文路径默认相对 **git 根** `hugo-site/`。

## 2. Commands

```text
cd hugo-site   # 若从 blog/ 工作区进入

# 本地预览
./bin/hugo.exe server -D -p 1313
# → http://localhost:1313

# 生产构建（与 CI 一致）
./bin/hugo.exe --gc --minify

# 发布：在 hugo-site/ 提交并 git push origin main
```

不要手改 `public/` 当上线手段；下次 build 会丢。

## 3. 信息架构（当前实现）

```text
导航菜单：首页 / 文章 / 视频

侧栏 book-sidebar
  ├─ 导航（同上）
  └─ 文章列表（仅 posts，链到站内详情）
     （不列视频条目）

首页 /              → 关键词云（tags 汇总）
文章 /posts/        → 列表 + 各篇详情
视频 /videos/       → 封面网格；点击卡片 → B 站外链（无站内详情页）
标签 /tags/.../     → taxonomy
独立静态应用 /ai-exam/ → static/ai-exam/（不经 Hugo 模板，不影响博客壳）
```

**布局锁定 Book 侧栏**（`book-shell` / `book-sidebar` / `book-`* CSS）。  
禁止擅自换成顶栏作品墙、双列作品卡等另一套壳；除非用户明确要求换皮。


| 落点   | 路径                                                              |
| ---- | --------------------------------------------------------------- |
| 壳    | `layouts/_default/baseof.html`                                  |
| 首页云图 | `layouts/index.html` + `static/css/style.css`（`.keyword-cloud`） |
| 视频列表 | `layouts/videos/list.html`                                      |
| 文章详情 | `layouts/_default/single.html`                                  |
| 样式   | `static/css/style.css`（沿用现有类，不另起设计系统）                           |




## 4. 首页：关键词云

首页不是欢迎文 / 快速开始；`content/_index.md` 可只留 front matter。


| 项   | 约定                                               |
| --- | ------------------------------------------------ |
| 数据  | `.Site.Taxonomies.tags`（posts + videos 的 `tags`） |
| 字号  | **统一**，不按频次缩放                                    |
| 重复  | 出现次数 > 1 时显示 `×N`                                |
| 排布  | 每次打开随机打乱 + 轻微位移/旋转（页内原生 JS）                      |
| 配色  | 多色软底；按标签名哈希稳定选色；米白/绿 Book 基调                     |
| 点击  | 进 `/tags/.../`                                   |


新内容只要写了 `tags`，重建后自动进云图。同一概念固定同一写法（勿混中英近义词）。

## 5. 文章 `content/posts/`

- 有站内详情页；侧栏列出标题。  
- 必填：`title`、`date`、`draft`、`tags`、`description`。  
- 外链（CSDN 等）写「原文」时用**最短有效 URL**（去掉 `?spm=` 等）。  
- 文案中文。



### 项目介绍短文（作品 / 毕设 / 仓库入口）

正文用简写结构，不展开成长文：

```text
标题 | 项目类型
技术栈：A, B, C, …
项目描述：面向谁 + 怎么拆 + 核心能力 + 闭环/亮点
仓库：可点链接
```

可选：`cover`、文首图、`**原文：**` CSDN 短链。

## 6. 视频 `content/videos/`

视频**只作列表数据 + 外链出口**，不是站内播客。


| 项          | 约定                                                                     |
| ---------- | ---------------------------------------------------------------------- |
| 侧栏         | **不**列出视频                                                              |
| `/videos/` | 封面 + 标题 + 日期 + tags（`layouts/videos/list.html`）                        |
| 点击         | 整卡跳转 `bilibili`（`target="_blank"`），**不进站内详情**                          |
| 正文         | **不要**写详情 Markdown；不要 iframe / 播放器 / 自托管视频                             |
| 构建         | 每条必须 `[build] render = "link"` + `list = "always"`（无详情 HTML，tags 仍进云图） |
| `date`     | B 站**实际上传时间**（含时区），勿用写入当天冒充                                            |
| `bilibili` | 干净链接（去 `spm` / `vd_source`）                                            |
| `cover`    | `/images/xxx.jpg`，统一 `.jpg`                                            |
| `tags`     | 2～3 个                                                                  |


模板：

```markdown
+++
title = "视频标题"
date = 2026-06-18T11:00:44+08:00
draft = false
tags = ["标签1", "标签2", "标签3"]
description = "一句话简介"
bilibili = "https://www.bilibili.com/video/BVxxxxxx/"
cover = "/images/封面文件名.jpg"
[build]
  render = "link"
  list = "always"
+++
```

验收：侧栏无视频列表；`/videos/` 点标题开 B 站；不存在 `/videos/某条目/` 详情页。

## 7. 独立静态应用（子路径托管）

把完整静态站放进 `static/<应用名>/`，发布后公网为 `https://youxianquqi.github.io/<应用名>/`，**不改** Book 布局与文章/视频。

当前已挂载：

| 路径 | 来源约定 | 公网 |
|------|----------|------|
| `static/ai-exam/` | 运行所需 HTML/CSS/JS（`index/exam/practice/result` + `shared`/`engine`/`bank`） | https://youxianquqi.github.io/ai-exam/ |

规则：

- 资源须用**相对路径**（勿写站点根绝对路径如 `/shared/...`）
- **不要**提交 `node_modules/`、本地测试脚本、密钥
- 默认**不加**侧栏/主导航入口（避免搅动博客 IA）；需要入口时单独加链接或短文
- 更新应用：覆盖 `static/<应用名>/` 后 build / push 即可

## 8. 编码规范

与现有文件冲突时，优先保持仓库一致。


| 对象                | 命名                      | 示例                                   |
| ----------------- | ----------------------- | ------------------------------------ |
| HTML/CSS class、id | kebab-case              | `book-sidebar`、`keyword-chip`        |
| JS                | camelCase / UPPER_SNAKE | `toggleNav`、`MAX_RETRY`              |
| 内容文件名             | kebab-case              | `pvz-mushroom-sleep.md`              |
| 脚本                | 原生 DOM                  | `querySelector` / `addEventListener` |


改 `config.toml`、Actions、`baseURL` —— 未点名不要动。

## 9. 边界



### Always

- 只改任务需要的文件（通常在 `content/`、`layouts/`、`static/`）
- 中文交流 → 页面与文章用中文
- 改完说明：改了什么、浏览器应看到什么、如何验证
- 新文章/视频必填规范 `tags`；视频必带 `bilibili` + `build.render = "link"`
- 保持 Book 侧栏 + 首页关键词云 + 视频外链列表



### Ask first

- 大改布局 / 配色 / 整站模板
- 加依赖、换框架、改目录结构
- 改部署配置、`config.toml`
- git commit / push（除非用户明确要求）



### Never

- 用 React/Vue/打包工具替代 Hugo（除非任务写明）
- 为「更好看」大改无关布局；手改 `public/` 冒充发布
- 提交密钥、`.env`、无意义大文件

