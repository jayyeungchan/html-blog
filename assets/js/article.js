/* article.js —— 文章页：注入顶栏 / 面包屑 / 目录 / 阅读进度 / 上下篇 */

const $ = (sel) => document.querySelector(sel);
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const currentPath = () => {
  let p = decodeURIComponent(location.pathname).replace(/^\/+/, '');
  return p.replace(/\/$/, '');
};

const fmtDate = (iso) => (iso ? iso.replace(/-/g, '.') : '');

function renderHeader() {
  const box = $('#site-header');
  if (!box) return;
  box.innerHTML = `
    <a class="brand" href="/"><span class="brand-mark" aria-hidden="true"></span><span data-site-title>字里行间</span></a>
    <div class="header-actions">
      <button class="icon-btn" data-theme-toggle aria-label="切换深浅色模式" title="切换深浅色模式">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>
      </button>
      <a class="ghost-btn" href="/">全部文章</a>
    </div>`;
}

function buildTOC() {
  const toc = $('#toc');
  const prose = $('.prose');
  if (!toc || !prose) return;

  const heads = [...prose.querySelectorAll('h2, h3')];
  if (heads.length < 2) {
    toc.remove();
    return;
  }

  heads.forEach((h, i) => {
    if (!h.id) h.id = `h-${i + 1}`;
  });

  toc.innerHTML = `
    <p class="toc-title">目录</p>
    <ol>${heads
      .map(
        (h) =>
          `<li><a href="#${h.id}" class="lvl-${h.tagName === 'H2' ? 2 : 3}">${esc(h.textContent.trim())}</a></li>`
      )
      .join('')}</ol>`;

  const links = [...toc.querySelectorAll('a')];
  const offset = () => ($('.site-header')?.offsetHeight || 64) + 90;

  const onScroll = () => {
    let active = 0;
    heads.forEach((h, i) => {
      if (h.getBoundingClientRect().top <= offset()) active = i;
    });
    links.forEach((a, i) => a.classList.toggle('is-active', i === active));
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function renderProgress() {
  const bar = $('#progress');
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0}%`;
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function renderPostNav(list) {
  const nav = $('#post-nav');
  if (!nav) return;
  const i = list.findIndex((a) => a.path === currentPath());
  if (i === -1) {
    nav.remove();
    return;
  }
  const newer = list[i - 1];
  const older = list[i + 1];
  nav.innerHTML = `
    ${
      newer
        ? `<a class="nav-card" href="/${newer.url}"><span>← 上一篇</span><strong>${esc(newer.title)}</strong></a>`
        : '<div class="nav-card is-empty"></div>'
    }
    ${
      older
        ? `<a class="nav-card is-next" href="/${older.url}"><span>下一篇 →</span><strong>${esc(older.title)}</strong></a>`
        : '<div class="nav-card is-empty"></div>'
    }`;
}

(async function init() {
  renderHeader();
  buildTOC();
  renderProgress();

  try {
    const res = await fetch(`/articles.json?t=${Date.now()}`, { cache: 'no-cache' });
    const data = await res.json();
    const list = data.articles || [];
    const me = list.find((a) => a.path === currentPath());

    document.querySelectorAll('[data-site-title]').forEach((n) => {
      if (data.site?.title) n.textContent = data.site.title;
    });

    if (me) {
      const crumbs = $('#crumbs');
      if (crumbs) {
        crumbs.innerHTML = `<a href="/">首页</a><span>/</span><a href="/?cat=${encodeURIComponent(
          me.category
        )}">${esc(me.category)}</a><span>/</span>正文`;
      }
      const meta = $('#article-meta');
      if (meta) {
        meta.innerHTML = `
          <span>${fmtDate(me.date)}</span>
          <span>·</span>
          <span>${me.minutes} 分钟阅读</span>
          ${(me.tags || []).map((t) => `<span class="post-cat">#${esc(t)}</span>`).join('')}`;
      }
      const sub = $('#article-sub');
      if (sub && me.excerpt && !sub.textContent.trim()) {
        sub.textContent = me.excerpt.replace(/…$/, '');
      }
      document.title = `${me.title} · ${data.site?.title || ''}`.replace(/ · $/, '');
    }

    renderPostNav(list);
  } catch (e) {
    /* 索引缺失时文章正文依然可读，静默降级 */
  }
})();
