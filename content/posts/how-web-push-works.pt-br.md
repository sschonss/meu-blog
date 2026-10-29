---
title: 'Web Push por debaixo dos panos: como uma notificação chega com a aba fechada'
date: 2026-11-02
description: 'Os três atores do Web Push, a assinatura VAPID, a criptografia e o que muda com um PWA instalado, com as saídas reais de um lab no Chrome contra o FCM.'
translationKey: how-web-push-works
tags: ['Arquitetura']
series: ['Estudos por curiosidade']
series_weight: 4
draft: false
---

Quase todo mundo já recebeu uma notificação de site com a aba fechada. Por trás dela tem três atores: o seu servidor, um serviço de entrega do navegador e um JavaScript que acorda sozinho. E um detalhe que eu acho bonito: o serviço do meio entrega a mensagem sem conseguir lê-la. Neste artigo eu explico esse caminho com as saídas reais de um laboratório rodado no Chrome, primeiro numa aba comum e depois com o site instalado como aplicativo (um PWA).

Ele faz par com [Trabalhar não é estudar](/pt-br/posts/personal-projects-as-a-lab/). O lab é o [lab-web-push-vapid](https://github.com/sschonss/lab-web-push-vapid): um servidor mínimo em Node.js, uma página, um manifesto e um service worker. Tudo aqui foi medido em 28 de outubro de 2026, com o Chrome 156 no Linux e a biblioteca [web-push](https://github.com/web-push-libs/web-push) 3.6.7. Onde algo foi simulado ou não foi testado, eu aviso.

## O problema: avisar alguém que não está olhando

Com a aba aberta, avisar é fácil: a página mantém uma conexão com o servidor. Com a aba fechada, não existe página. E o servidor não pode simplesmente "ligar" para o celular: o aparelho não tem endereço fixo, fica atrás de roteadores e operadoras, e uma conexão aberta para cada site gastaria bateria à toa.

A solução da web é a mesma dos apps de celular: **um único canal por navegador**, por onde chegam os avisos de todos os sites. É como uma caixa postal: o correio guarda a carta e entrega quando você passa.

## Os três atores

1. **O servidor de aplicação:** o seu backend. Guarda as inscrições e decide quando avisar.
2. **O push service:** o serviço de entrega do navegador. No Chrome é o FCM (Firebase Cloud Messaging, do Google), no Firefox é o da Mozilla, no Safari é o da Apple. Quem escolhe é o navegador, não você.
3. **O service worker:** um JavaScript que o site registra no navegador e que vive fora da aba ([MDN](https://developer.mozilla.org/pt-BR/docs/Web/API/Service_Worker_API)). O navegador o acorda quando chega um aviso, mesmo sem nenhuma aba do site aberta.

O protocolo entre o servidor e o push service é HTTP puro, definido no [RFC 8030](https://datatracker.ietf.org/doc/html/rfc8030): um `POST` numa URL. O diagrama abaixo mostra o caminho inteiro.

![Fluxo do Web Push. 1: a página chama pushManager.subscribe com a chave pública VAPID. 2: o push service devolve endpoint, p256dh e auth. 3: a página manda a inscrição ao servidor. A aba pode fechar. 4: o servidor faz POST no endpoint com o JWT VAPID e o corpo cifrado. 5: o push service responde 201, ou 410 se a inscrição morreu, e aí o servidor apaga. 6: o push service entrega ao service worker, que é acordado. 7: o service worker chama showNotification](/images/posts/how-web-push-works/flow-pt.svg)

## PWA: quando o site vira aplicativo

PWA (Progressive Web App) não é um framework. É um site comum com duas peças a mais, que permitem **instalá-lo** como aplicativo ([web.dev](https://web.dev/learn/pwa/), [MDN](https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps)):

- **O manifesto:** um JSON (`manifest.webmanifest`) com a "ficha" do app: nome, ícones, URL de início e como ele abre ([MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest)).
- **O service worker:** o mesmo do Web Push. Ele dá ao app o que uma página não tem: rodar sem aba aberta, receber push, funcionar offline.

Um manifesto mínimo se parece com isto (exemplo ilustrativo, não o arquivo do lab):

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

**Instalar.** Quando o site cumpre os [critérios do Chrome](https://web.dev/articles/install-criteria) (HTTPS, manifesto com nome, ícones de 192 e 512 px, `start_url` e um `display` como `standalone`, além de um pouco de interação da pessoa com a página), o navegador dispara o evento [`beforeinstallprompt`](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event). O site guarda esse evento e mostra o próprio botão de instalar; no clique, chama `event.prompt()` e o Chrome abre o diálogo nativo ([web.dev](https://web.dev/articles/customize-install)).

**Standalone.** Instalado, o app abre numa janela própria, sem barra de endereço, com ícone no menu do sistema. A página descobre isso com a media query [`display-mode`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/display-mode): `matchMedia('(display-mode: standalone)')`.

Por que isso importa para push? No desktop, o Chrome entrega push para uma aba comum também. Mas no iPhone e no iPad, desde o iOS 16.4, o [Web Push só funciona para web apps adicionados à Tela de Início](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/). E, como o lab mostrou, o clique na notificação pode abrir a janela do app, não uma aba.

No lab, o Chrome leu o manifesto sem erro, a lista de erros de instalabilidade (`Page.getInstallabilityErrors`, no DevTools Protocol) voltou vazia e o `beforeinstallprompt` disparou. O `prompt()` abriu o diálogo "Install app". Um detalhe que pegou o teste: o foco inicial fica no **Cancel**, o botão azul. Numa passada, o clique foi nele e nada foi instalado; a que vale clicou em **Install**.

![Página do lab no Chrome com o diálogo nativo Install app por cima: nome Lab Web Push com VAPID, origem 127.0.0.1:8788, botões Cancel, em destaque, e Install. A página diz Modo de exibição: browser](/images/posts/how-web-push-works/webpush-pwa-install.webp)

Instalado, o app abriu numa janela sem barra de endereço, com `matchMedia('(display-mode: standalone)')` verdadeiro. O lab rodou em `http://127.0.0.1`, que o navegador trata como origem segura; em produção, é HTTPS.

## Inscrição: o navegador te dá um endereço

Tudo começa com um clique em **Ativar notificações**: o navegador só pede permissão a partir de um gesto da pessoa. Se ela negar, o site não pode perguntar de novo.

Com a permissão, a página pede a inscrição ao navegador ([`PushManager.subscribe()`](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe)):

```javascript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,                              // todo push vira notificação visível
  applicationServerKey: urlBase64ToUint8Array(publicKey), // chave pública VAPID do servidor
});
```

`userVisibleOnly: true` é uma promessa que o Chrome exige: nada de push silencioso. A `applicationServerKey` é a **chave pública VAPID** do servidor. O navegador conversa com o push service e devolve três coisas:

- **`endpoint`:** uma URL única no push service, o "endereço da caixa postal". No lab: `https://fcm.googleapis.com/fcm/send/dHcP…E3xQ` (mascarado: quem tem essa URL e a chave privada consegue mandar push).
- **`p256dh`:** a chave pública de criptografia daquele navegador (65 bytes, medido no lab).
- **`auth`:** um segredo de 16 bytes, também medido.

A página manda esse JSON para o servidor, que guarda. Daqui em diante, a aba pode fechar.

## Envio: assinar e cifrar

Para avisar, o servidor faz um `POST` no `endpoint`. Este é o pedido real que o processo Node escreveu para o FCM no lab:

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

**`TTL`** diz por quanto tempo o push service guarda a mensagem se o aparelho estiver offline (aqui, uma hora); **`Urgency`** ajuda o aparelho a decidir se vale acordar agora; **`Topic`** faz uma mensagem nova substituir uma antiga não entregue. `Authorization` e `Content-Encoding` são as duas provas que fazem o Web Push funcionar.

### Prova 1: quem envia (VAPID)

O [VAPID](https://datatracker.ietf.org/doc/html/rfc8292) (Voluntary Application Server Identification, RFC 8292) é como o servidor se identifica. A chave pública foi entregue ao navegador na inscrição; a privada nunca sai do servidor. A cada envio, o servidor monta um **JWT** (um bilhete em JSON com assinatura) e assina com **ES256** (ECDSA na curva P-256). Pense num carimbo: só o servidor tem o carimbo, e todo mundo tem o desenho dele para conferir. O JWT vai no `t=`, e a chave pública no `k=`. Decodificado, o do lab era:

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

O **`aud`** é a origem do push service; o **`exp`**, 1793269014, é 29/10 às 07:16 (BRT), **12 horas** depois do envio (o RFC permite até 24); o **`sub`** é um contato do dono do servidor. Sem a chave privada, ninguém mais manda push para aquela inscrição, mesmo descobrindo o `endpoint`. No lab, a assinatura foi conferida com a chave do `k=` e bateu.

### Prova 2: só o navegador lê (criptografia da mensagem)

O corpo é o JSON da notificação **cifrado** para aquele navegador, como manda o [RFC 8291](https://datatracker.ietf.org/doc/html/rfc8291), no formato `aes128gcm` do [RFC 8188](https://datatracker.ietf.org/doc/html/rfc8188). Em linguagem comum:

1. O servidor gera um par de chaves descartável e combina com a `p256dh` (**ECDH**: dois lados chegam ao mesmo segredo sem enviá-lo).
2. Mistura esse segredo com o `auth` (**HKDF**, uma "batedeira" que gera uma chave do tamanho certo).
3. Cifra com **AES-128-GCM**, que embaralha e detecta se alguém mexeu nos bytes.

No lab, o servidor pediu para cifrar `{"title":"Lab Web Push","body":"Disparo com a página ainda aberta.","url":"/"}`, e o que foi no fio para o FCM foram 182 bytes assim (início, em base64):

```text
up0IdDqUjddJJ6BRZBs3bgAAEABBBFVesIOZiJ6vLr15vPgvvmSHkXvqmQco4r67M4qgM4SSurodkhcr…
```

O texto em claro não aparece dentro desses bytes. O service worker leu e devolveu o JSON igual, caractere por caractere.

![As duas provas do Web Push. O VAPID, um JWT assinado com ES256, prova ao push service quem envia. A criptografia com p256dh e auth, ECDH, HKDF e AES-128-GCM, faz só o navegador ler. No meio, o push service vê o endpoint, os cabeçalhos e os bytes cifrados, mas não o texto](/images/posts/how-web-push-works/trust-pt.svg)

O FCM respondeu `HTTP 201`, corpo vazio. **201 Created** quer dizer "recebi e vou entregar", não "a pessoa viu".

## Entrega: o service worker acorda

Quando a mensagem chega, o navegador acorda o service worker e dispara o evento `push`. O handler do lab:

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

O `waitUntil` pede ao navegador para não dormir de novo antes da notificação ser criada. No clique, outro evento, [`notificationclick`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event), procura uma janela do site com `clients.matchAll()`: se achar, chama `focus()`; se não, abre a URL com [`clients.openWindow()`](https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow).

Na primeira rodada, a aba comum foi fechada e o servidor mandou outro push. O FCM respondeu 201, e o service worker, **sem aba aberta**, devolveu `{"title":"Prova no Chrome","body":"Disparo com a aba fechada.","url":"/"}`. O Chrome registrou a notificação, mas não apareceu um popup do sistema, e o clique ficou sem teste. A rodada com o PWA fechou essas duas lacunas.

## Do começo ao fim com o app instalado

Na rodada do PWA, o lab subiu um servidor de notificações (o dunst) no display, para a notificação do sistema aparecer e poder ser clicada. Com o app instalado, a permissão concedida e a inscrição feita, o teste passou por cada estado da janela (horários em BRT, noite de 28 de outubro):

| Estado do app | Resposta do FCM | O que aconteceu |
| --- | --- | --- |
| Em primeiro plano | **410** às 23:29:31 e às 23:29:35 | nada exibido; o servidor apagou a inscrição |
| Minimizado | **201** às 23:29:40 | o service worker leu, notificação do sistema apareceu |
| Janela fechada, Chrome aberto | **201** às 23:29:42 | o service worker leu, notificação apareceu, clique abriu o app |
| Chrome encerrado | **201** às 23:29:46 | nada até o Chrome voltar; aí chegou |

Com a janela minimizada, o service worker leu `{"title":"PWA minimizado","body":"A janela do aplicativo foi minimizada.","url":"/"}` e a notificação apareceu na tela:

![Notificação do sistema com o ícone de sino do lab, o título PWA minimizado, a origem 127.0.0.1:8788 e o texto A janela do aplicativo foi minimizada](/images/posts/how-web-push-works/webpush-pwa-notification.webp)

Depois, o teste fechou as janelas do site e deixou o processo do Chrome vivo. O FCM respondeu 201, o service worker leu `{"title":"PWA com a janela fechada","body":"A janela foi fechada. O Chrome segue aberto.","url":"/"}` e a notificação apareceu. Aí veio o clique, pela ação padrão do servidor de notificações, sem evento fabricado na página. O service worker registrou:

```json
{
  "url": "http://127.0.0.1:8788/",
  "action": "openWindow",
  "focused": false,
  "opened": true,
  "clientCount": 0
}
```

`clientCount: 0` quer dizer que não havia janela do site aberta, então o código não chamou `focus()`: chamou `clients.openWindow()`, que devolveu sucesso. E a janela que apareceu foi a **do aplicativo instalado**, sem barra de endereço, em `display-mode: standalone`.

![Janela do app instalado aberta pelo clique na notificação: título Lab Web Push com VAPID, sem barra de endereço, e a página mostrando Modo de exibição: standalone](/images/posts/how-web-push-works/webpush-pwa-click-standalone.webp)

(A frase "O Chrome ainda não ofereceu a instalação" é esperada: um app instalado não recebe `beforeinstallprompt` de novo.)

Por último, o teste encerrou o Chrome por completo, sem processo nenhum, e mandou mais um push. O FCM respondeu **201**, mas nos 15 segundos com o Chrome morto nada chegou. Quando o mesmo perfil foi reaberto, às 23:30:04, o service worker leu a mensagem e a notificação apareceu.

## Quando dá errado

**A inscrição morre.** A pessoa revoga a permissão, limpa os dados do site ou desinstala o PWA. Aí o push service responde **404 ou 410** (Gone), e o servidor deve apagar a inscrição. No lab, a página cancelou a inscrição no navegador (`subscription.unsubscribe()`) sem avisar o servidor. A surpresa: o envio no segundo seguinte **ainda voltou 201**. Cerca de um minuto depois, o mesmo endpoint respondeu:

```text
HTTP 410
date: Wed, 28 Oct 2026 22:18:06 GMT

push subscription has unsubscribed or expired.
```

O servidor apagou o registro. O 410 é a limpeza garantida, mas não é instantâneo; se a página puder avisar o servidor ao cancelar, melhor. Existe ainda o evento `pushsubscriptionchange`, mas o [MDN](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/pushsubscriptionchange_event) marca o suporte como limitado, e o lab não conseguiu afirmar se ele disparou.

**Um 201 não é garantido, nem para inscrição nova.** Numa segunda execução na aba comum, uma inscrição recém-criada levou 410 já no primeiro envio. Com o app instalado em primeiro plano, os dois envios também levaram 410, com a mesma frase, e nada apareceu. A única notificação em primeiro plano observada foi a de uma aba, antes da instalação. O lab não descobriu a causa. Uma **hipótese**, não confirmada: o problema pode estar naquela inscrição, e não no primeiro plano, já que a inscrição seguinte levou 201 em todos os outros estados. Mas ela não foi testada em primeiro plano, então isso segue em aberto.

**Navegador fechado não é aba fechada.** Com o Chrome encerrado, o push service aceita e guarda, mas a notificação só aparece quando o navegador volta. Se o `TTL` vencer antes, ela não chega.

**Janela anônima.** O Chrome recusa push no modo anônimo, e a página só vê `Registration failed - permission denied`, sem como detectar isso antes.

## O que foi simulado e o que não foi testado

- **De verdade:** a instalação pelo diálogo nativo e a janela standalone; a inscrição no FCM; os 201 e a leitura pelo service worker com a aba fechada, o app minimizado e a janela fechada; a notificação na tela; o clique abrindo o app; a entrega depois de reabrir o Chrome; os 410 e a limpeza.
- **Simulado:** um push service HTTPS falso, em `127.0.0.1`, para ver os bytes crus que chegam ao "carteiro": 202 bytes cifrados, sem o texto (e o `aud` do JWT virou `https://127.0.0.1:8799`, porta incluída). A decifração dessa mensagem foi feita com uma chave gerada pelo próprio teste, não pelo service worker. E a notificação que o lab mandou ao dunst antes de tudo, só para ver se ele desenhava, é sintética, não Web Push.
- **Não testado:** iPhone, iPad e Safari; Firefox; Android; o ramo do `focus()` numa janela já aberta; o `pushsubscriptionchange`; e o push com o app instalado em primeiro plano numa inscrição que o FCM aceitasse.

## O que isso ensina sobre a web

- **Separar "quem envia" de "quem lê" é um padrão poderoso:** a assinatura prova a origem, a criptografia protege o conteúdo, e o intermediário (o Google, aqui) só transporta, sem conseguir abrir.
- **Status HTTP contam a história:** 201 é "aceito", não "visto", nem com o navegador fechado; 410 é "pode apagar", mas pode demorar.
- **Um PWA é um site com duas peças a mais:** quem faz o push chegar é o service worker; a instalação muda para onde o clique leva.
- **Plataforma importa:** o mesmo código se comporta diferente em janela anônima, no Chrome, no iPhone.

O código e o caderno com todas as saídas estão no [lab-web-push-vapid](https://github.com/sschonss/lab-web-push-vapid). Para referência, o [web.dev](https://web.dev/articles/push-notifications-overview) tem um panorama de push e um [curso de PWA](https://web.dev/learn/pwa/), e a [Push API no MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) detalha cada peça. O contexto de por que esse lab existe está em [Trabalhar não é estudar](/pt-br/posts/personal-projects-as-a-lab/). Se você já colocou Web Push em produção, me conta nos comentários o que te surpreendeu.
