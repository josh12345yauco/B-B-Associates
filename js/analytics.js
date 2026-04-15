/**
 * B&B Associates — Client-side analytics (localStorage)
 * Records: page views, time on page, button/link clicks.
 * Include on all site pages; data is read by the admin Analytics panel.
 */
(function () {
  var KEY = 'bb_analytics';
  var MAX_PAGE_VIEWS = 500;
  var MAX_SESSIONS = 500;
  var MAX_CLICKS = 1000;
  var MAX_LOCATIONS = 200;

  function getData() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : { pageViews: [], sessions: [], clicks: [], locations: [] };
    } catch (e) {
      return { pageViews: [], sessions: [], clicks: [], locations: [] };
    }
  }

  function setData(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function pushAndCap(arr, item, max) {
    arr.unshift(item);
    if (arr.length > max) arr.length = max;
  }

  var pageEnteredAt = Date.now();
  var path = typeof window !== 'undefined' && window.location ? (window.location.pathname || window.location.href) : '';
  var title = typeof document !== 'undefined' && document.title ? document.title : '';

  // ── Page view ─────────────────────────────────────────────
  var d = getData();
  pushAndCap(d.pageViews, { path: path, title: title, ts: new Date().toISOString() }, MAX_PAGE_VIEWS);
  setData(d);

  // ── Time on page (on leave) ────────────────────────────────
  function recordSession() {
    var duration = Math.round((Date.now() - pageEnteredAt) / 1000);
    var data = getData();
    pushAndCap(data.sessions, {
      path: path,
      title: title,
      enteredAt: new Date(pageEnteredAt).toISOString(),
      leftAt: new Date().toISOString(),
      durationSeconds: duration
    }, MAX_SESSIONS);
    setData(data);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', recordSession);
    window.addEventListener('pagehide', recordSession);
  }

  // ── Clicks (buttons, links, CTAs) ─────────────────────────
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      var t = e.target;
      var label = '';
      var tag = t ? t.tagName : '';
      var href = '';
      while (t && t !== document.body) {
        if (t.tagName === 'A') href = t.getAttribute('href') || '';
        if (t.getAttribute && (t.getAttribute('data-analytics') || t.getAttribute('aria-label'))) {
          label = (t.getAttribute('data-analytics') || t.getAttribute('aria-label') || '').trim();
          break;
        }
        var text = (t.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
        if (text) { label = text; break; }
        t = t.parentElement;
      }
      var data = getData();
      pushAndCap(data.clicks, {
        path: path,
        tag: tag,
        text: label || '(click)',
        href: href,
        ts: new Date().toISOString()
      }, MAX_CLICKS);
      setData(data);
    }, true);
  }

  // ── IP-based geolocation (no prompt, approximate city/region) ──
  try {
    fetch('https://ipapi.co/json/')
      .then(function (r) { return r.json(); })
      .then(function (geo) {
        var data = getData();
        pushAndCap(data.locations, {
          path: path,
          city: geo.city || '',
          region: geo.region || '',
          country: geo.country_name || '',
          lat: geo.latitude || null,
          lng: geo.longitude || null,
          ts: new Date().toISOString()
        }, MAX_LOCATIONS);
        setData(data);
      })
      .catch(function () {});
  } catch (e) {}
})();
