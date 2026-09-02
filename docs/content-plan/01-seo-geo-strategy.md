# 01 — SEO + GEO Strategy for the B&B Journal

_Last updated: 2026-09-02_

## The goal in one line
Be the source Google **and** the AI answer engines (Google AI Overviews, ChatGPT, Perplexity, Gemini, Copilot) quote when someone in Montgomery County, Bucks County, or the Main Line asks anything about remodeling a kitchen or bathroom.

## Two audiences, one article
| | Classic local SEO | GEO (Generative Engine Optimization) |
|---|---|---|
| Who reads it | A person scanning results | An LLM deciding what to cite |
| What wins | Keyword-aligned title/H1, location signals, internal links, schema, dwell time | Answer-first paragraphs, quotable specifics, first-hand experience, consistent entity facts, FAQ blocks, clean structure |
| Failure mode | Generic national content with a town name pasted in | Vague, hedge-everything prose with no numbers or lived detail |

The same article can serve both if it follows the rules below.

## Why anecdotal content is the right bet
1. **Experience is the moat.** National cost sites cannot say "the plaster in a 1930s Ambler colonial does X." A 25-year local firm can. Google's E-E-A-T explicitly rewards first-hand experience; LLMs preferentially cite passages that contain concrete, situational detail.
2. **Stories carry keywords naturally.** "A couple in Blue Bell with a 1960s split-level kitchen" contains the town, the housing stock, and the room, without keyword stuffing.
3. **Problem → solution → why matches search intent.** People search the problem ("kitchen too small," "bathroom fan not venting," "quote way higher than online") long before they search the vendor.

## Article rules (every piece in every batch)
### Structure
- **Answer first.** The opening paragraph gives the direct answer, number, or verdict in 2–3 sentences. AI engines lift this. Never open with throat-clearing.
- **One H1 (the title). H2s phrased as questions or claims** a person would actually ask. H3s for tiers/options.
- **A "Problem / What we did / Why it matters" spine** for anecdotal pieces. Each anecdote is 1–3 paragraphs, then a general lesson.
- **Numbers in every article.** Cost ranges, weeks, square footage, amp ratings, tile sizes. Keep them consistent with the published ranges (see `bb_business_facts`): kitchens $45K–$150K+ (2026 tiers $55–75K / $75–110K / $110–150K+), bathrooms $38K–$85K, spa suites $85K–$100K+.
- **A 4–6 question FAQ** using the `faq` field. The site renders it visibly and as `FAQPage` schema from the same data. Questions must be phrased the way people type/speak them ("How much does…", "Is it worth…", "Do I need a permit to…").
- **1,200–1,900 words.** Long enough to be authoritative, short enough that every paragraph earns its place.

### Location handling
- Lead location in the **title, first paragraph, one H2, and the FAQ.** Secondary towns appear naturally in the anecdotes.
- Use both forms: "kitchen remodel" (volume in Montgomery/Bucks) and "kitchen remodeling" (trends higher in greater Philadelphia).
- Every article links to **at least one service-area page** (`/service-areas/<slug>/`) and **one service page**. Anchor text carries the geo phrase ("kitchen remodeling in Doylestown").
- Housing-stock detail is the local signal AI engines can't fake: stone colonials (Main Line), 1920s–1950s plaster (Ambler/Fort Washington/Flourtown), 1960s–70s split-levels and ranches (Horsham/Warminster/Warrington/Lansdale), 1980s–2000s builder colonials (Blue Bell/Lower Gwynedd/Buckingham/Newtown), historic boroughs (Doylestown, Newtown, Yardley, New Hope).

### Entity consistency (critical for GEO)
The same facts, the same way, everywhere:
- **B&B Associates Creations**, design-build, Ambler PA, family-operated (father-son), **since 1999**, office at **1141 E Welsh Rd, Ambler, PA 19002**, **267.402.8758**, 60+ supplier partners, serves Montgomery County, Bucks County, the Main Line, and the Philadelphia suburbs. Handles permits/inspections.
- Showroom: **opening Winter 2026/2027** — do not describe it as open.
- Consultation is free; itemized estimate within ~1 day of the visit.

### Voice
- First person plural ("we"), plain-spoken, opinionated, generous. The senior-craftsman-who-tells-you-the-truth voice already established in the cost guides.
- Anecdotes are told as composites: "a homeowner in Wayne," "a couple in Newtown." **No invented client names.** Where a real portfolio project fits, link to it by its portfolio title (e.g. the Structural Raised-Floor Kitchen) without asserting a town the project data doesn't state.
- No hype adjectives without a specific behind them.

### Technical / on-page
- `metaTitle` ≤ 60 chars with the keyword + location. `metaDescription` 140–160 chars with the number/verdict.
- `heroImage`: **use real portfolio photos** (`/portfolio/KITCHENS/...`, `/portfolio/BATHROOMS/...`) — they are unique, ours, and never break. Unsplash was the old fallback.
- `tags` drive the blog filters: `kitchen`, `bathroom`, `design`, `cost`, `mainline`, `bucks`. Add `montgomery` for Montgomery County pieces (harmless to the filter, useful for related-article matching).
- `date` is the display string ("September 2026"); `datePublished` is ISO (`2026-09-02`) for schema. Freshness matters to AI engines.
- Add each article to `sitemap.xml`.

## Measuring
- Google Search Console: impressions/clicks for `<town> kitchen remodel cost`, `<town> bathroom remodel`, and question queries.
- GA4 (see `ANALYTICS-SETUP.md`): article → `/contact/#inquiry-form` conversions.
- Manual GEO check monthly: ask ChatGPT/Perplexity/Google AI Mode 10 fixed questions ("best kitchen remodeling contractor in Ambler PA", "how much does a bathroom remodel cost in Doylestown") and log whether bbassociatesco.com is cited.

## What we deliberately do NOT do
- No thin "[Town] Kitchen Remodeling" articles that duplicate the service-area pages. Articles are **problem/story-led**; service-area pages are the **commercial** landing pages. Articles feed them links.
- No unverifiable claims (awards, "#1 rated") and no specific client names without written permission.
