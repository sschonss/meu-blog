---
title: 'The 12 factors: a guide to apps that run anywhere'
date: 2026-11-23
description: 'The first part of Twelve factors in practice: what the Twelve-Factor methodology is, the 12 factors explained from scratch, and how each one shows up in a PHP project.'
translationKey: twelve-factor-app
series: ['Twelve factors in practice']
series_weight: 1
tags: ['Architecture', 'PHP']
draft: true
---

Almost every project hits this moment: it works on the machine of whoever wrote it, but breaks on the server. Sometimes it's a password that only exists in a forgotten file, sometimes it's a file saved to a folder that disappears on the next deploy, sometimes it's a PHP extension nobody remembered to install.

The [Twelve-Factor App](https://12factor.net/) is a list of 12 practices to avoid exactly these problems. It was written by engineers at [Heroku](https://www.heroku.com/), a platform that hosts applications in the cloud, based on what they saw across hundreds of thousands of apps running there. The text is short, more than ten years old, and still relevant, because it describes problems everyone still has.

This is the first article in the **Twelve factors in practice** series. Here I take a light tour of the 12 factors, one paragraph each, with PHP and Laravel examples. In the next articles, each factor (or pair of factors) gets its own post, with a lab that shows the factor being broken and then fixed.

## Before we start: three words

- **Deploy:** an installation of the app running somewhere. Production is a deploy, staging is another, your machine is another.
- **Environment:** the place where a deploy runs, with its own passwords, addresses and settings.
- **Backing service:** anything the app uses over the network, such as a database, a queue, a cache or an email service.

## The core idea

The 12 factors revolve around one split: **the code is the same everywhere, and whatever changes between environments lives outside it**. If the same code runs on your machine, in staging and in production, changing only the configuration, it becomes easy to start one more copy, move to another server or bring someone new into the project.

![Diagram: a single Git repository produces one build. The same build becomes three deploys (local, staging and production), each with its own configuration in environment variables and its own backing services, such as a database and a queue](/images/posts/twelve-factor-app/overview-en.svg)

## The 12 factors, one by one

### I. Codebase

**One codebase tracked in version control, many deploys.** An app is one repository (in Git, for example). Production and staging are deploys of that same repository, maybe at different versions. If two apps share code, that code becomes a library, not a pasted copy.

In PHP: one repository per app, and shared code becomes a [Composer](https://getcomposer.org/) package. Composer is PHP's dependency manager.

### II. Dependencies

**Explicitly declare and isolate dependencies.** The app never assumes something is "already installed" on the server. Everything it needs is declared in a file.

In PHP: `composer.json` declares the libraries and `composer.lock` pins the exact versions. Extensions go there too, like `"ext-pdo": "*"`, and Composer warns you if one is missing.

### III. Config

**Store config in the environment.** Config is anything that changes between deploys: the database password, an API key, the URL of another service. It lives in environment variables, not in the code. A simple test: if the repository went public right now, would any password leak?

In Laravel: `.env` is for development, and in production the values come from the server's environment variables. One detail that catches a lot of people: after `php artisan config:cache`, calling `env()` outside the `config/` files returns `null` ([documentation](https://laravel.com/docs/configuration#configuration-caching)).

### IV. Backing services

**Treat backing services as attached resources.** The app doesn't care whether the database runs on the same machine or in a managed service. Swapping one for the other should only take a config change, with no code changes.

In Laravel: `DB_HOST`, `REDIS_HOST` and `MAIL_MAILER` in the environment. Swapping a local MySQL for a cloud database means changing values, not rewriting classes.

### V. Build, release, run

**Strictly separate the build and run stages.** There are three stages:

1. **Build:** turns the code into a runnable package (installs dependencies, compiles assets).
2. **Release:** combines the build with one environment's config.
3. **Run:** runs the release.

Nothing is edited directly on the server. Changed something? New build, new release.

In PHP: `composer install --no-dev` and `npm run build` in the build, a Docker image as the result, and environment variables coming in only at release.

### VI. Processes

**Run the app as one or more stateless processes.** No important data stays in the process's memory or local disk between one request and the next. Anything that needs to last goes to a backing service.

In PHP: sessions and cache in Redis or the database, uploads in file storage like S3. This factor connects to an upcoming series here on the blog about how PHP runs: with PHP-FPM, state is thrown away after every request, but in runtimes with persistent workers, like [RoadRunner](https://roadrunner.dev/) and [Laravel Octane](https://laravel.com/docs/octane), a static variable can leak from one request into the next.

### VII. Port binding

**Export services via port binding.** The app presents itself by listening on a port (`8080`, for example), and doesn't depend on a web server injected from outside to exist.

In PHP: this is the factor the classic setup, Nginx plus PHP-FPM, follows least literally, because FPM speaks FastCGI, not HTTP. A Docker image that bundles both and exposes a port solves it in practice. Runtimes like [FrankenPHP](https://frankenphp.dev/) and RoadRunner already listen for HTTP directly.

### VIII. Concurrency

**Scale out with more processes.** To handle more load, you start more processes of the same type instead of building one giant process. And each kind of work has its own process type: one for the web, another for queues.

In Laravel: the web server handles requests and `php artisan queue:work` processes the queue. To keep up with more jobs, you start more queue workers without touching the web side.

### IX. Disposability

**Start fast and shut down gracefully.** A process can be stopped at any moment (during a deploy, when scaling). It should start in seconds and, when told to stop, finish what it's doing and exit without losing work.

In Laravel: `queue:work` finishes the current job before exiting when it receives `SIGTERM`, the "please shut down" signal the operating system sends. Jobs should also be safe to run again, in case a process dies halfway through.

### X. Dev/prod parity

**Keep development, staging and production as similar as possible.** If production uses PostgreSQL, running SQLite on your machine hides bugs that only show up there.

In PHP: [Docker Compose](https://docs.docker.com/compose/) or [Laravel Sail](https://laravel.com/docs/sail) start the same database, Redis and PHP versions locally as in production.

### XI. Logs

**Treat logs as event streams.** The app doesn't manage log files. It writes to standard output (`stdout`) and the environment decides where that goes: a terminal, a file, a log search tool.

In Laravel: `LOG_CHANNEL=stderr` sends logs to the process's error output, which Docker and cloud platforms already collect. A file in `storage/logs` inside a container disappears when the container is recreated.

### XII. Admin processes

**Run admin tasks as one-off processes.** Migrations, fix-up scripts and consoles run in the same environment, with the same code and config as the app, as a process that starts and ends.

In Laravel: `php artisan migrate --force` during the deploy, or `php artisan tinker` in a container from the same release. No loose script on the server with its own copy of the database password.

## Summary in one table

| Factor | In one sentence | PHP example |
| --- | --- | --- |
| I. Codebase | One repository, many deploys | Shared code becomes a Composer package |
| II. Dependencies | Everything declared, nothing assumed | `composer.json` and `composer.lock` |
| III. Config | What changes between environments lives in the environment | `.env` locally, environment variables in production |
| IV. Backing services | Database and queue are swappable addresses | `DB_HOST`, `REDIS_HOST` |
| V. Build, release, run | Three separate stages | Docker image plus variables at release |
| VI. Processes | No state kept in the process | Session in Redis, upload in S3 |
| VII. Port binding | The app listens on a port | FrankenPHP or a container with an exposed port |
| VIII. Concurrency | More load, more processes | More `queue:work` |
| IX. Disposability | Starts fast, stops gracefully | `SIGTERM` in the queue worker |
| X. Dev/prod parity | Local looks like production | Docker Compose or Sail |
| XI. Logs | Writes to output and doesn't manage files | `LOG_CHANNEL=stderr` |
| XII. Admin processes | One-off tasks in the same release | `php artisan migrate` |

## Does it still hold up?

The text predates Kubernetes, and some parts show their age. Factor VII, for example, matters less on platforms that hide the network, and many teams now use a secrets manager instead of plain environment variables. Even so, the core idea is still the basis of what containers and cloud platforms expect from an app: the same code everywhere, config outside it, and processes that can die without drama.

It's also a matter of ownership. Many of these factors look like "infra stuff", but whoever writes the code decides whether the password lives in the repository, whether uploads go to the local disk, or whether the worker knows how to stop gracefully. Following the 12 factors means the team owns how the app runs, not just how it's written.

## Next articles

In the next article, I'll cover factor III, config, with a Laravel lab that shows what happens when a secret ends up in the code and how `config:cache` changes the way `env()` behaves. After that come processes and disposability, which connect to the series on PHP runtimes, and logs as event streams.

## Glossary

- **Environment variable:** a named value (`DB_PASSWORD=...`) that the operating system hands to a process when it starts.
- **Container:** an isolated package with the app and everything it needs to run, like the ones created by [Docker](https://www.docker.com/).
- **Worker:** a process that keeps running to handle work, such as requests or queue jobs.
- **SIGTERM:** the signal the operating system sends to ask a process to shut down.
- **stdout and stderr:** a process's standard outputs, one for normal messages and one for errors.

## Sources

- [The Twelve-Factor App](https://12factor.net/) and [the Portuguese translation](https://12factor.net/pt_br/)
- [Laravel: configuration caching](https://laravel.com/docs/configuration#configuration-caching)
- [Laravel: running the queue worker](https://laravel.com/docs/queues#running-the-queue-worker)
- [Laravel: logging](https://laravel.com/docs/logging)
