# GitHub Pages 部署快速指南

## ⚡ 快速上手（5分钟）

### 1️⃣ 在 GitHub 创建仓库
```
仓库名: username.github.io
(把 username 改成你的GitHub用户名)
```

### 2️⃣ 修改配置
编辑 `config.toml`，改这一行：
```toml
baseURL = "https://username.github.io/"
```

### 3️⃣ 初始化 Git（第一次）
```powershell
cd d:\PCCodes\blog\hugo-site
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/username.github.io.git
git branch -M main
git push -u origin main
```

### 4️⃣ 在 GitHub 启用 Pages
- 仓库 → Settings → Pages
- Source: `Deploy from a branch`
- Branch: `gh-pages` / `/` (root)
- Save

✅ 完成！稍等 1-2 分钟访问 `https://username.github.io`

---

## 📝 之后每次更新

### 发表新文章
```powershell
.\bin\hugo.exe new posts/我的新文章.md
# 编辑文章...
```

### 推送到 GitHub
```powershell
git add .
git commit -m "新增文章：我的新文章"
git push
```

自动构建并部署，1-2 分钟生效！

---

## 🔧 本地预览

```powershell
# 开发环境（含草稿）
.\bin\hugo.exe server -D -p 1313

# 访问 http://localhost:1313
```

---

## ❓ 常见问题

| 问题 | 解决 |
|------|------|
| 页面还是旧的 | 清除浏览器缓存，等待 2 分钟 |
| 404 找不到 | 检查 config.toml 中 baseURL 是否正确 |
| Actions 失败 | 查看 Actions 页面的日志输出 |
| 域名不生效 | DNS 需要 5-30 分钟生效 |

---

## 🚀 自动部署工作流

GitHub Actions 已配置，推送后自动：
1. 检出代码
2. 安装 Hugo
3. 构建网站
4. 部署到 gh-pages 分支
5. 更新 GitHub Pages

**无需手动构建！只需写 Markdown。**

---

**建议** 收藏本文档，后续部署只需记住：
```powershell
# 编辑 content/posts/
# 然后...
git add .
git commit -m "your message"
git push
```

就这么简单！🎉
