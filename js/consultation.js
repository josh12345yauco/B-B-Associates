/* ============================================================
   B&B Associates Creations — Consultation Form Logic
   Multi-step form with gate logic for budget screening.
   ============================================================ */

(function () {
  const TOTAL_STEPS = 6;
  let currentStep = 1;
  const formData = {};

  // ── ROTATING SIDE PANEL IMAGES ────────────────────────────
  const sidePanelImages = [
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&q=80",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=900&q=80",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80"
  ];

  const rotatingReviews = [
    { text: '"The result looks like a 5-star hotel bathroom." — M.N., Blue Bell PA', stars: 5 },
    { text: '"Best investment we\'ve ever made. Completely changed how we live." — Dana M., Wyncote PA', stars: 5 },
    { text: '"On-site every day, zero issues, flawless result." — The Williams Family, Doylestown PA', stars: 5 },
    { text: '"Michael and his team exceeded every expectation." — Sarah R., Blue Bell PA', stars: 5 },
    { text: '"Clean, professional, and exactly what we envisioned." — The Peterson Family, Wayne PA', stars: 5 },
    { text: '"Ready to start your project." — B&B Associates Creations', stars: 5 }
  ];

  // ── DOM REFS ──────────────────────────────────────────────
  const progressBar     = document.getElementById('progress-bar');
  const progressText    = document.getElementById('progress-text');
  const sidePanelImg    = document.getElementById('side-panel-img');
  const sideReviewText  = document.getElementById('side-review-text');
  const sideStars       = document.getElementById('side-stars');

  function updateSidePanel(step) {
    const idx = step - 1;
    if (sidePanelImg && sidePanelImages[idx]) {
      sidePanelImg.src = sidePanelImages[idx];
    }
    if (sideReviewText && sideStars) {
      const review = rotatingReviews[idx] || rotatingReviews[0];
      sideReviewText.textContent = review.text;
      sideStars.innerHTML = '★'.repeat(review.stars);
    }
  }

  function updateProgress(step) {
    const pct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);
    if (progressBar)  progressBar.style.width = pct + '%';
    if (progressText) progressText.textContent = `Step ${step} of ${TOTAL_STEPS}`;
  }

  function showStep(step) {
    document.querySelectorAll('.form-step').forEach(el => {
      el.classList.remove('active');
      el.setAttribute('aria-hidden', 'true');
    });
    const target = document.getElementById(`step-${step}`);
    if (target) {
      target.classList.add('active');
      target.setAttribute('aria-hidden', 'false');
    }
    currentStep = step;
    updateProgress(step);
    updateSidePanel(step);
  }

  function goNext() {
    // Gate logic for step 3 (budget)
    if (currentStep === 3 && formData.budget === 'under-25k') {
      showGate();
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      showStep(currentStep + 1);
    }
  }

  function goPrev() {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  }

  function showGate() {
    document.querySelectorAll('.form-step').forEach(el => {
      el.classList.remove('active');
    });
    const gate = document.getElementById('budget-gate');
    if (gate) gate.classList.add('active');
  }

  // ── INIT ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    showStep(1);

    // Navigation buttons
    document.querySelectorAll('[data-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (validateCurrentStep()) goNext();
      });
    });

    document.querySelectorAll('[data-prev]').forEach(btn => {
      btn.addEventListener('click', goPrev);
    });

    // Step 1 — project type cards
    document.querySelectorAll('.type-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        formData.projectType = card.dataset.type;
      });
    });

    // Step 3 — budget pills
    document.querySelectorAll('.budget-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.budget-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        formData.budget = pill.dataset.budget;
      });
    });

    // Step 4 — timeline options
    document.querySelectorAll('.timeline-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.timeline-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        formData.timeline = opt.dataset.timeline;
      });
    });

    // Budget gate — continue anyway
    const continueBtn = document.getElementById('gate-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        formData.budgetFlexible = true;
        showStep(4);
      });
    }

    // Step 2 — home value dropdown
    const homeValueSelect = document.getElementById('home-value');
    if (homeValueSelect) {
      homeValueSelect.addEventListener('change', () => {
        formData.homeValue = homeValueSelect.value;
      });
    }

    // Step 2 — town input
    const townInput = document.getElementById('town-input');
    if (townInput) {
      townInput.addEventListener('input', () => {
        formData.town = townInput.value;
      });
    }

    // Step 5 — contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', e => {
        e.preventDefault();
        formData.firstName   = document.getElementById('first-name')?.value || '';
        formData.lastName    = document.getElementById('last-name')?.value || '';
        formData.phone       = document.getElementById('phone')?.value || '';
        formData.email       = document.getElementById('email')?.value || '';
        formData.description = document.getElementById('project-desc')?.value || '';

        // Save lead to localStorage for admin dashboard
        try {
          var _lead = {
            id: 'lead-' + Date.now(),
            date: new Date().toISOString(),
            status: 'new',
            type: 'consultation',
            source: 'Consultation Form',
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            email: formData.email,
            projectType: formData.projectType,
            budget: formData.budget,
            timeline: formData.timeline,
            homeValue: formData.homeValue,
            town: formData.town,
            description: formData.description
          };
          var _leads = JSON.parse(localStorage.getItem('bb_leads') || '[]');
          _leads.unshift(_lead);
          localStorage.setItem('bb_leads', JSON.stringify(_leads));
          if (window.BB && window.BB.Supabase) BB.Supabase.insertLead(_lead);
        } catch(e) {}

        // In production: POST to your form handler (e.g., Netlify Forms, Formspree, custom API)
        console.log('Consultation form submitted:', formData);

        // Show confirmation
        showStep(6);
      });
    }
  });

  // ── VALIDATION ────────────────────────────────────────────
  function validateCurrentStep() {
    switch (currentStep) {
      case 1:
        if (!formData.projectType) {
          showError('step-1', 'Please select a project type to continue.');
          return false;
        }
        break;
      case 2:
        const hv = document.getElementById('home-value');
        const ti = document.getElementById('town-input');
        if (hv && !hv.value) {
          showError('step-2', 'Please select your home value range.');
          return false;
        }
        if (ti && !ti.value.trim()) {
          showError('step-2', 'Please enter your town or neighborhood.');
          return false;
        }
        formData.homeValue = hv?.value;
        formData.town = ti?.value;
        break;
      case 3:
        if (!formData.budget) {
          showError('step-3', 'Please select a budget range to continue.');
          return false;
        }
        break;
      case 4:
        if (!formData.timeline) {
          showError('step-4', 'Please select a timeline.');
          return false;
        }
        break;
    }
    clearErrors();
    return true;
  }

  function showError(stepId, message) {
    const step = document.getElementById(stepId);
    let err = step?.querySelector('.form-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'form-error';
      step.appendChild(err);
    }
    err.textContent = message;
  }

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.remove());
  }

})();
