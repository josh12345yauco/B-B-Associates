/* ============================================================
   B&B Admin — Leads / CRM Panel
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

BB.Panels.initLeads = function () {
  // Show loading state
  var tbody = document.getElementById('leads-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;padding:24px;">Loading leads…</td></tr>';

  // Try Supabase first, fall back to localStorage
  var loader = (window.BB && window.BB.Supabase)
    ? BB.Supabase.fetchLeads()
    : Promise.resolve([]);

  loader.then(function (remoteLeads) {
    var allLeads;
    if (remoteLeads && remoteLeads.length > 0) {
      // Merge remote leads into localStorage so filters/search still work
      BB.Store.saveLeads(remoteLeads);
      allLeads = remoteLeads;
    } else {
      allLeads = BB.Store.getLeads();
    }
    populateServiceAreaFilter(allLeads);
    renderLeadsTable(allLeads);
  });

  var searchEl = document.getElementById('leads-search');
  if (searchEl) {
    searchEl.addEventListener('input', applyLeadsFilters);
  }

  var typeFilter = document.getElementById('leads-filter-type');
  var areaFilter = document.getElementById('leads-filter-service-area');
  if (typeFilter) typeFilter.addEventListener('change', applyLeadsFilters);
  if (areaFilter) areaFilter.addEventListener('change', applyLeadsFilters);

  var addBtn = document.getElementById('leads-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      showAddLeadForm();
    });
  }
};

function populateServiceAreaFilter(leads) {
  var sel = document.getElementById('leads-filter-service-area');
  if (!sel) return;
  var areas = [];
  leads.forEach(function (l) {
    if (l.service_area && areas.indexOf(l.service_area) === -1) areas.push(l.service_area);
  });
  areas.sort();
  var opts = '<option value="">All areas</option>';
  areas.forEach(function (a) {
    opts += '<option value="' + esc(a) + '">' + esc(a) + '</option>';
  });
  sel.innerHTML = opts;
}

function applyLeadsFilters() {
  var q = (document.getElementById('leads-search') || {}).value || '';
  var typeVal = (document.getElementById('leads-filter-type') || {}).value || '';
  var areaVal = (document.getElementById('leads-filter-service-area') || {}).value || '';
  var leads = BB.Store.getLeads().filter(function (l) {
    var name = leadDisplayName(l);
    var searchStr = (name + ' ' + (l.email || '') + ' ' + (l.phone || '') + ' ' + (l.source || '') + ' ' + (l.service_area || '')).toLowerCase();
    if (q && searchStr.indexOf(q.toLowerCase()) === -1) return false;
    if (typeVal && (l.type || '') !== typeVal) return false;
    if (areaVal && (l.service_area || '') !== areaVal) return false;
    return true;
  });
  renderLeadsTable(leads);
}

function leadDisplayName(l) {
  if (l.firstName != null || l.lastName != null) return ((l.firstName || '') + ' ' + (l.lastName || '')).trim();
  return (l.name || '').trim();
}

function renderLeadsTable(leads) {
  var tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  if (!leads.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="padding:32px;text-align:center;color:#AAA;font-size:13px;">No leads found.</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map(function (l) {
    var name = esc(leadDisplayName(l)) || '—';
    return '<tr data-id="' + esc(l.id) + '">' +
      '<td>' + name + '</td>' +
      '<td>' + esc(l.email || '—') + '</td>' +
      '<td>' + esc(l.phone || '—') + '</td>' +
      '<td>' + esc(l.source || '—') + '</td>' +
      '<td>' + esc(l.service_area || '—') + '</td>' +
      '<td>' + fmtDate(l.date) + '</td>' +
      '<td>' + esc(l.budget || '—') + '</td>' +
      '<td>' + esc(l.type || l.projectType || '—') + '</td>' +
      '<td>' +
        '<select class="status-select" data-id="' + esc(l.id) + '" onchange="BB.CRM.updateStatus(this)">' +
          statusOptions(l.status) +
        '</select>' +
      '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-ghost" onclick="BB.CRM.toggleDrawer(\'' + esc(l.id) + '\')">Details</button>' +
      '</td>' +
    '</tr>' +
    '<tr id="drawer-' + esc(l.id) + '" class="drawer-row" style="display:none;">' +
      '<td colspan="10"><div class="drawer-content">' + drawerHTML(l) + '</div></td>' +
    '</tr>';
  }).join('');
}

function drawerHTML(l) {
  return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">' +
    field('Project Type', l.projectType || l.type) +
    field('Budget', l.budget) +
    field('Timeline', l.timeline) +
    field('Home Value', l.homeValue) +
    field('Town', l.town) +
    field('Service area', l.service_area) +
    field('Budget Flexible', l.budgetFlexible ? 'Yes' : 'No') +
    '</div>' +
    (l.description ? '<div style="margin-top:12px;"><label class="form-label">Project Description</label><p style="font-size:13px;color:#333;">' + esc(l.description) + '</p></div>' : '') +
    '<div style="margin-top:12px;">' +
      '<label class="form-label">Internal Notes</label>' +
      '<textarea class="form-control" id="notes-' + esc(l.id) + '" rows="3" placeholder="Add notes…">' + esc(l.notes || '') + '</textarea>' +
      '<div style="margin-top:8px;display:flex;gap:8px;">' +
        '<button class="btn btn-sm btn-primary" onclick="BB.CRM.saveNotes(\'' + esc(l.id) + '\')">Save Notes</button>' +
        '<button class="btn btn-sm btn-danger" onclick="BB.CRM.deleteLead(\'' + esc(l.id) + '\')">Delete Lead</button>' +
      '</div>' +
    '</div>';
}

function field(label, val) {
  return '<div><label class="form-label">' + label + '</label><div style="font-size:13px;color:#333;">' + esc(val || '—') + '</div></div>';
}

function statusOptions(current) {
  var opts = ['new','contacted','qualified','booked','closed','lost'];
  return opts.map(function (o) {
    return '<option value="' + o + '"' + (o === current ? ' selected' : '') + '>' + o.charAt(0).toUpperCase() + o.slice(1) + '</option>';
  }).join('');
}

function showAddLeadForm() {
  var container = document.getElementById('add-lead-form-wrap');
  if (!container) return;
  container.style.display = container.style.display === 'none' ? 'block' : 'none';
}

BB.CRM = {
  updateStatus: function (sel) {
    var id = sel.dataset.id;
    BB.Store.updateLead(id, { status: sel.value });
    BB.toast('Status updated');
  },
  toggleDrawer: function (id) {
    var row = document.getElementById('drawer-' + id);
    if (!row) return;
    row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
  },
  saveNotes: function (id) {
    var ta = document.getElementById('notes-' + id);
    if (!ta) return;
    BB.Store.updateLead(id, { notes: ta.value });
    BB.toast('Notes saved');
  },
  deleteLead: function (id) {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    var leads = BB.Store.getLeads().filter(function (l) { return l.id !== id; });
    BB.Store.saveLeads(leads);
    BB.toast('Lead deleted', 'error');
    renderLeadsTable(BB.Store.getLeads());
  },
  saveLead: function () {
    var get = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var lead = {
      id: 'lead-' + Date.now(),
      date: new Date().toISOString(),
      status: 'new',
      type: 'manual',
      source: 'Admin',
      firstName: get('add-first'),
      lastName: get('add-last'),
      phone: get('add-phone'),
      email: get('add-email'),
      projectType: get('add-type'),
      budget: get('add-budget'),
      town: get('add-town'),
      notes: get('add-notes')
    };
    var leads = BB.Store.getLeads();
    leads.unshift(lead);
    BB.Store.saveLeads(leads);
    BB.toast('Lead added');
    document.getElementById('add-lead-form-wrap').style.display = 'none';
    renderLeadsTable(BB.Store.getLeads());
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
