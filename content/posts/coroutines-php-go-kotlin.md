---
title: 'Coroutines in PHP, Go and Kotlin: one problem, three answers'
date: 2026-10-23
description: 'WaitGroups, channels, schedulers and the cost of each coroutine: the same four scenarios written in PHP with Swoole, in Go and in Kotlin, and what changes underneath.'
translationKey: corrotinas-php-go-kotlin
series: ['Concurrency in PHP']
tags: ['PHP', 'Go', 'Kotlin']
draft: true
---

In the [previous article](/posts/coroutines-in-php-swoole-and-hyperf/) I showed how Swoole and Hyperf use coroutines so a single PHP process can serve hundreds of requests while they wait on the network. Anyone who has written Go probably had a *déjà vu* reading that code: `Coroutine::create`, `WaitGroup`, `Channel`. That is no accident. Swoole brought to PHP almost exactly Go's model.

In this article I take a step back and explain the ideas behind it, comparing three languages that handle coroutines in different ways: **PHP with Swoole**, **Go** and **Kotlin**. I wrote the same four scenarios in all three, and the results for each are in the same repository as the previous article:

**[github.com/sschonss/hyperf-coroutines/tree/main/languages](https://github.com/sschonss/hyperf-coroutines/tree/main/languages)**

## Concurrency is not parallelism

Before the code, the distinction that matters most here:

- **Concurrency** is dealing with many things at once: starting the second task while the first one is waiting.
- **Parallelism** is **running** many things at once, on several CPU cores.

A waiter serving several tables is concurrency: they take an order, bring it to the kitchen and, while the dish is being cooked, serve another table. Two waiters is parallelism. Coroutines are, first of all, a **concurrency** tool. Whether and how they also become parallelism is exactly where the three languages part ways.

## Who decides what runs: the scheduler

A coroutine needs someone to decide when it pauses and which one runs next. That someone is the *scheduler*, and each language has its own:

- **Swoole:** one scheduler per process, running on a single thread. A coroutine only yields when it is about to wait for something (network, disk, `sleep`) or when it calls something that explicitly pauses. It is a **cooperative** model by default: if a coroutine keeps computing, nothing else runs in that process. (Swoole has a preemptive scheduling option, `enable_preemptive_scheduler`, but it is still a single thread.)
- **Go:** the Go *runtime* spreads thousands of goroutines over a few OS threads, by default one per core (`GOMAXPROCS`). Since Go 1.14 it can also interrupt a goroutine that has been computing for too long. So goroutines run **in parallel**, and the scheduler is **preemptive**.
- **Kotlin:** coroutines run on a *dispatcher*, and you pick which one. `runBlocking` uses a single thread, similar to Swoole. `Dispatchers.Default` is a thread pool with one thread per core, similar to Go. `Dispatchers.IO` is a bigger pool, for blocking code.

Keep this in mind, because it explains almost every difference in the numbers below.

## Scenario 1: waiting for several things at once

Three tasks that wait 300 ms each. In PHP with Swoole and in Go, the code is almost a line-by-line translation:

```php
// PHP + Swoole
$wg = new WaitGroup();
foreach ([1, 2, 3] as $task) {
    $wg->add();
    Coroutine::create(function () use ($wg) {
        Coroutine::sleep(0.3);
        $wg->done();
    });
}
$wg->wait();
```

```go
// Go
var wg sync.WaitGroup
for task := 0; task < 3; task++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        time.Sleep(300 * time.Millisecond)
    }()
}
wg.Wait()
```

Kotlin does not need a `WaitGroup`:

```kotlin
// Kotlin
coroutineScope {
    repeat(3) { launch { delay(300) } }
}
```

`coroutineScope` only returns when every coroutine started inside it is done. This is called **structured concurrency**: coroutines have a "parent", and the parent waits for its children. If one of them fails, the others are cancelled. In Swoole and Go, forgetting a `done()` or leaving a goroutine running forever is a common mistake. In Kotlin, it is much harder to make.

In all three languages the result is the same: about **300 ms**, not 900.

## Scenario 2: a worker pool over a channel

Ten tasks of 100 ms, but never more than three running at the same time. Three coroutines read from a *channel*, which works as a queue between them:

```php
// PHP + Swoole
$jobs = new Channel(10);
for ($worker = 0; $worker < 3; $worker++) {
    Coroutine::create(function () use ($jobs) {
        while (($job = $jobs->pop()) !== false) {
            Coroutine::sleep(0.1);
        }
    });
}
```

```go
// Go
jobs := make(chan int, 10)
for worker := 0; worker < 3; worker++ {
    go func() {
        for range jobs {
            time.Sleep(100 * time.Millisecond)
        }
    }()
}
```

```kotlin
// Kotlin
val jobs = Channel<Int>(10)
repeat(3) {
    launch { for (job in jobs) delay(100) }
}
```

It is the same idea in all three: producers `push`/`<-`/`send`, consumers `pop`/`range`/`for`, and closing the channel tells the consumers there is nothing left. Ten tasks in rounds of three take four rounds, about **400 ms** in every language.

This pattern shows up all the time: limiting how many calls an external API gets at once, processing a queue with a fixed number of consumers, building a pipeline in stages.

## Scenario 3: 100,000 coroutines

This is where the differences start. We create 100,000 coroutines, each waiting 1 second, and measure how much memory each one costs:

| | Total time | Memory per coroutine |
| --- | ---: | ---: |
| PHP + Swoole | 2,065 ms | ~9.1 KB |
| Go | 1,114 ms | ~2.7 KB |
| Kotlin | 1,780 ms | **~0.2 KB** |

All three handle 100,000 without breaking a sweat, something unthinkable with threads or processes. But the cost of each one is very different, and the reason is how each language stores the "where was I" of a paused coroutine:

- **Go and Swoole use stackful coroutines.** Each coroutine has its own execution stack, like a miniature thread. In Go it starts at 2 KB and grows when needed. In Swoole, each coroutine has its own PHP virtual machine stack, which is what the measurement shows, plus a C stack reserved by the extension.
- **Kotlin uses stackless coroutines.** The compiler turns each `suspend` function into a small state machine, and a paused coroutine is just an object holding the variables it will need when it resumes. That is why it fits in about 200 bytes.

## Scenario 4: CPU-heavy work

Four tasks that only compute (a million MD5 hashes each), first one after the other and then in coroutines, on a machine with 2 cores. Each measurement runs 5 times and the median counts, and the computation was written to allocate no memory, so the Go and JVM garbage collectors do not skew the comparison:

| | One at a time | In coroutines | Speedup |
| --- | ---: | ---: | ---: |
| PHP + Swoole | 601 ms | 591 ms | **1.0x** |
| Go | 551 ms | 369 ms | **1.5x** |
| Kotlin (`Dispatchers.Default`) | 545 ms | 369 ms | **1.5x** |

This is where what we saw about schedulers shows up:

- **In Swoole, nothing changes.** The coroutines of a process take turns on a single thread, and computation has no waiting to make use of. To use several cores in PHP, the answer is still more processes: more server workers or *task workers*.
- **In Go, goroutines spread across cores on their own**, without changing a line.
- **In Kotlin, you have to ask for it:** the same code inside `runBlocking` would run on a single thread, like Swoole. With `Dispatchers.Default`, it used both cores.

The ideal with 2 cores would be 2x. GitHub Actions machines usually provide 2 virtual cores that are really two threads of the same physical core, so the gain lands around 1.5x. On a machine with 2 real cores, the same Go program reached 2.0x.

Do not compare the rows with each other: each language computes MD5 its own way, and PHP's MD5 is written in C. What matters is the last column, how much each one gains by running in parallel.

## The difference the numbers do not show: function "colors"

There is one difference that changes everyday work a lot and that no benchmark shows.

In Kotlin, a function that can pause must be marked with `suspend`, and it can only be called from another `suspend` function or from a coroutine. JavaScript is the same with `async` and `await`. This splits code into two "kinds" of function, and changing a function's kind forces you to change every function that calls it. This is often called **colored functions**.

Go and Swoole do not have that. In Go, any function can block and the runtime takes care of the rest. In Swoole, runtime hooks do the same for functions that already exist: a `file_get_contents`, a PDO query or a Guzzle call start pausing the coroutine without any marking. That is why, in the previous article, the same file ran on PHP-FPM and on Swoole without changing a line.

Both approaches have an upside and a downside:

- **Colored (Kotlin, JavaScript):** you **see** in the code where it can pause, and the compiler helps you. In exchange, old code has to be adapted.
- **Colorless (Go, Swoole):** old code works as it is. In exchange, any call can pause without warning, and that is exactly what lets the "current user" kept in a static property be swapped for someone else, as in the trap example from the previous article.

## The three side by side

| | PHP + Swoole | Go | Kotlin |
| --- | --- | --- | --- |
| Start one | `Coroutine::create(fn)` | `go fn()` | `launch { }` |
| Wait for several | `WaitGroup` | `sync.WaitGroup` | `coroutineScope` (structured) |
| Communicate | `Channel` | `chan` | `Channel` |
| Kind of coroutine | Stackful (~9 KB) | Stackful (~2.7 KB) | Stackless (~0.2 KB) |
| Scheduler | Cooperative, 1 thread per process | Preemptive, many threads | Depends on the dispatcher |
| Several cores | Only with more processes | Automatic | With `Dispatchers.Default` |
| Mark functions that pause | No (runtime hooks) | No | Yes (`suspend`) |

## What to take from this

For those coming from PHP, the good news is that Swoole's model is not an isolated invention: it is Go's, with `WaitGroup` and `Channel` working the same way. Learning one helps you understand the other. Hyperf, in turn, hides most of this behind things like `parallel()`.

PHP's main limitation here is CPU: one process uses one core, and to use more you need more processes. For what PHP does most on the web, which is waiting on databases, caches and other APIs, that is rarely the bottleneck. And, as the previous article showed, waiting is exactly where coroutines make a difference.

The code for the four scenarios in the three languages is in the [repository](https://github.com/sschonss/hyperf-coroutines/tree/main/languages), and the output of the latest run is in [`results/languages.md`](https://github.com/sschonss/hyperf-coroutines/blob/main/results/languages.md). If you use another language with coroutines, like Rust, Python or C#, tell me in the comments how it compares.
