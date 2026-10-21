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

## Git 现状（易误判，务必先看这一条）

项目本身**已被 git 跟踪**：`git ls-files . | wc -l` 约为 30，含 `.gitignore`、`articles.json`、`sitemap.xml` 与各篇文章。
但仓库根（`git rev-parse --show-toplevel`）是上一级 `/Users/kit.yeung/Documents/WorkBuddy`，里面还混着 `oxlint-lab/`、`.playwright-mcp/` 等无关内容。

因此：

- 提交时**必须带路径前缀**（`git add "blog-html/随笔/xxx.html"`），在仓库根直接 `git add -A` 会把 WorkBuddy 下的杂物一起卷进去。
- `render.yaml` 写的是 `staticPublishPath: .`，即假定**仓库根 = 项目根**。现状下直接接 Render 会把整个 WorkBuddy 目录都发布出去，需要先把 `blog-html` 拆成独立仓库。
- 中文文件名在 shell 与 `git status` 里会显示为八进制转义，路径一律用双引号包住。
- `.playwright-mcp/`（Playwright MCP 的截图/快照）会落在项目根，已在本项目 `.gitignore` 中屏蔽。
