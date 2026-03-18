/* ============================================================
   B&B Admin — Project Tracker / PM Panel
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

var _activeJobId = null;
var _activeTab = 'overview';

BB.Panels.initTracker = function () {
  renderJobList();
  var addBtn = document.getElementById('tracker-add-job');
  if (addBtn) addBtn.addEventListener('click', BB.Tracker.addJob);
};

/* ── JOB LIST ─────────────────────────────────────────────── */
function renderJobList() {
  var list = document.getElementById('tracker-job-list');
  if (!list) return;
  var jobs = BB.Store.getJobs();

  if (!jobs.length) {
    list.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="empty-state-icon">📋</div><div class="empty-state-text">No jobs yet. Click "New Job" to create one.</div></div>';
    return;
  }

  list.innerHTML = jobs.map(function (j) {
    var pct = j.percentComplete || 0;
    return '<div class="split-list-item' + (_activeJobId === j.id ? ' active' : '') + '" onclick="BB.Tracker.selectJob(\'' + esc(j.id) + '\')">' +
      '<div class="split-list-info">' +
        '<div class="split-list-title">' + esc(j.clientName || 'Unnamed Job') + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-top:4px;">' +
          '<span class="badge badge-' + (j.status || 'planning') + '">' + (j.status || 'planning') + '</span>' +
          '<span style="font-size:11px;color:#888;">' + pct + '%</span>' +
        '</div>' +
        '<div class="progress-bar-wrap" style="margin-top:6px;"><div class="progress-bar-fill" style="width:' + pct + '%;"></div></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ── JOB DETAIL ───────────────────────────────────────────── */
function renderJobDetail(job) {
  var detail = document.getElementById('tracker-detail');
  if (!detail) return;
  detail.style.display = 'block';
  document.getElementById('tracker-empty').style.display = 'none';

  // Header
  setText('tj-client', job.clientName || 'Unnamed Job');
  setText('tj-address', job.address || '');

  // Tabs
  switchTab(_activeTab, job);
}

function switchTab(tab, job) {
  _activeTab = tab;
  job = job || BB.Store.getJob(_activeJobId);
  if (!job) return;

  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(function (p) {
    p.classList.toggle('active', p.id === 'tab-' + tab);
  });

  switch (tab) {
    case 'overview':  renderOverviewTab(job); break;
    case 'tasks':     renderTasksTab(job);     break;
    case 'materials': renderMaterialsTab(job); break;
    case 'schedule':  renderScheduleTab(job);  break;
    case 'payments':  renderPaymentsTab(job);  break;
  }
}

/* ── OVERVIEW TAB ─────────────────────────────────────────── */
function renderOverviewTab(job) {
  var s = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
  s('ov-client', job.clientName);
  s('ov-address', job.address);
  s('ov-start', job.startDate);
  s('ov-end', job.endDate);
  s('ov-status', job.status || 'planning');
  s('ov-employees', (job.employees || []).join(', '));
  s('ov-notes', job.notes);

  var slider = document.getElementById('ov-percent');
  var sliderVal = document.getElementById('ov-percent-val');
  if (slider) {
    slider.value = job.percentComplete || 0;
    if (sliderVal) sliderVal.textContent = (job.percentComplete || 0) + '%';
    slider.oninput = function () {
      if (sliderVal) sliderVal.textContent = this.value + '%';
    };
  }
}

/* ── TASKS TAB ────────────────────────────────────────────── */
function renderTasksTab(job) {
  var list = document.getElementById('tasks-list');
  if (!list) return;
  var tasks = job.tasks || [];

  list.innerHTML = tasks.map(function (t, i) {
    return '<div class="task-item">' +
      '<input type="checkbox"' + (t.done ? ' checked' : '') + ' onchange="BB.Tracker.toggleTask(' + i + ',this.checked)">' +
      '<span class="' + (t.done ? 'task-done-label' : '') + '">' + esc(t.text) + '</span>' +
      '<button class="btn btn-icon btn-danger btn-sm" style="margin-left:auto;" onclick="BB.Tracker.deleteTask(' + i + ')">✕</button>' +
    '</div>';
  }).join('') || '<div style="color:#AAA;font-size:13px;">No tasks yet.</div>';
}

/* ── MATERIALS TAB ────────────────────────────────────────── */
function renderMaterialsTab(job) {
  var tbody = document.getElementById('materials-tbody');
  if (!tbody) return;
  var mats = job.materials || [];
  var total = 0;

  tbody.innerHTML = mats.map(function (m, i) {
    var lineTotal = (parseFloat(m.unitCost) || 0) * (parseFloat(m.qty) || 0);
    total += lineTotal;
    return '<tr>' +
      '<td>' + esc(m.name) + '</td>' +
      '<td>' + esc(m.vendor || '—') + '</td>' +
      '<td>$' + Number(m.unitCost || 0).toLocaleString() + '</td>' +
      '<td>' + (m.qty || 0) + '</td>' +
      '<td>$' + lineTotal.toLocaleString() + '</td>' +
      '<td><select class="status-select" onchange="BB.Tracker.updateMaterialStatus(' + i + ',this.value)">' +
        matStatusOpts(m.status) + '</select></td>' +
      '<td><button class="btn btn-sm btn-danger btn-icon" onclick="BB.Tracker.deleteMaterial(' + i + ')">✕</button></td>' +
    '</tr>';
  }).join('');

  // Total row
  var totalRow = document.getElementById('materials-total-row');
  if (totalRow) totalRow.innerHTML = '<td colspan="4"><strong>Total Materials Cost</strong></td><td><strong>$' + total.toLocaleString() + '</strong></td><td colspan="2"></td>';
  if (typeof window._materialTotal !== 'undefined') window._materialTotal = total;
  renderPaymentSummary(job, total);
}

function matStatusOpts(current) {
  return ['needed','ordered','received'].map(function (o) {
    return '<option value="' + o + '"' + (o === (current || 'needed') ? ' selected' : '') + '>' + o.charAt(0).toUpperCase() + o.slice(1) + '</option>';
  }).join('');
}

/* ── SCHEDULE TAB ─────────────────────────────────────────── */
function renderScheduleTab(job) {
  var list = document.getElementById('schedule-list');
  if (!list) return;
  var milestones = job.milestones || [];

  list.innerHTML = milestones.map(function (m, i) {
    return '<div class="milestone-item">' +
      '<input type="checkbox"' + (m.done ? ' checked' : '') + ' onchange="BB.Tracker.toggleMilestone(' + i + ',this.checked)">' +
      '<div style="flex:1;">' +
        '<div class="' + (m.done ? 'milestone-done' : '') + '">' + esc(m.text) + '</div>' +
        '<div style="font-size:11px;color:#AAA;">' + (m.date || '') + '</div>' +
      '</div>' +
      '<button class="btn btn-sm btn-danger btn-icon" onclick="BB.Tracker.deleteMilestone(' + i + ')">✕</button>' +
    '</div>';
  }).join('') || '<div style="color:#AAA;font-size:13px;">No milestones yet.</div>';
}

/* ── PAYMENTS TAB ─────────────────────────────────────────── */
function renderPaymentsTab(job) {
  var tbody = document.getElementById('payments-tbody');
  if (!tbody) return;
  var payments = job.payments || [];

  tbody.innerHTML = payments.map(function (p, i) {
    return '<tr>' +
      '<td>' + fmtDate(p.date) + '</td>' +
      '<td>' + esc(p.description || '—') + '</td>' +
      '<td>$' + Number(p.amount || 0).toLocaleString() + '</td>' +
      '<td>' + esc(p.method || '—') + '</td>' +
      '<td><button class="btn btn-sm btn-danger btn-icon" onclick="BB.Tracker.deletePayment(' + i + ')">✕</button></td>' +
    '</tr>';
  }).join('') || '<tr><td colspan="5" style="color:#AAA;text-align:center;padding:16px;">No payments recorded.</td></tr>';

  renderPaymentSummary(job, null);
}

function renderPaymentSummary(job, matCost) {
  if (matCost === null) {
    var mats = job.materials || [];
    matCost = mats.reduce(function (s, m) { return s + (parseFloat(m.unitCost) || 0) * (parseFloat(m.qty) || 0); }, 0);
  }
  var contract = parseFloat(job.contractValue) || 0;
  var payments = (job.payments || []).reduce(function (s, p) { return s + (parseFloat(p.amount) || 0); }, 0);
  var outstanding = Math.max(0, contract - payments);
  var profit = contract - matCost;

  setText('ps-contract', '$' + contract.toLocaleString());
  setText('ps-received', '$' + payments.toLocaleString());
  setText('ps-outstanding', '$' + outstanding.toLocaleString());
  var profEl = document.getElementById('ps-profit');
  if (profEl) {
    profEl.textContent = '$' + profit.toLocaleString();
    profEl.className = 'payment-summary-value ' + (profit >= 0 ? 'profit-positive' : 'profit-negative');
  }
}

/* ── HELPERS ──────────────────────────────────────────────── */
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val || '';
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch(e) { return iso; }
}

function saveCurrentJob() {
  var job = BB.Store.getJob(_activeJobId);
  if (!job) return;
  BB.Store.saveJob(job);
}

/* ── PUBLIC API ───────────────────────────────────────────── */
BB.Tracker = {
  addJob: function () {
    var id = 'job-' + Date.now();
    var job = {
      id: id, clientName: 'New Job', address: '', status: 'planning',
      percentComplete: 0, startDate: '', endDate: '', contractValue: 0,
      employees: [], notes: '', tasks: [], materials: [], milestones: [], payments: []
    };
    BB.Store.saveJob(job);
    renderJobList();
    BB.Tracker.selectJob(id);
    BB.toast('New job created');
  },

  selectJob: function (id) {
    _activeJobId = id;
    var job = BB.Store.getJob(id);
    if (!job) return;
    renderJobList();
    renderJobDetail(job);
  },

  switchTab: function (tab) { switchTab(tab); },

  saveOverview: function () {
    var job = BB.Store.getJob(_activeJobId);
    if (!job) return;
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    job.clientName = g('ov-client');
    job.address = g('ov-address');
    job.startDate = g('ov-start');
    job.endDate = g('ov-end');
    job.status = g('ov-status');
    job.notes = g('ov-notes');
    job.contractValue = parseFloat(document.getElementById('ov-contract')?.value) || job.contractValue || 0;
    var slider = document.getElementById('ov-percent');
    job.percentComplete = slider ? parseInt(slider.value) || 0 : job.percentComplete;
    var empStr = g('ov-employees');
    job.employees = empStr ? empStr.split(',').map(function (s) { return s.trim(); }) : [];
    BB.Store.saveJob(job);
    renderJobList();
    BB.toast('Job overview saved');
  },

  deleteJob: function () {
    if (!_activeJobId) return;
    if (!confirm('Delete this job? This cannot be undone.')) return;
    BB.Store.deleteJob(_activeJobId);
    _activeJobId = null;
    document.getElementById('tracker-detail').style.display = 'none';
    document.getElementById('tracker-empty').style.display = 'block';
    renderJobList();
    BB.toast('Job deleted', 'error');
  },

  addTask: function () {
    var input = document.getElementById('new-task-input');
    if (!input || !input.value.trim()) return;
    var job = BB.Store.getJob(_activeJobId);
    if (!job) return;
    job.tasks = job.tasks || [];
    job.tasks.push({ text: input.value.trim(), done: false });
    BB.Store.saveJob(job);
    input.value = '';
    renderTasksTab(job);
  },

  toggleTask: function (idx, done) {
    var job = BB.Store.getJob(_activeJobId);
    if (!job || !job.tasks[idx]) return;
    job.tasks[idx].done = done;
    BB.Store.saveJob(job);
    renderTasksTab(job);
  },

  deleteTask: function (idx) {
    var job = BB.Store.getJob(_activeJobId);
    if (!job) return;
    job.tasks.splice(idx, 1);
    BB.Store.saveJob(job);
    renderTasksTab(job);
  },

  addMaterial: function () {
    var job = BB.Store.getJob(_activeJobId);
    if (!job) return;
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    job.materials = job.materials || [];
    job.materials.push({
      name: g('new-mat-name'), vendor: g('new-mat-vendor'),
      unitCost: parseFloat(g('new-mat-cost')) || 0, qty: parseFloat(g('new-mat-qty')) || 1,
      status: 'needed'
    });
    BB.Store.saveJob(job);
    ['new-mat-name','new-mat-vendor','new-mat-cost','new-mat-qty'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    renderMaterialsTab(job);
    BB.toast('Material added');
  },

  deleteMaterial: function (idx) {
    var job = BB.Store.getJob(_activeJobId);
    if (!job) return;
    job.materials.splice(idx, 1);
    BB.Store.saveJob(job);
    renderMaterialsTab(job);
  },

  updateMaterialStatus: function (idx, val) {
    var job = BB.Store.getJob(_activeJobId);
    if (!job || !job.materials[idx]) return;
    job.materials[idx].status = val;
    BB.Store.saveJob(job);
  },

  addMilestone: function () {
    var textEl = document.getElementById('new-ms-text');
    var dateEl = document.getElementById('new-ms-date');
    if (!textEl || !textEl.value.trim()) return;
    var job = BB.Store.getJob(_activeJobId);
    if (!job) return;
    job.milestones = job.milestones || [];
    job.milestones.push({ text: textEl.value.trim(), date: dateEl ? dateEl.value : '', done: false });
    BB.Store.saveJob(job);
    textEl.value = ''; if (dateEl) dateEl.value = '';
    renderScheduleTab(job);
  },

  toggleMilestone: function (idx, done) {
    var job = BB.Store.getJob(_activeJobId);
    if (!job || !job.milestones[idx]) return;
    job.milestones[idx].done = done;
    BB.Store.saveJob(job);
    renderScheduleTab(job);
  },

  deleteMilestone: function (idx) {
    var job = BB.Store.getJob(_activeJobId);
    if (!job) return;
    job.milestones.splice(idx, 1);
    BB.Store.saveJob(job);
    renderScheduleTab(job);
  },

  addPayment: function () {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var job = BB.Store.getJob(_activeJobId);
    if (!job) return;
    job.payments = job.payments || [];
    job.payments.push({
      date: g('new-pay-date') || new Date().toISOString().slice(0,10),
      description: g('new-pay-desc'),
      amount: parseFloat(g('new-pay-amount')) || 0,
      method: g('new-pay-method')
    });
    BB.Store.saveJob(job);
    ['new-pay-date','new-pay-desc','new-pay-amount','new-pay-method'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    renderPaymentsTab(job);
    BB.toast('Payment recorded');
  },

  deletePayment: function (idx) {
    var job = BB.Store.getJob(_activeJobId);
    if (!job) return;
    job.payments.splice(idx, 1);
    BB.Store.saveJob(job);
    renderPaymentsTab(job);
  }
};
