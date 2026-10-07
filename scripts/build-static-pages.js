#!/usr/bin/env node
/**
 * Pre-renders every journal article and portfolio project into its own static page,
 * so Google receives the real title, description, canonical, schema and content in
 * the HTML instead of a JS shell.
 *
 *   blog/articles-data.js  ->  /blog/<id>/index.html        (template: blog/article/index.html)
 *   js/projects-data.js    ->  /portfolio/<id>/index.html   (template: portfolio/project/index.html)
 *
 * Also pre-renders the article list on /blog/ and the project grid on /portfolio/
 * (the existing scripts still re-render them for filtering), and rewrites the
 * article/project entries in sitemap.xml.
 *
 * Re-run after editing either data file:  node scripts/build-static-pages.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.bbassociatesco.com';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };

function load(file, names) {
  const ctx = { window: {}, document: undefined, console };
  vm.createContext(ctx);
  vm.runInContext(read(file) + `\n;Object.assign(this, {${names.join(',')}});`, ctx);
  return ctx;
}
const { ARTICLES } = load('blog/articles-data.js', ['ARTICLES']);
const { projects } = load('js/projects-data.js', ['projects']);
const BB = load('js/business-config.js', []).window.BB_BUSINESS || {};

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const abs = u => !u ? '' : /^https?:/.test(u) ? u : SITE + encodeURI(u);
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
/** First candidate that fits in a search-result title (~65 chars), else the shortest. */
const fitTitle = (...c) => c.find(t => t && t.length <= 65) || c.filter(Boolean).sort((a, b) => a.length - b.length)[0];

const PUBLISHER = {
  '@type': 'HomeAndConstructionBusiness',
  '@id': `${SITE}/#business`,
  name: BB.businessName || 'B&B Associates Creations',
  legalName: BB.legalName || 'B&B Associates Creations LLC',
  url: BB.website || `${SITE}/`,
  telephone: BB.phoneE164 || '+1-267-402-8758',
  address: {
    '@type': 'PostalAddress',
    streetAddress: BB.streetAddress || '1141 E Welsh Rd',
    addressLocality: BB.city || 'Maple Glen',
    addressRegion: BB.state || 'PA',
    postalCode: BB.zip || '19002',
    addressCountry: 'US'
  },
  logo: { '@type': 'ImageObject', url: BB.logo || `${SITE}/IMAGES/bb-logo-tagline-navy.png` }
};

const breadcrumb = items => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url }))
});

/** Swap the head tags of a template for page-specific ones. */
function setHead(html, { title, description, canonical, image, ogType, schemas }) {
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:site_name" content="B&amp;B Associates Creations">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${esc(abs(image))}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(abs(image))}">`,
    ...schemas.map(s => `<script type="application/ld+json">${json(s)}</script>`)
  ].join('\n  ');
  // remove the template's placeholder tags
  html = html
    .replace(/\s*<!-- Title and meta set dynamically by JS -->/, '')
    .replace(/\s*<title>[^<]*<\/title>/, '')
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace(/\s*<link id="canonical"[^>]*>/, '')
    .replace(/\s*<meta property="og:type"[^>]*>/, '')
    .replace(/\s*<meta id="og-[a-z]+"[^>]*>/g, '')
    .replace(/\s*<!-- Dynamic Schema set by JS -->/, '')
    .replace(/\s*<script id="(article|project)-schema" type="application\/ld\+json">\{\}<\/script>/, '');
  return html.replace(/(<meta name="viewport"[^>]*>)/, m => `${m}\n  ${head}`);
}

// ─────────────────────────── ARTICLES ───────────────────────────
const articleTpl = read('blog/article/index.html');

function relatedFor(a) {
  const related = ARTICLES.filter(x => x.id !== a.id && x.tags.some(t => a.tags.includes(t))).slice(0, 3);
  return related.length >= 2 ? related : ARTICLES.filter(x => x.id !== a.id).slice(0, 3);
}

function renderArticle(article) {
  const relatedArticles = relatedFor(article);
  const tagsHtml = article.tags.map(tag => `<a href="/blog/?filter=${tag}" class="article-tag">${tag}</a>`).join('');
  const faqHtml = (article.faq && article.faq.length) ? `
        <h2>Frequently Asked Questions</h2>
        ${article.faq.map(f => `<h3>${f.q}</h3><p>${f.a}</p>`).join('')}` : '';
  const relatedHtml = relatedArticles.map(r => `
        <a href="/blog/${r.id}/" class="sidebar-related-card">
          <div class="sidebar-related-img">
            <img src="${esc(r.heroImage)}" alt="${esc(r.title)}" loading="lazy">
          </div>
          <p class="sidebar-related-cat">${r.category}</p>
          <p class="sidebar-related-title">${r.title}</p>
        </a>`).join('');

  return `
        <!-- HERO -->
        <section class="article-hero" aria-label="Article hero image">
          <div class="article-hero-img">
            <img src="${esc(article.heroImage)}" alt="${esc(article.title)} — B&amp;B Associates Creations" fetchpriority="high">
          </div>
          <div class="article-hero-overlay"></div>
          <div class="article-hero-content">
            <a href="/blog/" class="article-hero-back">Back to Journal</a>
            <p class="article-hero-category">${article.category}</p>
            <h1 class="article-hero-title">${article.title}</h1>
            <div class="article-hero-meta">
              ${article.date ? `<span class="article-hero-meta-item">${article.date}</span>
              <span class="article-hero-meta-sep">·</span>` : ''}
              <span class="article-hero-meta-item">${article.readTime}</span>
            </div>
          </div>
        </section>

        <!-- ARTICLE BODY -->
        <section class="article-section">
          <div class="article-layout">
            <article>
              <nav class="article-breadcrumb" aria-label="Breadcrumb" style="font-size:13px;margin-bottom:var(--sp-6);">
                <a href="/">Home</a> › <a href="/blog/">Journal</a> › <span>${article.title}</span>
              </nav>
              <div class="article-body">
                ${article.body}
                ${faqHtml}
              </div>
              <div class="article-tags">
                ${tagsHtml}
              </div>
            </article>

            <aside class="article-sidebar" aria-label="Article sidebar">
              <div class="sidebar-section sidebar-cta-box">
                <p class="sidebar-cta-eyebrow">Ready to Start?</p>
                <p class="sidebar-cta-title">Free consultation. No obligation. Just possibilities.</p>
                <a href="/consultation/" class="phil-btn phil-btn-fill">
                  <span class="phil-fill"></span>
                  <span class="phil-label">Schedule a Free Consultation</span>
                </a>
              </div>
              ${relatedArticles.length > 0 ? `
              <div class="sidebar-section" style="margin-top:var(--sp-8);">
                <p class="sidebar-title">Related Articles</p>
                <div style="display:flex;flex-direction:column;gap:var(--sp-6);">
                  ${relatedHtml}
                </div>
              </div>` : ''}
              <div class="sidebar-section" style="margin-top:var(--sp-8);">
                <p class="sidebar-title">Our Services</p>
                <div class="sidebar-cats">
                  <a href="/services/kitchen-remodeling/" class="sidebar-cat">Kitchen Remodeling</a>
                  <a href="/services/bathroom-remodeling/" class="sidebar-cat">Bathroom Remodeling</a>
                  <a href="/kitchen-remodel-cost/" class="sidebar-cat">Kitchen Cost Guide</a>
                  <a href="/bathroom-remodel-cost/" class="sidebar-cat">Bathroom Cost Guide</a>
                  <a href="/portfolio/" class="sidebar-cat">Our Portfolio</a>
                </div>
              </div>
              <div class="sidebar-section" style="margin-top:var(--sp-8);">
                <p class="sidebar-title">Browse by Category</p>
                <div class="sidebar-cats">
                  <a href="/blog/?filter=kitchen" class="sidebar-cat">Kitchen</a>
                  <a href="/blog/?filter=bathroom" class="sidebar-cat">Bathroom</a>
                  <a href="/blog/?filter=design" class="sidebar-cat">Design</a>
                  <a href="/blog/?filter=cost" class="sidebar-cat">Cost Guides</a>
                  <a href="/blog/?filter=mainline" class="sidebar-cat">Main Line</a>
                  <a href="/blog/?filter=bucks" class="sidebar-cat">Bucks County</a>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <!-- CTA PANEL -->
        <section class="cta-panel corner-ticks-white" aria-labelledby="cta-heading">
          <p class="section-label">Start Your Project</p>
          <h2 id="cta-heading" class="cta-panel-title headline-reveal">
            <span class="line-wrap"><span class="line-inner">Ready to Stop Reading</span></span>
            <span class="line-wrap"><span class="line-inner">and Start Building?</span></span>
          </h2>
          <p class="cta-panel-body">The consultation is free. We'll visit your home, understand your vision, and show you what's possible.</p>
          <div class="cta-panel-actions">
            <a href="/consultation/" class="phil-btn phil-btn-fill">
              <span class="phil-fill"></span>
              <span class="phil-label">Schedule Free Consultation</span>
            </a>
            <p class="cta-panel-secondary">Or call: <a href="tel:+12674028758">267-402-8758</a></p>
          </div>
        </section>`;
}

const ARTICLE_SCRIPT = /\s*<script src="\.\.\/articles-data\.js"><\/script>\s*<script>[\s\S]*?READ ARTICLE ID FROM URL[\s\S]*?<\/script>/;
if (!ARTICLE_SCRIPT.test(articleTpl)) throw new Error('article template script block not found');

for (const a of ARTICLES) {
  const url = `${SITE}/blog/${a.id}/`;
  const description = a.metaDescription || a.excerpt;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description,
    image: abs(a.heroImage),
    mainEntityOfPage: url,
    author: { '@type': 'Organization', '@id': `${SITE}/#business`, name: PUBLISHER.name, url: `${SITE}/` },
    publisher: PUBLISHER
  };
  if (a.datePublished || a.date) {
    articleSchema.datePublished = a.datePublished || a.date;
    articleSchema.dateModified = a.dateModified || a.datePublished || a.date;
  }
  const schemas = [articleSchema, breadcrumb([['Home', `${SITE}/`], ['Journal', `${SITE}/blog/`], [a.title, url]])];
  if (a.faq && a.faq.length) schemas.push({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: a.faq.map(f => ({ '@type': 'Question', name: text(f.q), acceptedAnswer: { '@type': 'Answer', text: text(f.a) } }))
  });

  let html = setHead(articleTpl, {
    title: fitTitle(a.metaTitle, `${a.title} | B&B Associates Creations`, a.title),
    description, canonical: url, image: a.heroImage, ogType: 'article', schemas
  });
  html = html.replace(/<main id="article-content">[\s\S]*?<\/main>/, () => `<main id="article-content">${renderArticle(a)}\n  </main>`);
  html = html.replace(ARTICLE_SCRIPT, () => '');
  write(`blog/${a.id}/index.html`, html);
}

// /blog/ index: pre-render the featured post and grid (the page script still re-renders for filters)
{
  let html = read('blog/index.html');
  const f = ARTICLES[0];
  const tagsLabel = f.tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' · ');
  const featured = `<article class="featured-post reveal"><a href="/blog/${f.id}/" class="featured-post-img"><img src="${esc(f.heroImage)}" alt="${esc(f.title)} by B&amp;B Associates Creations" loading="lazy"></a><div class="featured-post-content"><p class="featured-label">${f.category} · ${tagsLabel}</p><h3 class="featured-post-title"><a href="/blog/${f.id}/">${f.title}</a></h3><p class="featured-post-excerpt">${f.excerpt}</p><div class="post-meta"><span class="post-read-time">${f.readTime}</span>${f.date ? `<span class="post-read-time">·</span><span class="post-read-time">${f.date}</span>` : ''}<a href="/blog/${f.id}/" class="post-read-link">Read Article →</a></div></div></article>`;
  const grid = ARTICLES.slice(1).map(a => `<a href="/blog/${a.id}/" class="post-card"><div class="post-card-img"><img src="${esc(a.heroImage)}" alt="${esc(a.title)}" loading="lazy"></div><div class="post-card-body"><p class="post-card-category">${a.category}</p><h3 class="post-card-title">${a.title}</h3><p class="post-card-excerpt">${a.excerpt}</p><span class="post-card-date">${(a.date ? a.date + ' · ' : '') + a.readTime}</span></div></a>`).join('');
  html = html.replace(/<div id="featured-post-container">[\s\S]*?<\/div><!--\/featured-->|<div id="featured-post-container"><\/div>/, () => `<div id="featured-post-container">${featured}</div><!--/featured-->`);
  html = html.replace(/<div class="post-grid reveal-group" id="post-grid">[\s\S]*?<\/div><!--\/post-grid-->|<div class="post-grid reveal-group" id="post-grid"><\/div>/, () => `<div class="post-grid reveal-group" id="post-grid">${grid}</div><!--/post-grid-->`);
  write('blog/index.html', html);
}

// ─────────────────────────── PROJECTS ───────────────────────────
const projectTpl = read('portfolio/project/index.html');
const PROJECT_SCRIPT = /\s*<script src="\/js\/projects-data\.js"><\/script>\s*<script>[\s\S]*?READ PROJECT ID FROM URL[\s\S]*?<\/script>/;
if (!PROJECT_SCRIPT.test(projectTpl)) throw new Error('project template script block not found');

function renderProject(project) {
  const related = projects.filter(p => p.id !== project.id && p.type === project.type).slice(0, 3);
  const sentences = project.description.split('. ');
  const descHtml = sentences.reduce((acc, sent, i) => {
    if (i % 3 === 0) acc += '<p>';
    acc += sent + '. ';
    if ((i + 1) % 3 === 0 || i === sentences.length - 1) acc += '</p>';
    return acc;
  }, '');
  const alt = `${project.style} ${project.type.toLowerCase()} remodel in ${project.town} by B&amp;B Associates Creations`;
  return `
        <section class="project-hero" aria-label="Project hero image">
          <div class="project-hero-img">
            <img src="${esc(project.images[0])}" alt="${alt}" fetchpriority="high">
          </div>
          <div class="project-hero-overlay"></div>
        </section>

        <section class="project-info-section">
        <div class="project-info-header" style="max-width: var(--grid-max); margin: 0 auto; padding: var(--sp-9) var(--grid-padding) 0;">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="/portfolio/">Portfolio</a>
            <span class="breadcrumb-sep">›</span>
            <span>${project.title}</span>
          </nav>
          <h1 class="project-info-title">${project.title}</h1>
          <div class="project-info-badges">
            <span class="project-type-badge">${project.town}</span>
            <span class="project-type-badge">${project.type}</span>
            <span class="project-type-badge">${project.style}</span>
          </div>
        </div>
        <p class="section-label" style="padding: var(--sp-6) var(--grid-padding) 0; max-width: var(--grid-max); margin: 0 auto;">Project Details</p>
        <div class="project-overview reveal">
          <aside class="project-meta-list" aria-label="Project details">
            <div class="project-meta-item"><p class="project-meta-label">Location</p><p class="project-meta-value">${project.town}${project.county ? `, ${project.county}` : ''}</p></div>
            <div class="project-meta-item"><p class="project-meta-label">Project Type</p><p class="project-meta-value">${project.type}</p></div>
            <div class="project-meta-item"><p class="project-meta-label">Design Style</p><p class="project-meta-value">${project.style}</p></div>
            ${project.duration ? `<div class="project-meta-item"><p class="project-meta-label">Duration</p><p class="project-meta-value">${project.duration}</p></div>` : ''}
          </aside>
          <div class="project-description">
            ${descHtml}
            <p>See more of our <a href="/services/${project.type === 'Bathroom' ? 'bathroom' : 'kitchen'}-remodeling/">${project.type.toLowerCase()} remodeling</a> work, or browse the <a href="/portfolio/">full portfolio</a>.</p>
          </div>
        </div>
        </section>

        <section class="project-gallery" aria-labelledby="gallery-heading">
          <p class="section-label">Project Gallery</p>
          <h2 id="gallery-heading" class="headline-reveal" style="font-family:var(--font-display);font-size:var(--text-h2);color:var(--color-white);font-weight:var(--weight-light);padding:0 var(--grid-padding);"><span class="line-wrap"><span class="line-inner">The Full Picture</span></span></h2>
          <div class="gallery-grid">
            ${project.video ? `
              <div class="gallery-item reveal" id="project-video-wrap">
                <video autoplay muted loop playsinline onerror="document.getElementById('project-video-wrap').style.display='none'">
                  <source src="${esc(project.video)}" type="${project.video.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'}">
                </video>
              </div>` : ''}
            ${project.images.map((img, i) => `
              <div class="gallery-item reveal">
                <img src="${esc(img)}" alt="${project.style} ${project.type.toLowerCase()} remodel in ${project.town} by B&amp;B Associates Creations — photo ${i + 1}" loading="lazy" data-lightbox="${esc(img)}" style="cursor:zoom-in;">
              </div>`).join('')}
          </div>
        </section>

        <section class="project-highlights" aria-labelledby="highlights-heading">
          <div class="project-highlights-inner">
            <p class="section-label">What Made It Special</p>
            <h2 id="highlights-heading" class="headline-reveal" style="font-family:var(--font-display);font-size:var(--text-h2);color:var(--color-white);font-weight:var(--weight-light);margin-bottom:0;"><span class="line-wrap"><span class="line-inner">The Defining Details</span></span></h2>
            <div class="project-highlights-grid reveal-group">
              ${project.highlights.map(h => `
                <div class="highlight-card"><div class="highlight-icon">✦</div><span class="highlight-text">${h}</span></div>`).join('')}
            </div>
          </div>
        </section>

        ${project.review && project.review.text ? `
        <section class="project-review-panel" aria-labelledby="review-heading">
          <div class="review-quote-mark" aria-hidden="true">"</div>
          <h2 id="review-heading" class="sr-only">Client Review</h2>
          <div class="stars" style="justify-content:center;margin-bottom:var(--sp-5);">★★★★★</div>
          <blockquote class="review-quote-text reveal">"${project.review.text}"</blockquote>
          <footer class="review-attribution">
            <cite class="review-author">${project.review.author}</cite>
            <span class="review-town">${project.review.town || ''}</span>
            <span class="review-source">${project.review.source || ''}</span>
          </footer>
          <p class="review-read-all"><a href="/reviews/">Read all 180+ reviews from B&amp;B clients →</a></p>
        </section>` : ''}

        ${related.length > 0 ? `
        <section class="related-projects" aria-labelledby="related-heading">
          <div class="related-projects-inner">
            <p class="section-label">More ${project.type} Projects</p>
            <h2 id="related-heading" class="headline-reveal" style="font-family:var(--font-display);font-size:var(--text-h2);color:var(--color-white);font-weight:var(--weight-light);margin-bottom:0;"><span class="line-wrap"><span class="line-inner">You Might Also Like</span></span></h2>
            <div class="related-grid reveal-group">
              ${related.map(r => `
                <a href="/portfolio/${r.id}/" class="project-card" style="display:block;" aria-label="${esc(r.title)} — ${esc(r.town)}">
                  <img src="${esc(r.thumbnail)}" alt="${r.style} ${r.type.toLowerCase()} in ${r.town} by B&amp;B Associates Creations" loading="lazy">
                  <div class="project-card-overlay">
                    <p class="project-card-meta">${r.town} · ${r.year}</p>
                    <h3 class="project-card-title">${r.title}</h3>
                    <span class="project-card-cta">View Project →</span>
                  </div>
                </a>`).join('')}
            </div>
          </div>
        </section>` : ''}

        <section class="cta-panel corner-ticks-white" aria-labelledby="cta-heading">
          <p class="section-label reveal">Start Your Project</p>
          <h2 id="cta-heading" class="cta-panel-title headline-reveal"><span class="line-wrap"><span class="line-inner">Inspired by This Project?</span></span> <span class="line-wrap"><span class="line-inner">Let's Talk About Yours.</span></span></h2>
          <p class="cta-panel-body reveal">The consultation is free. We'll visit your home, understand your vision, and design something just as special.</p>
          <div class="cta-panel-actions reveal">
            <a href="/contact/" class="phil-btn phil-btn-fill"><span class="phil-fill"></span><span class="phil-label">Get Your Free Estimate</span></a>
            <p class="cta-panel-secondary">Or call: <a href="tel:+12674028758">267-402-8758</a></p>
          </div>
        </section>`;
}

for (const p of projects) {
  const url = `${SITE}/portfolio/${p.id}/`;
  const title = fitTitle(`${p.title} in ${p.town}, PA | B&B Associates Creations`, `${p.title} | ${p.town}, PA`, p.title);
  const description = text(`${p.style} ${p.type.toLowerCase()} remodel in ${p.town}, PA by B&B Associates Creations. ${p.highlights.slice(0, 2).join('. ')}.`).slice(0, 160);
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: p.title,
      description: text(p.description),
      url,
      image: p.images.map(abs),
      creator: { '@id': `${SITE}/#business` },
      locationCreated: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: p.town, addressRegion: 'PA', addressCountry: 'US' } },
      ...(p.year ? { dateCreated: String(p.year) } : {})
    },
    breadcrumb([['Home', `${SITE}/`], ['Portfolio', `${SITE}/portfolio/`], [p.title, url]])
  ];
  let html = setHead(projectTpl, { title, description, canonical: url, image: p.images[0], ogType: 'website', schemas });
  html = html.replace(/<main id="project-content">[\s\S]*?<\/main>/, () => `<main id="project-content">${renderProject(p)}\n  </main>`);
  html = html.replace(PROJECT_SCRIPT, () => '');
  write(`portfolio/${p.id}/index.html`, html);
}

// /portfolio/ index: pre-render crawlable cards (the page script re-renders with filters/ordering)
{
  let html = read('portfolio/index.html');
  const cards = projects.map(p => `<a href="/portfolio/${p.id}/" class="portfolio-card" aria-label="${esc(p.title)} — ${p.type} remodel by B&amp;B Associates Creations"><img src="${esc(p.thumbnail)}" alt="${p.style} ${p.type.toLowerCase()} remodel in ${p.town} by B&amp;B Associates Creations" loading="lazy"><div class="portfolio-card-overlay"><p class="portfolio-card-meta">${p.town} · ${p.type}</p><h3 class="portfolio-card-title">${p.title}</h3></div></a>`).join('');
  html = html.replace(/(<div class="portfolio-grid reveal-group" id="portfolio-grid">)[\s\S]*?(<\/div><!--\/portfolio-grid-->)/, (m, a, b) => `${a}${cards}${b}`);
  if (!html.includes('<!--/portfolio-grid-->')) {
    html = html.replace(/(<div class="portfolio-grid reveal-group" id="portfolio-grid">)\s*<!-- Rendered by JS -->\s*<\/div>/, (m, a) => `${a}${cards}</div><!--/portfolio-grid-->`);
  }
  write('portfolio/index.html', html);
}

// ─────────────────────────── SITEMAP ───────────────────────────
{
  let sm = read('sitemap.xml');
  sm = sm.replace(/\s*<url>\s*<loc>[^<]*\/(blog\/article|portfolio\/project)[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
  sm = sm.replace(/\s*<url>\s*<loc>https:\/\/www\.bbassociatesco\.com\/(blog|portfolio)\/[a-z0-9-]+\/<\/loc>[\s\S]*?<\/url>/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    ...ARTICLES.map(a => `  <url>\n    <loc>${SITE}/blog/${a.id}/</loc>\n    <lastmod>${a.dateModified || a.datePublished || today}</lastmod>\n  </url>`),
    ...projects.map(p => `  <url>\n    <loc>${SITE}/portfolio/${p.id}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
  ].join('\n');
  sm = sm.replace(/\s*<\/urlset>/, () => `\n${entries}\n</urlset>`);
  write('sitemap.xml', sm);
}

console.log(`Built ${ARTICLES.length} article pages and ${projects.length} project pages.`);
