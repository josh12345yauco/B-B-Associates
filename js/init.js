/* ============================================================
   B&B Associates Creations — Shared Init
   Lenis smooth scroll + GSAP universal animations.
   Load this on every page AFTER GSAP + ScrollTrigger CDN.
   ============================================================ */

// ── LENIS SMOOTH SCROLL ──────────────────────────────────────
const lenis = new Lenis({
  duration: 1.2,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ── NAVIGATION SCROLL BEHAVIOR ───────────────────────────────
const nav = document.querySelector('.nav');

if (nav) {
  // Inject mobile CTA bar (Call Now + Online Estimator)
  const ctaBar = document.createElement('div');
  ctaBar.className = 'mobile-cta-bar';
  ctaBar.innerHTML =
    '<a href="tel:+12674028758" class="cta-call">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
      'Call Now</a>' +
    '<a href="/estimator/" class="cta-estimator">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>' +
      'Online Estimator</a>';
  nav.parentNode.insertBefore(ctaBar, nav);

  const onScroll = () => {
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
      document.body.classList.add('nav-scrolled');
      ctaBar.style.top = '0';
      nav.style.top = ctaBar.offsetHeight + 'px';
    } else {
      nav.classList.remove('scrolled');
      document.body.classList.remove('nav-scrolled');
      nav.style.top = '';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load
}

// ── MOBILE NAV ───────────────────────────────────────────────
const hamburger = document.querySelector('.nav-hamburger');
const mobileNav = document.querySelector('.nav-mobile');

if (mobileNav) {
  mobileNav.querySelectorAll('a.nav-mobile-link[href*="estimator"]').forEach(a => {
    if (a.querySelector('.nav-mobile-link--glasi-inner') || a.classList.contains('has-dropdown')) return;
    const label = a.textContent.replace(/\s+/g, ' ').trim() || 'Online Estimator';
    a.classList.add('btn-glasi', 'nav-mobile-link--glasi');
    a.innerHTML =
      '<div class="corners nav-mobile-link--glasi-inner">' +
      '<div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>' +
      '<div class="line line-top"></div><div class="line line-bottom"></div>' +
      '<div class="line line-left"></div><div class="line line-right"></div>' +
      '</div>' +
      '<span class="clip"><span class="text-top"></span><span class="text-bottom"></span></span>';
    a.querySelectorAll('.text-top, .text-bottom').forEach(el => {
      el.textContent = label;
    });
  });
}

const mobileLinks = document.querySelectorAll('.nav-mobile-link');

if (hamburger && mobileNav) {
  const setMenuOpen = open => {
    mobileNav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  if (!mobileNav.querySelector('.nav-mobile-close')) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'nav-mobile-close';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    mobileNav.insertBefore(closeBtn, mobileNav.firstChild);
    closeBtn.addEventListener('click', () => setMenuOpen(false));
  }

  hamburger.addEventListener('click', () => {
    setMenuOpen(!mobileNav.classList.contains('open'));
  });

  mobileLinks.forEach(link => {
    if (link.classList.contains('has-dropdown')) {
      link.addEventListener('click', e => {
        e.preventDefault();
        link.classList.toggle('open');
        const dd = link.nextElementSibling;
        if (dd) dd.classList.toggle('open');
      });
    } else {
      link.addEventListener('click', () => {
        setMenuOpen(false);
      });
    }
  });

  mobileNav.querySelectorAll('.mobile-dropdown a').forEach(sub => {
    sub.addEventListener('click', () => {
      setMenuOpen(false);
    });
  });
}

// ── ACTIVE NAV LINK ──────────────────────────────────────────
(function() {
  var path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  var isHomePage = (path === '' || path === '/index.html');

  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.classList.remove('active');

    var a = document.createElement('a');
    a.href = link.getAttribute('href') || '';
    var resolved = a.pathname.toLowerCase().replace(/\/+$/, '');

    var linkIsHome = (resolved === '' || resolved === '/' || resolved === '/index.html');

    if (linkIsHome && isHomePage) {
      link.classList.add('active');
    } else if (!linkIsHome && resolved === path) {
      link.classList.add('active');
    }
  });
})();

// ── UNIVERSAL SCROLL REVEAL ───────────────────────────────────
// Apply .reveal class to any element for auto-animation
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.from(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top 82%',
      toggleActions: 'play none none none'
    },
    y: 50,
    opacity: 0,
    duration: 0.9,
    ease: 'expo.out'
  });
});

// ── FEATURED QUOTE — SCROLL SCALE (center, 30% → 100%) ─────────
gsap.utils.toArray('.featured-quote').forEach(quote => {
  gsap.fromTo(
    quote,
    {
      scale: 0.3,
      opacity: 0
    },
    {
      scale: 1,
      opacity: 1,
      duration: 1.15,
      ease: 'expo.out',
      transformOrigin: '50% 50%',
      scrollTrigger: {
        trigger: quote,
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    }
  );
});

// ── STAGGER REVEAL ───────────────────────────────────────────
// Apply .reveal-group to a parent — its children stagger in
gsap.utils.toArray('.reveal-group').forEach(group => {
  gsap.from(group.children, {
    scrollTrigger: {
      trigger: group,
      start: 'top 80%'
    },
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'expo.out'
  });
});

// ── HEADLINE LINE REVEAL ──────────────────────────────────────
// Structure: <div class="headline-reveal">
//              <span class="line-wrap">
//                <span class="line-inner">Text here</span>
//              </span>
//            </div>
gsap.utils.toArray('.headline-reveal .line-inner').forEach((line, i) => {
  gsap.from(line, {
    scrollTrigger: {
      trigger: line,
      start: 'top 90%'
    },
    y: '100%',
    duration: 1.0,
    delay: i * 0.1,
    ease: 'expo.out'
  });
});

// ── SERVICE CARD CONTENT — SLIDE UP FROM BOTTOM ──────────────
gsap.utils.toArray('.service-card').forEach(card => {
  const inner = card.querySelectorAll('.card-number, .card-title, .card-body, .card-link');
  if (inner.length) {
    gsap.from(inner, {
      scrollTrigger: {
        trigger: card,
        start: 'top 65%',
        toggleActions: 'play none none none'
      },
      y: 60,
      opacity: 0,
      duration: 1.3,
      stagger: 0.15,
      ease: 'expo.out'
    });
  }
});

// ── PARALLAX IMAGES ───────────────────────────────────────────
// Add data-parallax="0.2" to any element (value = speed ratio)
gsap.utils.toArray('[data-parallax]').forEach(el => {
  const speed = parseFloat(el.dataset.parallax) || 0.15;
  gsap.to(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    },
    y: () => el.offsetHeight * speed * -1,
    ease: 'none'
  });
});

// ── ACCORDION ────────────────────────────────────────────────
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.accordion-item');
    const isOpen = item.classList.contains('open');

    // Close all
    document.querySelectorAll('.accordion-item.open').forEach(openItem => {
      openItem.classList.remove('open');
    });

    // Open clicked (unless it was open)
    if (!isOpen) {
      item.classList.add('open');
    }
  });
});

// ── LIGHTBOX ─────────────────────────────────────────────────
// Used by project gallery pages
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  document.querySelectorAll('[data-lightbox]').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.dataset.lightbox || img.src;
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ── REDUCED MOTION ───────────────────────────────────────────
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(0);
  ScrollTrigger.getAll().forEach(t => t.kill());
}
