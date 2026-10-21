/* theme.js —— 必须在 <head> 里同步执行，避免深色模式闪白 */
(function () {
  var KEY = 'blog-theme';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#121316' : '#faf8f4');
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
  apply(saved || (media.matches ? 'dark' : 'light'));

  media.addEventListener('change', function (e) {
    var current = null;
    try { current = localStorage.getItem(KEY); } catch (err) { current = null; }
    if (!current) apply(e.matches ? 'dark' : 'light');
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (err) { /* 隐私模式忽略 */ }
  });
})();
