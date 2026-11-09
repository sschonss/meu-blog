---
title: 'From microservices to agents: Design for Failure when the system makes its own decisions'
date: 2026-11-16T07:00:00-03:00
description: 'The calls succeeded, but the agent proposed the wrong refund. A step-by-step story about limits, retries, approval, and recovering an operation without repeating it.'
translationKey: design-for-failure-agents
draft: false
tags: ['Architecture', 'AI', 'Microservices']
---

"I was charged twice."

The user contacts the store, the assistant looks up the order, and it suggests a refund. The task looks solved. There is just one detail: that payment was already being refunded.

No server went down. No call returned an error. The proposal was still wrong.

In [Design for Failure: wait, my system fails?](/posts/design-for-failure/), the question was what happens to the rest of the store when a dependency stops responding. Now I want to continue that conversation with another question: **what happens when everything responds, but the system chooses the wrong next step?**

This is part of the challenge of adding AI (artificial intelligence) agents to an application. Here, an agent is a program that uses a language model to choose actions, such as looking up an order, gathering more information, or preparing a response. It does not replace the whole store. It participates in one part of support.

Let's follow that part from beginning to end. The order, amounts, and times below are fictional. They explain the design; they are not a production story or results from a lab.

## One order in five moments

The order is **1842**, a purchase of **R$120**, in Brazilian reais. The illustrative times use Brasília Time (BRT).

1. **At 10:01, payment is confirmed.** The store records one charge of R$120.
2. **At 10:02, an order summary is updated.** At that moment, it shows one charge and no refund.
3. **At 10:03, the store starts a refund.** The payment service, which maintains the record of financial movements, already knows about it. The summary has not been updated yet.
4. **At 10:04, the user asks for help.** They say they were charged twice. The assistant reads the 10:02 summary but does not check the payment's current state.
5. **At 10:05, the assistant suggests another refund.** It has turned incomplete information into an action that should not happen.

Notice the jump between the last two steps. "The summary shows no refund" became "a refund is needed." Those are not the same statement.

The user's message starts an investigation. It does not authorize a refund. Two confirmed charges, two payment attempts, and a refund in progress are different situations. Before choosing an action, the store needs to determine which one happened.

An **API** (Application Programming Interface) lets one program interact with another. For these queries, **HTTP** (Hypertext Transfer Protocol, the protocol used for web communication) returns a status code. A `200 OK` means that particular request succeeded. It does not certify the conclusion the assistant drew from the response.

![Two views of order 1842: the 10:02 summary shows a charge of 120 with no refund, while the payment record at 10:04 already shows a refund processing. The assistant only consulted the old summary](/images/posts/design-for-failure-agents/story-en.svg)

If the application accepts the proposal without checking payment, it might try to create a duplicate operation. That does not mean the provider will necessarily refund the money twice: it might have controls that block the attempt. The error we can already identify happens earlier, in the proposal and the missing barrier around it.

**In short:** the assistant read an old snapshot. The application cannot treat that snapshot as authorization to move money now.

## From microservices to agents: what changes?

Microservices divide an application into smaller services with their own responsibilities. In the [first article's example](/posts/design-for-failure/), the store talks to inventory, shipping, and payment. If shipping does not respond, the purchase needs a way forward.

An agent adds a choice along that path. Instead of only following a sequence defined in code, the model can decide whether to query payment, ask for more information, or close the support conversation. This is the perspective an [InfoQ article calls decision decomposition](https://www.infoq.com/articles/distributed-systems-microservices-agentic-ai/).

It does not mean traditional services only fail by going down. They can also calculate wrong amounts or use old data. The difference is having another source of decisions to constrain and verify.

![A comparison between an unavailable dependency, with shipping down, and an incorrect decision, with the assistant proposing another refund even though the queries return successfully](/images/posts/design-for-failure-agents/compare-en.svg)

| Question | Flow defined in services | Flow with an agent choosing steps |
| --- | --- | --- |
| Who chooses the next step? | Application code. | The model makes some choices within limits set by the application. |
| What can fail? | The call, the data, and the business rule. | All of those, plus tool selection, interpretation, and deciding when to stop. |
| What does a 200 response confirm? | That particular request succeeded. | The same thing. It does not confirm decision quality. |
| What is safe to repeat? | An operation whose repetition is safe. | The same rule applies. Replanning does not authorize another financial operation. |
| Who protects payment? | The payment service's rules and controls. | The same controls. The model does not gain permission to ignore them. |
| What if the task cannot be completed? | The flow follows a predefined alternative. | The task must stop or go to review, without inventing missing information. |

The familiar patterns still help. But wrapping the agent in more retries and hoping one works is not enough.

## First, separate what was read from what was concluded

Back to order 1842. The assistant's proposal should make two things clear:

- **Evidence:** "The order summary, updated at 10:02, was consulted. It showed no refund."
- **Conclusion:** "The assistant suggests refunding R$120."

That lets us ask the missing question: **is this evidence sufficient for this action?**

An order summary might be enough to answer a question about a product description. For moving money, the design needs to consult the relevant financial records and check the operation's rules.

Requiring a **JSON** (JavaScript Object Notation, a text format for structured data) response with the correct fields does not solve that. The value `120` can be a valid number and still be the wrong amount for the action.

I would keep the information's source, the time it was read, and the rule applied alongside the proposal. Not a transcript of the model's internal reasoning, but references that let someone verify the result.

## Then, separate proposing from executing

The agent can investigate the order and write a proposal. Permission to execute the refund stays in another part of the application: the **executor**.

Think of the difference between filling out a request and having access to the account that will pay for it. Filling it out correctly does not, by itself, authorize sending the money.

The path would look like this:

![The user makes a request, the agent prepares a proposal, and application policy checks identity, amount, and approval. The executor revalidates payment and rules before recording and sending the operation. Blocked cases go to review](/images/posts/design-for-failure-agents/proposal-en.svg)

For our order, the new query would show that a refund is already processing. **The proposal stops there.** The user can receive an explanation about the existing refund instead of another operation that was never properly justified.

A small sketch shows where that stop belongs. This is teaching pseudocode, not a ready-to-use implementation:

```text
proposal = agent.investigate(request)
payment = payments.read(proposal.payment)

decision = policy.evaluate(
    proposal,
    payment,
    case_approval
)

if decision != "allowed":
    send_to_review(proposal, decision)
    stop

record_for_controlled_execution(proposal)
```

**Policy** means business rules enforced outside the model. It checks identity, payment, the refundable amount, and whether that action needs human approval. The proposal does not decide whether approval is required.

When a person approves, they approve that operation: that payment, that amount. If the proposal changes, the earlier authorization does not cover the new version.

And a fresh read alone does not solve concurrency. Two executions can read the same state before either updates it. The real flow still needs controls in storage and the payment service to prevent conflicting operations. The sketch shows the separation of responsibilities, not a replacement for those controls.

The permissions discussion is in [Guardrails and Fitness Functions for AI-Friendly Architecture](/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/). Here, the point is to stop a bad suggestion from crossing the boundary between text and an external side effect.

## The whole task needs a limit too

Now imagine that payment does not respond.

A **timeout** is the maximum time a call will wait. The assistant can respect that timeout, call another tool, rewrite its plan, and try again. Every call is short. The support task never ends.

A **tool**, here, is a function available to the agent, such as looking up an order. Repeating that query after a temporary failure is a **retry**, another attempt at the same operation.

[Anthropic's guidance on building effective agents](https://www.anthropic.com/engineering/building-effective-agents) includes stopping conditions, such as a maximum number of iterations. I would apply that to the whole task, not just individual calls:

```yaml
# Illustrative example, not a framework configuration.
execution_budget:
  deadline_seconds: 20
  max_model_calls: 4
  max_tool_calls: 6
  on_exhaustion: review_queue
```

The numbers only show the shape of a budget. They were not measured for this article and are not recommended production limits.

What matters is keeping the counter in the application. Replanning does not reset the budget. Delegating a query does not create extra time or attempts. And a per-task limit does not replace a service-wide concurrency limit.

If the deadline expires with a call still in progress, that does not prove the remote operation was canceled. We will return to that case below.

**In short:** the agent can choose paths, but it cannot choose an infinite number of them.

## Trying again can also make a failure worse

The [Amazon Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) explains why attempts at several layers multiply.

Suppose the workflow makes up to three attempts. The tool it calls also makes up to three. The client talking to the API makes another three. In the worst case for that combination, there are `3 × 3 × 3 = 27` attempts against the dependency, including the initial attempt at each layer. This is illustrative arithmetic, not a test result.

Giving the model more time to "think harder" does not fix this multiplication. We need to define where retries happen and account for work done in lower layers.

The first article already explains **backoff**, increasing the interval between attempts, and **jitter**, randomness in that interval so clients do not all retry together. Those still apply. The new concern is not confusing three things:

1. Repeating a query that failed.
2. Gathering different evidence to revise a conclusion.
3. Creating a new refund.

The last two are not transport retries. They need their own limits and rules.

## A lost response is not a rejected refund

The duplicate proposal was blocked. Now let's look at another possible failure, this time in the legitimate refund.

The application sends the request. The provider accepts it. Before the response arrives, the connection drops.

For the provider, the operation exists. For the store, the outcome has not yet been confirmed. If the assistant interprets the timeout as "nothing happened" and creates another operation, it can turn a communication problem into a duplicate attempt.

That is why **unknown needs to be a real state**, not another word for failure.

![Three operation states: intent recorded, outcome unknown after sending, and outcome known after confirmation. While the outcome is unknown, the system reconciles the same operation instead of creating another refund](/images/posts/design-for-failure-agents/outcome-en.svg)

The executor records the intent and an operation identity before sending. If it needs to resume, it continues investigating **that operation**. The record helps recovery, but does not create a single transaction across the store's database and the provider.

This is where **idempotency** comes in: repeating the same operation without repeating its business effect. [Stripe's documentation](https://docs.stripe.com/api/idempotent_requests) gives a concrete example. In API v1, the same key lets the client retrieve the saved result of a request whose execution began. There are parameter and retention rules; this is not a promise that any repetition will remain safe forever.

The key identifies a business operation, not the entire lifetime of an order. Two legitimate partial refunds can be different operations. The mistake is creating another identity for the same intent just because the response was lost.

Recovery uses the available contract: a status query, a provider event, or a retry with the same key where supported. Comparing local and remote state to establish the outcome is **reconciliation**.

And it helps to separate two protections: idempotency prevents a repeated effect; policy checks whether the effect should happen. A wrong refund is still wrong if it happens only once.

## Plan B can be stopping

A **fallback** is an alternative path when the main one cannot finish. For this support task, it does not need to be another model guessing what happened to the payment.

It can be much simpler: preserve the case, explain that the investigation is not complete, and send the evidence to a responsible person. Without creating another refund while the previous outcome remains unresolved.

The queue needs capacity, deadlines, and alerts. Otherwise, the system looks available while work simply moves elsewhere and piles up.

A **circuit breaker**, which stops calls to a dependency after too many failures, still helps with communication failures. But a bad proposal can arrive quickly, without a technical error. That is why I would also have a way to pause automatic execution when the workflow's criteria are no longer being met.

If an operation has already happened, turning off the agent does not undo it. A **compensation** is another action that tries to correct its effect, and can fail too. That is the saga discussion from the first article: a sequence of operations and compensations. Not every effect can be reversed either: correcting payment does not erase incorrect information already sent to the user.

## How to check whether the design works

The table below proposes tests. It does not report executed tests:

| Test scenario | What the test should verify |
| --- | --- |
| The assistant receives order 1842's old summary. | The proposal is not executed without checking payment and validating policy. |
| The proposal has the correct format, but a refund is already processing. | The application blocks the new operation. |
| The agent replans after exhausting its budget. | The counter does not restart, and the case follows the defined exit path. |
| The response is lost after provider acceptance. | The operation enters reconciliation without acquiring another identity. |
| Two executions try to act on the same payment. | Controls prevent conflicting operations. |
| Payment changes after human approval. | Authorization and state are revalidated before the side effect. |

A [study of checks around coding agents](https://martinfowler.com/articles/are-harnesses-worth-the-cost.html) separates guidance from executable checks. Its context differs from this support task. The principle that matters here is the same: "done" does not replace an independent check of the outcome.

Beyond tests, I would track rejected proposals, cases stopped for missing evidence, operations with unknown outcomes, and time spent waiting for review. The [article on agent observability with OpenTelemetry](/posts/agent-observability-with-opentelemetry/) covers the infrastructure. OpenTelemetry is an open-source project for instrumenting and transporting observability data, such as metrics and execution traces.

None of those numbers proves quality alone. We also need to review approved cases and understand whether the model, policy, or type of request changed. And avoid putting personal data in metric labels or saving every prompt by default. A **prompt** is the instructions and context provided as input to the model.

I would begin in **shadow mode**: prepare proposals for comparison without permission to issue refunds. Then, human review. Only after that, if the evidence supports it, automatic execution within an approved scope, with a way to turn it off. Shadow mode also reads data and consumes resources; it is not exempt from limits.

## A checklist to take back to your project

Before allowing an action, check:

- [ ] Does the proposal distinguish what was consulted from what was concluded?
- [ ] Is the evidence appropriate for the action and revalidated when necessary?
- [ ] Are policy and approval requirements controlled outside the model?
- [ ] Does approval match the exact operation that will be executed?
- [ ] Are there controls for concurrency and conflicting operations?
- [ ] Does the task have a total budget, including delegation and retries?
- [ ] Does the same operation retain its identity during recovery?
- [ ] Does an unknown outcome lead to reconciliation rather than another financial operation?
- [ ] Does review have an owner, capacity, and a deadline?
- [ ] Can outcomes be observed and new automatic actions be disabled?

## Quick glossary {#glossary}

| Term | In one sentence |
| --- | --- |
| AI | Artificial intelligence; here, used to interpret requests and propose steps. |
| Agent | A program that uses a model to choose actions within a workflow. |
| Tool | A function the agent can call, such as querying payment. |
| API | Application Programming Interface, through which one program uses another. |
| HTTP | Web communication protocol; 200 indicates success for that request, not the whole decision. |
| JSON | A text format for representing structured data. |
| Evidence | Information consulted, with its source and the time it was read. |
| Policy | Rules determining whether an action may happen. |
| Executor | The application component authorized to perform the action. |
| Timeout | A limit on how long a call waits. |
| Retry | Another attempt at the same operation. |
| Backoff and jitter | Waiting between attempts, with increasing intervals and randomness. |
| Budget | Time and work limits for the whole task. |
| Idempotency | Repeating an operation without repeating its business effect. |
| Reconciliation | Comparing local and remote state to establish the outcome. |
| Fallback | An alternative path when the main one cannot finish. |
| Circuit breaker | Temporarily stopping calls after a failure threshold. |
| Saga | A sequence of operations with compensations for partial failures. |
| Prompt | Instructions and context provided as input to the model. |
| Shadow mode | Preparing proposals for evaluation without executing business actions. |

## To close

Order 1842 did not need a more convincing model. It needed a missing query, a rule outside the model, and an application able to say "this action cannot go through."

That is what I would bring from Design for Failure to agents. The network precautions remain. The responsibility for decisions grows.

**Giving a system autonomy does not mean removing the rules. It means defining how far it may go and what happens when it needs to stop.**
