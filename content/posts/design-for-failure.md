---
title: 'Design for Failure: wait, my system fails?'
date: 2026-10-15
description: 'Retry with backoff and jitter, fallback, circuit breaker and saga: the patterns that keep a distributed system standing when part of it goes down, with PHP code and the trade-offs of each one.'
translationKey: design-for-failure
tags: ['Architecture', 'Microservices', 'PHP']
---

Every system fails. The question is not *whether* a service will go down, it is *what happens to everything else* when it does. That is the subject of my talk **Design for Failure**, which I gave at SoftWeek and PHPeste in 2025, and this article is its written version, with a bit more room for the details that do not fit in 40 minutes on stage.

The idea of the talk is simple: **give names to the patterns we already use**, sometimes without knowing it. Retry, fallback, circuit breaker and saga are not recent inventions, and understanding where each one comes from helps you know when to use it, and above all when not to.

A warning before we start: all the code here is for teaching. It exists to show the idea, not to go straight to production. For that there are well-tested libraries, which I mention along the way.

## From one server to many points of failure

Every online store starts the same way: one server, one application and one database. While the server runs at 20% of its capacity, all is well. Then the store grows, usage goes to 80%, and it is time to scale. There are two ways to do it:

- **Vertical:** you upgrade the hardware you already have. More CPU, more memory, a bigger server. It is simple, but it has a ceiling and gets expensive fast.
- **Horizontal:** you add more machines. More servers, containers, a Kubernetes cluster orchestrating it all. There is no clear ceiling, but now the system is **distributed**.

And it is in a distributed system that you start to notice how many points of failure there are. A call between two services can take too long, the other side may be down, a lock may be holding a resource. Every arrow on an architecture diagram is a network call, and every network call can fail.

For the rest of the article, we will use a store split into services. A purchase goes through the e-commerce service, which talks to stock, shipping and payment. If everyone answers, the customer gets a `200 OK`. But what if the shipping service is down?

![Diagram of an online store: the customer calls the e-commerce service, which calls the stock, shipping and payment services; the shipping service is down](/images/posts/design-for-failure/architecture-en.svg)

## Retry: trying again, the right way

The most natural answer is to try again. Many network failures are **temporary**: a lost packet, a timeout at a busy moment, a container restarting. A second attempt, a moment later, often works.

This idea dates back to the 70s and 80s, when the first shared networks had to deal with collisions: Ethernet, for example, picks a random time to wait before transmitting again, from a range that doubles with each collision. That is where the two ingredients of a good retry come from:

- **Exponential backoff:** the wait grows with each attempt (1 s, 2 s, 4 s, 8 s...). That way you do not keep hammering a service that is already struggling.
- **Jitter:** a bit of randomness in that wait (for example, 4 s ± 20%). It looks like a detail, but it is what keeps every client from retrying at the same instant.

In PHP, with Guzzle, it looks like this:

```php
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\ServerException;

public function callShipping(array $data): array
{
    $maxAttempts = 3;

    for ($attempt = 1; ; $attempt++) {
        try {
            $response = $this->httpClient->post('http://shipping/api/quote', [
                'json' => $data,
                'timeout' => 2,
            ]);

            return json_decode((string) $response->getBody(), true);
        } catch (ConnectException | ServerException $e) {
            if ($attempt === $maxAttempts) {
                throw $e;
            }

            $backoffMs = 1000 * 2 ** ($attempt - 1); // 1 s, 2 s, 4 s...
            $jitter = random_int(-20, 20) / 100;     // ±20%
            usleep((int) ($backoffMs * (1 + $jitter) * 1000));
        }
    }
}
```

Notice what is **not** retried. The `catch` only takes connection failures and 5xx errors, the cases where trying again may work. A 4xx, like a 400 or a 422, means the request itself is wrong, and sending the same request three times only produces three errors.

Three precautions that apply to any retry:

- **Only repeat what is idempotent.** Retrying a shipping quote is safe. Retrying a charge without an idempotency key can charge the customer twice, because the first attempt may have worked and only its response got lost.
- **Count the total time.** With a 2 s timeout and waits of 1 s and 2 s, the worst case is 9 seconds. Someone is waiting on the other end.
- **On PHP-FPM, waiting costs a process.** That `usleep` holds a worker doing nothing. On Swoole and Hyperf, the same call only pauses the coroutine, and the process keeps serving other requests.

### Thundering herd: when retrying makes it worse

Now picture a thousand clients calling the same service the moment it goes down. They all fail together, they all wait 1 second, and they all retry **together**. The service, which was trying to recover, gets a thousand requests at the same instant and falls over again. This has a name: the **thundering herd**.

Jitter is exactly what breaks that synchrony. I simulated the thousand clients with and without it:

![Two charts of requests over time. Without jitter, the retries from a thousand clients arrive in three spikes of a thousand requests, at 1, 3 and 7 seconds. With 20% jitter, the same retries spread out and the peak drops to 271 requests in 100 ms](/images/posts/design-for-failure/retries-en.svg)

Without jitter, the service gets 1,000 requests within 100 ms, three times in a row. With ±20%, the peak drops to 271. It is the same number of attempts, just spread out. And the more randomness, the more they spread: drawing the whole wait between zero and the backoff, known as *full jitter*, lowers the peak even further.

## Fallback: an alternative answer

Retry handles short failures. But what if shipping stays down for ten minutes? Trying three times and returning an error to the customer means **no** purchase goes through during that time, because of a single service.

This is where **fallback** comes in, an idea that gained ground in the 90s and 2000s together with high availability and *graceful degradation*: when a critical service fails, the system does not stop entirely, it returns an alternative answer. It can be a default value, a cached response or a value computed beforehand.

In the store example, if shipping does not answer, we can use the last value calculated for that zip code, or a default shipping rate:

```php
private const DEFAULT_SHIPPING = ['price' => 29.90, 'days' => 10];

public function shippingQuote(array $data): array
{
    try {
        return $this->callShipping($data);
    } catch (ConnectException | ServerException $e) {
        $this->logger->warning('Shipping unavailable, using fallback', [
            'error' => $e->getMessage(),
        ]);

        return $this->cache->get("shipping:{$data['zip']}", self::DEFAULT_SHIPPING);
    }
}
```

The purchase goes on. The customer may pay a slightly different shipping rate, but they can buy.

Two important things about fallbacks:

- **It is a business decision, not just a technical one.** A default rate may cost the store more than the real one, and someone needs to agree to that. And not everything has a fallback: there is no "default payment".
- **Going through the fallback is never a good sign.** It keeps the system standing, but it hides the problem. That is why the log in there is not decoration: every fallback needs a metric and an alert, or shipping can be down for a week without anyone noticing.

## Circuit breaker: stop kicking a dead horse

With retry and fallback, the customer is served. But look at what is happening underneath: on every purchase, the e-commerce service tries shipping three times, waits for the timeouts, and only then falls back. Multiply that by every purchase, and the shipping service, which is down, keeps getting a flood of calls. It is kicking a dead horse: nobody gains anything, and it gets in the way of the recovery.

Ideally, the shipping service could say "stop trying, I'm still recovering". Since it cannot, the caller has to notice on its own. That is the job of the **circuit breaker**, inspired by electrical breakers and popularized by Michael Nygard's book *Release It!*, in 2007. When failures cross a threshold, the breaker "trips" and cuts the calls for a while.

It has three states:

![State diagram of a circuit breaker: from CLOSED it goes to OPEN when failures reach the threshold; from OPEN it goes to HALF-OPEN when the cooldown has passed; from HALF-OPEN it goes back to CLOSED if the test succeeds, or to OPEN if the test fails](/images/posts/design-for-failure/circuit-breaker-en.svg)

- **CLOSED:** the normal state. Calls go through, and failures are counted.
- **OPEN:** failures reached the threshold. No call goes out; everything goes straight to the fallback, with no timeout to wait for. The service on the other side gets some breathing room.
- **HALF-OPEN:** the cooldown has passed. One test call is let through. If it works, the circuit closes and life goes on. If it fails, it opens again and the count restarts.

A lean version in PHP:

```php
enum CircuitState
{
    case Closed;
    case Open;
    case HalfOpen;
}

final class CircuitBreaker
{
    private CircuitState $state = CircuitState::Closed;
    private int $failures = 0;
    private ?int $openedAt = null;

    public function __construct(
        private int $threshold = 5, // failures in a row to open
        private int $cooldown = 60, // seconds until a test call
    ) {}

    public function canExecute(): bool
    {
        if ($this->state === CircuitState::Open
            && time() - $this->openedAt >= $this->cooldown) {
            $this->state = CircuitState::HalfOpen; // let one test call through
            return true;
        }

        return $this->state === CircuitState::Closed;
    }

    public function onSuccess(): void
    {
        $this->failures = 0;
        $this->state = CircuitState::Closed;
    }

    public function onFailure(): void
    {
        $this->failures++;

        if ($this->state === CircuitState::HalfOpen || $this->failures >= $this->threshold) {
            $this->state = CircuitState::Open;
            $this->openedAt = time();
        }
    }
}
```

And using it, together with retry and fallback:

```php
public function shippingQuote(array $data): array
{
    if (! $this->breaker->canExecute()) {
        return $this->shippingFallback($data);
    }

    try {
        $quote = $this->callShipping($data); // retry included
        $this->breaker->onSuccess();

        return $quote;
    } catch (ConnectException | ServerException $e) {
        $this->breaker->onFailure();

        return $this->shippingFallback($data);
    }
}
```

With the circuit open, a purchase no longer waits nine seconds to reach the fallback: it goes straight there. The customer is served faster and shipping stops taking a beating.

A detail that catches many people in PHP: **where does this state live?** On PHP-FPM, every request starts from scratch, so a `CircuitBreaker` object in memory forgets everything at the end of each request and never opens. The state has to live somewhere shared, like Redis or APCu. On Swoole and Hyperf, the process stays alive between requests, and in-memory state works per worker. Hyperf even ships components for this, `hyperf/retry` and `hyperf/circuit-breaker`.

And, as with fallbacks, a circuit opening is an event someone needs to see. It should raise an alert and show up in your monitoring.

## Saga: what about consistency?

So far, each pattern dealt with **one** call that fails. But a purchase is a set of steps: reserve the stock, charge the payment, schedule the delivery. What if the stock was reserved and the payment charged, but the delivery failed?

In a single database, that would be a transaction: either everything happens, or nothing does. But each service has its own database, and there is no transaction that spans them all. The answer to this is the **saga**, described by Hector Garcia-Molina and Kenneth Salem in 1987: a sequence of local transactions in which **every action has a matching compensation**. Reserved stock? The compensation is releasing the reservation. Charged? The compensation is a refund.

To the user, the operation looks atomic, but technically the consistency is **eventual**. The system guarantees "all or nothing" not through a real transaction, but through the ability to undo each step if the process fails.

There are two main ways to coordinate a saga:

![On the left, a choreographed saga: e-commerce, stock, payment and shipping exchange events through a broker. On the right, an orchestrated saga: e-commerce calls an orchestrator, which calls stock, payment and shipping; shipping failed and the orchestrator triggers compensations for payment and stock](/images/posts/design-for-failure/saga-en.svg)

### Choreographed

Nobody coordinates: each service reacts to events and publishes its own. When something fails, whoever notices publishes an event, and each service undoes its own part. In the talk I used Hyperf's event dispatcher to keep the example short. Between different services, that event travels through a broker such as Kafka or RabbitMQ, and the listener becomes a consumer.

Whoever notices the failure publishes the event:

```php
} catch (ConnectException | ServerException $e) {
    $this->breaker->onFailure();

    $this->eventDispatcher->dispatch(new OrderCancelled(
        orderId: $data['order_id'],
        reason: 'Shipping failed: ' . $e->getMessage(),
    ));
}
```

And each service takes care of its own compensation. In stock, for example:

```php
use Hyperf\Event\Contract\ListenerInterface;

final class ReleaseStockOnOrderCancelled implements ListenerInterface
{
    public function __construct(private StockRepository $stock) {}

    public function listen(): array
    {
        return [OrderCancelled::class];
    }

    public function process(object $event): void
    {
        // Idempotent: the same event may arrive twice.
        $this->stock->releaseReservation($event->orderId);
    }
}
```

The strength is decoupling: there is no central service that stops everything if it goes down. The weakness is that the flow is not written anywhere. It exists spread across listeners, and understanding "what happens when an order is cancelled" means looking at several services. I wrote more about this style in the article on [Event-Driven Architecture](/posts/event-driven-architecture-eda/).

### Orchestrated

An **orchestrator** knows the whole flow: it calls each service in order and, if one fails, triggers the compensations for the steps that already happened, in reverse order:

```php
final class PlaceOrderSaga
{
    public function run(Order $order): void
    {
        $compensations = [];

        try {
            $this->stock->reserve($order);
            $compensations[] = fn () => $this->stock->release($order);

            $this->payment->charge($order);
            $compensations[] = fn () => $this->payment->refund($order);

            $this->shipping->schedule($order);
        } catch (Throwable $e) {
            foreach (array_reverse($compensations) as $compensate) {
                $compensate();
            }

            throw new OrderFailed("Order {$order->id} failed", previous: $e);
        }
    }
}
```

If delivery fails, the payment is refunded and then the stock is released. The flow lives in one place, easy to read and to test. In exchange, the orchestrator becomes a central piece: if it goes down, no saga moves.

In a real system, one thing is missing from this code: **storing the saga's state**. If the orchestrator dies in the middle of a compensation, it needs to know where it stopped when it comes back. And a compensation can fail too, so it needs retries and has to be idempotent. That is why, in production, sagas usually run on top of tools like Temporal or a carefully kept state table.

### Kinds of saga

The book *Software Architecture: The Hard Parts* (Ford, Richards, Sadalage and Dehghani) organizes sagas by three choices: synchronous or asynchronous communication, atomic or eventual consistency, and orchestrated or choreographed coordination. In the talk I showed three of the combinations:

| | Communication | Consistency | Coordination |
| --- | --- | --- | --- |
| **Epic Saga** | Synchronous (HTTP) | Atomic | Orchestrated |
| **Parallel Saga** | Asynchronous (Kafka) | Eventual | Orchestrated |
| **Anthology Saga** | Asynchronous (Kafka) | Eventual | Choreographed |

The **Epic Saga** is the closest to the code above: the orchestrator calls each service over HTTP, waits for the answer, and no service talks to another directly. The **Parallel Saga** keeps the orchestrator but talks through messages, which lets steps run in parallel. The **Anthology Saga** is pure choreography: no orchestrator, each service keeps its own transaction and handles its own rollback. The further down the table, the less coupling and the more scale, and the harder it is to understand what is going on.

## Putting it all together

In a real architecture, these patterns show up together. The call to shipping has retry with backoff and jitter, a circuit breaker around it, a fallback with the last calculated value, and a log of every attempt and failure. The whole purchase is a saga, which undoes its steps if something goes wrong along the way.

Now your systems can fail in peace.

Or maybe not.

Each of these patterns solves one problem and creates another. Retry adds load to a service that is already struggling. Fallback hides the failure and may cost money. The circuit breaker needs shared state and well-tuned thresholds, or it opens for no reason or never opens at all. The saga trades a simple transaction for eventual consistency, compensations and a lot more code. It is all a **trade-off**.

So do not get attached to patterns. Figure out what makes the most sense in your context: which failure is likely, how much it costs, how long someone can wait, and which wrong answer is acceptable. There is no silver bullet.

The talk's slides are on [Speaker Deck](https://speakerdeck.com/sschonss/design-for-failure-2-dot-0). If you have been through a cascading failure, or use any of these patterns in a different way, tell me in the comments.
