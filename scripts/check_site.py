#!/usr/bin/env python3
"""Checks that catch the problems we used to fix by hand.

    python3 scripts/check_site.py content   # before the build: articles and translations
    python3 scripts/check_site.py links     # after `hugo`: links and images in public/

Content checks (content/posts):
  - every article has title, date and at least one tag;
  - every article exists in English and Portuguese (same translationKey), unless
    its front matter says `translation: false`;
  - both versions have the same date, so a translation never shows up as new;
  - file names have no Hashnode-style hash at the end;
  - every image referenced exists in static/ and has an alt text;
  - no PNG/JPG over 300 KB (run scripts/optimize_images.py to convert to WebP).

Link checks (public/):
  - every internal link, image, script and stylesheet points to a file that exists,
    including the targets of the redirect pages for old URLs.

Exits with 1 and a list of problems if anything fails.
"""
import glob
import html.parser
import os
import re
import sys
import urllib.parse

SITE = "https://luizschons.com"
problems = []


def problem(where, msg):
    problems.append(f"{where}: {msg}")


# ---- Content ---------------------------------------------------------------

def front_matter(text):
    if not text.startswith("---\n"):
        return {}, text
    head, _, body = text[4:].partition("\n---\n")
    fm = {}
    for line in head.splitlines():
        m = re.match(r"^(\w+):\s*(.*)$", line)
        if m:
            fm[m.group(1)] = m.group(2).strip().strip("'\"")
    return fm, body


def check_content():
    articles = {}  # key -> {lang: (file, date)}
    for path in sorted(glob.glob("content/posts/*.md")):
        name = os.path.basename(path)
        if name.startswith("_index"):
            continue
        lang = "pt-br" if name.endswith(".pt-br.md") else "en"
        stem = name[: -len(".pt-br.md")] if lang == "pt-br" else name[: -len(".md")]
        with open(path, encoding="utf-8") as fh:
            fm, body = front_matter(fh.read())

        for field in ("title", "date"):
            if not fm.get(field):
                problem(path, f"missing `{field}` in the front matter")
        if not fm.get("tags") or fm.get("tags") in ("[]", ""):
            problem(path, "no `tags` (topics) in the front matter")
        if re.search(r"-[0-9a-f]{12}$", stem):
            problem(path, "file name ends with a hash; use only the title (see README)")

        # Images: must exist and have alt text (code blocks are examples, skip them).
        prose = re.sub(r"```.*?```", "", body, flags=re.S)
        for tag in re.findall(r"<img\b[^>]*>", prose):
            src = (re.search(r'src="([^"]+)"', tag) or [None, ""])[1]
            alt = (re.search(r'alt="([^"]*)"', tag) or [None, ""])[1]
            if src.startswith("/") and not os.path.exists("static" + urllib.parse.unquote(src)):
                problem(path, f"image not found: {src}")
            if not alt.strip():
                problem(path, f"image without alt text: {src}")
        for src in re.findall(r'src="(/images/[^"]+)"|\]\((/images/[^)\s]+)', prose):
            src = src[0] or src[1]
            local = "static" + urllib.parse.unquote(src)
            if os.path.exists(local) and local.lower().endswith((".png", ".jpg", ".jpeg")) and os.path.getsize(local) > 300 * 1024:
                problem(path, f"heavy image ({os.path.getsize(local) // 1024} KB): {src}; run scripts/optimize_images.py")
        for alt, src in re.findall(r"!\[([^\]]*)\]\(([^)\s]+)", prose):
            if src.startswith("/") and not os.path.exists("static" + urllib.parse.unquote(src)):
                problem(path, f"image not found: {src}")
            if not alt.strip():
                problem(path, f"image without alt text: {src}")

        if fm.get("translation") == "false":
            continue
        key = fm.get("translationKey") or stem
        entry = articles.setdefault(key, {})
        if lang in entry:
            problem(path, f"two {lang} articles share translationKey `{key}` ({entry[lang][0]})")
        entry[lang] = (path, fm.get("date", ""))

    for key, langs in sorted(articles.items()):
        for lang, other in (("en", "pt-br"), ("pt-br", "en")):
            if lang in langs and other not in langs:
                missing = "Portuguese" if other == "pt-br" else "English"
                problem(langs[lang][0], f"no {missing} version (same translationKey `{key}`); "
                        "add it or set `translation: false`")
        if "en" in langs and "pt-br" in langs and langs["en"][1][:10] != langs["pt-br"][1][:10]:
            problem(langs["en"][0], f"date {langs['en'][1]} differs from the Portuguese version "
                    f"({langs['pt-br'][1]}); a translation must keep the original date")


# ---- Links -----------------------------------------------------------------

class Collector(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for attr in ("href", "src"):
            if a.get(attr) and not (tag == "link" and a.get("rel") in ("preconnect", "dns-prefetch")):
                self.urls.append(a[attr])
        if tag == "meta" and (a.get("http-equiv") or "").lower() == "refresh":
            m = re.search(r"url=(.+)$", a.get("content") or "", re.I)
            if m:
                self.urls.append(m.group(1).strip())


def resolve(page, url):
    """Return the file in public/ that an internal URL points to, or None if external."""
    if url.startswith(SITE):
        url = url[len(SITE):] or "/"
    parts = urllib.parse.urlsplit(url)
    if parts.scheme or parts.netloc or url.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    path = urllib.parse.unquote(parts.path)
    if not path:
        return None
    if not path.startswith("/"):
        path = os.path.normpath(os.path.join(os.path.dirname(page[len("public"):]), path))
    return "public" + path


def exists(target):
    if target.endswith("/"):
        return os.path.exists(target + "index.html")
    return os.path.exists(target) or os.path.exists(target + "/index.html")


def check_links():
    if not os.path.isdir("public"):
        problem("public", "run `hugo` before `check_site.py links`")
        return
    broken = {}
    pages = glob.glob("public/**/*.html", recursive=True)
    for page in pages:
        collector = Collector()
        with open(page, encoding="utf-8", errors="replace") as fh:
            collector.feed(fh.read())
        for url in collector.urls:
            target = resolve(page, url)
            if target and not exists(target):
                broken.setdefault(url, set()).add(page[len("public"):])
    for url, where in sorted(broken.items()):
        sample = ", ".join(sorted(where)[:3]) + (f" and {len(where) - 3} more" if len(where) > 3 else "")
        problem(url, f"broken internal link (on {sample})")
    print(f"Checked links on {len(pages)} pages")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "content"
    {"content": check_content, "links": check_links}[mode]()
    if problems:
        print(f"{len(problems)} problem(s) found:\n")
        print("\n".join(f"- {p}" for p in problems))
        sys.exit(1)
    print(f"{mode}: OK")
