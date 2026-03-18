/* ============================================================
   B&B Admin — Forms Panel
   Edit contact form fields. Config stored in localStorage.
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

var FORM_STORAGE_KEY = 'BB_FORM_CONFIG';

var DEFAULT_FORM_CONFIG = [
  {
    id: 'row-names',
    type: 'row',
    fields: [
      { id: 'f-first', type: 'text', name: 'first_name', label: 'First Name', placeholder: 'Jane', required: true },
      { id: 'f-last',  type: 'text', name: 'last_name',  label: 'Last Name',  placeholder: 'Smith', required: true }
    ]
  },
  { id: 'f-phone',   type: 'tel',      name: 'phone',        label: 'Phone Number',                          placeholder: '(215) 555-0100',                                             required: true  },
  { id: 'f-email',   type: 'email',    name: 'email',        label: 'Email Address',                         placeholder: 'jane@email.com',                                             required: true  },
  { id: 'f-project', type: 'select',   name: 'project_type', label: 'Project Type',                          required: false, options: [
    { value: 'kitchen',  label: 'Kitchen Remodeling'  },
    { value: 'bathroom', label: 'Bathroom Renovation' },
    { value: 'both',     label: 'Kitchen + Bathroom'  }
  ]},
  { id: 'f-message', type: 'textarea', name: 'message',      label: 'Tell Us About Your Project (optional)', placeholder: 'Briefly describe your vision, timeline, or any questions...', required: false, rows: 3 }
];

function getFormConfig() {
  try {
    var s = localStorage.getItem(FORM_STORAGE_KEY);
    return s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_FORM_CONFIG));
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_FORM_CONFIG));
  }
}

function saveFormConfig(config) {
  localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(config));
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ── Panel init ───────────────────────────────────────────── */
BB.Panels.initForms = function () { renderFormPanel(); };

function renderFormPanel() {
  var container = document.getElementById('forms-admin-list');
  if (!container) return;
  var config = getFormConfig();
  if (!config.length) {
    container.innerHTML = '<p style="color:#999;padding:16px 0;">No fields configured. Use "+ Add Field" above.</p>';
    return;
  }
  container.innerHTML = config.map(function (f, idx) {
    return renderFieldCard(f, idx, config.length);
  }).join('');
}

var TYPE_COLORS = { text: '#3b82f6', tel: '#10b981', email: '#f59e0b', select: '#8b5cf6', textarea: '#ef4444', row: '#6b7280' };
var TYPE_LABELS = { text: 'Text', tel: 'Phone', email: 'Email', select: 'Dropdown', textarea: 'Textarea', row: 'Two-Column Row' };

function typeBadge(type) {
  return '<span style="background:' + (TYPE_COLORS[type] || '#888') + ';color:#fff;font-size:10px;font-weight:700;padding:2px 9px;border-radius:4px;text-transform:uppercase;letter-spacing:.06em;">' + (TYPE_LABELS[type] || type) + '</span>';
}

function moveButtons(idx, total) {
  return '<button class="btn btn-sm btn-ghost" ' + (idx === 0 ? 'disabled' : 'onclick="BB.Forms.move(' + idx + ',-1)"') + '>↑</button>' +
         '<button class="btn btn-sm btn-ghost" ' + (idx === total - 1 ? 'disabled' : 'onclick="BB.Forms.move(' + idx + ',1)"') + '>↓</button>';
}

function renderFieldCard(f, idx, total) {
  var isRow = f.type === 'row';
  var moves = moveButtons(idx, total);
  var deleteBtn = '<button class="btn btn-sm btn-danger" onclick="BB.Forms.deleteField(\'' + esc(f.id) + '\')">Delete</button>';

  if (isRow) {
    var cols = (f.fields || []).map(function (sf, si) {
      return '<div style="flex:1;min-width:0;background:#f9fafb;border:1px solid #e5e7eb;padding:12px;border-radius:4px;">' +
        '<div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em;">Column ' + (si + 1) + '</div>' +
        '<div class="form-group" style="margin-bottom:8px;"><label class="form-label">Label</label>' +
        '<input class="form-control" value="' + esc(sf.label) + '" onchange="BB.Forms.updateSubField(\'' + esc(f.id) + '\',' + si + ',\'label\',this.value)"></div>' +
        '<div class="form-group" style="margin-bottom:8px;"><label class="form-label">Placeholder</label>' +
        '<input class="form-control" value="' + esc(sf.placeholder || '') + '" onchange="BB.Forms.updateSubField(\'' + esc(f.id) + '\',' + si + ',\'placeholder\',this.value)"></div>' +
        '<div class="form-group"><label class="form-label">Field Name (name attr)</label>' +
        '<input class="form-control" value="' + esc(sf.name) + '" onchange="BB.Forms.updateSubField(\'' + esc(f.id) + '\',' + si + ',\'name\',this.value)"></div>' +
        '</div>';
    }).join('');

    return '<div class="admin-card" style="margin-bottom:12px;">' +
      '<div class="admin-card-header">' + typeBadge(f.type) + '<div style="display:flex;gap:6px;">' + moves + deleteBtn + '</div></div>' +
      '<div class="admin-card-body"><div style="display:flex;gap:12px;flex-wrap:wrap;">' + cols + '</div></div></div>';
  }

  var reqToggle = '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#6b7280;cursor:pointer;">' +
    '<label class="toggle"><input type="checkbox"' + (f.required ? ' checked' : '') +
    ' onchange="BB.Forms.updateField(\'' + esc(f.id) + '\',\'required\',this.checked)"><span class="toggle-slider"></span></label>Required</label>';

  var mainFields = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;">' +
    '<div class="form-group"><label class="form-label">Label</label>' +
    '<input class="form-control" value="' + esc(f.label) + '" onchange="BB.Forms.updateField(\'' + esc(f.id) + '\',\'label\',this.value)"></div>' +
    (f.type !== 'select'
      ? '<div class="form-group"><label class="form-label">Placeholder</label>' +
        '<input class="form-control" value="' + esc(f.placeholder || '') + '" onchange="BB.Forms.updateField(\'' + esc(f.id) + '\',\'placeholder\',this.value)"></div>'
      : '<div class="form-group"><label class="form-label">Field Name (name attr)</label>' +
        '<input class="form-control" value="' + esc(f.name) + '" onchange="BB.Forms.updateField(\'' + esc(f.id) + '\',\'name\',this.value)"></div>') +
    '</div>' +
    (f.type !== 'select'
      ? '<div class="form-group" style="margin-bottom:10px;"><label class="form-label">Field Name (name attr)</label>' +
        '<input class="form-control" value="' + esc(f.name) + '" onchange="BB.Forms.updateField(\'' + esc(f.id) + '\',\'name\',this.value)"></div>'
      : '');

  var optionsHtml = '';
  if (f.type === 'select') {
    var rows = (f.options || []).map(function (o, oi) {
      return '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">' +
        '<input class="form-control" style="flex:1;" placeholder="Label" value="' + esc(o.label) + '" onchange="BB.Forms.updateOption(\'' + esc(f.id) + '\',' + oi + ',\'label\',this.value)">' +
        '<input class="form-control" style="flex:1;" placeholder="Value (slug)" value="' + esc(o.value) + '" onchange="BB.Forms.updateOption(\'' + esc(f.id) + '\',' + oi + ',\'value\',this.value)">' +
        '<button class="btn btn-sm btn-danger" onclick="BB.Forms.deleteOption(\'' + esc(f.id) + '\',' + oi + ')">×</button></div>';
    }).join('');
    optionsHtml = '<div class="form-group" style="margin-top:4px;border-top:1px solid #f0f0f0;padding-top:12px;">' +
      '<label class="form-label" style="margin-bottom:8px;">Dropdown Options</label>' +
      rows +
      '<button class="btn btn-sm btn-ghost" style="margin-top:4px;" onclick="BB.Forms.addOption(\'' + esc(f.id) + '\')">+ Add Option</button></div>';
  }

  return '<div class="admin-card" style="margin-bottom:12px;">' +
    '<div class="admin-card-header">' + typeBadge(f.type) +
    '<div style="display:flex;gap:6px;align-items:center;">' + reqToggle + moves + deleteBtn + '</div></div>' +
    '<div class="admin-card-body">' + mainFields + optionsHtml + '</div></div>';
}

/* ── BB.Forms namespace ───────────────────────────────────── */
BB.Forms = {

  updateField: function (id, key, val) {
    var config = getFormConfig();
    var f = config.find(function (x) { return x.id === id; });
    if (f) { f[key] = val; saveFormConfig(config); }
  },

  updateSubField: function (rowId, si, key, val) {
    var config = getFormConfig();
    var row = config.find(function (x) { return x.id === rowId; });
    if (row && row.fields && row.fields[si]) {
      row.fields[si][key] = val;
      saveFormConfig(config);
    }
  },

  updateOption: function (id, oi, key, val) {
    var config = getFormConfig();
    var f = config.find(function (x) { return x.id === id; });
    if (f && f.options && f.options[oi]) { f.options[oi][key] = val; saveFormConfig(config); }
  },

  addOption: function (id) {
    var config = getFormConfig();
    var f = config.find(function (x) { return x.id === id; });
    if (f) {
      f.options = f.options || [];
      f.options.push({ value: 'option' + Date.now(), label: 'New Option' });
      saveFormConfig(config);
      renderFormPanel();
    }
  },

  deleteOption: function (id, oi) {
    var config = getFormConfig();
    var f = config.find(function (x) { return x.id === id; });
    if (f && f.options) { f.options.splice(oi, 1); saveFormConfig(config); renderFormPanel(); }
  },

  deleteField: function (id) {
    if (!confirm('Delete this field from the contact form?')) return;
    var config = getFormConfig().filter(function (f) { return f.id !== id; });
    saveFormConfig(config);
    renderFormPanel();
    BB.toast('Field deleted');
  },

  move: function (idx, dir) {
    var config = getFormConfig();
    var ni = idx + dir;
    if (ni < 0 || ni >= config.length) return;
    var tmp = config[idx]; config[idx] = config[ni]; config[ni] = tmp;
    saveFormConfig(config);
    renderFormPanel();
  },

  addField: function (type) {
    var config = getFormConfig();
    var id = 'f-' + Date.now();
    var nf;
    if (type === 'row') {
      nf = { id: id, type: 'row', fields: [
        { id: id + '-a', type: 'text', name: 'field_a', label: 'Field A', placeholder: '', required: false },
        { id: id + '-b', type: 'text', name: 'field_b', label: 'Field B', placeholder: '', required: false }
      ]};
    } else if (type === 'select') {
      nf = { id: id, type: 'select', name: 'new_select', label: 'Select Field', required: false,
        options: [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }] };
    } else {
      nf = { id: id, type: type, name: 'new_field', label: 'New Field', placeholder: '', required: false };
      if (type === 'textarea') nf.rows = 3;
    }
    config.push(nf);
    saveFormConfig(config);
    renderFormPanel();
    BB.toast('Field added');
  },

  reset: function () {
    if (!confirm('Reset to defaults? All custom fields will be removed.')) return;
    localStorage.removeItem(FORM_STORAGE_KEY);
    renderFormPanel();
    BB.toast('Form reset to defaults');
  }
};
