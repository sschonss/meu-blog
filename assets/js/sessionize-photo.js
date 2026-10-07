// Keeps the profile photo in sync with Sessionize: the page ships with the
// photo from the last build and swaps in the current one if it changed.
(function () {
  var imgs = document.querySelectorAll('[data-sessionize-photo]');
  if (!imgs.length) return;
  // Swap to the live Sessionize photo, reverting to the backup if it fails.
  function setPhoto(img, url) {
    var backup = img.getAttribute('data-fallback');
    img.onerror = function () { img.onerror = null; if (backup) img.src = backup; };
    img.src = url;
  }

  fetch('https://sessionize.com/api/speaker/json/2n3e2etaad')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      var url = d && d.speaker && d.speaker.photoUrl;
      if (url) imgs.forEach(function (img) { if (img.src !== url) setPhoto(img, url); });
    })
    .catch(function () { /* keep the build-time photo */ });
})();
