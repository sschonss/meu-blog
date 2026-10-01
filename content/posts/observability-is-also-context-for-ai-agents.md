---
title: 'Observability Is Also Context for AI Agents'
date: 2026-08-21
source: https://luizschons.com/observability-is-also-context-for-ai-agents
series: ['AI-Friendly Architecture']
draft: false
---

<p>This is the third article in a series about AI-friendly architecture. We have already talked about how AI is like a new person joining a company and how important it is to connect code, documentation, and architectural decisions.</p>
<p>Now I want to talk about a source of context that is often treated only as an operations tool: observability.</p>
<h2>The Real System Is Not Only in the Repository</h2>
<p>When we look at a system through its code, we see a picture of what was built.</p>
<p>But the system running in production may tell a different story.</p>
<p>A configuration may have changed. A dependency may be slower. A certain flow may be used much more than the team expected. A rule may work correctly in most cases but fail with a specific combination of data.</p>
<p>Code shows what should happen. Observability helps us understand what is really happening.</p>
<p>This difference matters to both people and AI agents.</p>
<h2>Observability Is Not Just Monitoring</h2>
<p>Monitoring usually answers a simple question: is something wrong?</p>
<p>Observability tries to answer a bigger question: why is the system behaving this way?</p>
<p>To do this, we use different signals:</p>
<ul>
<li><p>logs show events and details about an execution;</p>
</li>
<li><p>metrics show trends, volumes, and changes;</p>
</li>
<li><p>traces show the path of a request across different services;</p>
</li>
<li><p>deployment events show when a change went to production;</p>
</li>
<li><p>business data shows the impact on people using the system.</p>
</li>
</ul>
<p>Each signal explains one part of the system’s behavior. When these signals are connected, it becomes easier to create a possible explanation and check if it makes sense.</p>
<h2>Where Each Part Lives</h2>
<p>Just as documentation does not need to be inside the code, observability data does not need to be stored in the repository.</p>
<p>The service creates events and signals. An instrumentation layer collects these signals. The observability platform stores and connects the data. Documentation explains the meaning of important metrics, alerts, and flows.</p>
<img src="/meu-blog/images/posts/observability-is-also-context-for-ai-agents/91445626-d25b-4a7d-a40f-035f366c83ee.png" alt="Observability as context" style="display:block;margin:0 auto" />

<p>The repository can keep only the instrumentation settings, the names of the signals, and links to dashboards and runbooks. The data history stays in the operations platform, which is the right place to check how the system behaves over time.</p>
<p>The important thing is to connect these sources. An agent must be able to leave the service in the repository, reach the right dashboard, and find an explanation of what it is seeing.</p>
<h2>An Incident Is a Context Investigation</h2>
<p>Imagine that an API’s latency starts to increase.</p>
<p>An experienced person may know exactly where to look. They know the right dashboard, remember a similar incident, and know which service usually causes this type of problem.</p>
<p>A new person does not have this knowledge. An agent does not have it either.</p>
<p>To investigate the problem, they need to find a sequence of clues:</p>
<ol>
<li><p>When did the problem start?</p>
</li>
<li><p>Which service showed the first signal?</p>
</li>
<li><p>Did the increase affect all users or only one flow?</p>
</li>
<li><p>Was there a deployment or configuration change during this time?</p>
</li>
<li><p>Which dependency started responding more slowly?</p>
</li>
<li><p>Did the increase in latency affect any business metric?</p>
</li>
</ol>
<p>One dashboard cannot answer all these questions. They require information from different sources.</p>
<p>That is why observability is also context. It gives us evidence about how the system behaves in a specific situation.</p>
<h2>Logs Need to Tell a Story</h2>
<p>A log with a short message may help someone who knows the code. For a larger investigation, it is usually not enough.</p>
<p>Compare these two examples:</p>
<pre><code class="language-text">Error processing payment
</code></pre>
<pre><code class="language-json">{
  "event": "payment_processing_failed",
  "order_id": "ord_123",
  "payment_provider": "provider_a",
  "error_code": "timeout",
  "retry_count": 2,
  "request_id": "req_456",
  "occurred_at": "2026-08-20T18:30:00Z"
}
</code></pre>
<p>The second example is better because it contains information that can be connected to other signals.</p>
<p>With a <code>request_id</code>, we can follow the request across different services. With an <code>order_id</code>, we can understand the impact on one transaction. With the error code, we can group similar failures. With the timestamp, we can compare the event with deployments and infrastructure changes.</p>
<p>Structured logs make the system’s behavior easier to understand.</p>
<h2>Metrics Need to Have Meaning</h2>
<p>It is possible to have many dashboards and still have poor observability.</p>
<p>A metric is useful only when we know what it means, what behavior it describes, and when we should pay attention to it.</p>
<p>For example, a metric called <code>request_count</code> may show the number of requests. But we also need to know:</p>
<ul>
<li><p>what the time unit is;</p>
</li>
<li><p>which service creates this metric;</p>
</li>
<li><p>which filters are available;</p>
</li>
<li><p>what change is considered normal;</p>
</li>
<li><p>how it relates to errors and latency.</p>
</li>
</ul>
<p>Without this context, an agent may find the right metric and still understand it incorrectly.</p>
<p>A good practice is to document the most important metrics with their meaning, dimensions, and known limits. The dashboard becomes a visual explanation of the system.</p>
<h2>Traces Connect Architecture to Behavior</h2>
<p>In a distributed architecture, a request may pass through several services before reaching the user.</p>
<p>When we look at each service separately, we lose part of the story. A trace lets us follow the full path and see where time was spent.</p>
<p>This helps answer questions such as:</p>
<ul>
<li><p>which service added the most latency;</p>
</li>
<li><p>which call was repeated several times;</p>
</li>
<li><p>where the first error happened;</p>
</li>
<li><p>which external dependency is affecting the flow;</p>
</li>
<li><p>whether a failure in one service is causing problems in others.</p>
</li>
</ul>
<p>For an agent, traces connect the architecture map to a real execution. They show how the components worked together, not only how they were described in a document.</p>
<h2>Operational Context Must Include the Business</h2>
<p>One common mistake in observability is looking only at the technical health of the system.</p>
<p>CPU, memory, error rate, and latency are important. But they do not always show the real impact on the people using the product.</p>
<p>An API may return a successful response while an important business step is failing. A flow may have few errors but affect the most important customers. A queue may be processing messages but with a delay that creates a bad user experience.</p>
<p>Because of this, it is useful to connect technical signals with business events:</p>
<ul>
<li><p>approved payments;</p>
</li>
<li><p>completed orders;</p>
</li>
<li><p>processed documents;</p>
</li>
<li><p>users who completed a step;</p>
</li>
<li><p>transactions that needed manual help.</p>
</li>
</ul>
<p>This context helps the agent focus on what really matters. Not every technical alert is a business incident, and not every business problem appears as an obvious technical error.</p>
<h2>What Happens After a Deployment?</h2>
<p>A code change can only be properly evaluated after it starts running.</p>
<p>The context of a change should also include its connection to production signals. When a deployment happens, we should be able to answer:</p>
<ul>
<li><p>which services changed;</p>
</li>
<li><p>which metrics need to be watched;</p>
</li>
<li><p>what behavior we expect;</p>
</li>
<li><p>which alerts may show a problem;</p>
</li>
<li><p>how to compare the old behavior with the new behavior.</p>
</li>
</ul>
<p>With these connections, an agent can help not only write a change but also check whether it produced the expected result.</p>
<h2>How to Prepare Observability for Agents</h2>
<p>You do not need to instrument everything at once. It is better to choose one important flow and make it easy to understand from start to finish.</p>
<p>These steps can help:</p>
<ol>
<li><p>Choose a flow that matters to the business.</p>
</li>
<li><p>Make sure it has a correlation ID.</p>
</li>
<li><p>Structure the main logs for this flow.</p>
</li>
<li><p>Create metrics with clear names and meanings.</p>
</li>
<li><p>Check that traces pass through the services involved.</p>
</li>
<li><p>Connect deployments, incidents, and configuration changes.</p>
</li>
<li><p>Document what is normal and what shows unusual behavior.</p>
</li>
</ol>
<p>The goal is not only to create better-looking dashboards. The goal is to build a system that can tell its own story when something changes.</p>
<h2>Conclusion</h2>
<p>Observability is one of the most important ways to give context to AI agents.</p>
<p>Code and documentation explain how the system was designed. Logs, metrics, and traces show how it behaves when people are really using it.</p>
<p>When these signals are structured, connected, and linked to business context, a new person or an AI agent can investigate problems with less help from people who already know the system.</p>
<p>In the next article, I will talk about skills. The idea is to understand how to give an agent the right context for each problem, with specialized skills for observability, delivery, data, and other technical areas.</p>
