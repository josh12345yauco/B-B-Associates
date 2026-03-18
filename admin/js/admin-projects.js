/* ============================================================
   B&B Admin — Portfolio CMS Panel
   Auto-seeds from projects-data.js on first load.
   Drag-to-reorder: order saved to bb_projects → reflects on frontend.
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

var _selectedProjectId = null;
var _dragSrcId = null;

BB.Panels.initProjects = function () {
  var stored = BB.Store.getProjects();
  if (!stored.length) {
    // Auto-seed from hardcoded projects-data.js on first open
    BB.Projects.seedFromSite(true /* silent */);
  } else {
    renderProjectList();
    wireProjectForm();
  }
};

/* ── RENDER LIST ─────────────────────────────────────────── */
function renderProjectList() {
  var list = document.getElementById('project-list-body');
  if (!list) return;
  var projects = BB.Store.getProjects().filter(function (p) { return !p._hidden; });

  if (!projects.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#AAA;font-size:13px;">No projects. Click "Seed from Site" to load.</div>';
    return;
  }

  list.innerHTML = projects.map(function (p, idx) {
    var thumb = p.thumbnail ? '../portfolio/' + p.thumbnail : '';
    return '<div class="split-list-item' + (_selectedProjectId === p.id ? ' active' : '') + '" ' +
      'data-id="' + esc(p.id) + '" ' +
      'draggable="true" ' +
      'onclick="BB.Projects.select(\'' + esc(p.id) + '\')" ' +
      'ondragstart="BB.Projects.dragStart(event,\'' + esc(p.id) + '\')" ' +
      'ondragover="BB.Projects.dragOver(event)" ' +
      'ondrop="BB.Projects.drop(event,\'' + esc(p.id) + '\')" ' +
      'ondragleave="BB.Projects.dragLeave(event)" ' +
      'style="user-select:none;">' +
      '<span class="drag-handle" title="Drag to reorder" style="font-size:18px;color:#CCC;cursor:grab;flex-shrink:0;">⠿</span>' +
      (thumb ? '<img class="split-list-thumb" src="' + esc(thumb) + '" onerror="this.style.display=\'none\'" loading="lazy">' : '<div class="split-list-thumb" style="background:#E8E6E0;"></div>') +
      '<div class="split-list-info">' +
        '<div class="split-list-title">' + esc(p.title) + '</div>' +
        '<div class="split-list-sub">' + esc(p.type) + ' · ' + esc(p.year || '') + (p.video ? ' · ▶' : '') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ── POPULATE FORM ───────────────────────────────────────── */
function populateForm(p) {
  var s = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
  s('pf-id', p.id);
  s('pf-title', p.title);
  s('pf-type', p.type);
  s('pf-style', p.style);
  s('pf-year', p.year);
  s('pf-town', p.town);
  s('pf-investment', p.investment);
  s('pf-duration', p.duration);
  s('pf-description', p.description);
  s('pf-thumbnail', p.thumbnail);
  s('pf-video', p.video);
  s('pf-highlights', (p.highlights || []).join('\n'));
  s('pf-images', (p.images || []).join('\n'));

  var thumb  = p.thumbnail ? '../portfolio/' + p.thumbnail : '';
  var prevEl = document.getElementById('pf-thumb-preview');
  if (prevEl) {
    prevEl.src = thumb;
    prevEl.style.display = thumb ? 'block' : 'none';
  }
}

/* ── WIRE FORM BUTTONS ───────────────────────────────────── */
function wireProjectForm() {
  var saveBtn   = document.getElementById('pf-save');
  var deleteBtn = document.getElementById('pf-delete');
  var addBtn    = document.getElementById('pf-add');
  var seedBtn   = document.getElementById('pf-seed');

  if (saveBtn)   saveBtn.addEventListener('click',   function () { BB.Projects.save(); });
  if (deleteBtn) deleteBtn.addEventListener('click', function () { BB.Projects.deleteProject(); });
  if (addBtn)    addBtn.addEventListener('click',    function () { BB.Projects.addNew(); });
  if (seedBtn)   seedBtn.addEventListener('click',   function () { BB.Projects.seedFromSite(false); });
}

/* ── PUBLIC API ──────────────────────────────────────────── */
BB.Projects = {

  select: function (id) {
    _selectedProjectId = id;
    var projects = BB.Store.getProjects();
    var p = projects.find(function (x) { return x.id === id; });
    if (!p) return;
    populateForm(p);
    renderProjectList();
    document.getElementById('project-form-wrap').style.display = 'block';
    document.getElementById('project-form-placeholder').style.display = 'none';
  },

  save: function () {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var id = g('pf-id');
    if (!id) return BB.toast('No project selected', 'error');

    var highlights = g('pf-highlights').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var images     = g('pf-images').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var projects   = BB.Store.getProjects();
    var idx        = projects.findIndex(function (p) { return p.id === id; });

    var updated = Object.assign({}, idx >= 0 ? projects[idx] : {}, {
      id:          id,
      title:       g('pf-title'),
      type:        g('pf-type'),
      style:       g('pf-style'),
      year:        parseInt(g('pf-year')) || null,
      town:        g('pf-town'),
      investment:  g('pf-investment'),
      duration:    g('pf-duration'),
      description: g('pf-description'),
      thumbnail:   g('pf-thumbnail'),
      video:       g('pf-video') || null,
      highlights:  highlights,
      images:      images,
      tags:        [g('pf-type').toLowerCase()]
    });

    if (idx >= 0) { projects[idx] = updated; } else { projects.push(updated); }
    BB.Store.saveProjects(projects);
    BB.toast('Project saved');
    renderProjectList();
  },

  deleteProject: function () {
    var idEl = document.getElementById('pf-id');
    var id = idEl ? idEl.value : null;
    if (!id) return;
    if (!confirm('Hide this project? It will no longer appear on the site.')) return;
    var projects = BB.Store.getProjects();
    var idx = projects.findIndex(function (p) { return p.id === id; });
    if (idx >= 0) {
      projects[idx]._hidden = true;
      BB.Store.saveProjects(projects);
      BB.toast('Project hidden');
      _selectedProjectId = null;
      document.getElementById('project-form-wrap').style.display = 'none';
      document.getElementById('project-form-placeholder').style.display = 'block';
      renderProjectList();
    }
  },

  addNew: function () {
    var id = 'project-' + Date.now();
    var projects = BB.Store.getProjects();
    projects.unshift({ // Add to top
      id: id, title: 'New Project', type: 'Kitchen', style: 'Transitional',
      year: new Date().getFullYear(), town: 'Pennsylvania', investment: '',
      duration: '', description: '', thumbnail: '', video: null,
      highlights: [], images: [], tags: ['kitchen']
    });
    BB.Store.saveProjects(projects);
    BB.Projects.select(id);
    BB.toast('New project created — edit and save');
  },

  seedFromSite: function (silent) {
    if (!silent && !confirm('Load all hardcoded projects from the site into the admin store? This replaces any admin-only changes.')) return;

    fetch('../js/projects-data.js')
      .then(function (r) { return r.text(); })
      .then(function (text) {
        // Extract the array literal
        var match = text.match(/const projects\s*=\s*(\[[\s\S]*?\]);/);
        if (!match) throw new Error('Could not parse projects-data.js');
        // eslint-disable-next-line no-new-func
        var arr = (new Function('return ' + match[1]))();
        BB.Store.saveProjects(arr);
        if (!silent) BB.toast('Loaded ' + arr.length + ' projects from site data');
        renderProjectList();
        wireProjectForm();
      })
      .catch(function (e) {
        if (!silent) BB.toast('Seed failed: ' + e.message, 'error');
        else { renderProjectList(); wireProjectForm(); }
      });
  },

  /* ── DRAG TO REORDER ─────────────────────────────────── */
  dragStart: function (e, id) {
    _dragSrcId = id;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  },

  dragOver: function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.style.borderTop = '2px solid #C9A063';
    return false;
  },

  dragLeave: function (e) {
    e.currentTarget.style.borderTop = '';
  },

  drop: function (e, targetId) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderTop = '';

    if (_dragSrcId === targetId) return;

    var projects = BB.Store.getProjects();
    var srcIdx = projects.findIndex(function (p) { return p.id === _dragSrcId; });
    var tgtIdx = projects.findIndex(function (p) { return p.id === targetId; });
    if (srcIdx === -1 || tgtIdx === -1) return;

    // Remove source and insert before target
    var moved = projects.splice(srcIdx, 1)[0];
    var newTgt = projects.findIndex(function (p) { return p.id === targetId; });
    projects.splice(newTgt, 0, moved);

    BB.Store.saveProjects(projects);
    BB.toast('Order saved — portfolio updated');
    renderProjectList();

    // Reset opacity
    document.querySelectorAll('.split-list-item').forEach(function (el) {
      el.style.opacity = '';
    });
  }
};

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
