# B&B Associates — SEO / GEO Action Plan
**Date:** September 24, 2026 · **Based on:** `2026-09-23-trends-ai-visibility-gsc-report.md` and a read of the current codebase
**Two columns:** what Claude will do in the repo, and what Joshua or Michael must do outside it. Nothing below has been started yet; this is the plan for approval.

---

## The three problems the research found

1. **Visibility without clicks.** The four Bucks/Montgomery town pages earned ~15,500 impressions in 90 days and 9 clicks. Positions 6–20, CTR 0–0.1%. The pages rank; the listings don't get chosen.
2. **Bucks County is invisible in AI answers.** B&B was named in 6/6 Ambler answers and 0/6 Doylestown answers. LBK Design Build, Lang's, Sycamore, Armitage and Buckingham Bath own Newtown and Doylestown. AI engines cite Houzz first (44 citations), then Angi, HomeAdvisor, Thumbtack, BBB; Google AI Mode uses Google Business Profile almost exclusively.
3. **Indexing debt.** 190 URLs not indexed: 124 are 404s, 21 crawled-not-indexed, 14 noindex, 11 redirects.

Plus two demand signals to build toward: **cost** is the #1 query family in every Trends window, and **custom cabinets** is the one rising niche term (3× its 5-year average).

---

## PART A — What Claude will do in the codebase

Ordered by impact ÷ effort. Each item names the files it touches. All changes go through the existing generator and config where one exists, so nothing forks.

### A1. Rewrite titles and meta descriptions on all 22 town pages (Week 1, highest impact)
**Why:** Zero clicks on queries already on page 1: "luxury kitchen design newtown" pos 6.7, "custom kitchens newtown" 5.3, "remodel contractors new hope" 3.9, "luxury kitchen design new hope" 3.8, "kitchen design and build yardley" 7.7, "bathroom remodeling contractor near me with reviews?" 6.0.
**What:** Rewrite each `<title>`, meta description and OG title using the exact query language GSC shows for that page. Front-load the town, add the trust hook the 5.0★ / 183-review count gives us, and use "remodel" over "renovation" (5–10× the search volume).
- Newtown → "Custom Kitchens & Luxury Kitchen Design in Newtown, PA | Design-Build Remodeler"
- Doylestown/New Hope → "Kitchen Design-Build & Luxury Remodeling in Doylestown & New Hope, PA"
- Yardley → "Kitchen Design & Build in Yardley, PA | Kitchen & Bathroom Remodeling Company"
- Flourtown → lead with bathroom (630 impressions on "bathroom remodeling near me" vs 298 kitchen)
- Remaining 18 pages: same method using `seo-data/Queries.csv` per page.
**Files:** `service-areas/*/index.html` (22), `data/towns.json` + `scripts/build-town-pages.js` for the 16 generated pages.

### A2. Stop the "Bath, PA" confusion (Week 1, 30 minutes)
**Why:** The Flourtown page is being served for "kitchen remodeling bath pa", "home remodeling bath pa" and "moore township pa" (Northampton County). Trends city panels show the same conflation. The trigger is the phrase "Kitchen & Bath Remodeling", present in 15 files.
**What:** Replace "Kitchen & Bath Remodeling" / "Kitchen & Bath Carpenter" with "Kitchen & Bathroom Remodeling" in headings, alt text and copy sitewide. Keep "bath" only where it means a tub.
**Files:** 16 HTML files.

### A3. Add AI-style FAQ questions to every town page (Week 1)
**Why:** Search Console already shows full-sentence queries ranking 6–8: "best bathroom remodeler for tile and flooring near me?", "what's a good bathroom remodeler near me?", "bathroom remodeling contractor near me with reviews?". These mirror the AI-engine prompts. The bathroom prompts across all engines rewarded firms with explicit tile-work language (CT Tile, Tile Invictus, Harper Tile).
**What:** Add three FAQs per town page, in visible HTML and in the existing FAQPage JSON-LD: "Who is the best bathroom remodeler for tile work near [town]?", "Which kitchen remodeler in [town] has the best reviews?", "How do I choose a luxury kitchen remodeler in [town], PA?". Answers name B&B, the town, the review count, the license number, and specific tile capabilities (large-format porcelain, heated floors, curbless showers, custom niches). Add a short "Tile & Shower Work" paragraph to each bathroom section.
**Files:** 22 town pages, `data/towns.json` FAQ block, generator.

### A4. Redirect the 124 404s and clean up indexing (Week 1–2)
**What:**
- Pull the 404 URL list from Search Console (read-only export via the browser), map each to its replacement, and add 301s to `vercel.json`. The crawled article still links to `/services/kitchen-remodeling/`, so most are likely legacy service and journal paths.
- Delete the duplicate `services/kitchen-remodeling/` directory (already redirected in `vercel.json`; the directory's presence is what makes it a "page with redirect" row).
- Pull the 21 "crawled – currently not indexed" and 8 "discovered" URLs, check each for thin or duplicate content, and either strengthen or canonicalize.
- Confirm the 14 noindex URLs are intentional (repo has 5 noindex files; GSC reports 14, so 9 are unaccounted for).
- Resolve the single soft 404 and the single 403.
- Refresh `sitemap.xml` lastmod and `llms.txt`.
**Files:** `vercel.json`, `sitemap.xml`, `llms.txt`, possibly a few pages.

### A5. Build two evergreen cost pages (Week 2)
**Why:** "kitchen remodel cost" and "bathroom remodel cost" are the #1 related query in every Trends window; "how much does it cost to remodel a kitchen/bathroom" rising +70%/+60%; "one day bathroom remodel cost" is a Breakout. The site has three cost articles in the journal but no landing page that a service page or nav can send people to.
**What:** Create `/kitchen-remodel-cost/` and `/bathroom-remodel-cost/` as Pennsylvania cost guides for Montgomery County, Bucks County and the Main Line: tiered cost table using the ranges already published on the site, what drives cost, timeline, financing note, FAQ schema, and links to the three existing cost articles and the timeline article. Link both from the services nav, both service pages, every town page FAQ answer about cost, and the homepage.
**Files:** two new page directories, nav partial, service pages, `sitemap.xml`.

### A6. Extend the service × town generator to Bucks County (Week 2)
**Why:** B&B is absent from AI answers for Doylestown and Newtown, and Trends shows "Bucks County" rising +140% as a related topic for kitchen remodel. The generator currently covers 8 towns, of which only Newtown is in Bucks.
**What:** Add Doylestown, New Hope, Yardley, Langhorne (the one Bucks town that surfaces in Trends city data), Horsham, Warrington and Chalfont to `data/towns.json` with unique kitchen and bathroom copy, run the generator, and wire the nearby-town and service links. Result: 14 new service × town pages. Strengthen the `/service-areas/bucks-county/` hub with the Bucks testimonials already on the site (Marino/Newtown, Williams and Holloway/Doylestown).
**Files:** `data/towns.json`, generated pages, hub page, sitemap, llms.txt.

### A7. Create a Custom Cabinetry service page (Week 2–3)
**Why:** Custom cabinets is the only rising term in the niche comparison; "kitchen cabinet remodel" +80%, "hickory kitchen cabinet remodel" Breakout. Two journal articles already cover it with no service page to rank.
**What:** `/services/custom-cabinetry/` with the 60+ supplier partner angle, wood species and finish options, custom vs semi-custom, cost band, portfolio strip, FAQ schema; link from both journal articles, the kitchen service page and the nav.
**Files:** new page, `services/luxury-kitchen-remodeling/index.html`, `blog/articles-data.js`, nav.

### A8. Strengthen entity signals in schema (Week 3)
**What:** In `js/business-config.js` and the static JSON-LD: add the HomeAdvisor profile URL (ChatGPT cited it 4×), BBB profile, Google Maps/GBP URL and Yelp to `sameAs` on every page, not just the homepage; add `knowsAbout` (kitchen remodeling, bathroom remodeling, custom cabinetry, tile installation, design-build); make `areaServed` list all 22 towns plus Bucks and Montgomery counties; put the tile-specific reviews from `reviews/index.html` into Review schema on the bathroom service page.
**Files:** `js/business-config.js`, `index.html`, service pages, generator.

### A9. Seasonal content calendar and internal links (Week 3)
**What:** Update `docs/content-plan/04-editorial-calendar.md` so the next two content batches publish in November (for the January–March demand window) and May (for July). Add contextual links from the 34 journal articles to the new cost, cabinetry and Bucks pages.

### A10. Small consistency fixes (Week 3)
- Showroom naming: implement whichever decision is made in B3 below.
- Founding year, project count and review count made consistent sitewide once B4 is answered.
- Homepage title keeps "Ambler, PA" (higher volume, 19002 zip); address prose stays Maple Glen.

**What Claude will not do without an explicit go-ahead:** push to the remote, change Vercel settings, delete portfolio media, or publish anything on external platforms.

---

## PART B — What Joshua or Michael must do

These are the actions that move AI-engine answers and the map pack, and none of them can be done from the codebase.

### B1. Houzz (highest leverage, this week)
Houzz was the #1 cited domain on ChatGPT and Perplexity (44 citations) and B&B's profile was not cited once. The profile exists at houzz.com/professionals/home-builders/bandb-associates-pfvwus-pf~1637622775 but is filed under "Home Builders".
- Change the category to **Kitchen & Bath Remodelers**.
- Upload 30+ project photos, each tagged with the real town and the room type. Every competitor that beat B&B in Newtown/Doylestown had a Houzz profile with town-tagged projects.
- Request Houzz reviews from the last 10–15 clients. Target: 10 reviews in 60 days.
- Fill the service-area list with all 22 towns and both counties.

### B2. Google Business Profile (this week, then weekly)
Google AI Mode built every one of its 12 answers from GBP listings and review counts, not from websites.
- Primary category "Kitchen remodeler", secondary "Bathroom remodeler", "Cabinet maker", "Tile contractor".
- Review request script that asks the client to mention **the town and the specific work** ("tile shower in Doylestown"). AI Mode surfaced firms whose reviews contained "tile"; B&B's 65 Google reviews rarely do.
- Seed the GBP Q&A section with the same AI-style questions from A3 and answer them.
- Post weekly (one project photo, one town) and add 5+ photos a week for 8 weeks.
- Confirm the GBP address matches the site (Maple Glen, 1141 E Welsh Rd). If GBP says Ambler, tell Claude and the schema will follow GBP.

### B3. Decide the showroom story
Site says "Ambler Design Showroom, opening Winter 2026" in some places and "Winter 2026/2027" in others, while the showroom page lists the Maple Glen address. Choose one name, one location line and one date. Recommendation: "Design Showroom in Maple Glen, serving Ambler and Upper Dublin".

### B4. Confirm the facts the site repeats
From `verification-needed.md`, still open: founding year (2013 vs 1999), project count (600+ vs 1,200+), review count (183), and the town for each of the 36 portfolio projects. The last one matters most: the Bucks County pages need real Bucks projects and AI engines need town-specific proof.

### B5. Supply Bucks County proof
Three to five finished projects in Doylestown, New Hope, Newtown or Yardley: photos, town, one client sentence. These go on the Bucks pages, the Houzz profile and GBP. Without them the Bucks pages are copy with no evidence, and that is exactly what LBK and Lang's beat us with.

### B6. Third-party trust signals
- **BBB:** cited 8× in AI answers and "better business bureau" was a +3,950% rising query for bathroom remodel in PA. Get accredited.
- **Angi / HomeAdvisor:** keep the profiles current; the HomeAdvisor profile drove ChatGPT's mentions.
- **Awards and press:** LBK was cited via chrysalisawards.com; Main Line Today and House Magazine were cited for competitors. Enter the Chrysalis and NARI CotY awards, and pitch one project to Main Line Today and Bucks County Herald.

### B7. Deploy and verify
- Push the unpushed commits once Part A lands, confirm the Vercel deploy, then in Search Console click "Validate fix" on the 404 and redirect rows.
- Re-run the AI visibility test monthly from a **logged-out** browser (the September run was personalized for AI Mode and ChatGPT). Test Gemini on the Flash model, since Pro errored on every attempt.

### B8. Budget timing
Demand peaks January–March and July; lows are September–December. Ramp ads and outreach in December and June. The next 10 weeks are the softest quarter; use them to ship A1–A10 and B1–B6 so the site is ready for the January window.

---

## Sequence and what to expect

| Week | Claude ships | Joshua / Michael do |
|---|---|---|
| 1 | A1 titles/meta, A2 "bath" fix, A3 AI-style FAQs, A4 redirects | B1 Houzz category + photos, B2 GBP categories + review script, B3 + B4 decisions |
| 2 | A5 cost pages, A6 Bucks generator pages | B5 Bucks project proof, B6 BBB application |
| 3 | A7 cabinetry page, A8 schema, A9 calendar, A10 consistency | B7 push + validate in GSC |
| 4+ | Monthly re-test, next content batch | Weekly GBP posts, Houzz reviews, awards entries |

**Realistic outcome markers, 90 days out:** town-page CTR from 0% to 2–4% on ~15,000 quarterly impressions (roughly 300–600 clicks that currently don't exist), B&B named in at least one AI answer for Doylestown and Newtown, 404 count near zero, Houzz profile appearing as a citation. These depend on B1, B2 and B5 happening; the code changes alone fix clicks but not the AI answers.

---

## Status — September 24, 2026 (branch `seo-geo-sprint-2026-09`, 10 commits, not merged)

| Item | Status | Where |
|---|---|---|
| A1 titles + meta | Shipped, 26 pages | `data/seo-meta.json`, `scripts/apply-seo-meta.py` |
| A2 "Kitchen & Bath" → "Bathroom" | Shipped, 17 files | validator rule `bath-phrase` |
| A3 AI-style FAQs + tile paragraph | Shipped, 22 hand-built + 30 generated | `data/seo-faqs.json`, `scripts/apply-seo-faqs.py`, `services.json → faqAlways` |
| A4 redirects + indexing cleanup | Shipped, 76 rules, duplicate dir removed | `vercel.json` |
| A5 cost guides | Shipped: `/kitchen-remodel-cost/`, `/bathroom-remodel-cost/` | `data/guides.json`, `scripts/build-guide-pages.js` |
| A6 Bucks County build-out | Shipped, 7 towns / 14 pages (30 generated total) | `data/towns.json`, `scripts/add-bucks-towns-2026-09.py` |
| A7 custom cabinetry page | Shipped: `/services/custom-cabinetry/` | `data/guides.json` |
| A8 entity schema | Shipped, 66 pages + generators | `scripts/apply-seo-schema.py` |
| A9 calendar + cross-links + llms.txt | Shipped, 20 articles | `blog/articles-data.js`, `docs/content-plan/04-editorial-calendar.md` |
| A10 consistency | **Waiting on B3/B4 decisions** (showroom name, founding year, project count) | `verification-needed.md §6` |

Gate: `node scripts/validate-seo.js` → 0 errors. Both generators rebuild diff-free. Fresh-context review: 0 critical, 2 important (fixed), minors deferred (listed in the branch's final commit message and below).

**Deferred minors:** two-hop redirect chains for three rare legacy URLs; `/blog/article.html` and `/portfolio/project.html` without an id still 404; `/:slug.html` would shadow a future root `.html` file (e.g. a verification file); validator doesn't check internal links or FAQ/schema sync (reviewer ran both manually, 0 issues); pre-existing "1999 / 25 years" copy on about, kitchen service page and journal.

**Decisions made without you (revert any you disagree with):** title-length ceiling 70 chars; bathroom service page title says "Remodeling" not "Renovations"; cost tiers = the service-page tiers; cabinetry page built on the town-page template; Horsham added to the generator; new-town coordinates/drive times from general knowledge (flagged); generated hero stat 25+ → 13+ years; cabinetry page and Yardley FAQ say refacing is not a standalone service (matches llms.txt); old cabinet-post URLs redirect to the cabinetry page; no BBB/GBP/Yelp URLs invented for schema.
