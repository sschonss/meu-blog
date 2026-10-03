---
title: 'Context Skills: Breaking Down the Context for AI Agents'
date: 2026-09-05
source: https://luizschons.com/context-skills-breaking-down-the-context-for-ai-agents
series: ['AI-Friendly Architecture']
draft: false
aliases: ["/context-skills-breaking-down-the-context-for-ai-agents/"]
---

<p>This is the sixth article in the series about AI-friendly architecture. We have already discussed how code, documentation, and observability help agents understand systems. We also saw how skills can provide specialized knowledge for specific problems.</p>
<p>Now I want to take a step back and look at the architecture behind these skills.</p>
<p>Just as we learned to split large systems into smaller contexts, we may also need to learn how to split the context we give to agents.</p>
<h2>The Context Monolith</h2>
<p>One of the first attempts to prepare a repository for agents is often to create one central file with all the instructions.</p>
<p>Something like this:</p>
<pre><code class="language-text">AGENTS.md

# How our company works

Architecture
Domains
Coding standards
Deployment processes
Observability
Business rules
Runbooks
Testing conventions
Information about all teams
</code></pre>
<p>At first, this file helps. It creates one place to record decisions and guidance that used to exist only in people's heads.</p>
<p>But it can grow quickly. After some time, it becomes hard to know which parts apply to each task, who is responsible for updating them, and which instructions have priority.</p>
<p>This is a context monolith.</p>
<p>The problem is not having a central file. The problem is putting knowledge from every domain and every tool in the same place without clear boundaries.</p>
<h2>What We Learned from Microservices</h2>
<p>The evolution of microservices taught us an important lesson: large systems are easier to understand when they are split by responsibility and business context.</p>
<p>A bounded context is not only a folder or a separate service. It defines a boundary that contains:</p>
<ul>
<li><p>its own vocabulary;</p>
</li>
<li><p>specific rules;</p>
</li>
<li><p>clear responsibilities;</p>
</li>
<li><p>contracts with other contexts;</p>
</li>
<li><p>related data and behavior;</p>
</li>
<li><p>defined ownership.</p>
</li>
</ul>
<p>For example, inside the payments context, the word transaction may have a specific meaning. Inside the orders context, the same word may appear but represent another part of the business.</p>
<p>Boundaries help prevent every component from needing to know everything.</p>
<p>We can apply a similar idea to the context given to agents.</p>
<h2>Context Can Also Be Decomposed</h2>
<p>Instead of giving every instruction for every problem, we can create specializations:</p>
<img src="/images/posts/context-skills-breaking-down-the-context-for-ai-agents/c4a20dee-f240-4c5a-9203-1a486b0fed2f.png" alt="One Agent, Several Contexts" style="display:block;margin:0 auto" />

<p>Each skill knows one context deeply. It can have its own vocabulary, rules, tools, and limits.</p>
<p>A payments skill can explain transaction states, refund policies, and the provider integration. A delivery skill can explain the deployment flow, environments, and approvals. An observability skill can guide investigations using logs, metrics, and traces.</p>
<p>The agent still has a general view, but it does not need to carry every detail at the same time.</p>
<h2>Context Skills Are Not Microservices</h2>
<p>It is important to make a distinction.</p>
<p>Context Skills are not the new microservices. A skill is not a production service, does not have a business API by definition, and does not replace a runtime boundary.</p>
<p>The connection between the concepts is the idea of decomposition.</p>
<p>Microservices help separate software capabilities. Context Skills help separate knowledge and workflows for agents.</p>
<p>The same domain may have a service, documentation, dashboards, and one or more related skills. The skill knows the context and knows how to query the right sources, but the data stays in the systems responsible for it.</p>
<img src="/images/posts/context-skills-breaking-down-the-context-for-ai-agents/2f622eba-b9f9-4eec-874a-51ef1c5c0f3d.png" alt="Distributed Context: Payments" style="display:block;margin:0 auto" />

<p>The value comes from connecting these parts.</p>
<h2>A Skill Is More Than Documentation</h2>
<p>A documentation page explains a subject. A Context Skill also needs to explain how to work with that subject.</p>
<p>It can guide the agent about:</p>
<ul>
<li><p>when that context is relevant;</p>
</li>
<li><p>which sources should be checked first;</p>
</li>
<li><p>which questions need answers;</p>
</li>
<li><p>which evidence should appear in the result;</p>
</li>
<li><p>which actions are allowed;</p>
</li>
<li><p>which actions need approval;</p>
</li>
<li><p>when the investigation should stop.</p>
</li>
</ul>
<p>This creates a work contract for the context. The skill does not need to contain every detail, but it should help the agent find the right information and respect the team's limits.</p>
<p>For example, a payments skill may say that a refund investigation should check the operation contract, emitted events, and failure runbook. It may also require the agent to tell the difference between an authorized transaction and a captured transaction before forming a hypothesis.</p>
<h2>What Does a Context Skill Need to Know?</h2>
<p>A context-based skill does not need to copy all the information in the domain. It needs to know how to navigate it.</p>
<p>Some important elements are:</p>
<h3>Vocabulary</h3>
<p>Which terms have a special meaning in this domain? What is a transaction, an authorization, a capture, or a refund?</p>
<h3>Responsibilities</h3>
<p>Which service is responsible for each action? Who owns the context? Which decisions can the team make?</p>
<h3>Contracts</h3>
<p>Which APIs, events, and schemas connect this context to others? Which changes need versioning?</p>
<h3>Sources of Truth</h3>
<p>Where is the current data? Which documentation should be checked? Which platform contains the production signals?</p>
<h3>Limits</h3>
<p>Which actions are read-only? What needs approval? When should the agent stop and ask for help?</p>
<p>This set of information gives the agent depth without requiring it to carry the knowledge of the whole company.</p>
<p>These limits should be defined together with the architecture's security policies. As we saw in the article <a href="https://luizschons.com/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/">Security, Guardrails, and Fitness Functions for Agents</a>, a skill can guide the agent, but it should not be the only protection against an unsafe action. Permissions, scopes, and approvals must also be enforced by the tools and protected resources.</p>
<h2>One Agent Connects the Skills</h2>
<p>Breaking down the context does not mean creating isolated agents that cannot communicate.</p>
<p>The main agent coordinates the specializations.</p>
<p>Imagine an investigation where the payment failure rate has increased. The agent can do the following:</p>
<pre><code class="language-text">1. Activate the Payments Context Skill.
2. Use the Observability Skill to investigate the signals.
3. Use the Delivery Skill to check recent deployments.
4. Use the Data Platform Skill if the flow depends on processed data.
5. Combine the evidence into a hypothesis.
6. Show what was confirmed and what is still uncertain.
</code></pre>
<p>Each skill adds a specific view. The agent connects the information between them.</p>
<p>This separation allows a skill to be maintained by the people who really know that context. They do not need to maintain every instruction for the engineering agent.</p>
<h2>Too Much Context Can Also Be a Problem</h2>
<p>Decomposing does not mean creating hundreds of small skills.</p>
<p>There is a point where too much fragmentation starts to cause problems. If the agent needs to activate ten skills to answer a simple question, the boundaries may be wrong or the task may be split into units that are too small.</p>
<p>A good boundary usually groups knowledge that changes together, is used together, and has related ownership.</p>
<p>Another useful question is: if this context changes, who needs to review the knowledge? If the answer includes very different teams, conflicting responsibilities, or unrelated sources, the boundary may be too large.</p>
<p>Boundaries should also be observable. We need to know which context was consulted, which sources were used, and which rules guided the answer. Without this visibility, it is hard to understand whether a problem came from missing information, the choice of skill, or the agent's interpretation.</p>
<p>We can start with a few larger contexts:</p>
<pre><code class="language-text">Observability
Delivery
Data
Payments
Orders
Security
</code></pre>
<p>Over time, each context can evolve. An observability skill may later gain specializations for incidents, performance, and capacity. This split should happen when there is a real need, not just because it is possible to create more files.</p>
<h2>Where Do Context Skills Live?</h2>
<p>A Context Skill can live with the team's code, in a platform repository, or in a shared catalog. The choice depends on who maintains the context and how the agents will be used.</p>
<p>The most important points are to make clear:</p>
<ul>
<li><p>who owns the skill;</p>
</li>
<li><p>which agents can use it;</p>
</li>
<li><p>which external sources it consults;</p>
</li>
<li><p>how its instructions are versioned;</p>
</li>
<li><p>how changes are reviewed;</p>
</li>
<li><p>which permissions it needs.</p>
</li>
</ul>
<p>For example, a skill for observability may be maintained by the platform team. It can explain how to query standard dashboards and metrics, but it should not store copies of production data.</p>
<p>A payments skill may be maintained by the team responsible for the domain. It can point to ADRs, contracts, and runbooks, but it should continue to respect the original sources.</p>
<h2>Context Skills and Ownership</h2>
<p>Ownership is an essential part of this architecture.</p>
<p>If everyone is responsible for a skill, probably no one is truly responsible. If no one reviews the instructions when an API changes, the agent starts working with outdated knowledge.</p>
<p>A skill can have a simple metadata file:</p>
<pre><code class="language-yaml">name: payments-context
owner: payments-team
review_frequency: quarterly
sources:
  - payment-service
  - payment-documentation
  - payment-dashboards
</code></pre>
<p>This file does not solve the maintenance problem on its own, but it makes responsibility more visible and can help create a review process.</p>
<h2>Conclusion</h2>
<p>For a long time, our concern was decomposing systems so they could be developed and operated by different teams.</p>
<p>Now we also need to decompose the knowledge we give to agents.</p>
<p>Context Skills are a way to create boundaries for this knowledge. They allow each context to have clear vocabulary, rules, tools, ownership, and limits.</p>
<p>The agent does not need to know everything deeply. It needs to know which contexts exist, when to use them, and how to connect the evidence it finds.</p>
<p>In the next article, we will separate the parts that make this architecture work: agents, skills, tools, and MCP. The goal is to understand the role of each layer before using them in a real case.</p>
