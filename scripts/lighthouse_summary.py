#!/usr/bin/env python3
"""Tabela em Markdown com as notas do Lighthouse CI (mediana dos runs por página).

Uso: python3 scripts/lighthouse_summary.py tests/.lighthouseci/reports/manifest.json
"""
import json
import statistics
import sys
from pathlib import Path
from urllib.parse import urlparse

CATEGORIES = [("performance", "Performance"), ("accessibility", "Acessibilidade"),
              ("best-practices", "Boas práticas"), ("seo", "SEO")]


def main(path):
    manifest = Path(path)
    if not manifest.exists():
        print("### Lighthouse\n\nSem resultados (o Lighthouse CI não gerou o manifest.json).")
        return 0
    runs = {}
    for entry in json.loads(manifest.read_text()):
        runs.setdefault(urlparse(entry["url"]).path, []).append(entry["summary"])
    print("### Lighthouse (mediana de %d runs)\n" % max(len(r) for r in runs.values()))
    print("| Página | " + " | ".join(label for _, label in CATEGORIES) + " |")
    print("|---|" + "---|" * len(CATEGORIES))
    for page, summaries in runs.items():
        cells = []
        for key, _ in CATEGORIES:
            values = [s[key] for s in summaries if s.get(key) is not None]
            cells.append(str(round(statistics.median(values) * 100)) if values else "-")
        print(f"| `{page}` | " + " | ".join(cells) + " |")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "tests/.lighthouseci/reports/manifest.json"))
