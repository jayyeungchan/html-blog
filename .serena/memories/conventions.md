# 代码与内容约定

## 文章 HTML

- 元信息只靠 4 个标签，必须放在 `<head>`：`<title>`（含 ` · 站点名` 后缀，构建时会剔除）、`<meta name="description">`、`<meta name="date" content="YYYY-MM-DD">`、`<meta name="tags" content="a,b">`（分隔符支持 `,` `，` `、` `|`）。
- 正文容器固定为 `<article class="prose">`；只有 `h2`/`h3` 进目录，`h1` 留给页面标题。
- 正文宽度 720px、行高 1.85，由 `.prose` 控制，不要在文章里写内联宽度。
- 图片放 `assets/img/`，引用必须 `/assets/img/...` 绝对路径。
- 文件名即标题即 URL：用中文短句，不加空格/标点。

## JS

- 无模块化拆分，`home.js` / `article.js` 各自一个 IIFE 入口（`(async function init(){...})()`），共用的是复制而非 import。
- 每个文件顶部自带小工具：`$ = sel => document.querySelector(sel)`、`esc()` 转义。**任何拼进 innerHTML 的变量必须过 `esc()`**，否则中文标题里的 `&`/`<` 会破坏结构。
- 路径编码统一 `p.split('/').map(encodeURIComponent).join('/')`（逐段编码，保留 `/`）。
- 事件用**文档级委托**（`document.addEventListener('click', e => e.target.closest('[data-cat]'))`），因为列表是反复重渲染的，不绑单个节点。
- 搜索输入 120ms 防抖；快捷键 `⌘K`/`Ctrl+K` 与 `/` 聚焦，`Esc` 清空。

## CSS

- 单文件 `site.css`，**按编号分区**（1.Reset 2.Token 3.Base … 11.Article page … Responsive），新增样式插到对应区段而不是文件尾。
- 设计 token 全在顶部 `:root`（颜色/间距/圆角/字体/缓动），深色覆盖在 `[data-theme="dark"]`；**不在组件里写硬编码颜色**。
- 主题切换靠 `<html data-theme>`，状态存 `localStorage['blog-theme']`；`theme.js` 必须在 `<head>` 同步执行，否则深色模式闪白。
- 字体分工：标题宋体系（`Songti SC`/`Noto Serif SC`），正文系统无衬线，日期/元信息等宽。
- 主色砖红 `#a8432c`，仅用于强调，不做大面积填充。
- 动效：位移 ≤ 3px，缓动统一 `cubic-bezier(.22,.61,.36,1)`，且必须尊重 `prefers-reduced-motion`。

## 两个容易踩坑的布局决定

- **整行可点**靠 `.post-link::after` 绝对定位铺满 `.post`，`.tag` 按钮需 `z-index: 1` 才能浮在其上可点击。禁止把 `<button>` 套进 `<a>`。
- 分类网格用 `grid-template-columns: repeat(auto-fill, ...)` 而非 `auto-fit`：`auto-fit` 会在最后一行只剩一个分类时把卡片拉满整行。
