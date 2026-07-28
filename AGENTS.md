# Agent 约定

讨论时先质疑方案是否必要（性能 / 成本 / 复杂度）；有歧义先问，不要无原则迎合。  
改完必须本地预览静态页或确认 `site/` 内容正确，不要只口头说 done。

## 1. 仓库与站点现状

| 项 | 现状 |
|----|------|
| 工作区 | `D:\PCCodes\blog\`（Cursor 打开根） |
| **Git 根** | `hugo-site/` → https://github.com/youxianquqi/youxianquqi.github.io |
| **线上根站** | https://youxianquqi.github.io/ → **`site/`（次元热度）** |
| 形态 | 静态 HTML/CSS/JS + JSON 数据；Pages 直接发布 `site/` |
| 部署 | push `main` → `.github/workflows/deploy.yml` 上传 `./site` |
| 本文件 | `hugo-site/AGENTS.md`（与工作区根 `blog/AGENTS.md` 同步） |

下文路径默认相对 **git 根 `hugo-site/`**。

## 2. Commands

```text
cd hugo-site

# 本地预览公网站点
cd site
py -m http.server 8080
# → http://localhost:8080/

# 发布
# 在 hugo-site/ 提交并 git push origin main
```

不要手改 Actions 产物；以 `site/` 源文件为准。

## 3. 信息架构（当前实现）

```text
https://youxianquqi.github.io/
  /                 → 次元热度热榜（site/index.html）
  /about.html       → 关于
  /tag.html         → 标签页
  /data/public/*.json
  /css /js
  /ai-exam/         → AI 编程合格考试（独立静态应用）
```

| 落点 | 路径 |
|------|------|
| Pages 发布根 | `site/` |
| 次元热度源（本机） | `D:\PCCodes\word\次元热度` |
| AI 考试 | `site/ai-exam/` |

**旧 Hugo 博客**（`content/`、`layouts/`、`static/` 等）仍留在仓库，**不再部署为线上首页**。未经用户明确要求，不要用 Hugo build 覆盖 `site/` 或改回旧博客壳为根站。

## 4. 次元热度（根站）

- 相对路径资源（`css/`、`js/`、`data/public/`），适配 GitHub Pages 用户站根路径。  
- 更新流程：源项目改完 → 同步到 `site/`（**勿删** `site/ai-exam/`）→ push。  
- 数据 JSON 在 `site/data/public/`；采集/构建脚本在源项目 `scripts/`，一般不进 Pages（除非用户要求）。  
- 不要引入 React/Vue 替换本静态站，除非任务写明。

## 5. 独立静态应用 `/ai-exam/`

| 路径 | 公网 |
|------|------|
| `site/ai-exam/` | https://youxianquqi.github.io/ai-exam/ |

规则：相对路径；不提交 `node_modules/`；默认可不加主导航入口。

## 6. 编码规范

| 对象 | 命名 | 示例 |
|------|------|------|
| HTML/CSS class、id | kebab-case | `board__head`、`grad-text` |
| JS | camelCase | `fetchJSON`、`buildKindMap` |
| 静态子应用目录 | kebab-case | `ai-exam/` |

改 `deploy.yml`、仓库结构 —— 未点名不要动。

## 7. 边界

### Always

- 只改任务需要的文件（通常在 `site/`）  
- 中文交流 → 页面文案用中文  
- 改完说明公网应看到什么；本地用 `site/` 静态服务验证  
- 同步次元热度时保留 `site/ai-exam/`  

### Ask first

- 大改根站信息架构 / 换回 Hugo 博客为首页  
- 加依赖、换框架、改部署配置  
- git commit / push（除非用户明确要求）  

### Never

- 用 Hugo `public/` 覆盖当前 Pages 根（当前根是 `site/`）  
- 提交密钥、`.env`、无意义大文件、`node_modules/`  
- 同步次元热度时误删 `ai-exam/`  
- 手改已发布产物代替改 `site/` 源文件  
