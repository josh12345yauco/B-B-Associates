#!/usr/bin/env node
/* ============================================================
   B&B Associates — Service × Town page generator
   ------------------------------------------------------------
   Reads:   data/towns.json, data/services.json, data/site.json,
            scripts/templates/service-town.css, js/projects-data.js,
            blog/articles-data.js
   Writes:  service-areas/<service>/<town>-pa/index.html  (one per town × service)
            sitemap.xml  (existing entries preserved; generated URLs upserted)

   Usage:   node scripts/build-town-pages.js
   No dependencies beyond Node's fs / path / vm. Output is deterministic
   for a given data/site.json buildDate, so running twice is a no-op.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = p => JSON.parse(read(p));

const SITE = json('data/site.json');
const TOWNS = json('data/towns.json').towns;
const SERVICES = json('data/services.json').services;
const CSS = read('scripts/templates/service-town.css');

/* ── Load portfolio + article data by evaluating the site's own JS ── */
function evalData(file, expr) {
  const src = read(file);
  const ctx = { localStorage: { getItem: () => null, setItem: () => {} }, window: {}, document: {} };
  return vm.runInNewContext(src + ';' + expr, ctx);
}
const PROJECTS = evalData('js/projects-data.js', 'projects');
const ARTICLES = evalData('blog/articles-data.js', 'ARTICLES');
const projectById = Object.fromEntries(PROJECTS.map(p => [p.id, p]));
const articleById = Object.fromEntries(ARTICLES.map(a => [a.id, a]));

/* ── Helpers ─────────────────────────────────────────────────── */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = esc;
const fill = (tpl, town, service) => String(tpl)
  .replace(/\{Town\}/g, town.displayName)
  .replace(/\{Township\}/g, town.townships[0])
  .replace(/\{Permit\}/g, town.permitAuthority)
  .replace(/\{County\}/g, town.county === 'Main Line' ? 'the Main Line' : town.county)
  .replace(/\{Service\}/g, service.name);
const townBySlug = Object.fromEntries(TOWNS.map(t => [t.slug, t]));
const pageUrl = (service, town) => `/service-areas/${service.slug}/${town.urlSlug}/`;
const absUrl = p => SITE.origin + p;

function pickFaqs(town, service) {
  const overrides = (town.content[service.key].faqOverrides || []).map(f => ({ q: f.q, a: f.a }));
  const pool = service.faqPool;
  // Rotate the shared pool per town so sibling pages share fewer questions.
  const idx = TOWNS.findIndex(t => t.slug === town.slug);
  const overrideKeys = new Set(overrides.map(f => f.q.toLowerCase().replace(/[^a-z]/g, '').slice(0, 24)));
  const rotated = pool.slice(idx % pool.length).concat(pool.slice(0, idx % pool.length));
  const chosen = [];
  for (const f of rotated) {
    const q = fill(f.q, town, service);
    const key = q.toLowerCase().replace(/[^a-z]/g, '').slice(0, 24);
    // skip pool items that duplicate an override's topic (cost / permit)
    if ([...overrideKeys].some(k => k.startsWith(key.slice(0, 12)) || key.startsWith(k.slice(0, 12)))) continue;
    if ((f.id === 'cost') || (f.id === 'permit' && overrides.some(o => /permit/i.test(o.q)))) continue;
    chosen.push({ q, a: fill(f.a, town, service) });
    if (overrides.length + chosen.length >= 6) break;
  }
  return overrides.concat(chosen).slice(0, 6);
}

/* ── Blocks ──────────────────────────────────────────────────── */
function gtmHead() {
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${SITE.gtmId}');</script>
<!-- End Google Tag Manager -->`;
}
function gtmBody() {
  return `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${SITE.gtmId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
}

function businessSchema(town) {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": SITE.businessId,
    "name": "B&B Associates",
    "legalName": "B&B Associates Creations LLC",
    "alternateName": "B&B Associates Creations",
    "url": SITE.origin + "/",
    "telephone": "+1-267-402-8758",
    "email": "bb3associates@gmail.com",
    "logo": SITE.origin + "/IMAGES/bb-logo-tagline-navy.png",
    "image": SITE.origin + "/IMAGES/BandB-Associates-team.jpg",
    "address": { "@type": "PostalAddress", "streetAddress": "1141 E Welsh Rd", "addressLocality": "Maple Glen", "addressRegion": "PA", "postalCode": "19002", "addressCountry": "US" },
    "geo": { "@type": "GeoCoordinates", "latitude": 40.1537, "longitude": -75.2249 },
    "hasMap": "https://maps.google.com/?q=1141+E+Welsh+Rd+Maple+Glen+PA+19002",
    "priceRange": "$$$",
    "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], "opens": "08:00", "closes": "18:00" }],
    "identifier": { "@type": "PropertyValue", "propertyID": "PA HIC", "value": "PA104189" },
    "sameAs": [
      "https://www.instagram.com/bbassociatescreations",
      "https://www.facebook.com/bbassociatescreations",
      "https://www.tiktok.com/@bb.associates",
      "https://www.houzz.com/professionals/home-builders/bandb-associates-pfvwus-pf~1637622775",
      "https://www.angi.com/companylist/us/pa/ambler/bandb-associates-creations%2C-llc-reviews-10836841.htm"
    ],
    "areaServed": { "@type": "City", "name": town.displayName, "containedInPlace": { "@type": "State", "name": "Pennsylvania" } },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "183", "bestRating": "5" }
  };
}
function serviceSchema(town, service, url) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": absUrl(url) + "#service",
    "name": `${service.serviceSchemaName} in ${town.displayName}, PA`,
    "serviceType": service.serviceType,
    "url": absUrl(url),
    "provider": { "@id": SITE.businessId },
    "areaServed": { "@type": "City", "name": town.displayName, "containedInPlace": { "@type": "State", "name": "Pennsylvania" } },
    "description": fill(service.metaPattern, town, service),
    "offers": { "@type": "Offer", "priceCurrency": "USD", "description": `${service.costTiers[0].range} – ${service.costTiers[2].range} depending on scope`, "availability": "https://schema.org/InStock" },
    "isRelatedTo": { "@type": "Service", "@id": absUrl(service.canonicalServicePage) + "#service", "name": service.canonicalServiceLabel, "url": absUrl(service.canonicalServicePage) }
  };
}
function breadcrumbSchema(town, service, url) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE.origin + "/" },
      { "@type": "ListItem", "position": 2, "name": "Service Areas", "item": absUrl("/service-areas/") },
      { "@type": "ListItem", "position": 3, "name": service.breadcrumbLabel, "item": absUrl(service.canonicalServicePage) },
      { "@type": "ListItem", "position": 4, "name": `${town.displayName}, PA`, "item": absUrl(url) }
    ]
  };
}
function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } }))
  };
}
const ld = obj => `  <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n  </script>`;

function nav() {
  return `  <nav class="nav" role="navigation" aria-label="Main navigation">
    <a href="/" class="nav-logo" aria-label="B&amp;B Associates Creations home"><img src="/IMAGES/bb-logo-white.webp" alt="B&amp;B Associates Creations" class="nav-logo-img"></a>
    <div class="nav-links" role="list">
      <a href="/" class="nav-link" role="listitem">Home</a>
      <a href="/services/" class="nav-link" role="listitem">Services</a>
      <div class="nav-item" role="listitem"><a href="/portfolio/" class="nav-link has-dropdown">Portfolio <span class="dropdown-arrow"></span></a><div class="nav-dropdown"><a href="/portfolio/">All Projects</a><a href="/portfolio/?filter=kitchen">Kitchens</a><a href="/portfolio/?filter=bathroom">Bathrooms</a></div></div>
      <div class="nav-item" role="listitem"><a href="/about/" class="nav-link has-dropdown">Company <span class="dropdown-arrow"></span></a><div class="nav-dropdown"><a href="/about/">About B&amp;B</a><a href="/reviews/">Testimonials</a><a href="/service-areas/">Service Areas</a></div></div>
      <a href="/contact/" class="nav-link" role="listitem">Contact</a>
    </div>
    <div class="nav-right"><a href="tel:+12674028758" class="nav-phone">Call Now</a><a href="/contact/#inquiry-form" class="nav-cta">Inquiry Form</a></div>
    <button class="nav-hamburger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
  </nav>
  <div class="nav-mobile" role="dialog" aria-label="Mobile navigation">
    <nav class="nav-mobile-links">
      <a href="/" class="nav-mobile-link">Home</a><a href="/services/" class="nav-mobile-link">Services</a>
      <div class="nav-mobile-item"><a class="nav-mobile-link has-dropdown">Portfolio <span class="mobile-dropdown-arrow"></span></a><div class="mobile-dropdown"><a href="/portfolio/">All Projects</a><a href="/portfolio/?filter=kitchen">Kitchens</a><a href="/portfolio/?filter=bathroom">Bathrooms</a></div></div>
      <div class="nav-mobile-item"><a class="nav-mobile-link has-dropdown">Company <span class="mobile-dropdown-arrow"></span></a><div class="mobile-dropdown"><a href="/about/">About B&amp;B</a><a href="/reviews/">Testimonials</a><a href="/service-areas/">Service Areas</a></div></div>
      <a href="/contact/" class="nav-mobile-link">Contact</a><a href="/contact/#inquiry-form" class="nav-mobile-link nav-mobile-cta">Inquiry Form</a>
    </nav>
    <div class="nav-mobile-footer"><a href="tel:+12674028758" class="nav-mobile-phone">267-402-8758</a><div class="nav-mobile-socials"><a href="https://instagram.com/bbassociatescreations" target="_blank" rel="noopener">Instagram</a><a href="https://facebook.com/bbassociatescreations" target="_blank" rel="noopener">Facebook</a><a href="https://www.tiktok.com/@bb.associates" target="_blank" rel="noopener">TikTok</a></div></div>
  </div>`;
}

function footer() {
  const areas = SITE.footerServiceAreas.map(g =>
    `<p class="footer-area-group">${esc(g.group)}</p>` +
    g.links.map(l => `<a href="${attr(l.href)}" class="footer-link">${esc(l.label)}</a>`).join('')
  ).join('');
  return `  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer-top">
        <h2 class="footer-hero-title">DISCOVER THE WORLD OF POSSIBILITIES WITH B&amp;B</h2>
        <p class="footer-hero-sub">Luxury kitchen &amp; bathroom remodeling across Montgomery County, Bucks County, and the Philadelphia Main Line.</p>
      </div>
      <div class="footer-grid">
        <div class="footer-col"><p class="footer-col-title">Navigation</p><nav class="footer-links" aria-label="Footer navigation"><a href="/" class="footer-link">Home</a><a href="/services/" class="footer-link">Services</a><a href="/showroom/" class="footer-link">Showroom</a><a href="/portfolio/" class="footer-link">Portfolio</a><a href="/about/" class="footer-link">About</a><a href="/contact/" class="footer-link">Contact</a><a href="/contact/#inquiry-form" class="footer-link">Inquiry Form</a><a href="/blog/" class="footer-link">Blog</a></nav></div>
        <div class="footer-col"><p class="footer-col-title">Services</p><nav class="footer-links" aria-label="Services navigation"><a href="/services/luxury-kitchen-remodeling/" class="footer-link">Luxury Kitchen Remodeling</a><a href="/services/custom-bathroom-renovations/" class="footer-link">Custom Bathroom Renovations</a><a href="/showroom/" class="footer-link">Ambler Design Showroom</a><a href="/reviews/" class="footer-link">Client Reviews</a></nav></div>
        <div class="footer-col"><p class="footer-col-title">Service Areas</p><nav class="footer-links" aria-label="Service areas navigation">${areas}<a href="/service-areas/" class="footer-link" style="color:var(--color-gold);">View All Areas →</a></nav></div>
        <div class="footer-col footer-col-stay-informed"><p class="footer-col-title">Stay Connected</p><p class="footer-newsletter-sub">Design insights, project reveals, and exclusive updates — delivered monthly.</p><form class="footer-newsletter-form" aria-label="Newsletter signup"><input type="email" placeholder="Your email address" required><button type="submit">Subscribe</button></form><div class="footer-connect-inline"><div class="footer-contact-line"><a href="tel:+12674028758">267-402-8758</a></div><div class="footer-contact-line"><a href="mailto:bb3associates@gmail.com">bb3associates@gmail.com</a></div><div class="footer-contact-line"><address>1141 E Welsh Rd, Maple Glen, PA 19002</address></div><div class="footer-social-row"><a href="https://instagram.com/bbassociatescreations" class="footer-social-link" target="_blank" rel="noopener" aria-label="B&amp;B Associates on Instagram">Instagram</a><a href="https://facebook.com/bbassociatescreations" class="footer-social-link" target="_blank" rel="noopener" aria-label="B&amp;B Associates on Facebook">Facebook</a><a href="https://www.tiktok.com/@bb.associates" class="footer-social-link" target="_blank" rel="noopener" aria-label="B&amp;B Associates on TikTok">TikTok</a></div></div></div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">&copy; 2026 B&amp;B Associates Creations LLC. All Rights Reserved. &nbsp;·&nbsp; PA HIC #PA104189</p>
        <nav class="footer-legal-links" aria-label="Legal"><a href="/privacy-policy/" class="footer-legal-link">Privacy Policy</a><span class="footer-legal-sep">&middot;</span><a href="/terms-of-service/" class="footer-legal-link">Terms of Service</a></nav>
        <p class="footer-tagline-right">Luxury Design-Build Remodeling — Philadelphia, PA</p>
      </div>
    </div>
  </footer>`;
}

const EXTRA_CSS = `
    /* generator additions (portfolio strip, cost mini-tiers, explore links) */
    .st-answer{font-family:var(--font-sans);font-size:var(--text-body-lg);font-weight:400;line-height:var(--leading-body);color:var(--color-text);border-left:2px solid var(--color-gold);padding-left:var(--sp-5);margin:0 0 var(--sp-6)}
    .st-content{padding:var(--section-padding-y) 0;background:var(--color-bg)}
    .st-content .container{max-width:860px}
    .st-content h2{font-family:var(--font-display);font-size:var(--text-h3);font-weight:400;line-height:var(--leading-tight);color:var(--color-white);margin:var(--sp-7) 0 var(--sp-4)}
    .st-content h2:first-of-type{margin-top:0}
    .st-content p{font-family:var(--font-sans);font-size:var(--text-body-lg);font-weight:300;line-height:var(--leading-body);color:var(--color-text);margin-bottom:var(--sp-4)}
    .st-tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-3);margin:var(--sp-6) 0 var(--sp-2)}
    .st-tier{border:1px solid var(--color-border-dim);padding:var(--sp-4);background:var(--color-bg-2)}
    .st-tier-name{font-family:var(--font-sans);font-size:var(--text-label);letter-spacing:var(--tracking-wide);text-transform:uppercase;color:var(--color-gold);margin-bottom:var(--sp-1)}
    .st-tier-range{font-family:var(--font-display);font-size:var(--text-h4);color:var(--color-white);line-height:1.1}
    .st-portfolio{padding:var(--section-padding-y) 0;background:var(--color-bg-2)}
    .st-portfolio-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-5);margin-top:var(--sp-6)}
    .st-project{display:block;text-decoration:none;color:inherit;border:1px solid var(--color-border-dim);background:var(--color-bg)}
    .st-project img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
    .st-project-title{font-family:var(--font-display);font-size:var(--text-h4);font-weight:400;color:var(--color-white);padding:var(--sp-4) var(--sp-4) var(--sp-1);line-height:1.15}
    .st-project-meta{font-family:var(--font-sans);font-size:var(--text-label);letter-spacing:var(--tracking-wide);text-transform:uppercase;color:var(--color-text-dim);padding:0 var(--sp-4) var(--sp-4)}
    .st-project:hover{border-color:var(--color-gold)}
    .st-links{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--sp-3)}
    @media (max-width:900px){.st-tiers,.st-portfolio-grid{grid-template-columns:1fr}.st-content h2{font-size:var(--text-h4)}}
`;

/* ── Page ────────────────────────────────────────────────────── */
function buildPage(town, service) {
  const url = pageUrl(service, town);
  const c = town.content[service.key];
  const isBath = service.key === 'bathroom';
  const title = fill(service.titlePattern, town, service);
  const description = c.metaDescription || fill(service.metaPattern, town, service);
  const ogImage = isBath ? (town.ogImageBath || town.ogImage) : town.ogImage;
  const introImage = isBath ? (town.introImageBath || town.introImage) : town.introImage;
  const faqs = pickFaqs(town, service);
  const projects = (town.portfolio[service.key] || []).map(id => projectById[id]).filter(Boolean).slice(0, 3);
  const articles = ((town.relatedArticles || {})[service.key] || []).map(id => articleById[id]).filter(Boolean).slice(0, 2);
  const otherService = SERVICES.find(s => s.key !== service.key);
  const formSource = `${town.displayName} — ${service.name}`;

  const nearbySame = (town.neighbors || []).map(s => townBySlug[s]).filter(Boolean)
    .map(n => `<a href="${attr(pageUrl(service, n))}" class="btn btn-ghost">${esc(service.name)} in ${esc(n.displayName)}, PA →</a>`);
  const nearbyGen = (town.nearbyGeneral || [])
    .map(l => `<a href="${attr(l.href)}" class="btn btn-ghost">Remodeling in ${esc(l.label)} →</a>`);

  const sectionsHtml = c.sections.map(s =>
    `<h2>${esc(s.h2)}</h2>\n` + s.paragraphs.map(p => `<p>${esc(p)}</p>`).join('\n')
  ).join('\n');

  const faqHtml = faqs.map(f => `          <div class="town-faq-item">
            <button class="town-faq-question" aria-expanded="false">${esc(f.q)}<span class="town-faq-icon" aria-hidden="true"></span></button>
            <div class="town-faq-answer" role="region"><div class="town-faq-answer-inner">${esc(f.a)}</div></div>
          </div>`).join('\n');

  const projectsHtml = projects.map(p => `          <a href="/portfolio/project/?id=${attr(p.id)}" class="st-project">
            <img src="${attr(p.thumbnail)}" alt="${attr(p.title)} — ${attr(p.type.toLowerCase())} remodel by B&amp;B Associates" loading="lazy" width="800" height="600">
            <p class="st-project-title">${esc(p.title)}</p>
            <p class="st-project-meta">${esc(p.style)} · ${esc(p.duration)} · ${esc(p.investment)}</p>
          </a>`).join('\n');

  const articlesHtml = articles.length ? `        <div class="st-links" style="margin-top:var(--sp-6)">
${articles.map(a => `          <a href="/blog/article/?id=${attr(a.id)}" class="btn btn-ghost">Read: ${esc(a.title)} →</a>`).join('\n')}
        </div>` : '';

  const tiersHtml = service.costTiers.map(t => `          <div class="st-tier"><p class="st-tier-name">${esc(t.name)}</p><p class="st-tier-range">${esc(t.range)}</p></div>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
${gtmHead()}
  <meta charset="UTF-8">
  <link rel="icon" type="image/png" href="/IMAGES/bandbassociates.png">
  <link rel="apple-touch-icon" href="/IMAGES/bandbassociates.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(description)}">
  <link rel="canonical" href="${attr(absUrl(url))}">

  <!-- Open Graph -->
  <meta property="og:title" content="${attr(title)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:image" content="${attr(ogImage)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${attr(absUrl(url))}">
  <meta property="og:site_name" content="B&amp;B Associates Creations">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(title)}">
  <meta name="twitter:description" content="${attr(description)}">
  <meta name="twitter:image" content="${attr(ogImage)}">

  <!-- Geo -->
  <meta name="geo.region" content="US-PA">
  <meta name="geo.placename" content="${attr(town.displayName)}, Pennsylvania">
  <meta name="geo.position" content="${town.geo.lat};${town.geo.lng}">
  <meta name="ICBM" content="${town.geo.lat}, ${town.geo.lng}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/design-system.css">
  <link rel="stylesheet" href="/css/components.css">
${ld(serviceSchema(town, service, url))}
${ld(businessSchema(town))}
${ld(breadcrumbSchema(town, service, url))}
${ld(faqSchema(faqs))}
  <style>${CSS}${EXTRA_CSS}  </style>
</head>
<body>
${gtmBody()}
${nav()}

  <main>
    <!-- HERO -->
    <section class="sa-hero" aria-label="${attr(service.name)} in ${attr(town.displayName)}, PA">
      <div class="sa-hero-image" style="background-image:url('${attr(town.heroImage)}');"></div>
      <div class="sa-hero-overlay"></div>
      <div class="sa-hero-inner">
        <div class="sa-hero-content">
          <nav class="sa-hero-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span class="sa-hero-breadcrumb-sep" aria-hidden="true">›</span>
            <a href="/service-areas/">Service Areas</a>
            <span class="sa-hero-breadcrumb-sep" aria-hidden="true">›</span>
            <a href="${attr(service.canonicalServicePage)}">${esc(service.breadcrumbLabel)}</a>
            <span class="sa-hero-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">${esc(town.displayName)}, PA</span>
          </nav>
          <p class="sa-hero-eyebrow">${esc(town.regionEyebrow)}</p>
          <div class="headline-reveal">
            <span class="line-wrap"><span class="line-inner">
              <h1 class="sa-hero-h1">${fill(service.h1Pattern, town, service)}</h1>
            </span></span>
          </div>
          <div class="sa-hero-divider"></div>
          <p class="sa-hero-towns">${esc(town.heroTowns)}</p>
          <div class="sa-hero-actions">
            <a href="#get-estimate" class="phil-btn phil-btn-fill"><div class="phil-fill"></div><span class="phil-label">Free Consultation</span></a>
            <a href="tel:+12674028758" class="phil-btn phil-btn-fill phil-btn-fill-dark"><div class="phil-fill"></div><span class="phil-label">267-402-8758</span></a>
          </div>
        </div>
      </div>
      <div class="sa-hero-stats">
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">25+</span><span class="sa-hero-stat-label">Years Local</span></div>
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">5.0★</span><span class="sa-hero-stat-label">183 Reviews</span></div>
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">60+</span><span class="sa-hero-stat-label">Supplier Partners</span></div>
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">Free</span><span class="sa-hero-stat-label">Consultation</span></div>
      </div>
    </section>

    <!-- INTRO -->
    <section class="sa-intro-section" aria-label="Introduction">
      <div class="container">
        <div class="sa-intro-grid">
          <div class="reveal">
            <p class="sa-intro-label">${esc(service.name)} · ${esc(town.displayName)}, PA</p>
            <div class="headline-reveal"><span class="line-wrap"><span class="line-inner">
              <h2 class="sa-intro-h2">${esc(c.introH2)}</h2>
            </span></span></div>
            <p class="st-answer">${esc(c.answerFirst)}</p>
            <p class="sa-intro-body">B&amp;B Associates is a family-operated design-build remodeler based in Maple Glen, PA, serving ${esc(town.displayName)} ${esc(town.distancePhrase)}. One team handles design, materials, permits, and construction — with a fully itemized estimate before any contract is signed.</p>
            <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap;">
              <a href="#get-estimate" class="phil-btn phil-btn-fill phil-btn-fill-dark"><div class="phil-fill"></div><span class="phil-label">Request an Estimate</span></a>
              <a href="${attr(service.portfolioFilter)}" class="phil-btn phil-btn-fill phil-btn-fill-dark"><div class="phil-fill"></div><span class="phil-label">View ${esc(service.shortName)} Projects</span></a>
            </div>
          </div>
          <div class="sa-intro-visual reveal">
            <div class="sa-intro-img-wrap">
              <img src="${attr(introImage)}" alt="${attr(fill(service.heroAlt, town, service))}" loading="lazy" width="900" height="1200">
            </div>
          </div>
        </div>
        <div class="sa-trust-strip reveal-group">
          <div class="sa-trust-strip-item"><div class="sa-trust-strip-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg></div><div><p class="sa-trust-strip-title">Local Since 2013</p><p class="sa-trust-strip-body">Family operated, based in Maple Glen, PA</p></div></div>
          <div class="sa-trust-strip-item"><div class="sa-trust-strip-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg></div><div><p class="sa-trust-strip-title">${esc(town.townships[0])} Permits</p><p class="sa-trust-strip-body">Filed, inspected and closed out inside our scope</p></div></div>
          <div class="sa-trust-strip-item"><div class="sa-trust-strip-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg></div><div><p class="sa-trust-strip-title">Itemized Estimates</p><p class="sa-trust-strip-body">Every line visible before you sign</p></div></div>
        </div>
      </div>
    </section>

    <!-- TOWN + SERVICE CONTENT -->
    <section class="st-content" aria-label="${attr(service.name)} in ${attr(town.displayName)}">
      <div class="container">
${sectionsHtml}
      </div>
    </section>

    <!-- SERVICE CARD -->
    <section class="town-services">
      <div class="container">
        <p class="section-label" style="color:var(--color-gold);">What We Do in ${esc(town.displayName)}</p>
        <h2 style="font-family:var(--font-display);font-size:var(--text-h2);font-weight:300;font-style:italic;color:#1a1a1a;line-height:var(--leading-tight);margin-bottom:var(--sp-3);">${esc(fill(service.cardTitle, town, service))}</h2>
        <div class="town-services-grid">
          <div class="town-service-card">
            <h3 class="town-service-h3">${esc(service.name)}</h3>
            <p class="town-service-body">${esc(fill(service.cardBody, town, service))}</p>
            <ul class="town-service-list">
${service.deliverables.map(d => `              <li>${esc(d)}</li>`).join('\n')}
            </ul>
            <div class="town-service-range"><a href="${attr(service.canonicalServicePage)}" style="color:inherit;">Explore our ${esc(service.canonicalServiceLabel)} service →</a></div>
          </div>
          <div class="town-service-card">
            <h3 class="town-service-h3">Typical ${esc(service.shortName)} Investment</h3>
            <p class="town-service-body">Sitewide tiers for reference; the ${esc(town.displayName)} ranges above reflect what we see locally. ${esc(service.costNote)}</p>
            <div class="st-tiers">
${tiersHtml}
            </div>
            <div class="town-service-range"><a href="${attr(pageUrl(otherService, town))}" style="color:inherit;">Also: ${esc(otherService.name)} in ${esc(town.displayName)} →</a></div>
          </div>
        </div>
      </div>
    </section>

    <!-- PORTFOLIO -->
    <section class="st-portfolio" aria-label="Recent ${attr(service.shortName.toLowerCase())} projects">
      <div class="container">
        <p class="section-label" style="color:var(--color-gold);">Recent Work</p>
        <h2 style="font-family:var(--font-display);font-size:var(--text-h2);font-weight:300;font-style:italic;color:var(--color-white);line-height:var(--leading-tight);margin-bottom:var(--sp-3);">${esc(service.shortName)} Projects to Explore</h2>
        <div class="st-portfolio-grid">
${projectsHtml}
        </div>
${articlesHtml}
      </div>
    </section>

    <!-- LEAD FORM (shared inquiry form) -->
    <section class="town-form-section" id="get-estimate">
      <div class="container">
        <div class="town-form-grid">
          <div>
            <p class="section-label">Start Here</p>
            <h2 class="town-form-h2">Tell Us About Your<br>${esc(town.displayName)} ${esc(service.shortName)} Project</h2>
            <p class="town-form-sub">Fill out the form and we'll be in touch within 5–15 minutes to discuss your project, answer questions, and schedule a free in-home consultation.</p>
          </div>
          <div class="town-form-wrap">
            <p class="town-form-title">Request Your Free Estimate</p>
            <div data-bb-inquiry data-source="${attr(formSource)}" data-type="service_town" data-source-label="Service Areas" data-service-area="${attr(formSource)}"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="town-faq">
      <div class="container">
        <p class="section-label" style="color:var(--color-gold);">Questions</p>
        <h2 class="town-faq-h2">${esc(service.name)} Questions from ${esc(town.displayName)} Homeowners</h2>
        <div>
${faqHtml}
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-panel">
      <p class="section-label">Start Today</p>
      <div class="headline-reveal"><span class="line-wrap"><span class="line-inner"><h2 class="cta-panel-title">Ready for Your Free Consultation?</h2></span></span></div>
      <p class="cta-panel-body">We'll come to your ${esc(town.displayName)} home, review the space, and walk you through what's possible — at no cost and no obligation.</p>
      <div class="cta-panel-actions">
        <a href="#get-estimate" class="phil-btn phil-btn-fill"><div class="phil-fill"></div><span class="phil-label">Get a Free Estimate →</span></a>
        <span class="cta-panel-secondary">or call <a href="tel:+12674028758">267-402-8758</a></span>
      </div>
    </section>

    <!-- NEARBY -->
    <section style="padding:var(--section-padding-y) 0;background:var(--color-bg);" aria-label="Nearby communities">
      <div class="container" style="max-width:1100px;margin:0 auto;padding:0 var(--sp-5);text-align:center;">
        <p class="eyebrow" style="margin-bottom:var(--sp-3);">Also Serving Nearby ${esc(town.county)} Communities</p>
        <h2 style="font-family:var(--font-display);font-size:clamp(1.6rem,3vw,2.2rem);font-weight:400;line-height:1.2;color:var(--color-text);margin-bottom:var(--sp-5);">${esc(service.name)} Near <em>${esc(town.displayName)}, PA</em></h2>
        <div class="st-links">
${nearbySame.map(l => '          ' + l).join('\n')}
${nearbyGen.map(l => '          ' + l).join('\n')}
          <a href="${attr(town.generalPage)}" class="btn btn-ghost">${esc(town.displayName)} kitchen &amp; bath overview →</a>
          <a href="/service-areas/" class="btn btn-ghost" style="color:var(--color-gold);">View All Service Areas →</a>
        </div>
      </div>
    </section>
  </main>

${footer()}

  <script src="/js/business-config.js"></script>
  <script src="/js/init.js"></script>
  <script src="/js/analytics.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script src="/js/supabase-client.js"></script>
  <script src="/js/inquiry-form.js"></script>
  <script>
    document.querySelectorAll('.town-faq-question').forEach(function(btn){btn.addEventListener('click',function(){var item=this.closest('.town-faq-item');var isOpen=item.classList.contains('open');document.querySelectorAll('.town-faq-item.open').forEach(function(el){el.classList.remove('open');el.querySelector('.town-faq-question').setAttribute('aria-expanded','false')});if(!isOpen){item.classList.add('open');this.setAttribute('aria-expanded','true')}})});
  </script>
<script>(function(){var logo=document.querySelector(".nav-logo");if(!logo)return;var clicks=0,timer=null;logo.addEventListener("click",function(e){clicks++;if(timer)clearTimeout(timer);if(clicks>=6){e.preventDefault();clicks=0;window.location.href="/admin/index.html";return;}timer=setTimeout(function(){clicks=0;},3000);});})()</script>
</body>
</html>
`;
}

/* ── Sitemap upsert ──────────────────────────────────────────── */
function updateSitemap(urls) {
  let xml = read('sitemap.xml');
  const marker = '  <!-- Service × Town Pages (generated by scripts/build-town-pages.js) -->';
  const block = url => `  <url>
    <loc>${absUrl(url)}</loc>
    <lastmod>${SITE.buildDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
  </url>`;
  // remove any previous generated block(s) for these URLs
  for (const url of urls) {
    const re = new RegExp(`\\s*<url>\\s*<loc>${absUrl(url).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>[\\s\\S]*?</url>`, 'g');
    xml = xml.replace(re, '');
  }
  xml = xml.replace(new RegExp(`\\n?${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`, 'g'), '\n');
  const insert = `\n${marker}\n${urls.map(block).join('\n')}\n`;
  xml = xml.replace(/\s*<\/urlset>\s*$/, insert + '</urlset>\n');
  xml = xml.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
}

/* ── Main ────────────────────────────────────────────────────── */
function main() {
  const written = [];
  for (const service of SERVICES) {
    for (const town of TOWNS) {
      const url = pageUrl(service, town);
      const dir = path.join(ROOT, url.slice(1));
      fs.mkdirSync(dir, { recursive: true });
      const html = buildPage(town, service);
      const out = path.join(dir, 'index.html');
      const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
      if (prev !== html) fs.writeFileSync(out, html);
      written.push({ url, changed: prev !== html, bytes: html.length });
    }
  }
  updateSitemap(written.map(w => w.url));
  for (const w of written) console.log(`${w.changed ? 'wrote ' : 'same  '} ${w.url} (${w.bytes} bytes)`);
  console.log(`${written.length} pages; sitemap.xml updated (lastmod ${SITE.buildDate}).`);
}

if (require.main === module) main();
module.exports = { buildPage, TOWNS, SERVICES, pageUrl };
