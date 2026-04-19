# GitHub 部署快速指南（含踩坑总结）

本文基于本项目实战过程整理，目标是让 Hugo 博客稳定部署到 GitHub Pages 并可公网访问。

## 一次部署的关键步骤

### 1. 仓库命名与远程地址

- 用户主页站点建议使用仓库名：`<username>.github.io`
- 本项目示例：`youxianquqi.github.io`
- 远程仓库应为：
  `https://github.com/youxianquqi/youxianquqi.github.io.git`

### 2. 修改 Hugo 配置

编辑 `config.toml`，确认：

```toml
baseURL = "https://youxianquqi.github.io/"
languageCode = "zh-CN"
```

`baseURL` 不能保留占位符 `https://username.github.io/`，否则资源路径会错。

### 3. 使用 GitHub Actions 官方 Pages 流程

工作流文件：`.github/workflows/deploy.yml`

必须包含：

- `actions/configure-pages`
- `actions/upload-pages-artifact`
- `actions/deploy-pages`
- 权限：
  - `pages: write`
  - `id-token: write`

说明：这是当前推荐方式，不依赖手动推送 `gh-pages` 分支。

### 4. 推送代码触发部署

```powershell
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

### 5. 在正确入口启用 Pages

路径是“仓库设置”，不是“个人账号设置”：

- 进入仓库：`youxianquqi/youxianquqi.github.io`
- `Settings` -> `Pages`
- `Build and deployment` -> `Source` 选择 `GitHub Actions`

完成后查看：

- `Actions` 页签：最新工作流绿色成功
- 站点地址：`https://youxianquqi.github.io/`

---

## 本次部署踩坑总结

### 坑 1：进错了 Pages 页面

现象：
- 打开了“头像 -> Settings -> Pages”

问题：
- 这是账号级页面（主要用于域名验证），不是仓库发布入口。

正确做法：
- 必须进入“仓库 -> Settings -> Pages”配置发布源。

### 坑 2：旧工作流仍在运行

现象：
- Actions 显示 `Deploy Hugo Blog`
- 日志里用的是 `peaceiris/actions-gh-pages@v3`

问题：
- 这是旧方案，和当前 Pages 官方流程不同。

正确做法：
- 确保新工作流文件已提交并推送到 `main`。
- 触发后应看到新任务名（例如 `Deploy Hugo Site`）和 `deploy-pages` 步骤。

### 坑 3：403 Permission denied to github-actions[bot]

现象：
- 推送 `gh-pages` 时失败，返回 403。

根因：
- 旧方案尝试用 bot 直接推分支，权限或仓库策略不匹配。

正确做法：
- 改用官方 Pages Actions 三段式流程（artifact + deploy-pages）。
- 在仓库 `Settings -> Pages` 中把 Source 设为 `GitHub Actions`。

### 坑 4：本地 Hugo 构建缓存目录权限问题

现象：
- 本地构建报错：
  无法创建 `C:\Users\...\hugo_cache` 目录（Access denied）。

解决：

```powershell
$env:HUGO_CACHEDIR='D:\PCCodes\blog\hugo-site\.hugo_cache'
.\bin\hugo.exe --gc --minify
```

---

## 部署后更新文章的最短流程

```powershell
.\bin\hugo.exe new posts/my-post.md
# 编辑文章后
git add .
git commit -m "Add new post"
git push origin main
```

GitHub Actions 会自动重新构建并发布，通常 1-3 分钟生效。

---

## 快速排查清单

1. `config.toml` 的 `baseURL` 是否为真实域名地址。
2. 仓库 `Settings -> Pages` 的 Source 是否为 `GitHub Actions`。
3. Actions 最新运行是否成功（绿色）。
4. 是否仍在跑旧工作流（包含 `actions-gh-pages@v3`）。
5. 浏览器是否清缓存后重试。

---

最后更新时间：2026-04-19
