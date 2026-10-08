#!/usr/bin/env python3
"""Make article images lighter.

    python3 scripts/optimize_images.py

For every PNG/JPG in static/images/posts/:
  - resizes it to at most MAX_WIDTH pixels wide (the article column is ~820px,
    so this still looks sharp on retina screens);
  - saves it as WebP, which is usually 5-10x smaller than the PNG;
  - updates every reference in content/ to the new .webp file and removes the
    original (only when the WebP is actually smaller);
  - adds loading="lazy", decoding="async" and the real width/height to HTML
    <img> tags in content/, so images load only when the reader gets to them
    and the page does not jump while they load.

Run it after adding images to a new article. It is safe to run again: files
that are already WebP are only checked for the lazy-loading attributes.
SVG and GIF files are left alone.
"""
import glob
import os
import re
import sys

from PIL import Image

MAX_WIDTH = 1600
QUALITY = 82
ROOT = "static/images/posts"


def convert(path):
    """Return the new .webp path, or None if the original should stay."""
    with Image.open(path) as im:
        im.load()
        if im.width > MAX_WIDTH:
            im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "A" in im.getbands() or im.mode == "P" else "RGB")
        target = os.path.splitext(path)[0] + ".webp"
        im.save(target, "WEBP", quality=QUALITY, method=6)
    before, after = os.path.getsize(path), os.path.getsize(target)
    if after >= before:
        os.remove(target)
        return None
    print(f"{path}: {before // 1024} KB -> {after // 1024} KB")
    return target


def size_of(src):
    path = "static" + src
    if not os.path.exists(path) or path.endswith(".svg"):
        return None
    with Image.open(path) as im:
        return im.size


def lazy(tag):
    """Add lazy loading and the real size to one <img> tag."""
    src = re.search(r'src="([^"]+)"', tag)
    if not src:
        return tag
    if "loading=" not in tag:
        tag = tag.replace("<img ", '<img loading="lazy" decoding="async" ', 1)
    size = size_of(src.group(1)) if src.group(1).startswith("/") else None
    if size and "width=" not in tag:
        tag = tag.replace("<img ", f'<img width="{size[0]}" height="{size[1]}" ', 1)
    return tag


def main():
    renamed = {}
    for path in sorted(glob.glob(f"{ROOT}/**/*", recursive=True)):
        if path.lower().endswith((".png", ".jpg", ".jpeg")):
            target = convert(path)
            if target:
                renamed["/" + path[len("static/"):]] = "/" + target[len("static/"):]

    changed = 0
    for path in glob.glob("content/**/*.md", recursive=True):
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        new = text
        for old, webp in renamed.items():
            new = new.replace(old, webp)
        # Only real <img> tags in the text, not examples inside code blocks.
        parts = re.split(r"(```.*?```)", new, flags=re.S)
        parts = [p if p.startswith("```") else re.sub(r"<img\b[^>]*>", lambda m: lazy(m.group(0)), p) for p in parts]
        new = "".join(parts)
        if new != text:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new)
            changed += 1

    for old in renamed:
        os.remove("static" + old)
    print(f"{len(renamed)} image(s) converted to WebP, {changed} article file(s) updated")


if __name__ == "__main__":
    sys.exit(main())
