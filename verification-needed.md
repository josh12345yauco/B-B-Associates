# Verification Needed — SEO Sprint 2026-09-04

Items below could not be confirmed from the repository. Nothing here is asserted on a live page as fact unless noted; page copy was written from repo-sourced material only. Please confirm or correct before the next content pass.

## 1. Business facts used sitewide

| Item | What the site says | Action |
|---|---|---|
| Founding year / years in business | Homepage + About say **2013 / 13 years** (commit d501359 "Fix founding year to 2013"). All 22 service-area pages, the journal articles, `docs/content-plan/`, and the Supabase-era memory notes said **1999 / 25 years**. Per Josh's instruction, the Ambler prototype and the 16 generated pages now say **2013 / 13+ years**. | Confirm 2013 is correct. If so, the remaining 21 town pages get the same change on rollout, and the journal articles + `docs/content-plan/01-seo-geo-strategy.md` should be updated in a separate pass (they still say 1999). |
| "600+ projects" / "1,200+ projects" / "183 reviews" | Stat strips vary by page (600+ on town pages, 1,200+ on homepage). | Pick one number per stat. |
| Showroom "Opening Winter 2026" vs "Winter 2026/2027" | Both phrasings exist. | Standardize once a date is known. |

## 2. Town facts not sourced from the repo (data/towns.json → `verify`)

- **Coordinates** for all 8 towns are approximate centroids from general geographic knowledge, not from the repo: Ambler 40.1546,-75.2216 · Bryn Mawr 40.0218,-75.3163 · Lower Gwynedd 40.1868,-75.2482 · Blue Bell 40.1523,-75.2663 · Newtown 40.2293,-74.9368 · Villanova 40.0387,-75.3432 · Gladwyne 40.0426,-75.2790 · Berwyn 40.0448,-75.4388. They appear only in `geo.position` / `ICBM` meta tags.
- **Drive times** "about 30 minutes from Maple Glen" for Bryn Mawr and Gladwyne are borrowed from the Berwyn page; neither town page states a time.
- **Villanova township**: treated as Radnor Township throughout (as on the Wayne & Villanova page). Parts of Villanova are in Lower Merion Township — confirm which permit authority to cite.
- **Berwyn "wait one season after buying" advice** is drawn from the Batch 02 editorial brief (`docs/content-plan/04-editorial-calendar.md` #3), not from published copy. Confirm B&B agrees.
- **Permit authorities** were taken verbatim from existing town-page FAQs (Ambler Borough / Upper Dublin, Lower Merion Building & Code Enforcement, Lower Gwynedd Township Building Department, Whitpain / Montgomery Township / North Wales Borough, Newtown Borough / Township / Upper Makefield / Yardley, Radnor Township, Tredyffrin / Easttown). Not independently verified.
- No landmarks beyond those already named on the site were used (Fort Washington State Park, Skippack Pike, Township Line Road, Route 202, Route 413/532, Route 30 / Blue Route, Court Street). Bryn Mawr College, Lancaster Avenue and similar were deliberately **not** added.

## 3. Portfolio project towns (Phase 3) — all 36 unresolved

`js/projects-data.js` sets `town: "Pennsylvania"` on every project. Nothing in the repo (client folder names, review text, descriptions, `portfolio/B&B Project Descriptions (1).pdf`) names a town, so **no town was set**. The five testimonials on the site that do name towns use different surnames (Marino/Newtown, Williams/Doylestown, Holloway/Doylestown, Hartford/Wayne, Peterson/Wayne) and cannot be matched to project folders with confidence (the "Njani Peterson Kitchen" folder is the 1700s farmhouse, not the Wayne kitchen described in the Peterson review).

Please fill in the real town for each project id so the portfolio location filters and the service × town portfolio strips can use them:

rubin-kitchen · broderick-kitchen · bryn-michaels-kitchen · lee-kitchen · ferrie-kitchen · ganescu-kitchen · giedrycz-kitchen · hess-kitchen · hornig-kitchen · kohl-kitchen · larkin-kitchen · mcbride-kitchen · peterson-kitchen · olaughlin-kitchen · oleg-kitchen · prager-kitchen · slingsby-kitchen · barenbaum-bathroom · borgia-bathroom · bridlehall-bathroom · frank-bathroom · cruz-bathroom · emad-bathroom · garvey-bathroom · giedrycz-bathroom · guttridge-bathroom · hartka-bathroom · hershey-bathroom · kaarby-bathroom · lashannon-bathroom · levinson-bathroom · petev-bathroom · odonnell-bathroom · sharada-bathroom · goldberg-bathroom · vartanian-bathroom

(Edit the `town:` field and, if known, `review.town`. The data shape is unchanged.)

## 4. Lead pipeline — GoHighLevel facts discovered during testing

- The contact page's **live** form has always been the GoHighLevel iframe embed (form `k70Bwwhti09oNK8mRni7`, location `DDe5PzCq6LigKjZ7qeMD`, "Contact Form", email alerts to progresomarketingllc@gmail.com and bb3associates@gmail.com). The inline JavaScript that POSTed to `https://links.legacylinqdigital.com/widget/form/Ey8fdi6O3JIdS1xYUhkw` was dead code: that URL returns **404 "Cannot POST"**, and GHL's real endpoint `https://backend.leadconnectorhq.com/forms/submit` answers **429 "No tokens provided"** (it requires a reCAPTCHA v3 token only GHL's own widget can produce). A native form cannot deliver into GHL.
- Therefore the shared module (`js/inquiry-form.js`) renders GHL's iframe on the contact page, all 22 town pages and the 16 generated pages. GHL's `form_embed.js` relays the parent page URL into the iframe, so the source page is recorded on each contact. The page context is also appended to the iframe URL as `source_page=…` — **add a hidden field with query key `source_page` to the GHL form** if you want it as a contact field.
- The module's `native` mode (Supabase + localStorage + JSON POST) is ready for a **GHL Inbound Webhook** (Automation → Workflow → trigger "Inbound Webhook"). Set `window.BB_INQUIRY_CONFIG = { mode: 'native', ghlWebhook: '<url>' }` before the script tag to switch.
- Two test rows were inserted into the Supabase `leads` table while testing the native pipeline locally (first name "Test", last name "Lead (Claude QA)", email qa-test@example.com). Delete them from the admin CRM panel or Supabase.

## 5. Design rollout awaiting approval

The Ambler page is the only page carrying the new design (see the handoff report). Once approved, the same changes roll out to the other 21 town pages and, where applicable, to the generator template for the 16 service × town pages.
