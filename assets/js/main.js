/* ============================================================
   MCHLauncherForPy · 官网交互
   纯原生 JS，无外部依赖，支持直接以 file:// 打开
   ============================================================ */
(function () {
  'use strict';

  document.body.classList.add('js-ready');

  /* 复制按钮同时用于命令与下载提取密码 */

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 顶部滚动进度 + 导航实底 ---------- */
  var progress = $('#scrollProgress');
  var nav = $('#nav');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = Math.min(100, (y / max) * 100) + '%';
    if (nav) nav.classList.toggle('is-solid', y > 24);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- 移动端菜单 ---------- */
  var toggle = $('#navToggle');
  var menu = $('#mobileMenu');
  function setMenu(open) {
    if (!toggle || !menu) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    var use = toggle.querySelector('use');
    if (use) use.setAttribute('href', open ? '#i-x' : '#i-menu');
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
  }
  if (menu) {
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', function (e) {
    if (menu && !menu.hidden && nav && !nav.contains(e.target)) setMenu(false);
  });

  /* ---------- 滚动显现 ---------- */
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 导航当前板块高亮 ---------- */
  var sections = ['features', 'ui', 'download', 'faq'];
  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        $$('.nav-links a').forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('data-nav') === entry.target.id);
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  /* ---------- 数字计数 ---------- */
  var stats = $$('.stat b[data-count]');
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target) || reduceMotion) { el.textContent = target; return; }
    var start = performance.now(), duration = 900;
    function step(now) {
      var p = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) || target;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var statObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { statObserver.observe(el); });
  } else {
    stats.forEach(animateCount);
  }

  /* ---------- 复制命令 ---------- */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  $$('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || '';
      var done = function (ok) {
        var label = btn.innerHTML;
        btn.classList.toggle('is-copied', ok);
        btn.innerHTML = ok
          ? '<svg class="ic ic-sm" aria-hidden="true"><use href="#i-check"/></svg> 已复制'
          : '<svg class="ic ic-sm" aria-hidden="true"><use href="#i-x"/></svg> 请手动复制';
        window.setTimeout(function () { btn.innerHTML = label; btn.classList.remove('is-copied'); }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  });

  /* ---------- FAQ 手风琴（同一时间只展开一项） ---------- */
  var faqItems = $$('.faq-item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) { if (other !== item) other.open = false; });
    });
  });

  /* ---------- Hero 界面示意：点击「启动游戏」的装饰反馈 ---------- */
  var mockLaunch = $('#mockLaunch');
  var mockProgress = $('#mockProgress');
  if (mockLaunch && mockProgress) {
    var running = false;
    mockLaunch.addEventListener('click', function () {
      if (running) return;
      running = true;
      var original = mockLaunch.innerHTML;
      mockLaunch.classList.add('is-running');
      mockProgress.classList.add('is-on');
      var bar = $('i', mockProgress);
      bar.style.width = '0%';
      requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = '100%'; }); });
      mockLaunch.innerHTML = '<svg class="ic ic-sm" aria-hidden="true"><use href="#i-zap"/></svg> 正在启动…';
      window.setTimeout(function () {
        mockLaunch.innerHTML = '<svg class="ic ic-sm" aria-hidden="true"><use href="#i-check"/></svg> 已启动 · 界面示意';
      }, reduceMotion ? 200 : 1750);
      window.setTimeout(function () {
        mockLaunch.classList.remove('is-running');
        mockLaunch.innerHTML = original;
        mockProgress.classList.remove('is-on');
        bar.style.width = '0%';
        running = false;
      }, reduceMotion ? 600 : 3400);
    });
  }
})();
