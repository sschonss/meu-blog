// Site-wide behaviour: the "also in your language" suggestion and Umami click events.
(function () {
  var LANG_KEY = 'preferredLang';
  var DISMISS_KEY = 'langSuggestDismissed';
  var pageLang = (document.documentElement.lang || 'en').toLowerCase();

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } }
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  // Umami may be absent (local builds, blockers): tracking must never break the page.
  function track(name, props) {
    try { if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, props); } catch (e) {}
  }

  // ---- Language suggestion --------------------------------------------------
  var box = document.querySelector('[data-lang-suggest]');
  if (box) {
    var target = box.getAttribute('data-target');
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''])
      .map(function (l) { return String(l).toLowerCase(); });
    // The visitor's top preference between the two languages the site has.
    var top = langs.filter(function (l) { return l.indexOf('pt') === 0 || l.indexOf('en') === 0; })[0] || '';
    var browserPT = top.indexOf('pt') === 0;
    var wants = target === 'pt-br' ? browserPT : !browserPT;
    var chosen = read(LANG_KEY);
    if (wants && !read(DISMISS_KEY) && chosen !== pageLang) {
      box.hidden = false;
      // Umami loads with `defer`, so wait a moment before counting the impression.
      setTimeout(function () { track('lang-suggest-shown', { to: target, path: location.pathname }); }, 1500);
    }
    var close = box.querySelector('[data-lang-suggest-close]');
    if (close) close.addEventListener('click', function () {
      box.hidden = true;
      store(DISMISS_KEY, '1');
      track('lang-suggest-dismiss', { to: target, path: location.pathname });
    });
  }

  // ---- Click events -----------------------------------------------------------
  function text(el, sel) {
    var n = sel ? el.querySelector(sel) : el;
    return n ? n.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  }

  function describe(a) {
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (e) { return null; }
    var from = location.pathname;

    // Explicit data-track="name" data-track-key="value" attributes win.
    var name = a.getAttribute('data-track');
    if (name) {
      var props = { from: from };
      Array.prototype.forEach.call(a.attributes, function (at) {
        if (at.name.indexOf('data-track-') === 0) props[at.name.slice(11)] = at.value;
      });
      return [name, props];
    }

    if (a.closest('.hextra-language-options') || a.classList.contains('article-translation')) {
      var to = url.pathname.indexOf('/pt-br/') === 0 ? 'pt-br' : 'en';
      return ['translation-click', { via: a.classList.contains('article-translation') ? 'article' : 'menu', to: to, from: from }];
    }
    if (a.classList.contains('talk-link')) return ['talk-click', { talk: text(a), from: from }];
    if (a.closest('.talk-related')) return ['talk-article-click', { talk: text(a.closest('.talk-card'), 'h3'), to: url.pathname, from: from }];
    if (a.closest('.article-talk')) return ['article-talk-click', { talk: text(a), from: from }];
    if (a.closest('.home-events')) return ['event-click', { event: text(a, '.home-event-name'), via: 'home', from: from }];
    if (a.closest('.event-item')) return ['event-click', { event: text(a, '.event-name'), from: from }];
    if (a.closest('.article-series')) return ['series-click', { to: url.pathname, from: from }];
    if (a.closest('.article-pager')) return ['pager-click', { dir: a.classList.contains('is-prev') ? 'prev' : 'next', to: url.pathname, from: from }];
    if (/(^|\.)linkedin\.com$/.test(url.hostname)) return ['social-click', { network: 'linkedin', from: from }];
    if (/(^|\.)github\.com$/.test(url.hostname)) return ['social-click', { network: 'github', from: from }];
    if (url.host === location.host && /\/index\.xml$/.test(url.pathname)) return ['social-click', { network: 'rss', from: from }];
    if (/(^|\.)sessionize\.com$/.test(url.hostname)) return ['sessionize-profile', { from: from }];
    if (url.host !== location.host && /^https?:$/.test(url.protocol)) return ['outbound', { host: url.hostname, url: url.href.slice(0, 200), from: from }];
    return null;
  }

  // External links open in a new tab, so readers keep the blog open. This covers
  // every link, including the ones in old imported articles and the talk cards
  // drawn in the browser. Links inside the blog stay in the same tab.
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a || a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (e) { return; }
    if (!/^https?:$/.test(url.protocol) || url.host === location.host) return;
    a.target = '_blank';
    var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
    if (rel.indexOf('noopener') < 0) rel.push('noopener');
    a.setAttribute('rel', rel.join(' '));
  }, true);

  // Newsletter sign-ups (the form opens Buttondown in a new tab).
  document.addEventListener('submit', function (ev) {
    if (ev.target.closest && ev.target.closest('[data-newsletter-form]')) track('newsletter-subscribe', { from: location.pathname });
  }, true);

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var d = describe(a);
    // Remember an explicit language choice so the suggestion doesn't nag afterwards.
    if (d && d[0] === 'translation-click' && d[1].to) store(LANG_KEY, d[1].to);
    if (d) track(d[0], d[1]);
  }, true);
})();
