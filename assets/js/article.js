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
