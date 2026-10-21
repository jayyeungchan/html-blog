# blog-html —— 零依赖静态博客「字里行间」

硬约束：**不引入任何 npm 依赖 / 构建框架**。这是项目卖点（见 `技术/为什么这个博客不用框架.html`），提"装个 xxx"即违背设计。

## 心智模型

- 一级目录 = 分类；目录里的 `*.html` = 文章；文件名 = 标题。
- 新增文章 = 复制 `_templates/article.html` 到分类目录。不改任何代码/配置。
- 唯一构建产物：`build.js` 扫盘 → `articles.json`（首页与文章页共用的索引）+ `sitemap.xml`。
- 页面是**手写完整 HTML**，不是模板渲染；JS 只在运行时做增强（注入顶栏、目录、筛选），无 JS 时文章正文仍可读。

## 源文件地图

| 文件 | 职责 |
|---|---|
| `build.js` | 唯一构建脚本。扫描 → 解析 meta → 排序 → 写 `articles.json` / `sitemap.xml` |
| `server.js` | 仅开发用的静态服务器，127.0.0.1:5173，无依赖 |
| `site.config.json` | 站点元信息 + `contentRoot` / `exclude` / `github` 同步开关 |
| `index.html` | 首页骨架，容器 id：`#cat-grid` `#chips` `#post-list` `#q` `#hero-meta` `#empty` |
| `assets/js/home.js` | 首页全部逻辑（分类卡/筛选/搜索/URL 同步） |
| `assets/js/article.js` | 文章页增强（顶栏/面包屑/元信息/目录/进度/上下篇） |
| `assets/js/theme.js` | 深浅色，**必须同步在 `<head>`** |
| `assets/css/site.css` | 全站唯一样式表，按编号分区 |
| `_templates/article.html` | 新文章模板（`_` 开头 → 不参与扫描） |
| `render.yaml` | Render Blueprint（static site） |

## 全局不变量（改代码前必读）

1. **所有站内链接是根绝对路径**（`/技术/xxx.html`、`/assets/...`）。站点必须部署在域名根，不能挂子路径。
2. **扫描排除**：`site.config.json.exclude`（index/404/assets/_templates）+ `build.js` 里 `HARD_SKIP`（node_modules/.git/.github/dist/assets/_templates/scripts）+ 任何 `_`、`.` 开头的目录。新建工具目录时用 `_` 前缀即可自动隐身。
3. **URL 与索引靠 `path` 字段对齐**：`article.js` 用 `decodeURIComponent(location.pathname)` 去掉首尾斜杠后与 `articles.json` 的 `a.path` 全等匹配。文章路径一旦改动，上下篇/面包屑/元信息会静默失效（不报错）。
4. **分类取相对路径第一段**；根目录下的 html 会归为 `未分类`。
5. `index.html` 必须经 HTTP 访问：首页靠 `fetch('/articles.json')`，`file://` 下必然空白。
6. 文章页的 `<h2>`/`<h3>` 少于 2 个时 `article.js` 会直接移除 TOC 节点；给标题加 id 由脚本负责，手写可覆盖。
7. `articles.json` 由构建覆盖写入，**不要手改**；首页/文章页请求都带 `?t=Date.now()` 破缓存，Render 侧另配 no-cache 头。

## 相关记忆

- 技术栈与版本约束 → `mem:tech_stack`
- 常用命令（含 git 根目录陷阱） → `mem:suggested_commands`
- 写作/代码风格约定 → `mem:conventions`
- 收工前必须跑什么 → `mem:task_completion`
