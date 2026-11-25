---
title: 'One memory, any editor: sharing team knowledge across coding agents with Loom'
date: 2026-11-28
description: 'A lab with Loom, Cursor and OpenCode: one shared memory over MCP, where a fact written in one editor is read in another, and live values come from the system that owns them.'
translationKey: loom-shared-memory-coding-agents
tags: ['AI', 'Architecture']
---

Most teams are not building an AI product. People already use a coding agent for everyday work. Some prefer [Cursor](https://cursor.com/), some [OpenCode](https://opencode.ai/), some [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview). That part is settled.

The problem is what happens to what they learn. Someone figures out the deploy window, or who is on call, or where a log lives. That answer stays in one person's chat. The next person asks again, in a different editor, and starts from zero.

The usual fix is a specialist bot per topic. A deploy bot, an on-call bot, a logs bot. That is more things to build and maintain, and it ties the knowledge to whoever hosts the bot.

The idea tested here is simpler. One shared memory. Whoever figures something out writes it. Whoever asks later, in another editor, gets the same answer. Switching providers does not switch the knowledge.

A small lab tested this on 24 Nov 2026, on one machine, with two editors: Cursor and OpenCode. The code and the notes are in [sschonss/loom-lab](https://github.com/sschonss/loom-lab).

## The setup in one paragraph

[Loom](https://loom.clickhouse.com/) is a memory server for agents. In the lab, Loom 1.3.0 ran locally at `http://127.0.0.1:7777`, in single-user mode, namespace `local`, with no login. Both editors talk to it over [MCP](https://modelcontextprotocol.io/) (Model Context Protocol, the standard way an editor plugs in external tools) at `http://127.0.0.1:7777/mcp?toolset=coding`. Cursor has that URL in `~/.cursor/mcp.json`. OpenCode has it in `~/.config/opencode/opencode.json`. Both files are global to the user, not to a project. The [connection guide](https://loom.clickhouse.com/docs/getting-started/connect-a-coding-agent) covers each editor.

There are two ways to answer a question, and the lab tested both:

1. **A stable fact lives in the memory.** The text itself is the answer.
2. **A live value does not get copied into memory.** The memory stores only the path to it. The value comes from the system that owns it.

## Test 1: a fact, two editors

The chats in the lab were in Portuguese. The screenshots below were translated to English in place. Keys, tool names, editor names and returned values were left exactly as they were.

In Cursor, the user said the deploy window is now Monday to Friday, 8am to 2pm. Cursor looked for an existing record, found none, and saved the fact under the key `work/decision/deploy-window`.

![Cursor chat: the user says the deploy window is now Monday to Friday from 8am to 2pm, and Cursor answers that it saved the fact at work/decision/deploy-window, with no previous record](/images/posts/loom-shared-memory-coding-agents/01-cursor-saves-deploy-window-en.webp)
*Cursor saves the deploy window under `work/decision/deploy-window` (translated from Portuguese).*

Then, in OpenCode, the user asked what the deploy window is. OpenCode called `loom_context_pack` and then `loom_search`. It returned the same text, plus the memory key it came from.

![OpenCode calls loom_loom_context_pack and loom_loom_search, then answers that the deploy window is Monday to Friday, from 8am to 2pm, citing work/decision/deploy-window](/images/posts/loom-shared-memory-coding-agents/02-opencode-reads-deploy-window-en.webp)
*OpenCode finds the same fact and cites the key `work/decision/deploy-window` (translated from Portuguese).*

One detail matters here. OpenCode was opened in a random folder, not in the lab repository. It still read the memory. The Loom connection lives in the user's global OpenCode config, so the open folder did not matter.

## Test 2: the memory points at another service

Who is on call changes every day. Copying the name into memory would make the memory wrong by tomorrow. So the memory stores the procedure, not the value.

In OpenCode, the user asked it to note the on-call procedure. OpenCode saved `work/procedure/plantonista-de-hoje` ("plantonista de hoje" is Portuguese for "today's on-call person"). The procedure says: do not guess the name, call the tool `plantonista_de_hoje` on the `plantao` MCP server, and return exactly what it returns. No person's name went into the memory.

![OpenCode confirms it noted work/procedure/plantonista-de-hoje in Loom: do not guess the name, call the plantonista_de_hoje tool on the plantao MCP server and answer with what it returns](/images/posts/loom-shared-memory-coding-agents/03-opencode-saves-oncall-procedure-en.webp)
*OpenCode saves the procedure under `work/procedure/plantonista-de-hoje`, with no name in it (translated from Portuguese).*

Then, in Cursor, the user asked "who is on call today?". Cursor read Loom, saw that the roster is not in memory, and went to the service. The answer was Luiz Schons, channel `#plantao`, until 25/11/2026 at 09:00 (America/Sao_Paulo). That is exactly what the mock service returned.

![Cursor chat: asked who is on call today, Cursor says the roster is not in memory, notes the on-call server has not finished loading, and answers Luiz Schons, channel #plantao, until 25/11/2026 at 09:00](/images/posts/loom-shared-memory-coding-agents/04-cursor-reads-oncall-en.webp)
*Cursor follows the stored path and answers with the value from the service (translated from Portuguese).*

To be honest about this run: in that Cursor chat, the `plantao` MCP server had not finished loading yet. The screenshot shows Cursor saying so. The editor invoked the same server process directly instead, and the value still matched the mock. In a chat opened after a reload, the call shows up as the tool `plantonista_de_hoje`, as expected.

## What ended up in Loom

After both tests, the memory held two records, one written from each editor:

| Key | What it stores | Written from |
| --- | --- | --- |
| `work/decision/deploy-window` | The deploy window is Monday to Friday, 8am to 2pm. | Cursor |
| `work/procedure/plantonista-de-hoje` | Do not guess the name. Call `plantonista_de_hoje` on the `plantao` MCP and return exactly what it returns. | OpenCode |

The stored values are in Portuguese, as typed in the chats; the screenshot below shows them translated. The Memories page labels each record with the client that wrote it: `opencode` and `cursor-vscode`.

![Loom Memories page on Nov 24 with two records: work/procedure/plantonista-de-hoje written by opencode and work/decision/deploy-window written by cursor-vscode](/images/posts/loom-shared-memory-coding-agents/05-loom-memories-dashboard-en.webp)
*The Loom Memories page on 24 November 2026 (translated from Portuguese).*

## The pieces

**Loom** stores the fact and the procedure. Its dashboard runs at `http://127.0.0.1:7777/`, on the Memories page, namespace `local`, shown above.

**[Mockoon](https://mockoon.com/)** plays the outside system. It is a tool that serves fake HTTP APIs. In the lab it answers `GET /plantonista` on port 3010, at `http://127.0.0.1:3010/plantonista`. The response body lives in `mockoon/plantao.json`. Changing who is on call means editing that file and recreating the container. In a real team, this would be the actual on-call system.

**The thin MCP**, `plantao/server.py`, is the door between the editor and that service. It exposes one tool, `plantonista_de_hoje`. The tool makes a GET to `/plantonista` and returns the JSON. Nothing else. It holds no data and no logic about who is on call.

```text
Cursor or OpenCode
        |
        |  MCP
        v
      Loom                         Mockoon :3010
 team memory                       GET /plantonista
 "call tool X"  --------------->   { "nome": "Luiz Schons", ... }
```

In Cursor, a project rule tells the agent to search Loom before answering. OpenCode uses the same Loom URL in its own config.

Only Cursor and OpenCode were tested. Claude Code would join the same way, by pointing its MCP config at the same Loom. The lab did not test it.

## Where the same mechanism goes

The on-call question is trivial on purpose. It makes the mechanism visible. The trivial questions are the proof, not the destination.

The same shape fits real team questions. **None of the following is implemented. This is the possibility, not something the lab built.**

| Question | What lives in Loom | Where the answer comes from |
| --- | --- | --- |
| What is the deploy window? *(tested)* | The fact, as text. | The memory itself. |
| Who is on call? *(tested)* | The procedure: call `plantonista_de_hoje`. | Mockoon, through the `plantao` MCP. |
| How do I find a specific production log? *(not built)* | Where to look, which query, which tool. | The log system returns the line. |
| What is our deploy process? *(not built)* | The steps and what to check before moving on. | The memory, plus a tool when a step depends on a system. |
| I am deploying this service. What do I look at? *(not built)* | The dashboards, the order, and what each one shows. | The memory points at the dashboard. The dashboard shows the number. |

In these cases the memory is not loose text. It is a path: which tool to call, what to check, which dashboard to open. The agent the person already uses follows that path. No new bot per subject. No lock-in to one vendor.

## What this local mode does not do

There is no team separation. Anyone who can reach port 7777 can read and write the memory. That is fine for two editors on one machine, and nothing more.

A team on separate machines needs accounts, a namespace, and a token per person. Loom documents that in [Tokens and grants](https://loom.clickhouse.com/docs/guides/tokens-and-grants). The lab did not set that up.
