/* ============================================================
   B&B Admin — Reviews CMS Panel
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

BB.Panels.initReviews = function () {
  // Seed from project data if empty
  if (!BB.Store.getReviews().length) {
    BB.Reviews.seedFromProjects();
  }
  renderReviewsTable();
};

function renderReviewsTable() {
  var tbody = document.getElementById('reviews-tbody');
  if (!tbody) return;
  var reviews = BB.Store.getReviews();

  if (!reviews.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:24px;text-align:center;color:#AAA;">No reviews yet.</td></tr>';
    return;
  }

  tbody.innerHTML = reviews.map(function (r, i) {
    return '<tr>' +
      '<td>' + stars(r.stars || 5) + '</td>' +
      '<td>' + esc(r.author || '—') + '</td>' +
      '<td>' + esc(r.town || '—') + '</td>' +
      '<td>' + esc(r.source || 'Google') + '</td>' +
      '<td>' + fmtDate(r.date) + '</td>' +
      '<td>' +
        '<label class="toggle">' +
          '<input type="checkbox"' + (r.featured ? ' checked' : '') + ' onchange="BB.Reviews.toggleFeatured(\'' + esc(r.id) + '\',this.checked)">' +
          '<span class="toggle-slider"></span>' +
        '</label>' +
      '</td>' +
      '<td style="display:flex;gap:6px;">' +
        '<button class="btn btn-sm btn-ghost" onclick="BB.Reviews.edit(\'' + esc(r.id) + '\')">Edit</button>' +
        '<button class="btn btn-sm btn-danger" onclick="BB.Reviews.delete(\'' + esc(r.id) + '\')">✕</button>' +
      '</td>' +
    '</tr>' +
    '<tr id="rev-drawer-' + esc(r.id) + '" style="display:none;">' +
      '<td colspan="7"><div class="drawer-content"><em style="font-size:13px;color:#555;">"' + esc(r.text) + '"</em></div></td>' +
    '</tr>';
  }).join('');
}

function stars(n) {
  return '<span class="stars">' + '★'.repeat(Math.max(0, Math.min(5, n || 5))) + '</span>';
}

BB.Reviews = {
  seedFromProjects: function () {
    // This reads from the main projects-data.js via fetch (similar to seed in projects panel)
    fetch('../js/projects-data.js')
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var match = text.match(/const projects\s*=\s*(\[[\s\S]*?\]);/);
        if (!match) return;
        var arr = (new Function('return ' + match[1]))();
        var reviews = [];
        arr.forEach(function (p) {
          if (p.review && p.review.text) {
            reviews.push({
              id: 'rev-' + p.id,
              text: p.review.text,
              author: p.review.author || '',
              town: p.review.town || '',
              stars: p.review.stars || 5,
              source: p.review.source || 'Google',
              featured: false,
              projectId: p.id,
              date: new Date().toISOString()
            });
          }
        });
        BB.Store.saveReviews(reviews);
        renderReviewsTable();
        BB.toast('Seeded ' + reviews.length + ' reviews');
      })
      .catch(function (e) { BB.toast('Seed failed: ' + e.message, 'error'); });
  },

  toggleFeatured: function (id, val) {
    var reviews = BB.Store.getReviews();
    var r = reviews.find(function (x) { return x.id === id; });
    if (r) { r.featured = val; BB.Store.saveReviews(reviews); BB.toast('Saved'); }
  },

  edit: function (id) {
    var drawer = document.getElementById('rev-drawer-' + id);
    if (drawer) {
      drawer.style.display = drawer.style.display === 'none' ? 'table-row' : 'none';
    }
  },

  delete: function (id) {
    if (!confirm('Delete this review?')) return;
    var reviews = BB.Store.getReviews().filter(function (r) { return r.id !== id; });
    BB.Store.saveReviews(reviews);
    renderReviewsTable();
    BB.toast('Review deleted', 'error');
  },

  saveNew: function () {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var review = {
      id: 'rev-' + Date.now(),
      date: new Date().toISOString(),
      text: g('rev-text'),
      author: g('rev-author'),
      town: g('rev-town'),
      stars: parseInt(g('rev-stars')) || 5,
      source: g('rev-source') || 'Google',
      featured: false,
      projectId: g('rev-project-id') || null
    };
    if (!review.text || !review.author) return BB.toast('Text and author required', 'error');
    var reviews = BB.Store.getReviews();
    reviews.push(review);
    BB.Store.saveReviews(reviews);
    renderReviewsTable();
    BB.toast('Review added');
    // Clear form
    ['rev-text','rev-author','rev-town','rev-stars','rev-source','rev-project-id'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('add-review-form').style.display = 'none';
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
