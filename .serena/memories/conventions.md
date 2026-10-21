# 代码与内容约定

## 文章 HTML

- 元信息只靠 4 个标签，必须放在 `<head>`：`<title>`（含 ` · 站点名` 后缀，构建时会剔除）、`<meta name="description">`、`<meta name="date" content="YYYY-MM-DD">`、`<meta name="tags" content="a,b">`（分隔符支持 `,` `，` `、` `|`）。
- 正文容器固定为 `<article class="prose">`；只有 `h2`/`h3` 进目录，`h1` 留给页面标题。
- 正文宽度 720px、行高 1.85，由 `.prose` 控制，不要在文章里写内联宽度。
- 图片放 `assets/img/`，引用必须 `/assets/img/...` 绝对路径。竖版海报类图片用 `figure.poster` 包住（`img` + `figcaption`），样式已在 `site.css` 中配好（宽 232px 居中、`loading="lazy"`）。
- 文件名即标题即 URL：用中文短句，不加空格/标点。

## 站点文案（用户审美要求高，改前先读这段）

博客名固定为「字里行间」，不改。首页 hero 有三处文案，改动时**三处都要改**：

1. `index.html` hero 静态文本
2. `site.config.json` 的 `description`（运行时由 `home.js` 覆盖页面，**实际显示的以它为准**）
3. `assets/js/home.js` 里 `document.title` 的后缀

现役文案：眉标 `纸上千年 · 屏前一瞬`；副标 `史书翻到第几页，代码就写到第几行。剩下的念头没处安放，就散在字里行间。`

审美要求（用户两次打回后确定）：
- 要文艺、要具象意象，靠双关和时间对照制造余味（代码的「行」呼应博客名）。
- **禁止**直接罗列「人文历史 / 科技技术 / 思想随笔」这类抽象分类词，用户明确说过不要照抄他的描述。
- 副标控制在 40 字内（`.hero p` 限宽 46ch，超了会折成两行）。

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

## 写作风格（博客有明确的「去 AI 味」要求，用户会指定 humanizer skill）

- 第一人称判断，不中立罗列；句子长短交错。
- 用「」引号，不用弯引号；不堆破折号，不用「不仅…更是」式排比。
- 不写空泛形容词（见证了、彰显了、值得一提的是、不难发现）。
- 不使用破折号打断句子；不虚构个人观影/生活细节，判断基于公开数据与观察。

## 两个容易踩坑的布局决定

- **整行可点**靠 `.post-link::after` 绝对定位铺满 `.post`，`.tag` 按钮需 `z-index: 1` 才能浮在其上可点击。禁止把 `<button>` 套进 `<a>`。
- 分类网格用 `grid-template-columns: repeat(auto-fill, ...)` 而非 `auto-fit`：`auto-fit` 会在最后一行只剩一个分类时把卡片拉满整行。
