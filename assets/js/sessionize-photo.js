// Keeps the profile photo in sync with Sessionize: the page ships with the
// photo from the last build and swaps in the current one if it changed.
(function () {
  var imgs = document.querySelectorAll('[data-sessionize-photo]');
  var events = document.querySelector('[data-home-events]');
  if (!imgs.length && !events) return;
  // Swap to the live Sessionize photo, reverting to the backup if it fails.
  function setPhoto(img, url) {
    var backup = img.getAttribute('data-fallback');
    img.onerror = function () { img.onerror = null; if (backup) img.src = backup; };
    img.src = url;
  }

  // "Where to find me" on the home page: the next events, refreshed live.
  function renderEvents(list) {
    if (!events || !Array.isArray(list)) return;
    var t = JSON.parse(events.querySelector('[data-home-events-strings]').textContent);
    var pt = t.lang === 'pt-br';
    function parse(v) { var p = String(v).slice(0, 10).split('-').map(Number); return { y: p[0], m: p[1], d: p[2], key: p[0] * 10000 + p[1] * 100 + p[2] }; }
    function range(e) {
      var s = parse(e.eventStartDate), f = parse(e.eventEndDate || e.eventStartDate);
      var sm = t.months[s.m - 1], fm = t.months[f.m - 1];
      if (s.key === f.key) return s.d + ' ' + sm + ' ' + s.y;
      if (s.y === f.y && s.m === f.m) return s.d + '–' + f.d + ' ' + sm + ' ' + s.y;
      if (s.y === f.y) return s.d + ' ' + sm + ' – ' + f.d + ' ' + fm + ' ' + s.y;
      return s.d + ' ' + sm + ' ' + s.y + ' – ' + f.d + ' ' + fm + ' ' + f.y;
    }
    var now = new Date();
    var today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    var next = list.filter(function (e) {
      var s = parse(e.eventStartDate), f = parse(e.eventEndDate || e.eventStartDate);
      var yearLong = s.m === 1 && s.d === 1 && f.m === 12 && f.d === 31;
      return f.key >= today && !yearLong;
    }).sort(function (a, b) { return a.eventStartDate < b.eventStartDate ? -1 : 1; }).slice(0, 3);
    var ul = events.querySelector('[data-home-events-list]');
    ul.replaceChildren.apply(ul, next.map(function (e) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = e.website || 'https://sessionize.com/sschonss/';
      [['home-event-date', range(e)], ['home-event-name', e.name],
       ['home-event-place', e.location ? (pt ? e.location.replace(/, Brazil$/, ', Brasil') : e.location) : '']]
        .forEach(function (p) { if (!p[1]) return; var s = document.createElement('span'); s.className = p[0]; s.textContent = p[1]; a.appendChild(s); });
      li.appendChild(a);
      return li;
    }));
    events.hidden = next.length === 0;
  }

  fetch('https://sessionize.com/api/speaker/json/2n3e2etaad')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      var url = d && d.speaker && d.speaker.photoUrl;
      if (url) imgs.forEach(function (img) { if (img.src !== url) setPhoto(img, url); });
      renderEvents(d && d.events);
    })
    .catch(function () { /* keep the build-time photo */ });
})();
