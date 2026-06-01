/**
 * B&B Associates — First-party visitor analytics
 * --------------------------------------------------------------
 * Sends real visitor activity to a CENTRAL Supabase table
 * (`analytics_events`) so it can be aggregated across ALL visitors
 * in the admin "Results" dashboard. Also mirrors to localStorage as
 * an offline fallback, and pushes conversion events to the GTM
 * dataLayer so Google Analytics 4 / Looker Studio can report on them.
 *
 * Include on every public page: <script src="/js/analytics.js"></script>
 *
 * Captures:
 *   - page views (every page load)
 *   - sessions / time on page (on leave)
 *   - clicks (buttons, links, CTAs)
 *   - conversions: call taps (tel:), form submits, directions clicks,
 *     and estimator completions (via postMessage from bbestimator.com)
 *   - approximate visitor location (IP-based city/region, no prompt)
 */
(function () {
  // Public, anon-key Supabase project (same project the lead forms use).
  var SUPABASE_URL = 'https://uiwubmhfrepmclvdisff.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpd3VibWhmcmVwbWNsdmRpc2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Njg4NjYsImV4cCI6MjA4OTQ0NDg2Nn0.KRluwn9Om8QNlRl9Ksmrz3I8sT5XRobfOo7aeMN22BM';
  var ENDPOINT = SUPABASE_URL + '/rest/v1/analytics_events';

  var KEY = 'bb_analytics';            // localStorage fallback
  var MAX = { pageViews: 500, sessions: 500, clicks: 1000, locations: 200 };

  // ── Identity (so we can count unique visitors & sessions) ──────
  function uid() {
    return 'xxxxxxxx'.replace(/x/g, function () {
      return Math.floor(Math.random() * 16).toString(16);
    }) + '-' + Date.now().toString(36);
  }
  var visitorId = '';
  var sessionId = '';
  try {
    visitorId = localStorage.getItem('bb_visitor_id');
    if (!visitorId) { visitorId = uid(); localStorage.setItem('bb_visitor_id', visitorId); }
  } catch (e) { visitorId = uid(); }
  try {
    sessionId = sessionStorage.getItem('bb_session_id');
    if (!sessionId) { sessionId = uid(); sessionStorage.setItem('bb_session_id', sessionId); }
  } catch (e) { sessionId = uid(); }

  var pageEnteredAt = Date.now();
  var path = (window.location && (window.location.pathname || window.location.href)) || '';
  var title = (document && document.title) || '';
  var referrer = (document && document.referrer) || '';

  // Cached geo for this session (so every event carries city/region).
  function geo() {
    try { return JSON.parse(sessionStorage.getItem('bb_geo') || 'null'); } catch (e) { return null; }
  }

  // ── Central send (Supabase REST) ───────────────────────────────
  function send(row, useKeepalive) {
    var g = geo() || {};
    var payload = {
      event_type:       row.event_type,
      conversion:       row.conversion || null,
      session_id:       sessionId,
      visitor_id:       visitorId,
      path:             path,
      title:            title,
      label:            row.label || null,
      href:             row.href || null,
      tag:              row.tag || null,
      duration_seconds: row.duration_seconds != null ? row.duration_seconds : null,
      referrer:         referrer || null,
      city:             g.city || null,
      region:           g.region || null,
      country:          g.country || null,
      lat:              g.lat != null ? g.lat : null,
      lng:              g.lng != null ? g.lng : null,
      user_agent:       (navigator && navigator.userAgent) || null
    };
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload),
        keepalive: !!useKeepalive   // survive page unload
      }).catch(function () {});
    } catch (e) {}
  }

  // ── localStorage mirror (offline fallback for the admin panel) ──
  function getLocal() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : { pageViews: [], sessions: [], clicks: [], locations: [] };
    } catch (e) { return { pageViews: [], sessions: [], clicks: [], locations: [] }; }
  }
  function setLocal(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function mirror(bucket, item) {
    var d = getLocal();
    if (!d[bucket]) d[bucket] = [];
    d[bucket].unshift(item);
    if (d[bucket].length > (MAX[bucket] || 500)) d[bucket].length = MAX[bucket] || 500;
    setLocal(d);
  }

  // ── GA4 / GTM dataLayer push (for the Looker Studio report) ─────
  function gtm(event, detail) {
    try {
      window.dataLayer = window.dataLayer || [];
      var obj = { event: event };
      if (detail) for (var k in detail) obj[k] = detail[k];
      window.dataLayer.push(obj);
    } catch (e) {}
  }

  // ── Public hook for custom conversions (e.g. estimator) ─────────
  window.bbTrack = function (conversionType, detail) {
    detail = detail || {};
    send({ event_type: 'conversion', conversion: conversionType, label: detail.label || conversionType, href: detail.href || '' });
    mirror('clicks', { path: path, tag: 'CONVERSION', text: detail.label || conversionType, href: detail.href || '', conversion: conversionType, ts: new Date().toISOString() });
    gtm('bb_conversion', { conversion_type: conversionType, conversion_label: detail.label || conversionType });
  };

  // ── Page view ───────────────────────────────────────────────────
  send({ event_type: 'pageview' });
  mirror('pageViews', { path: path, title: title, ts: new Date().toISOString() });

  // ── Session / time on page (on leave) ──────────────────────────
  var sessionSent = false;
  function recordSession() {
    if (sessionSent) return;
    sessionSent = true;
    var duration = Math.round((Date.now() - pageEnteredAt) / 1000);
    send({ event_type: 'session', duration_seconds: duration }, true);
    mirror('sessions', {
      path: path, title: title,
      enteredAt: new Date(pageEnteredAt).toISOString(),
      leftAt: new Date().toISOString(),
      durationSeconds: duration
    });
  }
  window.addEventListener('pagehide', recordSession);
  window.addEventListener('beforeunload', recordSession);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') recordSession();
  });

  // ── Classify a click into a conversion type (or null) ──────────
  function classify(anchor, href, label) {
    var h = (href || '').toLowerCase();
    var l = (label || '').toLowerCase();
    if (h.indexOf('tel:') === 0) return 'call';
    if (h.indexOf('google.com/maps') > -1 || h.indexOf('maps.app') > -1 ||
        h.indexOf('goo.gl/maps') > -1 || h.indexOf('maps.google') > -1 ||
        l.indexOf('direction') > -1) return 'directions';
    if (h.indexOf('/estimator') > -1 || h.indexOf('bbestimator') > -1) return 'estimator_start';
    return null;
  }

  // ── Clicks ──────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var t = e.target;
    var tag = t ? t.tagName : '';
    var href = '';
    var label = '';
    while (t && t !== document.body) {
      if (t.tagName === 'A' && !href) href = t.getAttribute('href') || '';
      if (t.getAttribute && (t.getAttribute('data-analytics') || t.getAttribute('aria-label'))) {
        label = (t.getAttribute('data-analytics') || t.getAttribute('aria-label') || '').trim();
        break;
      }
      var text = (t.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      if (text) { label = text; break; }
      t = t.parentElement;
    }
    var conversion = classify(t, href, label);
    send({ event_type: conversion ? 'conversion' : 'click', conversion: conversion, tag: tag, label: label || '(click)', href: href });
    mirror('clicks', { path: path, tag: tag, text: label || '(click)', href: href, conversion: conversion || '', ts: new Date().toISOString() });
    if (conversion) gtm('bb_conversion', { conversion_type: conversion, conversion_label: label || conversion, conversion_href: href });
  }, true);

  // ── Form submits = lead conversions ────────────────────────────
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var name = (form && (form.getAttribute('name') || form.getAttribute('id') || form.className)) || 'form';
    window.bbTrack('form', { label: 'Form submit: ' + name });
  }, true);

  // ── Estimator completion (cross-origin iframe → postMessage) ────
  // bbestimator.com should post: window.parent.postMessage({ bb: 'estimator_complete' }, '*')
  window.addEventListener('message', function (e) {
    try {
      var d = e.data;
      if (d && (d.bb === 'estimator_complete' || d.event === 'estimator_complete')) {
        window.bbTrack('estimator', { label: 'Estimator completed' });
      }
    } catch (err) {}
  });

  // ── IP-based geolocation (no prompt; cached per session) ────────
  try {
    if (!geo()) {
      fetch('https://ipapi.co/json/')
        .then(function (r) { return r.json(); })
        .then(function (g) {
          var loc = { city: g.city || '', region: g.region || '', country: g.country_name || '', lat: g.latitude || null, lng: g.longitude || null };
          try { sessionStorage.setItem('bb_geo', JSON.stringify(loc)); } catch (e) {}
          send({ event_type: 'location' });
          mirror('locations', { path: path, city: loc.city, region: loc.region, country: loc.country, lat: loc.lat, lng: loc.lng, ts: new Date().toISOString() });
        })
        .catch(function () {});
    }
  } catch (e) {}
})();
