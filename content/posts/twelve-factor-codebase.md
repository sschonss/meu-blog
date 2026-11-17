---
title: 'The 12 factors, part 1: one codebase, many deploys'
date: 2026-11-23
description: 'Opening the Twelve factors in practice series: what the Twelve-Factor methodology is, and factor I, codebase, explained from scratch with PHP examples.'
translationKey: twelve-factor-codebase
series: ['Twelve factors in practice']
series_weight: 1
tags: ['Architecture', 'PHP']
draft: true
---

Almost every project goes through this moment: it works on the machine of whoever wrote it, but breaks on the server. Sometimes it's a password that only exists in a forgotten file, sometimes it's a file saved in a folder that disappears on the next deploy, sometimes it's a fix someone made straight in production that nobody can find.

The [Twelve-Factor App](https://12factor.net/) is a list of 12 practices to avoid exactly these problems. It was written by engineers at [Heroku](https://www.heroku.com/), a platform that hosts applications in the cloud, based on what they saw across hundreds of thousands of apps running there. The text is short, more than ten years old, and still current, because it describes problems everyone still has.

This is the first article in the **Twelve factors in practice** series. The idea is simple: one article per factor, always with plain PHP examples and, when a framework helps, [Hyperf](https://hyperf.wiki/), a PHP framework that runs on [Swoole](https://wiki.swoole.com/en/), an extension that turns PHP into an always-on server. In this first one, I give a quick introduction to the methodology and then dive into factor I, **codebase**.

## Before we start: three words

- **Deploy:** an installation of the app running somewhere. Production is a deploy, staging is another, your machine is another.
- **Environment:** the place where a deploy runs, with its own passwords, addresses and settings.
- **Repository:** the place where the code and its whole history of changes are stored, like a project in [Git](https://git-scm.com/), the most widely used version control system today.

## The core idea of the 12 factors

The 12 factors revolve around one separation: **the code is the same everywhere, and what changes between environments lives outside it**. If the same code runs on your machine, in staging and in production, with only the configuration changing, it becomes easy to start one more copy, switch servers or bring someone new onto the project.

![Diagram: a single Git repository produces one build. The same build becomes three deploys (local, staging and production), each with its own config in environment variables and its own backing services, such as a database and a queue](/images/posts/twelve-factor-codebase/overview-en.svg)

## The series map

Each row below will become an article. For now, one sentence per factor is enough:

| Factor | In one sentence |
| --- | --- |
| I. Codebase | One repository per app, many deploys |
| II. Dependencies | Everything the app needs is declared, nothing is assumed |
| III. Config | What changes between environments lives in the environment, not in the code |
| IV. Backing services | Database, queue and cache are addresses you can swap |
| V. Build, release, run | Build, release and run are separate stages |
| VI. Processes | The app runs as processes that keep no state |
| VII. Port binding | The app exposes itself by listening on a port |
| VIII. Concurrency | More load is handled with more processes |
| IX. Disposability | Starts fast and shuts down without losing work |
| X. Dev/prod parity | Your machine looks like production |
| XI. Logs | The app writes events to its output and doesn't manage files |
| XII. Admin processes | One-off tasks run with the same code and config |

## Factor I: one codebase, many deploys

The original text sums up the factor as: **one codebase tracked in revision control, many deploys**. That's two rules in one sentence:

1. **Every app lives in a version control system**, such as Git. No code that only exists in a folder on the server or in a ZIP sent by email.
2. **There is a one-to-one relationship between app and codebase.** An app has one repository. A repository holds one app.

Then comes the part that sounds contradictory but isn't: one codebase, **many deploys**. Production, staging and every team member's machine are deploys of the same repository. They can be on different versions at the same time, and that's normal.

![Two-sided diagram. On the left, the right way: a repository with versions v1.3, v1.4, v1.5 and main on a single line, and each deploy runs one of them (production on v1.4, staging on v1.5, local on main with changes). On the right, the problem: one copy of the system per client (shop-client-a, shop-client-b, shop-client-c), each with its own history, and a fix made in one never reaches the others](/images/posts/twelve-factor-codebase/codebase-en.svg)

### Different versions are not different codebases

Picture an online shop built in PHP. Today:

- production runs the `v1.4` tag;
- staging runs `v1.5`, which the team is testing;
- your machine is on `main`, with a half-finished feature.

Those are three different versions, but they all sit on the same timeline of the same repository. Any of them can be reproduced from a commit. That's what makes the three environments "deploys of the same app".

A practical way to see this day to day is for each deploy to be able to say which version it's running. At build time, you can store the commit in an environment variable:

```bash
# at build time: find the current version of the repository
APP_VERSION=$(git describe --tags --always)
echo $APP_VERSION   # v1.4, or v1.4-3-g9f2c1ab if there are commits after the tag
```

In plain PHP, the app's entry point just needs to answer a simple URL (or show the version in the admin panel footer):

```php
// public/index.php
if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) === '/version') {
    echo getenv('APP_VERSION') ?: 'dev';
    exit;
}
```

In Hyperf, it's a route:

```php
// config/routes.php
use Hyperf\HttpServer\Router\Router;

Router::get('/version', fn () => getenv('APP_VERSION') ?: 'dev');
```

If someone asks "what's in production?", the answer is a commit, not "I think it's the latest version".

## Where factor I usually breaks

The two mistakes the original text points out show up a lot in PHP projects.

### 1. One app, many codebases: the copy per client

The classic scenario: the system is sold to several clients and, for each one, someone copies the folder (or forks the repository) and adjusts what's needed. At first it feels practical. A few months later:

- a security fix made in client A's copy never reaches client B;
- client C is stuck on an old version, because nobody dares to update it;
- nobody can say which copy is the "official" one.

That's exactly the right side of the diagram: several codebases for the same app. The way out is to go back to a single codebase and move the differences out of it:

- what changes from client to client (name, logo, URLs, API keys) becomes **configuration**, which is the subject of factor III;
- features that only some clients have become **feature flags**: switched on and off through configuration, with the same code for everyone.

To get started, you don't even need a library. An `if` reading an environment variable is already a flag:

```php
if (getenv('FEATURE_CASHBACK') === 'on') {
    $total = applyCashback($total);
}
```

Client A runs with `FEATURE_CASHBACK=on`, client B without it, and both run exactly the same code.

### 2. Many apps, one codebase: copied and pasted code

The opposite mistake: two different applications (the shop website and an internal admin panel, for example) need the same shipping calculation rule. Someone copies the class from one project to the other. Each copy evolves its own way, and one day the shipping cost on the website differs from the one in the panel.

The original text is direct here: shared code becomes a **library**, included through the dependency manager. In PHP, that's a package for [Composer](https://getcomposer.org/), PHP's dependency manager. The package can live in a private repository, without going to [Packagist](https://packagist.org/), the public package repository:

```json
{
    "repositories": [
        { "type": "vcs", "url": "git@github.com:my-company/shipping-calculator.git" }
    ],
    "require": {
        "my-company/shipping-calculator": "^2.1"
    }
}
```

Now the website and the panel use the same rule, each on a declared version. Fixing the shipping cost means releasing `2.1.1` of the package and updating both apps. How to declare and pin those versions is exactly factor II, dependencies.

### Bonus: the fix made straight on the server

This isn't one of the two cases in the text, but it breaks factor I just the same. Someone opens FTP, fixes a file in production and walks away. From then on, the code running in production doesn't exist in any commit. The next deploy wipes out the fix, and the bug comes back.

A quick test to find out if this happened: on servers where the deploy is a `git pull`, run `git status` in the app folder. Any modified file there is code that isn't in the codebase.

## What about monorepos?

A **monorepo** is a single repository that holds several apps, like an API and an admin panel side by side. It seems to contradict "one app, one repository", and the original text, which predates the popularity of this practice, doesn't mention it.

In practice, the spirit of the factor still holds: each app inside the monorepo has a clear folder, its own build, and deploys that come from a known commit. The problem the factor wants to avoid isn't having many files in a repository, it's not being able to say which code is running where.

## How to tell if your project follows factor I

A few quick questions:

- Does the code in production match a specific commit in the repository?
- Is there any copy of the system "just for one client"?
- Was any class copied from another project instead of coming from a package?
- Has anyone ever fixed something straight on the server?

If the answer to the first one is "I don't know", or any of the others is "yes", this is a good place to start. It's also a matter of ownership: when nobody can say which code is in production, nobody really owns it.

## Next article

The next article in the series covers factor II, **dependencies**: why the app should never assume something is "already installed" on the server, and how `composer.json`, `composer.lock` and PHP extensions fit into that story.

## Glossary

- **Version control:** a system that stores every change to the code, with who made it and when, and lets you go back to any point in the history.
- **Commit:** a recorded change in the repository, identified by a unique code (the *hash*).
- **Tag:** a fixed name given to a commit, usually a version, like `v1.4`.
- **Fork:** a copy of a repository that takes on a life of its own.
- **Feature flag:** a switch in the configuration that turns a feature on or off without changing the code.

## Sources

- [The Twelve-Factor App, in English](https://12factor.net/) and [in Portuguese](https://12factor.net/pt_br/)
- [I. Codebase](https://12factor.net/codebase)
- [Composer: VCS repositories](https://getcomposer.org/doc/05-repositories.md#vcs)
- [Hyperf: routing](https://hyperf.wiki/3.1/#/en/router)
- [Git: git describe](https://git-scm.com/docs/git-describe)
