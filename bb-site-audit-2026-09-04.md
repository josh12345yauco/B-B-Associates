# B&B Associates Creations — Site Audit (SEO Expansion)

**Site:** https://www.bbassociatesco.com
**Repo:** `/Users/gabrielanunez/Documents/B&B Assocaites` (GitHub `josh12345yauco/B-B-Associates`, branch `main`, HEAD `e53fd6d`)
**Audit date:** 2026-09-04
**Mode:** Read-only. No files were modified, created, or deleted other than this report.

All paths below are relative to the repo root. Word counts are approximate main-content counts (header, nav, footer, scripts and styles stripped).

---

## 0. Executive summary (read this first)

1. **This is a hand-authored static HTML site on Vercel.** No framework, no CMS, no build step. Every page is a standalone `index.html` with its own copy of `<head>`, nav, footer, inline `<style>` block and JSON-LD. There is no shared head/SEO component and no templating engine. (§1, §4)
2. **The "Find Your Community" page is a static list of 26 `<a>` chips linking to 22 real town/region pages.** No modal, no anchors, no form. Two chips point to the wrong page (Warminster → Newtown; first Bryn Mawr chip → Main Line hub). (§3)
3. **Town pages are general (kitchen + bathroom), not service-specific.** Two hand-built template variants exist (8 "regional" pages, 14 "town-form" pages). Content is town-swapped with unique intro/FAQ copy; word-sequence similarity between sibling town pages is 65–77%. No data file drives them. (§3)
4. **Service pages: only two real ones** (`/services/luxury-kitchen-remodeling/`, `/services/custom-bathroom-renovations/`) plus a hub. A near-duplicate `/services/kitchen-remodeling/` exists, canonicalises to the luxury URL, and receives 15 internal links vs 2 for the canonical URL. (§5, §7)
5. **Blog and portfolio are client-side rendered from JS arrays** (`blog/articles-data.js`, 34 articles; `js/projects-data.js`, 36 projects) at `?id=` URLs. Title, meta, canonical, Article/FAQPage schema are all injected by JavaScript after load. Old `?id=` URLs are still the live URLs, not redirected. (§4, §6)
6. **Sitemap is static, 54 URLs, and stale**: 17 of 34 articles are in it, 0 of 36 portfolio projects, and most `lastmod` values are 2026-03-16. `llms.txt` does not exist. (§4)
7. **Tracking is intact and documented**: GTM `GTM-KZZXTRLG` on every real page; `js/analytics.js` pushes `bb_conversion` to the dataLayer and to Supabase. The paid landing page `/kitchen-bathroom-renovation-design/` is `noindex,nofollow`, uses a GoHighLevel iframe, and is flagged DO-NOT-TOUCH. (§8)
8. **Code-level bug worth verifying in a browser**: 19 pages load `/js/init.js` without GSAP/Lenis (all 14 "town-form" pages, the service-areas hub, thank-you, privacy, terms, application). `init.js` references `Lenis`/`gsap`/`ScrollTrigger` unguarded on lines 9–17, so it will throw before the mobile CTA bar and hamburger handlers are bound. (§9)
9. **Reusability verdict:** this is a **page-by-page job by default**, convertible to a **data-file-plus-template job only if a small build step (Node script) is introduced.** No existing component can generate service × town pages. (§10)
10. **Security items found incidentally** (not SEO, but must be raised): `.env` containing a Supabase *service role* key is committed to git (`git ls-files .env` returns it) and is not in `.vercelignore`; the git `origin` remote URL embeds a GitHub personal access token. Both should be rotated. Secrets are not reproduced in this report.

---

## 1. Stack & architecture

| Item | Finding | Evidence |
|---|---|---|
| Framework / language | None. Plain HTML5 + CSS + vanilla JS (ES5/ES6 mix). | Every route is a `*/index.html` file |
| CMS | None for pages. A browser-only "admin" panel at `/admin/` edits projects/articles/FAQ/reviews into `localStorage`/`sessionStorage` and exports JSON; nothing writes back to files. | `admin/js/admin-articles.js:1-8` ("To publish permanently, copy the export into articles-data.js"), `admin/js/admin-core.js` |
| Hosting | Vercel static deployment. Auto-deploys on push to `main`. | `vercel.json`, `.vercelignore`, `docs/content-plan/05-publishing-checklist.md` step 7 |
| Build process | None. No `package.json` at root, no bundler, no image pipeline. `serve.sh` runs `python3 -m http.server 3000` for local preview. | `serve.sh` |
| Routing | Pure file-system routing: `/foo/` → `foo/index.html`. Vercel serves clean URLs with trailing slash. Redirects live in `vercel.json`. | `vercel.json` |
| Dynamic routes | Two query-string "dynamic" pages rendered client-side: `/blog/article/?id=<slug>` and `/portfolio/project/?id=<slug>`. `/portfolio/?filter=kitchen|bathroom` and `/blog/?filter=<tag>` filter in JS. | `blog/article/index.html:520-724`, `portfolio/project/index.html`, `portfolio/index.html` |
| Shared CSS | `css/design-system.css` (451 lines, tokens), `css/components.css` (1,881 lines), `css/services-hero.css` (264 lines, homepage only). Each page also carries a large inline `<style>` (homepage ≈61 KB, town pages ≈17 KB). | `css/`, `index.html`, `service-areas/berwyn-pa-remodeling/index.html` |
| Shared JS | `js/business-config.js` (NAP single source of truth, `window.BB_BUSINESS`), `js/init.js` (Lenis + GSAP animations, nav, accordion, lightbox, mobile CTA bar), `js/analytics.js`, `js/data-layer.js` (`window.BB.*` data reads with localStorage overrides), `js/supabase-client.js`, `js/service-area-lead.js`, `js/consultation.js`, `js/projects-data.js`, `blog/articles-data.js`. | `js/`, `blog/articles-data.js` |
| Third-party runtime | Lenis 1.0.42, GSAP 3.12.5 + ScrollTrigger (CDN), Supabase JS v2 (CDN), GoHighLevel `form_embed.js`, Google Fonts (Cormorant Garamond + Manrope), GTM, ipapi.co geolocation. | script tags in each page |
| Data store | Supabase project `uiwubmhfrepmclvdisff` — tables `leads` and `analytics_events`. | `js/supabase-client.js`, `db/analytics_events.sql`, `ANALYTICS-SETUP.md` |
| Separate app | `design-estimator/` is a Next.js 14 + Gemini app (git-ignored, not deployed with the site; `/estimator` now redirects to `/contact/`). `ESTIMATOR-Pre/` is screenshots/PDFs only. | `design-estimator/package.json`, `.gitignore`, `vercel.json` |
| Docs | `docs/content-plan/` (SEO/GEO strategy, keyword × location matrix, briefs, calendar, publishing checklist). Excluded from deploy by `.vercelignore`. `ANALYTICS-SETUP.md` documents GTM/GA4/Supabase wiring. | `docs/content-plan/README.md` |

### Route patterns (complete)

| Pattern | Type | Count |
|---|---|---|
| `/` | static file | 1 |
| `/<page>/` (about, contact, consultation, reviews, showroom, application, privacy-policy, terms-of-service, thank-you, admin) | static file | 10 |
| `/services/` and `/services/<slug>/` | static file | 1 + 3 |
| `/service-areas/` and `/service-areas/<slug>/` | static file | 1 + 22 (+1 redirect stub) |
| `/portfolio/` and `/portfolio/project/?id=<slug>` | static shell + client-side render | 1 + 36 virtual |
| `/blog/` and `/blog/article/?id=<slug>` | static shell + client-side render | 1 + 34 virtual |
| `/kitchen-bathroom-renovation-design/` | static file (paid LP, noindex) | 1 |
| `/Kitchen-Bathroom-Remodeling-montgomery-county-pa/` | meta-refresh stub (also 301 in vercel.json) | 1 |

### How a new page is added today

Copy an existing `index.html` (typically a sibling town page), create `new-slug/index.html`, hand-edit: `<title>`, meta description, canonical, OG/Twitter tags, three JSON-LD blocks, H1, body copy, FAQ (visible + schema, must be kept in sync by hand), footer "Service Areas" column, then add a `<url>` to `sitemap.xml`. There is no generator; the checklist in `docs/content-plan/05-publishing-checklist.md` covers articles only.

---

## 2. Full page inventory

Legend: **Canon** = canonical tag; "self" = self-referencing absolute `https://www.bbassociatesco.com/...`. **Words** = main content. **Schema** = JSON-LD `@type`s present (H&CB = `HomeAndConstructionBusiness`; BC = `BreadcrumbList`; FAQ(n) = `FAQPage` with n questions).

### 2a. Core pages

| URL | File | Title tag | Meta description | H1 | Words | Canon | Schema |
|---|---|---|---|---|---|---|---|
| `/` | `index.html` | Luxury Kitchen & Bathroom Remodeling \| B&B Associates Creations \| Ambler, PA | B&B Associates Creations — 13 years of luxury kitchen and bathroom remodeling across Montgomery County, Bucks County, and the Philadelphia Main Line. 1,200+ projects. Free consultation. | Luxury Kitchens & Bathrooms — B&B Associates Creations, Ambler PA | 2,334 | self | H&CB (full NAP, geo, hours, AggregateRating, sameAs ×5, areaServed ×3), FAQ(18). **No BC.** |
| `/services/` | `services/index.html` | Kitchen & Bathroom Remodeling Services \| Montgomery County & Bucks County \| B&B Associates | Full-service luxury kitchen and bathroom renovations across Montgomery County, Bucks County, and the Main Line. Design-build contractor with 25+ years experience. Free estimates. | Kitchen & Bathroom Remodeling | 1,078 | self | H&CB, BC(2). Visible FAQ section exists but **no FAQPage schema**; no `Service` schema. |
| `/services/luxury-kitchen-remodeling/` | `services/luxury-kitchen-remodeling/index.html` | Luxury Kitchen Remodeling in Bucks County & Main Line PA \| B&B Associates Creations | B&B Associates Creations designs and builds custom luxury kitchens across the Philadelphia Main Line, Bucks County, and Montgomery County. 25 years. 1,200+ projects. Free consultation. | Luxury Kitchen Remodeling | 1,308 | self | Service, H&CB, FAQ(6), BC(3) |
| `/services/kitchen-remodeling/` | `services/kitchen-remodeling/index.html` | Kitchen Remodeling in Bucks County & Main Line PA \| B&B Associates Creations | (same as above) | Kitchen Remodeling | 1,303 | **points to `/services/luxury-kitchen-remodeling/`** (duplicate page; 74 differing lines, all title/H1/URL swaps) | Service, H&CB, FAQ(6), BC(3) — BC item 3 names its own non-canonical URL |
| `/services/custom-bathroom-renovations/` | `services/custom-bathroom-renovations/index.html` | Custom Bathroom Renovations in Montgomery County & Main Line PA \| B&B Associates Creations | Luxury master baths, spa showers, and custom vanities built by B&B Associates. Serving Montgomery County, Bucks County & the Main Line since 1999. 600+ bathrooms completed. | Custom Bathroom Renovations | 1,348 | self | Service (GeoCircle, AggregateOffer), H&CB, FAQ(6), BC(3) |
| `/service-areas/` | `service-areas/index.html` | Service Areas \| Kitchen & Bathroom Remodeling \| Montgomery County, Bucks County & Main Line \| B&B Associates | B&B Associates serves Montgomery County, Bucks County, and the Philadelphia Main Line. Click your community for local project details, permit info, FAQs, and a free estimate. | Find Your Community | 240 | self | BC(2) only. **No H&CB, no areaServed.** |
| `/portfolio/` | `portfolio/index.html` | Kitchen & Bathroom Remodeling Portfolio \| Montgomery County & Bucks County \| B&B Associates Creations | Browse 30+ completed kitchen and bathroom remodeling projects across Montgomery County, Bucks County, and the Main Line… | Project Gallery | 57 static (grid rendered by JS) | self | CollectionPage, H&CB, BC(2) |
| `/portfolio/project/?id=<slug>` | `portfolio/project/index.html` | JS: `${project.title} — ${project.type} Remodel \| B&B Associates Creations` (static fallback: "Project \| B&B Associates Creations") | JS: `${style} ${type} remodel in ${town}. ${highlights[0..1]}. By B&B Associates Creations.` | JS: `${project.title}` (static fallback "Project Not Found") | 10 static; ~150–250 rendered | JS sets `https://www.bbassociatesco.com/portfolio/project/?id=<slug>` | JS: `HomeImprovement` (+ provider H&CB, Review). **No BC in schema; visible breadcrumb only.** |
| `/blog/` | `blog/index.html` | Kitchen & Bathroom Remodeling Journal \| Montgomery County & Main Line PA \| B&B Associates Creations | Expert insights on luxury kitchen and bathroom remodeling across Montgomery County, Bucks County, and the Main Line. Cost guides, design trends… | The Journal | 191 static | self | Blog, H&CB, BC(2) |
| `/blog/article/?id=<slug>` | `blog/article/index.html` | JS: `article.metaTitle` or `${title} \| B&B Associates Creations` (static fallback "Journal \| B&B Associates Creations") | JS: `metaDescription` or `excerpt` | JS: `article.title` | 9 static; 1,200–2,000 rendered | JS sets `…/blog/article/?id=<slug>` | JS: Article (author = Organization, publisher H&CB, datePublished/Modified), FAQPage from `article.faq`. **No BC.** |
| `/about/` | `about/index.html` | About B&B Associates \| Family-Owned Design-Build Contractor \| Philadelphia | Meet the team behind B&B Associates Creations. Family-owned since 2013… | About B&B Associates | 592 | self | H&CB (+Person), BC(2) |
| `/reviews/` | `reviews/index.html` | Client Reviews & Testimonials \| 180+ 5-Star Reviews \| B&B Associates Creations | Read 180+ verified client reviews… 5.0 stars on Google, 123 reviews on Angi… | What Our Clients Say | 552 | self | H&CB + 9× Review, BC(2) |
| `/showroom/` | `showroom/index.html` | Ambler Design Showroom — Coming Soon \| Join the List \| B&B Associates Creations | Our Ambler design showroom is opening soon… | Our Ambler Showroom Is on the Way | 622 | self | H&CB, BC(2) |
| `/contact/` | `contact/index.html` | Contact Us \| Kitchen & Bathroom Remodeling \| Montgomery County & Bucks County \| B&B Associates | Contact B&B Associates Creations… Call 267-402-8758 or send a message — we respond within 5–15 minutes. | Get in Touch | 199 | self | H&CB, BC(2) |
| `/consultation/` | `consultation/index.html` | Request a Free Consultation \| B&B Associates Creations \| Ambler, PA | Schedule your free, no-obligation consultation… $35K+ remodeling projects. | Begin Your Transformation | 270 | self | BC(2) |
| `/application/` | `application/index.html` | Apply to Join Our Team \| B&B Associates Creations \| Ambler, PA | Join the B&B Associates Creations team… | Build Something That Lasts | 290 | self | BC(2). **Orphan** (0 inbound links; in sitemap). |
| `/privacy-policy/` | `privacy-policy/index.html` | Privacy Policy \| B&B Associates Creations | Privacy Policy for B&B Associates Creations LLC… | Privacy Policy | 577 | self | BC(2) |
| `/terms-of-service/` | `terms-of-service/index.html` | Terms of Service \| B&B Associates Creations | Terms of Service for B&B Associates Creations LLC… | Terms of Service | 990 | self | BC(2) |
| `/thank-you/` | `thank-you/index.html` | Thank You \| B&B Associates Creations | Thank you for contacting B&B Associates Creations… | Thank You for Reaching Out | 62 | self | none; `robots: noindex, follow` |
| `/kitchen-bathroom-renovation-design/` | `kitchen-bathroom-renovation-design/index.html` | Kitchen & Bathroom Renovation & Design \| B&B Associates Creations | Award-winning kitchen & bathroom renovation and design serving the Main Line, Bucks & Montgomery County, PA… | Kitchen & Bathroom Renovation & Design | 1,483 | self | H&CB (areaServed 4× AdministrativeArea), AggregateRating; `robots: noindex, nofollow`. **DO NOT TOUCH (paid LP).** |
| `/Kitchen-Bathroom-Remodeling-montgomery-county-pa/` | `Kitchen-Bathroom-Remodeling-montgomery-county-pa/index.html` | (stub) | none | none | 19 | relative `/kitchen-bathroom-renovation-design/` | none; `noindex,nofollow`; meta-refresh + JS redirect; also 301 in `vercel.json` |
| `/service-areas/main-line-pa/` | `service-areas/main-line-pa/index.html` | (stub) | none | none | 15 | `…/service-areas/main-line-pa-remodeling/` | none; `noindex, follow`; meta-refresh + JS redirect; also 301 in `vercel.json` |
| `/admin/` | `admin/index.html` | B&B Admin Dashboard | none | none | 803 | none | none; `noindex,nofollow`; blocked in robots.txt; reached by 6 clicks on the nav logo (`contact/index.html:1108` and every page) |

### 2b. Service-area pages (22 real pages)

All 22 have: self-referencing canonical, 7 OG tags, GTM, `HomeAndConstructionBusiness` + `BreadcrumbList`(3: Home › Service Areas › Town) + `FAQPage`. Template A pages also carry `areaServed` City lists inside the H&CB block. Every page is in `sitemap.xml`.

| URL | Template | Title tag | Meta description (abridged) | H1 | Words | FAQ Qs |
|---|---|---|---|---|---|---|
| `/service-areas/ambler-pa-remodeling-contractor/` | A | Local Kitchen & Bathroom Contractor in Ambler, PA \| B&B Associates Creations | B&B Associates Creations is Ambler's local luxury remodeling contractor… 25 years, 5.0★. | Your Local Remodeling Contractor in Ambler, PA | 1,209 | 8 |
| `/service-areas/blue-bell-north-wales-remodeling/` | A | Kitchen & Bathroom Remodeling in Blue Bell & North Wales, PA \| … | Custom kitchen and bathroom renovations in Blue Bell and North Wales, PA… | Custom Kitchen & Bathroom Remodeling in Blue Bell & North Wales, PA | 1,280 | 8 |
| `/service-areas/bucks-county/` | A | Kitchen & Bathroom Remodeling in Bucks County, PA \| … | …serves Newtown, Doylestown, New Hope, Yardley, Warminster, Buckingham & more. | Bucks County's Trusted Kitchen & Bathroom Remodeler | 1,121 | 7 |
| `/service-areas/doylestown-new-hope-kitchen-remodeling/` | A | Luxury Kitchen & Bathroom Remodeling in Doylestown & New Hope, PA \| … | Award-quality kitchen and bathroom remodeling in Doylestown, New Hope, Solebury, Lahaska & Buckingham Township. | Luxury Kitchen & Bathroom Remodeling in Doylestown & New Hope, PA | 1,188 | 7 |
| `/service-areas/main-line-pa-remodeling/` | A | Luxury Kitchen & Bathroom Remodeling on the Philadelphia Main Line \| … | …serves Wayne, Villanova, Bryn Mawr, Ardmore, Berwyn & Paoli. | Luxury Kitchen & Bathroom Remodeling on the Philadelphia Main Line | 1,062 | 5 |
| `/service-areas/montgomery-county/` | A | Kitchen & Bathroom Remodeling in Montgomery County, PA \| … | …headquartered in Maple Glen and serves Blue Bell, North Wales, Lower Gwynedd, Lansdale, Horsham & more. | Montgomery County's Premier Kitchen & Bathroom Remodeler | 1,182 | 7 |
| `/service-areas/newtown-pa-kitchen-bathroom-remodeling/` | A | Custom Kitchen & Bathroom Remodeling in Newtown, PA \| … | …Newtown Borough, Newtown Township, and Yardley, PA… | Custom Kitchen & Bathroom Remodeling in Newtown, PA | 1,037 | 6 |
| `/service-areas/wayne-villanova-bathroom-remodeling/` | A | Luxury Bathroom Renovations in Wayne & Villanova, PA \| … | Luxury bathroom renovations in Wayne, Villanova, Radnor Township, St. Davids & Strafford… | Luxury Bathroom Renovations in Wayne & Villanova, PA | 1,174 | 7 |
| `/service-areas/berwyn-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Berwyn, PA \| … | …Berwyn & Tredyffrin Township… | Kitchen & Bathroom Remodeling in Berwyn, PA | 876 | 6 |
| `/service-areas/bryn-mawr-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Bryn Mawr, PA \| … | …Bryn Mawr & Lower Merion Township… | Kitchen & Bathroom Remodeling in Bryn Mawr, PA | 885 | 6 |
| `/service-areas/buckingham-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Buckingham, PA \| … | …Buckingham Township… New Hope Road corridor, Lahaska… | Kitchen & Bathroom Remodeling in Buckingham Township, PA | 847 | 6 |
| `/service-areas/chalfont-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Chalfont, PA \| … | …Chalfont & New Britain Township… | Kitchen & Bathroom Remodeling in Chalfont, PA | 819 | 6 |
| `/service-areas/flourtown-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Flourtown, PA \| … | …Flourtown & Springfield Township… 12 minutes away in Ambler… | Kitchen & Bathroom Remodeling in Flourtown, PA | 860 | 6 |
| `/service-areas/fort-washington-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Fort Washington, PA \| … | …Fort Washington & Upper Dublin Township… | Kitchen & Bathroom Remodeling in Fort Washington, PA | 891 | 6 |
| `/service-areas/gladwyne-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Gladwyne, PA \| … | …Gladwyne & Lower Merion Township… | Kitchen & Bathroom Remodeling in Gladwyne, PA | 888 | 6 |
| `/service-areas/haverford-ardmore-remodeling/` | B | Kitchen & Bathroom Remodeling in Haverford & Ardmore, PA \| … | …Haverford, Ardmore & Lower Merion Township… | Kitchen & Bathroom Remodeling in Haverford & Ardmore, PA | 885 | 6 |
| `/service-areas/horsham-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Horsham, PA \| … | …Horsham Township… 15 minutes… | Kitchen & Bathroom Remodeling in Horsham, PA | 802 | 6 |
| `/service-areas/lansdale-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Lansdale, PA \| … | …Lansdale Borough, North Wales… | Kitchen & Bathroom Remodeling in Lansdale, PA | 857 | 6 |
| `/service-areas/lower-gwynedd-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Lower Gwynedd, PA \| … | …Penllyn, Gwynedd Valley… | Kitchen & Bathroom Remodeling in Lower Gwynedd, PA | 833 | 6 |
| `/service-areas/warminster-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Warminster, PA \| … | …Warminster Township… | Kitchen & Bathroom Remodeling in Warminster, PA | 811 | 6 |
| `/service-areas/warrington-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Warrington, PA \| … | …Warrington Township… | Kitchen & Bathroom Remodeling in Warrington, PA | 803 | 6 |
| `/service-areas/yardley-pa-remodeling/` | B | Kitchen & Bathroom Remodeling in Yardley, PA \| … | …Yardley & Lower Makefield Township… | Kitchen & Bathroom Remodeling in Yardley, PA | 842 | 6 |

Consistency notes across the 22 pages:
- All meta descriptions except Ambler/Blue Bell/Bucks/Montgomery/Main Line lead with "Luxury kitchen and bathroom remodeling in …". Titles follow "Kitchen & Bathroom Remodeling in {Town}, PA | B&B Associates Creations" on all Template B pages.
- Descriptions cite "25 years"/"25+ years" while the homepage and About say "13 years"/"since 2013". This inconsistency is content, not code, but will matter for E-E-A-T on new pages.
- OG image: 12 pages use `/IMAGES/Custom-Kitchen-Ambler-Pa.webp`, 4 use `/IMAGES/Custom-Kitchen-Main-Line.webp`, 6 use portfolio JPEGs (see §9).
- `geo.placename` meta on all town pages is "Ambler, Pennsylvania" with Ambler coordinates, not the town's.

### 2c. Virtual pages rendered from data

| Source | Count | URL form | In sitemap |
|---|---|---|---|
| `blog/articles-data.js` (`const ARTICLES`) | 34 | `/blog/article/?id=<id>` | 17 of 34 |
| `js/projects-data.js` (`const projects`) | 36 (17 kitchens, 19 bathrooms) | `/portfolio/project/?id=<id>` | 0 of 36 |

Full article and project ID lists are in §6.

---

## 3. The Service Areas / Community system

### 3a. What the chips link to

`service-areas/index.html` lines 289–411 contain three `<div class="sa-index-region">` blocks (Montgomery County, Bucks County, The Main Line), each with an `<div class="sa-index-area-list">` of plain `<a class="sa-index-area-btn">` anchors. **Each chip is a normal link to a full HTML town page.** There is no modal, no anchor scroll, no form trigger, no JS behaviour on the chips.

Exact chip → destination map (26 chips, 21 distinct destinations):

| Region | Chip label | Destination | Note |
|---|---|---|---|
| Montgomery | Ambler | `/service-areas/ambler-pa-remodeling-contractor/` | |
| Montgomery | Blue Bell | `/service-areas/blue-bell-north-wales-remodeling/` | |
| Montgomery | North Wales | `/service-areas/blue-bell-north-wales-remodeling/` | shared page |
| Montgomery | Lower Gwynedd | `/service-areas/lower-gwynedd-pa-remodeling/` | |
| Montgomery | Flourtown | `/service-areas/flourtown-pa-remodeling/` | |
| Montgomery | Lansdale | `/service-areas/lansdale-pa-remodeling/` | |
| Montgomery | Fort Washington | `/service-areas/fort-washington-pa-remodeling/` | |
| Montgomery | Horsham | `/service-areas/horsham-pa-remodeling/` | |
| Montgomery | All Montgomery County | `/service-areas/montgomery-county/` | |
| Bucks | Newtown | `/service-areas/newtown-pa-kitchen-bathroom-remodeling/` | |
| Bucks | Doylestown | `/service-areas/doylestown-new-hope-kitchen-remodeling/` | |
| Bucks | New Hope | `/service-areas/doylestown-new-hope-kitchen-remodeling/` | shared page |
| Bucks | **Warminster** | `/service-areas/newtown-pa-kitchen-bathroom-remodeling/` | **BUG: dedicated `warminster-pa-remodeling/` page exists and is not linked from any chip** (`service-areas/index.html:353`) |
| Bucks | Yardley | `/service-areas/yardley-pa-remodeling/` | |
| Bucks | Chalfont | `/service-areas/chalfont-pa-remodeling/` | |
| Bucks | Warrington | `/service-areas/warrington-pa-remodeling/` | |
| Bucks | Buckingham | `/service-areas/buckingham-pa-remodeling/` | |
| Bucks | All Bucks County | `/service-areas/bucks-county/` | |
| Main Line | Wayne | `/service-areas/wayne-villanova-bathroom-remodeling/` | |
| Main Line | Villanova | `/service-areas/wayne-villanova-bathroom-remodeling/` | shared page |
| Main Line | **Bryn Mawr** (first) | `/service-areas/main-line-pa-remodeling/` | **BUG: points to hub, not `bryn-mawr-pa-remodeling/`** (`service-areas/index.html:~391`) |
| Main Line | Gladwyne | `/service-areas/gladwyne-pa-remodeling/` | |
| Main Line | Haverford & Ardmore | `/service-areas/haverford-ardmore-remodeling/` | |
| Main Line | Berwyn | `/service-areas/berwyn-pa-remodeling/` | |
| Main Line | Bryn Mawr (second, duplicate chip) | `/service-areas/bryn-mawr-pa-remodeling/` | correct one |
| Main Line | All Main Line | `/service-areas/main-line-pa-remodeling/` | |

Towns named in copy but with no page: Paoli, Radnor, Newtown Square, Wrightstown, Solebury, Lahaska, Dresher, Maple Glen (HQ town), Erdenheim, Whitemarsh, Penllyn, Gwynedd Valley, Devon, St. Davids, Strafford, Lower Merion.

### 3b. Town pages: how they are built

- **Generation method:** one hand-written `index.html` per town. **No data file, no component, no CMS entries, no build.** The only shared assets are `css/components.css` (which defines 11 `.sa-*`/`.town-*` selectors, e.g. `.sa-hero`) and `js/service-area-lead.js`. Each page also carries its own ~17 KB inline `<style>` and its own three JSON-LD blocks.
- **There is no town data structure/config in the codebase.** The nearest thing to a list of towns is (a) the chip markup above, (b) the `areas-served-section` link list on the two service pages (`services/luxury-kitchen-remodeling/index.html`, `services/custom-bathroom-renovations/index.html`), and (c) `docs/content-plan/02-keyword-location-matrix.md` (planning doc, not code). `js/business-config.js` holds NAP only.
- **Service-specific?** No. All 22 pages cover kitchen + bathroom together. Two slugs *sound* specific but the content is general: `wayne-villanova-bathroom-remodeling` (title/H1 say "Bathroom Renovations" but the body has a "Renovation Services" block with both) and `doylestown-new-hope-kitchen-remodeling` (H1 "Kitchen & Bathroom Remodeling"). There are **zero** service × town pages today.

### 3c. Two template variants

**Template A — "regional" (8 pages):** ambler, blue-bell-north-wales, bucks-county, doylestown-new-hope, main-line-pa-remodeling, montgomery-county, newtown, wayne-villanova.
Section order (from `service-areas/ambler-pa-remodeling-contractor/index.html`):
1. `section.sa-hero` — visible breadcrumb `nav.sa-hero-breadcrumb`, eyebrow, H1 (`headline-reveal`), stats.
2. `section.sa-intro-section` — H2 story intro (2–4 paragraphs, unique per page).
3. `section.section` — H2 "Full-Service Remodeling for Every Space" / "Remodeling Services for {Region} Homes": two cards linking to `/services/kitchen-remodeling/` and `/services/custom-bathroom-renovations/` (note the **non-canonical** kitchen URL).
4. `section.section` — H2 community/area block with an inline list of sub-towns and neighbouring service-area links.
5. `section.section` — H2 "Questions from {Region} Homeowners": accordion FAQ (`.accordion-item`, 5–8 Qs) mirrored in `FAQPage` JSON-LD.
6. `section.section` — H2 "Ready to …?" CTA panel.
7. Lead section — H2 "Request a Free Estimate in {Region}", `<form class="sa-lead-form" data-service-area="{Region}">` (fields: first_name, last_name, phone, email, project_type, message; success message `.sa-lead-thankyou`).
8. Footer.
JSON-LD: H&CB with `areaServed: [ {City,…}×4–6 ]`, FAQPage, BreadcrumbList(3). Loads GSAP + Lenis (animations work).

**Template B — "town-form" (14 pages):** berwyn, bryn-mawr, buckingham, chalfont, flourtown, fort-washington, gladwyne, haverford-ardmore, horsham, lansdale, lower-gwynedd, warminster, warrington, yardley.
Section order (from `service-areas/berwyn-pa-remodeling/index.html`):
1. `section.sa-hero` (lines ~527–545) — breadcrumb, eyebrow ("Philadelphia Main Line"), H1, stats.
2. `section.sa-intro-section` — H2 hook + 2–3 unique paragraphs.
3. `section.town-services` — H2 "Remodeling Services for {Town} Homeowners"; two `.town-service-card`s (Kitchen Remodeling / Bathroom Renovation) each with a 5-bullet list and "Investment: $55K – $180K+" / "$40K – $120K+". **These cards are not links** — no outbound link to the service pages.
4. `section.town-form-section#get-estimate` — H2 "Tell Us About Your {Town} Project"; `<form class="town-form" data-service-area="{Town}">` (name, email, phone, project_type, message).
5. `section.town-faq` — H2 "Common Questions from {Town} Homeowners"; `.town-faq-item` accordion (own inline click handler at the bottom of the page), 6 Qs mirrored in `FAQPage` schema.
6. `section.cta-panel` — "Ready for Your Free Consultation?".
7. (9 of 14 pages) unstyled `<section>` "Also Serving Nearby … Communities" — H2 "Kitchen & Bath Remodeling Near {Town}, PA" with 5 `.btn-ghost` links to sibling towns + `/service-areas/` (lines ~743–757 on Berwyn). **Absent on:** bryn-mawr, buckingham, chalfont, horsham, lower-gwynedd, warminster, warrington, yardley — these 8 pages have **no body links to any other service-area page and no links to the service pages**; their only internal links out are nav/footer plus one portfolio link.
8. Footer.
JSON-LD: H&CB (no `areaServed`), BreadcrumbList(3), FAQPage(6). **Loads Lenis but not GSAP** — see §9 bug.

### 3d. Unique vs templated content

Word-sequence similarity of stripped body text (higher = more shared boilerplate):

| Pair | Similarity |
|---|---|
| chalfont vs warrington (B/B) | 0.77 |
| fort-washington vs flourtown (B/B) | 0.76 |
| horsham vs lansdale (B/B) | 0.73 |
| berwyn vs gladwyne (B/B) | 0.71 |
| yardley vs buckingham (B/B) | 0.71 |
| berwyn vs bryn-mawr (B/B) | 0.65 |
| newtown vs doylestown (A/A) | 0.58 |
| bucks-county vs montgomery-county (A/A) | 0.44 |
| ambler vs blue-bell (A/A) | 0.31 |
| berwyn vs ambler (B/A) | 0.28 |

Interpretation: Template B pages are a swapped-town skeleton with a genuinely unique hero H2, intro paragraphs, service-card sentences, and FAQ answers (Berwyn: 11 paragraphs over 60 chars, 6 identical to Bryn Mawr, 5 unique). Template A pages are substantially unique. All are well above thin-content thresholds (800–1,300 words) but Template B towns share the same stat blocks, investment ranges, form copy, and CTA copy verbatim.

### 3e. Town page data, if it existed (it does not)

There is no config to paste. The closest machine-readable list of towns in code is the `areas-served-section` on `services/luxury-kitchen-remodeling/index.html` (22 links, one per town page, anchor text "Luxury Kitchen Remodeling in {Town}, PA") and the identical block on the bathroom page. A future `data/towns.json` would need, per town: slug, display name, county/region label, township(s), neighbouring slugs, sub-neighbourhood list, distance-from-Ambler phrase, permit authority, housing-stock description, FAQ set, OG image, and geo coordinates — all of which currently live only inside prose.

---

## 4. SEO infrastructure

### 4a. Head / SEO component

**None.** There is no shared head partial, no include mechanism, no JS that sets tags (except on the two `?id=` pages). Every page hand-codes, in this order (see `service-areas/berwyn-pa-remodeling/index.html:1-45`):

```
GTM snippet → charset → favicon → viewport → <title> → meta description →
<link rel=canonical> → 7 OG tags → 4 Twitter tags → 4 geo meta tags →
font preconnect + Google Fonts → /css/design-system.css → /css/components.css →
JSON-LD #1 (H&CB) → JSON-LD #2 (BreadcrumbList) → inline <style> →
… body … → JSON-LD #3 (FAQPage) near the FAQ section
```

Signature of the only "SEO-ish" shared object, `js/business-config.js`:

```js
window.BB_BUSINESS = {
  businessName, legalName, streetAddress, city, state, zip, addressLine,
  phone, phoneHref, phoneE164, email, website, licenseNumber, licenseLabel, logo
};
```

It is consumed only by `init.js` (mobile CTA `tel:`), `blog/article/index.html` and `portfolio/project/index.html` (publisher/provider in JS-built schema). Static JSON-LD blocks duplicate the same values by hand ("Keep in sync with the static JSON-LD blocks and footer NAP" — `js/business-config.js:3`).

### 4b. Titles / descriptions

Hand-coded per page. The two `?id=` pages set `document.title`, `meta[name=description]`, `#canonical`, `#og-title/#og-description/#og-image` from the data arrays at runtime (`blog/article/index.html:536-544`, `portfolio/project/index.html`). No page uses `<meta name="robots">` except thank-you, admin, the LP, and the two stubs. No `hreflang`, no `google-site-verification` meta, no `max-image-preview`.

### 4c. Schema

- **Hardcoded per page** for all static pages; **generated from data** only on `/blog/article/` (Article + FAQPage) and `/portfolio/project/` (HomeImprovement).
- `HomeAndConstructionBusiness` with `@id: https://www.bbassociatesco.com/#business`: homepage, services hub, both service pages (+ kitchen duplicate), all 22 town pages, about, reviews, showroom, contact, portfolio, blog, LP. Full NAP/geo/hours/AggregateRating on most; `sameAs` (Instagram, Facebook, TikTok, Houzz, Angi) and top-level `areaServed` only on the homepage.
- `Service`: only `/services/luxury-kitchen-remodeling/`, `/services/kitchen-remodeling/`, `/services/custom-bathroom-renovations/`.
- `BreadcrumbList`: every static page except homepage, LP, thank-you, stubs, and the two `?id=` shells. Visible breadcrumb markup (`nav.sa-hero-breadcrumb`) exists on all 22 town pages, 3 service pages, and portfolio project; the hub `/service-areas/` has schema but no visible breadcrumb.
- `FAQPage`: homepage (18), both service pages (6 each), all 22 town pages (5–8), and articles with `faq[]`. **Missing on `/services/`** despite a visible 10-item FAQ.
- `Review`/`AggregateRating`: reviews page (9 reviews), AggregateRating repeated inside H&CB on ~30 pages.
- Not present anywhere: `Organization` as a top-level node, `WebSite`/`SearchAction`, `ImageObject` galleries, `Person` author on articles (author is the Organization), `VideoObject`.

### 4d. Sitemap

- **Static, hand-maintained** `sitemap.xml` (54 URLs). Referenced from `robots.txt`.
- Contents: `/` + 11 core pages, 17 blog `?id=` URLs, 22 service-area pages, `/application/`, `/privacy-policy/`, `/terms-of-service/`.
- Gaps: 17 articles absent (`luxury-kitchen-cost-guide`, `doylestown-historic-homes`, `design-build-vs-separate`, `bathroom-tile-trends-2025`, `kitchen-renovation-timeline`, `main-line-kitchen-neighborhood-guide`, `kitchen-cabinet-trends-2025`, `countertop-material-guide`, `bathroom-remodeling-roi`, `transitional-vs-modern-kitchen`, `custom-cabinetry-montgomery-county`, `heated-bathroom-floors`, `bucks-county-older-homes`, `choosing-remodeling-contractor-philadelphia`, `open-concept-kitchen-costs`, `main-line-bathroom-trends`, `kitchen-island-design-ideas`); all 36 portfolio projects absent; `/portfolio/project/` and `/blog/article/` shells absent (fine). 33 of 54 entries carry `lastmod 2026-03-16`.
- Correctly excludes: LP, thank-you, admin, `/services/kitchen-remodeling/`, both redirect stubs.

### 4e. robots.txt and llms.txt

`robots.txt` (full contents):
```
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://www.bbassociatesco.com/sitemap.xml
```
**`llms.txt` and `llms-full.txt` do not exist.**

### 4f. Redirects

All redirects live in `vercel.json` (hosting layer). No middleware, no `_redirects`, no server code. Full list:

| Source | Destination | Type |
|---|---|---|
| `/estimator`, `/estimator/` | `/contact/` | 307 (temporary) |
| `/journal` | `/blog/` | 308 |
| `/journal/:path*` | `/blog/:path*` | 308 |
| `/service-areas/main-line-pa`, `…/main-line-pa/` | `/service-areas/main-line-pa-remodeling/` | 308 |
| `/Kitchen-Bathroom-Remodeling-montgomery-county-pa`, `…/` | `/kitchen-bathroom-renovation-design/` | 308 |
| `/kitchen-bathroom-remodeling-montgomery-county-pa`, `…/` | `/kitchen-bathroom-renovation-design/` | 308 |

Belt-and-braces stubs also exist on disk for the last two (`service-areas/main-line-pa/index.html`, `Kitchen-Bathroom-Remodeling-montgomery-county-pa/index.html`) with meta-refresh + JS + canonical. Vercel's `permanent: true` yields 308, not 301 — functionally equivalent for SEO.

No redirect exists for `/services/kitchen-remodeling/` → `/services/luxury-kitchen-remodeling/` (handled by canonical only, and the duplicate is still the internally-linked URL).

### 4g. Canonical / www strategy

- Every canonical, OG URL, sitemap entry and schema `url` uses `https://www.bbassociatesco.com/…` with trailing slash. Consistent.
- **The www vs non-www and http→https redirect is not in the repo.** `vercel.json` has no host-level rule, so it must be configured in the Vercel project's Domains panel (apex → www redirect). This could not be verified from code; confirm with `curl -I https://bbassociatesco.com/`.
- Trailing-slash: Vercel default (`trailingSlash` unset) serves `/about/` and redirects `/about` → `/about/`. Canonicals match.

### 4h. Old `?id=` URLs

**Still in use, not redirected, not fixed.** They are the canonical, sitemap-listed, internally-linked URLs for all 34 articles and 36 projects. Everything about those pages (title, description, canonical, OG, Article/FAQPage/HomeImprovement schema, H1, body) is produced by JavaScript after `DOMContentLoaded`; the static HTML that a non-rendering crawler or an AI fetcher sees is the "Journal | B&B Associates Creations" / "Project | B&B Associates Creations" shell with a 9-word body and an empty `<script id="article-schema">{}</script>`. `vercel.json` has no rewrite from `/blog/<slug>/` to the shell, so clean article URLs cannot be adopted without either a build step or a Vercel rewrite plus JS reading `location.pathname`.

---

## 5. Service pages

### `/services/` — `services/index.html` (hub, 1,078 words)
Sections in order: hero (`.hero.hero-services`) → `#kitchens` "Luxury Kitchens That Define Your Home" → `#bathrooms` "Spa-Inspired Bathrooms for Everyday Living" → `.process-section` (Design / Plan / Build / Reveal) → `.why-section` → `.areas-section` "Proudly Serving Philadelphia's Finest Communities" (links to 6 area pages) → `.services-testimonial` → `.faq-section` "Answers for Homeowners" (10 visible Qs, **no FAQPage schema**) → `.cta-panel`.
Internal links out (body): `/service-areas/…` ×6, `/contact/`, `/portfolio/`. **Does not link to the two service detail pages from the body**; the footer "Services" column on this page also links to `/services/` three times instead of the detail URLs.
Inbound: 41 pages (nav + footer) but only 1 body link sitewide.

### `/services/luxury-kitchen-remodeling/` — `services/luxury-kitchen-remodeling/index.html` (1,308 words) — canonical kitchen page
Sections: `.hero.page-hero` (H1 + "Main Line · Bucks County · Montgomery County, PA", stats) → "More Than a Remodel. A Total Transformation." (Best of Houzz badge, intro) → "Every Detail. Every Decision. Handled." (6 numbered deliverables) → "The Details That Define a Luxury Kitchen" (materials grid, 6 images with `loading=lazy` + `width/height`) → "The B&B Kitchen Design-Build Process" (5 H3 steps) → "Featured Kitchen Projects" (links `/portfolio/?filter=kitchen`) → "What Does a Luxury Kitchen Remodel Cost…" (3 tiers: Foundation $35K–$65K…) → `.testimonial-panel` → "Kitchen Remodeling FAQs" (6 Qs, FAQPage schema) → `.cta-panel` ("The consultation is free…") → `.areas-served-section` "Luxury Kitchen Remodeling In Your City" (**22 town links**, anchor text "Luxury Kitchen Remodeling in {Town}, PA").
CTAs: hero buttons, cost section, cta-panel (both → `/contact/#inquiry-form` + `tel:`), sticky mobile bar injected by `init.js`.
Inbound: **2 pages only** (its own nav + the duplicate). All town pages, homepage and footers link to `/services/kitchen-remodeling/` or `/services/` instead.

### `/services/kitchen-remodeling/` — `services/kitchen-remodeling/index.html` (1,303 words) — duplicate
Byte-for-byte the same page except title/H1/OG URL/schema name/BreadcrumbList item 3 ("Kitchen Remodeling" vs "Luxury Kitchen Remodeling"). Canonical points at the luxury URL. Inbound: 15 pages (all Template A town pages ×2 cards, application/privacy/terms/thank-you footers). Not in sitemap. This is the page Google will see most links to but be told not to index.

### `/services/custom-bathroom-renovations/` — `services/custom-bathroom-renovations/index.html` (1,348 words)
Sections: `.hero-bath` → "Your Master Bath. Reimagined as a Personal Sanctuary." → "Every Element of Your Sanctuary, Perfectly Executed." → "The Details That Define a Luxury Bathroom" (6 images) → "The B&B Bathroom Design-Build Process" (5 H3s) → "Featured Bathroom Projects" → "What Does a Luxury Bathroom Renovation Cost?" (Essential $20K–$40K…) → `.testimonial-panel` → "Bathroom Renovation FAQs" (6 Qs + schema) → `.cta-panel.corner-ticks-white` → `.areas-served-section` "Custom Bathroom Renovations In Your City" (22 town links).
Schema extras: `Service` with `areaServed: GeoCircle` and `offers: AggregateOffer`.
Inbound: 16 pages (Template A town cards + footers).

**Observation for the expansion:** the `areas-served-section` at the bottom of both service pages is the only existing "service × town" link surface. Its anchor text already targets the intended service × town keyword ("Luxury Kitchen Remodeling in Bryn Mawr, PA") but currently resolves to the general town page.

---

## 6. Blog & portfolio

### Blog
- **Authoring:** append an object to `const ARTICLES = [...]` in `blog/articles-data.js` (2,113 lines). Fields: `id, title, category, tags[], date, datePublished, readTime, excerpt, metaTitle, metaDescription, heroImage, body (HTML template literal), faq[{q,a}]`. Array index 0 is the featured post. Publishing checklist: `docs/content-plan/05-publishing-checklist.md`.
- **URL:** `/blog/article/?id=<id>`. `/journal/*` 308s to `/blog/*`.
- **Rendering:** `blog/index.html` builds featured card + grid from `ARTICLES` (`?filter=<tag>` supported; tags: kitchen, bathroom, design, cost, mainline, bucks, montgomery). `blog/article/index.html:520-724` reads `?id`, sets head tags, injects `Article` schema (author = Organization "B&B Associates", publisher = H&CB with logo, datePublished/dateModified), injects `FAQPage` if `faq[]`, renders hero (`fetchpriority=high`), body, visible FAQ (H2 + H3/P pairs), tag links, sidebar CTA (→ `/consultation/`) and 3 related articles by shared tag.
- **Author schema:** Organization only. No `Person` author, no byline, no author page.
- **Count:** 34 articles. Titles:

| id | title |
|---|---|
| blue-bell-1990s-kitchen-refresh-vs-gut | Your 1990s Blue Bell Kitchen Isn't Broken. It's Just 30 Years Old. |
| horsham-warminster-split-level-kitchen-remodel | The Split-Level Kitchen Problem: What We Do With Horsham and Warminster Kitchens… |
| ambler-fort-washington-old-house-kitchen-wiring-plaster | The Ambler Kitchen With the 100-Amp Panel… |
| lansdale-ardmore-galley-kitchen-small-space | Galley Kitchens in Lansdale Rowhomes and Ardmore Twins… |
| fort-washington-bathroom-mold-ventilation-remodel | The Fort Washington Bathroom That Kept Growing Mold… |
| doylestown-borough-kitchen-remodel-permits-historic | Remodeling a Kitchen in Doylestown Borough: Permits, the Historic District… |
| newtown-pa-remodel-before-selling | Should You Remodel Before Selling in Newtown, PA?… |
| yardley-primary-bathroom-closet-conversion | The Yardley Primary Bath We Built Out of a Closet… |
| gladwyne-bryn-mawr-stone-home-bathroom-remodel | Behind the Stone: What a Gladwyne or Bryn Mawr Bathroom Remodel Actually Runs Into |
| wayne-villanova-spa-bathroom-instead-of-moving | Why Wayne and Villanova Homeowners Are Building Spa Bathrooms… |
| kitchen-remodel-cost-montgomery-county-2026 | How Much Does a Luxury Kitchen Remodel Cost in Montgomery County, PA? (2026 Pricing Guide) |
| luxury-kitchen-cost-guide | The True Cost of a Luxury Kitchen Remodel on the Main Line in 2025 |
| bathroom-remodel-cost-main-line-2026 | How Much Does a High-End Bathroom Remodel Cost on the Main Line? |
| kitchen-remodel-timeline-delays | How Long Does a Full Kitchen Remodel Really Take — and Why Do So Many Run Late? |
| design-build-vs-gc-bucks-montgomery | Design-Build vs. Hiring a Separate Contractor and Designer… |
| how-to-vet-remodeler-ambler-doylestown | How to Vet a Kitchen and Bath Remodeler in the Ambler, Blue Bell & Doylestown Area |
| custom-vs-semi-custom-cabinetry | Custom vs. Semi-Custom Cabinetry: What's Actually Worth It in a Luxury Remodel? |
| living-through-kitchen-remodel-week-by-week | What It's Really Like to Live Through a Kitchen Remodel (Week by Week) |
| doylestown-historic-homes | Doylestown Kitchen Remodeling: What to Expect in a Historic Home |
| design-build-vs-separate | Why Design-Build is Better Than Hiring Separately for Your Bathroom |
| bathroom-tile-trends-2025 | Top Bathroom Tile Trends in the Philadelphia Suburbs — 2025 |
| kitchen-renovation-timeline | How Long Does a Full Kitchen Renovation Take? A PA Contractor's Honest Guide |
| main-line-kitchen-neighborhood-guide | Main Line PA Kitchen Remodeling: A Neighborhood-by-Neighborhood Guide |
| kitchen-cabinet-trends-2025 | Kitchen Cabinet Trends We're Building in 2025 — And What's Already Dated |
| countertop-material-guide | How to Choose the Right Countertop Material for Your Kitchen in 2025 |
| bathroom-remodeling-roi | Bathroom Remodeling ROI: What Adds the Most Value to Your PA Home |
| transitional-vs-modern-kitchen | Transitional vs. Modern Kitchen Design: What Philadelphia Homeowners Are Choosing |
| custom-cabinetry-montgomery-county | The Complete Guide to Custom Cabinetry in Montgomery County |
| heated-bathroom-floors | Heated Bathroom Floors: Are They Worth It in Pennsylvania? |
| bucks-county-older-homes | Bucks County Kitchen Remodeling: What to Expect with Older Homes |
| choosing-remodeling-contractor-philadelphia | How to Pick a Remodeling Contractor in the Philadelphia Suburbs (Without Getting Burned) |
| open-concept-kitchen-costs | Open Concept Kitchen Renovations: What Structural Changes Really Cost |
| main-line-bathroom-trends | Main Line Bathroom Trends: What's Hot in Wayne, Villanova & Bryn Mawr |
| kitchen-island-design-ideas | Kitchen Island Design Ideas for Montgomery County Homes |

Notes: two near-duplicate topic pairs exist (`kitchen-remodel-timeline-delays` vs `kitchen-renovation-timeline`; `design-build-vs-gc-bucks-montgomery` vs `design-build-vs-separate`). Batch 01 articles link to `/contact/#inquiry-form`, a town page, and a service page per the checklist; older articles vary. Article bodies link to `/services/luxury-kitchen-remodeling/` (canonical) — good.

### Portfolio
- **Authoring:** `const projects = [...]` in `js/projects-data.js` (1,205 lines). Fields: `id, title, town, type (Kitchen|Bathroom), year, style, description, highlights[], investment, duration, video, images[], thumbnail, tags[], review{text,author,town,stars,source}`. A trailing IIFE overrides the array from `localStorage.bb_projects` if the admin panel has edited it (browser-local only).
- **URL:** `/portfolio/project/?id=<id>`; grid at `/portfolio/` with `?filter=kitchen|bathroom|montgomery-county|bucks-county|main-line`.
- **Schema:** JS-injected `HomeImprovement` with provider H&CB, `location` (town), `image[]`, single `Review`. No `ImageGallery`, no BreadcrumbList schema.
- **Town field:** 36 of 36 projects have `town: "Pennsylvania"` (no real town) — so location filters on `/portfolio/` match nothing and project pages cannot be tied to service-area pages.
- **Count:** 36 (17 kitchens, 19 bathrooms). IDs: rubin-kitchen, broderick-kitchen, bryn-michaels-kitchen, lee-kitchen, ferrie-kitchen, ganescu-kitchen, giedrycz-kitchen, hess-kitchen, hornig-kitchen, kohl-kitchen, larkin-kitchen, mcbride-kitchen, peterson-kitchen, olaughlin-kitchen, oleg-kitchen, prager-kitchen, slingsby-kitchen, barenbaum-bathroom, borgia-bathroom, bridlehall-bathroom, frank-bathroom, cruz-bathroom, emad-bathroom, garvey-bathroom, giedrycz-bathroom, guttridge-bathroom, hartka-bathroom, hershey-bathroom, kaarby-bathroom, lashannon-bathroom, levinson-bathroom, petev-bathroom, odonnell-bathroom, sharada-bathroom, goldberg-bathroom, vartanian-bathroom.
- Media lives in `portfolio/KITCHENS/<Client folder>/` and `portfolio/BATHROOMS/<Client folder>/` (2.0 GB, 499 tracked files, folder names contain client surnames and spaces/ampersands in URLs).

---

## 7. Internal linking & navigation

### Header nav (identical markup copied into every page; `index.html` nav block)
Home `/` · Services `/services/` · Portfolio `/portfolio/` (dropdown: All Projects, Kitchens `?filter=kitchen`, Bathrooms `?filter=bathroom`) · Company `/about/` (dropdown: About B&B, Testimonials `/reviews/`) · Service Areas `/service-areas/` · Contact `/contact/` · CTA "Call Now" `tel:+12674028758` · CTA "Inquiry Form" `/contact/#inquiry-form`. Mobile drawer mirrors it. `init.js` also injects a sticky mobile bar (Call Now + Inquire Here → `/contact/`). **The two service detail pages are not in the nav.**

### Footer
Four columns, copied per page with **~25 distinct variants** across 45 files (hash of footer hrefs). Baseline (`index.html`):
- Navigation: Home, Services, Showroom, Portfolio, About, Contact, Inquiry Form, Blog.
- Services: "Luxury Kitchen Remodeling" → `/services/` (not the detail page), "Custom Bathroom Renovations" → `/services/`, Ambler Design Showroom, Client Reviews. Only application/privacy/terms/thank-you footers link to the real detail pages (and to the non-canonical `/services/kitchen-remodeling/`).
- Service Areas column — the exact town set varies by page group:

| Page group | Footer service-area links |
|---|---|
| Homepage, about, consultation, 3 service pages | View all areas, Main Line PA, Doylestown & New Hope, Wayne & Villanova, Blue Bell & North Wales, Newtown PA, Ambler PA |
| application, privacy, terms, thank-you | same 7 |
| blog index, contact, portfolio, reviews, services hub, showroom | Ambler, Blue Bell (×2), Lower Gwynedd, Newtown, Doylestown (×2), Wayne & Villanova (×2), Bryn Mawr, View all |
| blog article | Ambler, Blue Bell, Lower Gwynedd, Newtown, Doylestown, Wayne & Villanova, Bryn Mawr, View all |
| Each Template B town page | Ambler, Blue Bell, {self}, Newtown, Doylestown, (Wayne & Villanova or Bryn Mawr), Main Line, View all (grouped under "Montgomery County / Bucks County / Main Line" labels) |
| Template A town pages | 5–6 regional siblings (e.g. Ambler: Main Line, Doylestown, Wayne, Blue Bell, Newtown, self) |
- Stay Connected: newsletter `<form class="footer-newsletter-form">` (**no handler — submits as a GET reload of the page**), phone, email, address, Instagram/Facebook/TikTok, Privacy, Terms.
- Every footer also contains a hidden `/admin/index.html` link target (34 pages) via the 6-click logo script.

### Inbound link counts (distinct pages linking, body-only in parentheses)
`/contact/` 41 (29) · `/portfolio/` 41 (23) · `/showroom/` 41 (24) · `/service-areas/ambler-…/` 41 (15) · `/service-areas/` 41 (11) · `/service-areas/doylestown-…/` 39 (11) · `/service-areas/newtown-…/` 39 (10) · `/service-areas/wayne-villanova-…/` 38 (12) · `/service-areas/blue-bell-…/` 37 (11) · `/service-areas/main-line-pa-remodeling/` 33 (12) · `/service-areas/bryn-mawr-…/` 18 (10) · `/service-areas/lower-gwynedd-…/` 17 (10) · `/services/custom-bathroom-renovations/` 16 (11) · `/services/kitchen-remodeling/` 15 (9) · `/service-areas/bucks-county/` 12 (8) · `/service-areas/montgomery-county/` 10 (8) · `/service-areas/horsham-…/` 10 (9) · remaining 11 Template B towns 6–9 each (5–8 body) · **`/services/luxury-kitchen-remodeling/` 2 (1)** · `/consultation/` 2 (1) · `/blog/article/` 2 · `/reviews/` 41 (9) · `/about/` 41 (1) · `/services/` 41 (1).

**Orphans (0 inbound):** `/application/` (in sitemap), `/thank-you/`, `/admin/`, both redirect stubs.
**Broken internal links:** none found (all `href="/…"` targets resolve to existing files).

### Related-content / breadcrumb components
- Visible breadcrumb: `nav.sa-hero-breadcrumb` on 27 pages (all town pages, 3 service pages, portfolio project shell, LP). Not on hub pages or homepage.
- "Also Serving Nearby … Communities" link strip on 9 of 14 Template B pages (§3c item 7), inline-styled, not a shared component.
- `areas-served-section` (22 town links) on both service pages.
- Blog article sidebar: 3 related articles by tag (`.sidebar-related-card`). Portfolio project: 3 related projects by type (`.related-projects`).
- Homepage: a service-areas grid with one link to every one of the 22 town pages (`index.html`, H2 "Custom Kitchen & Bathroom Remodeling Throughout Montgomery, Bucks…").
- No "related town pages" component exists on Template A pages beyond inline prose links.

---

## 8. Conversion & tracking (document only — nothing here should be altered)

| Item | Where | Detail |
|---|---|---|
| GTM | Head of every real page, first script (`index.html:4-9`, `service-areas/berwyn-pa-remodeling/index.html:4-9`, etc.) | Container `GTM-KZZXTRLG`. Not on the two redirect stubs. `<noscript>` GTM iframe present. |
| GA4 | Not in code | No `G-` measurement ID anywhere; GA4 is configured inside GTM per `ANALYTICS-SETUP.md` §B. |
| First-party analytics | `/js/analytics.js` on every public page except LP, application, privacy, terms, thank-you, stubs | POSTs `pageview`, `session`, `click`, `conversion`, `location` rows to Supabase REST `analytics_events` with the anon key; mirrors to `localStorage.bb_analytics`; pushes `dataLayer.push({event:'bb_conversion', conversion_type, conversion_label, conversion_href})`. Calls `https://ipapi.co/json/` once per session for city/region. |
| Phone click tracking | `js/analytics.js:129-157` | Any click whose nearest `<a>` has `href^="tel:"` is classified `conversion: 'call'` and fired to Supabase + dataLayer. All phone links are `tel:+12674028758`. Directions (Google Maps hrefs) → `'directions'`; `/estimator`/`bbestimator` hrefs → `'estimator_start'`. |
| Form submit tracking | `js/analytics.js:162-166` | Global capture-phase `submit` listener fires `bbTrack('form', …)` for every form, including the footer newsletter. |
| Contact inquiry form | `contact/index.html:763` (`#inquiry-form`), fields rendered from `BB_FORM_CONFIG` (localStorage override) at `contact/index.html:~930`; submit handler `contact/index.html:1035-1066` | On submit: `preventDefault` → push lead to `localStorage.bb_leads` → `BB.Supabase.insertLead()` into `leads` → **POST `FormData` to GoHighLevel** `https://links.legacylinqdigital.com/widget/form/Ey8fdi6O3JIdS1xYUhkw` (`mode:'no-cors'`, formId `Ey8fdi6O3JIdS1xYUhkw`) → inline "✓ Sent!" note, fields cleared. No redirect to `/thank-you/`. GHL `form_embed.js` is also loaded. |
| Town-page lead forms | `<form class="town-form">` / `<form class="sa-lead-form">` with `data-service-area`, handled by `/js/service-area-lead.js` | localStorage `bb_leads` + Supabase `leads` (`type:'service_area'`, `service_area` = town). **No GoHighLevel call, no email** — town leads surface only in Supabase/admin. Shows `.sa-lead-thankyou` or an `alert()`. |
| Consultation multi-step form | `consultation/index.html` + `/js/consultation.js:168-198` | localStorage + Supabase (`type:'consultation'`, budget/timeline/homeValue/town). Comment at line 198 admits no production handler. Budget gate below $25K. No GHL. |
| Paid LP form | `kitchen-bathroom-renovation-design/index.html:1795` | GoHighLevel inline iframe `https://links.legacylinqdigital.com/widget/form/mkEFVx2YpX8rTVAlMtgR` (`#inline-mkEFVx2YpX8rTVAlMtgR`). Legacy native-form handler is guarded dead code (lines 2375-2400). |
| Application form | `application/index.html:461` | `action="/thank-you/" method="GET"` — submits applicant fields as a query string to the thank-you page; nothing stores them. |
| Footer newsletter | every footer | No handler; default GET submit reloads the page with `?email=`. |
| Thank-you page | `thank-you/index.html` | `noindex, follow`; loads GTM; only reached by the application form. |
| Supabase | `js/supabase-client.js` (anon key hardcoded), `db/analytics_events.sql`, `.env` | Tables `leads`, `analytics_events`. Admin panel reads them (`admin/js/admin-crm.js`, `admin-analytics.js`). |
| Estimator | removed | `/estimator` → `/contact/` (307). `analytics.js` still listens for `postMessage({bb:'estimator_complete'})` from `bbestimator.com`. No page references bbestimator any more. |

### Paid landing page — DO NOT TOUCH
- **Route:** `/kitchen-bathroom-renovation-design/` — confirmed to exist.
- **Files that render it:** `kitchen-bathroom-renovation-design/index.html` (131 KB, self-contained inline CSS + JS; loads `/css/design-system.css`, `/css/components.css`, `/js/supabase-client.js`, `/js/projects-data.js`, Supabase CDN, GHL `form_embed.js`).
- **Shared files it depends on (changes there affect the LP):** `css/design-system.css`, `css/components.css`, `js/supabase-client.js`, `js/projects-data.js`.
- **Redirect feeders:** `vercel.json` entries for `/Kitchen-Bathroom-Remodeling-montgomery-county-pa` and lowercase variant; stub `Kitchen-Bathroom-Remodeling-montgomery-county-pa/index.html`.
- `robots: noindex, nofollow`, canonical self, no OG tags, no `analytics.js` (GTM only). 6 `tel:` links. Google Guaranteed badge, inline reviews expander (commit `77a5864`).

---

## 9. Images & performance

| Area | Finding |
|---|---|
| Formats on disk | `IMAGES/` + `portfolio/`: 307 JPEG, 83 JPG, 75 PNG, 50 WebP, 53 MP4, 47 MOV, 20 HEIC, 13 TIF; 364 MB + 2.0 GB. No optimisation pipeline, no build-time resizing, no `srcset`/`<picture>` anywhere (0 `<picture>` tags sitewide). |
| Oversized assets served as-is | `portfolio/KITCHENS/BB-OLaughlin-kitchen/*.jpeg` are 12–20 MB each and are referenced directly by `js/projects-data.js` (project page + lightbox). `portfolio/BATHROOMS/B&B - Stacey Goldberg bathroom/2435.jpg` 8.7 MB. Blog `heroImage` and 6 town-page `og:image`s point at raw portfolio JPEGs (e.g. `B&B - Prager-kitchen/….jpeg`) with spaces and `&` in the path. |
| WebP usage | Only marketing images in `IMAGES/*.webp` (homepage hero `Custom-Kitchen-Ambler-Pa.webp` is `<link rel=preload as=image>`; town pages reuse `Custom-Kitchen-Ambler-Pa.webp` / `Custom-Kitchen-Main-Line.webp`). |
| Lazy loading | Partial: homepage 9/11 imgs, service pages 6–8 of 7–9, town pages 1 of 2, LP 40/45. Blog/portfolio grids lazy-load via JS templates; article hero uses `fetchpriority="high"`. |
| Dimensions (CLS) | `width`/`height` attributes present on service-page material images and some town-page images; **absent** on homepage (0/11), blog, portfolio, hub pages. JS-rendered grids and article/project heroes have no reserved aspect ratio → layout shift risk. |
| Fonts | Google Fonts Cormorant Garamond + Manrope via `<link>` with `preconnect`. Homepage uses `display=block` (FOIT); all other pages `display=swap`. |
| CSS | Two shared stylesheets (~2,300 lines) plus **large inline `<style>` per page** (homepage ≈61 KB across 2 blocks, town pages ≈17 KB, LP much larger). Render-blocking by nature; no critical-CSS split; inline styles are duplicated per page rather than cached. |
| JS | All scripts at end of `<body>`, none `defer`/`async`. Lenis + GSAP + ScrollTrigger from two CDNs on 26 pages; Supabase UMD (~150 KB) on every town page, contact, consultation, LP. `analytics.js` fires a third-party `ipapi.co` request per session. |
| Video | Homepage: 9 `<video autoplay>` with `preload="auto"` (portfolio MP4s from `js/data-layer.js` / `projects-data.js`) — heavy initial payload on mobile. |
| Animations | GSAP `.reveal` sets `opacity:0; y:50` from JS on scroll — content is invisible until JS runs (FOUC handled by commit `4bc04e8` on homepage only). Lenis smooth scroll overrides native scroll on all GSAP pages. |
| **JS dependency gap (verify in browser)** | `js/init.js:9-17` executes `new Lenis(...)`, `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(...)` unguarded at top level. 19 pages load `/js/init.js` without GSAP/ScrollTrigger (all 14 Template B town pages, `service-areas/index.html`, `thank-you`, `privacy-policy`, `terms-of-service`, `application`); `service-areas/index.html`, `thank-you`, `privacy-policy`, `terms-of-service`, `application` also lack Lenis. A `ReferenceError` there aborts the rest of `init.js`, so the injected mobile CTA bar, hamburger open/close, dropdown toggles and `.reveal` animations would not initialise on those pages. Template B FAQ accordions are unaffected (they use their own inline handler, e.g. `service-areas/berwyn-pa-remodeling/index.html:~795`). This is a code-level inference; confirm on a phone before relying on it. |
| Other | `og:image` on 6 town pages and all blog articles uses unoptimised portfolio JPEGs (social previews may time out). `geo.position` meta on every town page is Ambler's coordinates. |

---

## 10. Reusability assessment for service × town pages (e.g. `/service-areas/kitchen-remodeling/bryn-mawr-pa/`)

### What can be reused as-is
| Asset | Reuse |
|---|---|
| `css/design-system.css`, `css/components.css` | Tokens, buttons (`.phil-btn`, `.btn-ghost`), `.sa-hero`, `.sa-hero-breadcrumb`, accordion, footer, nav styles. |
| Template B page skeleton (`service-areas/berwyn-pa-remodeling/index.html`) | Hero + breadcrumb + intro + `town-services` card + `town-form-section` + `town-faq` + `cta-panel` + nearby strip is the right section order for a service × town page; drop one of the two service cards. |
| `js/service-area-lead.js` | Already keys leads by `data-service-area`; a service × town form can pass `data-service-area="Bryn Mawr — Kitchen"` with no code change. |
| `js/business-config.js` | NAP for schema/footer. |
| `areas-served-section` markup on the two service pages | Existing 22-link block whose anchor text already matches the target keywords; only `href`s need to change. |
| Cost tiers, process steps, FAQ pools | Copy exists on `services/luxury-kitchen-remodeling/index.html` / `custom-bathroom-renovations/index.html` and can be sliced per service. |
| Blog Batch 01 articles | 10 town-specific articles already exist to link from/to (`blue-bell…`, `horsham-warminster…`, `gladwyne-bryn-mawr…`, etc.). |

### What must be built new
1. **A town data file** (`data/towns.json` or a JS module) — slug, name, county, township(s), neighbourhoods, neighbours, distance phrase, permit office, housing stock notes, coordinates, hero/OG image, per-service FAQ overrides. Nothing like it exists.
2. **A service data file** — two services with headline, intro, deliverables, cost tiers, process, FAQ pool, image set.
3. **A page template** (HTML with placeholders) and **a generator script** (Node, ~150 lines) that writes `service-areas/<service>/<town>/index.html`, emits JSON-LD (Service + H&CB + BreadcrumbList(4) + FAQPage) from data, and regenerates `sitemap.xml`. There is no build step today, so this is net-new tooling; it can stay a plain `node build.js` committed alongside the output so Vercel keeps serving static files.
4. **Shared partials for nav/footer** (or accept that the generator stamps them) — today ~25 footer variants exist; a generator is the first chance to unify the "Service Areas" footer column.
5. **Link plumbing**: repoint the 44 `areas-served-section` links, add a service-selector block on each general town page, add the new pages to the homepage grid or a hub, fix the two wrong chips, and route internal links at `/services/luxury-kitchen-remodeling/` instead of the duplicate.
6. **Unique-content budget per page**: the generator can only produce boilerplate; each service × town page still needs ~300–500 words of town-specific copy and 4–6 FAQs to avoid being a thinner clone of the general town page. Plan the copy in `docs/content-plan/02-keyword-location-matrix.md` terms.
7. Optional but valuable: a `meta`/head partial so title/description/canonical/OG/geo come from data, and `geo.position` set per town rather than Ambler.

### Verdict
**Page-by-page in the current codebase; data-file-plus-template if you add a ~1-day build script.** With 22 towns × 2 services = 44 pages (plus regenerating the 22 general town pages from the same data), hand-copying 44 more 55 KB files with three hand-synced JSON-LD blocks each is the failure mode this site is already showing (25 footer variants, wrong chips, duplicate kitchen page, stale sitemap). The data + generator route also fixes the sitemap, breadcrumb, and footer consistency problems in one pass and keeps deployment unchanged (static files on Vercel).

---

## Appendix A — Quick fix list surfaced during the audit (not actioned)

1. `service-areas/index.html:353` Warminster chip → should be `/service-areas/warminster-pa-remodeling/`.
2. `service-areas/index.html` first "Bryn Mawr" chip → should be `/service-areas/bryn-mawr-pa-remodeling/`; remove the duplicate chip.
3. Repoint all `href="/services/kitchen-remodeling/"` (15 pages) to `/services/luxury-kitchen-remodeling/`, then add a `vercel.json` redirect for the duplicate.
4. Footer "Services" column on 40+ pages links to `/services/` instead of the detail pages.
5. Add `FAQPage` schema to `services/index.html` (10 visible Qs already there).
6. Add the 17 missing articles and (if desired) 36 projects to `sitemap.xml`; refresh `lastmod`.
7. Add GSAP/ScrollTrigger (or a guard in `js/init.js`) on the 19 pages listed in §9.
8. Town-page leads bypass GoHighLevel — decide whether `js/service-area-lead.js` should also POST to the GHL form like `contact/index.html` does.
9. Create `llms.txt`.
10. Rotate and untrack `.env` (service-role key) and strip the token from the git remote URL.

## Appendix B — Files referenced most often in this report

`vercel.json` · `robots.txt` · `sitemap.xml` · `index.html` · `service-areas/index.html` · `service-areas/berwyn-pa-remodeling/index.html` (Template B exemplar) · `service-areas/ambler-pa-remodeling-contractor/index.html` (Template A exemplar) · `services/luxury-kitchen-remodeling/index.html` · `services/kitchen-remodeling/index.html` · `services/custom-bathroom-renovations/index.html` · `blog/articles-data.js` · `blog/article/index.html` · `js/projects-data.js` · `portfolio/project/index.html` · `js/init.js` · `js/analytics.js` · `js/business-config.js` · `js/service-area-lead.js` · `js/supabase-client.js` · `contact/index.html` · `kitchen-bathroom-renovation-design/index.html` (DO NOT TOUCH) · `css/components.css` · `docs/content-plan/05-publishing-checklist.md` · `ANALYTICS-SETUP.md`.
