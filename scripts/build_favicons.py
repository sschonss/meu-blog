#!/usr/bin/env python3
"""Generate the site icons and backup photo from the Sessionize profile photo.

Runs in the deploy workflow after sync_sessionize.py, so changing the photo on
Sessionize updates the favicon on the next deploy (at least daily). If the
photo can't be downloaded, the icons committed in static/ are kept.

Usage:
  python3 scripts/build_favicons.py                 # photo from data/sessionize.json
  python3 scripts/build_favicons.py --source x.jpg  # local image (for testing)
"""
import io
import json
import sys
import urllib.request

from PIL import Image, ImageDraw

DATA = "data/sessionize.json"
OUT = "static"
FALLBACK = "images/profile-fallback.jpg"


def load_source():
    if "--source" in sys.argv:
        return Image.open(sys.argv[sys.argv.index("--source") + 1])
    with open(DATA, encoding="utf-8") as file:
        speaker = json.load(file).get("speaker") or {}
    url = speaker.get("photoLargeUrl") or speaker.get("photoUrl")
    if not url:
        raise SystemExit("No photo URL in Sessionize data; keeping existing icons")
    request = urllib.request.Request(url, headers={"User-Agent": "hugo-sessionize-sync/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return Image.open(io.BytesIO(response.read()))


def square(image):
    image = image.convert("RGB")
    side = min(image.size)
    left = (image.width - side) // 2
    top = (image.height - side) // 2
    return image.crop((left, top, left + side, top + side))


def circle(image, size):
    big = image.resize((size * 4, size * 4), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", big.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, big.width - 1, big.height - 1), fill=255)
    big.putalpha(mask)
    return big.resize((size, size), Image.LANCZOS)


def main():
    photo = square(load_source())
    circle(photo, 16).save(f"{OUT}/favicon-16x16.png", optimize=True)
    circle(photo, 32).save(f"{OUT}/favicon-32x32.png", optimize=True)
    circle(photo, 192).save(f"{OUT}/android-chrome-192x192.png", optimize=True)
    circle(photo, 512).save(f"{OUT}/android-chrome-512x512.png", optimize=True)
    circle(photo, 256).save(f"{OUT}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    # iOS draws its own rounded corners and doesn't support transparency.
    photo.resize((180, 180), Image.LANCZOS).save(f"{OUT}/apple-touch-icon.png", optimize=True)
    # Backup copy shown on the site if the Sessionize image can't be loaded.
    photo.resize((256, 256), Image.LANCZOS).save(f"{OUT}/{FALLBACK}", quality=88, optimize=True)
    print("Generated favicons from the Sessionize photo")


if __name__ == "__main__":
    main()
