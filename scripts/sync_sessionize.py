#!/usr/bin/env python3
"""Keep the public Sessionize speaker profile available to Hugo."""
import json
import os
import urllib.request

URL = "https://sessionize.com/api/speaker/json/2n3e2etaad"
OUTPUT = "data/sessionize.json"

request = urllib.request.Request(URL, headers={"User-Agent": "hugo-sessionize-sync/1.0"})
with urllib.request.urlopen(request, timeout=30) as response:
    profile = json.load(response)

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, "w", encoding="utf-8") as file:
    json.dump(profile, file, ensure_ascii=False, indent=2)
    file.write("\n")
print(f"Synced {len(profile.get('sessions', []))} Sessionize talks")
