---
title: '12 factors: config outside the code'
date: 2026-11-30
description: 'Factor III of the Twelve factors in practice series: why passwords and addresses live in environment variables, and how to read, validate and pass that config in a PHP app.'
translationKey: twelve-factor-config
series: ['Twelve factors in practice']
series_weight: 3
tags: ['Architecture', 'PHP']
---

Every team has seen a commit with the message "remove password". The problem is that Git does not forget: the password is still in the history, within reach of anyone who clones the repository. And it almost always got there for the same reason: someone wrote the config straight into the code.

This is the third article in the **Twelve factors in practice** series. The [first one](/posts/twelve-factor-codebase/) covered factor I, codebase. The [second one](/posts/twelve-factor-dependencies/) covered factor II, dependencies. Now it is time for factor III, **config**: what it is, where it should live and how to read it in plain PHP, with no framework.

## Before we start: three words

- **Config:** everything that changes from one deploy to another. The database address, the database password, the key for a payment API, the log level.
- **Environment variable:** a name and value pair, like `DB_HOST=localhost`, that the operating system hands to each program when it starts. Every process has its own, and they do not live in any file of the project.
- **Secret:** a piece of config that must not leak, such as passwords, tokens and private keys.

## What factor III says

The original text is direct: the app keeps its config **separate from the code**, in **environment variables**.

The idea behind it is that the code is the same in every deploy. Production, staging and the developer's machine run the same code. What changes between them is only the config. If the config is inside the code, each deploy needs different code, and factor I stops holding.

An analogy helps. Think of the phone charger you take on a trip. The charger is the same in any country. What changes is the plug adapter. Nobody opens the charger to solder a new plug on every trip: they swap the adapter. The code is the charger, the config is the adapter.

## What is config, and what is not

Not everything in a file called `config` is config in the factor III sense. The question that tells them apart is: **does this change from one deploy to another?**

| Config (changes per deploy) | Not config (same in every deploy) |
| --- | --- |
| Database address and password | The app routes (`/login` calls `LoginController`) |
| Payment API key | Which class implements which interface |
| Mail server address | Validation rules for a form |
| Log level, cache time | Database table names |

The right side is **internal** app config. It can and should stay in the code, versioned in Git, because it is part of how the app works. If the routes changed between production and staging, you would be testing a different app from the one that goes live.

## The open source test

The original text suggests a simple test: **could the code be made open source right now, without leaking any credentials?**

If the answer is "no", some config is in the wrong place. The lab for this article has an example of the wrong way, a file with the password written in the code:

```php
<?php
// Wrong way: config written in the code.
$config = [
    'db_host'     => 'localhost',
    'db_password' => 'super-secret-123',
    'mail_from'   => 'noreply@example.com',
];
```

The lab also has a `.env` file with another password, only for local development (more on it later). The test searched for both passwords in everything Git tracks, with `git grep`:

```text
$ git grep -n -E 'super-secret-123|local-only-pass'
src/01-hardcoded.php:5:    'db_password' => 'super-secret-123',
```

The password written in the code showed up. The one in `.env` did not, because that file is in `.gitignore` and never enters the repository. The goal is for this search to find nothing at all. Tools like [gitleaks](https://github.com/gitleaks/gitleaks) run this search automatically, with patterns for well-known passwords and keys, and can run in CI on every commit.

## Reading environment variables in PHP

PHP offers three ways to read an environment variable: the `getenv()` function, the `$_ENV` array and the `$_SERVER` array. They look the same, but the lab showed they are not.

The test ran a script that reads `DB_HOST` in all three ways:

```text
$ DB_HOST=db.internal php src/02-getenv-vs-env.php
variables_order=GPCS
getenv(DB_HOST)='db.internal'
$_ENV[DB_HOST]=NULL
$_SERVER[DB_HOST]='db.internal'
```

`$_ENV` came back empty. The reason is a `php.ini` directive called `variables_order`, which says which arrays PHP fills in. The default in common installs, like the Debian one used in the lab, is `GPCS`, and the letter `E` (for *environment*) is not there. With the letter back, all three agree:

```text
$ DB_HOST=db.internal php -d variables_order=EGPCS src/02-getenv-vs-env.php
variables_order=EGPCS
getenv(DB_HOST)='db.internal'
$_ENV[DB_HOST]='db.internal'
$_SERVER[DB_HOST]='db.internal'
```

In practice: to read straight from the environment, `getenv()` is the most predictable path. Anyone using `$_ENV` needs to check the server's `variables_order`.

## One build, two environments

With reading sorted out, the lab built a `config.php` that takes everything from the environment, with defaults for what is optional:

```php
<?php
return [
    'db_host'     => env_required('DB_HOST'),
    'db_password' => env_required('DB_PASSWORD'),
    'log_level'   => env_optional('LOG_LEVEL', 'info'),
    'cache_ttl'   => (int) env_optional('CACHE_TTL', '60'),
];
```

The `env_required()` and `env_optional()` functions are small and appear in the next section. The same code ran twice, first with development values and then with production values:

```text
$ DB_HOST=localhost DB_PASSWORD=dev-pass LOG_LEVEL=debug php src/03-app.php
connecting to localhost
password length=8
log_level=debug cache_ttl=60

$ DB_HOST=db.prod.internal DB_PASSWORD=Pr0d-s3cret CACHE_TTL=3600 php src/03-app.php
connecting to db.prod.internal
password length=11
log_level=info cache_ttl=3600
```

No file was edited between the two runs. Only the environment changed, and with it the database, the log level and the cache time. Notice also that the app prints only the password **length**, never the password. Secret config does not show up in logs.

![Diagram: the same code, one build with no passwords, runs in two deploys. With the dev env, DB_HOST=localhost, it becomes the dev deploy, with a local database and debug log. With the prod env, DB_HOST=db.prod.internal, it becomes the production deploy, with the production database and info log. The code goes to Git; the values live in the environment of each deploy and never in the repository](/images/posts/twelve-factor-config/config-en.svg)

## Fail fast when something is missing

What if someone forgets to set the password in production? The worst outcome is the app starting, looking healthy and only breaking on the first request that needs the database, minutes or hours later.

That is why the lab's `config.php` separates what is required from what is optional:

```php
<?php
function env_required(string $name): string
{
    $value = getenv($name);
    if ($value === false || $value === '') {
        fwrite(STDERR, "Config error: required environment variable {$name} is not set\n");
        exit(1);
    }
    return $value;
}

function env_optional(string $name, string $default): string
{
    $value = getenv($name);
    return ($value === false || $value === '') ? $default : $value;
}
```

The test ran the app without the password and then with an empty password:

```text
$ DB_HOST=db.prod.internal php src/03-app.php
Config error: required environment variable DB_PASSWORD is not set
[exit 1]

$ DB_HOST=db.prod.internal DB_PASSWORD= php src/03-app.php
Config error: required environment variable DB_PASSWORD is not set
[exit 1]
```

In both cases the app stopped right away, with a message that says exactly what is missing, and with exit code 1. That code matters: it is what tells the deploy, the CI or the orchestrator that something went wrong, so the new version does not go live. This behavior has a name: **fail fast**.

## The .env file, only for your machine

Setting five or ten variables by hand every time you open a terminal gets old. For local development, the common answer is a `.env` file at the project root, read by a library. In PHP, the most used one is [phpdotenv](https://github.com/vlucas/phpdotenv), installed with Composer:

```bash
composer require vlucas/phpdotenv
```

The lab used it like this:

```php
<?php
require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();
$dotenv->required(['DB_HOST', 'DB_PASSWORD'])->notEmpty();

echo 'DB_HOST=' . $_SERVER['DB_HOST'] . "\n";
```

Three details in this code:

- `createImmutable`: `.env` **does not overwrite** a variable that already exists in the environment. The real variable always wins.
- `safeLoad`: if `.env` does not exist, it moves on without an error. In production, it should not exist.
- `required(...)->notEmpty()`: the same fail fast from the previous section, now done by the library.

The test showed all three behaviors:

```text
$ php src/04-dotenv.php
DB_HOST=127.0.0.1

$ DB_HOST=db.from.real.env php src/04-dotenv.php
DB_HOST=db.from.real.env

$ php src/04-dotenv.php        # no .env and no variables
PHP Fatal error:  Uncaught Dotenv\Exception\ValidationException: One or more
environment variables failed assertions: DB_HOST is missing, DB_PASSWORD is missing.
```

First, the value came from `.env`. Then the real variable beat the file. Finally, with neither, the validation stopped the app.

A trap showed up along the way. The first version of the script read `$_ENV['DB_HOST']`, and when the variable came from the real environment, this was the result:

```text
$ DB_HOST=db.from.real.env php src/04a-dotenv-env-trap.php
PHP Warning:  Undefined array key "DB_HOST" in .../src/04a-dotenv-env-trap.php on line 9
DB_HOST=
```

It is `variables_order` again: PHP did not put the real variable in `$_ENV`, and immutable mode stopped the library from putting it there. Reading from `$_SERVER`, as in the final version, fixed it.

### What goes to Git and what does not

`.env` holds real values, so it **never** goes to the repository. A `.env.example` goes instead, with the variable names and sample values, and no secrets:

```bash
# .env.example: copy to .env for local development. Never commit .env.
DB_HOST=127.0.0.1
DB_PASSWORD=
LOG_LEVEL=debug
```

And `.gitignore` takes care of the rest:

```text
/vendor/
.env
```

In the lab, Git confirmed it:

```text
$ git check-ignore -v .env
.gitignore:2:.env	.env

$ git ls-files | grep -E '^\.env'
.env.example
```

`.env.example` is also documentation: whoever joins the project sees, in one place, every setting the app needs. Frameworks like [Hyperf](https://hyperf.wiki/3.1/#/en/config) ship with this setup ready, with a `.env` read at startup and an `env()` function to use in config files.

## Per environment or per variable?

A common way to organize config is one file per environment:

```php
<?php
// config/production.php
return [
    'db_host'   => 'db.prod.internal',
    'log_level' => 'info',
    'cache_ttl' => 3600,
];
```

Plus a `config/staging.php`, and a `config/development.php`. The app picks the file through a single variable, like `APP_ENV=production`.

The original text advises against this setup, for two reasons:

1. **It does not scale.** Each new environment, like a staging deploy for one specific client, becomes another file. Over time, nobody knows which differences between them are on purpose.
2. **It pulls secrets into the code.** The production file is the natural place for someone to put the production password, and then it goes to Git.

The factor III way is **granular** variables: one variable per thing (`DB_HOST`, `LOG_LEVEL`, `CACHE_TTL`), independent from each other. Each deploy sets its own, with no environment name tying them together. This example is only illustrative and was not run in the lab.

## The PHP-FPM trap

So far, everything ran from the command line. On the web, PHP usually runs through [PHP-FPM](https://www.php.net/manual/en/install.fpm.php), a manager that keeps PHP processes ready to handle the requests coming from the web server. And PHP-FPM has a setting that catches many people off guard: `clear_env`.

With `clear_env = yes`, the default, PHP-FPM **wipes the environment variables** before handing the request to PHP. Your app reads `getenv('DB_HOST')` and gets `false`, even with the variable set on the server.

The lab tested it with a real php-fpm 8.4: it started PHP-FPM with `APP_SECRET` and `DB_HOST` set and made a request to a page that only prints both. With the default config:

```text
getenv(APP_SECRET)=false
getenv(DB_HOST)=false
```

There are two ways out. The first is to turn the wipe off in the pool file (on Debian, `/etc/php/8.4/fpm/pool.d/www.conf`):

```ini
clear_env = no
```

The second, more controlled, is to keep the wipe and pass only the variables the app needs, one by one:

```ini
env[APP_SECRET] = $APP_SECRET
env[DB_HOST] = $DB_HOST
```

In both cases, the same request started seeing the values:

```text
getenv(APP_SECRET)='from-shell'
getenv(DB_HOST)='db.prod.internal'
```

The second option is usually the better one: the app gets only what it needs, not every variable on the server. One detail: the test used a minimal pool started by hand, and the requests went straight over the FastCGI protocol with `cgi-fcgi`, with no web server in front.

## And in production, where do the values come from?

Outside your machine, the platform where the app runs sets the variables:

- In [Docker](https://docs.docker.com/reference/cli/docker/container/run/#env), with `-e DB_HOST=...` or `--env-file` when starting the container.
- In [Kubernetes](https://kubernetes.io/docs/concepts/configuration/secret/), with `Secret` and `ConfigMap` objects, which become environment variables inside the container.
- On platforms like Heroku, in a dashboard or from the command line, deploy by deploy.

Docker was not available on the lab machine, so none of these examples ran here. The idea is the same in all of them: there is one image or one codebase, and the values come in from outside at run time.

One last caution: an environment variable is not a vault. A forgotten `phpinfo()` call on a public page shows all of them. Secrets do not appear in logs, error pages or `phpinfo()`.

## How to tell if your project follows factor III

A few quick questions:

- Could the code be made open source today, without leaking any password?
- Is `.env` in `.gitignore`, and is there a `.env.example` in the repository?
- Does the same build run in every environment, with only different variables?
- Does the app stop at startup, with a clear message, when a required variable is missing?
- Is the config made of granular variables, not files per environment?
- If the app runs on PHP-FPM, do the variables reach PHP (`clear_env` or `env[...]`)?

If any answer is "no", that is a good place to start. And there is an ownership angle here too. When config is explicit, with a `.env.example` that lists everything and an app that complains about what is missing, anyone on the team can bring up a new environment, rotate a leaked password or understand why production behaves differently. Config stops being a secret held by whoever did the first deploy and becomes the team's responsibility.

## Next article

The next article in the series covers factor IV, **backing services**: why the database, the queue and the cache should be treated as attachable resources, swapped by changing only the config.

## Glossary

- **Config:** everything that changes from one deploy to another, like addresses, passwords and keys.
- **Internal config:** what is the same in every deploy, like routes and app rules. It stays in the code.
- **Environment variable:** a name and value pair that the operating system hands to each process.
- **Secret:** config that must not leak, like a password, token or private key.
- **Fail fast:** stopping right at startup, with a clear message, instead of breaking later.
- **`.env`:** a file with variables for local development. It never goes to Git.
- **PHP-FPM pool:** a group of PHP processes with the same config, defined in files like `www.conf`.
- **Exit code:** the number a program returns when it ends. Zero means success; anything else, an error.

## Sources

- [The Twelve-Factor App: III. Config](https://12factor.net/config)
- [PHP: getenv](https://www.php.net/manual/en/function.getenv.php)
- [PHP: the variables_order directive](https://www.php.net/manual/en/ini.core.php#ini.variables-order)
- [PHP: $_ENV](https://www.php.net/manual/en/reserved.variables.environment.php)
- [PHP: PHP-FPM configuration (clear_env and env)](https://www.php.net/manual/en/install.fpm.configuration.php)
- [phpdotenv on GitHub](https://github.com/vlucas/phpdotenv)
- [Hyperf: config and the .env file](https://hyperf.wiki/3.1/#/en/config)
- [Docker: environment variables in docker run](https://docs.docker.com/reference/cli/docker/container/run/#env)
- [Kubernetes: Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [gitleaks on GitHub](https://github.com/gitleaks/gitleaks)
