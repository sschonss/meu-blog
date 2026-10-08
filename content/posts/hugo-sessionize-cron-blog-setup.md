---
title: 'Hugo, Sessionize and a cron job: my blog setup'
date: 2026-10-07
description: 'How I moved from Hashnode to a bilingual Hugo blog, with talks pulled from Sessionize, automatic preview images and a daily deploy on GitHub Actions.'
translationKey: hugo-sessionize-cron-blog-setup
draft: false
tags: ['Hugo', 'GitHub Actions']
---

For a good while my blog lived on Hashnode, and it worked fine. The problem showed up when I started writing in both English and Portuguese: Hashnode has no real support for two languages, so I published every article twice, as if they were unrelated posts, with nothing linking one to the other.

I mentioned this to [Leo Cavalcante](https://leocavalcante.dev), and he introduced me to Hugo. Thank you, Leo: that conversation turned into the blog you are reading now.

Hugo gave me a lot more flexibility. In this post I walk through how I put it all together: the two languages, the talks page that updates itself, the automatically generated preview images, and the deploy that runs every day without me touching anything.

## One place for both languages

In Hugo, each article is a text file in the repository, and the translation is just another file next to it. Hugo understands that both are the same article: the English version lives at [luizschons.com](https://luizschons.com), the Portuguese one under `/pt-br/`, and each links to the other.

In practice, the articles folder looks like this:

```text
content/posts/
├── agent-observability-with-opentelemetry.md        # English
├── agent-observability-with-opentelemetry.pt-br.md  # Portuguese
└── microservices-sao-debitos-tecnicos.pt-br.md      # Portuguese only
```

What links the two versions is the `translationKey` in the front matter, and in `hugo.toml` you only need to declare the languages:

```markdown
---
title: 'Agent Observability with OpenTelemetry'
date: 2026-09-16
series: ['AI-Friendly Architecture']
translationKey: agent-observability-with-opentelemetry
---
```

```toml
defaultContentLanguage = 'en'

[languages.en]
  languageCode = 'en-us'
  weight = 1
[languages."pt-br"]
  languageCode = 'pt-br'
  weight = 2
```

That solved what bothered me on Hashnode. One article, two versions, all in one place, and Google understands they are the same page in different languages. The look came from a theme called Hextra, which I kept adapting with my own layouts until it felt like mine.

## Talks straight from Sessionize

All my talks and the events I have spoken at or organized were already on [Sessionize](https://sessionize.com/sschonss/). Keeping the same list on the blog would mean doing the work twice again, so the blog now reads the data from there.

Sessionize has a public API that returns the profile, the talks and the events as JSON. The [talks page](https://luizschons.com/speakers/) uses that JSON twice: when the site is built, and again in the browser of whoever opens the page. In practice, I add an event on Sessionize and a few minutes later it shows up on the blog, split into upcoming and past.

At build time, a script of a few lines saves the JSON into `data/`, where Hugo sees it as `site.Data.sessionize`:

```python
URL = "https://sessionize.com/api/speaker/json/2n3e2etaad"
OUTPUT = "data/sessionize.json"

request = urllib.request.Request(URL, headers={"User-Agent": "hugo-sessionize-sync/1.0"})
with urllib.request.urlopen(request, timeout=30) as response:
    profile = json.load(response)

with open(OUTPUT, "w", encoding="utf-8") as file:
    json.dump(profile, file, ensure_ascii=False, indent=2)
```

The template splits events by their end date, compared with the build day:

```go-html-template
{{- $today := time.AsTime (now.Format "2006-01-02") -}}
{{- range site.Data.sessionize.events -}}
  {{- if ge (time.AsTime .eventEndDate).Unix $today.Unix -}}
    {{- $upcoming = $upcoming | append . -}}
  {{- else -}}
    {{- $past = $past | append . -}}
  {{- end -}}
{{- end -}}
```

In the browser, the same JSON is fetched again. Sessionize allows CORS, so a plain `fetch` is enough. If it fails, the page keeps the build version and shows a link to the profile:

```javascript
fetch('https://sessionize.com/api/speaker/json/2n3e2etaad')
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(render)   // redraws events, talks, stats and photo
  .catch(fail);   // shows the notice with the profile link
```

The profile photo follows the same idea. It comes from Sessionize on the home page, on the talks page, in the site icon and in the preview images: change it there, it changes here.

And if Sessionize goes down? The page keeps showing the last saved version, with a link to my profile, and the photo falls back to a copy stored in the blog itself.

The photo fallback is plain HTML, so it works even before JavaScript loads:

```html
<img src="https://cdn.sessionize.com/image/..."
     onerror="this.onerror=null;this.src='/images/profile-fallback.jpg'">
```

## Preview images that make themselves

When someone shares a link on LinkedIn or WhatsApp, the card image is what catches the eye. I did not want to open Canva for every new article, so Hugo generates that image itself.

While building the site, it draws one image per page, in both languages, with the article title, the series name when there is one, my photo and my name. I publish an article and the image comes with it. If I change my photo on Sessionize, every image picks up the new one on the next deploy.

This is the image the blog generated for the last article in the AI-Friendly Architecture series:

![Preview image generated automatically for the article Agent Observability with OpenTelemetry](/images/posts/hugo-sessionize-cron-blog-setup/preview-en.png)

No external service, no headless browser: just Hugo's own image filters applied on top of a white background. The heart of the `og-image.html` partial is this:

```go-html-template
{{- $filters := slice
  (images.Text $kicker (dict "font" $medium "size" 24 "color" "#64748b" "x" 80 "y" 62))
-}}
{{- range $i, $l := $lines -}}
  {{- $filters = $filters | append
      (images.Text $l (dict "font" $bold "size" $size "color" "#111827" "x" 78 "y" (add 110 (mul $i $lineHeight)))) -}}
{{- end -}}

{{- with resources.Get "images/profile.jpg" -}}
  {{- $avatar := .Fill "96x96 Center q90" | images.Filter (images.Mask (resources.Get "og/avatar-mask.png")) -}}
  {{- $filters = $filters | append (images.Overlay $avatar 80 502) -}}
{{- end -}}

{{- $img := resources.Get "og/base.png" | images.Filter $filters -}}
{{- return ($img | resources.Copy (printf "og/%s-%s.png" $page.Language.Lang (md5 $title))) -}}
```

The title is broken into lines beforehand (`$lines`), with the font size picked by its length. After that, the meta tags just point at the image:

```go-html-template
{{- with partialCached "og-image.html" . .RelPermalink }}
<meta property="og:image" content="{{ .Permalink }}">
<meta name="twitter:card" content="summary_large_image">
{{- end }}
```

## The blog updates itself every day

The site is static and hosted on GitHub Pages. A GitHub Actions workflow builds and publishes it, and it runs in three situations: when I push, every day at night, and when I click "Run workflow".

On every run it fetches the data from Sessionize, generates the icon and the preview images, builds the site with Hugo and publishes it. The daily run is what keeps talks and photo up to date, even in weeks when I write nothing.

![Blog architecture: GitHub Actions combines the repository and Sessionize, publishes to GitHub Pages, and the browser fetches Sessionize again](/images/posts/hugo-sessionize-cron-blog-setup/architecture-en.svg)

The whole workflow fits on one screen. The `cron` runs at 03:17 UTC (00:17 in Brasília), and every step that depends on Sessionize has an `|| echo` so it never takes the deploy down:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '17 3 * * *'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive        # the Hextra theme is a submodule
      - name: Refresh Sessionize data
        run: python3 scripts/sync_sessionize.py || echo "using committed data"
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Build favicons and backup photo
        run: |
          pip install --quiet pillow
          python3 scripts/build_favicons.py || echo "using committed icons"
      - uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: 'latest'
          extended: true
      - run: hugo --minify
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./public
      - uses: actions/deploy-pages@v4
```

Notice `contents: read`: the workflow only reads the repository and never writes to it.

A choice I am happy with: the workflow never commits to the repository. The Sessionize data is fetched at build time, so I could protect the `main` branch so that only I can push changes. If Sessionize fails along the way, the build carries on with the last saved version.

The protection is a ruleset on `main` with three rules (restrict updates, restrict deletions and block force pushes) and a single bypass: the repository admin role, which only I have. Since GitHub Actions cannot be an exception in a personal repository's ruleset, this setup only works because the workflow never needs to commit anything.

## What's next

Today I write in one place, in both languages, and everything else takes care of itself: talks, photo, preview images and deploy. I track visits with [Umami](https://umami.is), which does not use cookies and so needs no annoying consent banner.

The script is only included in the production build and only counts the real domain, so running `hugo server` locally does not skew the numbers:

```go-html-template
{{ if hugo.IsProduction }}
<script defer src="https://cloud.umami.is/script.js"
        data-website-id="..." data-domains="luizschons.com"></script>
{{ end }}
```

The code is open at [github.com/sschonss/meu-blog](https://github.com/sschonss/meu-blog), with a README explaining each part. If you also write in more than one language and are tired of publishing everything twice, take a look, and reach out on [LinkedIn](https://www.linkedin.com/in/luiz-schons/) if you want to chat.
