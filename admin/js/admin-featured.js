/* ============================================================
   B&B Admin — Featured Projects Panel
   6 featured project slots. Videos auto-derive from project data.
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

BB.Panels.initFeatured = function () {
  renderFeaturedSlots();
  renderProjectPicker();
};

function getProjects() {
  return BB.Store.getProjects().filter(function (p) { return !p._hidden; });
}

function renderFeaturedSlots() {
  var featuredIds = BB.Store.getFeaturedIds();
  var projects    = BB.Store.getProjects();

  for (var i = 0; i < 6; i++) {
    var slotEl = document.getElementById('featured-slot-' + i);
    if (!slotEl) continue;
    var id = featuredIds[i];
    var p  = id ? projects.find(function (x) { return x.id === id; }) : null;

    if (p) {
      var thumb = p.thumbnail ? '../portfolio/' + p.thumbnail : '';
      slotEl.className = 'featured-slot filled';
      slotEl.innerHTML =
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#C9A063;margin-bottom:4px;">Slot ' + (i + 1) + '</div>' +
        (thumb ? '<img src="' + esc(thumb) + '" onerror="this.style.display=\'none\'">' : '') +
        '<div class="featured-slot-label">' + esc(p.title) + '</div>' +
        '<div style="font-size:10px;color:#888;margin-top:2px;">' + (p.video ? '▶ Has video' : '⚠ No video') + '</div>' +
        '<button class="btn btn-sm btn-ghost" style="margin-top:6px;" onclick="BB.Featured.clearSlot(' + i + ')">✕ Remove</button>';
    } else {
      slotEl.className = 'featured-slot';
      slotEl.innerHTML =
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#AAA;margin-bottom:4px;">Slot ' + (i + 1) + '</div>' +
        '<div class="featured-slot-empty">Click a project below<br>to assign this slot</div>';
    }
  }
}

function renderProjectPicker() {
  var list = document.getElementById('featured-project-picker');
  if (!list) return;
  var projects    = getProjects();
  var featuredIds = BB.Store.getFeaturedIds();

  if (!projects.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#AAA;font-size:13px;">No projects loaded. Go to Portfolio → Seed from Site Data first.</div>';
    return;
  }

  list.innerHTML = projects.map(function (p) {
    var isSelected = featuredIds.indexOf(p.id) >= 0;
    var slotIdx    = featuredIds.indexOf(p.id);
    var thumb      = p.thumbnail ? '../portfolio/' + p.thumbnail : '';
    return '<div class="split-list-item' + (isSelected ? ' active' : '') + '" style="cursor:pointer;" onclick="BB.Featured.assignProject(\'' + esc(p.id) + '\')">' +
      (thumb ? '<img class="split-list-thumb" src="' + esc(thumb) + '" onerror="this.style.display=\'none\'">' : '<div class="split-list-thumb"></div>') +
      '<div class="split-list-info">' +
        '<div class="split-list-title">' + esc(p.title) + '</div>' +
        '<div class="split-list-sub">' +
          esc(p.type) + ' · ' + esc(p.year || '') +
          (p.video ? ' · <span style="color:#4CAF50;">▶ video</span>' : ' · <span style="color:#E55B5B;">no video</span>') +
          (isSelected ? ' · <strong style="color:#C9A063;">Slot ' + (slotIdx + 1) + '</strong>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

BB.Featured = {
  assignProject: function (id) {
    var ids = BB.Store.getFeaturedIds().slice();
    var existingIdx = ids.indexOf(id);
    if (existingIdx >= 0) {
      // Clicking an already-featured project removes it
      ids.splice(existingIdx, 1);
    } else {
      if (ids.length >= 6) {
        BB.toast('All 6 slots are filled. Remove one first.', 'error');
        return;
      }
      ids.push(id);
    }
    BB.Store.saveFeaturedIds(ids);
    BB.toast(existingIdx >= 0 ? 'Project removed from featured' : 'Project added to featured');
    renderFeaturedSlots();
    renderProjectPicker();
  },

  clearSlot: function (idx) {
    var ids = BB.Store.getFeaturedIds().slice();
    ids.splice(idx, 1);
    BB.Store.saveFeaturedIds(ids);
    BB.toast('Slot cleared');
    renderFeaturedSlots();
    renderProjectPicker();
  },

  clearAll: function () {
    if (!confirm('Remove all featured projects?')) return;
    BB.Store.saveFeaturedIds([]);
    renderFeaturedSlots();
    renderProjectPicker();
    BB.toast('All featured projects cleared');
  }
};

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
