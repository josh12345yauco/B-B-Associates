/* ============================================================
   B&B Admin — Core (boot, PIN gate, hash routing)
   ============================================================ */

(function () {

  /* ── PIN GATE ─────────────────────────────────────────── */
  var CORRECT_PIN = BB.Store.getPin();
  var SESSION_KEY = 'bb_admin_unlocked';

  function isUnlocked() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, '1');
    document.getElementById('pin-gate').style.display = 'none';
    init();
  }

  function initPinGate() {
    var gate = document.getElementById('pin-gate');
    var input = document.getElementById('pin-input');
    var btn = document.getElementById('pin-submit');
    var err = document.getElementById('pin-error');

    if (isUnlocked()) {
      gate.style.display = 'none';
      init();
      return;
    }

    gate.style.display = 'flex';

    function attempt() {
      var pin = input.value.trim();
      var stored = BB.Store.getPin();
      if (pin === stored) {
        unlock();
      } else {
        err.textContent = 'Incorrect PIN. Try again.';
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attempt();
    });
    input.focus();
  }

  /* ── ROUTING ──────────────────────────────────────────── */
  var PANELS = {
    dashboard:  { label: 'Dashboard',  init: BB.Panels.initDashboard  },
    leads:      { label: 'Leads',      init: BB.Panels.initLeads      },
    projects:   { label: 'Portfolio',  init: BB.Panels.initProjects   },
    articles:   { label: 'Articles',   init: BB.Panels.initArticles   },
    featured:   { label: 'Featured',   init: BB.Panels.initFeatured   },
    reviews:    { label: 'Reviews',    init: BB.Panels.initReviews    },
    faq:        { label: 'FAQ',        init: BB.Panels.initFaq        },
    estimator:  { label: 'Estimator',  init: BB.Panels.initEstimator  },
    quotes:     { label: 'Quotes',     init: BB.Panels.initQuotes     },
    tracker:    { label: 'Tracker',    init: BB.Panels.initTracker    },
    analytics:  { label: 'Analytics',  init: BB.Panels.initAnalytics   },
    forms:      { label: 'Forms',      init: BB.Panels.initForms      },
    export:     { label: 'Export',     init: BB.Panels.initExport     }
  };

  var currentSection = null;

  function navigate(section) {
    if (!PANELS[section]) section = 'dashboard';

    // Update sidebar
    document.querySelectorAll('.sidebar-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.section === section);
    });

    // Update panels
    document.querySelectorAll('.admin-panel').forEach(function (el) {
      el.classList.toggle('active', el.id === 'panel-' + section);
    });

    // Update topbar title
    var titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = PANELS[section].label;

    // Scroll content to top on mobile section switch
    var content = document.querySelector('.admin-content');
    if (content) content.scrollTop = 0;
    window.scrollTo(0, 0);

    // Init panel if changed
    if (currentSection !== section) {
      currentSection = section;
      if (PANELS[section] && typeof PANELS[section].init === 'function') {
        PANELS[section].init();
      }
    }

    window.location.hash = section;
    checkUsage();
  }

  /* ── USAGE BANNER ─────────────────────────────────────── */
  function checkUsage() {
    var bytes = BB.Store.usageBytes();
    var mb = bytes / (1024 * 1024);
    var banner = document.getElementById('usage-banner');
    var topbarUsage = document.getElementById('topbar-usage');
    if (topbarUsage) {
      topbarUsage.textContent = mb.toFixed(2) + ' MB / 5 MB';
      topbarUsage.className = 'topbar-usage' + (mb > 3 ? ' warning' : '');
    }
    if (banner) {
      if (mb > 3) {
        banner.textContent = 'Warning: localStorage is ' + mb.toFixed(2) + 'MB of 5MB. Export your data and consider cleaning up old records.';
        banner.classList.add('visible');
      } else {
        banner.classList.remove('visible');
      }
    }
  }

  /* ── TOAST ────────────────────────────────────────────── */
  BB.toast = function (msg, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'success');
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  };

  /* ── MOBILE NAV ───────────────────────────────────────── */
  var PRIMARY_SECTIONS = ['dashboard', 'leads', 'projects', 'tracker'];

  BB.mobileNav = function (section) {
    navigate(section);
    updateBottomNav(section);
  };

  function updateBottomNav(section) {
    document.querySelectorAll('.bottom-nav-item[data-section]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.section === section);
    });
    // If it's a "more" section, deactivate all primary tabs
    if (PRIMARY_SECTIONS.indexOf(section) === -1) {
      document.querySelectorAll('.bottom-nav-item').forEach(function (btn) {
        btn.classList.remove('active');
      });
    }
    // Update leads badge
    updateLeadsBadge();
  }

  function updateLeadsBadge() {
    var badge = document.getElementById('mobile-leads-badge');
    if (!badge) return;
    try {
      var leads = BB.Store.getLeads();
      var newCount = leads.filter(function (l) { return l.status === 'new'; }).length;
      if (newCount > 0) {
        badge.textContent = newCount > 9 ? '9+' : newCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    } catch (e) {}
  }

  BB.openMoreSheet = function () {
    var backdrop = document.getElementById('more-sheet-backdrop');
    var sheet    = document.getElementById('more-sheet');
    if (!backdrop || !sheet) return;
    backdrop.classList.add('open');
    sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  BB.closeMoreSheet = function () {
    var backdrop = document.getElementById('more-sheet-backdrop');
    var sheet    = document.getElementById('more-sheet');
    if (!backdrop || !sheet) return;
    backdrop.classList.remove('open');
    sheet.classList.remove('open');
    document.body.style.overflow = '';
  };

  /* ── INIT ─────────────────────────────────────────────── */
  function init() {
    // Wire sidebar (desktop)
    document.querySelectorAll('.sidebar-item').forEach(function (el) {
      el.addEventListener('click', function () {
        navigate(el.dataset.section);
        updateBottomNav(el.dataset.section);
      });
    });

    // Read hash or default
    var hash = window.location.hash.replace('#', '') || 'dashboard';
    navigate(hash);
    updateBottomNav(hash);

    // Pin change in settings (if within export panel)
    window.addEventListener('bb:pin-changed', function (e) {
      BB.Store.savePin(e.detail);
      BB.toast('PIN updated');
    });

    // Swipe down to close more sheet
    var sheet = document.getElementById('more-sheet');
    if (sheet) {
      var startY = 0;
      sheet.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; }, { passive: true });
      sheet.addEventListener('touchend', function (e) {
        if (e.changedTouches[0].clientY - startY > 60) BB.closeMoreSheet();
      }, { passive: true });
    }
  }

  /* ── BOOT ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initPinGate();
  });

  // Expose navigate globally
  BB.navigate = navigate;

})();
