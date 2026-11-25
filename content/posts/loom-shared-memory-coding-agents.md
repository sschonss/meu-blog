---
title: 'Teach it once: a shared memory for every coding agent on the team'
date: 2026-11-28
description: 'Every developer teaches their own AI agent how the team searches logs or deploys. An essay on putting that knowledge in one shared memory, with a small lab as proof.'
translationKey: loom-shared-memory-coding-agents
tags: ['AI', 'Architecture']
---

Think about the last time you asked your AI agent to find a log in production. You probably had to explain where the logs live, which tool to use and which filter works. Now think about the developer sitting next to you. They did the same thing last week, with their own agent, from scratch.

Every team has a few standard flows: search the logs, deploy a service, find out who is on call. Everyone does them, and everyone should do them the same way. But each developer ends up teaching the same lesson to their own agent, again and again.

This article presents a different way to think about that knowledge: put it in **one memory shared by every agent on the team**, whatever editor or AI provider each person uses. Then it shows a small lab that tested the idea with two editors.

## Before we start: three words

- **Coding agent:** the AI assistant inside the editor, like the ones in Cursor, OpenCode or Claude Code. You ask in plain language and it reads code, runs tools and answers.
- **MCP (Model Context Protocol):** a standard way to plug external tools into an agent. If a tool speaks MCP, any editor that speaks MCP can use it.
- **Shared memory:** a place outside the editor where agents save and look up what they learned. In this article, the memory is [Loom](https://loom.clickhouse.com/), a memory server for agents.

## The problem: every agent learns alone

Team knowledge rarely lives in a shared place. It lives in someone's head, in a personal notebook, or in the chat history on one developer's machine.

Coding agents made this worse in a quiet way. When a developer explains to their agent how the team searches logs, that explanation stays in that chat, in that editor. The agent in the next editor knows nothing about it. So the next developer explains it again. And when someone switches AI provider, they start over too.

![Diagram: on the left, today, three developers each teach their own agent (Cursor, OpenCode, Claude Code) and each agent keeps its own notes on how to search logs. On the right, the three agents read and write one shared memory with the team flows.](/images/posts/loom-shared-memory-coding-agents/problem-en.svg)

An analogy helps. Picture a restaurant kitchen where every cook keeps the recipes in their own head. Each new cook has to ask around, and each one learns a slightly different version of the same dish. The fix is not to train every cook separately. The fix is a recipe book that stays in the kitchen, where the cooks already are.

The new developer feels this the most. They start from zero, and so does their agent.

## The idea: one memory for every agent

What if the team's standard flows lived in one memory that every agent can read and write?

It works like this, step by step:

1. Someone figures out how to do a task the team's way.
2. Their agent writes it to the shared memory, once.
3. Later, another developer asks their own agent about the same task, in any editor.
4. That agent looks in the shared memory first, and follows what is there.

The knowledge belongs to the team, not to one machine or one vendor. Switching from one AI provider to another does not mean teaching everything again, because the memory stays where it is.

## What goes in the memory: facts and paths

Not everything should be copied into the memory. Entries come in two kinds, and each one needs a different treatment.

A **fact** changes rarely. "The deploy window is Monday to Friday, 8am to 2pm." It is fine to write the fact itself into the memory.

A **path** is for when the answer lives somewhere else. The memory does not copy the answer. It stores how to get there. And "somewhere else" can be two different places:

- **A tool**, for live values. "Who is on call today?" If you write the name into the memory, it is wrong tomorrow. So the memory stores which tool to call, and the agent gets the current value from the system that owns it.
- **A document**, for long or complex procedures. "How do I test a credit card transaction in QA?" That takes several steps, test cards and some setup. It belongs in the documentation. The memory stores the question and, as the answer, the link to the right doc page.

Think of the note on the office fridge. Nobody writes "today the on-call person is X" on it, because it would be wrong by morning. Nobody copies the whole equipment manual onto it either. The note says "check the roster on the board" or "the manual is in the second drawer". The note is the path. The board and the manual have the content.

## Documentation and memory, together

If the team already has documentation, why add a memory? Because they do different jobs, and they work better together. What follows is reasoning, not something the lab measured.

**Documentation is the place for complex things.** Long procedures, context, decisions, diagrams. Testing a credit card transaction in QA is a good example: it needs explanation, and a three-line answer would not do it justice.

**The shared memory is the place for short, operational, day-to-day answers.** How to find the log of a transaction in QA. How to find the log of a transaction in production. Things a developer needs in the middle of a task, in a few lines.

And the two connect. When someone asks their agent how to test a card transaction in QA, the memory does not hold the whole procedure. It holds the link. The agent answers with the right doc page, at the moment of need, and the documentation gets read exactly when it is useful.

![Diagram: an agent asks the shared memory. For an operational question, like how to find the log of a transaction in QA or production, the memory answers directly. For a complex question, like how to test a credit card transaction in QA, the memory returns the link to the documentation, which holds the full procedure.](/images/posts/loom-shared-memory-coding-agents/together-en.svg)

| | Documentation | Shared memory |
| --- | --- | --- |
| Best for | Complex, long procedures | Short, operational answers |
| Example | How to test a credit card transaction in QA | How to find the log of a transaction in production |
| Who reads it | People, from start to finish | The agent, in the middle of a task |
| How they connect | Holds the full content | Answers directly, or points to the right doc page |

### Keeping it up to date is cheap

Any shared knowledge goes out of date at some point. What matters is how much it costs to fix.

With the shared memory, fixing is part of the work:

1. A developer gets an answer from their agent, and the answer is wrong.
2. They find out the right way, as they would anyway.
3. They correct the entry, once.
4. From that moment, every agent on the team gets the corrected answer.

Nobody has to schedule time to update a page, and nobody keeps teaching their own agent the old way. The team corrects the memory while using it. A doc page gets fixed too, but it usually waits until someone sets time aside for it.

Two things still need care. Someone should keep an eye on what goes in, so the memory does not fill up with noise. And in a team, not everyone should be able to rewrite everything, which is a matter of access control.

## The lab: testing the idea

To check that the mechanism works, a small lab connected two editors, [Cursor](https://cursor.com/) and [OpenCode](https://opencode.ai/), to the same Loom memory. Both connect to it through MCP. Everything ran on one machine.

The goal was not to build a product. It was to answer one question: **does something written from one editor really show up in the other?**

The full write-up, with the real screenshots of each chat, is in the repository: [sschonss/loom-lab](https://github.com/sschonss/loom-lab/blob/main/docs/how-it-works.md). The diagrams below show what happened, in a simpler form.

### Test 1: a fact written in one editor, read in the other

In Cursor, the user said the deploy window is now Monday to Friday, 8am to 2pm. Cursor saved that fact in Loom.

Then, in OpenCode, the user asked what the deploy window is. OpenCode searched Loom and answered with the same text, and it said where the answer came from.

![Diagram of the first test: in Cursor, the user states the deploy window and Cursor writes it to the shared memory. In OpenCode, the user asks what the deploy window is, OpenCode reads the memory and answers with the same text.](/images/posts/loom-shared-memory-coding-agents/fact-en.svg)

One detail matters: OpenCode was opened in an unrelated folder, not in the lab project. It still found the answer. The memory is not tied to a project or to an editor.

### Test 2: the memory stores the path, not the value

In OpenCode, the user asked it to note how to find out who is on call. OpenCode saved only the procedure: do not guess the name, ask the on-call service and answer with what it returns. No name went into the memory.

Then, in Cursor, the user asked who is on call today. Cursor read the memory, saw that the roster is not there, followed the procedure and asked the service. The name in the answer came from the service.

![Diagram of the second test: OpenCode writes to the shared memory only the procedure, ask the on-call service. In Cursor, the user asks who is on call. Cursor reads the procedure from memory, calls the on-call service through a small connector, and the service returns the name of the person on call today.](/images/posts/loom-shared-memory-coding-agents/path-en.svg)

The on-call service in the lab is a mock made with [Mockoon](https://mockoon.com/), a tool that serves fake APIs. It stands in for a real on-call system. Between the editor and the service there is a small connector that only fetches the current value. It stores nothing.

At the end, Loom's memory page showed the two records, and which editor wrote each one: the deploy window from Cursor, the on-call procedure from OpenCode.

## Where it can go

The lab questions are trivial on purpose, so the mechanism is easy to see. They are the proof, not the destination.

The same shape fits the questions a team really asks. **None of the following is built.** It is where the idea points:

| Question | What the memory stores | Where the answer comes from |
| --- | --- | --- |
| How do I find the log of a transaction in QA or production? | Where to look, which query, which tool | The log system returns the line |
| How do I test a credit card transaction in QA? | The link to the right doc page | The documentation |
| What is our deploy process? | The steps and what to check before moving on | The memory, plus a tool when a step needs one |
| I am deploying this service. What do I watch? | Which dashboards matter, and in which order | The dashboard shows the number |

In every row, the agent the person already uses follows the path. No new bot per subject. No lock-in to one vendor.

## One limit

The lab ran in a local, single-user mode, with no accounts. Anyone who could reach the memory could read and write everything. That is fine for a test on one machine, and nothing more. A real team needs accounts and access per person, which Loom documents in [Tokens and grants](https://loom.clickhouse.com/docs/guides/tokens-and-grants).

## How to tell if your team would benefit

A few questions to ask, as a starting point:

- Does more than one person on the team explain the same flow to their own agent?
- When a new developer needs to search logs or deploy, do they have to find a specific person?
- Does the team have good documentation that is hard to find in the middle of a task?
- Does the team use more than one editor or AI provider?

If most answers are "yes", the idea is worth a test. Start small: a few operational answers, and a few links to the docs you already have.

## Conclusion

The point is not Loom, or any one editor. It is a different place for team knowledge: written once, by whoever learned it, where every agent already looks. It does not replace the documentation. It brings the documentation closer to the moment someone needs it. The lab showed that the mechanism works between two editors. Making it work for a whole team is the next step, with access control and someone looking after what goes in.

If you want to see how the lab was put together, and the real screenshots, it is all in [sschonss/loom-lab](https://github.com/sschonss/loom-lab).

## Glossary

- **Coding agent:** the AI assistant inside an editor that reads code, runs tools and answers.
- **MCP:** Model Context Protocol, a standard way to plug external tools into an agent.
- **Shared memory:** a place outside the editor where every agent on the team saves and looks up knowledge.
- **Fact:** knowledge that changes rarely and can be stored as text.
- **Path:** instructions for reaching an answer that lives somewhere else: which tool to call, or which doc page to open.
- **Mock:** a fake service that answers like the real one, used for tests.
- **Curation:** keeping an eye on what goes into the memory and removing what is outdated.

## Sources

- [Loom](https://loom.clickhouse.com/)
- [Loom: connect a coding agent](https://loom.clickhouse.com/docs/getting-started/connect-a-coding-agent)
- [Loom: tokens and grants](https://loom.clickhouse.com/docs/guides/tokens-and-grants)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Mockoon](https://mockoon.com/)
- [The lab: sschonss/loom-lab](https://github.com/sschonss/loom-lab)
