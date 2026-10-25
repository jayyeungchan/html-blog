# 常用命令

在项目根 `/Users/kit.yeung/Documents/WorkBuddy/blog-html` 下执行。

| 目的 | 命令 |
|---|---|
| 重建索引 | `npm run build`（= `node build.js`） |
| 构建 + 本地预览 | `npm run dev` → http://127.0.0.1:5173 |
| 只起服务器（不重建） | `npm run preview`；端口用 `PORT=8080 npm run preview` |

- 构建输出：`✓ N 篇文章 / M 个分类` + 逐个分类行。数字不对就是扫描范围出了问题。
- 只改 CSS/JS 不用重建，刷新即可；新增/删除/改名文章、改 meta 必须重建。
- 项目**没有** test / lint / format 脚本，不要幻想 `npm test`。

## Git 现状（2026-10-23 已复核）

**仓库根 = 项目根** = `/Users/kit.yeung/Documents/WorkBuddy/blog-html`。早期记忆里「仓库根是上一级 WorkBuddy、混着 oxlint-lab 等杂物」的说法**已失效**，项目已拆成独立仓库。

- remote：`origin git@github.com:jayyeungchan/html-blog.git`，分支 `main` 跟踪 `origin/main`。
- `git ls-files | wc -l` 约 37，含 `.gitignore`、`articles.json`、`sitemap.xml`、`.serena/`（含 memories）与各篇文章。
- 提交**不需要** `blog-html/` 路径前缀，在项目根直接 `git add -A` 即可。
- `render.yaml` 的 `staticPublishPath: .` 现在与真实仓库根一致，可直接接 Render。
- 中文文件名在 shell 与 `git status` 里会显示为八进制转义，路径一律用双引号包住。
- `.playwright-mcp/`、`.workbuddy-ai/` 等工具目录已在 `.gitignore` 中屏蔽。
