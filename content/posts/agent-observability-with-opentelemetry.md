---
title: 'Agent Observability with OpenTelemetry'
date: 2026-09-16
source: https://luizschons.com/agent-observability-with-opentelemetry
series: ['AI-Friendly Architecture']
translationKey: agent-observability-with-opentelemetry
draft: false
---

<p>This is the ninth and final article in the series about AI-friendly architecture. Throughout the series, we talked about context, documentation, system observability, skills, agents, tools, MCP, security, and the complete workflow for delivering a feature.</p>
<p>To close the series, I want to look inside the AI tool itself.</p>
<p>When an agent takes part in a task, we usually look only at the final result. Was the pull request created? Did the tests pass? Was the feature delivered?</p>
<p>These questions matter, but they do not explain the path the agent took.</p>
<p>How long did it take to find the right context? How many times did it repeat the same investigation? Which tools did it use? When did it need approval? Was the problem in the model, the documentation, the integration, or the workflow itself?</p>
<p>Without these signals, every evaluation is based on impressions.</p>
<h2>The agent's work also needs to be observable</h2>
<p>In traditional systems, we already know that logs, metrics, and traces help explain how an application behaves. We do not consider an API reliable just because it answered once. We observe latency, errors, dependencies, traffic, and impact.</p>
<p>With agents, many teams still do the opposite. They evaluate the tool through a few isolated interactions and decide that it is fast, slow, good, or bad.</p>
<p>An agent session is also a distributed flow. It involves a model, context, tools, permissions, external systems, files, tests, and human decisions. The final result is only the last event in this chain.</p>
<p>If we want to improve this flow, we need to see what happens before the final result.</p>
<img src="/images/posts/agent-observability-with-opentelemetry/e98ed5d6-ff82-4af9-abd1-c47cbabb2f20.png" alt="" style="display:block;margin:0 auto" />

<h2>What is worth measuring?</h2>
<p>Observability does not mean recording everything. The goal is not to watch developers or turn token counts into a false measure of productivity.</p>
<p>The goal is to create evidence for engineering decisions.</p>
<p>Some useful signals include:</p>
<ul>
<li><p>number and duration of sessions;</p>
</li>
<li><p>time spent on model and tool calls;</p>
</li>
<li><p>tokens used and estimated cost;</p>
</li>
<li><p>errors, retries, and interruptions;</p>
</li>
<li><p>number of approval requests;</p>
</li>
<li><p>tests run and their results;</p>
</li>
<li><p>files or lines changed;</p>
</li>
<li><p>task result, such as a created pull request, an interrupted change, or a completed delivery.</p>
</li>
</ul>
<p>These signals become useful when we connect them to real questions.</p>
<p>Did new documentation reduce the time to the first useful hypothesis? Did an investigation skill reduce the number of tool calls? Is an external MCP adding latency without improving the result? Is an agent asking for approval too early or too late? Did a context change increase cost because it added useful information or because it added noise?</p>
<p>We cannot answer these questions by looking only at the agent's final response.</p>
<p>A good metric is not always the easiest one to count. It is the one that helps us understand a decision or find an opportunity to improve.</p>
<h2>OpenTelemetry as a common layer</h2>
<p>This article uses OpenTelemetry because it is an open standard and an open-source project. We can start without paying for a proprietary observability platform.</p>
<p>One possible architecture uses an OpenTelemetry Collector to receive and forward signals, Prometheus to store metrics, and Grafana to query them. These components are free and open source, although the model used by the tool or a managed platform may have its own costs.</p>
<p>The most important point is not the dashboard choice. It is the separation between the tool that produces events and the system that observes them.</p>
<p>OpenCode is only the example used in this article. It can be instrumented by a plugin that exports signals through OTLP. The same architecture can be used with Codex, Claude Code, Cursor, or another tool when it has a native exporter, plugin, hook, or adapter that can produce telemetry.</p>
<p>Each tool may emit events in a different way. The backend does not need to know all these details. It can work with more stable concepts such as session, model call, tool, approval, error, and result.</p>
<p>This separation lets us replace the tool without rebuilding the entire observability infrastructure. It also lets us compare different workflows using a common language.</p>
<h2>From activity to results</h2>
<p>A common trap is to observe activity only.</p>
<p>More messages do not always mean more progress. More tokens may represent better context, but they may also mean that the agent is lost. More tool calls may show a careful investigation or a lack of documentation.</p>
<p>For this reason, activity signals must be connected to result signals.</p>
<table>
<thead>
<tr>
<th>Activity</th>
<th>Result worth investigating</th>
</tr>
</thead>
<tbody><tr>
<td>Tokens used</td>
<td>Was the task completed with less rework?</td>
</tr>
<tr>
<td>Tool calls</td>
<td>Did the agent find better evidence?</td>
</tr>
<tr>
<td>Session duration</td>
<td>Did the extra time improve quality or only add waiting?</td>
</tr>
<tr>
<td>Approval requests</td>
<td>Were the autonomy limits appropriate?</td>
</tr>
<tr>
<td>Lines changed</td>
<td>Were the tests and success criteria met?</td>
</tr>
</tbody></table>
<p>This care prevents observability from becoming a scoreboard. We are not judging the agent by the largest possible amount of output. We are trying to understand whether the workflow helps the team reach better decisions safely.</p>
<h2>Context also appears in the metrics</h2>
<p>Session signals can show problems that are not in the model.</p>
<p>If the agent spends a long time looking for files, the context architecture may be hard to navigate. If it repeats queries, a more specialized skill may be missing. If external calls are slow, the integration may be poorly designed. If it asks for approval at almost every step, the permissions may be too strict or the workflow may not be clear enough.</p>
<p>This is an important part of AI-friendly architecture: context is not only something we give to the agent. It is also something we can evaluate through observed behavior.</p>
<p>Telemetry closes the loop between context, execution, and learning.</p>
<h2>Observability is also security</h2>
<p>Agent telemetry may contain more information than it seems.</p>
<p>A prompt may contain an internal rule. A tool argument may contain a token. A result may include customer data. A trace may record part of the code. A file path may reveal the structure of a system.</p>
<p>For this reason, we should not trust the agent itself to decide what can be sent to the backend. Protection must be enforced by deterministic components such as the Collector, the telemetry gateway, and access policies.</p>
<p>Some principles are important:</p>
<ul>
<li><p>full prompts should not be stored in metrics;</p>
</li>
<li><p>tool arguments and results must be sanitized before they are sent;</p>
</li>
<li><p>file paths and code content should not become labels;</p>
</li>
<li><p>credentials must stay out of versioned configuration;</p>
</li>
<li><p>tokens for managed destinations should have the least privilege possible;</p>
</li>
<li><p>retention and access must be defined before collection starts;</p>
</li>
<li><p>high-cardinality identifiers must be handled carefully.</p>
</li>
</ul>
<p>This connects to the article about <a href="https://luizschons.com/seguran-a-guardrails-e-fitness-functions-para-agentes">security, guardrails, and fitness functions</a>. Deterministic guardrails should not protect only the agent's actions. They must also protect the data created during the agent's work.</p>
<h2>The <code>session_id</code> case</h2>
<p>During an investigation, it can be useful to open one session and understand what happened in it. A local implementation may let you select a <code>session_id</code> in Grafana for this type of analysis.</p>
<p>This is convenient in a local environment, but each new session may create a new metric series. In an operation with many users and executions, this cardinality growth can be expensive and hard to support.</p>
<p>That is why observability for development is different from observability for production.</p>
<p>In development, keeping the identifier can make learning easier. In production, it may be better to use aggregated metrics and send sanitized traces or logs to a backend designed for individual investigation.</p>
<p>A dashboard is an investigation tool. It should not be treated as permission to collect any data we want.</p>
<h2>A lab that makes the idea concrete</h2>
<p>To keep the discussion practical, I created the repository <a href="https://github.com/sschonss/agent-observability-with-opentelemetry">agent-observability-with-opentelemetry</a>.</p>
<p>It contains a local setup with OpenTelemetry Collector, Prometheus, and Grafana, plus an initial dashboard for agent sessions. OpenCode is used as the instrumentation example, but the backend was designed to receive signals from other tools as well.</p>
<p>The repository also documents the limits of the experiment. Logs and traces are disabled at first because they may contain prompts, code, and sensitive arguments. The idea is to start with a small set of metrics, understand what we really need to observe, and only then expand the collection.</p>
<p>This is healthier than turning on every available signal and discovering too late that we created a new security problem.</p>
<h2>Conclusion</h2>
<p>An AI-friendly architecture should not only provide context to the agent. It should also make the agent's work observable.</p>
<p>When we measure sessions, duration, tokens, tools, errors, approvals, and results, we can discuss how the workflow is improving based on evidence. We may discover that the problem is not the model but the documentation. We may see that a skill reduced unnecessary exploration. We may find a slow integration or a step that asks for human review too early.</p>
<p>OpenTelemetry offers an open way to get started. OpenCode was only the example used in this article. The same separation between tool, instrumentation, Collector, and backend can support other tools and models.</p>
<p>This is the end of the series. The central idea is simple: better agents depend less on guessing and more on context, limits, evidence, and feedback. Observability is what shows us whether we are truly improving.</p>
