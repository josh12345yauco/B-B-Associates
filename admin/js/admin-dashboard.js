/* ============================================================
   B&B Admin — Dashboard (Overview panel)
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

BB.Panels.initDashboard = function () {
  var leads  = BB.Store.getLeads();
  var jobs   = BB.Store.getJobs();
  var quotes = BB.Store.getQuotes();

  // ── Stat Cards ────────────────────────────────────────
  var now = new Date();
  var weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  var newThisWeek = leads.filter(function (l) {
    return new Date(l.date) >= weekAgo;
  }).length;
  var activeJobs = jobs.filter(function (j) { return j.status === 'active'; }).length;

  setText('stat-total-leads', leads.length);
  setText('stat-new-week', newThisWeek);
  setText('stat-active-jobs', activeJobs);
  setText('stat-total-quotes', quotes.length);

  // ── Recent Leads ───────────────────────────────────────
  renderRecentLeads(leads.slice(0, 10));

  // ── Active Jobs ────────────────────────────────────────
  renderActiveJobs(jobs.filter(function (j) { return j.status === 'active'; }).slice(0, 5));
};

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function leadDisplayName(l) {
  if (l.firstName != null || l.lastName != null) return ((l.firstName || '') + ' ' + (l.lastName || '')).trim();
  return (l.name || '').trim();
}

function renderRecentLeads(leads) {
  var tbody = document.getElementById('recent-leads-tbody');
  if (!tbody) return;

  if (!leads.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state-text" style="padding:24px;text-align:center;color:#AAA;">No leads yet. Submit the consultation form to see leads here.</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map(function (l) {
    var name = leadDisplayName(l);
    return '<tr>' +
      '<td>' + esc(name || '—') + '</td>' +
      '<td>' + esc(l.email || '—') + '</td>' +
      '<td>' + esc(l.phone || '—') + '</td>' +
      '<td>' + esc(l.source || 'Form') + '</td>' +
      '<td>' + esc(l.service_area || '—') + '</td>' +
      '<td>' + fmtDate(l.date) + '</td>' +
      '<td><span class="badge badge-' + (l.status || 'new') + '">' + (l.status || 'new') + '</span></td>' +
    '</tr>';
  }).join('');
}

function renderActiveJobs(jobs) {
  var el = document.getElementById('active-jobs-list');
  if (!el) return;

  if (!jobs.length) {
    el.innerHTML = '<div class="empty-state-text" style="color:#AAA;font-size:13px;padding:16px 0;">No active jobs. Create one in the Tracker tab.</div>';
    return;
  }

  el.innerHTML = jobs.map(function (j) {
    var pct = j.percentComplete || 0;
    return '<div style="margin-bottom:16px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
        '<span style="font-size:13px;font-weight:600;">' + esc(j.clientName || 'Unnamed Job') + '</span>' +
        '<span style="font-size:12px;color:#888;">' + pct + '%</span>' +
      '</div>' +
      '<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div style="font-size:11px;color:#AAA;margin-top:4px;">' + esc(j.address || '') + '</div>' +
    '</div>';
  }).join('');
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch(e) { return iso; }
}
