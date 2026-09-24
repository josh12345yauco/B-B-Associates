#!/usr/bin/env node
/* ============================================================
   B&B Associates — Guide / service page generator
   Reads data/guides.json, reuses the shared blocks from
   scripts/build-town-pages.js (GTM, nav, footer, schema, CSS) and
   writes one page per entry, then upserts sitemap.xml.
   Usage: node scripts/build-guide-pages.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const town = require('./build-town-pages.js');
const { gtmHead, gtmBody, nav, footer, businessSchema, faqSchema, ld, esc, attr, absUrl, SITE, CSS, EXTRA_CSS } = town.blocks;

const ROOT = path.resolve(__dirname, '..');
const GUIDES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guides.json'), 'utf8')).pages;
const HQ = town.TOWNS.find(t => t.slug === 'ambler'); // businessSchema needs a town for geo; HQ address is in the block itself

const GUIDE_CSS = `
    .gd-tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-5);margin:var(--sp-6) 0}
    @media (max-width:900px){.gd-tiers{grid-template-columns:1fr}}
    .gd-tier{background:#fff;border:1px solid rgba(182,117,57,.25);padding:var(--sp-6)}
    .gd-tier-name{font-family:var(--font-mono);font-size:var(--text-label);letter-spacing:var(--tracking-wide);text-transform:uppercase;color:var(--color-gold);margin-bottom:var(--sp-2)}
    .gd-tier-range{font-family:var(--font-display);font-size:clamp(1.6rem,2.6vw,2.1rem);font-weight:400;color:#1a1a1a;line-height:1.1;margin-bottom:var(--sp-3)}
    .gd-tier-desc{font-family:var(--font-sans);font-size:var(--text-body);color:#4B5563;line-height:var(--leading-body)}
    .gd-tier-note{font-family:var(--font-sans);font-size:var(--text-small);color:#6B7280;max-width:760px}
    .gd-related{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-3)}
    @media (max-width:700px){.gd-related{grid-template-columns:1fr}}
    .gd-related a{display:block;padding:var(--sp-4) var(--sp-5);border:1px solid rgba(182,117,57,.25);background:#fff;color:#1a1a1a;text-decoration:none;font-family:var(--font-sans);font-size:var(--text-body);transition:border-color var(--dur-fast)}
    .gd-related a:hover{border-color:var(--color-gold)}
`;

function breadcrumbSchema(page) {
  const items = [["/", "Home"], ...page.breadcrumb, [page.slug, page.breadcrumbLabel]];
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": items.map(([href, name], i) => ({ "@type": "ListItem", "position": i + 1, "name": name, "item": absUrl(href) })) };
}
function pageSchema(page) {
  const url = absUrl(page.slug);
  if (page.kind === 'service') return { "@context": "https://schema.org", "@type": "Service", "@id": url + "#service",
    "name": page.serviceName, "serviceType": page.serviceName, "url": url, "description": page.description,
    "provider": { "@id": SITE.businessId }, "areaServed": ["Montgomery County, PA", "Bucks County, PA", "Philadelphia Main Line, PA"] };
  return { "@context": "https://schema.org", "@type": "WebPage", "@id": url + "#webpage", "url": url, "name": page.title,
    "description": page.description, "dateModified": SITE.buildDate, "isPartOf": { "@id": SITE.origin + "/#website" },
    "about": { "@id": SITE.businessId }, "publisher": { "@id": SITE.businessId } };
}

function buildGuide(page) {
  const url = page.slug;
  const crumbs = [["/", "Home"], ...page.breadcrumb].map(([h, n]) => `<a href="${attr(h)}">${esc(n)}</a><span class="sa-hero-breadcrumb-sep" aria-hidden="true">›</span>`).join('\n            ');
  const tiers = page.tiers ? `
    <!-- COST TIERS -->
    <section class="town-services" aria-label="${attr(page.tiers.h2)}">
      <div class="container">
        <p class="section-label" style="color:var(--color-gold);">${esc(page.tiers.label)}</p>
        <h2 style="font-family:var(--font-display);font-size:var(--text-h2);font-weight:300;font-style:italic;color:#1a1a1a;line-height:var(--leading-tight);margin-bottom:var(--sp-3);">${esc(page.tiers.h2)}</h2>
        <div class="gd-tiers">
${page.tiers.rows.map(([n, r, d]) => `          <div class="gd-tier"><p class="gd-tier-name">${esc(n)}</p><p class="gd-tier-range">${esc(r)}</p><p class="gd-tier-desc">${esc(d)}</p></div>`).join('\n')}
        </div>
        <p class="gd-tier-note">${esc(page.tiers.note)}</p>
      </div>
    </section>
` : '';
  const sections = page.sections.map(s => `<h2>${esc(s.h2)}</h2>\n` + s.paragraphs.map(p => `<p>${esc(p)}</p>`).join('\n')).join('\n');
  const faqHtml = page.faqs.map(f => `          <div class="town-faq-item">
            <button class="town-faq-question" aria-expanded="false">${esc(f.q)}<span class="town-faq-icon" aria-hidden="true"></span></button>
            <div class="town-faq-answer" role="region"><div class="town-faq-answer-inner">${esc(f.a)}</div></div>
          </div>`).join('\n');
  const related = page.related.map(([h, n]) => `          <a href="${attr(h)}">${esc(n)} →</a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
${gtmHead()}
  <meta charset="UTF-8">
  <link rel="icon" type="image/png" href="/IMAGES/bandbassociates.png">
  <link rel="apple-touch-icon" href="/IMAGES/bandbassociates.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(page.title)}</title>
  <meta name="description" content="${attr(page.description)}">
  <link rel="canonical" href="${attr(absUrl(url))}">

  <!-- Open Graph -->
  <meta property="og:title" content="${attr(page.title)}">
  <meta property="og:description" content="${attr(page.description)}">
  <meta property="og:image" content="${attr(page.ogImage)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${attr(absUrl(url))}">
  <meta property="og:site_name" content="B&amp;B Associates Creations">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(page.title)}">
  <meta name="twitter:description" content="${attr(page.description)}">
  <meta name="twitter:image" content="${attr(page.ogImage)}">

  <meta name="geo.region" content="US-PA">
  <meta name="geo.placename" content="Maple Glen, Pennsylvania">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/design-system.css">
  <link rel="stylesheet" href="/css/components.css">
${ld(pageSchema(page))}
${ld(businessSchema(HQ))}
${ld(breadcrumbSchema(page))}
${ld(faqSchema(page.faqs))}
  <style>${CSS}${EXTRA_CSS}${GUIDE_CSS}  </style>
</head>
<body>
${gtmBody()}
${nav()}

  <main>
    <!-- HERO -->
    <section class="sa-hero" aria-label="${attr(page.breadcrumbLabel)}">
      <div class="sa-hero-image" style="background-image:url('${attr(page.heroImage)}');"></div>
      <div class="sa-hero-overlay"></div>
      <div class="sa-hero-inner">
        <div class="sa-hero-content">
          <nav class="sa-hero-breadcrumb" aria-label="Breadcrumb">
            ${crumbs}
            <span aria-current="page">${esc(page.breadcrumbLabel)}</span>
          </nav>
          <p class="sa-hero-eyebrow">${esc(page.eyebrow)}</p>
          <div class="headline-reveal">
            <span class="line-wrap"><span class="line-inner">
              <h1 class="sa-hero-h1">${page.h1}</h1>
            </span></span>
          </div>
          <div class="sa-hero-divider"></div>
          <div class="sa-hero-actions">
            <a href="#get-estimate" class="phil-btn phil-btn-fill"><div class="phil-fill"></div><span class="phil-label">Get an Itemized Estimate</span></a>
          </div>
        </div>
      </div>
      <div class="sa-hero-stats">
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">5.0★</span><span class="sa-hero-stat-label">Google Reviews</span></div>
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">60+</span><span class="sa-hero-stat-label">Supplier Partners</span></div>
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">Itemized</span><span class="sa-hero-stat-label">Every Estimate</span></div>
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">Free</span><span class="sa-hero-stat-label">Consultation</span></div>
      </div>
    </section>

    <!-- ANSWER FIRST -->
    <section class="sa-intro-section" aria-label="Summary">
      <div class="container">
        <div class="sa-intro-grid">
          <div>
            <p class="sa-intro-label">${esc(page.introH2)}</p>
            <h2 class="sa-intro-h2">${esc(page.kind === 'service' ? page.serviceName : page.breadcrumbLabel)}</h2>
            <p class="sa-intro-body">${esc(page.answerFirst)}</p>
          </div>
          <div class="sa-intro-visual"><div class="sa-intro-img-wrap"><img src="${attr(page.heroImage)}" alt="${attr(page.breadcrumbLabel)} — B&amp;B Associates project" loading="lazy" width="800" height="600"></div></div>
        </div>
      </div>
    </section>
${tiers}
    <!-- CONTENT -->
    <section class="st-content" aria-label="${attr(page.breadcrumbLabel)} details">
      <div class="container">
${sections}
      </div>
    </section>

    <!-- REVIEWS -->
    <section class="section" style="background:#FAF8F6;padding:var(--section-padding-y) 0;" aria-label="Client reviews">
      <div class="container">
        <p class="section-label" style="display:block;text-align:center;margin-bottom:var(--sp-7);color:var(--color-gold);">From Our Neighbors</p>
        <div data-bb-reviews data-initial="4" data-step="4"></div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="town-faq">
      <div class="container">
        <p class="section-label" style="color:var(--color-gold);">Questions</p>
        <h2 class="town-faq-h2">${esc(page.breadcrumbLabel)} Questions</h2>
        <div>
${faqHtml}
        </div>
      </div>
    </section>

    <!-- LEAD FORM -->
    <section class="town-form-section" id="get-estimate">
      <div class="container">
        <div class="town-form-grid">
          <div>
            <p class="section-label">Start Here</p>
            <h2 class="town-form-h2">Get an Itemized<br>${esc(page.formLabel)} Estimate</h2>
            <p class="town-form-sub">Tell us about the project and we'll be in touch within 5–15 minutes to answer questions and schedule a free in-home consultation.</p>
          </div>
          <div class="town-form-wrap">
            <p class="town-form-title">Request Your Free Estimate</p>
            <div data-bb-inquiry data-source="${attr(page.formSource)}" data-type="guide" data-source-label="Guides" data-service-area="${attr(page.formSource)}"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- RELATED -->
    <section style="padding:var(--section-padding-y) 0;background:var(--color-bg);" aria-label="Related reading">
      <div class="container">
        <p class="section-label" style="color:var(--color-gold);">Keep Reading</p>
        <div class="gd-related">
${related}
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
  <script src="/js/town-reviews.js"></script>
  <script>
    document.querySelectorAll('.town-faq-question').forEach(function(btn){btn.addEventListener('click',function(){var item=this.closest('.town-faq-item');var isOpen=item.classList.contains('open');document.querySelectorAll('.town-faq-item.open').forEach(function(el){el.classList.remove('open');el.querySelector('.town-faq-question').setAttribute('aria-expanded','false')});if(!isOpen){item.classList.add('open');this.setAttribute('aria-expanded','true')}})});
  </script>
<script>(function(){var logo=document.querySelector(".nav-logo");if(!logo)return;var clicks=0,timer=null;logo.addEventListener("click",function(e){clicks++;if(timer)clearTimeout(timer);if(clicks>=6){e.preventDefault();clicks=0;window.location.href="/admin/index.html";return;}timer=setTimeout(function(){clicks=0;},3000);});})()</script>
</body>
</html>
`;
}

function main() {
  const urls = [];
  for (const page of GUIDES) {
    const out = path.join(ROOT, page.slug, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buildGuide(page));
    urls.push(page.slug);
    console.log('wrote ', page.slug, `(${fs.statSync(out).size} bytes)`);
  }
  town.updateSitemap(urls, '  <!-- Guide + service pages (generated by scripts/build-guide-pages.js) -->', '0.85');
  console.log(`${urls.length} pages; sitemap.xml updated (lastmod ${SITE.buildDate}).`);
}
if (require.main === module) main();
