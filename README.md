# 字里行间 · 目录即分类的静态博客

一个**零依赖**的静态博客：一级目录就是分类，目录里的 HTML 就是文章，文件名就是标题。
新增文章 = 新增一个 HTML 文件；`git push` 之后 Render 自动构建并上线，首页自动出现新文章。

- 全站只有一份 CSS + 三个小脚本，**没有构建框架、没有 npm 依赖**
- 首页：分类卡片、文章列表、即时搜索（`⌘K` / `/`）、按分类与标签筛选
- 文章页：自动生成目录、阅读进度、上一篇/下一篇、面包屑
- 响应式：手机 / 平板 / 桌面三档，移动端隐藏次要信息而不是缩小一切
- 深浅色主题，跟随系统，可手动切换并记忆

---

## 一、目录结构

```
.
├── index.html                # 首页（分类 + 列表）
├── 404.html                  # 404 页
├── build.js                  # 构建：扫描目录 → 生成 articles.json / sitemap.xml
├── server.js                 # 本地预览服务器（仅开发用）
├── site.config.json          # 站点配置（站点 URL、作者、GitHub 同步）
├── render.yaml               # Render Blueprint
├── articles.json             # 构建产物：全站索引
├── sitemap.xml               # 构建产物：站点地图
├── assets/
│   ├── css/site.css          # 全站样式（设计 token 都在文件顶部）
│   ├── js/theme.js           # 深浅色（提前执行，避免闪白）
│   ├── js/home.js            # 首页逻辑
│   ├── js/article.js         # 文章页逻辑
│   ├── img/favicon.svg
│   ├── img/posters/          # 文章配图：10 张豆瓣海报
│   └── tools/
│       └── oxlint-rules-map.html   # 附页：oxlint 规则地图（不参与扫描，首页页脚与文章里链入）
├── _templates/article.html   # 新文章模板（下划线开头，不参与扫描）
├── 技术/
│   └── oxlint 规则地图.html
└── 随笔/
    └── 我的2026中国影视前十.html
```

**分类 = 一级目录名。** 目前是 `技术/` 和 `随笔/` 各 1 篇；想加「读书笔记」分类，新建一个 `读书笔记/` 文件夹放 HTML 即可。

> 以 `_` 或 `.` 开头的文件和目录会被跳过，`assets/` 也在跳过名单里（见 `site.config.json` 的 `exclude`），
> 所以 `assets/tools/` 下的独立页面只是被链接的「附页」，不会进文章列表。

---

## 二、本地预览

```bash
npm run dev          # 构建 + 启动 http://127.0.0.1:5173
```

只改样式或脚本时，刷新浏览器即可，不需要重启。

---

## 三、写一篇新文章

1. 复制 `_templates/article.html` 到目标分类目录，文件名就是标题，例如：
   `技术/如何给静态站点加搜索.html`
2. 改开头四个 meta（其余保持不动）：

```html
<title>如何给静态站点加搜索 · 字里行间</title>
<meta name="description" content="一句话摘要，会显示在首页列表和搜索结果里。" />
<meta name="date" content="2026-10-21" />
<meta name="tags" content="搜索,静态站点" />
```

3. 在 `<article class="prose">` 里写正文，`<h2>` / `<h3>` 会自动进右侧目录。
4. `git push`。

### 元数据说明

| 字段 | 作用 | 不写会怎样 |
| --- | --- | --- |
| `<title>` | 文章标题（会去掉 ` · 站点名` 后缀） | 退回文件名 |
| `description` | 首页摘要、搜索结果、SEO 描述 | 自动取正文第一段前 110 字 |
| `date` | 排序依据，格式 `YYYY-MM-DD` | 退回文件修改时间 |
| `tags` | 首页标签、搜索关键词 | 无标签 |

阅读时长由正文字数估算（中文 350 字/分钟），不用手写。

---

## 四、修改已有文章

直接改那个 HTML 文件，`git push` 即可。不需要动任何配置、不需要改列表——首页列表是从目录实时扫描出来的。

---

## 五、部署到 Render

### 方式 A：Blueprint（推荐，仓库里已带 `render.yaml`）

1. 把仓库推到 GitHub
2. Render 控制台 → **New +** → **Blueprint** → 选择该仓库 → **Apply**
3. 完成。之后每次 `git push` 到 `main`，Render 自动构建发布

### 方式 B：手动创建 Static Site

| 配置项 | 值 |
| --- | --- |
| Environment | `Static Site` |
| Build Command | `node build.js` |
| Publish Directory | `.` |

因为发布目录就是仓库根目录，构建只是重新生成索引，通常 1–2 秒结束。

---

## 六、关于「提交到 GitHub 就更新，不用部署」

这件事由两层保证：

**第一层：Render 自动部署（默认开启）**
`render.yaml` 里的 `autoDeployTrigger: commit` 意味着 push 之后 Render 自动拉代码、跑 `node build.js`、发布新版本。你不需要点任何按钮——这已经满足「不用手动部署」。

**第二层：前端直读 GitHub（已开启）**
如果希望新文件在 Render 构建完成前就先出现在列表里，`site.config.json` 里的这一段需要是开着的：

```json
"github": {
  "enabled": true,
  "owner": "jayyeungchan",
  "repo": "html-blog",
  "branch": "main"
}
```

首页会额外请求 GitHub 的文件树接口，把索引里还没有的 HTML 文件补进列表（标记 `NEW`，标题暂用文件名，摘要提示等待构建）。
仅适用于**公开仓库**（私有仓库需要 token，不适合放在前端）；接口失败会静默降级，不影响正常浏览。

---

## 七、自定义

| 想改什么 | 改哪里 |
| --- | --- |
| 站名、副标题、作者 | `site.config.json` → `title` / `description` / `author` |
| 站点地址（`sitemap.xml` 用） | `site.config.json` → `url`，换域名时记得改 |
| 主题色、字体、圆角 | `assets/css/site.css` 顶部 `:root` 里的 CSS 变量 |
| 深色模式配色 | 同文件 `[data-theme="dark"]` 区块 |
| 首页文案 | `index.html` 的 `.hero` 区块 |
| 页脚 | `index.html` 与 `_templates/article.html` 的 `.site-footer` |

---

## 八、常见问题

**中文文件名会有问题吗？**
不会。构建时会逐段 `encodeURIComponent`，链接自动编码，浏览器地址栏显示中文，复制分享也正常。

**为什么打开 `index.html` 是空的？**
首页需要 `fetch('/articles.json')`，必须通过 HTTP 访问（`npm run dev` 或线上环境），直接双击文件会被浏览器的本地文件安全策略拦住。

**部署后看不到新文章？**
`articles.json` 已设置为 `no-cache`，页面请求时还带了时间戳。如果仍然不更新，检查 Render 的构建日志里 `✓ N 篇文章` 的数量对不对。

**图片放哪？**
放 `assets/img/`，文章里用绝对路径引用：`<img src="/assets/img/xxx.jpg" alt="描述" />`。

**可以用子目录分类（如 `技术/前端/xx.html`）吗？**
可以，分类取第一级目录（`技术`）。但文章页里的样式路径是绝对路径，所以任意深度都能正常加载。

**想要 RSS？**
`build.js` 末尾已经聚合了全部文章数据，照着 `sitemap.xml` 的写法再生成一份 `feed.xml` 即可，约 20 行。

---

## 九、设计说明

- 字体：标题用宋体系（`Songti SC` / `Noto Serif SC`）营造阅读感，正文用系统无衬线保证可读性，日期与元信息用等宽体
- 主色：砖红 `#a8432c`，只用于强调（分类、链接、进度条、悬停），不做大面积填充
- 间距：以 4px 为基准的松散刻度，文章正文行高 1.85，正文宽度限制在 720px
- 动效：位移不超过 3px，缓动统一 `cubic-bezier(.22,.61,.36,1)`，并完整支持 `prefers-reduced-motion`
