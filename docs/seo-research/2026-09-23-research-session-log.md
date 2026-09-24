# SEO Research Session Log — September 23, 2026
**Site:** bbassociatesco.com (B&B Associates Creations)
**Companion to:** `docs/seo-research/2026-09-23-trends-ai-visibility-gsc-report.md` (the findings report)
**Mode:** read-only throughout. No settings changed in Google Trends, ChatGPT, Perplexity, Gemini, Google AI Mode, or Search Console. No logins performed, no indexing requested, no live URL tests run.

---

## 1. What was asked

Three-part brief, delivered as one markdown report:

1. **Google Trends** — compare five core terms (kitchen remodel, bathroom remodel, kitchen renovation, bathroom renovation, design build) in Pennsylvania and the Philadelphia metro, past 5 years and past 12 months, category Home & Garden. Pull all Top and Rising related queries for "kitchen remodel" and "bathroom remodel". Compare five niche terms (walk in shower, tub to shower conversion, primary bathroom, kitchen island, custom cabinets). Check the city panel for 16 target towns.
2. **AI answer visibility** — run two prompts per town (best luxury kitchen remodeler; bathroom remodeler with great tile reviews) for Ambler, Blue Bell, Horsham, Newtown, Bryn Mawr, Doylestown across ChatGPT (search on), Perplexity, Gemini, and Google AI Mode. Record every company named, B&B's position, every source cited. Tally domains and competitors.
3. **Search Console** — top 25 queries for four town pages (Flourtown, Doylestown/New Hope, Yardley, Newtown) over the last 3 months; URL Inspection on the kitchen-renovation-timeline article including the crawled HTML; counts for every "Why pages aren't indexed" reason.

Before the brief, two smaller questions were answered in the same session:
- Identified the page in a Google Analytics screenshot (483 views, Aug 24–Sep 23) as the homepage, `index.html`, live at https://www.bbassociatesco.com/, and opened it in Chrome.
- Assessed whether "Ambler, PA" in the homepage title tag hurts local SEO given the Maple Glen address. Conclusion: no. Geo ranking comes from the schema/GBP/footer address (all Maple Glen, consistent), the title tag is a relevance signal, and Ambler has far more search volume; 19002 is the Ambler zip. The one real inconsistency flagged: the showroom is branded "Ambler Design Showroom" while its page lists the Maple Glen address.

---

## 2. How it was run

### Setup
- All browser work ran in the user's own Chrome via the Claude in Chrome extension, so it inherited whatever sessions Chrome already had open. That mattered for Part 2 (see §4).
- The work was split across background agents so each could keep its own tab and its page dumps out of the main thread:

| Agent | Scope | Outcome |
|---|---|---|
| Trends #1 | Part 1, all items | Captured the PA 5-year comparison, both full related-query lists (5-year), PA metro and city panels. Cut off by a usage-limit error before the 12-month and Philadelphia-metro runs. |
| ChatGPT + Perplexity | Part 2, two engines, 24 prompts | All 24 retrieved. |
| Gemini + AI Mode | Part 2, two engines, 24 prompts | AI Mode 12/12 retrieved. Gemini 0/12 (errors). |
| Search Console | Part 3, all items | All three sub-tasks retrieved. |
| Gemini retry | Part 2, Gemini only | 0/12 again (same error, browser otherwise idle). |
| Trends #2 | Part 1, remaining items | Picked up exactly where Trends #1 stopped; all remaining items retrieved. |

- Shared-browser rules given to every agent: create your own tab, always pass its tab ID, prefer URL-parameter navigation and page-text reads over clicking and typing, use form fields rather than blind keystrokes, verify typed input landed before submitting, close your tab when done, never change a setting, never log in, never solve a captcha, never invent a number or a company name; write "NOT RETRIEVED: reason" instead.

### Part 1 — Google Trends method
- Built explore URLs directly with `cat=11` (Home & Garden), `geo=US-PA` or `geo=US-PA-504` (Philadelphia DMA), `date=today 5-y` or `today 12-m`.
- The classic UI at trends.google.com/trends/explore was more reliable than the new /explore UI, which stalled or returned zeros on later loads.
- Page text is not exposed on Trends charts (canvas rendering), so averages were read by hovering the "Average" bars and reading tooltips, and the timeline was sampled by hovering ~12–60 evenly spaced points per chart and recording the tooltip value and week. Related-query panels were paged with the panel's next arrow to get all 25 rows. City panels were read in the default view and again with "Include low search volume regions" checked (a display toggle, not a saved setting).
- Seasonality was computed afterwards from 60 weekly tooltip samples on the PA 5-year chart, grouped by month; weeks reading 0 for kitchen remodel were excluded as below-threshold.
- Terms whose average rounds to 0 (tub to shower conversion, primary bathroom) have no bar to hover; recorded as ~0 with the weekly evidence.

### Part 2 — AI visibility method
- **Perplexity:** logged out. Each prompt opened as a fresh thread via `perplexity.ai/search?q=`. Answer and Sources panel read from page text; full hrefs were only exposed for the first few sources per thread, the rest recorded as domain + page title.
- **ChatGPT:** chatgpt.com was already signed in to the user's ChatGPT Plus account with Memory on. The agent did not log out (that would be a session change). Every prompt was run in a new Temporary chat with the per-message Web search chip on. The first regular-chat run was visibly memory-contaminated and was recorded separately and excluded from tallies. Sources were taken from inline chips; collapsed "+1/+2" chips with no exposed URL were recorded by label only.
- **Google AI Mode:** built as `google.com/search?udm=50&q=`. Chrome was signed in to the user's Google account, and every answer showed a "Personalizing" step and "Preferred" badges on bbassociatesco.com. Could not be de-personalized without changing settings. AI Mode is non-deterministic: Ambler bathroom was run twice with different lists (both recorded), Doylestown kitchen came back as an A/B pair (both recorded, no vote cast). On four rows the "Show all" sources panel could not be expanded before the tab became unresponsive; pre-expansion sources recorded and flagged.
- **Gemini:** gemini.google.com, signed in, Pro model. Attempt 1 (during the parallel run): "I seem to be encountering an error", then two hangs of 2.5+ minutes. Attempt 2 (an hour later, browser otherwise idle): "I seem to be encountering an error", "I encountered an error doing what you asked", then a 90-second spinner with no output. Gemini auto-titled the failed chats "Luxury Kitchen Remodeler Error" and "Kitchen Remodeler Search Error", which points at its search-grounding step failing for this query type rather than a login or load problem. The model picker was left on Pro per the read-only rule.

### Part 3 — Search Console method
- Domain property `sc-domain:bbassociatesco.com` loaded directly; the URL-prefix property was not needed.
- Performance: Search results, Web, Last 3 months (data window Jun 22–Sep 21, 2026), exact page filter (`!` prefix) per URL, Clicks/Impressions/CTR/Position all toggled on. The rows-per-page control is a custom Material listbox that ignored both form input and clicks, so the Queries table was read 10 rows at a time, rows 1–30 per page, and the top 25 recorded.
- URL Inspection: the `/inspect?...&id=<url>` deep link returns a Google 404 (GSC uses an opaque id), so the URL was typed into the top inspection box. "View crawled page > HTML" was opened and searched in-panel; "Test live URL" and "Request indexing" were not clicked.
- Indexing > Pages: read the indexed/not-indexed totals and all eight reason rows with source, validation state and count.

---

## 3. Outputs produced

| File | What it is |
|---|---|
| `docs/seo-research/2026-09-23-trends-ai-visibility-gsc-report.md` | The deliverable: Parts 1–3 with all tables, the Part 2 engine/town/prompt table, domain and competitor tallies, and Top 10 findings. |
| `docs/seo-research/2026-09-23-research-session-log.md` | This file. |
| scratchpad `trends-notes.txt` | Trends #1 raw notes: 60 weekly tooltip samples, averages, 5-year related queries, PA city/metro panels. |
| scratchpad `part1-trends-remaining.md` | Trends #2 raw notes: 12-month and Philly-metro runs, comparison C, 12-month related queries, Philly city panels. |
| scratchpad `part2-chatgpt-perplexity.md` + `notes-raw.md` | Per-run ChatGPT and Perplexity answers, sources, tallies. |
| scratchpad `part2-gemini-aimode.md` + `aimode-notes.txt` | Per-run AI Mode answers and sources; Gemini failure log. |
| scratchpad `part2-gemini.md` | Gemini retry log (0/12). |
| scratchpad `part3-gsc.md` | Full GSC tables, inspection result with HTML evidence lines, indexing report. |

Scratchpad location: `/private/tmp/claude-501/-Users-gabrielanunez-Documents-B-B-Assocaites/52678cdd-6101-40ef-b7f6-7153a87d1a73/scratchpad/`. It is session-scoped and may be cleared; the two files under `docs/seo-research/` are the durable copies.

---

## 4. What could not be verified, and why

| Item | Status | Reason |
|---|---|---|
| Gemini, all 12 prompts | Not retrieved | Gemini errored on every attempt across two sessions; grounding failure on its side. |
| Google AI Mode neutrality | Retrieved but personalized | Chrome signed in to the site owner's Google account; B&B's #1 placements likely inflated. Needs a logged-out re-run. |
| ChatGPT neutrality | Retrieved with residual bias possible | Signed-in Plus account with Memory; Temporary chat still "can reference memory". A logged-out test was not possible without changing the session. |
| Trends: tub to shower conversion, primary bathroom averages | ~0, not hoverable | Average bar has no height at PA/Philly scale in Home & Garden. |
| Trends: 15 of 16 target towns | No data | Only Doylestown appears in any city panel; Langhorne appears for bathroom remodel. Town-level prioritization must come from Search Console. |
| GSC: clicks below row 30 | Not itemized | One Doylestown click, one Yardley click, two Newtown clicks sit on queries below the first 30 rows. |
| GSC: Pages-report trend sparklines | Not captured | Graphics only. |

---

## 5. Incidents worth knowing about

- **ChatGPT ghost click.** One coordinate click meant for the "+" tools menu landed on a suggested-task chip under the composer and submitted "Every Monday, brief me on consequential developments in web design…" inside a Temporary chat. ChatGPT replied with clarifying questions; the agent navigated away without answering. No scheduled task was created and Temporary chats are not saved. The agent switched to element-reference clicks afterwards.
- **Chrome tab group reset.** The shared tab group was reset once mid-run; the AI Mode agent's original tab vanished and it created a new one. Several batched browser calls timed out, which cost the expanded-sources capture on three AI Mode rows.
- **Usage limit.** The first Trends agent was terminated by a monthly spend-limit error partway through. Its notes were preserved and a second agent completed only the missing items; nothing was re-run.
- **Trends display toggle.** "Include low search volume regions" was checked on two city panels and the tab closed with it checked. It is a per-page display option, not an account setting.

---

## 6. Suggested next steps (not done, for the user to decide)

1. Re-run Part 2 on Google AI Mode from a logged-out window, and Gemini on the Flash model, to get non-personalized baselines.
2. Rewrite title tags and meta descriptions on the four town pages, starting with the queries already on page 1 at zero clicks.
3. Export the 124 404 URLs from the Pages report and map 301s, starting with the old `/services/kitchen-remodeling/` path.
4. Set up a Houzz profile and a GBP review request flow that asks for town and "tile" mentions, since those two sources drive the AI answers.
5. Build cost-guide pages for kitchen and bathroom remodels; cost is the top query family in every Trends window.
