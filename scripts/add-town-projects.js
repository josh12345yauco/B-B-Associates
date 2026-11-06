#!/usr/bin/env node
/* Adds a "real projects near <Town>" strip to every service × town page
   (service-areas/{kitchen,bathroom}-remodeling/<town>-pa/index.html).

   Why: the 2026-09 design rollout dropped the generator's portfolio strip, so town pages
   linked to zero individual projects. That left them without local proof and left the
   static /portfolio/<id>/ pages with almost no internal links (GSC Nov 6: 32 portfolio
   pages + 5 town pages "Discovered – currently not indexed").

   Only real data from js/projects-data.js is used. Each card shows the project's true town;
   projects are ranked by straight-line distance from the page's town (same type only).
   Idempotent: replaces the block between the TOWN-PROJECTS markers on re-run.
   Usage: node scripts/add-town-projects.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(read('js/projects-data.js') + '\n;globalThis.__p = projects;', ctx);
const projects = ctx.__p;
const towns = JSON.parse(read('data/towns.json')).towns;

/* Coordinates for project towns that have no town page (used for sorting only, never shown). */
const EXTRA_GEO = {
  'Fort Washington': { lat: 40.1418, lng: -75.2091 },
  'Pipersville': { lat: 40.4237, lng: -75.1196 },
  'Lansdale': { lat: 40.2415, lng: -75.2838 },
  'Bala Cynwyd': { lat: 40.0076, lng: -75.2341 },
};
const geoByName = { ...EXTRA_GEO };
towns.forEach(t => { geoByName[t.displayName] = t.geo; });

function miles(a, b) {
  const R = 3958.8, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const firstSentence = s => {
  const m = String(s || '').match(/^(.{40,220}?[.!?])(\s|$)/);
  return m ? m[1] : String(s || '').slice(0, 180).replace(/\s+\S*$/, '') + '…';
};

const SERVICES = [
  { dir: 'kitchen-remodeling', type: 'Kitchen', noun: 'kitchen', plural: 'kitchens' },
  { dir: 'bathroom-remodeling', type: 'Bathroom', noun: 'bathroom', plural: 'bathrooms' },
];
const START = '<!-- TOWN-PROJECTS:START (scripts/add-town-projects.js) -->';
const END = '<!-- TOWN-PROJECTS:END -->';
const CSS = `
    /* town projects strip (scripts/add-town-projects.js) */
    .tp-section{padding:var(--section-padding-y) 0;background:var(--color-bg-2, #f4f1ec)}
    .tp-intro{max-width:720px;margin:0 auto;text-align:center}
    .tp-intro h2{font-family:var(--font-display);font-size:var(--text-h2);font-weight:400;line-height:var(--leading-tight);margin:var(--sp-2, 8px) 0 var(--sp-4, 16px)}
    .tp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-5, 24px);margin-top:var(--sp-6, 32px)}
    .tp-card{display:flex;flex-direction:column;text-decoration:none;color:inherit;border:1px solid var(--color-border-dim, rgba(0,0,0,.12));background:var(--color-bg, #fff);transition:border-color .2s}
    .tp-card:hover{border-color:var(--color-gold, #b17500)}
    .tp-card img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
    .tp-meta{font-family:var(--font-sans);font-size:var(--text-label, 12px);letter-spacing:var(--tracking-wide, .08em);text-transform:uppercase;color:var(--color-gold, #b17500);padding:var(--sp-4, 16px) var(--sp-4, 16px) 0;margin:0}
    .tp-title{font-family:var(--font-display);font-size:var(--text-h4, 22px);font-weight:400;line-height:1.2;padding:var(--sp-2, 8px) var(--sp-4, 16px) 0;margin:0}
    .tp-desc{font-size:15px;line-height:1.55;color:var(--color-text-dim, #555);padding:var(--sp-2, 8px) var(--sp-4, 16px) var(--sp-4, 16px);margin:0}
    .tp-more{text-align:center;margin-top:var(--sp-6, 32px)}
    @media (max-width:900px){.tp-grid{grid-template-columns:1fr}}
`;

let changed = 0;
for (const town of towns) {
  for (const svc of SERVICES) {
    const file = path.join(ROOT, 'service-areas', svc.dir, `${town.urlSlug}`, 'index.html');
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');

    const ranked = projects
      .filter(p => p.type === svc.type && geoByName[p.town] && fs.existsSync(path.join(ROOT, 'portfolio', p.id, 'index.html')))
      .map(p => ({ p, d: p.town === town.displayName ? 0 : miles(town.geo, geoByName[p.town]) }))
      .sort((a, b) => a.d - b.d || (b.p.year || 0) - (a.p.year || 0))
      .slice(0, 3);
    const inTown = ranked.filter(r => r.d === 0).length;

    const h2 = inTown
      ? `Real ${svc.plural} we've built in and around ${town.displayName}`
      : `The closest B&amp;B ${svc.plural} to ${town.displayName}`;
    const lead = inTown
      ? `${inTown === ranked.length ? 'Every' : `${inTown} of the`} project${ranked.length > 1 ? 's' : ''} below ${inTown === ranked.length ? 'is' : 'are'} a finished B&amp;B ${svc.noun} in ${town.displayName}${inTown === ranked.length ? '' : '; the rest are our nearest jobs'}. Each one has its own page with photos, scope and materials.`
      : `We haven't published a ${svc.noun} from ${town.displayName} itself yet, so these are our nearest finished projects, with the real town and distance on each. Each one has its own page with photos, scope and materials.`;

    const cards = ranked.map(({ p, d }) => {
      const where = d === 0 ? `${esc(p.town)}` : `${esc(p.town)} · about ${Math.max(1, Math.round(d))} mi away`;
      const meta = [where, p.year, p.style].filter(Boolean).join(' · ');
      const alt = `${p.style ? p.style + ' ' : ''}${svc.noun} remodel in ${p.town} by B&B Associates Creations`;
      return `          <a href="/portfolio/${esc(p.id)}/" class="tp-card">
            <img src="${esc(p.thumbnail)}" alt="${esc(alt)}" loading="lazy" decoding="async" width="800" height="600">
            <p class="tp-meta">${meta}</p>
            <h3 class="tp-title">${esc(p.title)}</h3>
            <p class="tp-desc">${esc(firstSentence(p.description))}</p>
          </a>`;
    }).join('\n');

    const block = `${START}
    <section class="tp-section" aria-label="${svc.type} projects near ${esc(town.displayName)}">
      <div class="container">
        <div class="tp-intro">
          <p class="section-label" style="color:var(--color-gold);">Our Work Near ${esc(town.displayName)}</p>
          <h2>${h2}</h2>
          <p>${lead}</p>
        </div>
        <div class="tp-grid">
${cards}
        </div>
        <p class="tp-more"><a href="/portfolio/?filter=${svc.noun}" class="btn btn-ghost">See all ${svc.plural} in our portfolio →</a></p>
      </div>
    </section>
    ${END}`;

    const before = html;
    if (html.includes(START)) {
      html = html.replace(new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END), block);
    } else {
      const anchor = '<section class="st-articles"';
      const alt = '<!-- REVIEWS';
      const at = html.includes(anchor) ? anchor : alt;
      if (!html.includes(at)) { console.warn('no anchor in', file); continue; }
      html = html.replace(at, block + '\n\n    ' + at);
    }
    if (!html.includes('.tp-section{')) html = html.replace('</style>', CSS + '  </style>');
    if (html !== before) { fs.writeFileSync(file, html); changed++; }
    console.log(`${svc.dir.padEnd(20)} ${town.urlSlug.padEnd(18)} in-town=${inTown} -> ${ranked.map(r => r.p.id + '@' + Math.round(r.d)).join(', ')}`);
  }
}
console.log(`\n${changed} pages updated`);
