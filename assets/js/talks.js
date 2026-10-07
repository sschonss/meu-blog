// Refreshes the talks page with live data from the Sessionize API.
// The page is already rendered at build time; this only replaces it with
// fresher data. If the request fails, a link to the Sessionize profile is shown.
(function () {
  var root = document.querySelector('[data-talks]');
  var stringsEl = document.getElementById('talks-strings');
  if (!root || !stringsEl) return;

  var t = JSON.parse(stringsEl.textContent);
  var pt = t.lang === 'pt-br';
  var slot = function (name) { return root.querySelector('[data-slot="' + name + '"]'); };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  // Sessionize dates are midnight UTC; read them as plain calendar dates.
  function parse(value) {
    var p = String(value).slice(0, 10).split('-').map(Number);
    return { y: p[0], m: p[1], d: p[2], key: p[0] * 10000 + p[1] * 100 + p[2] };
  }

  function formatRange(e) {
    var s = parse(e.eventStartDate), f = parse(e.eventEndDate || e.eventStartDate);
    var sm = t.months[s.m - 1], fm = t.months[f.m - 1];
    if (s.y === f.y && s.m === 1 && s.d === 1 && f.m === 12 && f.d === 31) return t.throughoutYear.replace('{year}', s.y);
    if (s.key === f.key) return s.d + ' ' + sm + ' ' + s.y;
    if (s.y === f.y && s.m === f.m) return s.d + '–' + f.d + ' ' + sm + ' ' + s.y;
    if (s.y === f.y) return s.d + ' ' + sm + ' – ' + f.d + ' ' + fm + ' ' + s.y;
    return s.d + ' ' + sm + ' ' + s.y + ' – ' + f.d + ' ' + fm + ' ' + f.y;
  }

  function location(e) {
    if (!e.location) return '';
    return pt ? e.location.replace(/, Brazil$/, ', Brasil') : e.location;
  }

  function eventItem(e, upcoming) {
    var meta = formatRange(e) + (location(e) ? ' · ' + location(e) : '');
    return el('li', { 'class': 'event-item' + (upcoming ? ' is-upcoming' : '') }, [
      el('a', { href: e.website || t.profile, 'aria-label': e.name + ' — ' + t.eventSite }, [
        el('span', { 'class': 'event-name', text: e.name }),
        el('span', { 'class': 'event-meta' }, [el('time', { datetime: e.eventStartDate, text: meta })])
      ])
    ]);
  }

  function section(title, children) {
    return el('section', { 'class': 'profile-section' }, [el('h2', { text: title })].concat(children));
  }

  function plain(html, max) {
    var text = (new DOMParser().parseFromString(html || '', 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, '') + ' …';
  }

  function render(data) {
    var events = data.events || [], sessions = data.sessions || [];
    var now = new Date();
    var today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    var upcoming = [], past = [], cities = {};

    events.forEach(function (e) {
      (parse(e.eventEndDate || e.eventStartDate).key >= today ? upcoming : past).push(e);
      if (e.location) cities[e.location] = true;
    });
    upcoming.sort(function (a, b) { return a.eventStartDate < b.eventStartDate ? -1 : 1; });
    past.sort(function (a, b) { return a.eventStartDate < b.eventStartDate ? 1 : -1; });

    var out = [];
    if (events.length || sessions.length) {
      out.push(el('dl', { 'class': 'speaker-stats' }, [
        [t.statEvents, events.length], [t.statTalks, sessions.length], [t.statCities, Object.keys(cities).length]
      ].map(function (s) {
        return el('div', {}, [el('dt', { text: s[0] }), el('dd', { text: String(s[1]) })]);
      })));
    }

    if (upcoming.length) {
      out.push(section(t.upcomingEvents, [el('ul', { 'class': 'event-list' }, upcoming.map(function (e) { return eventItem(e, true); }))]));
    }

    if (sessions.length) {
      out.push(section(t.talksSection, [
        el('div', { 'class': 'talk-grid' }, sessions.map(function (s) {
          return el('a', { 'class': 'talk-card', href: s.sessionUrl || t.profile }, [
            el('div', { 'class': 'talk-icon', text: '↗' }),
            el('div', {}, [
              el('h3', { text: s.title }),
              el('p', { text: plain(s.description, 210) }),
              el('span', { text: t.viewTalk + ' →' })
            ])
          ]);
        })),
        t.abstractsNote ? el('p', { 'class': 'talk-lang-note', text: t.abstractsNote }) : null
      ]));
    }

    if (past.length) {
      var years = [];
      past.forEach(function (e) { var y = parse(e.eventStartDate).y; if (years.indexOf(y) < 0) years.push(y); });
      out.push(section(t.pastEvents, years.map(function (y) {
        return el('div', { 'class': 'event-year' }, [
          el('h3', { text: String(y) }),
          el('ul', { 'class': 'event-list' }, past.filter(function (e) { return parse(e.eventStartDate).y === y; }).map(function (e) { return eventItem(e, false); }))
        ]);
      })));
    }

    var live = slot('live');
    live.replaceChildren.apply(live, out);

    var sp = data.speaker || {};
    if (sp.tagline) slot('tagline').textContent = sp.tagline;
    if (sp.photoUrl) { slot('photo').src = sp.photoUrl; slot('photo').hidden = false; }
    slot('fallback').hidden = events.length + sessions.length > 0;
  }

  function fail() {
    slot('fallback').hidden = false;
  }

  t.profile = root.getAttribute('data-profile');
  var controller = 'AbortController' in window ? new AbortController() : null;
  var timer = controller && setTimeout(function () { controller.abort(); }, 8000);

  fetch(root.getAttribute('data-api'), controller ? { signal: controller.signal } : {})
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(render)
    .catch(fail)
    .then(function () { if (timer) clearTimeout(timer); });
})();
