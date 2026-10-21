/* home.js —— 首页：分类卡片 / 文章列表 / 搜索 / 筛选 */

const state = { all: [], cat: 'all', tag: null, q: '', site: {} };

const $ = (sel) => document.querySelector(sel);
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtDate = (iso) => (iso ? iso.replace(/-/g, '.') : '刚刚');
const encodePath = (p) => p.split('/').map(encodeURIComponent).join('/');

/* ------------------------------- 数据加载 ------------------------------- */

async function loadIndex() {
  const res = await fetch(`/articles.json?t=${Date.now()}`, { cache: 'no-cache' });
  if (!res.ok) throw new Error('articles.json 读取失败，请先执行 npm run build');
  return res.json();
}

/**
 * 可选：直接从 GitHub 读取仓库文件树。
 * 开启后，push 上去的新 HTML 无需等待构建就会出现在列表里。
 * 仅对公开仓库有效（私有仓库需 token，不适合放在前端）。
 */
async function syncFromGitHub(cfg) {
  if (!cfg || !cfg.enabled || !cfg.owner || !cfg.repo) return [];
  try {
    const api = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/trees/${cfg.branch || 'main'}?recursive=1`;
    const res = await fetch(api, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return [];
    const { tree = [] } = await res.json();
    const known = new Set(state.all.map((a) => a.path));
    const skip = (p) =>
      /^(assets|node_modules|_templates|dist|scripts)\//.test(p) || ['index.html', '404.html'].includes(p);

    return tree
      .filter((n) => n.type === 'blob' && /\.html?$/i.test(n.path) && !known.has(n.path) && !skip(n.path))
      .map((n) => {
        const parts = n.path.split('/');
        const name = parts.pop().replace(/\.html?$/i, '');
        return {
          title: name,
          url: encodePath(n.path),
          path: n.path,
          category: parts[0] || '未分类',
          date: null,
          tags: [],
          excerpt: '这个文件刚提交到仓库，等待下一次构建后即可补全摘要与日期。',
          minutes: 1,
          pending: true,
        };
      });
  } catch (e) {
    return [];
  }
}

/* -------------------------------- 渲染 -------------------------------- */

function renderSite() {
  const { title, description, author } = state.site;
  if (title) {
    document.title = `${title} · 灯下独记`;
    document.querySelectorAll('[data-site-title]').forEach((n) => (n.textContent = title));
  }
  if (description) {
    document.querySelectorAll('[data-site-desc]').forEach((n) => (n.textContent = description));
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }
  if (author) document.querySelectorAll('[data-site-author]').forEach((n) => (n.textContent = author));

  const total = state.all.length;
  const cats = new Set(state.all.map((a) => a.category)).size;
  const el = $('#hero-meta');
  if (el) {
    el.innerHTML = `<span><i></i>${total} 篇文章</span><span><i></i>${cats} 个分类</span>${
      state.all[0]?.date ? `<span><i></i>最近更新 ${fmtDate(state.all[0].date)}</span>` : ''
    }`;
  }
}

function renderCategories() {
  const grid = $('#cat-grid');
  if (!grid) return;
  const map = new Map();
  state.all.forEach((a) => {
    if (!map.has(a.category)) map.set(a.category, { name: a.category, count: 0, latestTitle: a.title, latest: a.date });
    const c = map.get(a.category);
    c.count += 1;
    if ((a.date || '9999') >= (c.latest || '')) {
      c.latest = a.date;
      c.latestTitle = a.title;
    }
  });

  grid.innerHTML = [...map.values()]
    .sort((a, b) => b.count - a.count)
    .map(
      (c) => `
      <button class="cat-card${state.cat === c.name ? ' is-active' : ''}" data-cat="${esc(c.name)}" aria-pressed="${
        state.cat === c.name
      }">
        <div class="cat-card-top">
          <h3>${esc(c.name)}</h3>
          <span class="cat-count">${c.count}</span>
        </div>
        <p>${esc(c.latestTitle)}</p>
      </button>`
    )
    .join('');
}

function renderChips() {
  const box = $('#chips');
  if (!box) return;
  const cats = [...new Set(state.all.map((a) => a.category))];
  const items = [`<button class="chip${state.cat === 'all' ? ' is-active' : ''}" data-cat="all">全部</button>`]
    .concat(
      cats.map(
        (c) =>
          `<button class="chip${state.cat === c ? ' is-active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`
      )
    );
  if (state.tag) items.push(`<button class="chip is-active" data-clear-tag="1"># ${esc(state.tag)} ✕</button>`);
  box.innerHTML = items.join('');
}

function filtered() {
  const q = state.q.trim().toLowerCase();
  return state.all.filter((a) => {
    if (state.cat !== 'all' && a.category !== state.cat) return false;
    if (state.tag && !a.tags.includes(state.tag)) return false;
    if (!q) return true;
    return [a.title, a.excerpt, a.category, ...(a.tags || [])].join(' ').toLowerCase().includes(q);
  });
}

function renderList() {
  const list = $('#post-list');
  const empty = $('#empty');
  const count = $('#list-count');
  const rows = filtered();

  if (count) {
    count.textContent =
      state.cat === 'all' && !state.q && !state.tag ? `${state.all.length} ARTICLES` : `${rows.length} MATCHED`;
  }

  if (!rows.length) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  list.innerHTML = rows
    .map(
      (a) => `
    <article class="post">
      <time class="post-date" datetime="${a.date || ''}">${fmtDate(a.date)}</time>
      <div class="post-body">
        <h3 class="post-title">
          <a class="post-link" href="/${a.url}">${esc(a.title)}</a>
          ${a.pending ? '<span class="badge-new">NEW</span>' : ''}
        </h3>
        <p class="post-excerpt">${esc(a.excerpt)}</p>
        <div class="post-meta">
          <span class="post-cat">${esc(a.category)}</span>
          <span>${a.minutes} 分钟阅读</span>
          ${(a.tags || []).map((t) => `<span class="post-sep">·</span><button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}
        </div>
      </div>
      <span class="post-arrow" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </article>`
    )
    .join('');
}

function render() {
  renderCategories();
  renderChips();
  renderList();
  syncURL();
}

function syncURL() {
  const p = new URLSearchParams();
  if (state.cat !== 'all') p.set('cat', state.cat);
  if (state.tag) p.set('tag', state.tag);
  if (state.q) p.set('q', state.q);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

/* -------------------------------- 交互 -------------------------------- */

function bindEvents() {
  document.addEventListener('click', (e) => {
    const catBtn = e.target.closest('[data-cat]');
    if (catBtn) {
      const next = catBtn.dataset.cat;
      state.cat = state.cat === next && next !== 'all' ? 'all' : next;
      render();
      return;
    }
    const tagBtn = e.target.closest('[data-tag]');
    if (tagBtn) {
      state.tag = tagBtn.dataset.tag;
      render();
      return;
    }
    if (e.target.closest('[data-clear-tag]') || e.target.closest('#reset-filter')) {
      state.tag = null;
      state.cat = 'all';
      state.q = '';
      const input = $('#q');
      if (input) input.value = '';
      render();
    }
  });

  const input = $('#q');
  let timer;
  input?.addEventListener('input', (e) => {
    clearTimeout(timer);
    const v = e.target.value;
    timer = setTimeout(() => {
      state.q = v;
      renderList();
      syncURL();
    }, 120);
  });

  document.addEventListener('keydown', (e) => {
    const isFocusKey = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
    if (isFocusKey || (e.key === '/' && document.activeElement !== input)) {
      e.preventDefault();
      input?.focus();
      input?.select();
    }
    if (e.key === 'Escape' && document.activeElement === input) {
      input.value = '';
      state.q = '';
      renderList();
      syncURL();
      input.blur();
    }
  });
}

/* -------------------------------- 启动 -------------------------------- */

(async function init() {
  const params = new URLSearchParams(location.search);
  state.cat = params.get('cat') || 'all';
  state.tag = params.get('tag') || null;
  state.q = params.get('q') || '';
  const input = $('#q');
  if (input && state.q) input.value = state.q;

  try {
    const data = await loadIndex();
    state.site = data.site || {};
    state.all = data.articles || [];
    renderSite();
    render();

    const extra = await syncFromGitHub(data.sync);
    if (extra.length) {
      state.all = [...extra, ...state.all];
      render();
    }
  } catch (err) {
    $('#post-list').innerHTML = `<div class="empty"><strong>索引读取失败</strong>${esc(err.message)}</div>`;
  }

  bindEvents();

  // Windows / Linux 显示 Ctrl K，而不是 ⌘K
  const kbd = document.querySelector('.search kbd');
  if (kbd && !/Mac|iPhone|iPad/i.test(navigator.userAgent)) kbd.textContent = 'Ctrl K';

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
