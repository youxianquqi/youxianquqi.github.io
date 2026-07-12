+++
title = "给 AI 用的 HTML 可复用模板：从目录到出片约定"
date = 2026-07-11T09:36:00+08:00
draft = false
tags = ["HTML", "AI", "模板", "科普动画", "录屏"]
description = "基于 ui-templates-catalog 与 science-content-ppt Skill：骨架截图、四模式工作流，以及让 AI 稳定复用的约定。"
+++

做科普 / 答辩 / 录屏素材时，最怕 AI「从零发明一版 UI」：好看一次，下次对不上，录屏参数也不统一。我们把仓库里的 HTML 演示去重抽象成一份目录，再配上 Skill 工作流——目标不是堆模板文件，而是让 AI **先选骨架，再填内容**。

事实源：

- 目录页：`D:\VideoTool\code\ui-templates-catalog.html`（22 页抽象骨架）
- Skill：`.cursor/skills/science-content-ppt/`（模式一～四 + Level2 / Animation 模板族）
- 录屏与实战片段：`reference-repo-templates.md`

## 一、一句话结论

| 你要 | 做 |
|------|----|
| 新科普 → 炫酷轮播 | 模式一：生成 HTML → 读 Level2 `SUMMARY.md` → 选模板重构 |
| 已有 HTML → 平面流程图 | 模式二：默认 `Animation/RNN-3.html` |
| 两人对话演示 | 模式三：只改 `conversation` 数组 |
| 改现有 deck / 横屏录屏 | 模式四：整文件复制最接近的实战 HTML |
| 排队 / 大头移动 | 专用 Skill `ticket-queue-demo`，别硬套 PPT 模板 |

**给 AI 的硬约束：** 占位块先对齐布局；动画 class 统一；切页要能重播；录屏用 URL 参数，不要手改一版「录屏专用副本」。

## 二、目录长什么样（几张骨架截图）

`ui-templates-catalog.html` 把「布局 / 交互」去重成可浏览骨架：左侧导航 + 半屏点击 / 方向键切页；页脚写来源；中间是无真实文案的占位块。本地打开目录页可对照全部 22 页；AI 改版时先说「用第 N 号骨架」，再填文案与数据。下面截几张常见骨架：

![L2 封面标题](/images/ui-tpl-cover.jpg)

*01 · L2 封面标题 — 系列开场*

![L2 双栏 VS](/images/ui-tpl-vs.jpg)

*02 · L2 双栏 VS — 正反对比*

![L2 步骤流程](/images/ui-tpl-steps.jpg)

*03 · L2 步骤流程 — 时间线 / 护栏*

![L2 卡片网格](/images/ui-tpl-cards.jpg)

*04 · L2 卡片网格 — 概念并列*

![答辩 HUD](/images/ui-tpl-defense.jpg)

*10 · 答辩 HUD — 封面 + 半屏点击*

![浅色科普卡片](/images/ui-tpl-light-cards.jpg)

*11 · 浅色科普卡片 — 白底蓝强调*

## 三、Skill 里的四模式（可复用工作流）

### 模式一：科普文本 → PPT 轮播（默认）

1. 用固定提示词生成「单页仿 PPT 轮播」HTML（加大字号、强调样式、逐元素缓入）
2. **禁止 emoji**，改用 Font Awesome / Lucide；动画 class 统一为 `an` / `anim-item`
3. 插入切页动画重置 JS（`cloneNode` 替换，否则第二次切页不播）
4. 读 `templates/PPT Template-level2/SUMMARY.md`，按内容类型选模板重构

Level2 选型速记：

| 内容类型 | 优先系列 |
|----------|----------|
| 对比 / 辩论 | 8-x、6-2 |
| 步骤 / 护栏 | 3-2、6-x |
| 轻量 / 总结 | 3-3、9-3 |
| 警示 / 失败 | 5-x、7-x |
| 案例 / 代码 | 4-x |

回退：`PPT-Generate-3`（视觉效果较好的基础模板）。

### 模式二：流程图

先有模式一输出，再说「生成流程图」。默认 `Animation/RNN-3.html`，只做平面 UI 重构，不另起炉灶写内容。

### 模式三：对话演示

| 触发 | 模板 |
|------|------|
| 生成对话演示 | `Chat-Conversation.html` |
| 生成柔美对话 | `duihua/index.html` |

**只替换** `<script>` 里的 `conversation` 数组，不改 HTML/CSS/JS 结构。

### 模式四：仓库实战 deck

横屏录屏、答辩微调、游戏风表格：整文件复制最接近的源 HTML，再改术语与表头。

```text
录屏 ?record=1&autoplay=N  → pvz/ai-pvz.html
答辩 + HUD + 半屏点击     → 答辩PPT.html
萌系科普                  → 游戏启动器科普.html
白底 + 自动轮播           → 论文/个性化推荐与社会招募.html
```

排队大头移动走 `ticket-queue-demo`，不要硬塞进 Level2。

## 四、让 AI 复用时必须遵守的约定

### 1. 三套动画系统不要混触发

| 系统 | 标记 | 切页重置 |
|------|------|----------|
| keyframes + clone | `.an.fade-in` / `.slide-up` / `.scale-in` | `cloneNode` 替换 |
| transition + stagger | `.anim` + `data-delay` | 切页去掉 `.show` |
| 纯 CSS delay | `.an.up` + `.d1–.d6` | clone 或 visibility |

同一份 deck 选定一套，AI 不得「每页换一套」。

### 2. 录屏三参数（可移植）

```javascript
const p = new URLSearchParams(location.search);
if (p.has('instant')) document.body.classList.add('instant');
if (p.has('record')) document.body.classList.add('is-record');
const autoplaySec = p.has('autoplay') ? Math.max(3, Number(p.get('autoplay')) || 6) : 0;
```

| 参数 | 作用 |
|------|------|
| `record=1` | `body.is-record`：藏 HUD/导航，停装饰动画，放大字号 |
| `instant=1` | 跳过入场动画 |
| `autoplay=N` | N 秒自动翻页（复杂页用 `getSlideDwellMs` 加长停留） |

预览用本地静态服务（如 `py -m http.server`），避免 `file://` 踩坑。

### 3. 给 AI 的提示词骨架（可直接贴）

```text
以 ui-templates-catalog 第 {N} 号骨架 / 或 templates/.../{文件} 为唯一布局参考。
保持结构与 class 命名；只替换文案、数据与占位图。
动画 class 统一为 an（或本文件既有体系），切页必须可重播。
不要引入 React/Vue；不要新增与骨架无关的整页布局。
若用于录屏：支持 ?record=1&instant=1&autoplay=N。
```

### 4. 已知坑

| 问题 | 处理 |
|------|------|
| 切页动画不重播 | 模式一必加 clone 重置 |
| 生成 HTML 过薄 | 要求足够页数 / 分步生成 |
| 流程图无新内容 | 必须先有模式一产物 |
| 录屏裁字 | `is-record` 字号覆盖 + 表格 `minmax` |
| 叠卡压文字 | 规则表视觉区固定高度 |

## 五、技术栈与交付形态

- **前端**：单文件或少文件 HTML5 + CSS3 + 原生 JS（无框架）
- **动画**：CSS keyframes / transition / 少量 Canvas 粒子
- **交付**：浏览器可直接演示；OBS / 系统录屏吃 `?record=1` 全屏页

目录页本身也是「给 AI 看的说明书」：先抽象、再溯源、再复制实战文件——比让模型每次重新设计 UI 稳定一个数量级。

## 六、收束

可复用的不是「又一个好看的 HTML」，而是三层：

1. **抽象目录**（22 骨架）——对齐布局语言  
2. **Skill 四模式**——对齐生成步骤  
3. **录屏 / 动画约定**——对齐出片参数  

下次让 AI 做演示页：先打开 `ui-templates-catalog.html` 点名骨架，再按模式一～四走完；难关（排队舞台、访谈换人）走专用 Skill。默认保守复用，少发明布局，出片会快很多。

---

*路径以 `D:\VideoTool\code` 与 `.cursor/skills/science-content-ppt/` 当前结构为准；模板数量以各目录 `SUMMARY.md` 为准。*
