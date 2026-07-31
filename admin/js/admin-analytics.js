/* ============================================================
   B&B Admin — Analytics / Results Report
   Pulls REAL visitor data aggregated across all visitors from the
   Supabase `analytics_events` table (BB.Supabase.fetchEvents).
   Falls back to localStorage `bb_analytics` (single-browser) only
   when Supabase is unavailable.
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return iso; }
}

function fmtDateShort(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch (e) { return iso; }
}

function fmtDuration(sec) {
  if (sec == null) return '—';
  if (sec < 60) return sec + 's';
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  return m + 'm ' + s + 's';
}

// ── State ────────────────────────────────────────────────────
BB._analyticsPeriod = BB._analyticsPeriod || 'month';
BB._analyticsEvents = BB._analyticsEvents || null;   // cached raw events
BB._analyticsSource = '';                            // 'supabase' | 'local'

function periodStart(period) {
  var now = new Date();
  if (period === 'day')   return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (period === 'week')  return now.getTime() - 7 * 864e5;
  if (period === 'month') return now.getTime() - 30 * 864e5;
  return null; // all time
}

function periodLabel(period) {
  return period === 'day' ? 'Today'
    : period === 'week' ? 'the last 7 days'
    : period === 'month' ? 'the last 30 days'
    : 'all time';
}

// Convert the legacy localStorage shape into the unified event array.
function localToEvents() {
  var d = BB.Store.getAnalytics();
  var rows = [];
  (d.pageViews || []).forEach(function (v, i) {
    rows.push({ event_type: 'pageview', path: v.path, title: v.title, created_at: v.ts, visitor_id: 'local', session_id: 'local-' + (v.ts || i) });
  });
  (d.sessions || []).forEach(function (s) {
    rows.push({ event_type: 'session', path: s.path, duration_seconds: s.durationSeconds, created_at: s.enteredAt, visitor_id: 'local', session_id: 'local-' + s.enteredAt });
  });
  (d.clicks || []).forEach(function (c) {
    rows.push({ event_type: c.conversion ? 'conversion' : 'click', conversion: c.conversion || null, path: c.path, tag: c.tag, label: c.text, href: c.href, created_at: c.ts, visitor_id: 'local' });
  });
  (d.locations || []).forEach(function (l) {
    rows.push({ event_type: 'location', path: l.path, city: l.city, region: l.region, country: l.country, lat: l.lat, lng: l.lng, created_at: l.ts, visitor_id: 'local' });
  });
  return rows;
}

// Period selector buttons
BB.Panels.setAnalyticsPeriod = function (period) {
  BB._analyticsPeriod = period;
  render();
};

// Force a fresh pull from Supabase
BB.Panels.refreshAnalytics = function () {
  BB._analyticsEvents = null;
  BB.Panels.initAnalytics();
};

BB.Panels.initAnalytics = function () {
  // Loading state
  setHtml('analytics-source-note', 'Loading real visitor data…');
  if (BB._analyticsEvents) { render(); return; }

  var done = function (rows, source) {
    BB._analyticsEvents = rows;
    BB._analyticsSource = source;
    render();
  };

  if (BB.Supabase && BB.Supabase.fetchEvents) {
    BB.Supabase.fetchEvents(null, 20000).then(function (rows) {
      if (rows && rows.length) { done(rows, 'supabase'); }
      else { done(localToEvents(), 'local'); }
    });
  } else {
    done(localToEvents(), 'local');
  }
};

function render() {
  var period = BB._analyticsPeriod || 'month';
  var all = BB._analyticsEvents || [];
  var start = periodStart(period);

  // Reflect active period button
  document.querySelectorAll('.analytics-period-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.period === period);
  });

  var rows = all.filter(function (r) {
    if (start == null) return true;
    var t = new Date(r.created_at).getTime();
    return !isNaN(t) && t >= start;
  });

  // ── Partition ────────────────────────────────────────────────
  var pageviews = rows.filter(function (r) { return r.event_type === 'pageview'; });
  var sessions  = rows.filter(function (r) { return r.event_type === 'session'; });
  var convs     = rows.filter(function (r) { return r.event_type === 'conversion'; });
  var clicks    = rows.filter(function (r) { return r.event_type === 'click' || r.event_type === 'conversion'; });

  // ── KPIs ─────────────────────────────────────────────────────
  var uniqVisitors = countDistinct(rows, 'visitor_id');
  var visits = countDistinct(pageviews.length ? pageviews : rows, 'session_id');
  var pageViewCount = pageviews.length;
  var durs = sessions.map(function (s) { return s.duration_seconds; }).filter(function (n) { return n != null && n > 0; });
  var avgDur = durs.length ? Math.round(durs.reduce(function (a, b) { return a + b; }, 0) / durs.length) : 0;

  // Conversion tallies
  var conv = { call: 0, form: 0, estimator: 0, directions: 0, estimator_start: 0 };
  convs.forEach(function (c) { if (conv[c.conversion] != null) conv[c.conversion]++; else conv[c.conversion] = 1; });
  var totalConv = conv.call + conv.form + conv.estimator + conv.directions;
  var convRate = uniqVisitors ? (totalConv / uniqVisitors * 100) : 0;

  setHtml('analytics-stat-visitors', uniqVisitors.toLocaleString());
  setHtml('analytics-stat-sessions', visits.toLocaleString());
  setHtml('analytics-stat-views', pageViewCount.toLocaleString());
  setHtml('analytics-stat-avg-time', fmtDuration(avgDur));
  setHtml('analytics-stat-conversions', totalConv.toLocaleString());
  setHtml('analytics-stat-convrate', convRate.toFixed(1) + '%');

  // Report subtitle
  var srcTxt = BB._analyticsSource === 'supabase'
    ? 'Live data — all visitors · ' + periodLabel(period)
    : '⚠ Local fallback (this browser only) — Supabase unreachable · ' + periodLabel(period);
  setHtml('analytics-source-note', srcTxt);
  setHtml('analytics-report-period', 'Results for ' + periodLabel(period));

  // ── Conversions breakdown ────────────────────────────────────
  setHtml('conv-call', conv.call.toLocaleString());
  setHtml('conv-form', conv.form.toLocaleString());
  setHtml('conv-estimator', conv.estimator.toLocaleString());
  setHtml('conv-directions', conv.directions.toLocaleString());

  // ── Daily trend (visits per day) ─────────────────────────────
  renderTrend(pageviews.length ? pageviews : rows, period);

  // ── Top pages ────────────────────────────────────────────────
  var byPath = {};
  pageviews.forEach(function (v) { var p = v.path || v.title || '—'; byPath[p] = (byPath[p] || 0) + 1; });
  var sortedPaths = Object.keys(byPath).sort(function (a, b) { return byPath[b] - byPath[a]; });
  var pvBody = document.getElementById('analytics-pageviews-tbody');
  if (pvBody) {
    pvBody.innerHTML = sortedPaths.length
      ? sortedPaths.slice(0, 30).map(function (p) { return '<tr><td>' + esc(p) + '</td><td style="font-weight:600;">' + byPath[p] + '</td></tr>'; }).join('')
      : emptyRow(2);
  }

  // ── Visitor locations (aggregated by city/region) ────────────
  var locRows = rows.filter(function (r) { return r.city || r.region; });
  var byLoc = {};
  locRows.forEach(function (r) {
    var place = [r.city, r.region, r.country].filter(Boolean).join(', ') || 'Unknown';
    if (!byLoc[place]) byLoc[place] = {};
    byLoc[place][r.visitor_id || r.session_id || Math.random()] = 1;
  });
  var sortedLocs = Object.keys(byLoc).sort(function (a, b) { return Object.keys(byLoc[b]).length - Object.keys(byLoc[a]).length; });
  var locBody = document.getElementById('analytics-locations-tbody');
  if (locBody) {
    locBody.innerHTML = sortedLocs.length
      ? sortedLocs.slice(0, 40).map(function (place) { return '<tr><td>' + esc(place) + '</td><td style="font-weight:600;">' + Object.keys(byLoc[place]).length + '</td></tr>'; }).join('')
      : emptyRow(2);
  }

  // ── Top buttons/links clicked ────────────────────────────────
  var byBtn = {};
  clicks.forEach(function (c) {
    var label = (c.label || '(unlabeled)').trim();
    var key = label + '||' + (c.href || '');
    if (!byBtn[key]) byBtn[key] = { label: label, href: c.href || '', conv: c.conversion || '', count: 0 };
    byBtn[key].count++;
  });
  var sortedBtns = Object.keys(byBtn).sort(function (a, b) { return byBtn[b].count - byBtn[a].count; });
  var btnBody = document.getElementById('analytics-buttons-tbody');
  if (btnBody) {
    btnBody.innerHTML = sortedBtns.length
      ? sortedBtns.slice(0, 60).map(function (k) {
          var b = byBtn[k];
          var badge = b.conv ? ' <span style="background:#C9A063;color:#fff;font-size:10px;padding:1px 6px;border-radius:8px;">' + esc(b.conv) + '</span>' : '';
          return '<tr><td>' + esc(b.label) + badge + '</td><td>' + esc(b.href || '—') + '</td><td style="font-weight:600;">' + b.count + '</td></tr>';
        }).join('')
      : emptyRow(3);
  }
}

// Distinct count of a field (ignoring blanks)
function countDistinct(arr, field) {
  var set = {};
  arr.forEach(function (r) { var v = r[field]; if (v) set[v] = 1; });
  return Object.keys(set).length;
}

function emptyRow(cols) {
  return '<tr><td colspan="' + cols + '" style="padding:24px;text-align:center;color:#888;">No data in this period yet.</td></tr>';
}

// Simple horizontal-bar trend of visits per day
function renderTrend(events, period) {
  var wrap = document.getElementById('analytics-trend');
  if (!wrap) return;
  var byDay = {};
  events.forEach(function (e) {
    var key = (e.created_at || '').slice(0, 10);
    if (!key) return;
    if (!byDay[key]) byDay[key] = {};
    byDay[key][e.session_id || e.visitor_id || Math.random()] = 1;
  });
  var days = Object.keys(byDay).sort();
  // For day/week/month keep a sensible tail
  var tail = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 60;
  days = days.slice(-tail);
  if (!days.length) { wrap.innerHTML = '<div style="padding:24px;text-align:center;color:#888;">No visits in this period yet.</div>'; return; }
  var counts = days.map(function (d) { return Object.keys(byDay[d]).length; });
  var max = Math.max.apply(null, counts) || 1;
  wrap.innerHTML = days.map(function (d, i) {
    var c = counts[i];
    var pct = Math.round(c / max * 100);
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">' +
      '<div style="width:54px;font-size:11px;color:#888;flex-shrink:0;">' + fmtDateShort(d) + '</div>' +
      '<div style="flex:1;background:#f0ece4;border-radius:4px;height:18px;position:relative;">' +
        '<div style="width:' + pct + '%;background:#C9A063;height:100%;border-radius:4px;min-width:2px;"></div>' +
      '</div>' +
      '<div style="width:36px;text-align:right;font-size:12px;font-weight:600;">' + c + '</div>' +
    '</div>';
  }).join('');
}

// Print / export a clean client-ready report
BB.Panels.printAnalyticsReport = function () {
  window.print();
};

function setHtml(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}
