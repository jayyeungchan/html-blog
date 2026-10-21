# 技术栈

- **纯静态**：HTML + CSS + 原生 ES Module JS。无框架、无打包器、无 npm 依赖、无 lock 文件。
- `package.json`：`"type": "module"`（`build.js` / `server.js` 用 `import`，不可改回 require），`engines.node >= 18`。
- 仅用 Node 内置模块：`node:fs` / `node:path` / `node:url` / `node:http`。
- 部署：Render static site，`render.yaml` 指定 `NODE_VERSION 20.11.1`、`buildCommand: node build.js`、`staticPublishPath: .`、`autoDeployTrigger: commit`。
- 浏览器端：无 polyfill，无 CDN 依赖；仅用到 `fetch` / `URLSearchParams` / `history.replaceState` / `matchMedia` / `localStorage`。

## 语言服务器

项目用 TypeScript 语言服务器分析 `assets/js/*.js`（serena 默认），无 tsconfig / jsconfig；新文件自动纳入。
