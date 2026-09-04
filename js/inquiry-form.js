/* ============================================================
   B&B Associates Creations — Shared Inquiry Form
   ------------------------------------------------------------
   ONE inquiry form, mounted the same way on:
     • /contact/  (#inquiry-form)
     • every /service-areas/ town page
     • every generated /service-areas/<service>/<town>-pa/ page

   Mount (auto-mounted on DOMContentLoaded):
     <div data-bb-inquiry
          data-source="Bryn Mawr — Kitchen Remodeling"   (page context)
          data-type="service_town"></div>

   MODES (window.BB_INQUIRY_CONFIG.mode):
     'iframe' (default) — renders GoHighLevel's own "Contact Form"
        (form k70Bwwhti09oNK8mRni7, location DDe5PzCq6LigKjZ7qeMD), the
        same embed the contact page has always used. GHL handles delivery,
        contact creation and the email alerts configured on the form.
        GHL's form_embed.js relays the parent page URL into the iframe, so
        the source page is recorded on the contact. The page context is
        also passed as a query parameter (`source_page`) for a hidden field
        should one be added to the form in GHL.
        Why not a native POST: GHL's /forms/submit endpoint requires a
        reCAPTCHA v3 token ("No tokens provided", HTTP 429) and the older
        /widget/form/<id> URL returns 404 "Cannot POST" — verified 2026-09-04.
     'native' — renders the native field set (BB_FORM_CONFIG), stores to
        localStorage.bb_leads, inserts into Supabase `leads`, and POSTs JSON
        to a GoHighLevel *Inbound Webhook* URL (workflow trigger, no captcha)
        set in BB_INQUIRY_CONFIG.ghlWebhook. Use this once that webhook exists.

   Both modes push the `bb_conversion` dataLayer event through
   /js/analytics.js (native: the document-level submit listener; iframe:
   a postMessage listener for GHL's form-submitted message).
   ============================================================ */
(function () {
  window.BB = window.BB || {};

  var CFG = window.BB_INQUIRY_CONFIG || {};
  var MODE = CFG.mode || 'iframe';
  var GHL_FORM_ID    = CFG.ghlFormId    || 'k70Bwwhti09oNK8mRni7';
  var GHL_LOCATION   = CFG.ghlLocationId || 'DDe5PzCq6LigKjZ7qeMD';
  var GHL_WIDGET     = CFG.ghlWidgetBase || 'https://links.legacylinqdigital.com/widget/form/';
  var GHL_EMBED_JS   = CFG.ghlEmbedJs   || 'https://links.legacylinqdigital.com/js/form_embed.js';
  var GHL_WEBHOOK    = CFG.ghlWebhook   || '';       // native mode only
  var IFRAME_HEIGHT  = CFG.iframeHeight || 873;
  var STORAGE_KEY    = 'BB_FORM_CONFIG';
  var SUCCESS_TEXT   = '✓ Sent! We’ll be in touch within 5–15 minutes.';

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function track(label, href) {
    try { if (typeof window.bbTrack === 'function') window.bbTrack('form', { label: label, href: href || '' }); } catch (e) {}
  }

  /* ════════════════════════════════════════════════════════════
     IFRAME MODE — GoHighLevel embed (same form as the contact page)
     ════════════════════════════════════════════════════════════ */
  var embedLoaded = false;
  function loadEmbedScript() {
    if (embedLoaded || document.querySelector('script[src="' + GHL_EMBED_JS + '"]')) { embedLoaded = true; return; }
    var s = document.createElement('script'); s.src = GHL_EMBED_JS; s.async = true; document.body.appendChild(s); embedLoaded = true;
  }
  var iframeCount = 0;
  function renderIframe(container, opts) {
    iframeCount++;
    var id = 'inline-' + GHL_FORM_ID + (iframeCount > 1 ? '-' + iframeCount : '');
    var params = [];
    if (opts.source) params.push('source_page=' + encodeURIComponent(opts.source));
    try { params.push('parent_url=' + encodeURIComponent(window.location.href.split('#')[0])); } catch (e) {}
    var src = GHL_WIDGET + GHL_FORM_ID + (params.length ? '?' + params.join('&') : '');
    container.classList.add('bb-inquiry', 'bb-inquiry--iframe');
    container.setAttribute('data-service-area', opts.source || '');
    container.innerHTML =
      '<iframe src="' + esc(src) + '" style="width:100%;height:' + IFRAME_HEIGHT + 'px;border:none;border-radius:0px;display:block" ' +
      'id="' + esc(id) + '" data-layout="{\'id\':\'INLINE\'}" data-trigger-type="alwaysShow" data-trigger-value="" ' +
      'data-activation-type="alwaysActivated" data-activation-value="" data-deactivation-type="neverDeactivate" data-deactivation-value="" ' +
      'data-form-name="Contact Form" data-height="' + IFRAME_HEIGHT + '" data-layout-iframe-id="' + esc(id) + '" data-form-id="' + esc(GHL_FORM_ID) + '" ' +
      'title="Contact Form"></iframe>';
    loadEmbedScript();
    return container.querySelector('iframe');
  }
  /* GHL posts messages to the parent on submit; mirror them into analytics. */
  var msgBound = false;
  function bindGhlMessages() {
    if (msgBound) return; msgBound = true;
    window.addEventListener('message', function (e) {
      try {
        if (!e.origin || e.origin.indexOf('legacylinqdigital.com') === -1) return;
        var d = e.data; var s = typeof d === 'string' ? d : JSON.stringify(d || {});
        if (/submit|submitted|form-success|lead/i.test(s)) {
          var mount = document.querySelector('[data-bb-inquiry]');
          track('GHL form submit: ' + (mount ? mount.getAttribute('data-source') : 'unknown'), GHL_FORM_ID);
        }
      } catch (err) {}
    });
  }

  /* ════════════════════════════════════════════════════════════
     NATIVE MODE — BB_FORM_CONFIG fields + localStorage + Supabase + webhook
     ════════════════════════════════════════════════════════════ */
  var DEFAULT_CONFIG = [
    { id: 'row-names', type: 'row', fields: [
      { id: 'f-first', type: 'text',  name: 'first_name', label: 'First Name', placeholder: 'Jane',  required: true },
      { id: 'f-last',  type: 'text',  name: 'last_name',  label: 'Last Name',  placeholder: 'Smith', required: true }
    ]},
    { id: 'f-phone',   type: 'tel',      name: 'phone',        label: 'Phone Number',  placeholder: '(215) 555-0100', required: true },
    { id: 'f-email',   type: 'email',    name: 'email',        label: 'Email Address', placeholder: 'jane@email.com', required: true },
    { id: 'f-project', type: 'select',   name: 'project_type', label: 'Project Type',  required: false, options: [
      { value: 'kitchen',  label: 'Kitchen Remodeling'  },
      { value: 'bathroom', label: 'Bathroom Renovation' },
      { value: 'both',     label: 'Kitchen + Bathroom'  }
    ]},
    { id: 'f-message', type: 'textarea', name: 'message', label: 'Tell Us About Your Project (optional)',
      placeholder: 'Briefly describe your vision, timeline, or any questions...', required: false, rows: 6 }
  ];
  function getConfig() {
    try { var s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEFAULT_CONFIG; }
    catch (e) { return DEFAULT_CONFIG; }
  }
  var STYLE_ID = 'bb-inquiry-styles';
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = '' +
      '.bb-inquiry{max-width:100%;box-sizing:border-box;}' +
      '.bb-inquiry .field{margin-bottom:var(--sp-5,24px);}' +
      '.bb-inquiry .form-row{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-5,24px);}' +
      '.bb-inquiry label{display:block;font-family:var(--font-sans,"Manrope",sans-serif);font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6B7280;margin-bottom:var(--sp-2,8px);}' +
      '.bb-inquiry input,.bb-inquiry select,.bb-inquiry textarea{width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:0;padding:15px 16px;font-family:var(--font-sans,"Manrope",sans-serif);font-size:var(--text-body,1rem);color:#1a1a1a;box-sizing:border-box;transition:border-color .3s ease;}' +
      '.bb-inquiry input::placeholder,.bb-inquiry textarea::placeholder{color:#9CA3AF;}' +
      '.bb-inquiry select option{background:#ffffff;color:#1a1a1a;}' +
      '.bb-inquiry input:focus,.bb-inquiry select:focus,.bb-inquiry textarea:focus{outline:none;border-color:var(--color-gold,#b17500);}' +
      '.bb-inquiry textarea{resize:vertical;min-height:180px;}' +
      '.bb-inquiry .phil-btn{margin-top:var(--sp-3,12px);width:100%;}' +
      '.bb-inquiry .form-note{font-family:var(--font-sans,"Manrope",sans-serif);font-size:var(--text-label,12px);color:#9CA3AF;text-align:center;margin-top:var(--sp-3,12px);}' +
      '@media (max-width:768px){.bb-inquiry .form-row{grid-template-columns:1fr;}.bb-inquiry input,.bb-inquiry select,.bb-inquiry textarea{font-size:16px;}}';
    var st = document.createElement('style'); st.id = STYLE_ID; st.textContent = css; document.head.appendChild(st);
  }
  var instanceCounter = 0;
  function buildField(f, prefix) {
    var req = f.required ? ' required' : '';
    var star = f.required ? ' <span style="color:#b17500">*</span>' : '';
    var id = prefix + esc(f.id);
    if (f.type === 'select') {
      var opts = (f.options || []).map(function (o) { return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>'; }).join('');
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + star + '</label><select id="' + id + '" name="' + esc(f.name) + '"' + req + '><option value="" disabled selected>Select ' + esc(String(f.label).toLowerCase()) + '</option>' + opts + '</select></div>';
    }
    if (f.type === 'textarea') {
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + star + '</label><textarea id="' + id + '" name="' + esc(f.name) + '" rows="' + (f.rows || 3) + '" placeholder="' + esc(f.placeholder || '') + '"' + req + '></textarea></div>';
    }
    return '<div class="field"><label for="' + id + '">' + esc(f.label) + star + '</label><input type="' + esc(f.type) + '" id="' + id + '" name="' + esc(f.name) + '" placeholder="' + esc(f.placeholder || '') + '"' + req + '></div>';
  }
  function buildFieldsHtml(prefix) {
    var html = '';
    getConfig().forEach(function (f) {
      if (f.type === 'row' && f.fields) { html += '<div class="form-row">'; f.fields.forEach(function (sf) { html += buildField(sf, prefix); }); html += '</div>'; }
      else html += buildField(f, prefix);
    });
    return html;
  }
  function webhookPayload(lead, context) {
    var meta = [];
    if (context)          meta.push('Page: ' + context);
    if (lead.projectType) meta.push('Project type: ' + lead.projectType);
    if (lead.budget)      meta.push('Budget: ' + lead.budget);
    if (lead.timeline)    meta.push('Timeline: ' + lead.timeline);
    if (lead.homeValue)   meta.push('Home value: ' + lead.homeValue);
    if (lead.town)        meta.push('Town: ' + lead.town);
    try { meta.push('Submitted from: ' + window.location.href.split('#')[0]); } catch (e) {}
    var message = (lead.description || lead.message || '').trim();
    return {
      first_name: lead.firstName || '', last_name: lead.lastName || '', phone: lead.phone || '', email: lead.email || '',
      project_type: lead.projectType || '', source_page: context || '', page_url: (function () { try { return window.location.href.split('#')[0]; } catch (e) { return ''; } })(),
      message: message ? (message + '\n\n' + meta.join('\n')) : meta.join('\n'),
      location_id: GHL_LOCATION, form_id: GHL_FORM_ID
    };
  }
  function postToGhl(lead, context) {
    if (!GHL_WEBHOOK) return null;
    try { return fetch(GHL_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(webhookPayload(lead, context)), mode: 'cors', keepalive: true }).catch(function () {}); }
    catch (e) { return null; }
  }
  function submitLead(fields, opts) {
    opts = opts || {};
    var context = opts.source || '';
    var lead = { id: 'lead-' + Date.now(), date: new Date().toISOString(), status: 'new', type: opts.type || 'contact',
      source: opts.sourceLabel || (opts.type === 'contact' || !opts.type ? 'Contact Page' : 'Service Areas'),
      service_area: opts.serviceArea != null ? opts.serviceArea : context };
    for (var k in fields) if (Object.prototype.hasOwnProperty.call(fields, k)) lead[k] = fields[k];
    lead.firstName = lead.firstName || lead.first_name || ''; lead.lastName = lead.lastName || lead.last_name || '';
    lead.phone = lead.phone || ''; lead.email = lead.email || '';
    lead.projectType = lead.projectType || lead.project_type || ''; lead.description = lead.description || lead.message || '';
    if (opts.storeLocal !== false) {
      try { var leads = JSON.parse(localStorage.getItem('bb_leads') || '[]'); leads.unshift(lead); localStorage.setItem('bb_leads', JSON.stringify(leads)); } catch (e) {}
    }
    try { if (window.BB && window.BB.Supabase) BB.Supabase.insertLead(lead); } catch (e) {}
    postToGhl(lead, context);
    return lead;
  }
  function attach(form, opts) {
    opts = opts || {};
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      try { var data = {}; form.querySelectorAll('[name]').forEach(function (el) { data[el.name] = (el.value || '').trim(); }); submitLead(data, opts); } catch (err) {}
      var note = form.querySelector('.form-note');
      if (note) { note.textContent = SUCCESS_TEXT; note.style.color = '#b17500'; }
      form.querySelectorAll('input,textarea,select').forEach(function (el) { el.value = ''; });
      if (typeof opts.onSuccess === 'function') { try { opts.onSuccess(form); } catch (e2) {} }
    });
  }
  function renderNative(container, opts) {
    injectStyles();
    var n = ++instanceCounter;
    var prefix = 'cf-' + (n > 1 ? n + '-' : '');
    var formId = opts.formId || (n > 1 ? 'bb-inquiry-form-' + n : 'contact-page-form');
    var title = opts.title ? '<p class="bb-inquiry-title">' + esc(opts.title) + '</p>' : '';
    container.classList.add('bb-inquiry');
    container.innerHTML = title +
      '<form id="' + esc(formId) + '" class="bb-inquiry-form" data-service-area="' + esc(opts.source || '') + '" novalidate>' +
        '<div class="bb-inquiry-fields" id="' + (n > 1 ? 'contact-form-fields-' + n : 'contact-form-fields') + '">' + buildFieldsHtml(prefix) + '</div>' +
        '<button type="submit" class="phil-btn phil-btn-fill-dark"><div class="phil-fill"></div><span class="phil-label">' + esc(opts.buttonLabel || 'Send My Request') + '</span></button>' +
        '<p class="form-note">' + esc(opts.note || 'Your information is private. We respond within 5–15 minutes.') + '</p>' +
      '</form>';
    var form = container.querySelector('form');
    if (opts.tradeParam) {
      try {
        var params = new URLSearchParams(window.location.search);
        if (params.get('type') === 'trade') {
          var t = document.querySelector('.contact-form-title'); if (t) t.textContent = 'Register as a Trade Professional';
          var sb = form.querySelector('button[type="submit"] .phil-label'); if (sb) sb.textContent = 'Submit Trade Registration →';
          var mf = form.querySelector('[name="message"]'); if (mf && !mf.value) mf.value = "I'd like to register as a trade professional.";
          var ps = form.querySelector('[name="project_type"]');
          if (ps) { var o = document.createElement('option'); o.value = 'trade'; o.textContent = 'Trade Professional Registration'; o.selected = true; ps.insertBefore(o, ps.firstChild); }
        }
      } catch (e) {}
    }
    attach(form, opts);
    return form;
  }

  /* ── Render entry point ─────────────────────────────────────── */
  function render(container, opts) {
    if (!container) return null;
    opts = opts || {};
    if (MODE === 'native') return renderNative(container, opts);
    bindGhlMessages();
    return renderIframe(container, opts);
  }
  function autoMount() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-bb-inquiry]'), function (el) {
      if (el.getAttribute('data-bb-inquiry-mounted')) return;
      el.setAttribute('data-bb-inquiry-mounted', '1');
      render(el, {
        source: el.getAttribute('data-source') || '', type: el.getAttribute('data-type') || 'contact',
        sourceLabel: el.getAttribute('data-source-label') || undefined,
        serviceArea: el.hasAttribute('data-service-area') ? el.getAttribute('data-service-area') : undefined,
        title: el.getAttribute('data-title') || '', buttonLabel: el.getAttribute('data-button') || undefined,
        tradeParam: !!el.getAttribute('data-trade-param')
      });
    });
  }

  BB.InquiryForm = { mode: MODE, render: render, attach: attach, submitLead: submitLead, postToGhl: postToGhl, getConfig: getConfig,
    GHL_FORM_ID: GHL_FORM_ID, GHL_LOCATION_ID: GHL_LOCATION, GHL_WEBHOOK: GHL_WEBHOOK };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();
})();
