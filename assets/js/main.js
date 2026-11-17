/* Minimal Scholar v4 — Hugo port.
   Taxonomy, dates, active menu, category tree, recent and related posts are now rendered by Hugo
   at build time; this script only handles what needs the browser. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var pageType = body.getAttribute('data-page') || '';
  var isPost = pageType === 'item';
  var HLJS = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
  var KATEX = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/';

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function rm(n) { if (n.parentNode) n.parentNode.removeChild(n); }
  function loadScript(src, cb) { var s = doc.createElement('script'); s.src = src; s.async = true; if (cb) s.onload = cb; doc.head.appendChild(s); }
  function loadCss(href) { var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = href; doc.head.appendChild(l); }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (res) {
      var ta = doc.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      body.appendChild(ta); ta.select(); try { doc.execCommand('copy'); } catch (e) {} body.removeChild(ta); res();
    });
  }
  var params = null; try { params = new URLSearchParams(location.search); } catch (e) {}
  var q = params ? params.get('q') : null;

  // ===== LANGUAGE — 한 / 한·영 / EN =====
  // Content: class="ko" / class="en" on blocks or inline spans ({{< ko >}} / {{< en >}} shortcodes,
  // {.ko} / {.en} block attributes, or raw HTML); unmarked content shows in every mode.
  var LANGS = ['ko', 'both', 'en'], LANG_NAME = { ko: '한국어', both: '한국어·영어', en: 'English' };
  var rebuildToc = null, updateReading = null;
  function globalLang() { var l = root.getAttribute('data-lang'); return LANGS.indexOf(l) >= 0 ? l : 'ko'; }
  // Same rule as the CSS: drop the other language only if this block actually has both
  function dropOtherLang(box, mode) {
    if (mode === 'ko' && box.querySelector('.ko')) $$('.en', box).forEach(rm);
    else if (mode === 'en' && box.querySelector('.en')) $$('.ko', box).forEach(rm);
  }
  function shownIn(el, box, mode) {
    if (mode === 'both') return true;
    var x = el.closest('.ko, .en');
    return !x || !box.contains(x) || x.classList.contains(mode) || !box.querySelector('.' + mode);
  }
  function textIn(el, mode) {
    var c = el.cloneNode(true);
    if (mode === 'both') $$('.ko + .en', c).forEach(function (n) { n.insertAdjacentText('beforebegin', ' · '); });
    else dropOtherLang(c, mode);
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  // Wrappers added by the script (table-wrap, code-block) inherit the language class
  function moveLang(from, to) { ['ko', 'en'].forEach(function (c) { if (from.classList.contains(c)) { from.classList.remove(c); to.classList.add(c); } }); }
  // {ko, en} -> title markup (search results; everything else is rendered by Hugo)
  function fillTitle(el, ko, en) {
    if (!en) { el.textContent = ko; return; }
    var sk = doc.createElement('span'); sk.className = 'ko'; sk.textContent = ko;
    var se = doc.createElement('span'); se.className = 'en title-en'; se.lang = 'en'; se.textContent = en;
    el.appendChild(sk); el.appendChild(se); el.classList.add('i18n');
  }

  // 1. Dark mode (initial value already set in <head>); giscus follows the theme
  var toggle = $('#themeToggle');
  function isDark() { return root.getAttribute('data-theme') === 'dark'; }
  function syncGiscus(t) {
    var f = $('iframe.giscus-frame');
    if (f && f.contentWindow) f.contentWindow.postMessage({ giscus: { setConfig: { theme: t } } }, 'https://giscus.app');
  }
  function setTheme(t, persist) {
    root.setAttribute('data-theme', t);
    if (toggle) toggle.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    if (persist) { try { localStorage.setItem('theme', t); } catch (e) {} }
    syncGiscus(t);
  }
  setTheme(isDark() ? 'dark' : 'light', false);
  if (toggle) toggle.addEventListener('click', function () { setTheme(isDark() ? 'light' : 'dark', true); });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onMq = function (e) { var saved = null; try { saved = localStorage.getItem('theme'); } catch (x) {} if (!saved) setTheme(e.matches ? 'dark' : 'light', false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  if (q && $('#searchInput')) $('#searchInput').value = q;

  // 2. Post body
  var postBody = $('.post-single .post-body');
  if (postBody) {
    // 2a. Reading time (Korean ~500 chars/min, English ~230 words/min), counting only the language shown
    if (isPost) updateReading = function (mode) {
      var clone = postBody.cloneNode(true);
      $$('pre, script, style', clone).forEach(rm);
      dropOtherLang(clone, mode);
      var text = clone.textContent || '';
      var koN = (text.match(/[가-힣]/g) || []).length;
      var en = (text.replace(/[가-힣]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
      var mins = Math.max(1, Math.round(koN / 500 + en / 230));
      var rt = $('.js-reading'), rtt = $('.js-reading-text');
      if (rt && rtt) { rtt.textContent = mins + '분 읽기'; rt.hidden = false; }
    };

    // 2b. Scrollable tables
    $$('table', postBody).forEach(function (t) {
      if (t.parentNode.classList && t.parentNode.classList.contains('table-wrap')) return;
      var w = doc.createElement('div'); w.className = 'table-wrap';
      t.parentNode.insertBefore(w, t); w.appendChild(t); moveLang(t, w);
    });

    // 2c. Table of contents, rebuilt for the language shown (section 3 calls rebuildToc)
    var toc = $('#postToc'), tocList = $('#tocList');
    if (toc && tocList) {
      var allHs = $$('h2, h3', postBody);
      allHs.forEach(function (h, i) { if (!h.id) h.id = 'sec-' + (i + 1); });
      rebuildToc = function (mode) {
        var hs = allHs.filter(function (h) { return shownIn(h, postBody, mode); });
        var hasH2 = hs.some(function (h) { return h.tagName === 'H2'; });
        tocList.innerHTML = '';
        toc.hidden = hs.length < 2;
        if (toc.hidden) return;
        var lastTop = null, sub = null, n2 = 0, n3 = 0;
        hs.forEach(function (h) {
          var li = doc.createElement('li'), a = doc.createElement('a'), num = doc.createElement('span');
          num.className = 'post-toc__num'; a.href = '#' + h.id; a.textContent = textIn(h, mode);
          li.appendChild(num); li.appendChild(a);
          if (h.tagName === 'H3' && hasH2 && lastTop) {
            if (!sub) { sub = doc.createElement('ol'); lastTop.appendChild(sub); }
            num.textContent = n2 + '.' + (++n3); sub.appendChild(li);
          } else {
            num.textContent = ++n2; n3 = 0; sub = null; lastTop = li; tocList.appendChild(li);
          }
        });
      };
      var tg = $('#tocToggle');
      if (tg) tg.addEventListener('click', function () {
        var open = tg.getAttribute('aria-expanded') === 'true';
        tg.setAttribute('aria-expanded', open ? 'false' : 'true');
        tg.textContent = open ? '펼치기' : '접기';
        tocList.hidden = open;
      });
    }

    // 2d. Code blocks: language bar, copy button, line numbers, highlight on demand
    var pres = $$('pre', postBody);
    if (pres.length) {
      pres.forEach(function (pre) {
        if (pre.closest('.code-block')) return;
        var code = pre.querySelector('code');
        if (!code) { code = doc.createElement('code'); while (pre.firstChild) code.appendChild(pre.firstChild); pre.appendChild(code); }
        var lines = code.textContent.replace(/\n+$/, '').split('\n').length;
        var m = /(?:language|lang)-([\w+-]+)/.exec(code.className + ' ' + pre.className);
        var lang = m ? m[1] : '';
        if (lang && code.className.indexOf('language-') < 0) code.classList.add('language-' + lang);

        var wrap = doc.createElement('div'); wrap.className = 'code-block';
        var bar = doc.createElement('div'); bar.className = 'code-block__bar';
        var lab = doc.createElement('span'); lab.className = 'code-block__lang'; lab.textContent = lang;
        var btn = doc.createElement('button'); btn.type = 'button'; btn.className = 'code-block__copy'; btn.textContent = 'Copy';
        btn.addEventListener('click', function () {
          copyText(code.textContent).then(function () {
            btn.textContent = 'Copied'; btn.classList.add('is-copied');
            setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('is-copied'); }, 1600);
          });
        });
        bar.appendChild(lab); bar.appendChild(btn);
        pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(bar); wrap.appendChild(pre); moveLang(pre, wrap);

        if (lines > 2) {
          var nums = doc.createElement('span'); nums.className = 'code-block__lines'; nums.setAttribute('aria-hidden', 'true');
          var s = ''; for (var i = 1; i <= lines; i++) s += i + (i < lines ? '\n' : '');
          nums.textContent = s; pre.insertBefore(nums, code); pre.classList.add('has-lines');
        }
      });
      loadScript(HLJS, function () {
        if (!window.hljs) return;
        window.hljs.configure({ ignoreUnescapedHTML: true });
        $$('.code-block pre code', postBody).forEach(function (code) {
          if (code.classList.contains('nohighlight') || code.classList.contains('language-text')) return;
          window.hljs.highlightElement(code);
          var mm = /language-([\w+-]+)/.exec(code.className);
          var lab = code.closest('.code-block').querySelector('.code-block__lang');
          if (mm && lab && !lab.textContent && mm[1] !== 'undefined') lab.textContent = mm[1];
        });
      });
    }

    // 2e. Math on demand (Hugo's passthrough extension leaves the delimiters untouched)
    if (/\$\$|\\\(|\\\[|\$[^$\s][^$\n]*\$/.test(postBody.textContent)) {
      loadCss(KATEX + 'katex.min.css');
      loadScript(KATEX + 'katex.min.js', function () {
        loadScript(KATEX + 'contrib/auto-render.min.js', function () {
          if (!window.renderMathInElement) return;
          window.renderMathInElement(postBody, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '\\[', right: '\\]', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false }
            ],
            ignoredClasses: ['code-block'],
            throwOnError: false
          });
        });
      });
    }
  }

  // 3. Language: per-language list snippets, header toggle (whole site) + per-post switch (this post only)
  var art = $('.post-single'), langBtn = $('#langToggle'), postLang = $('#postLang');
  $$('template.i18n-src').forEach(function (tpl) {
    var src = tpl.content, it = tpl.closest('.post-item');
    if (it && src && src.querySelector('.ko') && src.querySelector('.en')) {
      var box = doc.createElement('div'); box.className = 'post-item__snips i18n';
      ['ko', 'en'].forEach(function (l) {
        // work on the inert template copy so images inside never start loading
        var f = src.cloneNode(true);
        $$('pre, script, style, noscript, figcaption, .footnotes', f).forEach(rm);
        dropOtherLang(f, l);
        $$('p, div, li, h1, h2, h3, h4, td, th, blockquote', f).forEach(function (n) { n.insertAdjacentText('beforeend', ' '); });
        var t = f.textContent.replace(/\s+/g, ' ').trim();
        if (!t) return;
        var p = doc.createElement('p'); p.className = 'post-item__snippet ' + l;
        p.textContent = t.length > 300 ? t.slice(0, 300) + '…' : t;
        box.appendChild(p);
      });
      var old = $('.post-item__snippet', it), ttl = $('.post-item__title', it);
      if (old) old.parentNode.replaceChild(box, old);
      else if (ttl) ttl.parentNode.insertBefore(box, ttl.nextSibling);
    }
    rm(tpl);
  });
  $$('.en').forEach(function (el) { if (!el.hasAttribute('lang')) el.setAttribute('lang', 'en'); });

  function effLang() { return (art && art.getAttribute('data-lang-local')) || globalLang(); }
  function syncLang() {
    var m = effLang();
    if (langBtn) langBtn.setAttribute('aria-label', '언어 전환 (현재 ' + LANG_NAME[globalLang()] + ')');
    if (postLang) $$('button', postLang).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang-set') === m ? 'true' : 'false'); });
    if (rebuildToc) rebuildToc(m);
    if (updateReading) updateReading(m);
  }
  if (art && postLang) {
    var pb = $('.post-body', art);
    if ($('.post-single__title.i18n', art) || (pb && $('.ko', pb) && $('.en', pb))) postLang.hidden = false;
    postLang.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang-set]'); if (!b) return;
      art.setAttribute('data-lang-local', b.getAttribute('data-lang-set'));
      syncLang();
    });
  }
  if (langBtn) langBtn.addEventListener('click', function () {
    var next = LANGS[(LANGS.indexOf(globalLang()) + 1) % LANGS.length];
    root.setAttribute('data-lang', next);
    try { localStorage.setItem('lang', next); } catch (e) {}
    $$('[data-lang-local]').forEach(function (el) { el.removeAttribute('data-lang-local'); });
    syncLang();
  });
  root.setAttribute('data-lang', globalLang());
  syncLang();

  // 4. Share links (properly encoded); bilingual titles are shared as "한글 | English"
  var shareRow = $('.share-row');
  if (shareRow) {
    var canon = ($('link[rel="canonical"]') || {}).href || location.href.split('#')[0].split('?')[0];
    var title = shareRow.getAttribute('data-share-title') || doc.title;
    $$('[data-share]', shareRow).forEach(function (el) {
      var k = el.getAttribute('data-share');
      if (k === 'x') el.href = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(canon) + '&text=' + encodeURIComponent(title);
      else if (k === 'facebook') el.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(canon);
      else if (k === 'copy') el.addEventListener('click', function () {
        var o = el.textContent;
        copyText(canon).then(function () { el.textContent = '복사됨'; setTimeout(function () { el.textContent = o; }, 1600); });
      });
    });
  }

  // 5. Search page: substring match (every term) over title, categories, tags and body; title hits first
  var sres = $('#searchResults');
  if (sres) {
    var qs = (q || '').trim();
    var sTitle = $('#searchTitle'), sCount = $('#searchCount');
    var note = function (t) { sres.innerHTML = ''; var p = doc.createElement('p'); p.className = 'empty-state'; p.textContent = t; sres.appendChild(p); };
    if (!qs) note('검색어를 입력하세요.');
    else {
      if (sTitle) sTitle.textContent = '“' + qs + '”';
      doc.title = qs + ' · ' + doc.title;
      fetch(sres.getAttribute('data-index')).then(function (r) { return r.json(); }).then(function (items) {
        var terms = qs.toLowerCase().split(/\s+/).filter(Boolean);
        var hits = [];
        items.forEach(function (it) {
          var head = [it.ko, it.en, (it.cats || []).join(' '), (it.tags || []).join(' ')].join(' ').toLowerCase();
          var hay = head + ' ' + (it.text || '').toLowerCase();
          if (terms.every(function (t) { return hay.indexOf(t) >= 0; })) {
            hits.push({ it: it, score: terms.filter(function (t) { return head.indexOf(t) >= 0; }).length });
          }
        });
        hits.sort(function (a, b) { return b.score - a.score; }); // stable: keeps newest-first within a score
        if (sCount) sCount.textContent = hits.length + '개의 글';
        if (!hits.length) { note('검색 결과가 없습니다.'); return; }
        sres.innerHTML = '';
        hits.forEach(function (h) {
          var it = h.it, text = it.text || '', low = text.toLowerCase(), i = -1;
          for (var k = 0; k < terms.length && i < 0; k++) i = low.indexOf(terms[k]);
          var art = doc.createElement('article'); art.className = 'post-item';
          var bd = doc.createElement('div'); bd.className = 'post-item__body';
          var meta = doc.createElement('div'); meta.className = 'post-meta';
          var tm = doc.createElement('time'); tm.setAttribute('datetime', it.iso); tm.textContent = it.date; meta.appendChild(tm);
          var h2 = doc.createElement('h2'); h2.className = 'post-item__title';
          var a = doc.createElement('a'); a.href = it.url; fillTitle(a, it.ko, it.en); h2.appendChild(a);
          var sn = doc.createElement('p'); sn.className = 'post-item__snippet';
          if (i >= 0) {
            var s0 = Math.max(0, i - 60), t = text.slice(s0, s0 + 220);
            sn.textContent = (s0 > 0 ? '…' : '') + t + (s0 + 220 < text.length ? '…' : '');
          } else sn.textContent = it.summary || '';
          bd.appendChild(meta); bd.appendChild(h2); if (sn.textContent) bd.appendChild(sn);
          art.appendChild(bd); sres.appendChild(art);
        });
      }).catch(function () { note('검색 색인을 불러오지 못했습니다.'); });
    }
  }

  // 6. Comments: load giscus with the current theme (only rendered when configured in hugo.toml)
  var gc = $('.giscus[data-repo-id]');
  if (gc && gc.getAttribute('data-repo-id')) {
    var gs = doc.createElement('script');
    gs.src = 'https://giscus.app/client.js'; gs.async = true; gs.crossOrigin = 'anonymous';
    ['repo', 'repo-id', 'category', 'category-id', 'mapping', 'strict', 'reactions-enabled', 'emit-metadata', 'input-position', 'lang'].forEach(function (k) {
      var v = gc.getAttribute('data-' + k); if (v) gs.setAttribute('data-' + k, v);
    });
    gs.setAttribute('data-theme', isDark() ? 'dark' : 'light');
    gs.setAttribute('data-loading', 'lazy');
    gc.appendChild(gs);
  }

  // 7. Back to top
  var btt = $('#backToTop');
  if (btt) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { btt.classList.toggle('is-visible', window.scrollY > 600); ticking = false; });
    }, { passive: true });
    btt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
})();
