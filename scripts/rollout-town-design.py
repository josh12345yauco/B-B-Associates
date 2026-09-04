#!/usr/bin/env python3
"""One-time rollout of the approved Ambler design to the other 21 service-area town pages.
Kept in the repo for reference; safe to re-run (each step checks for its own marker)."""
import re, glob, html, sys

KIT = {'Montgomery': '/portfolio/KITCHENS/B&amp;B - Beth Rubin-kitchen/153E1359-5284-48E5-9F68-B497880FF6F7.jpeg',
       'Bucks': '/portfolio/KITCHENS/BB-OLaughlin-kitchen/06BCD805-17A2-4A11-B4B7-6215BA68270F.jpeg',
       'Main Line': '/portfolio/KITCHENS/B&amp;B - Prager-kitchen/6D9E26B3-82C7-4C72-880A-373543ECEFDA.jpeg'}
BATH = {'Montgomery': '/portfolio/BATHROOMS/B&amp;B - Vartanian-bathroom/10E542CC-6F7C-45E4-B9E2-4ADC289B5031.jpeg',
        'Bucks': '/portfolio/BATHROOMS/B&amp;B - Guttridge -bathroom/IMG_6078.jpg',
        'Main Line': '/portfolio/BATHROOMS/B&amp;B - LaShannon Master bathroom/09DCC4C5-5F51-4A82-9C78-AB97A237A844.jpeg'}
DESIGN = '/portfolio/KITCHENS/B&amp;B - McBride Kitchen/03A7198B-DACB-43CA-87B1-1148DB3DEEC8.jpeg'
REGION = {'ambler': 'Montgomery', 'blue-bell': 'Montgomery', 'flourtown': 'Montgomery', 'fort-washington': 'Montgomery', 'horsham': 'Montgomery',
          'lansdale': 'Montgomery', 'lower-gwynedd': 'Montgomery', 'montgomery-county': 'Montgomery',
          'bucks-county': 'Bucks', 'buckingham': 'Bucks', 'chalfont': 'Bucks', 'doylestown': 'Bucks', 'newtown': 'Bucks', 'warminster': 'Bucks', 'warrington': 'Bucks', 'yardley': 'Bucks',
          'berwyn': 'Main Line', 'bryn-mawr': 'Main Line', 'gladwyne': 'Main Line', 'haverford': 'Main Line', 'main-line': 'Main Line', 'wayne': 'Main Line'}
# H1 second line for pages whose existing second line is not a place
PLACE = {'bucks-county': 'in Bucks County, PA', 'montgomery-county': 'in Montgomery County, PA', 'main-line-pa-remodeling': 'on the Philadelphia Main Line',
         'wayne-villanova-bathroom-remodeling': 'in Wayne &amp; Villanova, PA', 'doylestown-new-hope-kitchen-remodeling': 'in Doylestown &amp; New Hope, PA',
         'newtown-pa-kitchen-bathroom-remodeling': 'in Newtown, PA', 'blue-bell-north-wales-remodeling': 'in Blue Bell &amp; North Wales, PA'}
H1_TEXT = 'Kitchen &amp; Bathroom Remodeling &amp; Renovations'

CSS_COMMON = '''    /* ── Approved 2026-09 design rollout ── */
    .sa-intro-grid > .reveal:first-child { max-width: 560px; }
    .sa-intro-body { font-size: calc(var(--text-body) - 2px) !important; max-width: 520px; }
'''
CSS_A = '''    .sa-service-card.has-thumb { grid-template-columns: 150px 1fr !important; }
    .sa-service-thumb { grid-row: 1 / 4; grid-column: 1; width: 150px; aspect-ratio: 3 / 4; object-fit: cover; display: block; border: 1px solid var(--color-gold-border); border-radius: 2px; align-self: start; }
    @media (max-width: 760px) {
      .sa-service-card.has-thumb { display: block !important; padding: var(--sp-6) var(--sp-5) !important; }
      .sa-service-card.has-thumb > * { grid-column: auto !important; grid-row: auto !important; }
      .sa-service-thumb { width: 160px; margin: 0 0 var(--sp-4); }
      .sa-service-card.has-thumb .sa-service-title { margin-bottom: var(--sp-3); }
      .sa-service-card.has-thumb .sa-service-desc { margin-bottom: var(--sp-4); }
      .sa-lead-grid { grid-template-columns: 1fr !important; gap: var(--sp-6) !important; max-width: 100% !important; }
      .sa-lead-box { max-width: 100%; box-sizing: border-box; padding: var(--sp-5) var(--sp-4) !important; overflow: hidden; }
      .sa-lead-box iframe { width: 100% !important; max-width: 100% !important; }
      #get-estimate .container { padding-left: var(--sp-4); padding-right: var(--sp-4); }
    }
'''
CSS_B = '''    .town-service-thumb { width: 150px; aspect-ratio: 3 / 4; object-fit: cover; display: block; border: 1px solid var(--color-gold-border); border-radius: 2px; margin-bottom: var(--sp-4); }
    @media (max-width: 760px) { .town-service-thumb { width: 160px; } .town-form-wrap { max-width: 100%; box-sizing: border-box; overflow: hidden; } .town-form-wrap iframe { width: 100% !important; max-width: 100% !important; } }
'''
REVIEWS_SECTION = '''
    <!-- REVIEWS (shared block, 4 at a time) -->
    <section class="section" style="background:#FAF8F6;padding:var(--section-padding-y) 0;" aria-label="Client reviews">
      <div class="container">
        <p class="section-label" style="display:block;text-align:center;margin-bottom:var(--sp-7);color:var(--color-gold);">From Our Neighbors</p>
        <div data-bb-reviews data-initial="4" data-step="4"></div>
      </div>
    </section>
'''

def region_of(slug):
    for k, v in REGION.items():
        if slug.startswith(k): return v
    return 'Montgomery'

def town_from_h1(h1):
    m = re.search(r'<br>\s*(?:in|on the)\s+(.*)$', h1.strip(), re.S)
    t = html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip() if m else ''
    return re.sub(r',\s*PA$', '', t)

def rollout(path):
    slug = path.split('/')[1]
    h = open(path).read()
    is_a = '<!-- LEAD FORM -->' in h
    reg = region_of(slug)
    log = []
    if 'Approved 2026-09 design rollout' in h:
        return slug, ['already done']

    # 1. hero H1 size + overlay colour
    h = h.replace('clamp(20px, 2.2vw, 34px)', 'clamp(30px, 3.4vw, 42px)')
    n = h.count('rgba(11,27,63,'); h = h.replace('rgba(11,27,63,', 'rgba(26,28,35,'); log.append(f'overlay {n}')
    # 2. founding year consistency
    h = re.sub(r'\b25\+ [Yy]ears', lambda m: '13+ ' + m.group(0)[4:], h)
    h = re.sub(r'\b25 [Yy]ears', lambda m: '13 ' + m.group(0)[3:], h)
    h = h.replace('25-year', '13-year').replace('1999', '2013')
    h = h.replace('<span class="sa-hero-stat-num">25+</span>', '<span class="sa-hero-stat-num">13+</span>')
    # 3. H1 wording
    m = re.search(r'<h1 class="sa-hero-h1">(.*?)</h1>', h, re.S); assert m, 'h1'
    old_h1 = m.group(1)
    town = town_from_h1(old_h1)
    second = PLACE.get(slug)
    if not second:
        mm = re.search(r'<br>\s*((?:in|on the)\s+.*)$', old_h1.strip(), re.S)
        second = mm.group(1).strip() if mm else 'in ' + town + ', PA'
    h = h[:m.start(1)] + H1_TEXT + '<br>' + second + h[m.end(1):]
    if not town: town = html.unescape(re.sub(r'<[^>]+>', '', second)).replace('in ', '', 1).replace('on the ', '', 1).replace(', PA', '')
    # 4. hero: single Inquiry Form button → on-page form
    m = re.search(r'<div class="sa-hero-actions">(?:(?!sa-hero-stats).)*?</a>\s*</div>', h, re.S); assert m, 'hero actions'
    h = h[:m.start()] + '<div class="sa-hero-actions">\n            <a href="#get-estimate" class="phil-btn phil-btn-fill"><div class="phil-fill"></div><span class="phil-label">Inquiry Form</span></a>\n          </div>' + h[m.end():]
    # intro buttons → on-page form
    h = re.sub(r'<a href="/contact/"([^>]*)><div class="phil-fill"></div><span class="phil-label">(Schedule Consultation|Schedule Free Consultation|Free Consultation)</span></a>',
               r'<a href="#get-estimate"\1><div class="phil-fill"></div><span class="phil-label">Request an Estimate</span></a>', h)
    # 5. service card thumbnails
    if is_a:
        def thumb_a(mm):
            title = mm.group(2)
            src = KIT[reg] if 'itchen' in title else (BATH[reg] if 'ath' in title else DESIGN)
            alt = 'Real B&amp;B Associates project — ' + html.escape(html.unescape(re.sub(r'<[^>]+>', '', title)))
            card = mm.group(1).replace('class="sa-service-card"', 'class="sa-service-card has-thumb"')
            return card + '<img class="sa-service-thumb" src="' + src + '" alt="' + alt + '" loading="lazy" width="450" height="600">\n            <h3 class="sa-service-title">' + title + '</h3>'
        h, n = re.subn(r'(<div class="sa-service-card"[^>]*>)\s*<div class="sa-service-icon" aria-hidden="true">[^<]*</div>\s*<h3 class="sa-service-title">(.*?)</h3>', thumb_a, h, flags=re.S)
        log.append(f'thumbs {n}')
    else:
        def thumb_b(mm):
            title = mm.group(1)
            src = KIT[reg] if 'itchen' in title else BATH[reg]
            return '<div class="town-service-card">\n            <img class="town-service-thumb" src="' + src + '" alt="Real B&amp;B Associates project — ' + html.escape(html.unescape(title)) + '" loading="lazy" width="450" height="600">\n            <h3 class="town-service-h3">' + title + '</h3>'
        h, n = re.subn(r'<div class="town-service-card">\s*<h3 class="town-service-h3">(.*?)</h3>', thumb_b, h, flags=re.S)
        log.append(f'thumbs {n}')
    # 6. showroom band → carousel
    m = re.search(r'\s*<!-- Showroom band -->\s*<div class="sa-showroom-band reveal">.*?<p class="sa-showroom-band-body">.*?</p>\s*</div>\s*\n', h, re.S); assert m, 'band'
    h = h[:m.start()] + '\n      <!-- Portfolio carousel (replaces showroom band) -->\n      <div data-bb-carousel data-eyebrow="From Our Portfolio" data-title="Recent Kitchens &amp; Bathrooms Near ' + html.escape(town) + '"></div>\n' + h[m.end():]
    # 7. reviews
    if is_a:
        s = h.find('<div style="max-width:780px;margin:0 auto;" class="reveal">'); assert s > 0, 'reviews wrapper'
        e = h.find('Read All Reviews', s); e = h.find('</div>', h.find('</a>', e)) + len('</div>')
        h = h[:s] + '<div data-bb-reviews data-initial="4" data-step="4"></div>' + h[e:]
    else:
        i = h.find('    <section class="town-faq">'); assert i > 0, 'town-faq'
        h = h[:i] + REVIEWS_SECTION.lstrip('\n') + '\n' + h[i:]
    # 8. remove CTA panel, move the lead form into its slot
    if is_a:
        cta = re.search(r'\s*<!-- CTA PANEL -->\s*<div class="cta-panel[^"]*"[^>]*>.*?</div>\s*\n(?=\s*<!-- ALSO SERVE -->)', h, re.S); assert cta, 'cta A'
        lead = re.search(r'\s*<!-- LEAD FORM -->\s*<section id="get-estimate".*?</section>\s*\n', h, re.S); assert lead, 'lead A'
        leadhtml = lead.group(0)
        leadhtml = leadhtml.replace('<div style="display:grid;grid-template-columns:1fr 1fr;', '<div class="sa-lead-grid" style="display:grid;grid-template-columns:1fr 1fr;', 1)
        leadhtml = re.sub(r'<div style="background:#ffffff;border:1px solid #e5e7eb;padding:var\(--sp-8\);">(\s*<div data-bb-inquiry)', r'<div class="sa-lead-box" style="background:#ffffff;border:1px solid #e5e7eb;padding:var(--sp-8);">\1', leadhtml, 1)
        h = h[:lead.start()] + '\n' + h[lead.end():]
        cta = re.search(r'\s*<!-- CTA PANEL -->\s*<div class="cta-panel[^"]*"[^>]*>.*?</div>\s*\n(?=\s*<!-- ALSO SERVE -->)', h, re.S)
        h = h[:cta.start()] + leadhtml + h[cta.end():]
    else:
        lead = re.search(r'\s*<section class="town-form-section" id="get-estimate">.*?</section>\s*\n', h, re.S); assert lead, 'lead B'
        leadhtml = lead.group(0)
        h = h[:lead.start()] + '\n' + h[lead.end():]
        cta = re.search(r'\s*<section class="cta-panel">.*?</section>\s*\n', h, re.S); assert cta, 'cta B'
        h = h[:cta.start()] + leadhtml + h[cta.end():]
    # 9. intro grid widths
    h = h.replace('grid-template-columns: 55% 1fr;', 'grid-template-columns: 46% 1fr;', 1).replace('grid-template-columns: 1fr 40%;', 'grid-template-columns: 1fr 46%;', 1)
    # 10. CSS + scripts
    i = h.find('</style>'); h = h[:i] + CSS_COMMON + (CSS_A if is_a else CSS_B) + h[i:]
    assert '<script src="/js/inquiry-form.js"></script>' in h
    h = h.replace('<script src="/js/inquiry-form.js"></script>', '<script src="/js/inquiry-form.js"></script>\n  <script src="/js/project-carousel.js"></script>\n  <script src="/js/town-reviews.js"></script>', 1)
    open(path, 'w').write(h)
    return slug, log + [f'town={town}', 'A' if is_a else 'B']

if __name__ == '__main__':
    for p in sorted(glob.glob('service-areas/*/index.html')):
        if 'main-line-pa/index' in p or 'ambler-pa-remodeling-contractor' in p: continue
        try:
            print(*rollout(p))
        except AssertionError as e:
            print('FAILED', p, e); sys.exit(1)
