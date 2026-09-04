/* ============================================================
   B&B Associates Creations — Shared Inquiry Form
   ------------------------------------------------------------
   ONE form, ONE submit pipeline, used by:
     • /contact/  (#inquiry-form)
     • every /service-areas/ town page
     • every generated /service-areas/<service>/<town>-pa/ page
     • /consultation/ (submit pipeline only, via BB.InquiryForm.submitLead)

   Pipeline on submit (identical everywhere):
     1. localStorage.bb_leads  (admin panel offline fallback)
     2. BB.Supabase.insertLead (leads table — service_area carries the page context)
     3. POST to the GoHighLevel form endpoint used by the contact page
        (mode: no-cors) with the page context appended to the message
        so the source is visible on the GHL contact even without a
        matching custom field.
     4. Inline success note + fields cleared.

   The document-level `submit` listener in /js/analytics.js still fires
   (capture phase) so the `bb_conversion` dataLayer push is unchanged.

   Usage (declarative — auto-mounted on DOMContentLoaded):
     <div data-bb-inquiry
          data-source="Bryn Mawr — Kitchen Remodeling"   (page context, required)
          data-type="service_town"                        (lead type, optional)
          data-title="Request Your Free Estimate"         (optional heading)
          data-trade-param="1"></div>                     (contact page only:
                                                           honour ?type=trade)

   Programmatic:
     BB.InquiryForm.render(containerEl, { source, type, title })
     BB.InquiryForm.submitLead({ firstName, lastName, phone, email,
                                 projectType, message, ...extra },
                               { source, type, storeLocal: true })
   ============================================================ */
(function () {
  window.BB = window.BB || {};

  /* ── Config (override via window.BB_INQUIRY_CONFIG before this script) ── */
  var CFG = window.BB_INQUIRY_CONFIG || {};
  var GHL_FORM_ID  = CFG.ghlFormId  || 'Ey8fdi6O3JIdS1xYUhkw';
  var GHL_ENDPOINT = CFG.ghlEndpoint || ('https://links.legacylinqdigital.com/widget/form/' + GHL_FORM_ID);
  var STORAGE_KEY  = 'BB_FORM_CONFIG';           // admin panel can override the field set
  var SUCCESS_TEXT = '✓ Sent! We’ll be in touch within 5–15 minutes.';

  /* ── Field set (same as the contact page's BB_FORM_CONFIG default) ── */
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

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Styles: mirrors the contact page's .contact-form rules, scoped ── */
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
      '.bb-inquiry .bb-inquiry-title{font-family:var(--font-display,"Cormorant Garamond",serif);font-size:var(--text-h4,1.5rem);font-weight:300;font-style:italic;color:#1a1a1a;margin-bottom:var(--sp-6,32px);line-height:1.1;}' +
      '.bb-inquiry .form-note{font-family:var(--font-sans,"Manrope",sans-serif);font-size:var(--text-label,12px);color:#9CA3AF;text-align:center;margin-top:var(--sp-3,12px);}' +
      '@media (max-width:768px){.bb-inquiry .form-row{grid-template-columns:1fr;}.bb-inquiry input,.bb-inquiry select,.bb-inquiry textarea{font-size:16px;}}';
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ── Field builder (unchanged from the contact page implementation) ── */
  var instanceCounter = 0;
  function buildField(f, prefix) {
    var req  = f.required ? ' required' : '';
    var star = f.required ? ' <span style="color:#b17500">*</span>' : '';
    var id   = prefix + esc(f.id);
    if (f.type === 'select') {
      var opts = (f.options || []).map(function (o) {
        return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>';
      }).join('');
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + star + '</label>' +
        '<select id="' + id + '" name="' + esc(f.name) + '"' + req + '>' +
        '<option value="" disabled selected>Select ' + esc(String(f.label).toLowerCase()) + '</option>' + opts + '</select></div>';
    }
    if (f.type === 'textarea') {
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + star + '</label>' +
        '<textarea id="' + id + '" name="' + esc(f.name) + '" rows="' + (f.rows || 3) + '" placeholder="' + esc(f.placeholder || '') + '"' + req + '></textarea></div>';
    }
    return '<div class="field"><label for="' + id + '">' + esc(f.label) + star + '</label>' +
      '<input type="' + esc(f.type) + '" id="' + id + '" name="' + esc(f.name) + '" placeholder="' + esc(f.placeholder || '') + '"' + req + '></div>';
  }

  function buildFieldsHtml(prefix) {
    var html = '';
    getConfig().forEach(function (f) {
      if (f.type === 'row' && f.fields) {
        html += '<div class="form-row">';
        f.fields.forEach(function (sf) { html += buildField(sf, prefix); });
        html += '</div>';
      } else {
        html += buildField(f, prefix);
      }
    });
    return html;
  }

  /* ── GHL payload: same field names the contact page has always sent ── */
  function buildGhlBody(lead, context) {
    var body = new FormData();
    var message = (lead.description || lead.message || '').trim();
    var meta = [];
    if (context)          meta.push('Page: ' + context);
    if (lead.projectType) meta.push('Project type: ' + lead.projectType);
    if (lead.budget)      meta.push('Budget: ' + lead.budget);
    if (lead.timeline)    meta.push('Timeline: ' + lead.timeline);
    if (lead.homeValue)   meta.push('Home value: ' + lead.homeValue);
    if (lead.town)        meta.push('Town: ' + lead.town);
    try { meta.push('Submitted from: ' + window.location.href.split('#')[0]); } catch (e) {}
    var full = message ? (message + '\n\n' + meta.join('\n')) : meta.join('\n');
    body.append('first_name', lead.firstName || '');
    body.append('last_name',  lead.lastName  || '');
    body.append('phone',      lead.phone     || '');
    body.append('email',      lead.email     || '');
    body.append('message',    full);
    body.append('formId',     GHL_FORM_ID);
    body.append('location_id', '');
    return body;
  }

  function postToGhl(lead, context) {
    try {
      return fetch(GHL_ENDPOINT, { method: 'POST', body: buildGhlBody(lead, context), mode: 'no-cors' })
        .catch(function () {});
    } catch (e) { return null; }
  }

  /* ── The one submit pipeline ───────────────────────────────── */
  function submitLead(fields, opts) {
    opts = opts || {};
    var context = opts.source || '';
    var lead = {
      id:     'lead-' + Date.now(),
      date:   new Date().toISOString(),
      status: 'new',
      type:   opts.type || 'contact',
      source: opts.sourceLabel || (opts.type === 'contact' || !opts.type ? 'Contact Page' : 'Service Areas'),
      service_area: opts.serviceArea != null ? opts.serviceArea : context
    };
    for (var k in fields) if (Object.prototype.hasOwnProperty.call(fields, k)) lead[k] = fields[k];
    lead.firstName   = lead.firstName   || lead.first_name || '';
    lead.lastName    = lead.lastName    || lead.last_name  || '';
    lead.phone       = lead.phone       || '';
    lead.email       = lead.email       || '';
    lead.projectType = lead.projectType || lead.project_type || '';
    lead.description = lead.description || lead.message || '';

    // 1. localStorage (unless the caller already did it)
    if (opts.storeLocal !== false) {
      try {
        var leads = JSON.parse(localStorage.getItem('bb_leads') || '[]');
        leads.unshift(lead);
        localStorage.setItem('bb_leads', JSON.stringify(leads));
      } catch (e) {}
    }
    // 2. Supabase
    try { if (window.BB && window.BB.Supabase) BB.Supabase.insertLead(lead); } catch (e) {}
    // 3. GoHighLevel
    postToGhl(lead, context);
    return lead;
  }

  /* ── Attach the pipeline to a rendered form ─────────────────── */
  function attach(form, opts) {
    opts = opts || {};
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      try {
        var data = {};
        form.querySelectorAll('[name]').forEach(function (el) { data[el.name] = (el.value || '').trim(); });
        submitLead(data, opts);
      } catch (err) {}
      /* Success feedback — identical to the contact page */
      var note = form.querySelector('.form-note');
      if (note) { note.textContent = SUCCESS_TEXT; note.style.color = '#b17500'; }
      form.querySelectorAll('input,textarea,select').forEach(function (el) { el.value = ''; });
      if (typeof opts.onSuccess === 'function') { try { opts.onSuccess(form); } catch (e2) {} }
    });
  }

  /* ── Render into a container ────────────────────────────────── */
  function render(container, opts) {
    if (!container) return null;
    opts = opts || {};
    injectStyles();
    var n = ++instanceCounter;
    var prefix = 'cf-' + (n > 1 ? n + '-' : '');   // first instance keeps the contact page's cf-f-* ids
    var formId = opts.formId || (n > 1 ? 'bb-inquiry-form-' + n : 'contact-page-form');
    var title  = opts.title ? '<p class="bb-inquiry-title">' + esc(opts.title) + '</p>' : '';
    container.classList.add('bb-inquiry');
    container.innerHTML = title +
      '<form id="' + esc(formId) + '" class="bb-inquiry-form" data-service-area="' + esc(opts.source || '') + '" novalidate>' +
        '<div class="bb-inquiry-fields" id="' + (n > 1 ? 'contact-form-fields-' + n : 'contact-form-fields') + '">' + buildFieldsHtml(prefix) + '</div>' +
        '<button type="submit" class="phil-btn phil-btn-fill-dark"><div class="phil-fill"></div><span class="phil-label">' + esc(opts.buttonLabel || 'Send My Request') + '</span></button>' +
        '<p class="form-note">' + esc(opts.note || 'Your information is private. We respond within 5–15 minutes.') + '</p>' +
      '</form>';
    var form = container.querySelector('form');

    /* Trade-professional routing (contact page: /contact/?type=trade) */
    if (opts.tradeParam) {
      try {
        var params = new URLSearchParams(window.location.search);
        if (params.get('type') === 'trade') {
          var t = document.querySelector('.contact-form-title');
          if (t) t.textContent = 'Register as a Trade Professional';
          var submitBtn = form.querySelector('button[type="submit"] .phil-label') || form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Submit Trade Registration →';
          var msgField = form.querySelector('[name="message"]');
          if (msgField && !msgField.value) msgField.value = "I'd like to register as a trade professional.";
          var projectSelect = form.querySelector('[name="project_type"]');
          if (projectSelect) {
            var tradeOpt = document.createElement('option');
            tradeOpt.value = 'trade';
            tradeOpt.textContent = 'Trade Professional Registration';
            tradeOpt.selected = true;
            projectSelect.insertBefore(tradeOpt, projectSelect.firstChild);
          }
        }
      } catch (e) {}
    }

    attach(form, opts);
    return form;
  }

  /* ── Auto-mount [data-bb-inquiry] containers ───────────────── */
  function autoMount() {
    var mounts = document.querySelectorAll('[data-bb-inquiry]');
    Array.prototype.forEach.call(mounts, function (el) {
      if (el.getAttribute('data-bb-inquiry-mounted')) return;
      el.setAttribute('data-bb-inquiry-mounted', '1');
      render(el, {
        source:      el.getAttribute('data-source') || '',
        type:        el.getAttribute('data-type') || 'contact',
        sourceLabel: el.getAttribute('data-source-label') || undefined,
        serviceArea: el.hasAttribute('data-service-area') ? el.getAttribute('data-service-area') : undefined,
        title:       el.getAttribute('data-title') || '',
        buttonLabel: el.getAttribute('data-button') || undefined,
        tradeParam:  !!el.getAttribute('data-trade-param')
      });
    });
  }

  BB.InquiryForm = {
    render: render,
    attach: attach,
    submitLead: submitLead,
    postToGhl: postToGhl,
    buildGhlBody: buildGhlBody,
    getConfig: getConfig,
    GHL_ENDPOINT: GHL_ENDPOINT,
    GHL_FORM_ID: GHL_FORM_ID
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();
})();
