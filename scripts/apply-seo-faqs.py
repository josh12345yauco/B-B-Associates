#!/usr/bin/env python3
"""A3: append the AI-style FAQs from data/seo-faqs.json to every hand-built
town page (visible accordion + FAQPage JSON-LD) and add a tile paragraph to
the bathroom service card. Idempotent (skips a page that already has the FAQ)."""
import re, json, html, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "data/seo-faqs.json").read_text())
MARK = "Who is the best bathroom remodeler for tile work"

def fill(s, t): return s.replace("{Town}", t["town"]).replace("{County}", t["county"]).replace("{Nearby}", t["nearby"])
def esc(s): return html.escape(s, quote=False)

def add_schema(src, faqs, rel):
    blocks = list(re.finditer(r'(<script type="application/ld\+json">)([\s\S]*?)(</script>)', src))
    for m in blocks:
        if '"FAQPage"' not in m.group(2): continue
        data = json.loads(m.group(2))
        def find(o):
            if isinstance(o, dict):
                if o.get("@type") == "FAQPage": return o
                for v in o.values():
                    r = find(v)
                    if r: return r
            if isinstance(o, list):
                for v in o:
                    r = find(v)
                    if r: return r
        faq = find(data)
        faq["mainEntity"].extend({"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in faqs)
        body = json.dumps(data, indent=2, ensure_ascii=False)
        return src[:m.start(2)] + "\n" + body + "\n" + src[m.end(2):]
    print(f"  !! {rel}: no FAQPage block"); return src

def add_visible(src, faqs, rel):
    if 'class="sa-faq-grid"' in src:  # Template A: two-column accordion grid
        items = "".join(f"""            <div class="accordion-item">
              <button class="accordion-trigger" aria-expanded="false">
                {esc(f['q'])}
                <span class="accordion-icon" aria-hidden="true"></span>
              </button>
              <div class="accordion-content" role="region">
                <div class="accordion-content-inner">
                  {esc(f['a'])}
                </div>
              </div>
            </div>
""" for f in faqs)
        start = src.index('class="sa-faq-grid"'); depth = 0; i = start
        for m in re.finditer(r'<div\b|</div>', src[start:]):
            depth += 1 if m.group(0) == '<div' else -1
            if depth == 0: i = start + m.start(); break
        # i = the grid's closing </div>; the last column's </div> is the previous one
        col_close = src.rfind('</div>', start, i)
        return src[:col_close] + items + "          " + src[col_close:]
    if 'class="town-faq-item"' in src:  # Template B
        items = "".join(f"""          <div class="town-faq-item">
            <button class="town-faq-question" aria-expanded="false">{esc(f['q'])}<span class="town-faq-icon" aria-hidden="true"></span></button>
            <div class="town-faq-answer" role="region"><div class="town-faq-answer-inner">{esc(f['a'])}</div></div>
          </div>
""" for f in faqs)
        last = src.rfind('class="town-faq-item"')
        end = src.index('</div>\n          </div>\n', last) + len('</div>\n          </div>\n')
        return src[:end] + items + src[end:]
    print(f"  !! {rel}: no FAQ markup"); return src

def add_tile(src, t, rel):
    para = fill(D["tileParagraph"], t)
    if para[:40] in src: return src
    for h3, pcls in (("Custom Bathroom Renovations</h3>", "sa-service-desc"), ("Bathroom Renovation</h3>", "town-service-body"), ("Bathroom Renovations</h3>", "town-service-body")):
        m = re.search(r'<h3 class="(sa-service-title|town-service-h3)">[^<]*Bath[^<]*</h3>', src)
        i = m.start() if m else -1
        if i < 0: continue
        pcls = "sa-service-desc" if m.group(1) == "sa-service-title" else "town-service-body"
        j = src.index("</p>", i) + 4
        return src[:j] + f'\n            <p class="{pcls}">{esc(para)}</p>' + src[j:]
    print(f"  !! {rel}: bathroom card not found"); return src

changed = 0
for rel, t in D["towns"].items():
    f = ROOT / "service-areas" / rel / "index.html"; src = f.read_text(); orig = src
    faqs = [{"q": fill(x["q"], t), "a": fill(x["a"], t)} for x in D["faqs"]]
    if MARK not in src:
        src = add_schema(src, faqs, rel)
        src = add_visible(src, faqs, rel)
    src = add_tile(src, t, rel)
    if src != orig: f.write_text(src); changed += 1
print(f"{len(D['towns'])} pages, {changed} changed")
