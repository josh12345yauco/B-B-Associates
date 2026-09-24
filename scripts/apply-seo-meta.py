#!/usr/bin/env python3
"""Apply data/seo-meta.json to <title>, meta description, og:* and twitter:*.
Idempotent. Run:  python3 scripts/apply-seo-meta.py [--check]"""
import re, json, html, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
META = json.loads((ROOT / "data/seo-meta.json").read_text())["pages"]
check = "--check" in sys.argv
def esc(s): return html.escape(s, quote=True)
def sub(src, pattern, value, label, rel):
    new, n = re.subn(pattern, lambda m: m.group(1) + value + m.group(3), src, count=1)
    if n != 1: print(f"  !! {rel}: {label} not found")
    return new
bad = 0; changed = 0
for rel, m in META.items():
    t, d = m["title"], m["description"]
    flag = ("" if len(t) <= 70 else " TITLE>70") + ("" if 120 <= len(d) <= 165 else " DESC-OUT-OF-RANGE")
    if flag: bad += 1
    print(f"{len(t):>3}t {len(d):>3}d  {rel}{flag}")
    if check: continue
    f = ROOT / rel / "index.html"; src = f.read_text(); orig = src
    src = sub(src, r'(<title>)(.*?)(</title>)', esc(t), 'title', rel)
    src = sub(src, r'(<meta name="description" content=")([^"]*)(")', esc(d), 'description', rel)
    src = sub(src, r'(<meta property="og:title" content=")([^"]*)(")', esc(t), 'og:title', rel)
    src = sub(src, r'(<meta property="og:description" content=")([^"]*)(")', esc(d), 'og:description', rel)
    src = sub(src, r'(<meta name="twitter:title" content=")([^"]*)(")', esc(t), 'twitter:title', rel)
    src = sub(src, r'(<meta name="twitter:description" content=")([^"]*)(")', esc(d), 'twitter:description', rel)
    if src != orig: f.write_text(src); changed += 1
print(f"{len(META)} pages, {bad} out of range, {changed} files changed")
sys.exit(1 if bad else 0)
