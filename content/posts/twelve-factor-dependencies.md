---
title: '12 factors: dependencies declared, nothing assumed'
date: 2026-11-23
description: 'Factor II of the Twelve factors in practice series: how to declare and isolate a PHP app''s dependencies with Composer, and how npm, pip and other package managers solve the same problem.'
translationKey: twelve-factor-dependencies
series: ['Twelve factors in practice']
series_weight: 2
tags: ['Architecture', 'PHP']
---

"It works on my machine." Almost always, that sentence hides a dependency nobody declared: a library installed by hand, a PHP extension that only exists on the laptop of whoever wrote the code, a package version different from the one on the server.

This is the second article in the **Twelve factors in practice** series. The [first one](/posts/twelve-factor-codebase/) covered factor I, codebase. Now it's factor II, **dependencies**, with examples in [Composer](https://getcomposer.org/), PHP's package manager, and a comparison with what other languages use.

## Before we start: three words

- **Dependency:** any code or tool your app needs to work that you didn't write. A library to generate UUIDs, an HTTP client, a PHP extension.
- **Package:** a dependency bundled so a tool can download and install it, with a name and a version.
- **Package manager:** the tool that reads the project's list of dependencies, works out which versions to use and downloads everything. In PHP it's Composer, in JavaScript it's [npm](https://www.npmjs.com/), in Python it's [pip](https://pip.pypa.io/).

## What factor II says

The original text fits in two rules:

1. **Declare everything.** The app lists, in a file inside its own repository, every dependency it needs, with versions. That file is called the **manifest**.
2. **Isolate everything.** The app doesn't use anything that "happens to be" installed on the machine. Dependencies live in a project folder, separate from other projects on the same server.

The practical consequence is the most important part: a new person on the team clones the repository, runs **one command** and has the app working. No list of steps in a forgotten document, no "oh, first you need to install this other thing".

An analogy helps. Think of a cake recipe. A bad recipe says "use flour". A good recipe says "500 g of all-purpose wheat flour". The manifest is the good recipe: it leaves nothing to the luck of whoever is cooking.

## The manifest in PHP: composer.json

In Composer, the manifest is `composer.json`. This article's lab uses a minimal app that generates a UUID with the [ramsey/uuid](https://uuid.ramsey.dev/) library:

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

Each line has a job:

- `"php": ">=8.2"`: the minimum version of PHP itself.
- `"ext-redis": "*"`: a PHP **extension**, a module written in C that must be installed on the server. It's a dependency too, and it needs to be declared too.
- `"ramsey/uuid": "^4.0"`: a library, accepting any 4.x version.
- `require-dev`: things only needed during development, like debugging and testing tools. They shouldn't go to production.

`^4.0` is a **version range**: "any 4.something, as long as it's at least 4.0". It's useful for getting fixes, but it creates a problem: two people installing on different days can get different versions.

## The lock: composer.lock

That's where `composer.lock` comes in. `composer.json` says what the app **accepts**. `composer.lock` says what was **chosen**, with the exact version of every package, including the dependencies of the dependencies.

![Diagram: composer.json, with the range ^4.0, becomes composer.lock through composer update, which stores the exact version 4.10.0. composer.lock becomes the vendor/ folder through composer install. composer.json and composer.lock go into Git; the vendor/ folder does not, it is rebuilt on every machine from the lock](/images/posts/twelve-factor-dependencies/flow-en.svg)

In the lab, the first `composer update` resolved the range and wrote the lock:

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

`composer.json` still says `^4.0`, but the lock now says `4.10.0`. Notice also that one package was requested and six came in: `ramsey/uuid` depends on `brick/math` and `ramsey/collection`, and the lock keeps all of them.

Then the test deleted the `vendor/` folder and ran `composer install`:

```text
$ rm -rf vendor && composer install
Installing dependencies from lock file (including require-dev)
Verifying lock file contents can be installed on current platform.
Package operations: 6 installs, 0 updates, 0 removals
  - Installing ramsey/collection (2.1.1): Extracting archive
  - Installing brick/math (1.0.0): Extracting archive
  - Installing ramsey/uuid (4.10.0): Extracting archive
```

The first line is the one that matters: **"from lock file"**. `install` doesn't choose versions, it reproduces what's in the lock. So the rule is simple:

- `composer update`: picks new versions and rewrites the lock. Run it when you **want** to update.
- `composer install`: installs exactly what's in the lock. Run it everywhere else: on a newcomer's machine, in CI and in the deploy.

Both files, `composer.json` and `composer.lock`, go into the repository. The `vendor/` folder goes into `.gitignore`.

### When the lock and the manifest disagree

The lab also tested the most common mistake: someone edits `composer.json` by hand, adding `"monolog/monolog": "^3.0"`, and forgets to update the lock. `composer install` warned and stopped:

```text
Warning: The lock file is not up to date with the latest changes in composer.json.
- Required package "monolog/monolog" is not present in the lock file.
This usually happens when composer files are incorrectly merged or the
composer.json file is manually edited.
```

The fix is to use `composer require monolog/monolog`, which updates both files together, instead of editing the JSON by hand.

## PHP extensions are dependencies too

This is the point PHP projects miss most often. An app that uses Redis through the `redis` extension works on the laptop that has the extension and breaks on the server that doesn't. If the extension isn't in `composer.json`, nobody finds out until the error shows up in production.

In the lab, `composer.json` declared `ext-redis`, which wasn't installed on the machine. `composer install` refused right away:

```text
Problem 1
  - Root composer.json requires PHP extension ext-redis * but it is missing
    from your system. Install or enable PHP's redis extension.
```

And the `composer check-platform-reqs` command shows the state of everything at once:

```text
$ composer check-platform-reqs
ext-iconv 8.4.27   success
ext-redis n/a      lab/twelve-factor-dependencies requires ext-redis (*)   missing
php       8.4.27   success
```

`ext-iconv` shows up without being requested because one of the locked packages needs it. This command is a good step for CI or for the start of a deploy: if something is missing, the process stops before the version goes live.

One caveat: Composer **checks** extensions, but doesn't **install** them. The image or the server does that. In [Docker](https://www.docker.com/), a tool that packages the app with everything it needs into an image, this is written in the `Dockerfile`:

```dockerfile
FROM php:8.4-cli

# the extension declared in composer.json, installed in the image
RUN apt-get update \
    && apt-get install -y --no-install-recommends $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get purge -y --auto-remove $PHPIZE_DEPS \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app

# manifest and lock first: install exactly what's in the lock
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY public ./public
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]
```

This way, the full list of what the app needs lives in the repository: the libraries in `composer.json`, the exact versions in `composer.lock`, and what goes on the system in the `Dockerfile`.

The same goes for tools the app calls from the outside, like `curl` or [ImageMagick](https://imagemagick.org/) to resize images. The original text mentions exactly this case: if the app depends on a system program, that program has to come along, declared.

## Production without the development tools

`require-dev` exists so development tools don't go to production. In the lab, with `symfony/var-dumper` installed, the test ran:

```text
$ composer install --no-dev --optimize-autoloader
Installing dependencies from lock file
Package operations: 0 installs, 0 updates, 3 removals
  - Removing symfony/var-dumper (v7.4.22)
  - Removing symfony/polyfill-mbstring (v1.43.3)
  - Removing symfony/deprecation-contracts (v3.8.1)
Generating optimized autoload files
```

`--no-dev` removed the development package and the dependencies only it used. `--optimize-autoloader` builds a map of the classes ahead of time, so PHP doesn't have to search file by file on every request.

## What about other languages?

The problem is the same in any language, and so is the solution: a manifest, a lock and an isolated folder. Only the names change.

| Language | Manager | Manifest | Lock | Install exactly what's locked |
| --- | --- | --- | --- | --- |
| PHP | [Composer](https://getcomposer.org/) | `composer.json` | `composer.lock` | `composer install` |
| JavaScript | [npm](https://www.npmjs.com/) | `package.json` | `package-lock.json` | `npm ci` |
| Python | [pip](https://pip.pypa.io/) | `requirements.txt` | the same file, with pinned versions (`==`) | `pip install -r requirements.txt` |
| Python | [uv](https://docs.astral.sh/uv/) | `pyproject.toml` | `uv.lock` | `uv sync --locked` |
| Ruby | [Bundler](https://bundler.io/) | `Gemfile` | `Gemfile.lock` | `bundle install` |
| Rust | [Cargo](https://doc.rust-lang.org/cargo/) | `Cargo.toml` | `Cargo.lock` | `cargo build --locked` |
| Go | [Go modules](https://go.dev/ref/mod) | `go.mod` | `go.sum` | `go mod download` |

A few differences worth knowing:

- **npm:** `npm install` can update `package-lock.json`. For CI and deploys, the right command is `npm ci`, which follows the lock strictly and fails if it doesn't match `package.json`. It's the direct equivalent of `composer install`.
- **pip:** pip doesn't have a separate lock. The classic approach is to pin versions in `requirements.txt` (`requests==2.32.3`) and isolate dependencies in a **virtual environment** (`python -m venv`), which plays the role of the `vendor/` folder. Newer tools like uv and [Poetry](https://python-poetry.org/) bring a real lock.
- **Go:** `go.sum` stores verification codes (*checksums*) for each version, to guarantee the downloaded code is the same as before.

If you already use one of these, Composer will feel familiar, and the other way around too.

## How to tell if your project follows factor II

A few quick questions:

- Is `composer.lock` in the repository?
- Does the deploy run `composer install`, not `composer update`?
- Are the PHP extensions the app uses in the `require` section of `composer.json`?
- Can a newcomer run the project with one command, without a separate step-by-step guide?
- Does production install with `--no-dev`?

If any answer is "no", start there. It's also a matter of ownership: when the dependency list is written down, anyone on the team can understand, install and update the app, and it stops depending on someone's memory.

## Next article

In the next article in the series, the topic is factor III, **config**: why passwords, addresses and keys stay out of the code, in environment variables, and how to read that config in PHP.

## Glossary

- **Manifest:** the file that lists the project's dependencies and the accepted versions, like `composer.json`.
- **Lock:** the file that stores the exact version chosen for each dependency, like `composer.lock`.
- **Version range:** a rule like `^4.0` that accepts several versions instead of just one.
- **PHP extension:** a module, usually written in C, that adds functions to PHP and must be installed on the server, like `redis` or `intl`.
- **Autoloader:** the code that loads each PHP class automatically when it's used, without a manual `require`.
- **Virtual environment:** in Python, an isolated folder with a project's dependencies, separate from the system's.

## Sources

- [The Twelve-Factor App: II. Dependencies](https://12factor.net/dependencies)
- [Composer: basic usage, composer.lock and install](https://getcomposer.org/doc/01-basic-usage.md)
- [Composer: platform packages (php and ext-*)](https://getcomposer.org/doc/01-basic-usage.md#platform-packages)
- [Composer: check-platform-reqs](https://getcomposer.org/doc/03-cli.md#check-platform-reqs)
- [Official PHP image on Docker Hub: installing extensions](https://hub.docker.com/_/php)
- [npm: npm ci](https://docs.npmjs.com/cli/commands/npm-ci)
- [pip: requirements file format](https://pip.pypa.io/en/stable/reference/requirements-file-format/)
- [uv: projects and lockfile](https://docs.astral.sh/uv/concepts/projects/sync/)
- [Bundler: Gemfile.lock](https://bundler.io/guides/rationale.html)
- [Cargo: Cargo.toml vs Cargo.lock](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html)
- [Go modules: go.sum](https://go.dev/ref/mod#go-sum-files)
