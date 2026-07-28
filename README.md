# 次元热度 · TagHeat（GitHub Pages）

线上：**https://youxianquqi.github.io/**  
仓库：https://github.com/youxianquqi/youxianquqi.github.io  

当前公网站点为 **次元热度** 静态站（`site/`），不是 Hugo 博客壳。

| 路径 | 内容 |
|------|------|
| `/` | 次元热度热榜 |
| `/about.html` | 关于 |
| `/tag.html` | 标签详情 |
| `/ai-exam/` | AI 编程合格考试（保留） |

源项目：`D:\PCCodes\word\次元热度` → 同步进仓库 `site/`。

## 本地预览

```powershell
cd D:\PCCodes\blog\hugo-site\site
# 任选静态服务器，例如：
py -m http.server 8080
# → http://localhost:8080/
```

## 更新站点

1. 在 `D:\PCCodes\word\次元热度` 改完并生成 `data/public`  
2. 覆盖同步到 `hugo-site/site/`（保留 `site/ai-exam/`）  
3. `git push origin main` → Actions 发布  

## 仓库里其它目录

| 目录 | 说明 |
|------|------|
| `site/` | **当前 Pages 发布根** |
| `content/` `layouts/` `static/` 等 | 旧 Hugo 博客源码，**不再作为线上首页**；勿与 `site/` 混淆 |
| `AGENTS.md` | Agent 约定 |

完整约定见 `AGENTS.md`。
