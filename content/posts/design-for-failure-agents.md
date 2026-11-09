---
title: 'From microservices to agents: Design for Failure when the system makes its own decisions'
date: 2026-11-16T07:00:00-03:00
description: 'A support assistant can get HTTP 200 from every call and still refund the same order twice. One fictional purchase, walked step by step: evidence, proposal, budget, retries and a lost answer.'
translationKey: design-for-failure-agents
draft: false
tags: ['Architecture', 'AI', 'Microservices']
---

Ana writes to the store: "I was charged twice."

The assistant looks the order up, the calls succeed, and the screen stays green. Then it prepares a second refund for a payment that is already being refunded.

Nothing crashed. The customer can still lose money.

In [Design for Failure: wait, my system fails?](/posts/design-for-failure/) I wrote about retry, fallback, circuit breaker and saga: what the rest of the system should do when a dependency fails. Those patterns still matter. An agent (a program that asks a model what to do next) does not fix the network, and it does not make a payment safe to repeat.

It adds a second question. **What happens when the calls work and the decision is wrong?**

This article follows one fictional order from the message to the refund, and stops there. It does not turn the whole store into agents. Every acronym is explained the first time it shows up, and the [glossary](#glossary) at the end repeats them in one line. The amount 120 and the clock times are made up, so the story is easy to follow. They are not measurements.

## One order, from 10:01 to 10:05

Let's stay with Ana. Order 1842. One purchase of 120.

1. **10:01.** Ana pays 120. The payment service (the system that actually moves the money) records one successful charge.
2. **10:03.** A refund of those same 120 starts. Maybe the item was out of stock. The payment service now knows a refund is processing. Ana does not.
3. **10:04.** Ana writes "I was charged twice." She is describing the feeling, not the ledger.
4. **10:04, a few seconds later.** The assistant reads an order summary that was built at 10:02. That summary says: one charge, no refund.
5. **10:05.** The assistant proposes another refund of 120. It never asks the payment service again.

If that proposal is allowed to run, Ana receives 240 back for a purchase of 120. Every call the assistant made can still return HTTP 200, the usual "this call succeeded" status.

The same sentence from a customer is not always the same action:

| What "I was charged twice" might mean | What the store should do |
| --- | --- |
| Two successful charges | Refund the extra one, once. |
| Two attempts, and only one charge stuck | Do not refund. |
| One charge, and a refund already processing | Do not refund again. |

The rest of the article stays on the third row, because that is the row a stale summary hides. A stale read is a copy that was true earlier and is no longer the whole story.

Here are the two pictures, side by side:

![Two cards for fictional order 1842. On the left, what the assistant read: a summary taken at 10:02, one charge of 120, refund none, and the assistant treats that as an open charge. On the right, what the payment service knows at 10:04: the same charge, plus a refund of 120 already processing, which the assistant did not ask for. A note says 120 is made up, the calls can still return HTTP 200, and a new refund is a new business operation, not a retry of the read](/images/posts/design-for-failure-agents/story-en.svg)

**In short:** the assistant answered a photograph from 10:02, and the money lives in a record from 10:04.

## A 200 is not a clean bill of health

An API is the interface another program calls. JSON is a text format for structured data, the shape of the answer. Checking that the JSON has the right fields tells you the answer is well formed. It does not tell you the refund is the right one.

This did not start with AI. A normal service can also return 200 with the wrong total. The difference here is that the model chooses part of the next step: what to look up, which note to trust, and when to stop.

Mallika Rao describes that shift as moving from breaking a system into functions to [breaking it into decisions](https://www.infoq.com/articles/distributed-systems-microservices-agentic-ai/). I find that a useful lens. It is not an order to replace the store's services with agents.

Three questions, and only one of them is the HTTP status:

| Layer | The question | What can still be wrong on order 1842 |
| --- | --- | --- |
| Transport | Did the call answer in time? | The answer can be about another purchase. |
| Contract | Are the fields and types the ones we expect? | A well formed amount can still break the refund rules. |
| Business | Does this proposal match the current evidence? | The 10:02 summary is not enough to send money. |

Asking the model "are you sure?" does not replace a read of the payment.

Rao's article also talks about decisions getting worse as they pass from step to step, and about context that does not match, even when no server is down. That does not mean every long chain fails. It means a green dashboard is only half of the story.

## Side by side: a dead dependency and a bad decision

The first article uses a store where shipping is down. The new failure mode sits next to that one:

![Two drawings of Ana. On the left, a dependency is down: Ana calls the store, the store calls shipping, shipping is drawn with a dashed red border and the word down, and the caption says the failure is visible as a timeout or HTTP 500, which is where retry and fallback belong. On the right, a decision is wrong: Ana calls an assistant that proposes a second refund, the payment box is green with HTTP 200, and the caption says the calls succeed while the refund would still be wrong. The footer says it is the same customer and a different kind of failure, and that the left side is the store from the first Design for Failure article, drawn smaller](/images/posts/design-for-failure-agents/compare-en.svg)

A timeout is the maximum time the caller will wait. HTTP 500 is the usual "the server failed" status. Retry means trying the same call again. Fallback means a simpler path when the main one cannot finish. A circuit breaker stops calling a dependency for a while after too many failures, like the electrical breaker in the first article.

| | Shipping is down | The refund decision is wrong |
| --- | --- | --- |
| The question | What happens to the purchase when a dependency fails? | What happens when payment returns 200 and the conclusion is wrong? |
| What you see | Timeout, HTTP 500, or an open circuit. | Green calls, and a bad proposal. |
| Retry | The same shipping call, with backoff and jitter. | A retry of the same read. A new refund is a different operation. |
| Fallback | Another way to finish, or an honest "we cannot ship today". | Stop the automatic refund. Keep the case, and say what is missing. |
| A lost answer | The call may already have had an effect. | Same rule, and the decision must not create a second operation. |
| Where the rule lives | In the service that calls shipping. | In code outside the model, checked again before the money moves. |

Backoff means waiting longer after each failure. Jitter means a little randomness in that wait, so many clients do not retry on the same instant. The first article draws that. I will not redraw it here.

The old patterns still apply on the left. They do not, by themselves, answer the right.

## Write down what was read

A proposal should carry two different things:

- **Evidence:** which records were read, and when. For Ana, "order summary, taken at 10:02".
- **Interpretation:** what the assistant concluded. "This charge still needs a refund of 120."

We do not need a transcript of the model's private reasoning. We need a trail a person can check. Think of it as a receipt stapled to the photograph, not as the photograph pretending to be the bank.

And the receipt expires. Before money moves, the executor (the part of the system that is allowed to call the payment service) reads the payment again. Correct evidence at 10:02 can be the wrong basis at 10:05.

## The agent proposes. The application sends.

The important split is not "two agents". It is **writing a proposal** versus **having permission to run it**.

![A vertical flow for order 1842. 1, Ana's request. 2, the agent writes a proposal to refund 120 from the 10:02 summary, in an amber box. 3, policy lives in application code and checks identity, amount and which approval. An amber arrow to the right is labeled not allowed, and lands in a review queue where a person sees the proposal and the gap. A gray arrow down says yes, and the approval matches this proposal. 4, the executor reads the payment again because the summary can be stale. 5, save one operation id, then send. 6, in a green box: if the answer is lost, reconcile with that same id](/images/posts/design-for-failure-agents/proposal-en.svg)

The policy stays in code and data the application owns. It checks who Ana is, which order this is, how much is still refundable, and whether this operation needs a person. A person approves one proposal: this order, this amount. If the assistant edits the proposal after the "yes", the old approval does not cover the new text.

I wrote about permissions in [Guardrails and Fitness Functions for AI-Friendly Architecture](/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/). The reliability consequence is the short one: a wrong suggestion must not become a payment by itself.

A rule in code is not proof that the rule is the right business rule. It still needs review. The gain is that the check does not depend on the assistant's mood.

The sketch below is for teaching, the same way the PHP in the first article is for teaching. It is not a library.

```text
proposal = agent.investigate("1842")
# may say: refund 120, because the 10:02 summary showed no refund

if not policy.allows(proposal):
    send_to_review(proposal)
    stop

if proposal.needs_a_person and not approval.matches(proposal):
    send_to_review(proposal)
    stop

payment = payments.read("1842")       # again, at execution time
if payment.refund_in_progress:
    send_to_review(proposal)
    stop

operation_id = store.get_or_create_id(case="1842-refund")
payments.refund(operation_id, order="1842", amount=120)
```

Read it against the story. Step 2 of the drawing is `agent.investigate`. The stop in the middle is the 10:04 payment record the summary did not have. The `operation_id` is created in the store, not invented again by the model on the next try.

## Give the whole task a budget

Each call can have its own timeout while the task has none.

The model calls a tool (a function it is allowed to run, such as "read the order"), dislikes the answer, calls another, rewrites the plan, and starts over. Every call respects its own deadline. Ana is still waiting.

A budget is a limit for the whole task. Anthropic's note on [building effective agents](https://www.anthropic.com/engineering/building-effective-agents) recommends stopping conditions, such as a maximum number of iterations, and points out that errors and cost can pile up when an agent keeps going. The page says the tooling has moved on since it was published. I am using that design advice, not a framework recipe.

```yaml
# Teaching policy. Not a real configuration, and not a recommendation.
execution_budget:
  deadline_seconds: 20
  max_model_calls: 4
  max_tool_calls: 6
  on_exhaustion: review_queue
```

Those numbers are made up to show the shape. They are not test results, and they are not what you should copy into production.

What matters is who owns the counter. The budget belongs to the execution, not to the prompt. Replanning must not reset it. A call the agent delegates also spends the same budget, including retries done in a lower layer.

Separate the limit of one task from the limit of the whole service. Many small tasks can still swamp payment. A dedicated queue and a cap on how many investigations run at once keep them from eating the normal support traffic. That is not enough if both paths still share one database pool with no limit.

One more reminder, already true for ordinary timeouts: the deadline expired for the caller. That does not prove the remote refund was cancelled.

## Retry the call. Do not retry the refund.

The [Amazon Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) makes two points that stay useful here. Retries stacked in several layers multiply load. And a timeout does not mean the call had no effect.

With an assistant in the path, I would keep three verbs separate:

- **Transport retry:** repeat the same read after a blip, inside that API's own rules.
- **Revision:** go get more evidence, because the proposal does not pass the policy yet.
- **New business operation:** start another refund. That is not a harmless retry.

If the workflow allows 3 tries, the tool allows 3, and the HTTP client allows 3, the product is `3 × 3 × 3 = 27` calls in the worst case. The count includes the first try at each layer. It is arithmetic, so the multiplication is easy to see. It is not a number Amazon published, and it is not a lab result.

Renaming each repeat does not lighten the load. The system needs an explicit place where retries are allowed, and one shared limit that sees the real work.

For anything that moves money, the operation's identity has to survive the repeat. The trusted layer creates that id and stores it. The model does not get to create a fresh one because the first answer was slow.

[Stripe's idempotency docs](https://docs.stripe.com/api/idempotent_requests) are a concrete contract for this, and only for API v1. Idempotency means doing the operation twice has the same effect as doing it once. In v1, after the endpoint has started running, the first result is saved. The same key returns that saved result. The same key with different parameters is rejected. Keys can be removed after at least 24 hours. API v2 is a different contract, so this paragraph does not describe it.

That is not a universal promise of exactly-once execution. You still have to honor the provider's window, and you still have to block duplicates in your own database.

And idempotency does not fix intent. A wrong refund of 120 is still wrong if it happens only once.

## When you cannot finish, stop deciding

Switching models can be an availability choice. If the problem is that the payment evidence is missing, another model will not invent the missing row.

For Ana, the fallback is modest:

- tell her the investigation is not finished;
- keep what is needed to resume the case;
- send the proposal and the evidence to the review queue;
- do not create another refund while the first outcome is unknown.

The system stops resolving the case alone. It can still say what happened and what is missing.

The queue needs an owner, a capacity, a deadline and an alert. Sending every case to a person, and never looking at the pile, only moves the failure.

A circuit breaker that watches timeouts can protect the payment API and still let a bad proposal through, because the bad proposal comes back quickly and with status 200. If the quality bar is no longer met, I would pause automatic execution for this workflow with a separate switch. I would not wait for a 500.

## A lost answer gets its own state

The case I most want the tests to include: the executor sends the refund, the provider accepts it, and the response is lost.

What does the system know?

It does not know that the refund failed. **It knows it has not confirmed the outcome yet.**

![Three states for one refund. RECORDED means the intent is saved and nothing has been sent. An arrow labeled sent goes to UNKNOWN, where the request has left and the answer was not stored. An arrow labeled confirmed goes to KNOWN, where success or failure is confirmed. Red text says not to open a second refund from UNKNOWN. Confirm by reading the provider, or by repeating the same operation id where the API allows it. One id for the whole case](/images/posts/design-for-failure-agents/outcome-en.svg)

The executor should store the intent and the id before it sends. That helps if the process crashes. It does not create one atomic transaction across your database and the provider. Those are still two systems.

On the way back, use the contract you actually have: a status read, an event from the provider, or a retry with the same key where that is supported. While the outcome is unknown, the case must not gain a second, conflicting refund. That is a lock in the database, not a sentence in the prompt.

A compensation (a later action that tries to undo the first) is another operation, and it can fail too. The first article's saga is that conversation for a purchase that got halfway. Not every effect can be undone: reversing the money does not erase the wrong message Ana already received.

## Test the failure before you allow the action

A useful first set of cases, with the expected behavior written down:

| What is injected | What should happen |
| --- | --- |
| Stale or contradictory evidence | Automatic execution stops, and the missing fact is visible. |
| A well formed proposal that breaks policy | The executor rejects it before any external effect. |
| The task budget runs out during a replan | The task stops, and the budget is not reset. |
| The response is lost after the provider accepts | The case is reconciled, and no second id appears. |
| The process dies after the send and before the answer is saved | Recovery treats the outcome as unknown. |
| Two executions touch the same case | The store blocks conflicting refunds. |
| An approval exists, then the payment changes | The executor reads again and stops the action if it must. |
| The review queue starts to fill | The cap and the alert make the pile visible. |

This table is a plan. It is not a lab that was run for this article, and the rows are not measurements.

Naresh Jain describes a useful split between guidance and checks that actually run, in [Are Harnesses Worth the Cost?](https://martinfowler.com/articles/are-harnesses-worth-the-cost.html). A harness, in that piece, is the machinery around a coding agent. The experiment is about coding agents, not about this support assistant, and it is not evidence that Ana's refund was tested. The part I want is the split itself: the assistant saying "I am done" is not the check.

The last sentence of the proposal is not enough. The test has to look at what was read, what was blocked, and what actually changed.

## Count outcomes, then open the gate slowly

In [Agent Observability with OpenTelemetry](/posts/agent-observability-with-opentelemetry/) I wrote about tying activity to outcomes. OpenTelemetry is a common way to export traces and metrics. For this workflow I would want a few counts:

- How many proposals did policy reject, and why?
- How many tasks stopped for missing evidence or a spent budget?
- How many operations are unknown, and for how long?
- How many cases are waiting, and how many did a person correct?
- After a change, which mistakes show up in the cases a person reviewed?

A rejection does not prove the assistant got worse. The requests may have changed. A short queue does not prove quality either. The system might be accepting what it should hold. The counts need context, including a look at cases that were approved.

I would record the model version, the prompt version and the policy version, plus the ids needed to investigate one operation, with access and retention decided up front. I would not put Ana's data on metric labels, and I would not store every prompt by default.

Before any write, the workflow can run in shadow mode: it prepares proposals for comparison, and it is not allowed to refund. Shadow mode still spends budget and still reads data, so it needs the same limits.

Then a person reviews the proposals. Only after that, if the evidence supports it, automatic execution inside a slice the business has approved, with a switch that turns the autonomy off without stopping ordinary support. The switch blocks new actions. It does not undo actions that already happened.

## A checklist for this design

If I were reviewing the design for Ana's assistant, I would look for these and stop when one is missing:

1. **One story.** A single order, with times, so a reader can point at the step that went wrong.
2. **Evidence separated from the conclusion.** Records read, and when, stapled to the proposal.
3. **Policy outside the model.** Identity, amount and approval live in code.
4. **Approval stuck to one proposal.** An edit after the "yes" sends the case back.
5. **A read at execution time.** The 10:02 summary is not allowed to move money at 10:05.
6. **One budget for the task.** Replanning does not reset it.
7. **Retries named by kind.** Same read, more evidence, or a new refund. Only the first is a transport retry.
8. **One operation id, created in the store.** The model does not create a new one per attempt.
9. **Unknown as a real state.** A lost answer goes to reconciliation, not to a second refund.
10. **A fallback that stops.** Missing evidence goes to a queue with an owner and an alert.
11. **A switch.** Shadow, then a person, then automatic, and a way to stop new actions.

## Quick glossary {#glossary}

Each term once, in the order it mattered above:

| Term | In one sentence |
| --- | --- |
| Agent | A program that uses a model to choose the next step. |
| Model | The piece that reads the request and proposes the next step. |
| Tool | A function the model may call, such as "read the order". |
| API | The interface another program calls. |
| JSON | A text format for structured data. |
| HTTP 200 / 500 | "This call succeeded" / "the server failed". |
| Timeout | The longest the caller will wait. |
| Retry | Trying the same call again. |
| Backoff | Waiting longer after each failure. |
| Jitter | A little randomness in that wait. |
| Fallback | A simpler path when the main one cannot finish. |
| Circuit breaker | A pause on calls to a dependency after too many failures. |
| Saga | A way to undo a purchase that got halfway, from the first article. |
| Evidence | The records that were read, and when. |
| Proposal | What the assistant thinks should happen next. |
| Executor | The part that is allowed to call payment. |
| Idempotency | Doing it twice has the same effect as doing it once. |
| Operation id | The identity of one refund, reused on every retry. |
| Budget | A limit for the whole task, not for a single call. |
| Unknown outcome | The request left, and the answer was not stored. |
| Reconciliation | Reading the provider until the outcome is known. |
| Shadow mode | Proposals are prepared, and writes are not allowed. |
| OpenTelemetry | A common way to export traces and metrics. |

Timeouts, retries, fallbacks and recovery did not get less useful because a model joined the workflow.

The target got bigger. Besides keeping a dead dependency from pulling the store down, we have to keep a bad conclusion from gaining permission, repeating without a limit, and moving money nobody can explain afterwards.

For me, Design for Failure with an agent starts here: **decide what may be proposed, check what may be executed, and know what to do when the task cannot be finished.**

Sometimes the most reliable decision is not to decide alone.
