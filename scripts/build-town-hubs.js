#!/usr/bin/env node
/* ============================================================
   B&B Associates Creations — One-page-per-town hub generator
   ------------------------------------------------------------
   Merges the kitchen + bathroom town pages into the town's
   existing overview URL (town.generalPage), which keeps the
   Google history. The old kitchen/bathroom town URLs 301 here
   (see vercel.json) and are skipped by build-town-pages.js.

   Pricing comes ONLY from the owner's pricing sheets (data/pricing.json).
   Sentences with dollar figures in the town copy are dropped so no
   unverified price survives.

   Usage:   node scripts/build-town-hubs.js yardley [chalfont ...]
            node scripts/build-town-hubs.js --all   (every town with consolidate:true)
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const T = require('./build-town-pages.js');
const { gtmHead, gtmBody, nav, footer, businessSchema, faqSchema, ld, esc, attr, absUrl, CSS, EXTRA_CSS, projectById, articleById } = T.blocks;

const ROOT = path.resolve(__dirname, '..');
const PRICING = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/pricing.json'), 'utf8'));
const BANDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/band-images.json'), 'utf8'));
const townBySlug = Object.fromEntries(T.TOWNS.map(t => [t.slug, t]));
const svc = Object.fromEntries(T.SERVICES.map(s => [s.key, s]));

const noPrices = text => String(text).split(/(?<=[.!?])\s+/).filter(s => !/\$\d|\btier\b|Foundation|Premium tier|Signature/i.test(s)).join(' ');
const isCostSection = s => /investment|cost|price|budget/i.test(s.h2);
const isCostFaq = f => /cost|price|how much|budget|\$/i.test(f.q + ' ' + f.a);
const fillTown = (s, town) => String(s).replace(/\{Town\}/g, town.displayName);

function hubProjects(town) {
  const all = Object.values(projectById);
  const local = all.filter(p => p.town === town.displayName);
  const county = all.filter(p => p.town !== town.displayName && p.county === town.county);
  const picked = [...(town.portfolio.kitchen || []), ...(town.portfolio.bathroom || [])].map(id => projectById[id]).filter(Boolean);
  const seen = new Set(); const out = [];
  for (const p of [...local, ...county, ...picked]) { if (!seen.has(p.id)) { seen.add(p.id); out.push(p); } }
  return { list: out.slice(0, 6), localCount: local.length };
}

function hubFaqs(town) {
  const seen = new Set();
  const lists = ['kitchen', 'bathroom'].map(key => {
    const service = svc[key];
    const shared = service.faqPool.map(f => ({ q: fillTown(f.q, town).replace(/\{[A-Za-z]+\}/g, town.displayName), a: fillTown(f.a, town).replace(/\{Township\}/g, town.townships[0]).replace(/\{Permit\}/g, town.permitAuthority).replace(/\{County\}/g, town.county) }));
    return [...(town.content[key].faqOverrides || []), ...shared].filter(f => {
      const k = f.q.toLowerCase().replace(/[^a-z]/g, '').slice(0, 30);
      if (seen.has(k) || isCostFaq(f)) return false;
      seen.add(k); return true;
    }).map(f => ({ q: f.q, a: f.a }));
  });
  const pool = [];
  for (let i = 0; i < Math.max(lists[0].length, lists[1].length); i++) { if (lists[0][i]) pool.push(lists[0][i]); if (lists[1][i]) pool.push(lists[1][i]); }
  const cost = [
    { q: `How much does a kitchen remodel cost in ${town.displayName}, PA?`,
      a: `Most B&B kitchens land in one of four ranges: ${PRICING.kitchen.map(t => `${t.label.toLowerCase()} ${t.range}`).join(', ')}. Size and finish level drive the number more than the town does. You get a fully itemized estimate before anything is signed.` },
    { q: `How much does a bathroom remodel cost in ${town.displayName}, PA?`,
      a: `${PRICING.bathroom.map(t => `${t.label}: ${t.range}`).join('. ')}. Every estimate is itemized line by line.` },
  ];
  return [...cost, ...pool].slice(0, 8);
}

function buildHub(town) {
  const url = town.generalPage;
  const k = town.content.kitchen, b = town.content.bathroom;
  const title = PRICING.hubTitles.map(t => fillTown(t, town)).find(t => t.length <= 65) || fillTown(PRICING.hubTitles.at(-1), town);
  const description = fillTown(PRICING.hubDescription, town);
  const faqs = hubFaqs(town);
  const { list: projects, localCount } = hubProjects(town);
  const articles = [...((town.relatedArticles || {}).kitchen || []), ...((town.relatedArticles || {}).bathroom || [])]
    .filter((v, i, a) => a.indexOf(v) === i).map(id => articleById[id]).filter(Boolean).slice(0, 3);

  const sect = c => c.sections.filter(s => !isCostSection(s)).map(s =>
    `            <article class="hub-topic reveal">\n              <h3>${esc(s.h2)}</h3>\n` + s.paragraphs.map(p => noPrices(p)).filter(Boolean).map(p => `              <p>${esc(p)}</p>`).join('\n') + `\n            </article>`).join('\n');

  const tier = (rows) => rows.map(t => `            <div class="cost-card corner-ticks-grey"><p class="cost-tier">${esc(t.label)}</p><p class="cost-range">${esc(t.range)}</p></div>`).join('\n');
  const card = p => `        <a href="/portfolio/${attr(p.id)}/" class="project-card" aria-label="${attr(p.title)}, ${attr(p.town)}">
          <img src="${attr(p.thumbnail)}" alt="${attr(p.title)}, ${attr(p.type.toLowerCase())} remodel in ${attr(p.town)}, PA by B&amp;B Associates Creations" loading="lazy" width="800" height="1000">
          <div class="project-card-overlay">
            <p class="project-card-meta">${esc(p.town)} &middot; ${esc(p.type)}</p>
            <p class="project-card-title">${esc(p.title)}</p>
            <span class="project-card-cta">View Project &rarr;</span>
          </div>
        </a>`;
  const projectsHtml = projects.map(card).join('\n');
  const band = key => {
    const pick = (town.bandImages || {})[key] || (BANDS[town.county] || {})[key];
    const p = pick && projectById[pick.project];
    if (p) return { ...p, thumbnail: pick.image };
    return projects.find(x => (key === 'kitchen') === (x.type === 'Kitchen')) || projects[0];
  };
  const featureK = band('kitchen');
  const featureB = band('bathroom');
  const feature = (p, label) => p ? `<figure class="hub-band reveal"><img src="${attr(p.thumbnail)}" alt="${attr(p.title)}, ${label} remodel by B&amp;B Associates Creations in ${attr(p.town)}, PA" loading="lazy" width="1600" height="700"><figcaption><span>${esc(p.title)}</span><span>${esc(p.town)}, PA</span></figcaption></figure>` : '';

  const neighbors = (town.neighbors || []).map(s => townBySlug[s]).filter(n => n && n.generalPage && n.generalPage !== url)
    .filter((n, i, a) => a.findIndex(x => x.generalPage === n.generalPage) === i)
    .map(n => `<a href="${attr(n.generalPage)}" class="btn btn-ghost">Remodeling in ${esc(n.displayName)}, PA →</a>`);
  const nearbyGen = (town.nearbyGeneral || []).map(l => `<a href="${attr(l.href)}" class="btn btn-ghost">Remodeling in ${esc(l.label)} →</a>`);

  const serviceLd = ['kitchen', 'bathroom'].map(key => ({
    '@context': 'https://schema.org', '@type': 'Service', serviceType: svc[key].name,
    name: `${svc[key].name} in ${town.displayName}, PA`, url: absUrl(url),
    provider: { '@id': 'https://www.bbassociatesco.com/#business' },
    areaServed: { '@type': 'City', name: `${town.displayName}, PA` },
  }));
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl('/') },
    { '@type': 'ListItem', position: 2, name: 'Service Areas', item: absUrl('/service-areas/') },
    { '@type': 'ListItem', position: 3, name: `${town.displayName}, PA`, item: absUrl(url) } ] };

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
  <meta property="og:title" content="${attr(title)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:image" content="${attr(town.ogImage)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${attr(absUrl(url))}">
  <meta property="og:site_name" content="B&amp;B Associates Creations">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(title)}">
  <meta name="twitter:description" content="${attr(description)}">
  <meta name="twitter:image" content="${attr(town.ogImage)}">
  <meta name="geo.region" content="US-PA">
  <meta name="geo.placename" content="${attr(town.displayName)}, Pennsylvania">
  <meta name="geo.position" content="${town.geo.lat};${town.geo.lng}">
  <meta name="ICBM" content="${town.geo.lat}, ${town.geo.lng}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/design-system.css">
  <link rel="stylesheet" href="/css/components.css">
${serviceLd.map(ld).join('\n')}
${ld(businessSchema(town))}
${ld(crumbLd)}
${ld(faqSchema(faqs))}
  <style>${CSS}${EXTRA_CSS}
    .hub-sec{padding:var(--section-padding-y) 0}
    .hub-sec.alt{background:var(--color-bg-2)}
    .hub-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(2rem,6vw,6rem);align-items:end;margin-bottom:var(--sp-8)}
    .hub-head h2{font-family:var(--font-display);font-size:var(--text-h2);font-weight:var(--weight-light);line-height:var(--leading-snug);color:var(--color-white);margin-top:var(--sp-3)}
    .hub-lede{font-family:var(--font-sans);font-size:var(--text-body-lg);font-weight:300;line-height:var(--leading-body);color:var(--color-text);margin:0;padding-left:var(--sp-5);border-left:1px solid var(--color-gold-border)}
    .hub-band{margin:0 0 var(--sp-9)}
    .hub-band img{display:block;width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:2px}
    .hub-band figcaption{display:flex;justify-content:space-between;gap:var(--sp-4);font-family:var(--font-mono);font-size:11px;letter-spacing:var(--tracking-wide);text-transform:uppercase;color:var(--color-text-dim);margin-top:var(--sp-3)}
    .hub-topics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-8) clamp(2rem,5vw,5rem)}
    .hub-topic{border-top:1px solid var(--color-gold-border);padding-top:var(--sp-6)}
    .hub-topic h3{font-family:var(--font-display);font-weight:400;font-style:italic;font-size:clamp(1.4rem,2vw,1.8rem);line-height:1.2;color:var(--color-white);margin:0 0 var(--sp-4)}
    .hub-topic p{font-family:var(--font-sans);font-size:var(--text-body);font-weight:300;line-height:var(--leading-body);color:var(--color-text);margin:0 0 var(--sp-4)}
    .hub-cost{background:#FAF8F6;padding:var(--section-padding-y) 0}
    .hub-cost .section-label{color:var(--color-gold)}
    .hub-cost h2{font-family:var(--font-display);font-size:var(--text-h2);font-weight:var(--weight-light);line-height:var(--leading-snug);color:#1a1a1a;margin:var(--sp-3) 0 var(--sp-4)}
    .hub-cost .hub-note{color:#4B5563;max-width:62ch;margin-bottom:var(--sp-8)}
    .hub-cost h3{font-family:var(--font-display);font-style:italic;font-weight:400;font-size:1.6rem;color:#1a1a1a;margin:0 0 var(--sp-4)}
    .hub-cost-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--sp-4);margin-bottom:var(--sp-8)}
    .hub-cost .cost-card{background:#fff;border:1px solid #e5e7eb;padding:var(--sp-6) var(--sp-5)}
    .hub-cost .cost-tier{font-family:var(--font-mono);font-size:11px;letter-spacing:var(--tracking-wide);text-transform:uppercase;color:#4B5563;margin-bottom:var(--sp-3)}
    .hub-cost .cost-range{font-family:var(--font-display);font-size:clamp(1.3rem,1.8vw,1.6rem);color:var(--color-gold-dark, #9a7a3f);line-height:1.2}
    .hub-cost .hub-links{display:flex;gap:var(--sp-6);flex-wrap:wrap}
    .hub-cost .projects-link{color:var(--color-gold-dark, #9a7a3f)}
    .corner-ticks-grey{position:relative}
    .hub-work{background:var(--color-bg-2);padding:var(--section-padding-y) 0}
    .hub-work-head{display:flex;justify-content:space-between;align-items:flex-end;gap:var(--sp-5);flex-wrap:wrap;margin-bottom:var(--sp-7)}
    .hub-work-head h2{font-family:var(--font-display);font-size:var(--text-h2);font-weight:var(--weight-light);line-height:var(--leading-snug);color:var(--color-white);margin-top:var(--sp-3)}
    .hub-work-head p{color:var(--color-text-dim);max-width:44ch;margin:0}
    .hub-work-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--sp-5)}
    .hub-work-grid .project-card-overlay{opacity:1}
    .projects-link{display:inline-flex;align-items:center;gap:var(--sp-3);font-family:var(--font-mono);font-size:var(--text-label);letter-spacing:var(--tracking-wide);text-transform:uppercase;color:var(--color-gold);text-decoration:none;margin-top:var(--sp-6)}
    .hub-jump{display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-top:var(--sp-4)}
    @media(max-width:960px){.hub-head,.hub-topics{grid-template-columns:1fr}.hub-head{gap:var(--sp-5)}.hub-band img{aspect-ratio:4/3}.hub-cost-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hub-work-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.hub-cost-grid,.hub-work-grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
${gtmBody()}
${nav()}

  <main>
    <section class="sa-hero" aria-label="Kitchen and bathroom remodeling in ${attr(town.displayName)}, PA">
      <div class="sa-hero-image" style="background-image:url('${attr(town.heroImage)}');"></div>
      <div class="sa-hero-overlay"></div>
      <div class="sa-hero-inner">
        <div class="sa-hero-content">
          <nav class="sa-hero-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a><span class="sa-hero-breadcrumb-sep" aria-hidden="true">›</span>
            <a href="/service-areas/">Service Areas</a><span class="sa-hero-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">${esc(town.displayName)}, PA</span>
          </nav>
          <p class="sa-hero-eyebrow">${esc(town.regionEyebrow)}</p>
          <div class="headline-reveal"><span class="line-wrap"><span class="line-inner">
            <h1 class="sa-hero-h1">Kitchen &amp; Bathroom Remodeling in ${esc(town.displayName)}, PA</h1>
          </span></span></div>
          <div class="sa-hero-divider"></div>
          <p class="sa-hero-towns">${esc(town.heroTowns)}</p>
          <div class="sa-hero-actions">
            <a href="#get-estimate" class="phil-btn phil-btn-fill"><div class="phil-fill"></div><span class="phil-label">Inquiry Form</span></a>
          </div>
        </div>
      </div>
      <div class="sa-hero-stats">
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">13+</span><span class="sa-hero-stat-label">Years Local</span></div>
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">5.0★</span><span class="sa-hero-stat-label">180+ Reviews</span></div>
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">60+</span><span class="sa-hero-stat-label">Supplier Partners</span></div>
        <div class="sa-hero-stat"><span class="sa-hero-stat-num">Free</span><span class="sa-hero-stat-label">Consultation</span></div>
      </div>
    </section>

    <section class="sa-intro-section" aria-label="Introduction">
      <div class="container">
        <div class="sa-intro-grid">
          <div class="reveal">
            <p class="sa-intro-label">Kitchens &amp; Bathrooms · ${esc(town.displayName)}, PA</p>
            <div class="headline-reveal"><span class="line-wrap"><span class="line-inner">
              <h2 class="sa-intro-h2">${esc(k.introH2)}</h2>
            </span></span></div>
            <p class="st-answer">B&amp;B Associates Creations designs and builds kitchens and bathrooms in ${esc(town.displayName)}, ${esc(town.distancePhrase)}. Most of our kitchens run ${esc(PRICING.kitchenSummary)} and most bathrooms ${esc(PRICING.bathroomSummary)}, depending on size and finishes. One team handles design, permits with ${esc(town.permitAuthority)}, and construction, with an itemized estimate before you sign.</p>
            <div class="hub-jump">
              <a href="#kitchens" class="phil-btn phil-btn-fill phil-btn-fill-dark"><div class="phil-fill"></div><span class="phil-label">Kitchens in ${esc(town.displayName)}</span></a>
              <a href="#bathrooms" class="phil-btn phil-btn-fill phil-btn-fill-dark"><div class="phil-fill"></div><span class="phil-label">Bathrooms in ${esc(town.displayName)}</span></a>
            </div>
          </div>
          <div class="sa-intro-visual reveal">
            <div class="sa-intro-img-wrap">
              <img src="${attr(town.introImage)}" alt="Kitchen remodel by B&amp;B Associates Creations near ${attr(town.displayName)}, PA" loading="lazy" width="900" height="1200">
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="hub-sec" id="kitchens" aria-label="Kitchen remodeling in ${attr(town.displayName)}">
      <div class="container">
        <div class="hub-head reveal">
          <div>
            <p class="section-label">Kitchens &middot; ${esc(town.displayName)}</p>
            <h2>Kitchen Remodeling<br>in ${esc(town.displayName)}, PA</h2>
          </div>
          <p class="hub-lede">${esc(noPrices(k.answerFirst))}</p>
        </div>
        ${feature(featureK, 'kitchen')}
        <div class="hub-topics">
${sect(k)}
        </div>
        <a href="/services/kitchen-remodeling/" class="projects-link">How we remodel kitchens &rarr;</a>
      </div>
    </section>

    <section class="hub-sec alt" id="bathrooms" aria-label="Bathroom remodeling in ${attr(town.displayName)}">
      <div class="container">
        <div class="hub-head reveal">
          <div>
            <p class="section-label">Bathrooms &middot; ${esc(town.displayName)}</p>
            <h2>Bathroom Remodeling<br>in ${esc(town.displayName)}, PA</h2>
          </div>
          <p class="hub-lede">${esc(noPrices(b.answerFirst))}</p>
        </div>
        ${feature(featureB, 'bathroom')}
        <div class="hub-topics">
${sect(b)}
        </div>
        <a href="/services/bathroom-remodeling/" class="projects-link">How we remodel bathrooms &rarr;</a>
      </div>
    </section>

    <section class="hub-cost" aria-label="Kitchen and bathroom remodeling cost in ${attr(town.displayName)}">
      <div class="container">
        <p class="section-label">Investment Guide</p>
        <h2>What Kitchens and Bathrooms Cost in ${esc(town.displayName)}</h2>
        <p class="hub-note">${esc(PRICING.note)}</p>
        <h3>Kitchens</h3>
        <div class="hub-cost-grid">
${tier(PRICING.kitchen)}
        </div>
        <h3>Bathrooms</h3>
        <div class="hub-cost-grid">
${tier(PRICING.bathroom)}
        </div>
        <div class="hub-links">
          <a href="/kitchen-remodel-cost/" class="projects-link">Kitchen cost guide &rarr;</a>
          <a href="/bathroom-remodel-cost/" class="projects-link">Bathroom cost guide &rarr;</a>
        </div>
      </div>
    </section>

    <section class="hub-work" aria-label="Projects near ${attr(town.displayName)}">
      <div class="container">
        <div class="hub-work-head">
          <div>
            <p class="section-label">Our Work</p>
            <h2>${localCount ? `Projects In and Near ${esc(town.displayName)}` : `Projects Near ${esc(town.displayName)}`}</h2>
          </div>
          <p>Real B&amp;B Associates Creations projects, each labeled with the town it was built in.</p>
        </div>
        <div class="hub-work-grid">
${projectsHtml}
        </div>
        <a href="/portfolio/" class="projects-link">View the full portfolio &rarr;</a>
      </div>
    </section>
${articles.length ? `
    <section class="st-articles" aria-label="Related articles">
      <div class="container" style="text-align:center;">
        <p class="section-label" style="color:var(--color-gold);">From the Journal</p>
        <div class="st-links">
${articles.map(a => `          <a href="/blog/${attr(a.id)}/" class="btn btn-ghost">Read: ${esc(a.title)} →</a>`).join('\n')}
        </div>
      </div>
    </section>` : ''}

    <section class="section" style="background:#FAF8F6;padding:var(--section-padding-y) 0;" aria-label="Client reviews">
      <div class="container">
        <p class="section-label" style="display:block;text-align:center;margin-bottom:var(--sp-7);color:var(--color-gold);">From Our Neighbors</p>
        <div data-bb-reviews data-initial="4" data-step="4"></div>
      </div>
    </section>

    <section class="town-faq">
      <div class="container">
        <p class="section-label" style="color:var(--color-gold);">Questions</p>
        <h2 class="town-faq-h2">Kitchen and Bathroom Questions from ${esc(town.displayName)} Homeowners</h2>
        <div>
${faqs.map(f => `          <div class="town-faq-item">
            <button class="town-faq-question" aria-expanded="false">${esc(f.q)}<span class="town-faq-icon" aria-hidden="true"></span></button>
            <div class="town-faq-answer" role="region"><div class="town-faq-answer-inner">${esc(f.a)}</div></div>
          </div>`).join('\n')}
        </div>
      </div>
    </section>

    <section class="town-form-section" id="get-estimate">
      <div class="container">
        <div class="town-form-grid">
          <div>
            <p class="section-label">Start Here</p>
            <h2 class="town-form-h2">Tell Us About Your<br>${esc(town.displayName)} Project</h2>
            <p class="town-form-sub">Fill out the form and we'll be in touch within 5–15 minutes to discuss your project, answer questions, and schedule a free in-home consultation.</p>
          </div>
          <div class="town-form-wrap">
            <p class="town-form-title">Request Your Free Estimate</p>
            <div data-bb-inquiry data-source="${attr(town.displayName)} — Kitchen & Bathroom" data-type="service_town" data-source-label="Service Areas" data-service-area="${attr(town.displayName)} — Kitchen & Bathroom"></div>
          </div>
        </div>
      </div>
    </section>

    <section style="padding:var(--section-padding-y) 0;background:var(--color-bg);" aria-label="Nearby communities">
      <div class="container" style="max-width:1100px;margin:0 auto;padding:0 var(--sp-5);text-align:center;">
        <p class="eyebrow" style="margin-bottom:var(--sp-3);">Also Serving Nearby ${esc(town.county)} Communities</p>
        <h2 style="font-family:var(--font-display);font-size:clamp(1.6rem,3vw,2.2rem);font-weight:400;line-height:1.2;color:var(--color-text);margin-bottom:var(--sp-5);">Remodeling Near <em>${esc(town.displayName)}, PA</em></h2>
        <div class="st-links">
${[...neighbors, ...nearbyGen].map(l => '          ' + l).join('\n')}
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
  <script src="/js/town-reviews.js"></script>
  <script>
    document.querySelectorAll('.town-faq-question').forEach(function(btn){btn.addEventListener('click',function(){var item=this.closest('.town-faq-item');var isOpen=item.classList.contains('open');document.querySelectorAll('.town-faq-item.open').forEach(function(el){el.classList.remove('open');el.querySelector('.town-faq-question').setAttribute('aria-expanded','false')});if(!isOpen){item.classList.add('open');this.setAttribute('aria-expanded','true')}})});
  </script>
</body>
</html>
`;
}

function main() {
  const args = process.argv.slice(2);
  const towns = args.includes('--all') ? T.TOWNS.filter(t => t.consolidate) : args.map(s => townBySlug[s]).filter(Boolean);
  if (!towns.length) { console.error('Usage: node scripts/build-town-hubs.js <town-slug...> | --all'); process.exit(1); }
  for (const town of towns) {
    const dir = path.join(ROOT, town.generalPage.slice(1));
    fs.mkdirSync(dir, { recursive: true });
    const html = buildHub(town);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    console.log(`wrote ${town.generalPage} (${html.length} bytes)`);
  }
}
if (require.main === module) main();
module.exports = { buildHub };
