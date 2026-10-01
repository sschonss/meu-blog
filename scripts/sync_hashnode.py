#!/usr/bin/env python3
"""Sync published Hashnode posts from the public RSS feed into Hugo."""
import html
import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

RSS_URL = os.environ.get("HASHNODE_RSS", "https://luizschons.com/rss.xml")
OUT = "content/posts"
ASSET_ROOT = "static/images/posts"
CONTENT_NS = "http://purl.org/rss/1.0/modules/content/"

def clean(value):
    value = html.unescape(value or "")
    value = re.sub(r"<script.*?</script>", "", value, flags=re.I | re.S)
    value = re.sub(r"<style.*?</style>", "", value, flags=re.I | re.S)
    return value.strip()

def slug_from_url(url):
    return re.sub(r"[^a-z0-9-]", "-", url.rstrip("/").split("/")[-1].lower()).strip("-")

def main():
    request = urllib.request.Request(RSS_URL, headers={"User-Agent": "hugo-hashnode-sync/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        root = ET.fromstring(response.read())
    os.makedirs(OUT, exist_ok=True)
    for item in root.findall("./channel/item"):
        title = clean(item.findtext("title"))
        link = clean(item.findtext("link"))
        date = datetime.strptime(clean(item.findtext("pubDate")), "%a, %d %b %Y %H:%M:%S %Z").date()
        content = item.findtext(f"{{{CONTENT_NS}}}encoded") or item.findtext("description") or ""
        slug = slug_from_url(link)
        path = os.path.join(OUT, f"{slug}.md")
        series = "AI-Friendly Architecture" if any(word in title.lower() for word in ("agent", "context", "skill", "guardrail", "software ready", "epic to production", "observability")) else ""
        series_line = f"series: ['{series}']\n" if series else ""
        frontmatter = f"---\ntitle: {title!r}\ndate: {date.isoformat()}\nsource: {link}\n{series_line}draft: false\n---\n\n"
        body = clean(content)
        body = localize_images(body, slug)
        with open(path, "w", encoding="utf-8") as file:
            file.write(frontmatter + body + "\n")
    print(f"Synced {len(root.findall('./channel/item'))} Hashnode posts")

def localize_images(body, slug):
    urls = set(re.findall(r'https://cdn\.hashnode\.com/[^"<> )]+', body))
    for url in urls:
        filename = url.split("?")[0].rstrip("/").split("/")[-1]
        if not re.search(r'\.(png|jpe?g|gif|webp)$', filename, re.I):
            filename += ".png"
        destination = Path(ASSET_ROOT) / slug / filename
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists():
            request = urllib.request.Request(url, headers={"User-Agent": "hugo-hashnode-sync/1.0"})
            with urllib.request.urlopen(request, timeout=30) as response:
                destination.write_bytes(response.read())
        body = body.replace(url, f"/meu-blog/images/posts/{slug}/{filename}")
    return body

if __name__ == "__main__":
    main()
