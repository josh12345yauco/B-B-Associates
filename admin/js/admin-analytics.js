/* ============================================================
   B&B Admin — Analytics Panel
   Reads bb_analytics from localStorage (populated by js/analytics.js on site pages)
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
  } catch (e) {
    return iso;
  }
}

function fmtDuration(sec) {
  if (sec == null) return '—';
  if (sec < 60) return sec + 's';
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  return m + 'm ' + s + 's';
}

BB.Panels.initAnalytics = function () {
  var data = BB.Store.getAnalytics();
  var pv = data.pageViews || [];
  var sessions = data.sessions || [];
  var clicks = data.clicks || [];
  var locations = data.locations || [];

  // Page views count by path
  var byPath = {};
  pv.forEach(function (v) {
    var p = v.path || v.title || '—';
    byPath[p] = (byPath[p] || 0) + 1;
  });
  var sortedPaths = Object.keys(byPath).sort(function (a, b) { return byPath[b] - byPath[a]; });

  // Render stats
  var totalViews = pv.length;
  var totalSessions = sessions.length;
  var avgDuration = 0;
  if (sessions.length) {
    var sum = sessions.reduce(function (acc, s) { return acc + (s.durationSeconds || 0); }, 0);
    avgDuration = Math.round(sum / sessions.length);
  }

  setHtml('analytics-stat-views', totalViews);
  setHtml('analytics-stat-sessions', totalSessions);
  setHtml('analytics-stat-avg-time', fmtDuration(avgDuration));
  setHtml('analytics-stat-clicks', clicks.length);
  setHtml('analytics-stat-locations', locations.length);

  // Table: Page visits (aggregated)
  var tbody = document.getElementById('analytics-pageviews-tbody');
  if (tbody) {
    if (sortedPaths.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" style="padding:24px;text-align:center;color:#888;">No page views yet. Add <code>js/analytics.js</code> to your site pages.</td></tr>';
    } else {
      tbody.innerHTML = sortedPaths.slice(0, 50).map(function (path) {
        return '<tr><td>' + esc(path) + '</td><td>' + byPath[path] + '</td></tr>';
      }).join('');
    }
  }

  // Table: Time on page (sessions)
  var stbody = document.getElementById('analytics-sessions-tbody');
  if (stbody) {
    if (sessions.length === 0) {
      stbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:#888;">No session data yet.</td></tr>';
    } else {
      stbody.innerHTML = sessions.slice(0, 100).map(function (s) {
        return '<tr><td>' + esc(s.path) + '</td><td>' + fmtDate(s.enteredAt) + '</td><td>' + fmtDuration(s.durationSeconds) + '</td><td>' + fmtDate(s.leftAt) + '</td></tr>';
      }).join('');
    }
  }

  // Table: Button/link clicks
  var ctbody = document.getElementById('analytics-clicks-tbody');
  if (ctbody) {
    if (clicks.length === 0) {
      ctbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:#888;">No click data yet.</td></tr>';
    } else {
      ctbody.innerHTML = clicks.slice(0, 150).map(function (c) {
        return '<tr><td>' + esc(c.path) + '</td><td>' + esc(c.tag) + '</td><td>' + esc(c.text) + '</td><td>' + esc(c.href || '—') + '</td><td>' + fmtDate(c.ts) + '</td></tr>';
      }).join('');
    }
  }

  // Table: Locations (if any)
  var ltbody = document.getElementById('analytics-locations-tbody');
  if (ltbody) {
    if (locations.length === 0) {
      ltbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:#888;">No location data yet.</td></tr>';
    } else {
      ltbody.innerHTML = locations.slice(0, 50).map(function (loc) {
        var place = [loc.city, loc.region, loc.country].filter(Boolean).join(', ') || '—';
        return '<tr><td>' + esc(loc.path) + '</td><td>' + esc(place) + '</td><td>' + (loc.lat != null ? loc.lat.toFixed(4) : '—') + ', ' + (loc.lng != null ? loc.lng.toFixed(4) : '—') + '</td><td>' + fmtDate(loc.ts) + '</td></tr>';
      }).join('');
    }
  }
};

function setHtml(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}
