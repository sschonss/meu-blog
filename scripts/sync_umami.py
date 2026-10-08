#!/usr/bin/env python3
"""Save the most read articles of the last 30 days, from Umami, for the home page.

It reads the public share link of the Umami dashboard (read-only, no API key), so
nothing secret lives in the repository. Views of the EN and PT versions of an
article are added together, keyed by translationKey (or the file name).

Writes data/popular.json. On any failure it writes nothing and exits with an
error, and the home page simply hides the "Most read" block.
"""
import datetime as dt
import glob
import json
import os
import re
import sys
import urllib.parse
import urllib.request

SHARE_ID = os.environ.get("UMAMI_SHARE_ID", "JQpoT7GCVR60kayU")
API_BASES = [
    "https://cloud.umami.is/analytics/us/api",
    "https://gateway-us.umami.is/api",
    "https://cloud.umami.is/api",
]
DAYS = 30
TOP = 10
OUTPUT = "data/popular.json"


def get(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": "hugo-umami-sync/1.0", "Accept": "application/json", **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def article_keys():
    """Map every article URL path (EN and PT) to its translation key."""
    paths = {}
    for f in glob.glob("content/posts/*.md"):
        name = os.path.basename(f)
        if name.startswith("_index"):
            continue
        stem = name[: -len(".pt-br.md")] if name.endswith(".pt-br.md") else name[: -len(".md")]
        with open(f, encoding="utf-8") as fh:
            head = fh.read().split("\n---", 1)[0]
        m = re.search(r"^translationKey:\s*['\"]?([^'\"\n]+)", head, re.M)
        key = m.group(1).strip() if m else stem
        prefix = "/pt-br/posts/" if name.endswith(".pt-br.md") else "/posts/"
        paths[prefix + stem + "/"] = key
    return paths


def normalize(path):
    path = urllib.parse.urlsplit(path).path or "/"
    return path if path.endswith("/") else path + "/"


def fetch_metrics():
    end = dt.datetime.now(dt.timezone.utc)
    start = end - dt.timedelta(days=DAYS)
    window = {"startAt": int(start.timestamp() * 1000), "endAt": int(end.timestamp() * 1000)}
    errors = []
    for base in API_BASES:
        try:
            share = get(f"{base}/share/{SHARE_ID}")
            website, token = share["websiteId"], share["token"]
        except Exception as exc:  # noqa: BLE001 - try the next base
            errors.append(f"{base}/share: {exc}")
            continue
        for metric in ("path", "url"):  # newer Umami calls it "path", older "url"
            query = urllib.parse.urlencode({**window, "type": metric, "limit": 500})
            try:
                rows = get(f"{base}/websites/{website}/metrics?{query}", {"x-umami-share-token": token})
                if isinstance(rows, list):
                    print(f"Umami: {len(rows)} rows from {base} (type={metric})")
                    return rows
                errors.append(f"{base} type={metric}: unexpected response {str(rows)[:200]}")
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{base} type={metric}: {exc}")
    raise RuntimeError("; ".join(errors))


def main():
    rows = fetch_metrics()
    keys = article_keys()
    views = {}
    for row in rows:
        key = keys.get(normalize(str(row.get("x", ""))))
        if key:
            views[key] = views.get(key, 0) + int(row.get("y", 0))
    ranked = sorted(views.items(), key=lambda kv: (-kv[1], kv[0]))[:TOP]
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as fh:
        json.dump({
            "updated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d"),
            "days": DAYS,
            "posts": [{"key": k, "views": v} for k, v in ranked],
        }, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print("Most read:", ", ".join(f"{k} ({v})" for k, v in ranked) or "none yet")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"Umami sync failed: {exc}", file=sys.stderr)
        sys.exit(1)
