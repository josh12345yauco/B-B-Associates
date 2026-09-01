/* ============================================================
   B&B Associates Creations — Data Layer
   window.BB.* — all main site data reads go through here.
   localStorage keys are checked first; hardcoded data is fallback.
   ============================================================ */

(function () {

  /* ── HARDCODED FALLBACKS ─────────────────────────────────── */

  var DEFAULT_FEATURED_VIDEO_SRCS = [
    'portfolio/videos/04dbbb5471c74a3b8ac51db16487c1ad.mp4',
    'portfolio/videos/36c5e0c2f36f4633967755048c653e60.mp4',
    'portfolio/videos/39dfe7ffc6aa44a78f81ed2a0004c83c.mp4',
    'portfolio/videos/a3bfa0877c2e49cbb0bbe1b84cd55709.mp4',
    'portfolio/videos/def2b212633147c9abf52dbc2351495e.mp4',
    'portfolio/videos/fb608850f7a54cb99f98a76a6a90a86c.mp4',
    'portfolio/videos/v15025gf0000d5lqd3vog65khasgnfbg.mp4'
  ];

  var DEFAULT_FAQ = [
    {
      id: 'faq-1',
      question: 'How much does a custom kitchen remodel cost in the Main Line area?',
      answer: 'Complete custom kitchen renovations in the Main Line, Bucks County, and Montgomery County typically range from $75,000 to $250,000+, depending on square footage, materials selected, and scope of work. At B&B Associates, we provide transparent, itemized estimates during your free in-home consultation. Our 25 years of experience and relationships with 60+ premium suppliers allow us to pass 5–35% in savings directly to you. <a href="/contact/#inquiry-form">Fill out our inquiry form</a> to schedule your consultation today.',
      order: 1,
      hidden: false
    },
    {
      id: 'faq-2',
      question: 'How much does a complete bathroom renovation cost in Bucks County?',
      answer: 'Luxury bathroom transformations in Bucks County, Montgomery County, and the Main Line typically range from $25,000 to $150,000+ depending on the size (powder room vs. primary suite) and finish selections. Our projects include complete demolition, custom vanities, premium tile work, luxury fixtures, and all plumbing and electrical updates.',
      order: 2,
      hidden: false
    },
    {
      id: 'faq-3',
      question: 'Do you offer financing for kitchen and bathroom renovations?',
      answer: 'Yes, we partner with leading financing providers to offer flexible payment plans with competitive rates for qualified homeowners. Financing options range from 12 to 120 months, allowing you to transform your space now and pay over time.',
      order: 3,
      hidden: false
    },
    {
      id: 'faq-4',
      question: 'What types of projects do you specialize in?',
      answer: 'B&B Associates exclusively specializes in two services: complete custom kitchen renovations and full luxury bathroom builds. We focus on high-end, full-scope transformations for homes valued at $550,000 and above in the Main Line, Bucks County, and Montgomery County.',
      order: 4,
      hidden: false
    },
    {
      id: 'faq-5',
      question: 'Do you do partial kitchen remodels or cabinet refacing?',
      answer: 'No. We specialize exclusively in complete custom kitchen renovations. While cabinet refacing or partial remodels may work for some homeowners, our expertise—and your best long-term value—comes from comprehensive transformations.',
      order: 5,
      hidden: false
    },
    {
      id: 'faq-6',
      question: 'How long does a custom kitchen renovation take from start to finish?',
      answer: 'Custom kitchen renovations typically take 6-16 weeks from demolition to final walkthrough, depending on the scope and complexity. Our A-to-Z policy means the same dedicated crew stays with your project from day one to completion.',
      order: 6,
      hidden: false
    },
    {
      id: 'faq-7',
      question: 'What is your "A-to-Z Policy" and why does it matter?',
      answer: 'Our A-to-Z Policy is simple: the same master craftsmen who start your project stay with it until the final walkthrough. No subcontractors. No crew rotation. No strangers in your home halfway through.',
      order: 7,
      hidden: false
    },
    {
      id: 'faq-8',
      question: 'What is the process for getting started with B&B Associates?',
      answer: 'Our signature 3-step process makes luxury remodeling stress-free: Step 1: Discuss Your Layout – Free in-home consultation. Step 2: Pick Your Shape – Custom CAD drawings and material selection. Step 3: Pick Your Options – Finalize fixtures, appliances, and finishes, then receive your transparent, itemized proposal.',
      order: 8,
      hidden: false
    },
    {
      id: 'faq-9',
      question: 'What areas do you serve in Pennsylvania?',
      answer: 'We proudly serve the Main Line (Wayne, Villanova, Bryn Mawr, Haverford, Newtown Square, Radnor), Bucks County (New Hope, Newtown, Doylestown, Yardley, Wrightstown), and Montgomery County (Ambler, Blue Bell, North Wales, Fort Washington, Gwynedd).',
      order: 9,
      hidden: false
    },
    {
      id: 'faq-10',
      question: 'What kind of warranty do you offer on your work?',
      answer: 'B&B Associates offers a lifetime commitment guarantee—we stand behind our work forever, even beyond the standard warranty period. Every project includes a 5-year comprehensive workmanship warranty covering all labor, plus full manufacturer warranties on fixtures, appliances, cabinetry, and materials.',
      order: 10,
      hidden: false
    },
    {
      id: 'faq-11',
      question: 'Why should I choose B&B Associates over other remodelers?',
      answer: 'Five reasons: 25 Years with 1,200+ Flawless Projects, 180+ Verified 5-Star Reviews, Family-Owned with No Subcontractors, 5-35% Savings Passed to You through 60+ premium suppliers, and 5–15 Minute Response Time.',
      order: 11,
      hidden: false
    },
    {
      id: 'faq-12',
      question: 'What makes B&B Associates different from big-box contractors?',
      answer: 'Big-box contractors treat remodeling like an assembly line. B&B Associates treats it like an art form. We offer boutique vs. factory service, ownership involvement, no subcontractors, access to 60+ high-end suppliers, and a lifetime commitment.',
      order: 12,
      hidden: false
    }
  ];

  var DEFAULT_ESTIMATOR_SETTINGS = {
    sqftMap: { small: 100, medium: 150, large: 220, xlarge: 300 },
    scopeRates: {
      refresh: { kitchen: { low: 75, high: 125 }, bathroom: { low: 100, high: 150 } },
      standard: { kitchen: { low: 150, high: 250 }, bathroom: { low: 200, high: 350 } },
      gut: { kitchen: { low: 300, high: 500 }, bathroom: { low: 400, high: 650 } }
    },
    structCosts: {
      walls: [5000, 15000],
      windows: [3000, 10000],
      plumbing: [2000, 8000],
      electrical: [1500, 5000],
      hvac: [3000, 10000],
      structural: [4000, 12000]
    },
    cabinetMultipliers: { stock: 1, 'semi-custom': 1.15, custom: 1.35 },
    counterMultipliers: { marble: 1.5, quartzite: 1.6, quartz: 1.2, granite: 1.1, butcherblock: 1 },
    applianceCosts: {
      builder: [3000, 6000],
      'mid-range': [8000, 15000],
      premium: [15000, 30000],
      ultra: [30000, 60000]
    },
    bathroomAdders: {
      steam: [8000, 15000],
      freestanding: [2000, 8000],
      jetted: [3000, 10000]
    },
    globalDiscount: 0.9,
    minimumLow: 15000
  };

  /* ── HELPERS ─────────────────────────────────────────────── */

  function tryParse(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /* ── PUBLIC API ──────────────────────────────────────────── */

  window.BB = {

    getProjects: function () {
      // projects[] is defined in projects-data.js (already mutated by its own patch)
      return (typeof projects !== 'undefined') ? projects : [];
    },

    getFeaturedProjectIds: function () {
      var ls = tryParse('bb_featured_projects');
      if (ls && Array.isArray(ls) && ls.length > 0) return ls;
      // Default: first 6 projects that have a video
      var p = window.BB.getProjects();
      var withVideo = p.filter(function (x) { return x.video && !x._hidden; });
      var ids = withVideo.slice(0, 6).map(function (x) { return x.id; });
      // Pad with non-video projects if needed
      if (ids.length < 6) {
        p.filter(function (x) { return !x.video && !x._hidden; }).forEach(function (x) {
          if (ids.length < 6) ids.push(x.id);
        });
      }
      return ids;
    },

    getFeaturedVideos: function () {
      // Derive videos directly from the 6 featured projects
      var featuredIds = window.BB.getFeaturedProjectIds();
      var allProjects = window.BB.getProjects();
      var videos = [];
      featuredIds.forEach(function (id) {
        var p = allProjects.find(function (x) { return x.id === id; });
        if (p && p.video) {
          videos.push({
            src: 'portfolio/' + p.video,
            label: p.title,
            projectId: p.id,
            hidden: false
          });
        }
      });
      if (videos.length > 0) return videos;
      // Fallback to hardcoded paths only if no project videos available
      return DEFAULT_FEATURED_VIDEO_SRCS.map(function (src, i) {
        return { src: src, label: '', order: i, hidden: false };
      });
    },

    getReviews: function () {
      var ls = tryParse('bb_reviews');
      if (ls && Array.isArray(ls) && ls.length > 0) return ls;
      // Extract from project objects
      var p = window.BB.getProjects();
      var out = [];
      p.forEach(function (proj) {
        if (proj.review && proj.review.text) {
          out.push({
            id: 'rev-' + proj.id,
            text: proj.review.text,
            author: proj.review.author || '',
            town: proj.review.town || '',
            stars: proj.review.stars || 5,
            source: proj.review.source || 'Google',
            featured: false,
            projectId: proj.id
          });
        }
      });
      return out;
    },

    getFaq: function () {
      var ls = tryParse('bb_faq');
      if (ls && Array.isArray(ls) && ls.length > 0) {
        return ls.filter(function (f) { return !f.hidden; })
                 .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      }
      return DEFAULT_FAQ;
    },

    getEstimatorSettings: function () {
      var ls = tryParse('bb_estimator_settings');
      if (ls && typeof ls === 'object') return ls;
      return DEFAULT_ESTIMATOR_SETTINGS;
    },

    getDefaultEstimatorSettings: function () {
      return JSON.parse(JSON.stringify(DEFAULT_ESTIMATOR_SETTINGS));
    },

    appendLead: function (lead) {
      try {
        var leads = tryParse('bb_leads') || [];
        lead.id = 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        lead.date = new Date().toISOString();
        lead.status = lead.status || 'new';
        leads.unshift(lead);
        localStorage.setItem('bb_leads', JSON.stringify(leads));
      } catch (e) {}
    },

    appendQuote: function (quote) {
      try {
        var quotes = tryParse('bb_quotes') || [];
        quote.id = 'quote-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        quote.date = new Date().toISOString();
        quote.status = quote.status || 'pending';
        quotes.unshift(quote);
        localStorage.setItem('bb_quotes', JSON.stringify(quotes));
      } catch (e) {}
    }

  };

})();
