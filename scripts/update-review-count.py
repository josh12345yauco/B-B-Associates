#!/usr/bin/env python3
"""
Change the review count shown across the whole site in one step.

    python3 scripts/update-review-count.py "200+"

The site shows one rounded figure (for example "180+") rather than an exact
count, so it stays true as new reviews arrive and only needs changing at a
milestone. The current figure is read from js/business-config.js.

Only text next to a review word is touched (reviews, five-star, 5-star,
stories), so unrelated numbers are never changed.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "js", "business-config.js")
SKIP = {".git", "node_modules", "docs", "seo-data", "IMAGES", "design-estimator",
        "ESTIMATOR-Pre", ".superpowers", ".claude"}
EXTS = (".html", ".js", ".json", ".txt", ".py")


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r"\d{2,5}\+?", sys.argv[1]):
        sys.exit('Usage: python3 scripts/update-review-count.py "200+"')
    new = sys.argv[1]
    cfg = open(CONFIG, encoding="utf-8").read()
    m = re.search(r'reviewsDisplay:\s*"([^"]+)"', cfg)
    if not m:
        sys.exit("reviewsDisplay not found in js/business-config.js")
    old = m.group(1)
    if old == new:
        sys.exit("Already set to %s - nothing to do." % new)

    words = r"(?:[\w-]+\s+){0,3}?(?:reviews?|stories)"
    pat = re.compile(r"(?<![\w.])" + re.escape(old) + r"(?=\s+" + words + r")", re.I)
    total = files = 0
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if d not in SKIP]
        for f in fn:
            if not f.endswith(EXTS) or f == os.path.basename(__file__):
                continue
            p = os.path.join(dp, f)
            try:
                s = open(p, encoding="utf-8").read()
            except (UnicodeDecodeError, OSError):
                continue
            s2, n = pat.subn(new, s)
            if p == CONFIG:
                s2 = s2.replace('reviewsDisplay: "%s"' % old, 'reviewsDisplay: "%s"' % new)
            if s2 != s:
                open(p, "w", encoding="utf-8").write(s2)
                total += n
                files += 1
    print("Review figure %s -> %s: %d places in %d files." % (old, new, total, files))
    print("Next: review with 'git diff', then commit and push.")


if __name__ == "__main__":
    main()
