---
title: 'Ito under the hood: browser P2P multiplayer with no game server'
date: 2026-11-02
description: 'How several phones play together from a static site: WebRTC, signaling over Nostr and MQTT, STUN and TURN, a deck nobody sends and a host that signs the state.'
translationKey: how-ito-works
tags: ['WebRTC', 'Architecture']
series: ['Studying out of curiosity']
series_weight: 3
draft: false
---

[Ito](https://sschonss.github.io/ito/) is a cooperative card game where each person plays on their own phone. The site is just a handful of static files on [GitHub Pages](https://pages.github.com/), and there is no central server running the match. Even so, up to ten phones play together in real time, talking directly to each other. This article explains how that works, and the code is open in the [Ito repository](https://github.com/sschonss/ito).

It's a companion to [Working is not studying](/posts/personal-projects-as-a-lab/), where I talk about where learning went in the AI era. It isn't a tutorial: it's an explanation with diagrams, real captures from a lab and simplified code snippets. You don't need to know networking; I explain each term as it shows up.

## The challenge: a static site and several phones

The traditional way to build a multiplayer game is to put a server in the middle. Each phone sends its move to the server, and the server relays it to the others. It's like a group of friends who only talk through a mediator.

GitHub Pages doesn't run my code: it only serves files (HTML, CSS, JavaScript). So the lab question was: can the phones talk **directly to each other**, with no mediator?

They can, with [WebRTC](https://webrtc.org/) (Web Real-Time Communication), the technology browsers use for video calls. Besides audio and video, it has the [**data channel**](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), a channel to send arbitrary data between two browsers. This model is called **P2P** (peer-to-peer): each phone talks to the others without going through a central server. And the channel is encrypted with **DTLS**, the version of TLS (the HTTPS padlock) for this kind of connection.

There's one catch: to open that channel, the two sides have to find each other first, and the internet doesn't make that easy. The rest of the article is the story of that meeting, and then of what happens once it works. Here is the overall map (the full network design is documented in [docs/p2p.md](https://github.com/sschonss/ito/blob/main/docs/p2p.md), in Portuguese):

![Ito overview. The host and a guest use Nostr relays and MQTT brokers only to find each other, exchanging SDP and ICE candidates. Then they talk over a direct WebRTC channel encrypted with DTLS. On the side, STUN helps each phone discover its public address, and a Cloudflare TURN, with 24-hour credentials handed out by a Worker, relays the data when the direct path is blocked. GitHub Pages only serves the site files](/images/posts/how-ito-works/overview-en.svg)

Don't worry if half the names in the drawing don't make sense yet. Each one comes up in the next sections, with an example.

### What the game looks like

To get a feel for what is being synchronized, these are real captures of the published Ito, taken in a browser with a phone-sized screen (the game's interface is in Portuguese only). On the left, the home screen, where you create a room. On the right, the room with two people: the room code at the top, the invite buttons and the list of who has joined, with the host marked.

![Two real captures of Ito on a phone, side by side, with the interface in Portuguese. On the left, the home screen, with the headline "Pense no número. Fale o tema." (think of the number, say the theme) and the "Criar sala" (create room) card, with the number of rounds and the theme categories. On the right, the room as seen by the host: the code FVGZ-FYFH at the top, the Copy, QR code and Invite buttons, and the "Na sala" (in the room) list with João, marked as you and host, and Maria, both with a green connected dot. At the bottom, the "Começar partida" (start game) button](/images/posts/how-ito-works/ito-telas-inicio-sala.webp)

Those two people were two browser windows in the lab, each pretending to be a phone. Maria's name showed up on the host's list because the two browsers managed to open the direct channel. How that happens is the subject from here on.

## A bit of networking, no specialist required

Before talking about WebRTC, it helps to understand why two phones can't simply "call" each other. There are three ideas: IP address, private address and NAT.

### IP address: the delivery address

Every connected device has an **IP address**, a number that says where data packets should go, like the address on a letter. Something like `203.0.113.5`.

But there are two kinds:

- **Public address:** unique on the whole internet. Anyone in the world can send packets to it.
- **Private address:** only valid inside a local network, like your home. Ranges such as `192.168.x.x` and `10.x.x.x` are reserved for this, and millions of homes use the same numbers at the same time. The `192.168.0.10` in your home and the one next door are different devices.

Every address in this article is an **example**, taken from ranges reserved for documentation. None belongs to a real device.

### NAT: a building with a single address

If every home uses private addresses, how does data reach your phone? Through **NAT** (Network Address Translation), which runs on the router.

Think of an apartment building. The street only knows the building's address (the public IP, `203.0.113.5`). Inside, each apartment has a number (the private IP, `192.168.0.10`, `192.168.0.11`). The router is the doorman: when a resident sends a letter out, he notes "the reply to this letter goes to apartment 10" and swaps the sender for the building's address. When the reply arrives, he checks the note and delivers it to the right apartment. In practice, the note uses a **port**, an extra number that goes along with the address (as in `203.0.113.5:61000`).

The detail that matters: the doorman only delivers what is a **reply** to something a resident sent. A letter that arrives from outside without anyone asking for it has no note, so it gets dropped. That's great for security and terrible for anyone who wants a direct connection.

### Why a phone on 4G and one on Wi-Fi can't find each other

Now put the pieces together. Phone A is on home Wi-Fi, with the private address `192.168.0.10`, behind the router. Phone B is on 4G. Mobile carriers have so many customers that they run NAT at scale, called **CGNAT** (Carrier-Grade NAT): the phone gets an internal address (something like `100.64.12.7`) and shares one public address with thousands of other customers.

![NAT diagram. On the left, the home network: a phone at 192.168.0.10 and a laptop at 192.168.0.11 connected to a router that shows the address 203.0.113.5 to the outside. On the right, the mobile network: a phone on 4G at 100.64.12.7 behind the carrier's CGNAT, which shows 198.51.100.20 to the outside. In the middle, the internet, which only sees the outside addresses. A dashed red arrow shows the 4G phone trying to come straight into the home router and being blocked, because it arrived from outside unasked. The addresses are examples](/images/posts/how-ito-works/nat-en.svg)

If B tries to send something to `192.168.0.10`, it goes nowhere: that address only exists inside A's home. If it tries the public address of A's router, the router has no note and drops it. And the same goes the other way. Neither one can be the first to knock on the door. That's the problem WebRTC has to solve, and it does so with three tools: ICE, STUN and TURN.

## How the connection crosses the network: ICE, STUN and TURN

### ICE candidates: "where you can find me"

**ICE** (Interactive Connectivity Establishment) is the process the browser uses to discover possible paths to the other side. Each address where a phone *might* be reachable becomes an **ICE candidate**. There are three kinds:

- **host:** the address on the local network itself (`192.168.0.10:50000`). It only works if both are on the same network.
- **srflx** (server reflexive): the public address the router uses for that phone (`203.0.113.5:61000`). It's discovered with the help of a STUN server.
- **relay:** an address borrowed from a TURN server, which relays the data. It's plan B.

Each side gathers its candidates and sends the list to the other (the signaling section shows how). Then ICE builds pairs, one of my candidates with one of theirs, and tests them all. The pair that works wins, preferably the most direct one, leaving TURN for last.

### STUN: "from outside, how do you see me?"

A phone doesn't know its public address on its own: it only knows `192.168.0.10`. The one who knows is the router, which swaps the sender along the way. **STUN** (Session Traversal Utilities for NAT) solves this with a single question. The phone sends a packet to a STUN server on the internet, and the server replies with the address the packet came from:

![STUN exchange in four steps. 1: the phone, at 192.168.0.10, asks "who am I?" from port 50000. 2: the router swaps the sender and the question reaches the STUN server from 203.0.113.5:61000; the router notes that port 61000 belongs to the phone. 3: the STUN server answers "I see you at 203.0.113.5:61000". 4: the router forwards the answer to the phone. In the end, the phone has two ICE candidates: host 192.168.0.10:50000, which only works inside the home, and srflx 203.0.113.5:61000, found via STUN. Example addresses and ports](/images/posts/how-ito-works/stun-en.svg)

Notice the side effect: by asking the question, the phone also left a note with the doorman. That's the basis of the direct path. Once both sides have traded their srflx candidates, each one sends packets to the other's public address **at the same time**. To A's router, the packet arriving from B looks like the reply to something A just sent, so it lets it through. The same happens on the other side. This technique is informally called *hole punching*.

STUN is cheap: it answers one question and carries no game data. Ito uses Trystero's default STUN servers (the library I'll get to shortly): Google's (`stun.l.google.com` and variants) and Cloudflare's (`stun.cloudflare.com`).

### When the direct path fails: TURN

Hole punching doesn't always work. The most common cases:

- **Symmetric NAT:** some routers use a different port for each destination. The port STUN saw doesn't work for talking to the other phone, so the srflx address is useless.
- **Corporate and university networks:** many block UDP (the kind of packet WebRTC prefers) and only let web traffic out, on ports 80 and 443.
- **Carrier CGNAT:** with thousands of customers behind the same address, the carrier's NAT tends to be stricter, and the direct path between two phones on 4G may not open.

For these cases there is **TURN** (Traversal Using Relays around NAT). Instead of trying to get into each other, both phones open a connection **outward**, to a TURN server, which almost every network allows. TURN forwards the packets from one to the other. It's a mail carrier, not a reader: the channel stays DTLS-encrypted end to end, so TURN sees encrypted bytes, not the moves.

![Two paths side by side. On the left, the direct path: phone A, on home Wi-Fi, behind a NAT, and phone B, on 4G, behind a CGNAT, connected directly, because both knock on the door at the same time using the addresses found via STUN. On the right, through TURN: each phone connects outward to a Cloudflare TURN server, which relays between them. Below, the reasons the direct path fails, symmetric NAT, a corporate network blocking UDP and carrier CGNAT, and a reminder that, either way, DTLS holds end to end and TURN sees encrypted bytes, not the moves](/images/posts/how-ito-works/paths-en.svg)

Ito's TURN is [Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/). A TURN server needs credentials, and I didn't want to leave a password in the site's code, where anyone can read it. The solution was a [Cloudflare Worker](https://workers.cloudflare.com/), a small function that runs on Cloudflare with no server to maintain. The app asks it for temporary credentials, valid for 24 hours, and reuses them until about 5 minutes before they expire. The secret key lives only in the Worker, which only answers the game's address and `localhost`. The details are in [docs/turn.md](https://github.com/sschonss/ito/blob/main/docs/turn.md) (in Portuguese).

And if the Worker fails or takes more than about 3 seconds? The room opens anyway, with only STUN and the direct connection. TURN is a backup, not a requirement.

## How the phones find each other: signaling

By now, each phone knows **where it can be found** (its ICE candidates). It still has to tell the other one. And there's a chicken-and-egg problem: to talk directly, they need to trade this information; to trade information, they would already need to be talking. So that first exchange goes through a third party. It's called **signaling**, and WebRTC deliberately doesn't define how it happens: each application picks its own channel.

### What needs to be exchanged

There are two kinds of note:

- **SDP offer and answer**, the "what I can do". SDP (Session Description Protocol) is a spec sheet: "I want to open a data channel, these are my security parameters". One side sends the **offer**, the other sends back the **answer**, and that's how both agree on the shape of the conversation.
- **ICE candidates**, the "where you can find me": the list of addresses from the previous section.

### The bulletin board

The best image I found is a **cork bulletin board** in a busy hallway. Anyone can pin a note and anyone can read it. Ito uses the board like this:

1. **The room code is the board's name.** Whoever knows the code (`FVGZ-FYFH`, for example) knows which board to look at. In practice, the name is a hash (a "fingerprint" of the text) of `Trystero@` + the app name + `@` + the room code. In one of the lab rooms, with the code `NUFW-FYFH`, the board's name was `3x5w6s4e1l5n636x5s235r2n5539gk1k6643c`, and you can check it: it's exactly the SHA-1 of that text.
2. **Each one pins an "I'm here"** on the board, with a random identifier.
3. **Each one also has a personal mailbox**, another name derived from the board plus their own identifier. Whoever sees someone's "I'm here" leaves the **offer** in that person's mailbox. The person answers in the offerer's mailbox, and the ICE candidates follow the same route.
4. **The notes are encrypted.** The key comes from the room code, so anyone walking past the board without the code sees only meaningless letters and numbers.
5. **The board never carries the game.** As soon as the direct channel opens, nobody looks at it again. No move, card or chat message goes through it.

![Signaling sequence diagram with three columns: host, board (Nostr relays and MQTT brokers) and guest. 1 and 2: each pins "I'm here" on the room's board. 3: the board shows the host the guest's note. 4 and 5: the host leaves the encrypted SDP offer in the guest's mailbox, and the board delivers it. 6 and 7: the guest leaves the encrypted SDP answer in the host's mailbox, and the board delivers it. 8: encrypted ICE candidates both ways. A green band says the board steps aside and never carries a move. 9: ICE tests the address pairs and the WebRTC channel opens, with DTLS. 10: the game goes direct, with act, state, ack and tick](/images/posts/how-ito-works/signal-en.svg)

A detail that often gets oversimplified: it isn't always the host who sends the offer. It's whoever sees the other's "I'm here", and if both send at the same time, a tie-break rule in the library picks one. In the lab test, the host was already on the board, saw the guest arrive and sent the offer.

### Who plays the board

Ito uses the [Trystero](https://github.com/dmotz/trystero) library, which does this signaling over public networks that already exist, and joins two at the same time:

- **[Nostr](https://nostr.com/):** an open protocol for decentralized social networks, where messages travel through **relays**, public servers that store and pass on notes to whoever asks.
- **[MQTT](https://mqtt.org/):** a lightweight messaging protocol used in IoT (sensors, smart bulbs), where **brokers**, public servers, deliver each message to whoever subscribes to a topic.

For Ito, both are boards: public places where you can pin and read notes by name. The room code is the room name on both networks and also the password for the negotiation. Simplified from [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js):

```javascript
// for each network (Nostr and MQTT)
const room = lib.joinRoom(
  { appId: APP_ID, password: code, turnConfig }, // the room code is also the password
  code                                           // and the room name
);
```

### What a real note looks like

In the lab, the test recorded the messages the browsers sent to a Nostr relay. This is the host's "I'm here", shortened (`kind` is the Nostr event type and the `x` tag is the board's name):

```json
["EVENT", {
  "kind": 22750,
  "tags": [["x", "3x5w6s4e1l5n636x5s235r2n5539gk1k6643c"]],
  "content": "{\"peerId\":\"Hz5mLideyfm3wcxbVDYG\"}",
  "pubkey": "6b4303fa…", "sig": "…"
}]
```

And this is the offer it left in the guest's mailbox. Notice that the `x` tag is now a different name (the personal mailbox) and that the SDP is encrypted: before the `$` comes the AES-GCM initialization vector, then the ciphertext in base64 (`content` travels as a string in the message; here it's formatted to fit):

```json
["EVENT", {
  "kind": 22620,
  "tags": [["x", "s1d44364b6k42334vx6y4z2s341065511h505p"]],
  "content": {
    "peerId": "Hz5mLideyfm3wcxbVDYG",
    "offerId": "PjBc6cjOrcF7",
    "offer": "162,62,20,126,…$HWJjPQeza48JSSPl8zwr…"
  }
}]
```

Whoever has the room code decrypts it and finds a regular SDP. This is an excerpt of the SDP the host's browser generated in the same test, read straight from the browser API, with identifiers masked:

```text
m=application 12988 UDP/DTLS/SCTP webrtc-datachannel
a=candidate:2032783209 1 udp 8191 104.30.x.x 12988 typ relay …
a=ice-ufrag:(masked)
a=fingerprint:sha-256 B9:8F:11:F5:…:54:62:E1
a=setup:actpass
a=sctp-port:5000
```

Line by line: `m=application ... webrtc-datachannel` says "I want a data channel, not audio or video". The `a=candidate` line is an ICE candidate of type `relay`. The `fingerprint` is the DTLS certificate's fingerprint, which the other side uses to make sure it's encrypting with whoever it negotiated with, and not with someone in the middle.

### Two networks at once

Using two boards has an interesting side effect: the same person can arrive twice, once through each network. That's why messages are **idempotent**, meaning receiving the same message twice is the same as receiving it once. The state has a version, reactions have an `id`, and someone only counts as disconnected when they drop from **both networks**.

The redundancy showed up in the lab itself: on the test network, no public MQTT broker accepted a connection, and the room opened anyway, through Nostr alone.

## What the lab showed: the connection went through TURN

The test opened the published Ito in two browser windows on the same lab machine, one as host and one as guest, and read `getStats()`, the WebRTC API that reports which candidate pair was chosen. The summary, with addresses masked:

```text
selected pair:   relay (local) <-> relay (remote), udp, rtt ~0.02 s
local candidate: relay 104.30.x.x
  via turns:turn.cloudflare.com:443 (relayProtocol: tls)
transport:       dtlsState connected, DTLS 1.3
  cipher TLS_AES_128_GCM_SHA256
```

The lab network blocked outgoing UDP, like many corporate networks. ICE found no direct path, and the connection went out through Cloudflare's TURN **over TLS on port 443**, the same port as a regular HTTPS site. That's exactly the scenario from the previous section: TURN kept the game going, and DTLS still held inside.

The test couldn't show the direct path. Even in a second run, with both windows on the same machine, the browser didn't produce local UDP candidates on that network, so the only possible pair was relay to relay. On a regular home Wi-Fi, the expected outcome is ICE picking a `host` or `srflx` pair, with no TURN, but the lab didn't record that.

## The card trick: nobody sends the cards

This is my favorite part. In an online card game, the intuition is that someone deals and sends each player their card. In Ito, **the cards never travel**.

Each phone computes the deck on its own, and they all reach the same result. The secret is a **seeded pseudorandom generator**: an algorithm that produces numbers that look random but are always the same for the same seed. Like a recipe: same ingredients, same cake in any kitchen.

The seed is the text `room code|game number|round number`. A hash called xmur3 turns that text into a number, mulberry32 generates the sequence from it, and the [Fisher-Yates](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) shuffle uses that sequence to shuffle the cards from 1 to 100 (simplified from [js/core.js](https://github.com/sschonss/ito/blob/main/js/core.js)):

```javascript
// same input text, same deck on every phone
const rng = seed => mulberry32(xmur3(seed)());
const deckFor = (code, game, round) =>
  shuffle([...Array(100)].map((_, i) => i + 1), rng(`${code}|${game}|${round}`));
```

![The cards don't travel. The seed text, room code, game and round, goes through the xmur3 hash, the mulberry32 generator and the Fisher-Yates shuffle, and every phone ends up with the same deck from 1 to 100. Only decisions cross the network: playing a card, the order, votes and clues](/images/posts/how-ito-works/deck-en.svg)

Only **decisions** cross the network: "I played my card", "I arranged the order like this", votes and clues. Small messages, and no cards flying around.

The room code also carries the settings. It's 8 letters without I and O (so they aren't confused with 1 and 0): the first 4 are the random part of the room, and the last 4 store, in base 24, the number of rounds and the chosen theme categories. Whoever types the code already knows how the game was set up.

## Who runs the game: the host

With several phones, who decides what's true? In Ito the rule is simple: **whoever creates the room is the host, and the host is the single source of truth**. Only the host changes the game state. The others request actions (`act`), receive the state and acknowledge it (`ack`).

Each change bumps the state version (`ver`), and the host sends the full state. A guest only accepts a state newer than the one it has. And every 2 seconds the host sends a `tick` with the version and a **hash** of the state (a short "fingerprint": if any detail changes, the hash changes). Anyone out of sync asks for the state again:

```javascript
// on a guest, on every tick from the host
if (msg.ver !== my.ver || msg.h !== stateHash(my)) {
  sendTo(host, { t: 'pull' }); // "send me the state again"
}
```

The full cycle, including the signature covered in the next section:

![Sequence diagram between guest and host. 1: the guest sends act, "I played my card". 2: the host applies the rule, the version goes from 7 to 8, and it signs with the private key. 3: it sends state, version 8, with the signature. 4: the guest checks the signature with the public key pinned by the invite link's fingerprint. 5: the guest replies ack with the version and the hash. 6: every 2 seconds, the host sends tick with version and hash. 7: if the hash doesn't match, the guest sends pull. 8: the host resends the signed state. At the bottom, in red: a state without a valid signature or with an old version is dropped](/images/posts/how-ito-works/host-en.svg)

This fixes lost messages without anyone noticing. It isn't a fancy consensus algorithm, just one source of truth and a periodic check. For a game among friends, it's exactly what's needed.

You can see the difference in roles on screen. In the same round, captured in the lab, the host has the "Revelar nessa ordem" (reveal in this order) button and can change the theme; the guest only sees a note saying that, once everyone agrees, João reveals:

![Two real captures of the same Ito round, side by side, with the interface in Portuguese. On the left, the host's screen, João: the theme "Programas de TV de domingo" (Sunday TV shows), from 1, "sono" (boring), to 100, "imperdível" (must-watch), the "Mudar tema" (change theme) button, the face-down card and the red "Revelar nessa ordem" (reveal in this order) button. On the right, the guest's screen, Maria: the same theme and the same round 1 of 5, the face-down card and, instead of the button, the note "Quando todos concordarem, João revela" (when everyone agrees, João reveals)](/images/posts/how-ito-works/ito-partida-anfitriao-convidado.webp)

## Nobody impersonates the host: signatures

If the host is the truth, what stops someone from sending a fake state saying "I'm the host"? **Digital signatures.**

The first time it opens the game, each phone generates an **ECDSA P-256** key pair using [WebCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign), the cryptography API built into the browser (the code is in [js/crypto.js](https://github.com/sschonss/ito/blob/main/js/crypto.js)). ECDSA is a signature algorithm based on elliptic curves, and P-256 is the curve used. The idea, without the math: the **private key** is a stamp only you have and it never leaves the device; the **public key** is a copy of the stamp's design, which anyone can use to check whether a document was stamped by you.

It's the same algorithm (ECDSA on the P-256 curve) the server uses to stamp each send in [Web Push](/posts/how-web-push-works/).

The host stamps (signs) every state, and everyone checks it. The state carries the room owner's public key, and the invite link carries its **fingerprint** (a short digest of the key). So whoever joins through the invite already knows which stamp to expect. Each player's introduction (`hello`) is signed too, so nobody can take someone else's seat.

The project itself is clear about the limit: this protects against a fake host, **not** against someone already in the room. Since cards are computed on the phone, someone who knows how to inspect the code in the browser could find out the numbers. Preventing that would require a server holding the cards. For a game among friends, it's an acceptable trade-off.

## What if the host drops?

The host is the source of truth, so it's also a single point of failure. If the host's phone loses its connection (on both networks) and doesn't come back within about 5 seconds, the connected player with the lowest seat number becomes the **provisional host**. Only someone who received the current state in this session takes over, and they bump the version (`ver + 1`) so everyone recognizes the new state.

When the room owner comes back, they wait a moment to get the newest state from the provisional host and **take over again**. The game continues where it stopped, without losing moves. Signatures cover this case too: the provisional host's state is only accepted while the owner is away, and with a key everyone already knew.

## How to test something that depends on public networks

Depending on third-party relays and brokers is great until the day one of them changes. That's why Ito has two kinds of tests:

- **End-to-end tests with a fake relay:** the tests open several "phones" in a browser driven by [Playwright](https://playwright.dev/) (a tool that automates browsers) and swap the connection library for a fake one that imitates both networks inside the test itself. Fast, and no internet dependency.
- **A daily test on the real networks:** a [GitHub Actions](https://github.com/features/actions) workflow runs every day, connects two browsers over the real internet and plays a round in three scenarios: Nostr only, MQTT only and both networks together. If a public relay or broker changes, the test warns me before anyone tries to play.

## Limits and what I learned

"No server" needs an asterisk: **there is no central server for the match**. There are still Nostr relays, MQTT brokers, STUN servers, Cloudflare's TURN (with my Worker) and the CDNs the library loads from. All of them are third parties and can go down; the two networks and the fallback addresses reduce the risk but don't eliminate it. The game also needs internet for the first connection and, as I said, isn't cheat-proof among people already in the room.

What I take from the lab:

- **The browser knows a lot more than I imagined:** encrypted P2P connections and real cryptography, with nothing to install.
- **Sometimes the best way to sync is not to send:** the deterministic deck removed a whole category of problems.
- **One source of truth with versions and a check goes a long way:** before reaching for a consensus algorithm, ask whether a boss and a check every 2 seconds are enough.
- **Be honest about dependencies:** naming what belongs to third parties helps decide what to test every day.

Open [Ito](https://sschonss.github.io/ito/), create a room and call your friends: everything here really happens on your phone. And if you haven't read it yet, the context for why I built this is in [Working is not studying](/posts/personal-projects-as-a-lab/). If you've played with WebRTC or have an idea for a P2P game, tell me in the comments.
