#!/usr/bin/env python3
"""Turn newly published articles into a Buttondown email.

Runs in the deploy workflow, after the site is live. For each article published
in the last DAYS days (both languages share one email), it creates an email in
Buttondown unless one with the same subject already exists, so running the
deploy several times never sends twice.

Environment:
  BUTTONDOWN_API_KEY  repository secret; without it the script does nothing.
  NEWSLETTER_MODE     "draft" (default): the email waits in Buttondown for you
                      to review and send. "send": it goes out right away.
"""
import datetime as dt
import glob
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request

API = "https://api.buttondown.com/v1"
SITE = "https://luizschons.com"
DAYS = 2
TZ = dt.timezone(dt.timedelta(hours=-3))  # America/Sao_Paulo, same as hugo.toml


def front_matter(text):
    head, _, body = text[4:].partition("\n---\n") if text.startswith("---\n") else ("", "", text)
    fm = {}
    for line in head.splitlines():
        m = re.match(r"^(\w+):\s*(.*)$", line)
        if m:
            fm[m.group(1)] = m.group(2).strip().strip("'\"")
    return fm, body


def summary(fm, body, limit=300):
    if fm.get("description"):
        return fm["description"]
    prose = re.sub(r"```.*?```", "", body, flags=re.S)
    for block in re.split(r"\n\s*\n|</p>", prose):
        text = html.unescape(re.sub(r"<[^>]+>|[*_`#>]", "", block)).strip()
        text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
        if len(text) > 60:
            return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0] + "…"
    return ""


def recent_articles(today):
    articles = {}
    for path in glob.glob("content/posts/*.md"):
        name = os.path.basename(path)
        if name.startswith("_index"):
            continue
        lang = "pt-br" if name.endswith(".pt-br.md") else "en"
        stem = name[: -len(".pt-br.md")] if lang == "pt-br" else name[: -len(".md")]
        with open(path, encoding="utf-8") as fh:
            fm, body = front_matter(fh.read())
        if fm.get("draft") == "true":
            continue
        try:
            date = dt.date.fromisoformat(fm.get("date", "")[:10])
        except ValueError:
            continue
        if not (today - dt.timedelta(days=DAYS) <= date <= today):
            continue  # older, or scheduled for later
        url = f"{SITE}/pt-br/posts/{stem}/" if lang == "pt-br" else f"{SITE}/posts/{stem}/"
        key = fm.get("translationKey") or stem
        articles.setdefault(key, {})[lang] = {"title": fm.get("title", stem), "url": url, "summary": summary(fm, body)}
    return articles


def email_for(versions):
    pt, en = versions.get("pt-br"), versions.get("en")
    main = pt or en
    parts = [f"## [{main['title']}]({main['url']})", "", main["summary"], "",
             f"[{'Ler o artigo' if pt else 'Read the article'} →]({main['url']})"]
    if pt and en:
        parts += ["", "---", "", f"**In English:** [{en['title']}]({en['url']})", "", en["summary"]]
    parts += ["", "---", "", f"[luizschons.com]({SITE}/) · Luiz Schons"]
    return main["title"], "\n".join(parts)


def request(method, path, key, data=None, extra=None):
    req = urllib.request.Request(
        API + path, method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={"Authorization": f"Token {key}", "Content-Type": "application/json",
                 "User-Agent": "luizschons-newsletter/1.0", **(extra or {})})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def existing_subjects(key):
    subjects, path = set(), "/emails"
    for _ in range(20):  # a few pages are plenty
        page = request("GET", path, key)
        subjects.update(e.get("subject", "") for e in page.get("results", []))
        nxt = page.get("next")
        if not nxt:
            break
        path = nxt.split("/v1", 1)[-1]
    return subjects


def main():
    key = os.environ.get("BUTTONDOWN_API_KEY", "").strip()
    if not key:
        print("BUTTONDOWN_API_KEY not set; skipping the newsletter")
        return 0
    mode = os.environ.get("NEWSLETTER_MODE", "draft").strip().lower()
    today = dt.datetime.now(TZ).date()
    articles = recent_articles(today)
    if not articles:
        print(f"No article published in the last {DAYS} days; nothing to send")
        return 0

    sent = existing_subjects(key)
    for versions in articles.values():
        subject, body = email_for(versions)
        if subject in sent:
            print(f"Already in Buttondown: {subject}")
            continue
        payload = {"subject": subject, "body": body, "status": "about_to_send" if mode == "send" else "draft"}
        extra = {"X-Buttondown-Live-Dangerously": "true"} if mode == "send" else {}
        request("POST", "/emails", key, payload, extra)
        print(f"{'Sent' if mode == 'send' else 'Draft created'}: {subject}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except urllib.error.HTTPError as exc:
        print(f"Buttondown API error {exc.code}: {exc.read().decode(errors='replace')[:500]}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:  # noqa: BLE001
        print(f"Newsletter failed: {exc}", file=sys.stderr)
        sys.exit(1)
