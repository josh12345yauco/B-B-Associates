#!/usr/bin/env python3
"""Make fast, sharp WebP copies of project photos.

Writes IMAGES/opt/w1000/<original path>.webp (tiles, posters) and
IMAGES/opt/w1800/<original path>.webp (full-screen gallery). Originals are untouched.
EXIF rotation is applied and the colour profile is kept, so colours match the originals.

Usage:  python3 scripts/optimize-images.py [path ...]   (default: every image in js/projects-data.js)
Re-running skips files that are already up to date.
"""
import os, re, sys, subprocess, json
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZES = {'w1000': (1000, 80), 'w1800': (1800, 82)}   # long edge px, WebP quality


def project_images():
    js = ("const vm=require('vm'),fs=require('fs');"
          "const P=vm.runInNewContext(fs.readFileSync('js/projects-data.js','utf8')+';projects',"
          "{localStorage:{getItem:()=>null,setItem(){}},window:{},document:{}});"
          "const s=new Set();P.forEach(p=>[p.thumbnail,...(p.images||[])].forEach(i=>i&&s.add(i)));"
          "console.log(JSON.stringify([...s]))")
    out = subprocess.run(['node', '-e', js], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return [p for p in json.loads(out) if re.search(r'\.(jpe?g|png|webp)$', p, re.I)]


def opt_path(src, size):
    return os.path.join(ROOT, 'IMAGES', 'opt', size, re.sub(r'\.(jpe?g|png|webp)$', '.webp', src.lstrip('/'), flags=re.I))


def run(paths):
    made = skipped = missing = 0
    for src in paths:
        full = os.path.join(ROOT, src.lstrip('/'))
        if not os.path.exists(full):
            missing += 1; continue
        targets = [(k, opt_path(src, k)) for k in SIZES]
        if all(os.path.exists(t) and os.path.getmtime(t) >= os.path.getmtime(full) for _, t in targets):
            skipped += 1; continue
        im = ImageOps.exif_transpose(Image.open(full))
        icc = im.info.get('icc_profile')
        if im.mode not in ('RGB', 'RGBA'):
            im = im.convert('RGB')
        for key, out in targets:
            edge, q = SIZES[key]
            copy = im.copy()
            copy.thumbnail((edge, edge), Image.LANCZOS)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            kw = {'quality': q, 'method': 6}
            if icc: kw['icc_profile'] = icc
            copy.save(out, 'WEBP', **kw)
        made += 1
    print(f'optimized {made}, up to date {skipped}, missing {missing}')


if __name__ == '__main__':
    run(sys.argv[1:] or project_images())
