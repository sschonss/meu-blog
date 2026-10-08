---
title: 'From Epic to Production: Using Agents to Deliver Features in Real Systems'
date: 2026-09-12
source: https://luizschons.com/from-epic-to-production-using-agents-to-deliver-features-in-real-systems
series: ['AI-Friendly Architecture']
draft: false
aliases: ["/from-epic-to-production-using-agents-to-deliver-features-in-real-systems/"]
translationKey: 'from-epic-to-production-using-agents-to-deliver-features-in-real-systems'
tags: ['AI', 'Architecture']
---

<p>This is the eighth article in the series about AI-friendly architecture. In the previous articles, we talked about context, documentation, observability, skills, Context Skills, agents, tools, MCP, guardrails, and harnesses.</p>
<p>Now we will bring these pieces together in a complete engineering workflow.</p>
<p>The idea is not to ask an agent to “implement a feature” and expect it to discover everything by itself. The goal is to show how an agent can help with a delivery from the moment we understand the epic until we monitor the change in production.</p>
<p>Writing the code is only one step. In many cases, it is not even the hardest one.</p>
<h2>The epic</h2>
<p>Let us use this request as an example:</p>

```text
As a customer, I want to request a partial refund for an order,
so I can return only some of the items I bought.
```

<p>At first, this looks like a small change in the payment service.</p>
<p>But before writing code, we need to understand several things:</p>
<ul>
<li><p>where the order is created;</p>
</li>
<li><p>who calculates the total amount;</p>
</li>
<li><p>which service owns the payment;</p>
</li>
<li><p>how items are linked to the transaction;</p>
</li>
<li><p>which cancellation rules exist;</p>
</li>
<li><p>how inventory is updated;</p>
</li>
<li><p>how the customer is notified;</p>
</li>
<li><p>which data must be sent to the payment provider.</p>
</li>
</ul>
<p>An agent that receives only the epic can produce a plausible solution that is still wrong.</p>
<h2>Question the epic</h2>
<p>The agent's first job should not be creating files. It should be turning the epic into questions.</p>
<p>Possible questions include:</p>
<ul>
<li><p>What business problem are we trying to solve?</p>
</li>
<li><p>Who can request a refund?</p>
</li>
<li><p>Which items are eligible?</p>
</li>
<li><p>Is there a time limit for requesting a refund?</p>
</li>
<li><p>Can an order have more than one refund?</p>
</li>
<li><p>How do we handle a partial refund that has already started?</p>
</li>
<li><p>Is the refund amount calculated from the order or from the payment?</p>
</li>
<li><p>What happens if the payment provider accepts the refund but the internal update fails?</p>
</li>
<li><p>Should inventory be released immediately or only after confirmation?</p>
</li>
<li><p>How will the customer be informed?</p>
</li>
</ul>
<p>The agent does not need to answer everything by itself. Its job is to take the right questions to the product owner and the teams involved.</p>
<p>Questioning the epic does not block the work. It turns unclear points into explicit decisions before they become bugs or rework.</p>
<p>A planning skill can guide the creation of these questions. The agent can check domain documentation and use a tool to find epics, requirements, and previous decisions.</p>
<h2>Run the spike</h2>
<p>After the goal is clear, the technical investigation begins.</p>
<p>The agent can use different Context Skills to investigate the problem. An order skill helps it understand order items and states. A payment skill explains the provider's rules. An observability skill shows how to investigate the current behavior.</p>
<p>The goal of the spike is not to produce a nice answer. It is to build a view based on evidence.</p>
<p>The agent can look for:</p>
<ul>
<li><p>code related to the order;</p>
</li>
<li><p>the current cancellation flow;</p>
</li>
<li><p>the payment provider integration;</p>
</li>
<li><p>refund or cancellation tests;</p>
</li>
<li><p>events published after a payment change;</p>
</li>
<li><p>consumers of those events;</p>
</li>
<li><p>ADRs and previous decisions;</p>
</li>
<li><p>metrics and traces for the current flow;</p>
</li>
<li><p>related incidents.</p>
</li>
</ul>
<p>A reasonable investigation could follow this order:</p>
<ol>
<li><p>Find the order model or contract.</p>
</li>
<li><p>Find the current cancellation flow.</p>
</li>
<li><p>Find the payment provider integration.</p>
</li>
<li><p>Find refund or cancellation tests.</p>
</li>
<li><p>Find events published after a payment change.</p>
</li>
<li><p>Find the consumers of those events.</p>
</li>
<li><p>Check production signals to understand the current behavior.</p>
</li>
</ol>
<p>The agent should not only find files with similar names. It needs to rebuild the flow and explain how the parts are connected.</p>
<h2>Record the spike decision</h2>
<p>The result of the spike should not remain only in the conversation history. It should become documentation that can be found during future investigations.</p>
<p>A decision document could look like this:</p>

```markdown
# Decision: partial refunds

## Context

An order can contain several items, but the current refund flow
works only with the total transaction amount.

## Options considered

- create a new transaction type;
- allow multiple refunds on the existing transaction;
- create a separate refund service.

## Decision

Use the existing transaction and track the total refunded amount.

## Consequences

- the external provider must support multiple refunds;
- the refund event must identify the items;
- the operation must be idempotent;
- old consumers must keep working.

## Risks

- two refund requests may run at the same time;
- the external and internal states may become different;
- some consumers may not know the new format.
```

<p>This documentation helps the current team, but it also helps future agents and future work.</p>
<p>Every well-documented spike adds a new context source to the architecture. Over time, we stop depending only on code and build a map of decisions, contracts, and consequences.</p>
<h2>Define what success means</h2>
<p>Before creating tasks, we need to answer one simple question:</p>
<blockquote>
<p>How will we know that this implementation solved the problem?</p>
</blockquote>
<p>For a partial refund, success may mean:</p>
<ul>
<li><p>the customer can select eligible items;</p>
</li>
<li><p>the refund amount never exceeds the amount paid;</p>
</li>
<li><p>the same request is never processed twice;</p>
</li>
<li><p>the provider receives the correct data;</p>
</li>
<li><p>inventory is updated at the right time;</p>
</li>
<li><p>the customer receives a clear notification;</p>
</li>
<li><p>old consumers keep working;</p>
</li>
<li><p>the error rate does not increase;</p>
</li>
<li><p>latency stays within the expected limit;</p>
</li>
<li><p>the number of partial-refund support requests decreases;</p>
</li>
<li><p>the operation can be investigated later.</p>
</li>
</ul>
<p>These criteria matter more than the number of changed files. Implemented code does not automatically mean that the problem was solved.</p>
<p>We also need to measure the impact outside the system. If the goal is to let customers request partial refunds by themselves, fewer support requests about this process may be an important success metric.</p>
<p>This metric should be combined with technical signals. Fewer support requests are a success only if the error rate did not increase and refunds are being processed correctly. Otherwise, we may only be making the problem less visible to support.</p>
<p>That is why the definition of success should already point to observability work. These criteria must become metrics, queries, dashboards, and alerts.</p>
<h2>Define and create the tasks</h2>
<p>With the decisions and success criteria defined, the agent can break the delivery into tasks:</p>
<ul>
<li><p>add the partial-refund endpoint;</p>
</li>
<li><p>validate items and the total refunded amount;</p>
</li>
<li><p>update the provider integration;</p>
</li>
<li><p>ensure idempotency and concurrency control;</p>
</li>
<li><p>version the payment event;</p>
</li>
<li><p>update inventory and notification consumers;</p>
</li>
<li><p>create unit and integration tests;</p>
</li>
<li><p>configure the QA environment;</p>
</li>
<li><p>add metrics and traces;</p>
</li>
<li><p>create dashboards and alerts;</p>
</li>
<li><p>update the documentation and runbook.</p>
</li>
</ul>
<p>A tool can create these tasks in the system used by the team. A planning skill can define the minimum format for each task, including context, acceptance criteria, dependencies, and risks.</p>
<p>The agent can prepare the tasks, but the team must still confirm that the split correctly represents the work and ownership of each domain.</p>
<h2>Define how to test</h2>
<p>Before implementation, we need to decide how to validate the change in a non-production environment.</p>
<p>This may involve:</p>
<ul>
<li><p>test data for orders with several items;</p>
</li>
<li><p>a simulated payment provider;</p>
</li>
<li><p>a feature flag for gradual rollout;</p>
</li>
<li><p>a QA environment with updated consumers;</p>
</li>
<li><p>contract tests for events;</p>
</li>
<li><p>concurrency tests;</p>
</li>
<li><p>idempotency tests;</p>
</li>
<li><p>failure tests after external confirmation;</p>
</li>
<li><p>rollback tests.</p>
</li>
</ul>
<p>The agent can create test scenarios from the success criteria, but the team must check whether the environment can reproduce the important conditions of the real system.</p>
<p>A good question is:</p>
<blockquote>
<p>What must be configured in QA for us to trust the result?</p>
</blockquote>
<p>If the answer is “nothing,” the test has probably not been defined well enough.</p>
<h2>Define observability before the code</h2>
<p>Even before AI tools existed, it was good practice to decide how a change would be observed after release.</p>
<p>For each feature, we need to decide:</p>
<ul>
<li><p>which logs will be emitted;</p>
</li>
<li><p>which metrics will be collected;</p>
</li>
<li><p>which traces must exist;</p>
</li>
<li><p>which queries will be used;</p>
</li>
<li><p>which behavior means success;</p>
</li>
<li><p>which behavior means degradation;</p>
</li>
<li><p>which signal should start a rollback.</p>
</li>
</ul>
<p>For partial refunds, we could track:</p>
<ul>
<li><p>the number of started requests;</p>
</li>
<li><p>the number of confirmed refunds;</p>
</li>
<li><p>the number of provider failures;</p>
</li>
<li><p>the total refunded amount;</p>
</li>
<li><p>the time between request and confirmation;</p>
</li>
<li><p>differences between external and internal state;</p>
</li>
<li><p>the number of retries;</p>
</li>
<li><p>failures by provider or payment method.</p>
</li>
</ul>
<p>The agent can help write queries and configure dashboards, but deciding what to observe is an engineering decision. Without this work, the team can release the change and have no evidence that it worked.</p>
<h2>Implement the code</h2>
<p>Only now does implementation begin.</p>
<p>The agent can help to:</p>
<ul>
<li><p>create or change classes;</p>
</li>
<li><p>update contracts;</p>
</li>
<li><p>write tests;</p>
</li>
<li><p>change schemas;</p>
</li>
<li><p>add instrumentation;</p>
</li>
<li><p>update configuration;</p>
</li>
<li><p>prepare a pull request.</p>
</li>
</ul>
<p>But it is important to understand the size of this step. Implementation is only one part of the cycle.</p>
<p>Understanding the problem, making decisions, defining success, preparing the environment, choosing signals, and planning operations may require more reasoning than writing the code itself.</p>
<p>The agent becomes more useful when it takes part in all these steps, not only when it receives a file to modify.</p>
<h2>Create dashboards and alerts</h2>
<p>Before the deployment, we need to prepare the operation of the feature.</p>
<p>This may include:</p>
<ul>
<li><p>a dashboard for the new flow;</p>
</li>
<li><p>success rate;</p>
</li>
<li><p>error rate;</p>
</li>
<li><p>latency;</p>
</li>
<li><p>request volume;</p>
</li>
<li><p>impact by customer or region;</p>
</li>
<li><p>failures by dependency;</p>
</li>
<li><p>state-mismatch alerts;</p>
</li>
<li><p>error-increase alerts;</p>
</li>
<li><p>rollback criteria.</p>
</li>
</ul>
<p>A dashboard without a clear operational question can become decoration. Each panel should help answer a question such as:</p>
<ul>
<li><p>Is the feature being used?</p>
</li>
<li><p>Is it working?</p>
</li>
<li><p>Is it slower?</p>
</li>
<li><p>Is it affecting another context?</p>
</li>
<li><p>Do we need to stop the rollout?</p>
</li>
</ul>
<h2>Deploy and monitor</h2>
<p>The agent can prepare the pull request, the change record, and the deployment plan. It can summarize risks, list checks, and organize the steps.</p>
<p>Production execution must still follow the organization's policies. Depending on the risk, a person may need to approve the change record, review the pull request, and authorize the merge.</p>
<p>After deployment, monitoring should compare the observed behavior with the previous baseline:</p>
<ul>
<li><p>Are the metrics within the expected range?</p>
</li>
<li><p>Has the error rate changed?</p>
</li>
<li><p>Is the provider responding as expected?</p>
</li>
<li><p>Are events being consumed?</p>
</li>
<li><p>Do the dashboards show the result defined at the start?</p>
</li>
<li><p>Does any alert need to be triggered?</p>
</li>
</ul>
<p>The agent can check the signals and organize the analysis. The decision to continue, pause, or revert the change must follow the limits defined by the team.</p>
<h2>Finish the delivery with documentation</h2>
<p>The delivery does not end when the deployment is complete.</p>
<p>The document created during the spike should be updated with the real implementation result:</p>
<ul>
<li><p>what was implemented;</p>
</li>
<li><p>which decisions changed;</p>
</li>
<li><p>which contracts were versioned;</p>
</li>
<li><p>which metrics were created;</p>
</li>
<li><p>which alerts exist;</p>
</li>
<li><p>how to operate the feature;</p>
</li>
<li><p>how to investigate failures;</p>
</li>
<li><p>which limitations remain;</p>
</li>
<li><p>which lessons can be reused.</p>
</li>
</ul>
<p>This closing step creates a learning cycle:</p>
<ol>
<li><p>The epic creates questions.</p>
</li>
<li><p>The spike creates a decision.</p>
</li>
<li><p>The implementation creates new behavior.</p>
</li>
<li><p>Operations creates evidence.</p>
</li>
<li><p>Documentation records what was learned.</p>
</li>
<li><p>The next request starts with more context.</p>
</li>
</ol>
<p>This is how a Context Architecture really grows. It is not a document created once. It is a body of knowledge that grows with the system.</p>
<h2>Where do skills, tools, and MCP fit?</h2>
<p>Each step can use a different combination:</p>
<ul>
<li><p><strong>Planning Skill:</strong> questions the epic and breaks down the work;</p>
</li>
<li><p><strong>Architecture Skill:</strong> checks decisions and identifies impacts;</p>
</li>
<li><p><strong>Testing Skill:</strong> defines scenarios and validation strategies;</p>
</li>
<li><p><strong>Observability Skill:</strong> creates queries, metrics, and dashboards;</p>
</li>
<li><p><strong>Delivery Skill:</strong> prepares the pull request, change record, and deployment;</p>
</li>
<li><p><strong>Tools:</strong> perform specific actions, such as finding documents or creating tasks;</p>
</li>
<li><p><strong>MCP:</strong> connects the agent to the systems where these actions happen.</p>
</li>
</ul>
<p>The agent coordinates the workflow, but it does not need to carry all knowledge from all contexts at the same time. Each skill provides a specialization, and each tool performs a concrete capability.</p>
<h2>The role of human review</h2>
<p>The goal is not to remove the team from the engineering process.</p>
<p>The team still needs to:</p>
<ul>
<li><p>confirm business rules;</p>
</li>
<li><p>evaluate trade-offs;</p>
</li>
<li><p>approve contract changes;</p>
</li>
<li><p>decide which risks are acceptable;</p>
</li>
<li><p>approve production changes;</p>
</li>
<li><p>take responsibility for the decision.</p>
</li>
</ul>
<p>The agent helps make preparation faster and more complete. It can move through different sources, find relationships that might be missed, and organize evidence in a format that is easier to review.</p>
<p>The decision remains the team's responsibility.</p>
<h2>Conclusion</h2>
<p>An agent can take part in the full life cycle of a feature without starting by writing code.</p>
<p>It can question an epic, run a spike, record decisions, define success criteria, create tasks, plan tests, prepare observability queries, implement changes, open a pull request, monitor a deployment, and update documentation.</p>
<p>This workflow works well only when context is available, connected, and reliable. Without documentation, decisions, observability, and skills, the agent tends to fill gaps with guesses.</p>
<p>With an AI-friendly architecture, the agent can work with evidence and make it clear what it knows, what it inferred, and what still needs to be decided.</p>
<p>This is where the conversation stops being only about generating code. The agent starts to take part in the engineering work that happens before, during, and after implementation.</p>
