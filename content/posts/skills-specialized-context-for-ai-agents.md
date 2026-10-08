---
title: 'Skills: Specialized Context for AI Agents'
date: 2026-08-21
source: https://luizschons.com/skills-specialized-context-for-ai-agents
series: ['AI-Friendly Architecture']
draft: false
aliases: ["/skills-specialized-context-for-ai-agents/"]
tags: ['AI', 'Architecture']
---

<p>This is the fourth article in a series about AI-friendly architecture. We have already talked about context, documentation, and observability. Now I want to talk about a way to organize knowledge and workflows for agents: skills.</p>
<p>This article is not connected to a specific product or tool. The goal is to discuss the idea of a skill in a general way, independently of the model, agent, or platform used.</p>
<p>The main idea is simple: an agent does not need all possible context. It needs the right context for the problem it is trying to solve.</p>
<h2>The Problem with Putting Everything in One Place</h2>
<p>A common reaction when we start working with agents is to teach them everything at once.</p>
<p>We put company documentation, coding standards, business rules, operational instructions, dashboards, runbooks, and links to many tools in one place.</p>
<p>It seems convenient. After all, the agent has access to more information.</p>
<p>But more information does not always mean more useful knowledge.</p>
<p>When everything is shown at the same time, the agent must figure out:</p>
<ul>
<li><p>which information matters;</p>
</li>
<li><p>which information is reliable;</p>
</li>
<li><p>which pieces are related;</p>
</li>
<li><p>which information should be ignored.</p>
</li>
</ul>
<p>This creates more noise and makes the reasoning harder to follow.</p>
<p>Maybe we are repeating a problem we already had with systems: trying to put too many responsibilities in the same place.</p>
<p>A skill starts from a different idea. Each important context can have its own specialization.</p>
<h2>What Is a Skill?</h2>
<p>A skill is a unit of knowledge and workflow for a specific context.</p>
<p>It can explain:</p>
<ul>
<li><p>which concepts are important in that domain;</p>
</li>
<li><p>which questions should be asked first;</p>
</li>
<li><p>which information sources can be used;</p>
</li>
<li><p>how to understand the data;</p>
</li>
<li><p>which limits and safety rules must be followed;</p>
</li>
<li><p>how to present the result.</p>
</li>
</ul>
<p>For example, an incident investigation skill can guide the agent to identify the affected service, rebuild the timeline, check operational signals, separate facts from guesses, and record the evidence.</p>
<p>It does not need to store every log, metric, or document. It needs to know where to find this information and how to use it.</p>
<p>The value comes from combining knowledge with action.</p>
<h2>Are Skills the New Microservices?</h2>
<p>I would not say that skills are the new microservices. Technically, they are different things.</p>
<p>But there is an important connection between them.</p>
<p>We learned that large systems are easier to change when they are separated by responsibility and business context. Each context can have clearer vocabulary, rules, data, contracts, and ownership.</p>
<p>We can use a similar idea for the context we give to agents.</p>
<p>Instead of creating one agent that knows a little about every domain, we can create specialized contexts with clear boundaries:</p>
<img src="/images/posts/skills-specialized-context-for-ai-agents/e98f98b4-fb9b-45f6-92fc-df22073ed217.png" alt="Engineering Agent" style="display:block;margin:0 auto" />

<p>The agent still has a general view of the system, but it can use a specialized context when it needs to investigate a specific problem.</p>
<h2>Specialized Context Does Not Mean Isolated Context</h2>
<p>Breaking knowledge into smaller parts does not mean creating boxes that cannot communicate.</p>
<p>An investigation may start with observability, continue through delivery, and end with data. The agent needs to know when each context matters and how to connect the evidence it finds.</p>
<img src="/images/posts/skills-specialized-context-for-ai-agents/f0a395fc-f30c-4a9d-9f96-547af24fa796.png" alt="Incident Investigation" style="display:block;margin:0 auto" />

<p>A skill provides depth. The agent coordinates the work.</p>
<h2>A Skill Needs Clear Boundaries</h2>
<p>A skill that is too general quickly loses its value.</p>
<p>“Investigate production problems” is a broad instruction. It does not explain where to start, which sources to check, or how to decide that one idea is more likely than another.</p>
<p>A more useful skill defines the context, the goal, the available sources, and the investigation limits:</p>

```text
Context:
  APIs and services in the orders domain.

Goal:
  Investigate an increase in latency and identify the
  most likely causes based on evidence.

Sources and capabilities:
  - search logs, metrics, and traces from the orders flow;
  - check the service catalog and its dependencies;
  - check recent changes and deployments;
  - query the database in read-only mode;
  - compare current behavior with an earlier period.

Workflow:
  1. Identify the affected service and endpoint.
  2. Find when the change started.
  3. Compare latency, errors, and request volume.
  4. Check traces and dependencies in the flow.
  5. Check recent changes.
  6. Query order data to test the idea,
     without changing any records.
  7. Record facts, possible causes, and missing information.

Limits:
  - do not change data;
  - do not run write commands;
  - do not expose sensitive data in the result;
  - ask for help when the evidence is not enough.
```

<p>This example is more useful because it turns an intention into a process that can be followed.</p>
<p>It also makes one thing clear: querying a database does not mean giving unlimited access. The skill can use a read-only connection with defined tables, fields, and limits for that investigation.</p>
<p>In practice, the agent can access sources through clearly defined capabilities:</p>

```text
search_logs(service, time_range)
query_metrics(service, metric, time_range)
get_trace(trace_id)
list_recent_changes(service, time_range)
query_readonly_database(query, parameters)
```

<p>Each capability should have its own access policy.</p>
<p>The database query may allow only read operations, limit how long the query can run, and allow access only to the tables needed for that domain.</p>
<p>This does not mean that every skill needs to be rigid. It can allow some flexibility as long as it clearly defines the problem it is meant to solve.</p>
<p>The clearer the context, the less likely the agent is to waste time on irrelevant paths.</p>
<h2>A Skill Also Needs to Know Its Limits</h2>
<p>A good specialist is not only someone who knows what to do. It is also someone who knows when they should not act alone.</p>
<p>A skill should make these points clear:</p>
<ul>
<li><p>which actions are read-only;</p>
</li>
<li><p>which actions need approval;</p>
</li>
<li><p>which data may be exposed;</p>
</li>
<li><p>when there is not enough evidence for a conclusion;</p>
</li>
<li><p>when the problem should be sent to a person.</p>
</li>
</ul>
<p>This is especially important for skills related to production, sensitive data, or changes that may affect other contexts.</p>
<p>Specialized context should not be confused with unlimited autonomy.</p>
<p>These limits cannot exist only as instructions for the agent. We also need fixed guardrails that check permissions, arguments, environment, and impact before any action is executed.</p>
<p>We should never trust that the agent will remember or follow a security rule on its own.</p>
<p>The skill guides the behavior, but the guardrail enforces the restriction. I will explain this difference in more detail later, in an article about guardrails, permissions, and fitness functions.</p>
<h2>The Agent Connects the Contexts</h2>
<p>The biggest value is not only in creating separate skills. It is also in the agent’s ability to connect them.</p>
<p>An observability skill may find unusual behavior. A delivery skill may identify a recent change. A data skill may find a change in a pipeline.</p>
<p>With a broader view, the agent can connect these findings and form a possible explanation:</p>
<blockquote>
<p>The increase in errors started after a recent change. The service began receiving data with a different structure, and the failure is concentrated in orders created after the update.</p>
</blockquote>
<p>This conclusion still needs to be checked, but it is more useful than a list of disconnected facts.</p>
<p>Skills provide depth. The agent provides coordination.</p>
<h2>How to Start Creating Skills</h2>
<p>You do not need to start by creating one skill for every tool or team.</p>
<p>Choose a recurring problem and observe how experienced people solve it today.</p>
<p>Ask:</p>
<ul>
<li><p>which questions are asked first;</p>
</li>
<li><p>which sources are checked;</p>
</li>
<li><p>how the data is understood;</p>
</li>
<li><p>which possible causes are usually rejected;</p>
</li>
<li><p>when the investigation needs to be escalated;</p>
</li>
<li><p>which result format is actually useful.</p>
</li>
</ul>
<p>Then, turn this knowledge into a process that can be found and reused.</p>
<p>A skill does not need to be perfect in its first version. It can improve over time with real cases and include lessons from each investigation.</p>
<h2>Conclusion</h2>
<p>Skills are a way to organize specialized context for agents.</p>
<p>They prevent the agent from receiving a huge amount of information without guidance. They also help make the reasoning more specific, easier to check, and more useful.</p>
<p>The main change is not adding another layer of abstraction. It is recognizing that different problems need different knowledge, sources, and investigation methods.</p>
<p>Just as we learned to separate services by context, we can also separate the knowledge and capabilities of agents by context.</p>
