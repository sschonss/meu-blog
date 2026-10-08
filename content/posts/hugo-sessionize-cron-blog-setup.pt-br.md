---
title: 'Hugo, Sessionize e um cron: o setup do meu blog'
date: 2026-10-07
description: 'Como saí do Hashnode para um blog em Hugo, em dois idiomas, com palestras do Sessionize, imagens de prévia automáticas e deploy diário no GitHub Actions.'
translationKey: hugo-sessionize-cron-blog-setup
draft: false
---

Durante um bom tempo meu blog morou no Hashnode, e funcionava bem. O problema apareceu quando comecei a escrever em inglês e português: o Hashnode não tem suporte de verdade a dois idiomas, então eu publicava cada artigo duas vezes, como se fossem posts diferentes, sem nada ligando um ao outro.

Comentei isso com o [Leo Cavalcante](https://leocavalcante.dev), e ele me apresentou o Hugo. Fica aqui o meu agradecimento, Leo: essa conversa virou o blog que você está lendo agora.

Com o Hugo eu ganhei bem mais flexibilidade. Neste post eu conto como montei tudo: os dois idiomas, as palestras que se atualizam sozinhas, as imagens de prévia geradas automaticamente e o deploy que roda todo dia sem eu encostar em nada.

## Um lugar só para os dois idiomas

No Hugo, cada artigo é um arquivo de texto no repositório, e a tradução é só outro arquivo ao lado dele. O Hugo entende que os dois são o mesmo artigo: a versão em inglês fica em [luizschons.com](https://luizschons.com), a em português em `/pt-br/`, e cada uma tem um link para a outra.

Na prática, a pasta de artigos fica assim:

```text
content/posts/
├── agent-observability-with-opentelemetry.md        # inglês
├── agent-observability-with-opentelemetry.pt-br.md  # português
└── microservices-sao-debitos-tecnicos.pt-br.md      # só em português
```

O que liga as duas versões é o `translationKey` no front matter, e no `hugo.toml` basta declarar os idiomas:

```markdown
---
title: 'Observabilidade de Agentes com OpenTelemetry'
date: 2026-09-16
series: ['Arquitetura Amigável à IA']
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

Isso resolveu o que me incomodava no Hashnode. Um artigo, duas versões, tudo no mesmo lugar, e o Google entende que são a mesma página em idiomas diferentes. O visual veio de um tema chamado Hextra, que eu fui adaptando com layouts próprios até ficar com a minha cara.

## Palestras direto do Sessionize

Todas as minhas palestras e os eventos em que palestrei/organizei já estavam no [Sessionize](https://sessionize.com/sschonss/). Manter a mesma lista no blog seria trabalho dobrado de novo, então o blog passou a ler os dados de lá.

O Sessionize tem uma API pública que devolve o perfil, as palestras e os eventos em JSON. A [página de palestras](https://luizschons.com/pt-br/speakers/) usa esse JSON duas vezes: na hora em que o site é gerado e de novo no navegador de quem abre a página. Na prática, eu cadastro um evento no Sessionize e em poucos minutos ele aparece no blog, separado entre próximos e passados.

No build, um script de poucas linhas salva o JSON em `data/`, onde o Hugo o enxerga como `site.Data.sessionize`:

```python
URL = "https://sessionize.com/api/speaker/json/2n3e2etaad"
OUTPUT = "data/sessionize.json"

request = urllib.request.Request(URL, headers={"User-Agent": "hugo-sessionize-sync/1.0"})
with urllib.request.urlopen(request, timeout=30) as response:
    profile = json.load(response)

with open(OUTPUT, "w", encoding="utf-8") as file:
    json.dump(profile, file, ensure_ascii=False, indent=2)
```

O template separa os eventos pela data de fim, comparando com o dia do build:

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

No navegador, o mesmo JSON é buscado de novo. O Sessionize libera CORS, então basta um `fetch`. Se falhar, a página fica com a versão do build e mostra o link do perfil:

```javascript
fetch('https://sessionize.com/api/speaker/json/2n3e2etaad')
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(render)   // redesenha eventos, palestras, números e foto
  .catch(fail);   // mostra o aviso com o link do perfil
```

A foto de perfil segue a mesma ideia. Ela vem do Sessionize na home, na página de palestras, no ícone do site e nas imagens de prévia: trocou lá, troca aqui.

E se o Sessionize sair do ar? A página continua mostrando a última versão salva, com um link para o meu perfil, e a foto cai numa cópia guardada no próprio blog.

O fallback da foto é só HTML, então funciona mesmo antes de o JavaScript carregar:

```html
<img src="https://cdn.sessionize.com/image/..."
     onerror="this.onerror=null;this.src='/images/profile-fallback.jpg'">
```

## Imagens de prévia que se fazem sozinhas

Quando alguém compartilha um link no LinkedIn ou no WhatsApp, o que chama atenção é a imagem do card. Eu não queria abrir o Canva a cada artigo novo, então o próprio Hugo gera essa imagem.

Na hora de montar o site, ele desenha uma imagem por página, nos dois idiomas, com o título do artigo, o nome da série quando existe, minha foto e meu nome. Publiquei um artigo, a imagem já vem junto. Se eu trocar a foto no Sessionize, todas as imagens passam a usar a nova no próximo deploy.

Esta é a imagem que o blog gerou para o último artigo da série sobre arquitetura amigável à IA:

![Imagem de prévia gerada automaticamente para o artigo Observabilidade de Agentes com OpenTelemetry](/images/posts/hugo-sessionize-cron-blog-setup/preview-pt.png)

Não tem serviço externo nem headless browser: são os filtros de imagem do próprio Hugo aplicados sobre um fundo branco. O coração do partial `og-image.html` é isto:

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

O título é quebrado em linhas antes (`$lines`), com o tamanho da fonte escolhido pelo comprimento. Depois é só apontar as meta tags para a imagem:

```go-html-template
{{- with partialCached "og-image.html" . .RelPermalink }}
<meta property="og:image" content="{{ .Permalink }}">
<meta name="twitter:card" content="summary_large_image">
{{- end }}
```

## O blog se atualiza todo dia

O site é estático e fica no GitHub Pages. Quem monta e publica é um workflow do GitHub Actions, que roda em três situações: quando eu faço push, todo dia de madrugada e quando eu clico em "Run workflow".

A cada execução ele busca os dados no Sessionize, gera o ícone e as imagens de prévia, monta o site com o Hugo e publica. A rodada diária é o que mantém palestras e foto em dia, mesmo nas semanas em que eu não escrevo nada.

![Arquitetura do blog: o GitHub Actions junta repositório e Sessionize, publica no GitHub Pages, e o navegador busca o Sessionize de novo](/images/posts/hugo-sessionize-cron-blog-setup/architecture-pt.svg)

O workflow inteiro cabe numa tela. O `cron` roda às 3:17 UTC, que é 00:17 em Brasília, e cada passo que depende do Sessionize tem um `|| echo` para não derrubar o deploy:

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
          submodules: recursive        # o tema Hextra é um submódulo
      - name: Refresh Sessionize data
        run: python3 scripts/sync_sessionize.py || echo "usando dados commitados"
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Build favicons and backup photo
        run: |
          pip install --quiet pillow
          python3 scripts/build_favicons.py || echo "usando ícones commitados"
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

Repare em `contents: read`: o workflow só lê o repositório e nunca escreve nele.

Uma escolha que eu gostei: o workflow nunca faz commit no repositório. Os dados do Sessionize são buscados na hora do build, então eu pude proteger a branch `main` para só eu conseguir enviar mudanças. Se o Sessionize falhar no meio do caminho, o build segue com a última versão salva.

A proteção é um ruleset na `main` com três regras (restringir updates, restringir exclusão e bloquear force push) e um único bypass: o papel de admin do repositório, que só eu tenho. Como o GitHub Actions não pode ser exceção num ruleset de repositório pessoal, esse desenho só funciona porque o workflow não precisa commitar nada.

## O que vem agora

Hoje eu escrevo em um lugar só, nos dois idiomas, e o resto se ajeita sozinho: palestras, foto, imagens de prévia e deploy. As visitas eu acompanho com o [Umami](https://umami.is), que não usa cookies e por isso dispensa aquele banner chato.

O script só entra no build de produção e só conta o domínio real, então rodar o `hugo server` localmente não suja os números:

```go-html-template
{{ if hugo.IsProduction }}
<script defer src="https://cloud.umami.is/script.js"
        data-website-id="..." data-domains="luizschons.com"></script>
{{ end }}
```

O código está aberto em [github.com/sschonss/meu-blog](https://github.com/sschonss/meu-blog), com um README explicando cada parte. Se você também escreve em mais de um idioma e está cansado de publicar tudo duas vezes, dá uma olhada e me chama no [LinkedIn](https://www.linkedin.com/in/luiz-schons/) se quiser trocar ideia.
