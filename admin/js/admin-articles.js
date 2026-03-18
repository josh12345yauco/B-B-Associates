/* ============================================================
   B&B Admin — Articles CMS Panel
   Manages journal articles. Changes are held in sessionStorage
   and overlay the base ARTICLES array from articles-data.js.
   To publish permanently, copy the export into articles-data.js.
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

// ── STORAGE HELPERS ──────────────────────────────────────────
var ART_KEY = 'bb_admin_articles';

function getArticles() {
  try {
    var stored = sessionStorage.getItem(ART_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  // Fallback to the static data file if available
  if (typeof ARTICLES !== 'undefined') {
    return JSON.parse(JSON.stringify(ARTICLES));
  }
  return [];
}

function saveArticles(arr) {
  try { sessionStorage.setItem(ART_KEY, JSON.stringify(arr)); } catch (e) {}
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── INIT ──────────────────────────────────────────────────────
BB.Panels.initArticles = function () {
  // Seed sessionStorage from static data if not already seeded
  if (!sessionStorage.getItem(ART_KEY) && typeof ARTICLES !== 'undefined') {
    saveArticles(JSON.parse(JSON.stringify(ARTICLES)));
  }
  renderArticleList();
  bindArticleButtons();
};

// ── RENDER LIST ───────────────────────────────────────────────
function renderArticleList() {
  var container = document.getElementById('article-list-body');
  if (!container) return;
  var articles = getArticles();

  if (!articles.length) {
    container.innerHTML = '<div style="color:#AAA;font-size:13px;padding:16px;">No articles found.</div>';
    return;
  }

  container.innerHTML = articles.map(function (a) {
    return '<div class="split-list-item" data-id="' + esc(a.id) + '" onclick="BB.Articles.edit(\'' + esc(a.id) + '\')" style="cursor:pointer;">' +
      '<div style="font-weight:600;font-size:13px;line-height:1.3;margin-bottom:4px;">' + esc(a.title) + '</div>' +
      '<div style="font-size:11px;color:#888;">' + esc(a.category) + ' · ' + esc(a.date) + ' · ' + esc(a.readTime) + '</div>' +
    '</div>';
  }).join('');
}

// ── BIND BUTTONS ──────────────────────────────────────────────
function bindArticleButtons() {
  var addBtn = document.getElementById('art-add');
  if (addBtn) {
    addBtn.addEventListener('click', function () { BB.Articles.newArticle(); });
  }

  var saveBtn = document.getElementById('af-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', function () { BB.Articles.save(); });
  }

  var deleteBtn = document.getElementById('af-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function () { BB.Articles.delete(); });
  }

  var heroInput = document.getElementById('af-hero');
  if (heroInput) {
    heroInput.addEventListener('input', function () {
      var preview = document.getElementById('af-hero-preview');
      if (!preview) return;
      if (heroInput.value) {
        preview.src = heroInput.value;
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    });
  }
}

// ── ARTICLE ACTIONS ───────────────────────────────────────────
BB.Articles = {

  newArticle: function () {
    var placeholder = document.getElementById('article-form-placeholder');
    var form = document.getElementById('article-form-wrap');
    if (placeholder) placeholder.style.display = 'none';
    if (form) form.style.display = 'block';

    // Clear all fields
    document.getElementById('af-id').value = '';
    document.getElementById('af-title').value = '';
    document.getElementById('af-category').value = '';
    document.getElementById('af-date').value = '';
    document.getElementById('af-readtime').value = '';
    document.getElementById('af-tags').value = '';
    document.getElementById('af-hero').value = '';
    document.getElementById('af-excerpt').value = '';
    document.getElementById('af-body').value = '';
    var preview = document.getElementById('af-hero-preview');
    if (preview) preview.style.display = 'none';

    // Deselect active list item
    document.querySelectorAll('#article-list-body .split-list-item').forEach(function (el) {
      el.classList.remove('active');
    });
  },

  edit: function (id) {
    var articles = getArticles();
    var article = articles.find(function (a) { return a.id === id; });
    if (!article) return;

    var placeholder = document.getElementById('article-form-placeholder');
    var form = document.getElementById('article-form-wrap');
    if (placeholder) placeholder.style.display = 'none';
    if (form) form.style.display = 'block';

    document.getElementById('af-id').value = article.id;
    document.getElementById('af-title').value = article.title || '';
    document.getElementById('af-category').value = article.category || '';
    document.getElementById('af-date').value = article.date || '';
    document.getElementById('af-readtime').value = article.readTime || '';
    document.getElementById('af-tags').value = (article.tags || []).join(', ');
    document.getElementById('af-hero').value = article.heroImage || '';
    document.getElementById('af-excerpt').value = article.excerpt || '';
    document.getElementById('af-body').value = article.body || '';

    var preview = document.getElementById('af-hero-preview');
    if (preview) {
      if (article.heroImage) {
        preview.src = article.heroImage;
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    }

    // Highlight active list item
    document.querySelectorAll('#article-list-body .split-list-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.id === id);
    });
  },

  save: function () {
    var id = document.getElementById('af-id').value.trim();
    var title = document.getElementById('af-title').value.trim();
    var category = document.getElementById('af-category').value.trim();
    var date = document.getElementById('af-date').value.trim();
    var readTime = document.getElementById('af-readtime').value.trim();
    var tagsRaw = document.getElementById('af-tags').value.trim();
    var heroImage = document.getElementById('af-hero').value.trim();
    var excerpt = document.getElementById('af-excerpt').value.trim();
    var body = document.getElementById('af-body').value.trim();

    if (!title) { BB.toast('Title is required', 'error'); return; }

    var tags = tagsRaw ? tagsRaw.split(',').map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean) : [];

    var articles = getArticles();

    if (!id) {
      // New article — generate slug from title
      id = slugify(title);
      // Ensure uniqueness
      var base = id;
      var n = 1;
      while (articles.find(function (a) { return a.id === id; })) { id = base + '-' + (n++); }
      articles.unshift({ id: id, title: title, category: category, tags: tags, date: date, readTime: readTime, excerpt: excerpt, heroImage: heroImage, body: body });
    } else {
      var entry = articles.find(function (a) { return a.id === id; });
      if (entry) {
        entry.title = title;
        entry.category = category;
        entry.tags = tags;
        entry.date = date;
        entry.readTime = readTime;
        entry.excerpt = excerpt;
        entry.heroImage = heroImage;
        entry.body = body;
      } else {
        articles.unshift({ id: id, title: title, category: category, tags: tags, date: date, readTime: readTime, excerpt: excerpt, heroImage: heroImage, body: body });
      }
    }

    saveArticles(articles);
    document.getElementById('af-id').value = id;
    renderArticleList();
    BB.toast('Article saved — ' + id);

    // Re-highlight
    document.querySelectorAll('#article-list-body .split-list-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.id === id);
    });
  },

  delete: function () {
    var id = document.getElementById('af-id').value.trim();
    if (!id) return;
    if (!confirm('Delete article "' + id + '"? This cannot be undone in the current session.')) return;

    var articles = getArticles().filter(function (a) { return a.id !== id; });
    saveArticles(articles);
    renderArticleList();

    // Reset form
    document.getElementById('af-id').value = '';
    document.getElementById('article-form-wrap').style.display = 'none';
    document.getElementById('article-form-placeholder').style.display = 'block';

    BB.toast('Article deleted');
  },

  exportJSON: function () {
    var articles = getArticles();
    var json = 'const ARTICLES = ' + JSON.stringify(articles, null, 2) + ';';
    var blob = new Blob([json], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'articles-data.js';
    a.click();
    URL.revokeObjectURL(url);
    BB.toast('Exported articles-data.js');
  }
};
