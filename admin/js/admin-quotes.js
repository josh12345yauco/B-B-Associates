/* ============================================================
   B&B Admin — Quotes Panel
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

BB.Panels.initQuotes = function () {
  renderQuotesTable(BB.Store.getQuotes());
};

function renderQuotesTable(quotes) {
  var tbody = document.getElementById('quotes-tbody');
  if (!tbody) return;

  if (!quotes.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="padding:32px;text-align:center;color:#AAA;font-size:13px;">No quotes yet. Use the estimator to generate one.</td></tr>';
    return;
  }

  tbody.innerHTML = quotes.map(function (q) {
    return '<tr>' +
      '<td>' + fmtDate(q.date) + '</td>' +
      '<td>' + esc(q.name || '—') + '</td>' +
      '<td>' + esc(q.phone || '—') + '</td>' +
      '<td>' + esc(q.projectType || '—') + '</td>' +
      '<td>' + esc(q.scopeLevel || '—') + '</td>' +
      '<td>' + fmt(q.lowEstimate) + ' – ' + fmt(q.highEstimate) + '</td>' +
      '<td>' +
        '<select class="status-select" data-id="' + esc(q.id) + '" onchange="BB.Quotes.updateStatus(this)">' +
          quoteStatusOpts(q.status) +
        '</select>' +
      '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-ghost" onclick="BB.Quotes.toggleDrawer(\'' + esc(q.id) + '\')">Details</button>' +
      '</td>' +
    '</tr>' +
    '<tr id="quote-drawer-' + esc(q.id) + '" style="display:none;">' +
      '<td colspan="8"><div class="drawer-content">' + quoteDrawer(q) + '</div></td>' +
    '</tr>';
  }).join('');
}

function quoteDrawer(q) {
  var snap = q.inputSnapshot || {};
  return '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">' +
    fld('Project Type', snap.projectType) +
    fld('Scope Level', snap.scopeLevel) +
    fld('Size', snap.projectSize) +
    fld('Cabinet Tier', snap.cabinetType) +
    fld('Countertop', snap.countertopMaterial) +
    fld('Appliance Tier', snap.applianceTier) +
    fld('Shower Config', snap.showerConfig) +
    fld('Tub Type', snap.tubType) +
    fld('Structural', (snap.structural || []).join(', ') || 'None') +
    '</div>' +
    '<div style="margin-top:8px;font-size:12px;color:#888;">Quote ID: ' + esc(q.id) + '</div>';
}

function fld(label, val) {
  return '<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#AAA;margin-bottom:2px;">' + label + '</div>' +
    '<div style="font-size:13px;color:#333;">' + esc(val || '—') + '</div></div>';
}

function quoteStatusOpts(current) {
  return ['pending','sent','won','lost'].map(function (o) {
    return '<option value="' + o + '"' + (o === current ? ' selected' : '') + '>' + o.charAt(0).toUpperCase() + o.slice(1) + '</option>';
  }).join('');
}

function fmt(n) {
  if (!n) return '—';
  return '$' + Number(n).toLocaleString('en-US');
}

BB.Quotes = {
  updateStatus: function (sel) {
    BB.Store.updateQuote(sel.dataset.id, { status: sel.value });
    BB.toast('Quote status updated');
  },
  toggleDrawer: function (id) {
    var row = document.getElementById('quote-drawer-' + id);
    if (row) row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
  }
};

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch(e) { return iso; }
}
