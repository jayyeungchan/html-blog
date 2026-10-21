#!/usr/bin/env node
/**
 * build.js —— 内容扫描器
 *
 * 做一件事：把「目录 + HTML 文件」翻译成机器可读的索引。
 *   目录  -> 分类
 *   *.html -> 文章（文件名即标题，<title> 优先）
 *
 * 输出：
 *   articles.json   站点索引（首页 / 文章页共用）
 *   sitemap.xml     给搜索引擎
 *
 * 新增文章 = 新增一个 HTML 文件，重新构建即可，无需改动任何代码。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

const site = {
  title: cfg.title || '未命名博客',
  description: cfg.description || '',
  author: cfg.author || '',
  url: String(cfg.url || '').replace(/\/+$/, ''),
};

const contentRoot = path.resolve(ROOT, cfg.contentRoot || '.');
const excludes = new Set((cfg.exclude || []).map((s) => s.replace(/^\/+/, '')));
const HARD_SKIP = new Set(['node_modules', '.git', '.github', 'dist', 'assets', '_templates', 'scripts']);

const skipDir = (name) => HARD_SKIP.has(name) || name.startsWith('.') || name.startsWith('_');

/* ------------------------------- HTML 解析 ------------------------------- */

const metaTag = (html, key) => {
  const tag = html.match(new RegExp(`<meta[^>]*(?:name|property)\\s*=\\s*["']${key}["'][^>]*>`, 'i'))?.[0];
  if (!tag) return '';
  return (tag.match(/content\s*=\s*["']([\s\S]*?)["']/i)?.[1] || '').trim();
};

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');

const stripTags = (html) =>
  decode(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 中文按字计、英文按词计，约 350 字 / 220 词每分钟 */
function readingMinutes(text) {
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const latin = (text.match(/[A-Za-z]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 350 + latin / 220));
}

function parseArticle(absFile, relPath) {
  const html = fs.readFileSync(absFile, 'utf8');
  const fileName = path.basename(relPath).replace(/\.html?$/i, '');
  const relDir = path.dirname(relPath) === '.' ? '' : path.dirname(relPath);

  // 标题：<title> 去掉站点后缀；否则用文件名
  let title = stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
  if (title) {
    title = title.replace(new RegExp(`\\s*[·|—–-]\\s*${escapeRe(site.title)}\\s*$`), '').trim();
  }
  if (!title) title = metaTag(html, 'og:title') || fileName;

  const body = html.split(/<body[^>]*>/i).pop() || html;
  // 摘要：优先 description；否则取第一个「有内容」的段落（跳过空的 .article-sub）
  const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t.length > 12);
  const description = metaTag(html, 'description') || (paragraphs[0] || '');

  let date = metaTag(html, 'date') || html.match(/<time[^>]*datetime\s*=\s*["']([^"']+)["']/i)?.[1] || '';
  date = date.slice(0, 10);
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (!dateValid) date = fs.statSync(absFile).mtime.toISOString().slice(0, 10);

  const tags = (metaTag(html, 'tags') || metaTag(html, 'keywords') || '')
    .split(/[,，、|]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const bodyText = stripTags(body);
  const url = relPath.split('/').map(encodeURIComponent).join('/');

  return {
    title,
    url,
    path: relPath,
    category: relDir.split('/')[0] || '未分类',
    date,
    dateFromMeta: dateValid,
    tags,
    excerpt: description.length > 110 ? `${description.slice(0, 110)}…` : description,
    minutes: readingMinutes(bodyText),
    words: (bodyText.match(/[\u3400-\u9fff]/g) || []).length + (bodyText.match(/[A-Za-z]+/g) || []).length,
  };
}

/* -------------------------------- 目录遍历 -------------------------------- */

const articles = [];

function walk(dir, rel = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name;
    const relPath = rel ? `${rel}/${name}` : name;
    if (excludes.has(relPath) || (!rel && excludes.has(name))) continue;
    if (entry.isDirectory()) {
      if (skipDir(name)) continue;
      walk(path.join(dir, name), relPath);
    } else if (/\.html?$/i.test(name)) {
      try {
        articles.push(parseArticle(path.join(dir, name), relPath));
      } catch (err) {
        console.warn(`  ! 跳过 ${relPath}：${err.message}`);
      }
    }
  }
}

console.log(`\n  扫描内容目录：${path.relative(ROOT, contentRoot) || '.'}`);
walk(contentRoot, '');

articles.sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title, 'zh') : b.date.localeCompare(a.date)));

/* ------------------------------- 分类聚合 -------------------------------- */

const map = new Map();
for (const a of articles) {
  if (!map.has(a.category)) map.set(a.category, { name: a.category, count: 0, latest: a.date, latestTitle: a.title });
  const c = map.get(a.category);
  c.count += 1;
  if (a.date > c.latest) {
    c.latest = a.date;
    c.latestTitle = a.title;
  }
}
const categories = [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));

/* --------------------------------- 输出 --------------------------------- */

const index = {
  generatedAt: new Date().toISOString(),
  site,
  stats: { articles: articles.length, categories: categories.length },
  sync: cfg.github || null,
  categories,
  articles,
};

fs.writeFileSync(path.join(ROOT, 'articles.json'), `${JSON.stringify(index, null, 2)}\n`);

const urls = [
  { loc: `${site.url}/`, lastmod: articles[0]?.date },
  ...articles.map((a) => ({ loc: `${site.url}/${a.url}`, lastmod: a.date })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${u.loc.replace(/&/g, '&amp;')}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

console.log(`  ✓ ${articles.length} 篇文章 / ${categories.length} 个分类`);
for (const c of categories) console.log(`    · ${c.name}（${c.count}）`);
console.log(`  ✓ articles.json / sitemap.xml 已更新\n`);
