#!/usr/bin/env python3
"""A8 (2026-09-24): strengthen the HomeAndConstructionBusiness entity on every
page: full sameAs (adds the HomeAdvisor profile ChatGPT cites), knowsAbout,
and a complete areaServed on the homepage + hubs. Idempotent."""
import re, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SAME_AS = ["https://www.instagram.com/bbassociatescreations", "https://www.facebook.com/bbassociatescreations", "https://www.tiktok.com/@bb.associates",
  "https://www.houzz.com/professionals/home-builders/bandb-associates-pfvwus-pf~1637622775",
  "https://www.angi.com/companylist/us/pa/ambler/bandb-associates-creations%2C-llc-reviews-10836841.htm",
  "https://www.homeadvisor.com/rated.BandBAssociatesCo.39127744.html"]
KNOWS = ["Kitchen remodeling", "Bathroom remodeling", "Custom cabinetry", "Tile installation", "Walk-in showers", "Design-build remodeling", "Kitchen design", "Countertop installation", "Home remodeling permits in Montgomery County and Bucks County, PA"]
TOWNS = ["Ambler", "Maple Glen", "Blue Bell", "North Wales", "Lower Gwynedd", "Flourtown", "Fort Washington", "Horsham", "Lansdale", "Newtown", "Yardley", "Langhorne", "Doylestown", "New Hope", "Buckingham", "Chalfont", "Warrington", "Warminster", "Bryn Mawr", "Gladwyne", "Wayne", "Villanova", "Haverford", "Ardmore", "Berwyn"]
FULL_AREA = [{"@type": "AdministrativeArea", "name": "Montgomery County, PA"}, {"@type": "AdministrativeArea", "name": "Bucks County, PA"}, {"@type": "Place", "name": "Philadelphia Main Line, PA"}] + [{"@type": "City", "name": f"{t}, PA"} for t in TOWNS]
HUBS = {"index.html", "services/index.html", "service-areas/index.html", "service-areas/montgomery-county/index.html", "service-areas/bucks-county/index.html", "service-areas/main-line-pa-remodeling/index.html", "about/index.html", "contact/index.html", "reviews/index.html"}

def walk(o, fn):
    if isinstance(o, dict):
        fn(o); [walk(v, fn) for v in o.values()]
    elif isinstance(o, list): [walk(v, fn) for v in o]

changed = 0
for f in sorted(ROOT.rglob("index.html")):
    rel = str(f.relative_to(ROOT))
    if any(s in f.parts for s in ("node_modules", "ESTIMATOR-Pre", "admin", "design-estimator")): continue
    if rel.startswith(("service-areas/kitchen-remodeling/", "service-areas/bathroom-remodeling/", "kitchen-remodel-cost/", "bathroom-remodel-cost/", "services/custom-cabinetry/")): continue  # generated; schema comes from the generators
    src = f.read_text(); orig = src
    def patch(m):
        try: data = json.loads(m.group(2))
        except Exception: return m.group(0)
        hit = [False]
        def fix(o):
            if o.get("@type") == "HomeAndConstructionBusiness":
                hit[0] = True
                o["sameAs"] = SAME_AS
                o["knowsAbout"] = KNOWS
                if rel in HUBS: o["areaServed"] = FULL_AREA
        walk(data, fix)
        if not hit[0]: return m.group(0)
        return m.group(1) + "\n" + json.dumps(data, indent=2, ensure_ascii=False) + "\n" + m.group(3)
    src = re.sub(r'(<script type="application/ld\+json">)([\s\S]*?)(</script>)', patch, src)
    if src != orig: f.write_text(src); changed += 1
print(f"{changed} pages patched")
