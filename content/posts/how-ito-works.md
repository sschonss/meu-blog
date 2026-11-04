---
title: 'Ito under the hood: browser P2P multiplayer with no game server'
date: 2026-11-03
description: 'How several phones play together from a static site: WebRTC, signaling over Nostr and MQTT, STUN and TURN, a deck nobody sends and a host that signs the state.'
translationKey: how-ito-works
tags: ['WebRTC', 'Architecture']
series: ['Studying out of curiosity']
series_weight: 3
draft: false
---

[Ito](https://sschonss.github.io/ito/) is a cooperative card game where each person plays on their own phone. It's a [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) (progressive web app): a website you can install and open as if it were an app.

The site is just a handful of static files on [GitHub Pages](https://pages.github.com/). There is no central server running the match. Even so, up to ten phones play together in real time, talking directly to each other.

This article explains how that works, and the code is open in the [Ito repository](https://github.com/sschonss/ito). It's a companion to [Programming is still fun](/posts/personal-projects-as-a-lab/), where I explain why I build things out of curiosity and why, in the AI era, that became another way to learn.

It isn't a tutorial: it's an explanation with diagrams, real output captured in a lab and simplified code snippets. You don't need to know networking. Every acronym is explained the first time it shows up, and if one slips by, the [quick glossary](#glossary) at the end sums them all up in one line each.

### The game in five moments

So you don't get lost among the terms, the article follows one game from start to finish. Each moment pulls in a piece of the tech:

1. **João creates the room.** His phone becomes the host, the room owner.
2. **Maria types the code and joins.** The two phones have to find each other over the internet. This is the networking, connection and signaling part.
3. **The cards are dealt.** Without anyone sending a single card.
4. **Maria plays a card.** The move goes to the host, and the new game state comes back to everyone, signed.
5. **Someone's connection drops.** The game has to keep going anyway.

## The challenge: a static site and several phones

The traditional way to build a multiplayer game is to put a server in the middle. Each phone sends its move to the server, and the server relays it to the others. It's like a group of friends who only talk through a mediator.

GitHub Pages doesn't run my code: it only serves files (HTML, CSS, JavaScript). So the question for the lab was: can the phones talk **directly to each other**, with no mediator?

They can, with [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) (Web Real-Time Communication). It's the technology browsers use for video calls, and it ships with every modern browser, with nothing to install.

Besides audio and video, WebRTC has the [**data channel**](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel). Think of it as a pipe between two browsers that carries any data: in Ito, the text of each move.

This model is called [**P2P**](https://developer.mozilla.org/en-US/docs/Glossary/P2P) (peer-to-peer). Each phone talks to the others without going through a central server, like friends talking at the same table instead of through a switchboard operator.

The channel is also encrypted with [**DTLS**](https://developer.mozilla.org/en-US/docs/Glossary/DTLS) (Datagram Transport Layer Security). It's the version of [TLS](https://developer.mozilla.org/en-US/docs/Glossary/TLS), the HTTPS padlock, made for this kind of connection. In practice, nobody along the way can read the moves.

There's one catch: to open that channel, the two sides have to find each other first, and the internet doesn't make that easy. The rest of the article is the story of that meeting, and then of what happens once it works.

Here is the overall map (the full network design is documented in [docs/p2p.md](https://github.com/sschonss/ito/blob/main/docs/p2p.md), in Portuguese):

![Ito overview. The host and a guest use Nostr relays and MQTT brokers only to find each other, exchanging SDP and ICE candidates. Then they talk over a direct WebRTC channel encrypted with DTLS. On the side, STUN helps each phone discover its public address, and a Cloudflare TURN, with 24-hour credentials handed out by a Worker, relays the data when the direct path is blocked. GitHub Pages only serves the site files](/images/posts/how-ito-works/overview-en.svg)

Don't worry if half the names in the drawing don't make sense yet. Each one comes up in the next sections, with an example.

**In short:** WebRTC lets two browsers talk directly and with encryption. The hard part is getting them to find each other.

### What the game looks like

To get a feel for what is being synchronized, these are real screenshots of the live version of Ito, taken in a browser with a phone-sized screen (the game's interface is in Portuguese only).

On the left, the home screen, where you create a room. On the right, the room with two people: the room code at the top, the invite buttons and the list of who has joined, with the host marked.

![Two real screenshots of Ito on a phone, side by side, with the interface in Portuguese. On the left, the home screen, with the headline "Pense no número. Fale o tema." (think of the number, say the theme) and the "Criar sala" (create room) card, with the number of rounds and the theme categories. On the right, the room as seen by the host: the code FVGZ-FYFH at the top, the Copy, QR code and Invite buttons, and the "Na sala" (in the room) list with João, marked as you and host, and Maria, both with a green connected dot. At the bottom, the "Começar partida" (start game) button](/images/posts/how-ito-works/ito-telas-inicio-sala.webp)

Those two people were two browser windows in the lab, each pretending to be a phone. Maria's name showed up on the host's list because the two browsers managed to open the direct channel. How that happens is the subject from here on.

## A bit of networking, no specialist required

Before talking about WebRTC, it helps to understand why two phones can't simply "call" each other. There are three ideas: IP address, private address and NAT.

### IP address: the delivery address

Every connected device has an [**IP address**](https://developer.mozilla.org/en-US/docs/Glossary/IP_Address), a number that says where data packets should go, like the address on a letter. Something like `203.0.113.5`.

But there are two kinds:

- **Public address:** unique on the whole internet. Anyone in the world can send packets to it.
- **Private address:** only valid inside a local network, like your home. Ranges such as `192.168.x.x` and `10.x.x.x` are reserved for this, and millions of homes use the same numbers at the same time. The `192.168.0.10` in your home and the one next door are different devices.

Every address in this article is an **example**, taken from ranges reserved for documentation. None belongs to a real device.

### NAT: a building with a single address

If every home uses private addresses, how does data reach your phone? Through [**NAT**](https://developer.mozilla.org/en-US/docs/Glossary/NAT) (Network Address Translation), which runs on the router.

Think of an apartment building. The street only knows the building's address (the public IP, `203.0.113.5`). Inside, each apartment has a number (the private IP, `192.168.0.10`, `192.168.0.11`).

The router is the doorman. When a resident sends a letter out, he notes "the reply to this letter goes to apartment 10" and swaps the sender for the building's address. When the reply arrives, he checks the note and delivers it to the right apartment.

In practice, the note uses a [**port**](https://developer.mozilla.org/en-US/docs/Glossary/Port): an extra number that goes along with the address, as in `203.0.113.5:61000`. Think of it as the apartment number written on the envelope.

The detail that matters: the doorman only delivers what is a **reply** to something a resident sent. A letter that arrives from outside without anyone asking for it has no note, so it gets dropped. That's great for security and terrible for anyone who wants a direct connection.

### Why a phone on 4G and one on Wi-Fi can't find each other

Now put the pieces together, at the moment Maria tries to join João's room. João's phone is on home Wi-Fi, with the private address `192.168.0.10`, behind the router. Maria's phone is on 4G.

Mobile carriers have so many customers that they run NAT at scale, called **CGNAT** (Carrier-Grade NAT). The phone gets an internal address (something like `100.64.12.7`) and shares one public address with thousands of other customers. It's a huge building with a single doorman.

![NAT diagram. On the left, the home network: a phone at 192.168.0.10 and a laptop at 192.168.0.11 connected to a router that shows the address 203.0.113.5 to the outside. On the right, the mobile network: a phone on 4G at 100.64.12.7 behind the carrier's CGNAT, which shows 198.51.100.20 to the outside. In the middle, the internet, which only sees the outside addresses. A dashed red arrow shows the 4G phone trying to come straight into the home router and being blocked, because it arrived from outside unasked. The addresses are examples](/images/posts/how-ito-works/nat-en.svg)

If Maria tries to send something to `192.168.0.10`, it goes nowhere: that address only exists inside João's home. If she tries the public address of his router, the router has no note and drops it. And the same goes the other way.

**In short:** each doorman only lets replies in. If both phones wait for the other to knock first, nobody gets in. That's the problem WebRTC has to solve.

## How the connection crosses the network: ICE, STUN and TURN

WebRTC breaks this deadlock with three tools. It helps to keep one sentence for each:

- **ICE** runs the search: it gathers the possible addresses and tests which path works.
- **STUN** tells each phone "this is how you look from outside".
- **TURN** is plan B: a server that relays the data when no direct path opens.

MDN has a good overview of the [WebRTC protocols](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols), if you want to go further.

### ICE candidates: "where you can find me"

[**ICE**](https://developer.mozilla.org/en-US/docs/Glossary/ICE) (Interactive Connectivity Establishment) is the process the browser uses to discover paths to the other side.

Each address where a phone *might* be reachable becomes an **ICE candidate**. It's a guess: "try to find me here". There are three kinds:

- **host:** the address on the local network itself (`192.168.0.10:50000`). It only works if both are on the same network.
- **srflx** (server reflexive): the public address the router uses for that phone (`203.0.113.5:61000`). It's discovered with the help of a STUN server.
- **relay:** an address borrowed from a TURN server, which relays the data. It's plan B.

Each side gathers its candidates and sends the list to the other (the signaling section shows how). Then ICE builds pairs, one of my candidates with one of theirs, and tests them all, like trying the keys on a key ring until one opens the door.

The pair that works wins, preferably the most direct one. TURN comes last.

### STUN: "from outside, how do you see me?"

A phone doesn't know its public address on its own: it only knows `192.168.0.10`. The one who knows is the router, which swaps the sender along the way.

[**STUN**](https://developer.mozilla.org/en-US/docs/Glossary/STUN) (Session Traversal Utilities for NAT) solves this with a single question. The phone sends a packet to a STUN server on the internet, and the server replies with the address the packet came from. It's like calling a friend and asking "what number shows up on your screen?".

![STUN exchange in four steps. 1: the phone, at 192.168.0.10, asks "who am I?" from port 50000. 2: the router swaps the sender and the question reaches the STUN server from 203.0.113.5:61000; the router notes that port 61000 belongs to the phone. 3: the STUN server answers "I see you at 203.0.113.5:61000". 4: the router forwards the answer to the phone. In the end, the phone has two ICE candidates: host 192.168.0.10:50000, which only works inside the home, and srflx 203.0.113.5:61000, found via STUN. Example addresses and ports](/images/posts/how-ito-works/stun-en.svg)

Notice the side effect: by asking the question, the phone also left a note with the doorman. That's the basis of the direct path, which works like this:

1. João and Maria trade their srflx candidates, that is, the public addresses STUN showed them.
2. Both send packets to the other's public address **at the same time**.
3. To João's router, the packet arriving from Maria looks like the reply to something João just sent, so it lets it through. The same happens on the other side.

This technique is informally called *hole punching*.

STUN is cheap: it answers one question and carries no game data. Ito uses the default STUN servers from Trystero (a library I'll get to shortly): Google's (`stun.l.google.com` and variants) and Cloudflare's (`stun.cloudflare.com`).

### When the direct path fails: TURN

Hole punching doesn't always work. The most common cases:

- **Symmetric NAT:** some routers use a different port for each destination. The port STUN saw doesn't work for talking to the other phone, so the srflx address is useless.
- **Corporate and university networks:** many block [UDP](https://developer.mozilla.org/en-US/docs/Glossary/UDP), the kind of packet WebRTC prefers (fast, with no delivery confirmation, good for real time). They only let web traffic out, on ports 80 and 443.
- **Carrier CGNAT:** with thousands of customers behind the same address, the carrier's NAT tends to be stricter, and the direct path between two phones on 4G may not open.

For these cases there is [**TURN**](https://developer.mozilla.org/en-US/docs/Glossary/TURN) (Traversal Using Relays around NAT). Instead of trying to reach each other directly, both phones open a connection **outward**, to a TURN server, which almost every network allows. TURN forwards the packets from one to the other.

It's a mail carrier, not a reader. The channel stays DTLS-encrypted end to end, so TURN sees encrypted bytes, not the moves.

![Two paths side by side. On the left, the direct path: phone A, on home Wi-Fi, behind a NAT, and phone B, on 4G, behind a CGNAT, connected directly, because both knock on the door at the same time using the addresses found via STUN. On the right, through TURN: each phone connects outward to a Cloudflare TURN server, which relays between them. Below, the reasons the direct path fails, symmetric NAT, a corporate network blocking UDP and carrier CGNAT, and a reminder that, either way, DTLS holds end to end and TURN sees encrypted bytes, not the moves](/images/posts/how-ito-works/paths-en.svg)

Ito's TURN is [Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/). A TURN server needs credentials, and I didn't want to leave a password in the site's code, where anyone can read it.

The solution was a [Cloudflare Worker](https://workers.cloudflare.com/), a small function that runs on Cloudflare with no server to maintain:

- The app asks the Worker for temporary credentials, valid for 24 hours, and reuses them until about 5 minutes before they expire.
- The secret key lives only in the Worker, which only answers requests from the game's origin and `localhost`.

The details are in [docs/turn.md](https://github.com/sschonss/ito/blob/main/docs/turn.md) (in Portuguese).

And if the Worker fails or takes more than about 3 seconds? The room opens anyway, with only STUN and the direct connection. TURN is a backup, not a requirement.

**In short:** ICE tests paths, STUN finds each phone's public address so the direct path can be tried, and TURN relays the encrypted data when the direct path doesn't open.

## How the phones find each other: signaling

By now, each phone knows **where it can be found** (its ICE candidates). It still has to tell the other one.

And there's a chicken-and-egg problem. To talk directly, they need to trade this information. To trade information, they would already need to be talking.

So that first exchange goes through a third party. It's called [**signaling**](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling): like two friends texting to agree on a meeting spot before they see each other. WebRTC deliberately doesn't define how it happens. Each application picks its own channel.

### What needs to be exchanged

There are two kinds of notes:

- **SDP offer and answer**, the "what I can do". [SDP](https://developer.mozilla.org/en-US/docs/Glossary/SDP) (Session Description Protocol) is a spec sheet: "I want to open a data channel, these are my security parameters". One side sends the **offer**, the other sends back the **answer**, and that's how both agree on the shape of the conversation.
- **ICE candidates**, the "where you can find me": the list of addresses from the previous section.

### The bulletin board

The best image I found is a **cork bulletin board** in a busy hallway. Anyone can pin a note and anyone can read it. Ito uses the board like this:

1. **The room code is the board's name.** Whoever knows the code (`FVGZ-FYFH`, for example) knows which board to look at.
2. **Each phone pins an "I'm here"** on the board, with a random identifier.
3. **Each one also has a personal mailbox**, another name derived from the board plus their own identifier. Whoever sees someone's "I'm here" leaves the **offer** in that person's mailbox. The person answers in the offerer's mailbox, and the ICE candidates follow the same route.
4. **The notes are encrypted.** The key comes from the room code, so anyone walking past the board without the code sees only meaningless letters and numbers.
5. **The board never carries the game.** As soon as the direct channel opens, nobody looks at it again. No move, card or chat message goes through it.

A detail about the board's name: in practice, it's a [hash](https://developer.mozilla.org/en-US/docs/Glossary/Hash_function) of the room code. A hash is a "fingerprint" of a text: the same text always gives the same result, and any change gives a very different one.

The input text is `Trystero@` + the app name + `@` + the room code. In one of the lab rooms, with the code `NUFW-FYFH`, the board's name was `3x5w6s4e1l5n636x5s235r2n5539gk1k6643c`. You can check it: it's exactly the SHA-1 (a hash algorithm) of that text.

![Signaling sequence diagram with three columns: host, board (Nostr relays and MQTT brokers) and guest. 1 and 2: each pins "I'm here" on the room's board. 3: the board shows the host the guest's note. 4 and 5: the host leaves the encrypted SDP offer in the guest's mailbox, and the board delivers it. 6 and 7: the guest leaves the encrypted SDP answer in the host's mailbox, and the board delivers it. 8: encrypted ICE candidates both ways. A green band says the board steps aside and never carries a move. 9: ICE tests the address pairs and the WebRTC channel opens, with DTLS. 10: the game goes direct, with act, state, ack and tick](/images/posts/how-ito-works/signal-en.svg)

The names at the end of the drawing (`act`, `state`, `ack` and `tick`) are the game's message types. They get a proper explanation in the section about the host.

A detail that often gets oversimplified: it isn't always the host who sends the offer. It's whoever sees the other's "I'm here". If both send at the same time, a tie-break rule in the library picks one. In the lab test, the host was already on the board, saw the guest arrive and sent the offer.

### Who plays the board

Ito uses the [Trystero](https://github.com/dmotz/trystero) library, which does this signaling over public networks that already exist. It uses two of them at the same time:

- **[Nostr](https://nostr.com/):** an open protocol for decentralized social networks. Messages travel through **relays**, public servers that store and pass on notes to whoever asks.
- **[MQTT](https://mqtt.org/):** a lightweight messaging protocol used in IoT (the internet of things: sensors, smart bulbs). In it, **brokers**, also public servers, deliver each message to whoever subscribes to a topic.

For Ito, both are boards: public places where you can pin and read notes by name. The room code is the room name on both networks and also the password for the negotiation.

In the snippet below, simplified from [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js), notice that the room code (`code`) shows up twice: once as the password and once as the room name.

```javascript
// for each network (Nostr and MQTT)
const room = lib.joinRoom(
  { appId: APP_ID, password: code, turnConfig }, // the room code is also the password
  code                                           // and the room name
);
```

### What a real note looks like

In the lab, the test recorded the messages the browsers sent to a Nostr relay. This is the host's "I'm here", shortened. Look at two fields: the `x` tag, which is the board's name, and `content`, which carries only the random identifier (`kind` is the Nostr event type).

```json
["EVENT", {
  "kind": 22750,
  "tags": [["x", "3x5w6s4e1l5n636x5s235r2n5539gk1k6643c"]],
  "content": "{\"peerId\":\"Hz5mLideyfm3wcxbVDYG\"}",
  "pubkey": "6b4303fa…", "sig": "…"
}]
```

And this is the offer it left in the guest's mailbox. Notice two differences:

- The `x` tag is now a different name: the guest's personal mailbox.
- The SDP is encrypted with AES-GCM, a common encryption algorithm. Before the `$` comes the initialization vector, a random number that makes the same text come out different each time it's encrypted. After it comes the ciphertext in [base64](https://developer.mozilla.org/en-US/docs/Glossary/Base64), a way of writing bytes using only letters and numbers.

`content` travels as a string in the message; here it's formatted to fit:

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

Whoever has the room code decrypts it and finds a regular SDP. Below is an excerpt of the SDP the host's browser generated in the same test, read straight from the browser API, with identifiers masked. You don't need to read all of it: the lines that matter are the first one, the `candidate` one and the `fingerprint` one.

```text
m=application 12988 UDP/DTLS/SCTP webrtc-datachannel
a=candidate:2032783209 1 udp 8191 104.30.x.x 12988 typ relay …
a=ice-ufrag:(masked)
a=fingerprint:sha-256 B9:8F:11:F5:…:54:62:E1
a=setup:actpass
a=sctp-port:5000
```

Reading those three lines:

- `m=application ... webrtc-datachannel` says "I want a data channel, not audio or video". The [SCTP](https://developer.mozilla.org/en-US/docs/Glossary/SCTP) in it is the protocol the data channel uses underneath.
- `a=candidate` is an ICE candidate of type `relay`, that is, an address borrowed from TURN.
- `fingerprint` is the fingerprint of the DTLS [certificate](https://developer.mozilla.org/en-US/docs/Glossary/Digital_certificate). The other side uses it to make sure it's encrypting with whoever it negotiated with, and not with someone in the middle.

### Two networks at once

Using two boards has an interesting side effect: the same person can arrive twice, once through each network. Maria may show up through Nostr and, a moment later, again through MQTT.

That's why messages are [**idempotent**](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent): receiving the same message twice is the same as receiving it once. In practice:

- The state has a version, so a repeated copy changes nothing.
- Reactions have an `id`, so they don't count twice.
- Someone only counts as disconnected when they drop from **both networks**.

The redundancy showed up in the lab itself: on the test network, no public MQTT broker accepted a connection, and the room opened anyway, through Nostr alone.

### Which boards, and what the screen shows while searching

Out of the box, Trystero uses a default list of boards, and some relays on that list had already gone offline or started requiring a login to accept notes.

That's why Ito ships its own list: **8 Nostr relays**, picked because they accept anonymous writes (no account, no authentication), and **4 MQTT brokers**. The list lives in the `RELAYS` constant, in [js/core.js](https://github.com/sschonss/ito/blob/main/js/core.js), and is handed to Trystero in full, replacing the default list.

The 8 relays answer on **port 443**, the HTTPS one, the same as any website. That matters because many mobile and corporate networks only let web traffic out and cut every other port.

Three of the four MQTT brokers use ports outside the web standard (8081, 8084 and 8884). On a network like that, the Nostr relays carry the signaling, just like in the lab described above.

Finding the room can also take a while. If nobody shows up within 15 seconds, the app joins the board again on its own, up to 3 times, and shows which attempt it's on ("Tentativa 2 de 4", attempt 2 of 4, counting the first join).

Meanwhile, Maria's screen tells four situations apart, because each one calls for a different response (the game's interface is in Portuguese; the meaning is what matters here):

- **No internet:** the connection library didn't even load. The problem is the phone's own network.
- **Searching for the room:** the phone is on the boards, waiting for someone from the room to appear.
- **Almost there:** there's already a channel to someone in the room, but the host's signed state hasn't arrived yet. If it never arrives, the screen says exactly that ("the host's state didn't arrive") instead of pretending the room doesn't exist.
- **Room not found:** the attempts ran out and nobody appeared. The screen suggests checking that whoever created the room has Ito open, and a "try again" button restarts the search.

To see the code: the 15 seconds and the limit of 3 extra attempts are the `CONNECT_TIMEOUT` and `SEEK_TRIES` constants, in [js/core.js](https://github.com/sschonss/ito/blob/main/js/core.js), and joining the board again happens in the `armSeek` function, in [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js).

**In short:** before the direct channel exists, the phones trade the spec sheet (SDP) and the addresses (ICE candidates) as encrypted notes on public boards, Nostr and MQTT. Once the channel opens, the board steps aside.

## What the lab showed: the connection went through TURN

The test opened the live Ito in two browser windows on the same lab machine, one as host and one as guest. Then it read [`getStats()`](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats), the WebRTC function that reports which candidate pair was chosen.

The summary is below, with addresses masked. The lines that matter are the first one, which shows the chosen pair (relay to relay), and the third one, which shows how TURN was reached.

```text
selected pair:   relay (local) <-> relay (remote), udp, rtt ~0.02 s
local candidate: relay 104.30.x.x
  via turns:turn.cloudflare.com:443 (relayProtocol: tls)
transport:       dtlsState connected, DTLS 1.3
  cipher TLS_AES_128_GCM_SHA256
```

The `rtt` ([round-trip time](https://developer.mozilla.org/en-US/docs/Glossary/Round_Trip_Time)) is how long a packet takes to go and come back: about 20 milliseconds. The last line is the name of the cipher DTLS used.

The lab network blocked outgoing UDP, like many corporate networks. ICE found no direct path, and the connection went out through Cloudflare's TURN **over TLS on port 443**, the same port as a regular HTTPS site.

That's exactly the scenario from the previous section: TURN kept the game going, and DTLS still protected everything inside the tunnel.

The test couldn't show the direct path. Even in a second run, with both windows on the same machine, the browser didn't produce local UDP candidates on that network, so the only possible pair was relay to relay. On a regular home Wi-Fi network, the expected outcome is ICE picking a `host` or `srflx` pair, with no TURN, but the lab didn't record that.

## The card trick: nobody sends the cards

This is my favorite part. In an online card game, the intuition is that someone deals and sends each player their card. In Ito, **the cards never travel**.

When the round starts, each phone computes the deck on its own, and they all reach the same result. The secret is a **seeded pseudorandom generator**: an algorithm that produces numbers that look random but are always the same for the same seed (the starting text).

Like a recipe: same ingredients, same cake in any kitchen.

Ito's recipe has three steps:

1. The seed is the text `room code|game number|round number`.
2. A hash called xmur3 turns that text into a number, and the mulberry32 generator produces the "random" sequence from it.
3. The [Fisher-Yates](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) shuffle uses that sequence to shuffle the cards from 1 to 100.

In the snippet below, simplified from [js/core.js](https://github.com/sschonss/ito/blob/main/js/core.js), notice that the only input is the seed text: nothing comes from the network.

```javascript
// same input text, same deck on every phone
const rng = seed => mulberry32(xmur3(seed)());
const deckFor = (code, game, round) =>
  shuffle([...Array(100)].map((_, i) => i + 1), rng(`${code}|${game}|${round}`));
```

![The cards don't travel. The seed text, room code, game and round, goes through the xmur3 hash, the mulberry32 generator and the Fisher-Yates shuffle, and every phone ends up with the same deck from 1 to 100. Only decisions cross the network: playing a card, the order, votes and clues](/images/posts/how-ito-works/deck-en.svg)

Only **decisions** cross the network: "I played my card", "I arranged the order like this", votes and clues. Small messages, and no cards flying around.

The room code also carries the settings. It's 8 letters without I and O (so they aren't confused with 1 and 0):

- The first 4 are the random part of the room.
- The last 4 store, in base 24, the number of rounds and the chosen theme categories.

Whoever types the code already knows how the game was set up.

**In short:** with the same seed, every phone computes the same deck. Only the players' decisions cross the network.

## Who runs the game: the host

With several phones, who decides what's true? In Ito the rule is simple: **whoever creates the room is the host, and the host is the single source of truth**. The others are the guests.

The inspiration came from the host model I knew from online FIFA and EA FC matches, where one side hosts the game and the other connects to it. In Ito, the host is João's phone.

Only the host changes the game state. The **state** is a full snapshot of the game at that moment: who is in the room, the theme, who has played a card, the order on the table.

The phones talk using a few message types. The names are short because they show up in the code:

- **`act`** (action): a guest's request, like "I played my card".
- **`state`**: the full state, sent by the host on every change.
- **`ack`** (acknowledge): the guest says "I got version 8".
- **`tick`** (as in a clock's tick): a pulse the host sends every 2 seconds, with the version and a hash of the state.
- **`pull`**: the guest asks "send me the state again".

Each change bumps the state version (`ver`), a counter that only goes up, and the host sends the full state. A guest only accepts a state newer than the one it has.

The `tick` works like a referee who, every so often, checks the scoreboard with everyone. It carries the version and the hash of the state: if any detail differs, the hash changes. Anyone out of sync asks for the state again.

The snippet below is what a guest does on every `tick`. Look at the condition: if the version or the hash doesn't match what it has, it sends a `pull`.

```javascript
// on a guest, on every tick from the host
if (msg.ver !== my.ver || msg.h !== stateHash(my)) {
  guestSend({ t: 'pull' }); // "send me the state again"
}
```

The snippet is a simplified version of the `dispatch` function, in [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js), and the `tick` comes from the `syncTick` function, in the same file. The `pull` request doesn't go only to the host: it goes out signed to every connected phone, which will matter in the section about the mesh.

The full cycle, when Maria plays a card, including the signature covered in the next section:

![Sequence diagram between guest and host. 1: the guest sends act, "I played my card". 2: the host applies the rule, the version goes from 7 to 8, and it signs with the private key. 3: it sends state, version 8, with the signature. 4: the guest checks the signature with the public key pinned by the invite link's fingerprint. 5: the guest replies ack with the version and the hash. 6: every 2 seconds, the host sends tick with version and hash. 7: if the hash doesn't match, the guest sends pull. 8: the host resends the signed state. At the bottom, in red: a state without a valid signature or with an old version is dropped](/images/posts/how-ito-works/host-en.svg)

This fixes lost messages without anyone noticing. If the state with Maria's card gets lost on its way to some phone, on the next `tick` that phone notices the difference and asks again.

It isn't a fancy consensus algorithm (the kind that gets several machines to agree without a boss). It's one source of truth and a periodic check. For a game among friends, it's exactly what's needed.

You can see the difference in roles on screen. In the same round, captured in the lab, the host has the "Revelar nessa ordem" (reveal in this order) button and can change the theme; the guest only sees a note saying that, once everyone agrees, João reveals:

![Two real screenshots of the same Ito round, side by side, with the interface in Portuguese. On the left, the host's screen, João: the theme "Programas de TV de domingo" (Sunday TV shows), from 1, "sono" (boring), to 100, "imperdível" (must-watch), the "Mudar tema" (change theme) button, the face-down card and the red "Revelar nessa ordem" (reveal in this order) button. On the right, the guest's screen, Maria: the same theme and the same round 1 of 5, the face-down card and, instead of the button, the note "Quando todos concordarem, João revela" (when everyone agrees, João reveals)](/images/posts/how-ito-works/ito-partida-anfitriao-convidado.webp)

**In short:** only the host changes the state. Guests request actions, receive the versioned state and, every 2 seconds, check that they're up to date.

## Nobody impersonates the host: signatures

If the host is the truth, what stops someone from sending a fake state saying "I'm the host"? A [**digital signature**](https://developer.mozilla.org/en-US/docs/Glossary/Signature/Security).

The idea, without the math, uses a key pair (this is [public-key cryptography](https://developer.mozilla.org/en-US/docs/Glossary/Public-key_cryptography)):

- The **private key** is a stamp only you have, and it never leaves the device.
- The **public key** is a copy of the stamp's design. Anyone can use it to check whether a document was stamped by you, but nobody can stamp with it.

The first time it opens the game, each phone generates its key pair using [WebCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign), the cryptography API built into the browser, available only on secure pages served over HTTPS (the code is in [js/crypto.js](https://github.com/sschonss/ito/blob/main/js/crypto.js)).

The key type is **ECDSA P-256**. ECDSA (Elliptic Curve Digital Signature Algorithm) is a signature algorithm based on elliptic curves, and P-256 is the curve used. It's the same algorithm the server uses to stamp each send in [Web Push](/posts/how-web-push-works/).

In the game, it works like this:

- The host stamps (signs) every state, and everyone checks it.
- The state carries the room owner's public key, and the invite link carries its **fingerprint** (a short digest of the key). So Maria, who joined through the invite, already knows which stamp to expect.
- Each player's introduction when joining the room (the `hello` message) is signed too, so nobody can take someone else's seat.

The project itself is clear about the limit: this protects against a fake host, **not** against someone already in the room. Since cards are computed on the phone, someone who knows how to inspect the code in the browser could find out the numbers.

Preventing that would require a server holding the cards. For a game among friends, it's an acceptable trade-off.

**In short:** every state carries the host's stamp, and the invite says which stamp to expect. A fake state fails the check.

## When not everyone can reach the host: the mesh

So far, the story assumed the host was connected directly to each guest. In practice, not every pair of phones can open a channel: the hard NATs and UDP-blocking networks from the first part of the article apply to each pair separately.

Imagine a third player, Pedro, joins the room. João (the host) might have a channel to Maria, Maria might have a channel to Pedro, and Pedro might have no channel to João at all.

That's why Ito works as a **mesh**: a network in which each phone connects to whoever it can, and messages hop from one to the next until they arrive. It's like passing a note in class, from desk to desk.

The host is still the only source of truth and still signs the state. What changes is the route: whoever receives a signed state newer than the one they had forwards the same packet to the phones connected to them.

![Sequence diagram with three columns: João, the host; Maria, with a channel to both João and Pedro; and Pedro, with no direct channel to João. 1: João sends the state at version 12, signed, and Maria checks it and accepts because 12 is greater than 11. 2: Maria forwards the same signed packet, and Pedro checks João's signature. 3, in red: version 12 arrives again through the other network and Maria drops it without forwarding. 4: Pedro sends a hint signed by him, with an id. 5: Maria forwards the action untouched and João applies it once, moving to version 13. 6 and 7: state 13 goes from João to Maria and from Maria to Pedro. Pedro's screen shows "connected via Maria". At the bottom: whoever is in the middle only forwards and cannot change anything; and, in red, the limit: if Pedro has no channel to anyone in the room, there is no path to forward through, and TURN is what solves it](/images/posts/how-ito-works/mesh-en.svg)

### The state going out: from João to Maria, and from Maria to Pedro

In the diagram's example, João applies a move and sends the state at version 12, signed. Maria checks the signature, sees that 12 is greater than the 11 she had, accepts it and forwards the packet **exactly as it arrived**, with João's signature.

Pedro runs the same check with João's public key, not Maria's. For him, it doesn't matter which way the state came: the stamp is the host's.

Two rules hold this together:

- **The version sits inside the signed part.** `ver` is the counter that grows with every state change, as in the section about the host. Since it's part of what João signed, nobody in the middle can swap 12 for 99 without breaking the signature.
- **Only a strictly greater version is forwarded.** If version 12 arrives again (through the other signaling network, or back from Pedro himself), it isn't greater than the 12 Maria has already seen, so it isn't forwarded.

The second rule prevents two problems:

- A **loop**, where a message keeps going around between Maria and Pedro forever.
- A **replay**, where someone keeps an old, genuine, properly signed state and sends it again later to rewind the game. The old signature is still valid, but the old version doesn't get through.

Because the game is served over HTTPS, the browser makes WebCrypto available, and so every state is signed (on a page without HTTPS, the code would carry on without signing). Whoever is in the middle can't change a card, a point or the order: any change invalidates the stamp, and the state is dropped.

### Actions coming back the same way

The return path mirrors this. When Pedro gives a hint, plays his card, rearranges the order, votes, changes his name, leaves the room or writes in the chat, the request:

- goes out signed with **Pedro's** key;
- carries an `id`, a unique identifier for that request.

Maria checks the signature with Pedro's key, which she knows because the state's player list carries each player's public key. Then she forwards it to João without touching anything.

The `id` deals with duplicates: in a mesh, the same request can arrive through more than one path. João applies each `id` only once, so Pedro's hint never counts twice. And the signature stops Maria from inventing a move in Pedro's name or swapping his hint for another one.

Pedro's screen shows a discreet note, "conectado via Maria" (connected via Maria), so he knows he's playing through someone else. And the warning that the host dropped only shows up if that indirect path disappears too: as long as João's `tick` keeps arriving through Maria, nobody takes his place.

To see the code: forwarding the state (`spreadState`) and the actions lives in [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js), signing each request (`seal`) lives in [js/crypto.js](https://github.com/sschonss/ito/blob/main/js/crypto.js), and the full design of the mesh is in [docs/p2p.md](https://github.com/sschonss/ito/blob/main/docs/p2p.md) (in Portuguese), in the "Malha" section.

### What the mesh doesn't solve

The mesh only helps someone who has a channel to **someone** in the room. If Pedro can't open a channel to anyone, there's no path to forward through, and he stays out.

That's the case of hard NATs and UDP-blocking networks, and what solves it is Cloudflare's TURN, covered at the start: it gives Pedro a path to at least one of the other phones. One complements the other; neither replaces the other.

And Maria, even though she can't forge or change anything, can still simply stop forwarding. In that case Pedro gets no news, as if the connection had dropped.

**In short:** whoever can't reach the host gets the state secondhand. Whoever is in the middle can only forward, because the signature and the version block any change.

## What if the host drops?

The host is the source of truth, so it's also a single point of failure. Imagine João steps into an elevator and his phone loses signal.

If the host's phone loses its connection (on both networks) and doesn't come back within about 5 seconds, the connected player with the lowest seat number at the table becomes the **provisional host**.

- Only someone who received the current state in this session takes over.
- They bump the version (`ver + 1`) so everyone recognizes the new state.

When João, the room owner, comes back, he waits a moment to get the newest state from the provisional host and **takes over again**. The game continues where it stopped, without losing moves.

Signatures cover this case too: the provisional host's state is only accepted while the owner is away, and with a key everyone already knew. The host handover lives in the `considerHostLost` and `finishReclaim` functions, in [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js).

**In short:** if the host disappears, another player holds the game until João is back, and nobody loses a move.

## How to test something that depends on public networks

Depending on third-party relays and brokers is great until the day one of them changes. That's why Ito has two kinds of tests:

- **End-to-end tests with a fake relay:** tests that use the whole app the way a person would. They open several "phones" in a browser driven by [Playwright](https://playwright.dev/) (a tool that automates browsers) and swap the connection library for a fake one that imitates both networks inside the test itself. Fast, and no internet dependency.
- **A daily test on the real networks:** a [GitHub Actions](https://github.com/features/actions) workflow (an automated routine) runs every day, connects two browsers over the real internet and plays a round in three scenarios: Nostr only, MQTT only and both networks together. If a public relay or broker changes, the test warns me before anyone tries to play.

## Limits and what I learned

"No server" needs an asterisk: **there is no central server for the match**. There are still Nostr relays, MQTT brokers, STUN servers, Cloudflare's TURN (with my Worker) and the [CDNs](https://developer.mozilla.org/en-US/docs/Glossary/CDN) (networks of servers that deliver files) the library loads from.

All of them are third parties and can go down. The two networks and the fallback addresses reduce the risk but don't eliminate it. The game also needs internet for the first connection and, as I said, isn't cheat-proof among people already in the room.

What I take from the lab:

- **The browser knows a lot more than I imagined:** encrypted P2P connections and real cryptography, with nothing to install.
- **Sometimes the best way to sync is not to send anything at all:** the deterministic deck removed a whole category of problems.
- **One source of truth with versions and a check goes a long way:** before reaching for a consensus algorithm, ask whether a boss and a check every 2 seconds are enough.
- **Be honest about dependencies:** naming what belongs to third parties helps decide what to test every day.

Open [Ito](https://sschonss.github.io/ito/), create a room and call your friends: everything here really happens on your phone. And if you haven't read it yet, the context for why I built this is in [Programming is still fun](/posts/personal-projects-as-a-lab/). If you've played with WebRTC or have an idea for a P2P game, tell me in the comments.

## Quick glossary {#glossary}

Every term in the article, one line each, in the order they appear:

| Term | In one sentence |
| --- | --- |
| PWA | A website you can install and open like an app. |
| WebRTC | Browser technology for direct, real-time communication, the same one behind video calls. |
| Data channel | WebRTC's "pipe" for arbitrary data, such as moves. |
| P2P | Each device talks directly to the others, with no central server in the middle. |
| DTLS / TLS | The channel's encryption; TLS is the HTTPS padlock, and DTLS is the version for this kind of connection. |
| Public / private IP | A device's address; the public one works across the whole internet, the private one only at home. |
| Port | An extra number next to the address, like the apartment number on an envelope. |
| NAT | The router as doorman: one public address for the whole home, and only replies get in. |
| CGNAT | The carrier's NAT, with thousands of customers behind the same public address. |
| UDP | A fast packet type with no delivery confirmation, WebRTC's favorite. |
| ICE | The process that gathers possible addresses and tests which path works. |
| ICE candidate | An address where the phone might be reachable (`host`, `srflx` or `relay`). |
| STUN | A server that answers "this is how you look from outside". |
| Hole punching | Both sides send packets at the same time to open a path through the NATs. |
| TURN | A server that relays the encrypted data when the direct path doesn't open. |
| Signaling | The exchange of notes before the direct channel exists. |
| SDP | The connection's "spec sheet", traded as an offer and an answer. |
| Nostr relay / MQTT broker | Public servers Ito uses as a bulletin board for signaling. |
| Hash | A short fingerprint of a text; any change to the text changes the hash. |
| Idempotent | Receiving the same message twice is the same as receiving it once. |
| Seed | The starting text of a pseudorandom generator; same seed, same numbers. |
| Host / guest | Whoever created the room and owns the state / whoever joined and requests actions. |
| `act`, `state`, `ack`, `tick`, `pull` | Action request, full state, acknowledgment, check every 2 seconds and "send it again". |
| Digital signature | A stamp made with the private key and checked with the public key. |
| ECDSA P-256 | The algorithm and curve used for Ito's signatures. |
| Mesh | Each phone connects to whoever it can, and messages get passed along. |
| Replay | Resending an old, genuine message to rewind time; the version blocks it. |
| CDN | A network of servers that delivers files, such as the connection library. |
