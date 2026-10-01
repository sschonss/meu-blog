---
title: 'Is your software ready to be understood by an AI?'
date: 2026-08-20
source: https://luizschons.com/seu-software-est-pronto-para-ser-entendido-por-uma-ia
series: ['AI-Friendly Architecture']
draft: false
---

<p>This is the first article in a series about AI-friendly architecture, a way of thinking about systems, context, and tools so that AI agents can work more effectively with real-world software.</p>
<p>Maybe the best way to think about an AI working in your system is to imagine a new person entering the company.</p>
<p>They don’t know the domain yet, they don’t know which services exist, they don’t understand past decisions, and they don’t know where to find the answers. To start contributing, they need to go a onboarding process.</p>
<p>This person may try to figure things out. They may also ask someone more experienced. But when knowledge is well documented, they can find the answers on their own and move forward with greater autonomy.</p>
<p>Something similar happens with AI agents. The more an agent depends on a specific person, informal context, or the memory of someone who already knows how to perform a task, the worse it performs.</p>
<p>The goal of an AI-friendly architecture is to make this knowledge more explicit, accessible, and easier to navigate. Not only for AI, but also for anyone new joining the team.</p>
<p>Over the past few years, the way we build software has changed considerably. First, we learned how to scale systems. Then, we learned how to modularize code. Later, we started separating responsibilities, distributing services, and organizing teams around context. Now we are entering a new phase: creating software that is not only used by people, but can also be understood by AI agents.</p>
<p>This may seem subtle at first, but it changes quite a lot. An agent does not understand your system in the same way an experienced developer does. It needs signals, context, structure, and paths for discovery. If that context is not well organized, AI can still help, but it will work with more noise, more trial and error, and less precision.</p>
<h2>The problem is not a lack of intelligence</h2>
<p>When an AI makes a mistake while analyzing a system, the most common explanation is usually: “the model is not good enough.” Sometimes that is true. But many failures happen for another reason: the system was designed for people who already know the context, not for agents that need to discover it.</p>
<p>An in-house developer knows:</p>
<ul>
<li><p>where the relevant documentation is;</p>
</li>
<li><p>which decisions were recorded in old ADRs;</p>
</li>
<li><p>which service owns each responsibility;</p>
</li>
<li><p>where to look in the event of an incident;</p>
</li>
<li><p>which metrics indicate that something is actually wrong.</p>
</li>
</ul>
<p>By default, an agent does not know any of this. It can figure out some things on its own, but it still needs clear context. When context is scattered, hidden, or inconsistent, the quality of the response declines as well.</p>
<h2>Code Is Not Enough Context</h2>
<p>There is a common trap: assuming that because AI can read code, it already understands the system.</p>
<p>But code is only part of the story.</p>
<p>Code shows the implementation. It does not necessarily show:</p>
<ul>
<li><p>why that decision was made;</p>
</li>
<li><p>which business problem it solves;</p>
</li>
<li><p>which trade-offs were accepted;</p>
</li>
<li><p>which parts are sensitive;</p>
</li>
<li><p>what has already been tried and discarded;</p>
</li>
<li><p>how the system behaves in production.</p>
</li>
</ul>
<p>In practice, a mature system exists in more places than the repository. It lives in documentation, observability, incidents, tickets, architectural decisions, dashboards, and the team’s collective memory. The challenge now is to transform this knowledge into something an AI can navigate.</p>
<h2><strong>Architecture That Agents Can Understand</strong></h2>
<p>If I had to summarize the central idea of this article in one sentence, it would be this:</p>
<blockquote>
<p>AI-friendly architecture is the discipline of organizing systems so that agents can discover, correlate, and apply context with minimal friction.</p>
</blockquote>
<p>This does not mean exposing everything to AI. On the contrary, it means making context:</p>
<ul>
<li><p>more accessible;</p>
</li>
<li><p>more structured;</p>
</li>
<li><p>more reliable;</p>
</li>
<li><p>more connected;</p>
</li>
<li><p>more verifiable.</p>
</li>
</ul>
<p>In other words, having information is not enough. Information needs to be discoverable and combinable.</p>
<h3>What This Changes in Practice</h3>
<p>An AI-friendly system tends to have a few characteristics:</p>
<ol>
<li><p>**Living documentation<br />**Documentation cannot be a graveyard of outdated pages. It needs to be part of the system and keep up with relevant changes.</p>
</li>
<li><p><strong>Recorded decisions</strong><br />Architecture without history becomes guesswork. ADRs, RFCs, and decision notes help the agent understand the “why,” not just the “how.”</p>
</li>
<li><p><strong>Observability as a source of truth</strong><br />Logs, traces, and metrics are not only used to operate the system. They also help explain its behavior.</p>
</li>
<li><p><strong>Context organized by domain</strong><br />Not all knowledge needs to live in the same place. Each context can have its own documentation, rules, and reference points.</p>
</li>
<li><p><strong>Tools connected to the workflow</strong><br />The agent needs access to systems that actually tell the story of the software: observability tools, backlogs, repositories, incidents, and deployments.</p>
</li>
</ol>
<h2>The Old Way of Organizing Software</h2>
<p>This conversation reminds me a lot of the evolution of microservices.</p>
<p>In the past, we tried to put everything into large and centralized systems. Over time, we learned that it made more sense to separate things by domain, responsibility, and context. Not because splitting things up is elegant, but because smaller systems with clear boundaries are easier to understand and evolve.</p>
<p>Now the question is similar:</p>
<blockquote>
<p>If we have learned to decompose systems by context, why do we continue delivering context to AI in massive blocks?</p>
</blockquote>
<p>Maybe the next evolution is this: not only decomposing services, but also decomposing the knowledge that powers agents.</p>
<h2>The Role of Skills</h2>
<p>This is where an important piece comes in: skills.</p>
<p>A skill is a way of packaging specialized context. Instead of giving the agent an ocean of generic information, you provide clear, well-bounded blocks of knowledge.</p>
<p>Think of examples such as:</p>
<ul>
<li><p>a skill for Datadog;</p>
</li>
<li><p>a skill for Argo;</p>
</li>
<li><p>a skill for Databricks;</p>
</li>
<li><p>a skill for New Relic;</p>
</li>
<li><p>a skill for incident investigation;</p>
</li>
<li><p>a skill for performance analysis;</p>
</li>
<li><p>a skill for production changes.</p>
</li>
</ul>
<p>The idea is not to make the agent know everything at the same time. It is to allow it to activate the right context at the right time.</p>
<p>This reduces noise and increases precision. Instead of trying to read everithing the agent works with context that is more specific and focused on the problem.</p>
<h2>A Simple Example</h2>
<p>Imagine that an incident has started affecting an API’s latency. Without an AI-friendly architecture, the agent may still try to help, but it will depend heavily on luck:</p>
<ul>
<li><p>looking for logs in the wrong places;</p>
</li>
<li><p>interpreting dashboards without knowing which metrics matter;</p>
</li>
<li><p>wasting time on irrelevant paths;</p>
</li>
<li><p>suggesting generic hypotheses.</p>
</li>
</ul>
<p>With better-organized context, the workflow changes:</p>
<ol>
<li><p>The agent identifies the affected service.</p>
</li>
<li><p>It consults the domain documentation.</p>
</li>
<li><p>It correlates observability signals.</p>
</li>
<li><p>It finds the related architectural decisions.</p>
</li>
<li><p>It focuses the investigation on the most likely hypotheses.</p>
</li>
</ol>
<p>The benefit here is not that AI performs magic. It is that the system is prepared for AI to work with less friction and greater precision.</p>
<h2>What Is Worth Starting Now</h2>
<p>If you want to get started in a practical way, I would suggest four areas of focus:</p>
<ul>
<li><p>review the system’s most important documentation;</p>
</li>
<li><p>record architectural decisions more consistently;</p>
</li>
<li><p>improve operational clarity through observability;</p>
</li>
<li><p>separate contexts that are currently too mixed together.</p>
</li>
</ul>
<p>You do not need to transform everything at once. In fact, the best approach may be to start with the areas where the team struggles most: incidents, onboarding, and changes in critical areas.</p>
<h2>Conclusion</h2>
<p>Software that is ready to be understood by AI is not software “built for robots.” It is software with context that is clearer, more accessible, and more useful to anyone or anything that needs to understand the system quickly.</p>
<p>At its core, the idea is simple: if architecture helps people make better decisions, it can also help agents make better decisions.</p>
<p>And maybe this is the next major evolution of software architecture: not just systems that scale, but systems that can be quickly understood by humans and agents working together.</p>
<p>This was only the beginning. In the next article, I will discuss why code is not enough context and how to design a Context Architecture for agents by connecting code, documentation, architectural decisions, and business knowledge.</p>
