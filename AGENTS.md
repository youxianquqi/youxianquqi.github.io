# Agent 约定

讨论时自动质疑：质疑用户方案时，先从性能、成本、复杂度是否有必要角度分析；有歧义先提问，不要无原则迎合。
改完用浏览器看结果（`hugo server` 预览），不要只口头说 done。

本仓库是 **Hugo 静态博客**（工作区根 `blog/`，**git 根在 `hugo-site/`**），用 Markdown 写文、layouts 出页、static 放静态资源，经 GitHub Pages 部署。线上站点：https://youxianquqi.github.io/

## Commands

```text
# Dev（本地预览）
cd hugo-site
./bin/hugo.exe server -D -p 1313
# → http://localhost:1313

# Build（与 CI 一致）
cd hugo-site
./bin/hugo.exe --gc --minify

# Deploy
# 在 hugo-site/ 提交并 push 到 main → GitHub Actions Pages 自动发布
# 远程：https://github.com/youxianquqi/youxianquqi.github.io.git
```

约定：改完必须本地预览或 build 过；部署依赖 Actions，不要手改 `public/` 当上线手段。

## 编码规范

与现有文件风格冲突时，优先保持仓库一致。

| 对象 | 命名法 | 示例 |
|------|--------|------|
| HTML/CSS 的 `class`、`id` | 短横线命名（kebab-case） | `post-meta`、`site-header` |
| JS 变量、函数 | 小驼峰（camelCase） | `toggleNav`、`scrollTop` |
| JS 常量 | 大写蛇形（UPPER_SNAKE） | `MAX_RETRY` |
| 内容文件名 | 短横线（kebab-case） | `github-pages-deploy-lessons.md` |
| 布局 / 静态资源 | 与现有一致 | `single.html`、`style.css` |

其他约定：

- **内容**：文章写在 `hugo-site/content/posts/`，视频写在 `hugo-site/content/videos/`；中文交流时页面与文章文案用中文
- **模板**：改 `hugo-site/layouts/`，语义 HTML；沿用现有 `_default` 结构
- **样式**：改 `hugo-site/static/css/` 现有类，不另起一套设计系统
- **脚本**：若有自定义 JS，原生 DOM，优先 `querySelector` / `addEventListener`
- **配置**：站点配置在 `hugo-site/config.toml`；部署相关在 `.github/workflows/`——未点名不要乱改
- **生成物**：`hugo-site/public/` 为构建输出，一般不要手改；以 content / layouts / static 为准
- **整站布局**：锁定 **Book 侧栏**（`book-shell` / `book-sidebar` + 文章/视频列表）；不要改成顶栏作品墙、双列卡片墙等另一套布局，除非用户明确要求换皮

## 首页关键词云规范

首页（`layouts/index.html`）是 **技术关键词云**，不是欢迎文案或快速开始列表。数据来自 Hugo taxonomy：文章 `posts` + 视频 `videos` 的 front matter `tags`。

### 行为约定

| 项 | 要求 |
|----|------|
| 数据源 | `.Site.Taxonomies.tags`；新加文章/视频只要写了 `tags`，重建后自动进云图 |
| 字号 | **统一大小**，不要按频次缩放 |
| 重复 | 出现次数 `> 1` 时在词后标 `×N`（如 `游戏设计×6`）；仅 1 次不标 |
| 排布 | 每次打开页面 **随机打乱顺序** + 轻微位移/旋转（页面内原生 JS） |
| 配色 | 多色软底色块，按标签名哈希稳定选色；云区可用淡渐变底，保持 Book 主题的米白/绿基调 |
| 交互 | 点击标签跳到 `/tags/.../`；悬停可轻微上浮，勿加重阴影/发光 |

### 实现落点

- 模板：`hugo-site/layouts/index.html`（云图结构 + 随机/配色脚本）
- 样式：`hugo-site/static/css/style.css`（`.keyword-cloud` / `.keyword-chip` / `.keyword-count`）
- 首页正文：`content/_index.md` 可留空 front matter；**不要**再塞「欢迎 / 快速开始」替代云图

### 写内容时的 tags

- 文章、视频 **都应填 `tags`**（技术词 / 主题词，短而稳）
- 同一概念用同一写法（如统一 `游戏设计`，不要混用「游戏设计」「Game Design」），否则云图会拆成两个词
- 视频仍建议 2～3 个 tag；文章可略多，但仍避免一串近义词堆砌
- CSDN 等外链写「原文」时用最短有效 URL（去掉 `?spm=` 等跟踪参数）

验收：`./bin/hugo.exe server -D -p 1313` → http://localhost:1313/ 能看到彩色关键词云；刷新后顺序变化；多次出现的词带 `×N`；点词能进标签页。

## 项目介绍文章规范

写「作品 / 毕设 / 仓库入口」类短文时，正文用下面简写结构，不展开成长文；细节留给仓库链接。

```text
标题 | 项目类型
技术栈：A, B, C, …
项目描述：一句话场景 + 架构要点 + 核心能力 + 闭环/亮点（可分号串联）
仓库：链接
```

字段约定：

| 字段 | 写法 |
|------|------|
| 标题行 | `项目名 \| 类型`（如毕业设计、个人项目） |
| 技术栈 | 逗号分隔，只列关键栈，不写版本长篇说明 |
| 项目描述 | 一段话：面向谁、怎么拆、核心算法/能力、业务闭环；不写安装步骤 |
| 仓库 | 必给可点链接；文内不复述 README |

示例（社团之家）：
```text
社团之家智能推荐平台 | 毕业设计项目开发
技术栈：Spring Boot 3.2, Vue.js 3, MySQL 8.0, Redis, JWT, MyBatis-Plus, AI大模型API
项目描述：面向高校社团招新的全栈管理平台，覆盖学生端、社团端、管理端三端协同；后端按社团、招新、平台、管理四域拆分 Maven 模块。核心为可配置权重的混合推荐引擎（Jaccard 标签匹配 + 隐藏标签加分 + QQ 群加权），并接入 LLM 语义推荐，形成「画像发现 → 入社申请 → 社团邀请」闭环；同时提供活动管理、招新问答审核、公告等平台能力。
仓库：https://gitee.com/keaitui/end
```
对应 Markdown 可写成：标题用 `title`，正文用「技术栈 / 项目描述 / 仓库」三块；`description` 用项目描述首句或压缩版。
## 视频条目规范

视频写在 `hugo-site/content/videos/`，列表页用双列封面网格（`layouts/videos/list.html`）：展示封面 + 标题链接 + **上传日期** + tags 小标签。封面图放 `hugo-site/static/images/`。

**不接入视频源：** 详情页只保留可点击的 B 站（或其它平台）链接，**禁止**嵌入 `iframe` / 播放器 / 直链视频文件。访客点链接去原站观看。

### 上传时间（必填并展示）

- `date` **必须**写成 B 站页面上的实际上传时间（含时区，如 `2026-06-18T11:00:44+08:00`），不要用「写入博客当天」冒充
- 列表页标题下用 `YYYY-MM-DD` 标出；详情页沿用文章头的日期展示
- 列表按 `date` 倒序（新上传在前）

新增一条时按下面模板（文件名 kebab-case，如 `pvz-mushroom-sleep.md`）：

```markdown
+++
title = "视频标题"
date = 2026-06-18T11:00:44+08:00
draft = false
tags = ["标签1", "标签2", "标签3"]
description = "一句话简介"
bilibili = "https://www.bilibili.com/video/BVxxxxxx/"
cover = "/images/封面文件名.jpg"
+++

![封面](/images/封面文件名.jpg)

**视频标题** | 游戏杂谈视频

一句话简介。

**B 站：** [https://www.bilibili.com/video/BVxxxxxx/](https://www.bilibili.com/video/BVxxxxxx/)
```

字段约定：

| 字段 | 写法 |
|------|------|
| `title` | 与 B 站标题一致或略整理 |
| `date` | B 站上传时间，必填；列表与详情都要能看到 |
| `description` | 一句话简介，必填（详情 meta / 摘要用） |
| `tags` | 2～3 个即可，列表页标题下展示 |
| `bilibili` | 干净链接（去掉 `spm` / `vd_source` 等参数）；正文用同一 URL 写成 Markdown 链接 |
| `cover` | `/images/xxx.jpg`，统一用 `.jpg`；与正文封面图同一文件 |

禁止：正文或模板里出现 B 站/`player.bilibili.com` 等 `iframe`、自托管 mp4/webm、第三方嵌入播放器。

示例（蘑菇睡觉）：

```text
title = pvz设计篇：为什么蘑菇需要睡觉
date = 2026-06-18T11:00:44+08:00
description = 从蘑菇睡觉机制切入，讨论设计师为何这样安排。
tags = 植物大战僵尸, 游戏杂谈, 游戏设计
bilibili = https://www.bilibili.com/video/BV1WnjF62EAm/
cover = /images/pvz-mushroom-sleep.jpg
正文仅保留：**B 站：** [链接](同一 URL)
```

验收：http://localhost:1313/videos/ 能看到封面、上传日期与标签；点进详情只有链接可跳转 B 站、**无内嵌播放器**，且日期与 `date` 一致。

## 边界

### ✅ Always（默认就做）

- 只改任务需要的文件和行（通常在 `hugo-site/content/`、`layouts/`、`static/`）
- 用户用中文时，页面与文章文案用中文
- 改完说明：改了哪些文件、浏览器应看到什么、如何自己验证（如 `./bin/hugo.exe server -D -p 1313` → http://localhost:1313）
- 命名与风格遵循上文「编码规范」
- 新增视频时填写 B 站实际上传时间到 `date`，并确保列表/详情能看到该日期；正文只写外链，不嵌 iframe / 播放器
- 新增文章/视频时填写规范 `tags`（首页关键词云依赖它）；整站保持 Book 侧栏，勿擅自换布局风格
- 改首页时保持关键词云规范（统一字号、×N、随机排布、多色），不要改回欢迎文案首页

### ⚠️ Ask first（先问再动）

- 大改已有布局 / 配色 / 整站模板结构
- 新增依赖、主题、构建工具或换框架（React/Vue 等）
- 移动或重命名 `content/`、`layouts/`、部署流程等目录结构
- 改 `config.toml`、GitHub Actions、`baseURL` 等部署相关配置
- 提交 git commit / push（除非用户明确要求）

### 🚫 Never（禁止）

- 不要引入 React/Vue/打包工具替代 Hugo（除非任务写明）
- 不要为了「更好看」大改无关布局与配色
- 不要删掉内容、菜单、部署说明相关结构却不说明
- 不要提交密钥、`.env`、无意义大文件
- 不要改用户未点名的配置（如乱改 git / Cursor 全局设置）
- 不要把可手改源文件的改动只写进 `public/`（下次 build 会丢）
- 不要在视频条目中嵌入 iframe / 播放器 / 自托管视频文件（只保留外链）
