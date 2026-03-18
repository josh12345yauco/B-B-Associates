/* ============================================================
   B&B Admin — FAQ CMS Panel
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

BB.Panels.initFaq = function () {
  if (!BB.Store.getFaq().length) {
    BB.Faq.seedDefaults();
  }
  renderFaqList();
};

function getFaq() { return BB.Store.getFaq(); }

function renderFaqList() {
  var container = document.getElementById('faq-admin-list');
  if (!container) return;
  var items = getFaq().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

  if (!items.length) {
    container.innerHTML = '<div class="empty-state-text" style="color:#AAA;font-size:13px;padding:16px;">No FAQ items.</div>';
    return;
  }

  container.innerHTML = items.map(function (f, i) {
    return '<div class="faq-admin-item" data-id="' + esc(f.id) + '" draggable="true">' +
      '<span class="drag-handle" title="Drag to reorder">⠿</span>' +
      '<div class="faq-admin-body">' +
        '<input class="form-control faq-admin-q" value="' + esc(f.question) + '" placeholder="Question" style="font-weight:600;margin-bottom:8px;">' +
        '<textarea class="form-control faq-admin-a" rows="3" placeholder="Answer">' + esc(f.answer) + '</textarea>' +
        '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;">' +
          '<button class="btn btn-sm btn-primary" onclick="BB.Faq.save(this)">Save</button>' +
          '<button class="btn btn-sm btn-ghost" onclick="BB.Faq.moveUp(\'' + esc(f.id) + '\')">↑ Up</button>' +
          '<button class="btn btn-sm btn-ghost" onclick="BB.Faq.moveDown(\'' + esc(f.id) + '\')">↓ Down</button>' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888;">' +
            '<label class="toggle"><input type="checkbox"' + (f.hidden ? ' checked' : '') + ' onchange="BB.Faq.toggleHidden(\'' + esc(f.id) + '\',this.checked)"><span class="toggle-slider"></span></label>' +
            'Hidden' +
          '</label>' +
          '<button class="btn btn-sm btn-danger" onclick="BB.Faq.delete(\'' + esc(f.id) + '\')">Delete</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

BB.Faq = {
  seedDefaults: function () {
    // Re-use the defaults from data-layer.js by reading the raw script
    fetch('../js/data-layer.js')
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var match = text.match(/var DEFAULT_FAQ\s*=\s*(\[[\s\S]*?\]);/);
        if (!match) { BB.toast('Could not extract defaults', 'error'); return; }
        var arr = (new Function('return ' + match[1]))();
        BB.Store.saveFaq(arr);
        renderFaqList();
        BB.toast('Seeded ' + arr.length + ' FAQ items');
      })
      .catch(function () {
        BB.toast('Could not seed FAQ; create items manually', 'error');
      });
  },

  save: function (btn) {
    var item = btn.closest('.faq-admin-item');
    var id = item.dataset.id;
    var q = item.querySelector('.faq-admin-q').value.trim();
    var a = item.querySelector('.faq-admin-a').value.trim();
    if (!q || !a) return BB.toast('Question and answer required', 'error');

    var faq = BB.Store.getFaq();
    var entry = faq.find(function (f) { return f.id === id; });
    if (entry) { entry.question = q; entry.answer = a; }
    BB.Store.saveFaq(faq);
    BB.toast('FAQ item saved');
  },

  toggleHidden: function (id, hidden) {
    var faq = BB.Store.getFaq();
    var f = faq.find(function (x) { return x.id === id; });
    if (f) { f.hidden = hidden; BB.Store.saveFaq(faq); BB.toast('Updated'); }
  },

  moveUp: function (id) {
    var faq = BB.Store.getFaq().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var idx = faq.findIndex(function (f) { return f.id === id; });
    if (idx <= 0) return;
    var tmp = faq[idx].order; faq[idx].order = faq[idx - 1].order; faq[idx - 1].order = tmp;
    BB.Store.saveFaq(faq);
    renderFaqList();
  },

  moveDown: function (id) {
    var faq = BB.Store.getFaq().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var idx = faq.findIndex(function (f) { return f.id === id; });
    if (idx < 0 || idx >= faq.length - 1) return;
    var tmp = faq[idx].order; faq[idx].order = faq[idx + 1].order; faq[idx + 1].order = tmp;
    BB.Store.saveFaq(faq);
    renderFaqList();
  },

  delete: function (id) {
    if (!confirm('Delete this FAQ item?')) return;
    var faq = BB.Store.getFaq().filter(function (f) { return f.id !== id; });
    BB.Store.saveFaq(faq);
    renderFaqList();
    BB.toast('Deleted', 'error');
  },

  addNew: function () {
    var faq = BB.Store.getFaq();
    var maxOrder = faq.reduce(function (m, f) { return Math.max(m, f.order || 0); }, 0);
    faq.push({ id: 'faq-' + Date.now(), question: 'New question', answer: 'Answer here.', order: maxOrder + 1, hidden: false });
    BB.Store.saveFaq(faq);
    renderFaqList();
  }
};

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
