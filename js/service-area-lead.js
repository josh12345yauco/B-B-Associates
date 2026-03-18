/**
 * B&B Associates — Service Area Lead Capture
 * Pushes form submissions to localStorage.bb_leads with type, source, and service_area.
 * Include this script on every service area page and set data-service-area on the form (or on a wrapper).
 */
(function() {
  function get(sel, form) {
    var el = (form || document).querySelector(sel);
    return el ? el.value.trim() : '';
  }
  function getByName(name, form) {
    var el = (form || document).querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  function captureServiceAreaLead(form, serviceAreaName) {
    if (!serviceAreaName) return;
    try {
      var lead = {
        id: 'lead-' + Date.now(),
        date: new Date().toISOString(),
        status: 'new',
        type: 'service_area',
        source: 'Service Areas',
        service_area: serviceAreaName,
        firstName: getByName('first_name', form),
        lastName: getByName('last_name', form),
        name: getByName('name', form),
        phone: getByName('phone', form) || get('input[type="tel"]', form),
        email: getByName('email', form) || get('input[type="email"]', form),
        projectType: getByName('project_type', form),
        description: getByName('message', form) || get('textarea', form)
      };
      var leads = JSON.parse(localStorage.getItem('bb_leads') || '[]');
      leads.unshift(lead);
      localStorage.setItem('bb_leads', JSON.stringify(leads));
      if (window.BB && window.BB.Supabase) BB.Supabase.insertLead(lead);
    } catch (e) {}
  }

  function init() {
    var form = document.querySelector('.town-form, form[data-service-area], .sa-lead-form');
    if (!form) return;
    var serviceArea = form.getAttribute('data-service-area') || (form.closest('[data-service-area]') && form.closest('[data-service-area]').getAttribute('data-service-area')) || window.BB_SERVICE_AREA;
    if (!serviceArea) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      captureServiceAreaLead(form, serviceArea);
      var thankYou = form.querySelector('.sa-lead-thankyou');
      if (thankYou) {
        form.querySelector('.sa-lead-fields') && form.querySelector('.sa-lead-fields').classList.add('hidden');
        thankYou.classList.remove('hidden');
      } else {
        alert('Thank you. We\'ll be in touch within 1 business hour.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
