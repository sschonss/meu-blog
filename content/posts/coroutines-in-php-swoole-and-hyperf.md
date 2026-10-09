---
title: 'Coroutines in PHP: Swoole and Hyperf in practice'
date: 2026-10-16
description: 'What changes when PHP stops being one process per request: the PHP-FPM model, Swoole, coroutines and Hyperf, with a demo that runs the same endpoint on all three.'
translationKey: corrotinas-no-php-swoole-e-hyperf
tags: ['PHP', 'Performance', 'Hyperf']
draft: true
---

Almost everyone who works with PHP learned the same model: a request comes in, a PHP-FPM process runs the script from start to finish, answers, and forgets everything. It is simple and it works very well. But it has a cost that almost nobody measures: the time the process spends **idle, waiting**.

In this article I show what changes when PHP runs as a real server, with **Swoole**, and how **coroutines** put that waiting time to use. At the end comes **Hyperf**, a framework built on top of it. This is the subject of my Hyperf talk, and I put together a repository with a demo you can run with a single `docker compose up`:

**[github.com/sschonss/hyperf-coroutines](https://github.com/sschonss/hyperf-coroutines)**

## The demo scenario

A `/report` endpoint builds a report by calling three services: users, orders and payments. Each one takes 200 ms to answer, like a database query or an HTTP call would. The code is ordinary PHP:

```php
function fetch_json(string $path): array
{
    $body = file_get_contents(upstream_url() . $path);

    return json_decode((string) $body, true, flags: JSON_THROW_ON_ERROR);
}

function build_report_sequential(): array
{
    return [
        'user' => fetch_json('/users/42'),
        'orders' => fetch_json('/orders?user=42'),
        'payments' => fetch_json('/payments?user=42'),
    ];
}
```

Three calls, one after the other: about 600 ms. This same file runs on PHP-FPM and on Swoole without changing a line.

## How PHP-FPM works

PHP-FPM keeps a group of processes (the *pool*). Each process handles **one request at a time**: it receives it, runs the script, answers, and only then takes the next one.

During the 600 ms of our report, the process spends almost all of its time waiting for the network. It is not computing anything, but it cannot serve anyone else either. With 4 processes in the pool the math is simple: at most 4 requests at the same time, and about 4 ÷ 0.6 s ≈ **6.7 requests per second**. The 5th request waits in line.

The classic fix is a bigger pool. It works, but every process costs memory, and the framework still boots from scratch on every request.

## What Swoole is

[Swoole](https://www.swoole.com/) is a PHP extension written in C that turns PHP into a long-running server, like Node.js or Go. Instead of Nginx handing each request to a fresh process, PHP itself opens the port and serves the requests:

```php
$server = new Swoole\Http\Server('0.0.0.0', 9501);
$server->set(['worker_num' => 1, 'hook_flags' => SWOOLE_HOOK_ALL]);

$server->on('request', function ($request, $response) {
    $response->end(json_encode(build_report_sequential()));
});

$server->start();
```

Two things change here:

1. **The process does not die.** The code is loaded once, when the worker starts, and stays in memory serving one request after another.
2. **Each request runs in a coroutine.** That is where the gain is.

## Coroutines, no mystery

A coroutine is a function that can **pause halfway** and resume later. When a coroutine is about to wait for something, like the network, a file or the database, it hands control back to Swoole's *scheduler*, which runs another coroutine in the meantime. All of this happens in a single process and a single thread.

The first example in the repository shows the difference with three 300 ms tasks:

```php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;

run(function () {
    foreach (['A', 'B', 'C'] as $task) {
        Coroutine::create(function () use ($task) {
            echo "{$task} starts\n";
            Coroutine::sleep(0.3); // pauses and lets another coroutine run
            echo "{$task} done\n";
        });
    }
});
```

```text
Plain PHP (one thing at a time)      Coroutines (the waits overlap)
     0 ms  A starts                       0 ms  A starts
   300 ms  A done                         0 ms  B starts
   300 ms  B starts                       0 ms  C starts
   600 ms  B done                       302 ms  A done
   600 ms  C starts                     302 ms  C done
   900 ms  C done                       302 ms  B done
  total: 901 ms                        total: 302 ms
```

The three waits happen at the same time. This is not CPU parallelism: it is using the time the process would otherwise spend idle.

### Runtime hooks: the same code, without blocking

"But my code uses `file_get_contents`, PDO and Guzzle, not `Coroutine::sleep`." That is what **runtime hooks** are for. With `SWOOLE_HOOK_ALL`, Swoole swaps PHP's blocking functions for versions that pause the coroutine instead of freezing the process:

```text
Hooks off: 3 x usleep(300ms) in coroutines took 900 ms
Hooks on:  3 x usleep(300ms) in coroutines took 302 ms
```

That is why the demo's `src/report.php` runs on Swoole unchanged: the `file_get_contents` is still there, but now, while it waits, the worker serves other requests.

### Making the three calls at once

Hooks solve the problem *between* requests: one worker serves many at the same time. But each request still takes 600 ms, because the three calls are still made one after the other. To run all three at once, inside the same request, we use a `WaitGroup`:

```php
$report = [];
$wg = new Swoole\Coroutine\WaitGroup();

foreach ($calls as $key => $path) {
    $wg->add();
    Swoole\Coroutine::create(function () use ($key, $path, &$report, $wg) {
        $report[$key] = fetch_json($path);
        $wg->done();
    });
}

$wg->wait(); // pauses only this request, not the worker
```

Now the request takes as long as the slowest call, about 200 ms, instead of the sum. Example 02 in the repository also shows `Channel`, which is how you limit how many tasks run at the same time.

## Hyperf

Writing everything directly on Swoole works, but you lose what a framework gives you: routing, dependency injection, middleware, validation, an ORM, queues. [Hyperf](https://hyperf.io) is a PHP framework built to run on Swoole, with all of that ready for coroutines.

The same report in Hyperf looks like this:

```php
use function Hyperf\Coroutine\parallel;

class ReportController
{
    private Client $http;

    public function __construct(ClientFactory $clients)
    {
        $this->http = $clients->create(['base_uri' => 'http://upstream:9502']);
    }

    public function parallel(): array
    {
        return parallel([
            'user' => fn () => $this->get('/users/42'),
            'orders' => fn () => $this->get('/orders?user=42'),
            'payments' => fn () => $this->get('/payments?user=42'),
        ]);
    }
}
```

`parallel()` does the job of the `WaitGroup`. `ClientFactory` returns a Guzzle client that, inside a coroutine, uses Swoole's HTTP client, so the call does not block the worker. And the controller gets its dependencies through the constructor, like in any modern framework.

## The numbers

The repository's CI runs the same load test on the three runtimes: 300 requests, 50 at a time, each one calling the three 200 ms services. PHP-FPM has 4 processes. Swoole and Hyperf have **a single** worker.

| Runtime | Requests/s | Mean latency | p95 |
| --- | ---: | ---: | ---: |
| PHP-FPM, 4 workers, sequential | 6.5 | 7,679 ms | 7,885 ms |
| Swoole, 1 worker, same sequential code | 70.2 | 712 ms | 627 ms |
| Swoole, 1 worker, parallel coroutines | **201.1** | **249 ms** | 257 ms |
| Hyperf, 1 worker, sequential | 70.1 | 713 ms | 625 ms |
| Hyperf, 1 worker, `parallel()` | **200.1** | **250 ms** | 232 ms |

A few things stand out:

- **PHP-FPM matched the math:** 6.5 requests per second, almost exactly the 6.7 we predicted. Mean latency went past 7 seconds because, with 50 requests arriving and only 4 free processes, almost all of that time is **queueing**: a request waits for a free process before its own 600 ms even start.
- **A single Swoole worker, running exactly the same code, served 11 times more.** Nothing in `src/report.php` changed. The difference is that while one request waits on the network, the others keep going.
- **With the calls in parallel, it was 30 times more**, and each request took as long as the slowest call.
- **Hyperf was practically the same as plain Swoole.** The framework adds no visible cost for routing, dependency injection and the rest, because everything is loaded once, when the worker starts.

The exact numbers change from machine to machine, but the proportions hold. The result of the latest run is always in [`results/benchmark.md`](https://github.com/sschonss/hyperf-coroutines/blob/main/results/benchmark.md).

## The differences that catch you off guard

Switching models is not only gains. A few things that simply do not exist in PHP-FPM start to matter.

**State survives between requests.** In PHP-FPM, every request starts from zero. In Swoole, static variables, singletons and globals live as long as the worker does, and every request shares them. The demo's `/counter` endpoint shows it: on PHP-FPM it always answers 1, on Swoole it keeps growing.

The most dangerous case is keeping "the current user" in a static property, a common PHP-FPM habit. With two requests at the same time, one overwrites the other while it waits for the database:

```text
Static property (FPM habit):
  request for Bruno -> wrote the order as Bruno
  request for Ana   -> wrote the order as Bruno   <-- wrong user!

Coroutine context:
  request for Bruno -> wrote the order as Bruno
  request for Ana   -> wrote the order as Ana
```

The fix is to keep request data in the coroutine context: `Coroutine::getContext()` in Swoole, or `Hyperf\Context\Context` in Hyperf. In Hyperf, also keep in mind that controllers are created only once, so a controller property is shared by every request.

**Coroutines do not speed up CPU work.** Coroutines take turns on a single thread. If the code is computing, not waiting, it never pauses, and every other request on that worker is stuck. Example 05 shows it: three heavy tasks take the same time with or without coroutines. For CPU-heavy work, use more workers, Swoole *task workers* or a queue.

**Memory leaks become a problem.** An array that grows on every request is thrown away at the end of it in PHP-FPM. In a worker that runs for days, it grows until it takes the process down. The `max_request` option restarts the worker from time to time, but the real fix is not to accumulate state.

**Not every library is ready.** Hooks cover the most common functions, like streams, sockets, PDO, sleep and cURL, but an extension that does its own I/O can still block the whole worker. Test before you rely on it.

**Deploys change.** Since the code stays loaded in memory, editing a file changes nothing until the server restarts.

## When it is worth it

Swoole and Hyperf shine when the application spends most of its time **waiting**: APIs that aggregate other services, gateways, websockets, queue consumers, anything with lots of network calls. In those cases, one worker does the job of dozens of PHP-FPM processes.

For a traditional application that queries the database and renders a page, PHP-FPM is still great and simpler to run. It is not a mandatory switch. It is one more tool, and now you know what it does under the hood.

The repository has everything for you to try on your machine, including the trap examples. If you run it and see something different, tell me in the comments.
