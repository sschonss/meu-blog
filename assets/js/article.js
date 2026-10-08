// Builds the "On this page" table of contents from the article's headings
// and highlights the section being read. Imported Hashnode articles use raw
// HTML headings (some without ids), so this runs in the browser.
(function () {
  var nav = document.querySelector('[data-toc]');
  var content = document.querySelector('[data-article-content]');
  if (!nav || !content) return;

  var headings = Array.prototype.slice.call(content.querySelectorAll('h2, h3'));
  if (!headings.length) return;
  // Articles that only use h3 treat it as the top level.
  var hasH2 = headings.some(function (h) { return h.tagName === 'H2'; });
  var top = hasH2 ? 'H2' : 'H3';
  headings = headings.filter(function (h) { return h.textContent.trim(); });
  if (headings.filter(function (h) { return h.tagName === top; }).length < 3) return;

  var used = {};
  function slug(text) {
    var base = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
    var id = base, n = 2;
    while (used[id] || (document.getElementById(id) && !used[id])) id = base + '-' + n++;
    used[id] = true;
    return id;
  }

  var list = nav.querySelector('[data-toc-list]');
  var links = [];
  var lastTop = null; // last top-level <li>, to nest h3 under h2
  headings.forEach(function (h) {
    if (!h.id) h.id = slug(h.textContent); else used[h.id] = true;
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent.trim();
    li.appendChild(a);
    links.push({ heading: h, link: a });
    if (h.tagName === top || !lastTop) {
      list.appendChild(li);
      if (h.tagName === top) lastTop = li;
    } else {
      var sub = lastTop.querySelector('ol') || lastTop.appendChild(document.createElement('ol'));
      sub.appendChild(li);
    }
  });
  nav.hidden = false;

  // Collapse the inline TOC on small screens; the wide-screen rail stays open.
  var details = nav.querySelector('details');
  var wide = window.matchMedia('(min-width: 1360px)');
  function sync() { details.open = wide.matches; }
  sync();
  if (wide.addEventListener) wide.addEventListener('change', sync);

  // Highlight the section currently in view.
  var ticking = false;
  function update() {
    ticking = false;
    var current = null;
    for (var i = 0; i < links.length; i++) {
      if (links[i].heading.getBoundingClientRect().top < window.innerHeight * 0.3) current = links[i];
    }
    links.forEach(function (l) { l.link.classList.toggle('is-active', l === current); });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

// Reading progress: a thin bar at the top that fills as the article is read.
(function () {
  var bar = document.querySelector('[data-reading-progress] span');
  var content = document.querySelector('[data-article-content]');
  if (!bar || !content) return;
  var ticking = false;
  function update() {
    ticking = false;
    var r = content.getBoundingClientRect();
    var total = r.height - window.innerHeight * 0.6;
    var done = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    bar.style.transform = 'scaleX(' + done + ')';
  }
  function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
})();

// "Copy link" in the share buttons.
(function () {
  var btn = document.querySelector('[data-copy-link]');
  if (!btn) return;
  var label = btn.textContent;
  btn.addEventListener('click', function () {
    var url = btn.getAttribute('data-copy-link');
    var done = function () {
      btn.textContent = btn.getAttribute('data-copied');
      btn.classList.add('is-done');
      setTimeout(function () { btn.textContent = label; btn.classList.remove('is-done'); }, 2000);
      try { if (window.umami) window.umami.track('share', { network: 'copy', from: location.pathname }); } catch (e) {}
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt('', url); });
    } else {
      window.prompt('', url);
    }
  });
})();

// Image zoom: click an image in the article to see it full screen.
(function () {
  var content = document.querySelector('[data-article-content]');
  if (!content) return;
  var imgs = Array.prototype.filter.call(content.querySelectorAll('img'), function (img) { return !img.closest('a'); });
  if (!imgs.length) return;

  var overlay = document.createElement('div');
  overlay.className = 'img-zoom';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  var big = document.createElement('img');
  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'img-zoom-close';
  close.textContent = '×';
  close.setAttribute('aria-label', content.getAttribute('data-close-label') || 'Close');
  overlay.appendChild(big);
  overlay.appendChild(close);
  document.body.appendChild(overlay);

  var opener = null;
  function open(img) {
    opener = img;
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    overlay.hidden = false;
    document.documentElement.classList.add('img-zoom-open');
    close.focus();
    try { if (window.umami) window.umami.track('image-zoom', { from: location.pathname }); } catch (e) {}
  }
  function shut() {
    overlay.hidden = true;
    document.documentElement.classList.remove('img-zoom-open');
    if (opener) opener.focus();
  }
  imgs.forEach(function (img) {
    img.classList.add('is-zoomable');
    img.tabIndex = 0;
    img.addEventListener('click', function () { open(img); });
    img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  });
  overlay.addEventListener('click', shut);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) shut(); });
})();
