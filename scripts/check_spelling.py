#!/usr/bin/env python3
"""Ortografia dos artigos (PT e EN) com cspell.

Uso:
  python3 scripts/check_spelling.py                  todos os artigos
  python3 scripts/check_spelling.py --changed REF    artigos alterados entre REF e HEAD
  python3 scripts/check_spelling.py --publishing     artigos com data de hoje ou ontem
  python3 scripts/check_spelling.py ARQUIVO...       arquivos específicos

No CI o check bloqueia só os artigos novos ou alterados (no PR e no push) e os
que estão sendo publicados no dia (no cron), para erro antigo não travar deploy.
Palavra certa que o corretor não conhece vai em tests/cspell-words.txt.
Precisa de `npm ci` em tests/ antes.
"""
import datetime
import os
import re
import subprocess
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
POSTS = ROOT / "content" / "posts"
TESTS = ROOT / "tests"
TZ = ZoneInfo("America/Sao_Paulo")


def is_article(path: Path) -> bool:
    return path.suffix == ".md" and not path.name.startswith("_index") and path.exists()


def all_posts():
    return sorted(p for p in POSTS.glob("*.md") if is_article(p))


def changed_posts(ref: str):
    if not ref or set(ref) == {"0"}:
        print(f"spelling: sem commit de base ({ref!r}), usando só o último commit")
        ref = "HEAD~1"
    try:
        out = subprocess.run(
            ["git", "diff", "--name-only", "--diff-filter=AMR", f"{ref}...HEAD", "--", "content/posts/"],
            cwd=ROOT, check=True, capture_output=True, text=True,
        ).stdout
    except subprocess.CalledProcessError as exc:
        print(f"spelling: não consegui comparar com {ref}: {exc.stderr.strip()}")
        print("spelling: usando só o último commit")
        out = subprocess.run(
            ["git", "diff", "--name-only", "--diff-filter=AMR", "HEAD~1", "HEAD", "--", "content/posts/"],
            cwd=ROOT, capture_output=True, text=True,
        ).stdout
    return sorted(p for p in (ROOT / line for line in out.split()) if is_article(p))


DATE_RE = re.compile(r"^date:\s*[\"']?(\d{4}-\d{2}-\d{2})", re.M)


def publishing_posts():
    today = datetime.datetime.now(TZ).date()
    days = {today.isoformat(), (today - datetime.timedelta(days=1)).isoformat()}
    found = []
    for path in all_posts():
        text = path.read_text(encoding="utf-8")
        if not text.startswith("---"):
            continue
        front = text.split("---", 2)[1]
        match = DATE_RE.search(front)
        if match and match.group(1) in days and not re.search(r"^draft:\s*true", front, re.M):
            found.append(path)
    return found


def main(argv):
    if not argv:
        files = all_posts()
    elif argv[0] == "--changed":
        files = changed_posts(argv[1] if len(argv) > 1 else "")
    elif argv[0] == "--publishing":
        files = publishing_posts()
    else:
        files = [Path(a).resolve() for a in argv]

    if not files:
        print("spelling: nenhum artigo para verificar")
        return 0

    print("spelling: verificando " + ", ".join(str(f.relative_to(ROOT)) if f.is_relative_to(ROOT) else str(f) for f in files), flush=True)
    cmd = ["npx", "--no-install", "cspell", "--no-progress", "--show-suggestions",
           "--config", "cspell.json", *(os.path.relpath(f, TESTS) for f in files)]
    result = subprocess.run(cmd, cwd=TESTS)
    if result.returncode:
        print("\nspelling: se a palavra estiver certa, adicione em tests/cspell-words.txt")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
