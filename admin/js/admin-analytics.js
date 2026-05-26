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

// ── Time-period filtering ────────────────────────────────────
// Selected period for the whole Analytics panel. Persisted so the
// choice survives navigating away and back within the session.
BB._analyticsPeriod = BB._analyticsPeriod || 'all';

// Rolling-window start (ms epoch) for a period, or null for "all".
function periodStart(period) {
  var now = new Date();
  if (period === 'day') {
    // since local midnight today
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (period === 'week') {
    return now.getTime() - 7 * 24 * 60 * 60 * 1000;   // last 7 days
  }
  if (period === 'month') {
    return now.getTime() - 30 * 24 * 60 * 60 * 1000;  // last 30 days
  }
  return null; // all time
}

// Filter an array of records to the selected period, using the given
// timestamp field (records without a parseable timestamp are kept only
// when period is "all").
function filterByPeriod(arr, tsField, period) {
  var start = periodStart(period);
  if (start == null) return arr.slice();
  return arr.filter(function (r) {
    var iso = r[tsField];
    if (!iso) return false;
    var t = new Date(iso).getTime();
    return !isNaN(t) && t >= start;
  });
}

// Called by the period selector buttons in admin/index.html
BB.Panels.setAnalyticsPeriod = function (period) {
  BB._analyticsPeriod = period;
  BB.Panels.initAnalytics();
};

BB.Panels.initAnalytics = function () {
  var data = BB.Store.getAnalytics();
  var period = BB._analyticsPeriod || 'all';

  // Reflect active period in the selector buttons
  document.querySelectorAll('.analytics-period-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.period === period);
  });

  // Apply the selected time window to every dataset
  var pv = filterByPeriod(data.pageViews || [], 'ts', period);
  var sessions = filterByPeriod(data.sessions || [], 'enteredAt', period);
  var clicks = filterByPeriod(data.clicks || [], 'ts', period);
  var locations = filterByPeriod(data.locations || [], 'ts', period);

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
      tbody.innerHTML = '<tr><td colspan="2" style="padding:24px;text-align:center;color:#888;">No page views in this period.</td></tr>';
    } else {
      tbody.innerHTML = sortedPaths.slice(0, 50).map(function (path) {
        return '<tr><td>' + esc(path) + '</td><td>' + byPath[path] + '</td></tr>';
      }).join('');
    }
  }

  // Table: Buttons & links clicked (aggregated by element, with counts)
  var btbody = document.getElementById('analytics-buttons-tbody');
  if (btbody) {
    var byBtn = {};
    clicks.forEach(function (c) {
      var label = (c.text || '(unlabeled)').trim();
      var href = c.href || '';
      var key = label + '||' + href;
      if (!byBtn[key]) {
        byBtn[key] = { label: label, href: href, tag: c.tag || '', count: 0 };
      }
      byBtn[key].count++;
    });
    var sortedBtns = Object.keys(byBtn).sort(function (a, b) { return byBtn[b].count - byBtn[a].count; });
    if (sortedBtns.length === 0) {
      btbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:#888;">No button/link clicks in this period.</td></tr>';
    } else {
      btbody.innerHTML = sortedBtns.slice(0, 100).map(function (k) {
        var b = byBtn[k];
        return '<tr><td>' + esc(b.label) + '</td><td>' + esc(b.tag) + '</td><td>' + esc(b.href || '—') + '</td><td style="font-weight:600;">' + b.count + '</td></tr>';
      }).join('');
    }
  }

  // Table: Time on page (sessions)
  var stbody = document.getElementById('analytics-sessions-tbody');
  if (stbody) {
    if (sessions.length === 0) {
      stbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:#888;">No session data in this period.</td></tr>';
    } else {
      stbody.innerHTML = sessions.slice(0, 100).map(function (s) {
        return '<tr><td>' + esc(s.path) + '</td><td>' + fmtDate(s.enteredAt) + '</td><td>' + fmtDuration(s.durationSeconds) + '</td><td>' + fmtDate(s.leftAt) + '</td></tr>';
      }).join('');
    }
  }

  // Table: Recent click activity (raw log)
  var ctbody = document.getElementById('analytics-clicks-tbody');
  if (ctbody) {
    if (clicks.length === 0) {
      ctbody.innerHTML = '<tr><td colspan="5" style="padding:24px;text-align:center;color:#888;">No click data in this period.</td></tr>';
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
      ltbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:#888;">No location data in this period.</td></tr>';
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
