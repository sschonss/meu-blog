# Meu Blog

Blog pessoal do Luiz Schons, em inglês e português, publicado em **[luizschons.com](https://luizschons.com)**.

Feito com [Hugo](https://gohugo.io) e o tema [Hextra](https://github.com/imfing/hextra), com layouts próprios, e publicado no GitHub Pages.

## Como funciona

```
push na main / todo dia 00:17 (BRT) / execução manual
        │
        ▼
GitHub Actions (.github/workflows/hugo.yml)
  1. busca o JSON do Sessionize          → data/sessionize.json
  2. gera favicons e foto de backup      → static/
  3. hugo --minify                       → public/
  4. publica no GitHub Pages
```

O site é estático. Os únicos dados externos vêm do Sessionize. Eles são lidos na hora do build e de novo no navegador de quem abre a página, então o site fica sempre atualizado sem precisar de commits automáticos.

## Idiomas

- O inglês é o idioma padrão, em `/`, e o português fica em `/pt-br/`. A configuração está em `hugo.toml`.
- Cada página tem duas versões: `arquivo.md` (EN) e `arquivo.pt-br.md` (PT).
- Os textos fixos dos layouts ficam em `i18n/en.yaml` e `i18n/pt-br.yaml`.
- As datas aparecem com o mês no idioma da página, por exemplo `16 Sep 2026` e `16 set 2026`. Isso é feito em `layouts/_partials/post-date.html`.

## Artigos

Os artigos ficam em `content/posts/`. Para publicar um novo, crie um Markdown com front matter:

```markdown
---
title: 'Meu artigo'
date: 2026-10-01
series: ['AI-Friendly Architecture']   # opcional
translationKey: meu-artigo             # liga a versão EN com a PT
draft: false
---
```

- **Tradução:** crie `meu-artigo.pt-br.md` com o mesmo `translationKey`.
- **Séries:** são uma taxonomia (`series`) e ganham páginas próprias em `/series/`.
- **Imagens:** ficam em `static/images/posts/`.
- **URLs antigas:** os `aliases` no front matter redirecionam endereços antigos para o novo. Páginas inexistentes caem no `404.html`, que leva para a home.

> `scripts/sync_hashnode.py` foi usado para importar os artigos antigos do Hashnode. Ele não roda no deploy.

## Palestras e integração com o Sessionize

A página de palestras (`/speakers/` e `/pt-br/speakers/`) é montada a partir do perfil público do Sessionize:

- API: `https://sessionize.com/api/speaker/json/2n3e2etaad`
- Perfil: https://sessionize.com/sschonss/

**Para atualizar, basta editar o Sessionize.** Eventos, palestras, tagline e foto aparecem no blog sozinhos.

| O quê | Como atualiza | Quando |
| --- | --- | --- |
| Eventos, palestras, números, tagline | O navegador busca o JSON ao abrir a página (`assets/js/talks.js`) | Na hora (o Sessionize faz cache de ~4 min) |
| Versão base da página (SEO, sem JS) | `scripts/sync_sessionize.py` no deploy grava `data/sessionize.json` | A cada deploy, pelo menos 1x por dia |
| Foto na home e nas palestras | Usa o `photoUrl` do Sessionize (`assets/js/sessionize-photo.js` na home) | Na hora |
| Favicon e ícones do celular | `scripts/build_favicons.py` gera a partir da foto do Sessionize | A cada deploy |

A página separa os eventos assim:

- **Próximos e em andamento:** eventos cuja data de fim é hoje ou depois.
- **Palestras:** os resumos cadastrados no Sessionize.
- **Eventos em que palestrei:** os passados, agrupados por ano.

As datas e as cidades são traduzidas, por exemplo `19–24 out 2026 · Maringá, Brasil`. Eventos que duram o ano todo aparecem como "Ao longo de 2026".

A **bio** do topo não vem do Sessionize. Ela fica em `content/speakers/_index.md` (EN) e `_index.pt-br.md` (PT), porque o Sessionize só tem a bio em inglês.

### Se o Sessionize estiver fora

- **No navegador:** a página continua mostrando a última versão gerada no deploy, com um aviso e o link para o perfil do Sessionize.
- **Foto:** se a imagem do Sessionize não carregar, entra o backup `static/images/profile-fallback.jpg`, que é atualizado a cada deploy.
- **No deploy:** os scripts falham sem quebrar o build, e ficam valendo os arquivos já commitados (`data/sessionize.json`, favicons e foto de backup).

## Estrutura

```
content/            artigos, palestras, contato (EN + PT)
data/               sessionize.json (cópia dos dados do Sessionize)
layouts/            layouts próprios (home, posts, séries, palestras, contato, 404)
  _partials/        datas, eventos, favicons
assets/css/         custom.css (estilos do site)
assets/js/          talks.js, sessionize-photo.js
i18n/               textos em EN e PT
scripts/            sync_sessionize.py, build_favicons.py, sync_hashnode.py
static/             favicons, imagens, site.webmanifest
themes/hextra/      tema (submódulo git)
```

O menu de celular (hambúrguer) usa a barra lateral do Hextra. Por isso todo layout próprio inclui `{{ partial "sidebar.html" ... }}`, que fica escondida no desktop.

## Rodando localmente

```bash
git clone --recurse-submodules https://github.com/sschonss/meu-blog.git
cd meu-blog
python3 scripts/sync_sessionize.py           # opcional: dados atuais do Sessionize
hugo server                                  # http://localhost:1313
```

Para gerar os ícones a partir de uma imagem local, use `pip install pillow` e depois `python3 scripts/build_favicons.py --source foto.jpg`.

## Deploy e proteção da main

- Todo push na `main` publica o site. Também é possível rodar manualmente em **Actions → Deploy Hugo site to Pages → Run workflow**.
- A `main` é protegida por um ruleset: só o dono do repositório pode enviar commits, e não é permitido force push nem apagar o branch.
- O workflow não faz commits, só gera e publica o site.
