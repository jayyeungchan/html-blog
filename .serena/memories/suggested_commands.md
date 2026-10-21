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

## 陷阱：git 根目录不在本项目

`git rev-parse --show-toplevel` 指向 `/Users/kit.yeung/Documents/WorkBuddy`（上一级），`blog-html/` 目前是未跟踪目录。所以：

- 提交时需带路径前缀（如 `git add blog-html/`），且仓库里还混着 `oxlint-lab/`、`.playwright-mcp/` 等无关内容。
- `render.yaml` 假定 **仓库根 = 本项目根**（`staticPublishPath: .`）。直接拿现仓库接 Render 会构建出空站点，需先把 `blog-html` 拆成独立仓库。

## Darwin 环境注意

- 中文文件名在 shell 里需引号；`git status` 会把它们显示为八进制转义。
- 文件系统默认大小写不敏感，但 Render(Linux) 敏感：引用 `Site.css` vs `site.css` 在本地不报错、线上 404。
