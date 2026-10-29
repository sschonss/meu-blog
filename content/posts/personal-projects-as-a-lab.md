---
title: 'Working is not studying: where learning went in the AI era'
date: 2026-11-02
description: 'Delivering at work and learning are different things, and AI made that clearer. A reflection on how studying changed and why personal projects became its place.'
translationKey: personal-projects-as-a-lab
tags: ['Career', 'AI']
series: ['Studying out of curiosity']
series_weight: 1
draft: false
---

A question I started asking myself: when was the last time I **studied** programming? I don't mean closing a hard ticket, or shipping a feature with a new technology. I mean stopping to understand something until I could explain it to someone else.

For a long time, I thought those two were the same thing. I programmed all day, so I was learning all day, right? Today I don't think so. And I think AI just made obvious something that was already true.

This isn't a tutorial and there's no architecture pattern in it. It's a provocation: **working with programming is one thing, studying programming is another**, and the way we do the second one has changed.

## Delivering is not learning

At work, the goal is to deliver value safely. There are deadlines, a team, customers, and the standard the company already uses. It makes total sense to pick the known technology, the lowest-risk path and the solution that worked last time. Nobody should turn the sprint into an experiment just because they want to learn something new.

The catch is that, in this mode, learning is a **side effect**. It happens when there's room for it, and it's not what's being measured. The question at the daily is "is it done?", not "did you understand it?". And you can finish a lot without understanding much, especially when the code already exists and you only need to fit one more piece.

For many years, that side effect was big enough that nobody noticed. To deliver, you had to struggle: read the docs, try three Stack Overflow answers, put a `print` everywhere until you found the problem. It was slow and frustrating, but the friction taught you. You left the ticket knowing a bit more, whether you wanted to or not.

## What AI changed

Today an AI agent (an assistant that reads code, writes it, runs commands and fixes what went wrong) removes a good part of that friction. And at work, that's great: what used to take an afternoon is done in minutes, with review and guardrails (the rules and checks that keep the agent on track). I wrote a [whole series](/series/ai-friendly-architecture/) about preparing systems for that, and I still think it's the way to go.

But the friction that went away was exactly the part that taught. Delivery still happens; the learning that used to come along for the ride, not necessarily.

This isn't just a feeling. In January 2026, Anthropic published a [controlled experiment](https://www.anthropic.com/research/AI-assistance-coding-skills) with 52 developers, most of them early in their careers, learning a Python library they didn't know. Those who used an AI assistant finished a little faster, but the difference wasn't statistically significant. On the quiz about the concepts they had just used, though, the AI group averaged 50%, against 67% for those who coded without it. The biggest gap was on debugging questions, that is, on understanding why code fails. The [full paper](https://arxiv.org/abs/2601.20245) is small and has its limits, but the most interesting part is something else: people who used AI to **ask questions and request explanations**, and not just to generate code, kept their learning.

In other words: the tool doesn't decide whether you learn. The way you use it does. And work, rightly so, pushes you toward the way that delivers faster.

## So where does studying happen?

If learning no longer comes along for the ride, it needs a place of its own. For me, that place became the personal project, treated as a **lab**.

The difference isn't the technology, it's the definition of success:

- **At work**, done is when it meets the requirement. Mistakes are expensive. The stack is the team's.
- **In the lab**, done is when I can explain how it works. Mistakes are the subject of the study. The stack is the one that made me curious.

Neither one is better. The problem shows up when I expect from one what belongs to the other: hoping work will teach me everything, or treating the weekend as one more sprint, with a deadline and a deliverable.

And there's a nice irony here. The same AI that removes friction from work made the lab much cheaper. Before, to reach the question I cared about, I spent weeks on setup, build, UI and deploy, and many ideas died in boilerplate (that repetitive code every project needs and nobody wants to write). Today the skeleton is ready in one evening, and the time left over goes to the part I always enjoyed: understanding how the thing works underneath. That's how I went back to programming for fun.

## How I study using AI

This isn't an anti-AI post. It's about being intentional. The rule I follow in the lab is simple:

> **I let the agent do what I already know how to do. I do by hand, or read line by line, what I want to learn.**

In practice, the agent builds the UI, the CSS, the deploy workflow. When I reach the piece that made me curious, I slow down:

- **I ask "why this way?"** until the answer makes sense, instead of accepting the code that worked.
- **I break it on purpose** to watch the error happen. Debugging was exactly where the Anthropic study saw the biggest loss, so that's where I insist the most.
- **I read the spec**, not just the agent's summary.
- **I write about what I learned**, in a README or here on the blog. Writing is the best test of "did I really get it?". If I can't explain a piece, it isn't mine yet.

Notice that none of this is new. It's the same old way of studying. What changed is that work used to do part of it for me, without my asking, and now I have to choose to do it.

## How this turned out here

This blog itself started that way. I wanted to know how far a static site, which is just a bunch of HTML files with no server at all, could behave like a living system. It's generated by [Hugo](https://gohugo.io/) and hosted for free on GitHub Pages. Every morning, a GitHub Actions workflow runs on its own: it fetches my talks from the public [Sessionize](https://sessionize.com/) API, rebuilds the site and, in that rebuild, publishes the posts scheduled for that day. After the deploy, a script prepares the newsletter for new posts in [Buttondown](https://buttondown.com/). There's no database and no server to maintain, and the site still changes on its own. The details are in [Hugo, Sessionize and a cron](/posts/hugo-sessionize-cron-blog-setup/).

Two more posts born from this way of studying come out in this same batch.

The first one is about [Ito](/posts/how-ito-works/), a game you play with friends, each on their own phone. I made it **peer-to-peer** (P2P): the phones talk directly to each other, with no game server in the middle. I did it that way because I wanted to understand how it works, and the curiosity came from FIFA, now EA FC. In P2P matches, [according to EA itself](https://www.ea.com/games/battlefield/news/pitch-notes-fifa20-game-data-center), the connection goes straight from one console to the other and one of the players becomes the host of the match. Ito is similar: whoever creates the room is the host. What hooked me were the questions that come with it. With no server, how do two phones find each other on the internet? And what stops one of them from cheating?

The second one is about [Web Push](/posts/how-web-push-works/), the notification that arrives with the tab closed. The lab became a PWA, which is the site installed as an app, and it shows you can send notifications without paying for any notification service. The browser's own push service delivers them at no cost, and the message is encrypted in a way that not even that service can read. On your side, all you need is a small server and a pair of keys.

Neither of them will change my job tomorrow. They exist because I wanted to know how things work, and they're an example of what I call a lab: questions I followed until I could explain them.

## For anyone wondering if studying is still worth it

If you're wondering whether studying programming is still worth it in 2026, my answer is: it is, but don't expect work to do it for you. A few ideas that worked for me:

- **Pick something small, useful to you, with just one new concept.** A project you'll actually use gives you a reason to finish; one new concept (not five) gives you a chance to really understand it.
- **Use AI to remove friction, not to skip understanding.** Ask for the skeleton, but keep the part that matters.
- **Measure it differently.** In the lab, the question isn't "am I done?". It's "did I learn something I didn't know?" and "did I have fun?".

And if your job became just delivery, that's fine. That's what work is. As Chris Kiehl put it in [It's still OK to enjoy programming](https://chriskiehl.com/article/it-is-still-ok-to-enjoy-programming): "But that's work. Work is not life." Curiosity can live somewhere else.

## Wrapping up

AI didn't end studying programming. It ended the illusion that working and studying were the same thing. What used to happen without us noticing now needs time, a place and intention.

So here's the question I asked myself at the start: **what are you studying today, just because it's good to know?** Tell me in the comments or on [LinkedIn](https://www.linkedin.com/in/luiz-schons/).
