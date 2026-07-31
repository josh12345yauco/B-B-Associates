# B&B Associates — Analytics & "Proof of Results" Setup

Goal: show B&B real, credible numbers — how many people visit, where they
are, and how many tapped **Call**, submitted a **form/contact**, completed
the **estimator**, or clicked **directions** — for any week or month.

There are **two layers** (both now wired in code):

| Layer | What it's for | Where B&B/you see it |
|-------|---------------|----------------------|
| **A. Supabase + your Admin dashboard** | Your branded, at-a-glance ops view with a 1-click **Export Client Report (PDF)** | `bbassociatesco.com/admin` → **Results & Analytics** |
| **B. Google Analytics 4 + Looker Studio** | Third-party-credible numbers (Google's name on it) in a shareable live report | A Looker Studio link you send B&B |

---

## ⚠️ Why this was needed (read this)

The old analytics wrote to **localStorage**, which lives only inside *one
browser on one device*. The admin panel read from that same localStorage —
so it only ever showed **your own** clicks, never real visitors. The numbers
on the old screenshot were you, not the public.

The new code sends every visitor's activity to a **central Supabase table**
and to **Google Analytics**, so the dashboard finally aggregates *everyone*.

---

## A. Supabase + Admin dashboard

### Step 1 — Create the table (one time, ~30 seconds)
1. Open the Supabase dashboard for the project the lead forms already use
   (`uiwubmhfrepmclvdisff`).
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `db/analytics_events.sql` from this repo, copy all of it, paste, **Run**.
4. You should see "Success. No rows returned." That's it.

### Step 2 — Deploy
The tracking is already in `js/analytics.js` (loaded on every public page) and
the dashboard is already in `admin/`. Just push/deploy as usual (Vercel).

### Step 3 — Verify it's collecting real data
1. Visit `bbassociatesco.com` in a **normal/incognito** window, click a couple
   of pages, tap **Call Now**, submit a form.
2. In Supabase → **Table Editor → analytics_events**, you should see new rows.
3. Open `bbassociatesco.com/admin` → **Results & Analytics**. The header should
   say **"Live data — all visitors"** (not the local-fallback warning).

### Step 4 — Hand a report to B&B
In the **Results & Analytics** panel: pick **Last 7 Days** / **Last 30 Days**,
then click **🖨 Export Client Report (PDF)** → "Save as PDF". It prints a clean,
branded page with the big KPIs, conversions, locations, and top pages.

---

## B. Google Analytics 4 + Looker Studio

You already have **Google Tag Manager** (`GTM-KZZXTRLG`) on all pages, and the
new `js/analytics.js` pushes a `bb_conversion` event to the dataLayer on every
call tap, form submit, directions click, and estimator completion. You just
need to point it at a GA4 property.

### Step 1 — Create a GA4 property
1. Go to **analytics.google.com** → Admin (gear, bottom-left) → **Create Property**.
2. Name it "B&B Associates", set timezone to Eastern, currency USD → **Next** → create.
3. Under the property → **Data Streams** → **Web** → enter `https://bbassociatesco.com`.
4. Copy the **Measurement ID** — it looks like `G-XXXXXXXXXX`.

### Step 2 — Connect GA4 through GTM (no code changes)
1. Go to **tagmanager.google.com** → container `GTM-KZZXTRLG`.
2. **Tags → New** → *Tag Configuration* → **Google Analytics: GA4 Configuration**.
   - Paste your `G-XXXXXXXXXX` Measurement ID.
   - Trigger: **Initialization - All Pages**. Name it `GA4 - Config`. **Save**.

### Step 3 — Track the 4 conversions
Create a **custom event trigger** first:
1. **Triggers → New** → *Custom Event* → Event name: `bb_conversion` →
   "All Custom Events". Name it `CE - bb_conversion`. **Save**.

Then create a **GA4 Event tag** that reads the conversion type:
1. **Tags → New** → **Google Analytics: GA4 Event**.
   - Configuration Tag: `GA4 - Config`.
   - Event Name: `{{DLV - conversion_type}}` *(see variable below)* — or simply
     hardcode `bb_conversion` and use `conversion_type` as a parameter.
   - Event Parameters: add `conversion_type` = `{{DLV - conversion_type}}` and
     `conversion_label` = `{{DLV - conversion_label}}`.
   - Trigger: `CE - bb_conversion`. Name it `GA4 - Conversion`. **Save**.
2. Create the data-layer variables: **Variables → New → Data Layer Variable**,
   name `DLV - conversion_type`, key `conversion_type`. Repeat for
   `conversion_label`.
3. **Submit / Publish** the container.

### Step 4 — Mark them as Key Events (conversions) in GA4
In GA4 → Admin → **Events** (wait until events appear, can take a few hours) →
toggle `call`, `form`, `estimator`, `directions` (or `bb_conversion`) as
**Key events**. These become the conversion totals B&B cares about.

### Step 5 — Build the shareable Looker Studio report
1. Go to **lookerstudio.google.com** → **Create → Report** → add data source →
   **Google Analytics** → pick your B&B property.
2. Suggested layout (one page, B&B-branded):
   - **Scorecards (top row):** Active Users / Total Users, Sessions, Views,
     Average engagement time, Key events (conversions).
   - **Time series:** Users by day (set the date-range control to default to
     "Last 28 days").
   - **Geo map / table:** Users by City (filter Region = Pennsylvania to show
     the Main Line / Bucks / Montgomery footprint).
   - **Bar chart:** Key events by `conversion_type` (call vs form vs estimator
     vs directions).
   - **Table:** Top pages by views.
   - Add a **date-range control** so B&B can flip between any week/month.
3. **Share → Get link** (view-only) → send to B&B. The numbers update live.

---

## What "estimator completion" needs (one extra step)

The estimator is an embedded iframe from `bbestimator.com`, so the parent page
can't see inside it. To count **completions**, add this one line to the
estimator's final/confirmation step on `bbestimator.com`:

```js
// Fire when the visitor reaches the estimate result / "thank you" step
window.parent.postMessage({ bb: 'estimator_complete' }, '*');
```

`js/analytics.js` already listens for that message and logs it as an estimator
conversion (Supabase **and** GA4). Until that line is added, call/form/
directions still track perfectly; estimator completions will read 0.

---

## Quick reference — what counts as a conversion

| Conversion | Auto-tracked from | Status |
|-----------|-------------------|--------|
| 📞 Call button taps | any `tel:` link/button | ✅ automatic |
| ✉️ Form / contact submits | any form `submit` on the site | ✅ automatic |
| 📍 Directions / map clicks | Google Maps links / "Get Directions" | ✅ automatic |
| 🧮 Estimator completions | postMessage from `bbestimator.com` | ⚠️ needs the 1 line above |
