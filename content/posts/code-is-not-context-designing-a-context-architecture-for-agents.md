---
title: 'Code Is Not Context: Designing a Context Architecture for Agents'
date: 2026-08-21
source: https://luizschons.com/code-is-not-context-designing-a-context-architecture-for-agents
series: ['AI-Friendly Architecture']
draft: false
---

<p>This is the second article in a series about AI-friendly architecture. In the first article, I explained how AI is like a new person joining a company and trying to understand a system for the first time.</p>
<p>Now I want to explore an important part of this comparison: where does this person find the information they need?</p>
<h2>Code Is Only Part of the Story</h2>
<p>When someone new joins a team, they usually start with the repository. That is where the services, endpoints, models, tests, and business rules are.</p>
<p>But code rarely answers everything.</p>
<p>It may show that a decision exists, but not explain why it was made. It may show that two services communicate, but not make it clear which service owns that responsibility. It may show a business rule, but not explain when it applies or what happens when it changes.</p>
<p>To truly understand a system, a person needs to combine several sources:</p>
<ul>
<li><p>code;</p>
</li>
<li><p>documentation;</p>
</li>
<li><p>architectural decisions;</p>
</li>
<li><p>tickets and epics;</p>
</li>
<li><p>previous incidents;</p>
</li>
<li><p>dashboards and metrics;</p>
</li>
<li><p>conversations with team members.</p>
</li>
</ul>
<p>The same is true for AI agents.</p>
<p>The problem is that, in many companies, this information exists but is not connected. The code is in a repository. The decisions are in a documentation tool. The tickets are in another system. The incidents are in an operations platform. And the most important context is still in the minds of a few people.</p>
<p>Having information is not the same as having context.</p>
<h2>What Is a Context Architecture?</h2>
<p>I like to think of Context Architecture as a way to organize and connect the different sources of knowledge that explain a system.</p>
<p>It is not about creating one huge document with everything the company knows. It is also not about copying all the documentation into a vector database and waiting for the answer to appear.</p>
<p>It is about creating paths that help a person or an agent answer questions such as:</p>
<ul>
<li><p>What is this service responsible for?</p>
</li>
<li><p>Which other systems depend on it?</p>
</li>
<li><p>Why was it built this way?</p>
</li>
<li><p>Which business rule is being used here?</p>
</li>
<li><p>How do we know that it is working correctly?</p>
</li>
<li><p>What happened the last time this part changed?</p>
</li>
</ul>
<p>A well-designed context architecture does not remove the need for reasoning. It reduces the effort needed to find the right information.</p>
<h2>Context Does Not Need to Be in One Place</h2>
<p>We may want to put everything in one place. We could create a big page called “How the Company Works” and expect everyone to find what they need there.</p>
<p>In practice, this document becomes outdated very quickly. It becomes hard to know what is still valid, who should update it, and which part applies to each situation.</p>
<p>Maybe it is better to think of context as a network:</p>
<img src="/meu-blog/images/posts/code-is-not-context-designing-a-context-architecture-for-agents/9fb6215a-d1db-49a0-bd1b-59c5db990aab.png" alt="Context Architecture" style="display:block;margin:0 auto" />

<p>Each source can stay where it works best. What changes is that there are clear links between them.</p>
<p>A task should point to the affected domain. The domain should point to the services involved. The service should have its operational documentation. Important decisions should be recorded. Production signals should also be easy to find.</p>
<p>The goal is not to centralize knowledge. The goal is to make it easy to find.</p>
<h2>Example Structure</h2>
<p>Let’s imagine a payments domain. The code may be in a repository, while the documentation, ADRs, and runbooks stay in the tools the team already uses:</p>
<img src="/meu-blog/images/posts/code-is-not-context-designing-a-context-architecture-for-agents/2b3eab9e-984a-4bb7-94c2-3ade8f135b7f.png" alt="Distributed context: payments" style="display:block;margin:0 auto" />

<p>The repository’s <code>README.md</code> can explain the service’s responsibility and link to the <code>Architecture Hub</code>. The <code>context.md</code> page can describe business concepts and domain boundaries. ADRs can stay in an architecture tool, runbooks can stay in a documentation platform, and dashboards can stay in the observability tool.</p>
<p>The <code>links.md</code> file does not need to copy the content from these sources. It can work as a trusted index, with links to where each piece of information is stored.</p>
<p>An agent that receives a payments task does not need to read every file in the repository right away. It can start with the domain map, follow the links related to the task, and check each source at the right time.</p>
<p>The most important part of this structure is not putting everything in the same folder. It is making clear where each type of knowledge lives and how to reach it.</p>
<h2>Context Needs an Owner</h2>
<p>Documentation without an owner usually becomes abandoned documentation.</p>
<p>If no one knows who should update a page, the page will become outdated. If an architectural decision does not say who made it and why, it may later look like a rule with no reason.</p>
<p>That is why a Context Architecture also needs to answer:</p>
<ul>
<li><p>Who is responsible for this context?</p>
</li>
<li><p>When was it last updated?</p>
</li>
<li><p>Which system is the original source of this information?</p>
</li>
<li><p>How do we know that it is still valid?</p>
</li>
</ul>
<p>People and AI agents both need this. An agent may find a useful page, but it still needs to check if the information is up to date, belongs to the right system, and is useful for making a decision.</p>
<p>Context without a clear validity signal can be as dangerous as having no context at all.</p>
<h2>The Role of Architectural Decisions</h2>
<p>One of the most valuable sources of information about a system is the history of its decisions.</p>
<p>The current code shows the result of many choices. An ADR helps explain those choices.</p>
<p>It can record:</p>
<ul>
<li><p>the problem that needed to be solved;</p>
</li>
<li><p>the options that were considered;</p>
</li>
<li><p>the criteria used to make the decision;</p>
</li>
<li><p>the trade-offs that were accepted;</p>
</li>
<li><p>the expected results.</p>
</li>
</ul>
<p>Without this history, someone may look at an implementation and think that it could be much simpler. Maybe it could. But there may have been a constraint that is no longer visible in the code.</p>
<p>For an agent, this difference is very important. Without the context behind a decision, it may suggest a technically elegant change that does not fit a real business need or a known operational limit.</p>
<h2>Context Should Follow the Workflow</h2>
<p>Another important point is that context should not be treated as a separate activity from development.</p>
<p>If documentation is updated only during one big review each year, it will fall behind. If ADRs are written only when someone remembers to write them, many important decisions will disappear. If incidents do not leave written lessons, the team will investigate the same problems again and again.</p>
<p>Context needs to be part of the normal workflow:</p>
<ol>
<li><p>A change starts with a task or an epic.</p>
</li>
<li><p>The team identifies the affected domains and services.</p>
</li>
<li><p>The important decisions are recorded.</p>
</li>
<li><p>The documentation is updated together with the code.</p>
</li>
<li><p>Observability shows what happens after the deployment.</p>
</li>
<li><p>Incidents and lessons learned are added to the knowledge base.</p>
</li>
</ol>
<p>This does not need to be a heavy process. The important thing is to create and maintain these links close to the moment when the knowledge is created.</p>
<h2>What Should a New Person Be Able to Do?</h2>
<p>A good way to test this architecture is to choose a real task and imagine a new person trying to complete it.</p>
<p>Would this person be able to find out:</p>
<ul>
<li><p>which part of the system needs to change;</p>
</li>
<li><p>who owns the domain;</p>
</li>
<li><p>which decisions limit the solution;</p>
</li>
<li><p>how to check that the change worked;</p>
</li>
<li><p>where to investigate if something goes wrong?</p>
</li>
</ul>
<p>If the answer to all these questions is “you need to talk to someone,” there is an opportunity to improve the system’s context.</p>
<p>The same test can be used with an AI agent. The difference is that an agent will make it even clearer when important information depends on informal knowledge.</p>
<p>A simple way to measure this is to choose a small task and watch the steps needed to solve it. If someone needs to open several unrelated systems or ask another person before every decision, the problem is not only documentation. It is a context architecture problem.</p>
<h2>Context Architecture Is Not Bureaucracy</h2>
<p>It is possible to turn this topic into another set of required processes. I do not think that is the goal.</p>
<p>The goal is not to write documentation just for the sake of writing it. The goal is to reduce the time people spend looking for answers and reduce their dependence on the people who were present when a decision was made.</p>
<p>A well-maintained context architecture helps with onboarding, incident investigation, feature planning, and system maintenance. AI agents simply make this need easier to see.</p>
<p>In the end, this is an old practice facing a new challenge: making system knowledge more explicit so that it does not stay in the memory of only a few people.</p>
<h2>Conclusion</h2>
<p>Code explains how the system works at a specific point in time. Context helps explain why it works that way, what limits exist, and how it connects to the rest of the organization.</p>
<p>A Context Architecture does not need to put everything in one place. It needs to connect the right sources, make clear who owns each context, and make information easy to find.</p>
<p>When we do this, the system becomes easier to understand for people joining the team, for people investigating a problem, and for the agents working with us.</p>
<p>In the next article, I will talk about observability as a source of context. Logs, metrics, and traces are not only used to find errors. They also help explain how the system really behaves.</p>
