---
title: 'Web Push under the hood: how a notification arrives with the tab closed'
date: 2026-11-02
description: "Web Push's three players, the VAPID signature, the encryption and what changes with an installed PWA, with real outputs from a lab in Chrome against FCM."
translationKey: how-web-push-works
tags: ['Architecture']
series: ['Studying out of curiosity']
series_weight: 4
draft: false
---

Almost everyone has received a website notification with the tab closed. Behind it there are three players: your server, a delivery service that belongs to the browser, and a piece of JavaScript that wakes up on its own. And a detail I find beautiful: the service in the middle delivers the message without being able to read it. In this article I walk through that path with real outputs from a lab run in Chrome, first in a regular tab and then with the site installed as an app (a PWA).

It's a companion to [Working is not studying](/posts/personal-projects-as-a-lab/). The lab is [lab-web-push-vapid](https://github.com/sschonss/lab-web-push-vapid): a minimal Node.js server, a page, a manifest and a service worker. Everything here was measured on October 28, 2026, with Chrome 156 on Linux and the [web-push](https://github.com/web-push-libs/web-push) library 3.6.7. Where something was simulated or not tested, I say so.

## The problem: notifying someone who isn't looking

With the tab open, notifying is easy: the page keeps a connection to the server. With the tab closed, there is no page. And the server can't just "call" the phone: the device has no fixed address, sits behind routers and carriers, and keeping a connection open for every site would waste battery.

The web's answer is the same as for mobile apps: **a single channel per browser**, through which notices from every site arrive. It's like a post office box: the post office holds the letter and hands it over when you stop by.

## The three players

1. **The application server:** your backend. It stores the subscriptions and decides when to notify.
2. **The push service:** the browser's delivery service. In Chrome it's FCM (Firebase Cloud Messaging, from Google), in Firefox it's Mozilla's, in Safari it's Apple's. The browser chooses, not you.
3. **The service worker:** JavaScript that the site registers in the browser and that lives outside the tab ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)). The browser wakes it up when a notice arrives, even with no tab of the site open.

The protocol between the server and the push service is plain HTTP, defined in [RFC 8030](https://datatracker.ietf.org/doc/html/rfc8030): a `POST` to a URL. The diagram below shows the whole path.

![Web Push flow. 1: the page calls pushManager.subscribe with the VAPID public key. 2: the push service returns endpoint, p256dh and auth. 3: the page sends the subscription to the server. The tab may close. 4: the server POSTs to the endpoint with the VAPID JWT and the encrypted body. 5: the push service answers 201, or 410 if the subscription is dead, and then the server deletes it. 6: the push service delivers to the service worker, which wakes up. 7: the service worker calls showNotification](/images/posts/how-web-push-works/flow-en.svg)

## PWA: when the site becomes an app

A PWA (Progressive Web App) is not a framework. It's a regular site with two extra pieces that let you **install** it as an app ([web.dev](https://web.dev/learn/pwa/), [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)):

- **The manifest:** a JSON file (`manifest.webmanifest`) with the app's "ID card": name, icons, start URL and how it opens ([MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest)).
- **The service worker:** the same one from Web Push. It gives the app what a page doesn't have: running with no tab open, receiving push, working offline.

A minimal manifest looks like this (an illustrative example, not the lab's file):

```json
{
  "name": "Lab Web Push com VAPID",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Installing.** When the site meets [Chrome's criteria](https://web.dev/articles/install-criteria) (HTTPS, a manifest with a name, 192 and 512 px icons, `start_url` and a `display` such as `standalone`, plus a bit of user interaction with the page), the browser fires the [`beforeinstallprompt`](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event) event. The site keeps that event and shows its own install button; on click, it calls `event.prompt()` and Chrome opens the native dialog ([web.dev](https://web.dev/articles/customize-install)).

**Standalone.** Once installed, the app opens in its own window, with no address bar and an icon in the system menu. The page finds out through the [`display-mode`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/display-mode) media query: `matchMedia('(display-mode: standalone)')`.

Why does this matter for push? On desktop, Chrome delivers push to a regular tab too. But on iPhone and iPad, since iOS 16.4, [Web Push only works for web apps added to the Home Screen](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/). And, as the lab showed, clicking the notification can open the app's window, not a tab.

In the lab, Chrome read the manifest with no errors, the list of installability errors (`Page.getInstallabilityErrors`, in the DevTools Protocol) came back empty, and `beforeinstallprompt` fired. `prompt()` opened the "Install app" dialog. One detail that tripped up the test: initial focus is on **Cancel**, the blue button. In one pass the click landed on it and nothing was installed; the run that counts clicked **Install**.

![The lab page in Chrome with the native Install app dialog on top: name Lab Web Push com VAPID, origin 127.0.0.1:8788, Cancel button highlighted, and Install. The page reads Modo de exibição: browser](/images/posts/how-web-push-works/webpush-pwa-install.webp)

Once installed, the app opened in a window with no address bar, with `matchMedia('(display-mode: standalone)')` true. The lab ran on `http://127.0.0.1`, which the browser treats as a secure origin; in production, it's HTTPS.

## Subscribing: the browser gives you an address

It all starts with a click on **Ativar notificações** ("Enable notifications"): the browser only asks for permission from a user gesture. If the person denies it, the site can't ask again.

With permission granted, the page asks the browser for a subscription ([`PushManager.subscribe()`](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe)):

```javascript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,                              // every push becomes a visible notification
  applicationServerKey: urlBase64ToUint8Array(publicKey), // the server's VAPID public key
});
```

`userVisibleOnly: true` is a promise Chrome requires: no silent push. The `applicationServerKey` is the server's **VAPID public key**. The browser talks to the push service and returns three things:

- **`endpoint`:** a unique URL on the push service, the "mailbox address". In the lab: `https://fcm.googleapis.com/fcm/send/dHcP…E3xQ` (masked: whoever has this URL and the private key can send push).
- **`p256dh`:** that browser's public encryption key (65 bytes, measured in the lab).
- **`auth`:** a 16-byte secret, also measured.

The page sends this JSON to the server, which stores it. From here on, the tab can close.

## Sending: sign and encrypt

To notify, the server makes a `POST` to the `endpoint`. This is the real request the Node process wrote to FCM in the lab:

```text
POST /fcm/send/dHcP…E3xQ
host: fcm.googleapis.com
ttl: 3600
urgency: high
topic: lab
content-type: application/octet-stream
content-encoding: aes128gcm
content-length: 182
authorization: vapid t=eyJ0eXAiOiJK…Y1qM-A, k=BPTww8…HZro
```

**`TTL`** says how long the push service keeps the message if the device is offline (here, one hour); **`Urgency`** helps the device decide whether it's worth waking up now; **`Topic`** makes a new message replace an older undelivered one. `Authorization` and `Content-Encoding` are the two proofs that make Web Push work.

### Proof 1: who is sending (VAPID)

[VAPID](https://datatracker.ietf.org/doc/html/rfc8292) (Voluntary Application Server Identification, RFC 8292) is how the server identifies itself. The public key was handed to the browser at subscription time; the private key never leaves the server. On every send, the server builds a **JWT** (a signed JSON ticket) and signs it with **ES256** (ECDSA on the P-256 curve). Think of a rubber stamp: only the server has the stamp, and everyone has its design to check against. The JWT goes in `t=`, and the public key in `k=`. Decoded, the lab's was:

```json
{
  "header": { "typ": "JWT", "alg": "ES256" },
  "payload": {
    "aud": "https://fcm.googleapis.com",
    "exp": 1793269014,
    "sub": "mailto:webpush-lab@luizschons.com"
  }
}
```

**`aud`** is the push service's origin; **`exp`**, 1793269014, is Oct 29 at 07:16 (BRT, UTC-3), **12 hours** after the send (the RFC allows up to 24); **`sub`** is a contact for the server's owner. Without the private key, nobody else can send push to that subscription, even if they find the `endpoint`. In the lab, the signature was checked against the key in `k=` and it matched.

### Proof 2: only the browser reads (message encryption)

The body is the notification JSON **encrypted** for that browser, as [RFC 8291](https://datatracker.ietf.org/doc/html/rfc8291) requires, in the `aes128gcm` format from [RFC 8188](https://datatracker.ietf.org/doc/html/rfc8188). In plain words:

1. The server generates a throwaway key pair and combines it with `p256dh` (**ECDH**: two sides reach the same secret without sending it).
2. It mixes that secret with `auth` (**HKDF**, a "blender" that produces a key of the right size).
3. It encrypts with **AES-128-GCM**, which scrambles and detects if anyone tampered with the bytes.

In the lab, the server asked to encrypt `{"title":"Lab Web Push","body":"Disparo com a página ainda aberta.","url":"/"}` ("Sent with the page still open"), and what went over the wire to FCM was 182 bytes like this (start, in base64):

```text
up0IdDqUjddJJ6BRZBs3bgAAEABBBFVesIOZiJ6vLr15vPgvvmSHkXvqmQco4r67M4qgM4SSurodkhcr…
```

The plaintext doesn't appear inside those bytes. The service worker read it and returned the same JSON, character for character.

![The two proofs of Web Push. VAPID, a JWT signed with ES256, proves to the push service who is sending. Encryption with p256dh and auth, ECDH, HKDF and AES-128-GCM, makes sure only the browser reads. In the middle, the push service sees the endpoint, the headers and the encrypted bytes, but not the text](/images/posts/how-web-push-works/trust-en.svg)

FCM answered `HTTP 201`, empty body. **201 Created** means "received, will deliver", not "the person saw it".

## Delivery: the service worker wakes up

When the message arrives, the browser wakes the service worker and fires the `push` event. The lab's handler:

```javascript
self.addEventListener('push', (event) => {
  const payload = readPayload(event.data ? event.data.text() : '');
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    tag: 'lab-web-push',
    data: { url: payload.url },
  }));
});
```

`waitUntil` asks the browser not to go back to sleep before the notification is created. On click, another event, [`notificationclick`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event), looks for a window of the site with `clients.matchAll()`: if it finds one, it calls `focus()`; if not, it opens the URL with [`clients.openWindow()`](https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow).

In the first round, the regular tab was closed and the server sent another push. FCM answered 201, and the service worker, **with no tab open**, returned `{"title":"Prova no Chrome","body":"Disparo com a aba fechada.","url":"/"}` ("Sent with the tab closed"). Chrome registered the notification, but no system popup appeared, and the click went untested. The PWA round closed both gaps.

## End to end with the installed app

In the PWA round, the lab started a notification server (dunst) on the display, so the system notification would appear and could be clicked. With the app installed, permission granted and the subscription made, the test went through each window state (times in BRT, UTC-3, on the night of October 28):

| App state | FCM response | What happened |
| --- | --- | --- |
| Foreground | **410** at 23:29:31 and 23:29:35 | nothing shown; the server deleted the subscription |
| Minimized | **201** at 23:29:40 | the service worker read it, system notification appeared |
| Window closed, Chrome running | **201** at 23:29:42 | the service worker read it, notification appeared, click opened the app |
| Chrome quit | **201** at 23:29:46 | nothing until Chrome came back; then it arrived |

With the window minimized, the service worker read `{"title":"PWA minimizado","body":"A janela do aplicativo foi minimizada.","url":"/"}` ("PWA minimized", "The app window was minimized") and the notification appeared on screen:

![System notification with the lab's bell icon, the title PWA minimizado, the origin 127.0.0.1:8788 and the text A janela do aplicativo foi minimizada](/images/posts/how-web-push-works/webpush-pwa-notification.webp)

Next, the test closed the site's windows and left the Chrome process alive. FCM answered 201, the service worker read `{"title":"PWA com a janela fechada","body":"A janela foi fechada. O Chrome segue aberto.","url":"/"}` ("The window was closed. Chrome is still open.") and the notification appeared. Then came the click, through the notification server's default action, with no event faked on the page. The service worker logged:

```json
{
  "url": "http://127.0.0.1:8788/",
  "action": "openWindow",
  "focused": false,
  "opened": true,
  "clientCount": 0
}
```

`clientCount: 0` means there was no window of the site open, so the code didn't call `focus()`: it called `clients.openWindow()`, which returned success. And the window that appeared was **the installed app's**, with no address bar, in `display-mode: standalone`.

![The installed app's window opened by the notification click: title Lab Web Push com VAPID, no address bar, and the page showing Modo de exibição: standalone](/images/posts/how-web-push-works/webpush-pwa-click-standalone.webp)

(The line "O Chrome ainda não ofereceu a instalação", "Chrome hasn't offered installation yet", is expected: an installed app doesn't get `beforeinstallprompt` again.)

Finally, the test quit Chrome completely, no process left, and sent one more push. FCM answered **201**, but in the 15 seconds with Chrome dead nothing arrived. When the same profile was reopened, at 23:30:04, the service worker read the message and the notification appeared.

## When things go wrong

**The subscription dies.** The person revokes permission, clears the site's data or uninstalls the PWA. Then the push service answers **404 or 410** (Gone), and the server should delete the subscription. In the lab, the page cancelled the subscription in the browser (`subscription.unsubscribe()`) without telling the server. The surprise: the send one second later **still returned 201**. About a minute later, the same endpoint answered:

```text
HTTP 410
date: Wed, 28 Oct 2026 22:18:06 GMT

push subscription has unsubscribed or expired.
```

The server deleted the record. The 410 is the guaranteed cleanup, but it isn't instant; if the page can tell the server when it unsubscribes, better. There's also the `pushsubscriptionchange` event, but [MDN](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/pushsubscriptionchange_event) marks its support as limited, and the lab couldn't tell whether it fired.

**A 201 isn't guaranteed, not even for a new subscription.** In a second run in the regular tab, a freshly created subscription got 410 on the very first send. With the installed app in the foreground, both sends also got 410, with the same message, and nothing appeared. The only foreground notification observed was in a tab, before installation. The lab didn't find the cause. A **hypothesis**, not confirmed: the problem may lie in that subscription, not in the foreground, since the next subscription got 201 in every other state. But it wasn't tested in the foreground, so this remains open.

**A closed browser is not a closed tab.** With Chrome quit, the push service accepts and stores, but the notification only appears when the browser comes back. If the `TTL` expires first, it never arrives.

**Incognito window.** Chrome refuses push in incognito mode, and the page only sees `Registration failed - permission denied`, with no way to detect it beforehand.

## What was simulated and what wasn't tested

- **Real:** installation through the native dialog and the standalone window; the FCM subscription; the 201s and the service worker reading the message with the tab closed, the app minimized and the window closed; the notification on screen; the click opening the app; delivery after reopening Chrome; the 410s and the cleanup.
- **Simulated:** a fake HTTPS push service on `127.0.0.1`, to see the raw bytes that reach the "mail carrier": 202 encrypted bytes, without the text (and the JWT's `aud` became `https://127.0.0.1:8799`, port included). Decrypting that message was done with a key generated by the test itself, not by the service worker. And the notification the lab sent to dunst beforehand, just to check it would draw, is synthetic, not Web Push.
- **Not tested:** iPhone, iPad and Safari; Firefox; Android; the `focus()` branch on an already open window; `pushsubscriptionchange`; and push with the installed app in the foreground on a subscription FCM accepted.

## What this teaches about the web

- **Separating "who sends" from "who reads" is a powerful pattern:** the signature proves the origin, encryption protects the content, and the middleman (Google, here) only carries it, unable to open it.
- **HTTP status codes tell the story:** 201 is "accepted", not "seen", not even with the browser closed; 410 is "you can delete", but it may take a while.
- **A PWA is a site with two extra pieces:** the service worker is what makes push arrive; installation changes where the click takes you.
- **Platform matters:** the same code behaves differently in incognito, in Chrome, on the iPhone.

The code and the notebook with every output are in [lab-web-push-vapid](https://github.com/sschonss/lab-web-push-vapid). For reference, [web.dev](https://web.dev/articles/push-notifications-overview) has a push overview and a [PWA course](https://web.dev/learn/pwa/), and the [Push API on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) details each piece. The context for why this lab exists is in [Working is not studying](/posts/personal-projects-as-a-lab/). If you've shipped Web Push to production, tell me in the comments what surprised you.
