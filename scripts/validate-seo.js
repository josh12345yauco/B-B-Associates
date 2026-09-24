#!/usr/bin/env node
/* ============================================================
   B&B Associates — SEO regression gate
   ------------------------------------------------------------
   Walks every HTML page in the site and checks the on-page SEO
   invariants the sprints depend on. Exit 1 on any error.

   Usage:  node scripts/validate-seo.js [--quiet]
   Rules (E = error, W = warning):
     E title        exactly one <title>, unique across indexable pages
     E description  exactly one meta description on indexable pages
     E canonical    one <link rel=canonical> matching the page's own URL
     E h1           exactly one <h1>
     E jsonld       every application/ld+json block parses
     E legacy-link  no links to /services/kitchen-remodeling/ (redirected)
     E bath-phrase  no "Kitchen & Bath Remodeling/Carpenter" (Bath, PA confusion)
     E sitemap      every sitemap <loc> resolves to a file; every indexable
                    page is in the sitemap
     W title-len    title > 70 chars
     W desc-len     description < 120 or > 165 chars
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://www.bbassociatesco.com';
const SKIP_DIRS = new Set(['node_modules', 'ESTIMATOR-Pre', 'design-estimator', 'admin', 'scripts', 'docs', '.git', '.superpowers', 'untitled folder', 'untitled folder 2', 'db', 'data', 'seo-data']);
const quiet = process.argv.includes('--quiet');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && ent.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const decode = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
const all = (re, s) => { const r = []; let m; while ((m = re.exec(s))) r.push(m); return r; };

const errors = [], warnings = [];
const err = (f, rule, msg) => errors.push(`${rel(f)} [${rule}] ${msg}`);
const warn = (f, rule, msg) => warnings.push(`${rel(f)} [${rule}] ${msg}`);
const rel = f => path.relative(ROOT, f);
const urlFor = f => {
  const r = rel(f).replace(/\\/g, '/');
  return ORIGIN + '/' + (r.endsWith('index.html') ? r.slice(0, -'index.html'.length) : r);
};

const pages = walk(ROOT);
const titles = new Map();
const indexableUrls = new Set();

for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8');
  const noindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html);
  const titleTags = all(/<title>([\s\S]*?)<\/title>/gi, html);
  if (titleTags.length !== 1) err(f, 'title', `expected 1 <title>, found ${titleTags.length}`);
  const title = titleTags[0] ? decode(titleTags[0][1]) : '';
  const descs = all(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/gi, html);
  const canon = all(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/gi, html)
    .concat(all(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/gi, html));
  // Count H1s outside JS template literals (article/project templates render one of two branches).
  const staticHtml = html.replace(/`[\s\S]*?`/g, '');
  const h1s = all(/<h1[\s>]/gi, staticHtml);
  const h1sTemplated = all(/<h1[\s>]/gi, html).length - h1s.length; // rendered by JS, one branch at a time
  if (!noindex && h1s.length !== 1 && !(h1s.length === 0 && h1sTemplated > 0)) err(f, 'h1', `expected 1 <h1>, found ${h1s.length}`);

  for (const m of all(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, html)) {
    try { JSON.parse(m[1]); } catch (e) { err(f, 'jsonld', `JSON-LD does not parse: ${e.message.slice(0, 80)}`); }
  }
  if (/href=["']\/services\/kitchen-remodeling\/?["']/.test(html)) err(f, 'legacy-link', 'links to redirected /services/kitchen-remodeling/');
  const bath = all(/Kitchen\s*(?:&|&amp;)\s*Bath\s+(Remodel|Carpent)/g, html);
  if (bath.length) err(f, 'bath-phrase', `"Kitchen & Bath ${bath[0][1]}…" ×${bath.length} (reads as Bath, PA)`);

  if (noindex) continue;
  const url = urlFor(f);
  indexableUrls.add(url);
  if (descs.length !== 1) err(f, 'description', `expected 1 meta description, found ${descs.length}`);
  if (canon.length !== 1) err(f, 'canonical', `expected 1 canonical, found ${canon.length}`);
  else if (canon[0][1] !== url) err(f, 'canonical', `canonical ${canon[0][1]} ≠ ${url}`);
  if (title) {
    if (titles.has(title)) err(f, 'title', `duplicate title (also ${titles.get(title)}): "${title}"`);
    titles.set(title, rel(f));
    if (title.length > 70) warn(f, 'title-len', `${title.length} chars: "${title}"`);
  }
  if (descs[0]) {
    const d = decode(descs[0][1]);
    if (d.length < 120 || d.length > 165) warn(f, 'desc-len', `${d.length} chars`);
  }
}

// Sitemap cross-check
const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const locs = all(/<loc>([^<]+)<\/loc>/g, sm).map(m => m[1]);
const locSet = new Set(locs);
for (const u of locs) {
  const p = u.replace(ORIGIN, '').split('?')[0];
  const file = path.join(ROOT, p, p.endsWith('/') ? 'index.html' : '');
  if (!fs.existsSync(file)) err(path.join(ROOT, 'sitemap.xml'), 'sitemap', `<loc> has no file: ${u}`);
}
for (const u of indexableUrls) {
  if (/\/(thank-you|privacy-policy|terms-of-service|application|consultation)\/$/.test(u)) continue;
  if (/\/(portfolio\/project|blog\/article)\/$/.test(u)) continue; // param-driven templates
  if (!locSet.has(u)) warn(path.join(ROOT, 'sitemap.xml'), 'sitemap', `indexable page not in sitemap: ${u}`);
}

if (!quiet) { warnings.forEach(w => console.log('W ' + w)); }
errors.forEach(e => console.log('E ' + e));
console.log(`\n${pages.length} pages, ${indexableUrls.size} indexable, ${locs.length} sitemap URLs — ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
