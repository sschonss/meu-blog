// Talk feedback form. Sends the answers to a Google Form and shows a thank-you.
// Google Forms does not allow reading the response from another site
// (no-cors), so a request that reaches it counts as sent.
(function () {
  var form = document.querySelector('[data-feedback]');
  if (!form) return;

  var t = JSON.parse(document.getElementById('feedback-strings').textContent);
  var thanks = document.querySelector('.feedback-thanks');
  var errorBox = form.querySelector('.feedback-error');
  var button = form.querySelector('button[type="submit"]');
  var buttonLabel = button.textContent;

  // ?t=<session id>&e=<event id> pre-selects the talk and the event (QR codes).
  var params = new URLSearchParams(location.search);
  function preselect(select, id) {
    if (!id) return;
    Array.prototype.forEach.call(select.options, function (option) {
      if (option.getAttribute('data-id') === id) select.value = option.value;
    });
  }
  preselect(form.elements.talk, params.get('t'));
  preselect(form.elements.event, params.get('e'));

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  }

  function track(name, data) {
    try { if (window.umami) window.umami.track(name, data); } catch (e) { /* analytics is optional */ }
  }

  form.addEventListener('change', function () { showError(''); });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var f = form.elements;
    var rating = form.querySelector('input[name="rating"]:checked');

    if (!f.talk.value) { showError(t.needTalk); f.talk.focus(); return; }
    if (!rating) { showError(t.needRating); form.querySelector('.stars input').focus(); return; }

    // A filled honeypot means a bot: pretend it worked and send nothing.
    if (f.website.value) { done(); return; }

    var body = new URLSearchParams();
    body.append(form.getAttribute('data-entry-talk'), f.talk.value);
    body.append(form.getAttribute('data-entry-event'), f.event.value);
    body.append(form.getAttribute('data-entry-rating'), rating.value);
    body.append(form.getAttribute('data-entry-liked'), f.liked.value.trim());
    body.append(form.getAttribute('data-entry-improve'), f.improve.value.trim());

    button.disabled = true;
    button.textContent = button.getAttribute('data-sending');
    showError('');

    fetch(form.action, { method: 'POST', mode: 'no-cors', body: body })
      .then(function () {
        track('talk-feedback', { talk: f.talk.value, event: f.event.value || '-', rating: rating.value });
        done();
      })
      .catch(function () { showError(t.error); })
      .then(function () { button.disabled = false; button.textContent = buttonLabel; });
  });

  function done() {
    form.hidden = true;
    thanks.hidden = false;
    thanks.querySelector('h2').focus({ preventScroll: true });
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.querySelector('[data-feedback-again]').addEventListener('click', function () {
    var event = form.elements.event.value;
    form.reset();
    form.elements.event.value = event; // usually the same event, different talk
    thanks.hidden = true;
    form.hidden = false;
    form.elements.talk.focus();
  });
})();
