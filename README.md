# Hugo 博客（曲奇的技术笔记）

线上：https://youxianquqi.github.io/  
仓库：https://github.com/youxianquqi/youxianquqi.github.io  

Book 侧栏布局；首页为技术关键词云（汇总文章/视频的 `tags`，重复标 `×N`）。内容用 Markdown，无数据库；push `main` 后由 GitHub Actions 发布到 Pages。

## 快速启动

```powershell
cd d:/PCCodes/blog/hugo-site
./bin/hugo.exe server -D -p 1313
```

浏览器打开 http://localhost:1313

## 常用命令

| 命令 | 说明 |
|------|------|
| `./bin/hugo.exe server -D -p 1313` | 本地预览 |
| `./bin/hugo.exe new posts/title.md` | 新建文章 |
| `./bin/hugo.exe new videos/title.md` | 新建视频 |
| `./bin/hugo.exe --gc --minify` | 生产构建（与 CI 一致） |

## 目录结构

```text
hugo-site/          ← git 根目录
├── config.toml
├── content/
│   ├── _index.md   # 首页（云图由 layouts 生成）
│   ├── posts/      # 文章
│   └── videos/     # 视频
├── layouts/
│   ├── index.html  # 关键词云
│   ├── videos/list.html
│   └── _default/
├── static/
│   ├── css/style.css
│   └── images/
├── AGENTS.md       # Agent / 内容约定
├── bin/hugo.exe
└── public/         # 构建输出（gitignore）
```

写文章/视频请带 `tags`（首页云图依赖）与 `description`。完整约定见 `AGENTS.md`。

独立静态应用（不影响博客壳）：[AI 编程合格考试](https://youxianquqi.github.io/ai-exam/)（源文件在 `static/ai-exam/`）。
