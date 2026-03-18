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
  const onScroll = () => {
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load
}

// ── MOBILE NAV ───────────────────────────────────────────────
const hamburger = document.querySelector('.nav-hamburger');
const mobileNav = document.querySelector('.nav-mobile');
const mobileLinks = document.querySelectorAll('.nav-mobile-link');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
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
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  });

  mobileNav.querySelectorAll('.mobile-dropdown a').forEach(sub => {
    sub.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
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

// ── FEATURED QUOTE — DRAMATIC LEFT REVEAL ────────────────────
gsap.utils.toArray('.featured-quote').forEach(quote => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: quote,
      start: 'top 80%',
      toggleActions: 'play none none none'
    }
  });

  tl.fromTo(quote, {
    clipPath: 'inset(0 100% 0 0)',
    opacity: 0
  }, {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    duration: 1.4,
    ease: 'expo.inOut'
  });

  const inner = quote.querySelectorAll('.featured-quote-mark, .featured-quote-text, .featured-quote-footer');
  if (inner.length) {
    tl.from(inner, {
      x: -40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'expo.out'
    }, '-=0.5');
  }
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
