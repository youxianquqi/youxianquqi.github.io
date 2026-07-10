# Hugo 本地博客系统

## 简介
一个最小化 Hugo 博客，使用 Markdown 撰写文章与视频条目，无需数据库。支持热重载、本地预览。

## 快速启动

### 1. 启动本地服务器
```powershell
cd d:/PCCodes/blog/hugo-site
./bin/hugo.exe server -D -p 1313
```

### 2. 打开浏览器
访问 http://localhost:1313

### 3. 新增内容
```powershell
./bin/hugo.exe new posts/my-article.md
./bin/hugo.exe new videos/my-video.md
```

### 4. 生成静态站点
```powershell
./bin/hugo.exe -D
```
生成的文件在 `public/` 目录下。

## 目录结构
```
hugo-site/
├── config.toml
├── content/
│   ├── _index.md          # 首页
│   ├── posts/             # 文章
│   └── videos/            # 视频
├── layouts/
│   ├── index.html
│   ├── videos/list.html   # 视频双列封面列表
│   └── _default/
├── static/
│   ├── css/style.css
│   └── images/
├── bin/hugo.exe
└── public/
```

## 常用命令
| 命令 | 说明 |
|------|------|
| `./bin/hugo.exe server -D -p 1313` | 本地预览 |
| `./bin/hugo.exe new posts/title.md` | 新建文章 |
| `./bin/hugo.exe new videos/title.md` | 新建视频 |
| `./bin/hugo.exe -D` | 生成静态站（含草稿） |

约定细节见仓库根目录 `AGENTS.md`。
