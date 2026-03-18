/* ============================================================
   B&B Admin — Export / Settings Panel
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

BB.Panels.initExport = function () {
  var pinInput = document.getElementById('settings-pin');
  if (pinInput) pinInput.value = BB.Store.getPin();
};

BB.Export = {
  downloadAll: function () {
    var data = BB.Store.exportAll();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'bb-admin-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    BB.toast('Export downloaded');
  },

  importFile: function (input) {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!confirm('This will overwrite all admin data with the imported file. Continue?')) return;
        BB.Store.importAll(data);
        BB.toast('Import successful! Reload the page to see all changes.');
      } catch(err) {
        BB.toast('Invalid JSON file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  },

  savePin: function () {
    var el = document.getElementById('settings-pin');
    if (!el) return;
    var pin = el.value.trim();
    if (!pin || pin.length < 4) return BB.toast('PIN must be at least 4 characters', 'error');
    BB.Store.savePin(pin);
    BB.toast('PIN saved. Takes effect next session.');
  },

  clearAll: function () {
    if (!confirm('⚠️ This will permanently delete ALL admin data (projects, leads, quotes, jobs, reviews, FAQ, settings). This cannot be undone.\n\nAre you absolutely sure?')) return;
    if (!confirm('Last chance — really delete everything?')) return;
    var keys = ['bb_projects','bb_featured_projects','bb_featured_videos','bb_reviews','bb_faq','bb_leads','bb_quotes','bb_estimator_settings','bb_jobs','bb_analytics'];
    keys.forEach(function (k) { try { localStorage.removeItem(k); } catch(e) {} });
    BB.toast('All admin data cleared. Reload to start fresh.');
  },

  downloadLeadsCsv: function () {
    var leads = BB.Store.getLeads();
    if (!leads.length) return BB.toast('No leads to export', 'error');
    var cols = ['id','date','status','type','source','service_area','firstName','lastName','name','phone','email','projectType','budget','timeline','town','homeValue','description','notes'];
    var csv = cols.join(',') + '\n' + leads.map(function (l) {
      return cols.map(function (c) { return '"' + String(l[c] || '').replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    downloadText(csv, 'bb-leads-' + new Date().toISOString().slice(0,10) + '.csv', 'text/csv');
    BB.toast('Leads CSV downloaded');
  }
};

function downloadText(content, filename, mime) {
  var blob = new Blob([content], { type: mime });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
