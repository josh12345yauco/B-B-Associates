# 05 — Publishing Checklist (adding an article)

1. **Write the object** in `blog/articles-data.js`. Insert at the **top** of the `ARTICLES` array if it should be the featured post; otherwise just below the current featured one. Array order = display order.
2. **Fields**
   - `id`: kebab-case, includes keyword + town, never changes after publish (it is the URL: `/blog/article/?id=<id>`).
   - `title`: H1. Keyword + town, under ~75 chars where possible.
   - `category`: one of `Cost Guide` · `Kitchen` · `Bathroom` · `Design` · `Design-Build` · `Guides` · `Trends` · `Stories`.
   - `tags`: from `kitchen` `bathroom` `design` `cost` `mainline` `bucks` `montgomery` (the first six are blog filters).
   - `date`: display string, e.g. `"September 2026"`. `datePublished`: ISO `"2026-09-02"` (feeds schema).
   - `readTime`: ~200 words/min, rounded.
   - `excerpt`: 1–2 sentences with the answer/number. Used on cards and as fallback meta.
   - `metaTitle` (≤ 60 chars), `metaDescription` (140–160 chars).
   - `heroImage`: a real portfolio photo path (copy the `thumbnail` from `js/projects-data.js`).
   - `body`: HTML in a template literal. `<p>`, `<h2>`, `<h3>`, `<ul>`, `<strong>`, `<a>`. Escape `&` as `&amp;` in visible text. No backticks or `${` inside the body.
   - `faq`: 4–6 `{ q, a }` objects. Rendered visibly + as FAQPage schema.
3. **Internal links**: ≥1 service-area page, ≥1 service page, 1–2 related articles, and the inquiry CTA `/contact/#inquiry-form`.
4. **Sitemap**: add a `<url>` block for `/blog/article/?id=<id>` with today's `lastmod`, `changefreq` monthly, priority 0.65.
5. **Syntax check**: `node --check blog/articles-data.js`.
6. **Local check**: `python3 -m http.server 3000` → open `/blog/` and `/blog/article/?id=<id>`; confirm hero image, FAQ, related cards, and that the schema JSON in the page source parses.
7. **Commit + push** to `main` (Vercel deploys automatically). Then request indexing for the new URL in Search Console.
