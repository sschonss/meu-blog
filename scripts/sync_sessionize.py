#!/usr/bin/env python3
"""Keep the public Sessionize speaker profile available to Hugo.

Events listed under `organizer` in data/sessionize_overrides.yaml are stored
in "organized" instead of "events". The daily sync then cannot put them back
on the talks list. The site shows those events as Organizer / Organizador.
"""
import json
import os
import urllib.request

URL = "https://sessionize.com/api/speaker/json/2n3e2etaad"
OUTPUT = "data/sessionize.json"
OVERRIDES = "data/sessionize_overrides.yaml"


def organizer_ids(path):
    """Read the organizer id list. The file is small and has no nested YAML."""
    ids = set()
    in_list = False
    if not os.path.exists(path):
        return ids
    with open(path, encoding="utf-8") as file:
        for line in file:
            text = line.split("#", 1)[0].strip()
            if not text:
                continue
            if text == "organizer:":
                in_list = True
                continue
            if in_list and text.startswith("-"):
                ids.add(int(text[1:].strip()))
                continue
            in_list = False
    return ids


def apply_overrides(profile, skip):
    events = profile.get("events") or []
    profile["events"] = [event for event in events if event.get("id") not in skip]
    profile["organized"] = [event for event in events if event.get("id") in skip]
    return profile


def main():
    request = urllib.request.Request(URL, headers={"User-Agent": "hugo-sessionize-sync/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        profile = json.load(response)

    apply_overrides(profile, organizer_ids(OVERRIDES))

    os.makedirs(os.path.dirname(OUTPUT) or ".", exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as file:
        json.dump(profile, file, ensure_ascii=False, indent=2)
        file.write("\n")
    print(
        f"Synced {len(profile.get('sessions', []))} Sessionize talks, "
        f"{len(profile['organized'])} organizer events set aside"
    )


if __name__ == "__main__":
    main()
