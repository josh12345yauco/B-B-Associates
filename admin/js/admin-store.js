/* ============================================================
   B&B Admin — Store (localStorage abstraction)
   All reads/writes go through BB.Store.*
   ============================================================ */

window.BB = window.BB || {};

BB.Store = (function () {

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback !== undefined ? fallback : null;
      return JSON.parse(raw);
    } catch (e) {
      return fallback !== undefined ? fallback : null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function usageBytes() {
    try {
      var total = 0;
      for (var k in localStorage) {
        if (!Object.prototype.hasOwnProperty.call(localStorage, k)) continue;
        total += (localStorage[k].length + k.length) * 2;
      }
      return total;
    } catch (e) { return 0; }
  }

  /* ── PROJECTS ──────────────────────────────────────────── */
  function getProjects() { return read('bb_projects', []); }
  function saveProjects(arr) { return write('bb_projects', arr); }

  /* ── FEATURED ─────────────────────────────────────────── */
  function getFeaturedIds() { return read('bb_featured_projects', []); }
  function saveFeaturedIds(arr) { return write('bb_featured_projects', arr); }
  function getFeaturedVideos() { return read('bb_featured_videos', []); }
  function saveFeaturedVideos(arr) { return write('bb_featured_videos', arr); }

  /* ── REVIEWS ──────────────────────────────────────────── */
  function getReviews() { return read('bb_reviews', []); }
  function saveReviews(arr) { return write('bb_reviews', arr); }

  /* ── FAQ ──────────────────────────────────────────────── */
  function getFaq() { return read('bb_faq', []); }
  function saveFaq(arr) { return write('bb_faq', arr); }

  /* ── LEADS ────────────────────────────────────────────── */
  function getLeads() { return read('bb_leads', []); }
  function saveLeads(arr) { return write('bb_leads', arr); }
  function updateLead(id, patch) {
    var leads = getLeads();
    var idx = leads.findIndex(function (l) { return l.id === id; });
    if (idx === -1) return false;
    Object.assign(leads[idx], patch);
    return saveLeads(leads);
  }

  /* ── QUOTES ───────────────────────────────────────────── */
  function getQuotes() { return read('bb_quotes', []); }
  function saveQuotes(arr) { return write('bb_quotes', arr); }
  function updateQuote(id, patch) {
    var quotes = getQuotes();
    var idx = quotes.findIndex(function (q) { return q.id === id; });
    if (idx === -1) return false;
    Object.assign(quotes[idx], patch);
    return saveQuotes(quotes);
  }

  /* ── ESTIMATOR SETTINGS ───────────────────────────────── */
  function getEstimatorSettings() { return read('bb_estimator_settings', null); }
  function saveEstimatorSettings(obj) { return write('bb_estimator_settings', obj); }

  /* ── JOBS (TRACKER) ───────────────────────────────────── */
  function getJobs() { return read('bb_jobs', []); }
  function saveJobs(arr) { return write('bb_jobs', arr); }
  function getJob(id) {
    return getJobs().find(function (j) { return j.id === id; }) || null;
  }
  function saveJob(job) {
    var jobs = getJobs();
    var idx = jobs.findIndex(function (j) { return j.id === job.id; });
    if (idx === -1) { jobs.push(job); } else { jobs[idx] = job; }
    return saveJobs(jobs);
  }
  function deleteJob(id) {
    var jobs = getJobs().filter(function (j) { return j.id !== id; });
    return saveJobs(jobs);
  }

  /* ── SETTINGS (PIN etc.) ──────────────────────────────── */
  function getPin() { return read('bb_admin_pin', '0000'); }
  function savePin(pin) { return write('bb_admin_pin', pin); }

  /* ── ANALYTICS ────────────────────────────────────────── */
  function getAnalytics() {
    var raw = read('bb_analytics', null);
    if (raw && typeof raw === 'object') return raw;
    return { pageViews: [], sessions: [], clicks: [], locations: [] };
  }
  function saveAnalytics(data) { return write('bb_analytics', data); }

  /* ── EXPORT ALL ───────────────────────────────────────── */
  function exportAll() {
    return {
      exportedAt: new Date().toISOString(),
      bb_projects: getProjects(),
      bb_featured_projects: getFeaturedIds(),
      bb_featured_videos: getFeaturedVideos(),
      bb_reviews: getReviews(),
      bb_faq: getFaq(),
      bb_leads: getLeads(),
      bb_quotes: getQuotes(),
      bb_estimator_settings: getEstimatorSettings(),
      bb_jobs: getJobs(),
      bb_analytics: getAnalytics()
    };
  }

  /* ── IMPORT ALL ───────────────────────────────────────── */
  function importAll(data) {
    if (data.bb_projects)            write('bb_projects', data.bb_projects);
    if (data.bb_featured_projects)   write('bb_featured_projects', data.bb_featured_projects);
    if (data.bb_featured_videos)     write('bb_featured_videos', data.bb_featured_videos);
    if (data.bb_reviews)             write('bb_reviews', data.bb_reviews);
    if (data.bb_faq)                 write('bb_faq', data.bb_faq);
    if (data.bb_leads)               write('bb_leads', data.bb_leads);
    if (data.bb_quotes)              write('bb_quotes', data.bb_quotes);
    if (data.bb_estimator_settings)  write('bb_estimator_settings', data.bb_estimator_settings);
    if (data.bb_jobs)                write('bb_jobs', data.bb_jobs);
    if (data.bb_analytics)           write('bb_analytics', data.bb_analytics);
  }

  return {
    read, write, usageBytes,
    getProjects, saveProjects,
    getFeaturedIds, saveFeaturedIds,
    getFeaturedVideos, saveFeaturedVideos,
    getReviews, saveReviews,
    getFaq, saveFaq,
    getLeads, saveLeads, updateLead,
    getQuotes, saveQuotes, updateQuote,
    getEstimatorSettings, saveEstimatorSettings,
    getJobs, saveJobs, getJob, saveJob, deleteJob,
    getPin, savePin,
    getAnalytics, saveAnalytics,
    exportAll, importAll
  };

})();
