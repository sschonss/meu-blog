---
title: '12 fatores: dependências declaradas, nada presumido'
date: 2026-11-23
description: 'Fator II da série Doze fatores na prática: como declarar e isolar as dependências de um app PHP com o Composer, e como npm, pip e outros gerenciadores resolvem o mesmo problema.'
translationKey: twelve-factor-dependencies
series: ['Doze fatores na prática']
series_weight: 2
tags: ['Arquitetura', 'PHP']
---

"Na minha máquina funciona." Quase sempre, essa frase esconde uma dependência que ninguém declarou: uma biblioteca instalada à mão, uma extensão do PHP que só existe no notebook de quem escreveu o código, uma versão de pacote diferente da que está no servidor.

Este é o segundo artigo da série **Doze fatores na prática**. No [primeiro](/pt-br/posts/twelve-factor-codebase/), o assunto foi o fator I, base de código. Agora é a vez do fator II, **dependências**, com exemplos no [Composer](https://getcomposer.org/), o gerenciador de pacotes do PHP, e uma comparação com o que outras linguagens usam.

## Antes de começar: três palavras

- **Dependência:** qualquer código ou ferramenta de que o seu app precisa para funcionar e que não foi você quem escreveu. Uma biblioteca para gerar UUIDs, um cliente HTTP, uma extensão do PHP.
- **Pacote:** uma dependência empacotada para ser baixada e instalada por uma ferramenta, com nome e versão.
- **Gerenciador de pacotes:** a ferramenta que lê a lista de dependências do projeto, descobre quais versões usar e baixa tudo. No PHP é o Composer, no JavaScript é o [npm](https://www.npmjs.com/), no Python é o [pip](https://pip.pypa.io/).

## O que o fator II diz

O texto original cabe em duas regras:

1. **Declarar tudo.** O app lista, num arquivo do próprio repositório, todas as dependências de que precisa, com as versões. Esse arquivo se chama **manifesto**.
2. **Isolar tudo.** O app não usa nada que "por acaso" já esteja instalado na máquina. As dependências ficam numa pasta do projeto, separadas das de outros projetos no mesmo servidor.

A consequência prática é a mais importante: uma pessoa nova no time clona o repositório, roda **um comando** e tem o app funcionando. Sem lista de passos num documento esquecido, sem "ah, antes você precisa instalar tal coisa".

Uma analogia ajuda. Pense numa receita de bolo. A receita ruim diz "use farinha". A receita boa diz "500 g de farinha de trigo tipo 1". O manifesto é a receita boa: não deixa nada para a sorte de quem está cozinhando.

## O manifesto no PHP: composer.json

No Composer, o manifesto é o `composer.json`. O lab deste artigo usa um app mínimo que gera um UUID com a biblioteca [ramsey/uuid](https://uuid.ramsey.dev/):

```json
{
    "name": "lab/twelve-factor-dependencies",
    "require": {
        "php": ">=8.2",
        "ext-redis": "*",
        "ramsey/uuid": "^4.0"
    },
    "require-dev": {
        "symfony/var-dumper": "^7.0"
    }
}
```

Cada linha tem um papel:

- `"php": ">=8.2"`: a versão mínima do próprio PHP.
- `"ext-redis": "*"`: uma **extensão** do PHP, um módulo escrito em C que precisa estar instalado no servidor. Ela também é uma dependência e também precisa ser declarada.
- `"ramsey/uuid": "^4.0"`: uma biblioteca, aceitando qualquer versão 4.x.
- `require-dev`: o que só serve durante o desenvolvimento, como ferramentas de depuração e testes. Em produção, isso não deve ir junto.

O `^4.0` é uma **faixa de versões**: "qualquer 4.alguma coisa, desde que seja no mínimo 4.0". É útil para receber correções, mas cria um problema: duas pessoas rodando a instalação em dias diferentes podem receber versões diferentes.

## A trava: composer.lock

É aí que entra o `composer.lock`. O `composer.json` diz o que o app **aceita**. O `composer.lock` diz o que foi **escolhido**, com a versão exata de cada pacote, inclusive das dependências das dependências.

![Diagrama: o composer.json, com a faixa ^4.0, vira composer.lock com o comando composer update, que guarda a versão exata 4.10.0. O composer.lock vira a pasta vendor/ com o comando composer install. O composer.json e o composer.lock vão para o Git; a pasta vendor/ não, ela é recriada em cada máquina a partir do lock](/images/posts/twelve-factor-dependencies/flow-pt.svg)

No lab, o primeiro `composer update` resolveu a faixa e gravou a trava:

```text
$ composer update
Updating dependencies
Lock file operations: 6 installs, 0 updates, 0 removals
  - Locking brick/math (1.0.0)
  - Locking ramsey/collection (2.1.1)
  - Locking ramsey/uuid (4.10.0)
  ...
Writing lock file
```

O `composer.json` continua dizendo `^4.0`, mas o lock agora diz `4.10.0`. Repare também que o pedido era um pacote e vieram seis: o `ramsey/uuid` depende do `brick/math` e do `ramsey/collection`, e o lock guarda todos.

Depois, o teste apagou a pasta `vendor/` e rodou `composer install`:

```text
$ rm -rf vendor && composer install
Installing dependencies from lock file (including require-dev)
Verifying lock file contents can be installed on current platform.
Package operations: 6 installs, 0 updates, 0 removals
  - Installing ramsey/collection (2.1.1): Extracting archive
  - Installing brick/math (1.0.0): Extracting archive
  - Installing ramsey/uuid (4.10.0): Extracting archive
```

A primeira linha é a que importa: **"from lock file"**. O `install` não escolhe versões, ele reproduz o que está no lock. Por isso a regra é simples:

- `composer update`: escolhe versões novas e reescreve o lock. Roda quando você **quer** atualizar.
- `composer install`: instala exatamente o que está no lock. Roda em todo o resto: na máquina de quem chegou agora, no CI e no deploy.

E os dois arquivos, `composer.json` e `composer.lock`, vão para o repositório. A pasta `vendor/` vai para o `.gitignore`.

### Quando o lock e o manifesto discordam

O lab também testou o erro mais comum: alguém edita o `composer.json` à mão, adicionando `"monolog/monolog": "^3.0"`, e esquece de atualizar o lock. O `composer install` avisou e parou:

```text
Warning: The lock file is not up to date with the latest changes in composer.json.
- Required package "monolog/monolog" is not present in the lock file.
This usually happens when composer files are incorrectly merged or the
composer.json file is manually edited.
```

A saída é usar `composer require monolog/monolog`, que atualiza os dois arquivos juntos, em vez de editar o JSON na mão.

## Extensões do PHP também são dependências

Esse é o ponto que mais escapa em projetos PHP. Um app que usa Redis pela extensão `redis` funciona no notebook de quem tem a extensão instalada e quebra no servidor que não tem. Se a extensão não está no `composer.json`, ninguém fica sabendo até o erro aparecer em produção.

No lab, o `composer.json` declarou `ext-redis`, que não estava instalada na máquina. O `composer install` recusou na hora:

```text
Problem 1
  - Root composer.json requires PHP extension ext-redis * but it is missing
    from your system. Install or enable PHP's redis extension.
```

E o comando `composer check-platform-reqs` mostra a situação de tudo de uma vez:

```text
$ composer check-platform-reqs
ext-iconv 8.4.27   success
ext-redis n/a      lab/twelve-factor-dependencies requires ext-redis (*)   missing
php       8.4.27   success
```

O `ext-iconv` aparece sem ter sido pedido porque um dos pacotes travados precisa dele. Esse comando é um bom passo para o CI ou para o início do deploy: se falta algo, o processo para antes de colocar a versão no ar.

Uma ressalva: o Composer **verifica** extensões, mas não **instala**. Quem instala é a imagem ou o servidor. No [Docker](https://www.docker.com/), uma ferramenta que empacota o app com tudo de que ele precisa numa imagem, isso fica escrito no `Dockerfile`:

```dockerfile
FROM php:8.4-cli

# a extensão declarada no composer.json, instalada na imagem
RUN apt-get update \
    && apt-get install -y --no-install-recommends $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get purge -y --auto-remove $PHPIZE_DEPS \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app

# só o manifesto e a trava primeiro: instala exatamente o que está no lock
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY public ./public
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]
```

Assim, a lista completa do que o app precisa está no repositório: as bibliotecas no `composer.json`, as versões exatas no `composer.lock` e o que vai no sistema no `Dockerfile`.

O mesmo vale para ferramentas que o app chama por fora, como o `curl` ou o [ImageMagick](https://imagemagick.org/) para redimensionar imagens. O texto original cita exatamente esse caso: se o app depende de um programa do sistema, esse programa precisa vir junto, declarado.

## Produção sem as ferramentas de desenvolvimento

O `require-dev` existe para que ferramentas de desenvolvimento não vão para produção. No lab, com o `symfony/var-dumper` instalado, o teste rodou:

```text
$ composer install --no-dev --optimize-autoloader
Installing dependencies from lock file
Package operations: 0 installs, 0 updates, 3 removals
  - Removing symfony/var-dumper (v7.4.22)
  - Removing symfony/polyfill-mbstring (v1.43.3)
  - Removing symfony/deprecation-contracts (v3.8.1)
Generating optimized autoload files
```

O `--no-dev` tirou o pacote de desenvolvimento e as dependências que só ele usava. O `--optimize-autoloader` gera um mapa das classes de antemão, para o PHP não precisar procurar arquivo por arquivo a cada requisição.

## E nas outras linguagens?

O problema é o mesmo em qualquer linguagem, e a solução também: um manifesto, uma trava e uma pasta isolada. Mudam só os nomes.

| Linguagem | Gerenciador | Manifesto | Trava | Instalar exatamente o que está travado |
| --- | --- | --- | --- | --- |
| PHP | [Composer](https://getcomposer.org/) | `composer.json` | `composer.lock` | `composer install` |
| JavaScript | [npm](https://www.npmjs.com/) | `package.json` | `package-lock.json` | `npm ci` |
| Python | [pip](https://pip.pypa.io/) | `requirements.txt` | o próprio arquivo, com versões fixas (`==`) | `pip install -r requirements.txt` |
| Python | [uv](https://docs.astral.sh/uv/) | `pyproject.toml` | `uv.lock` | `uv sync --locked` |
| Ruby | [Bundler](https://bundler.io/) | `Gemfile` | `Gemfile.lock` | `bundle install` |
| Rust | [Cargo](https://doc.rust-lang.org/cargo/) | `Cargo.toml` | `Cargo.lock` | `cargo build --locked` |
| Go | [Go modules](https://go.dev/ref/mod) | `go.mod` | `go.sum` | `go mod download` |

Algumas diferenças que valem saber:

- **npm:** o `npm install` pode atualizar o `package-lock.json`. Para CI e deploy, o comando certo é o `npm ci`, que segue o lock à risca e falha se ele não bate com o `package.json`. É o equivalente direto do `composer install`.
- **pip:** o pip não tem uma trava separada. O jeito clássico é fixar versões no `requirements.txt` (`requests==2.32.3`) e isolar as dependências num **ambiente virtual** (`python -m venv`), que cumpre o papel da pasta `vendor/`. Ferramentas mais novas, como o uv e o [Poetry](https://python-poetry.org/), trazem uma trava de verdade.
- **Go:** o `go.sum` guarda códigos de verificação (*checksums*) de cada versão, para garantir que o código baixado é o mesmo de antes.

Se você já usa uma dessas, o Composer vai parecer familiar, e o contrário também.

## Como saber se o seu projeto segue o fator II

Algumas perguntas rápidas:

- O `composer.lock` está no repositório?
- O deploy roda `composer install`, e não `composer update`?
- As extensões do PHP que o app usa estão no `require` do `composer.json`?
- Alguém novo consegue rodar o projeto com um comando, sem um passo a passo à parte?
- Produção instala com `--no-dev`?

Se alguma resposta for "não", vale começar por ela. É também uma questão de ownership: quando a lista de dependências está escrita, qualquer pessoa do time consegue entender, instalar e atualizar o app, e ele deixa de depender da memória de alguém.

## Próximo artigo

No próximo artigo da série, o assunto é o fator III, **configuração**: por que senhas, endereços e chaves ficam fora do código, em variáveis de ambiente, e como ler essas configurações em PHP.

## Glossário

- **Manifesto:** o arquivo que lista as dependências do projeto e as versões aceitas, como o `composer.json`.
- **Lock (trava):** o arquivo que guarda a versão exata escolhida para cada dependência, como o `composer.lock`.
- **Faixa de versões:** uma regra como `^4.0`, que aceita várias versões em vez de uma só.
- **Extensão do PHP:** um módulo, normalmente escrito em C, que adiciona funções ao PHP e precisa estar instalado no servidor, como `redis` ou `intl`.
- **Autoloader:** o código que carrega cada classe PHP automaticamente quando ela é usada, sem `require` manual.
- **Ambiente virtual:** no Python, uma pasta isolada com as dependências de um projeto, separada das do sistema.

## Fontes

- [The Twelve-Factor App: II. Dependências](https://12factor.net/pt_br/dependencies)
- [Composer: uso básico, composer.lock e install](https://getcomposer.org/doc/01-basic-usage.md)
- [Composer: pacotes de plataforma (php e ext-*)](https://getcomposer.org/doc/01-basic-usage.md#platform-packages)
- [Composer: check-platform-reqs](https://getcomposer.org/doc/03-cli.md#check-platform-reqs)
- [Imagem oficial do PHP no Docker Hub: instalando extensões](https://hub.docker.com/_/php)
- [npm: npm ci](https://docs.npmjs.com/cli/commands/npm-ci)
- [pip: arquivos de requisitos](https://pip.pypa.io/en/stable/reference/requirements-file-format/)
- [uv: projetos e lockfile](https://docs.astral.sh/uv/concepts/projects/sync/)
- [Bundler: Gemfile.lock](https://bundler.io/guides/rationale.html)
- [Cargo: Cargo.toml e Cargo.lock](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html)
- [Go modules: go.sum](https://go.dev/ref/mod#go-sum-files)
