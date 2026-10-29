---
title: 'Ito por debaixo dos panos: multiplayer P2P no navegador sem servidor de jogo'
date: 2026-11-02
description: 'Como vários celulares jogam juntos a partir de um site estático: WebRTC, sinalização por Nostr e MQTT, STUN e TURN, um baralho que ninguém envia e um anfitrião que assina o estado.'
translationKey: how-ito-works
tags: ['WebRTC', 'Arquitetura']
series: ['Estudos por curiosidade']
series_weight: 3
draft: false
---

O [Ito](https://sschonss.github.io/ito/) é um jogo de cartas cooperativo em que cada pessoa joga no próprio celular. O site é só um punhado de arquivos estáticos no [GitHub Pages](https://pages.github.com/), e não existe um servidor central cuidando da partida. Mesmo assim, até dez celulares jogam juntos, em tempo real, conversando direto entre si. Este artigo conta como isso funciona, e o código está aberto no [repositório do Ito](https://github.com/sschonss/ito).

Ele faz par com [Trabalhar não é estudar](/pt-br/posts/personal-projects-as-a-lab/), em que eu falo de onde o estudo foi parar na era da IA. Não é tutorial: é uma explicação com diagramas, capturas reais de um lab e trechos de código simplificados. Não precisa entender de redes, eu explico cada termo quando ele aparecer.

## O desafio: um site estático e vários celulares

O jeito tradicional de fazer um jogo multiplayer é ter um servidor no meio. Cada celular manda a jogada para o servidor, e o servidor repassa para os outros. É como um grupo de amigos que só conversa por meio de um mediador.

O GitHub Pages não roda meu código: ele só entrega arquivos (HTML, CSS, JavaScript). Então a pergunta do laboratório era: dá para os celulares conversarem **direto entre si**, sem mediador?

Dá, com o [WebRTC](https://webrtc.org/) (Web Real-Time Communication), a tecnologia que os navegadores usam para videochamadas. Além de áudio e vídeo, ele tem o [**data channel**](https://developer.mozilla.org/pt-BR/docs/Web/API/RTCDataChannel), um canal para mandar dados quaisquer entre dois navegadores. Esse modelo se chama **P2P** (peer-to-peer, "de par para par"): cada celular fala com os outros sem passar por um servidor central. E o canal é criptografado com **DTLS**, a versão do TLS (o cadeado do HTTPS) para esse tipo de conexão.

Só tem um porém: para abrir esse canal, os dois lados precisam se encontrar primeiro, e a internet não facilita isso. O resto do artigo é a história desse encontro, e depois do que acontece quando ele dá certo. O mapa geral é este (o desenho completo da rede está documentado em [docs/p2p.md](https://github.com/sschonss/ito/blob/main/docs/p2p.md)):

![Visão geral do Ito. O anfitrião e o convidado usam relays Nostr e brokers MQTT só para se encontrarem, trocando SDP e candidatos ICE. Depois, conversam por um canal WebRTC direto, criptografado com DTLS. Ao lado, o STUN ajuda cada celular a descobrir o endereço público, e um TURN da Cloudflare, com credenciais de 24 horas entregues por um Worker, repassa os dados quando o caminho direto é bloqueado. O GitHub Pages só serve os arquivos do site](/images/posts/how-ito-works/overview-pt.svg)

Não se preocupe se metade dos nomes do desenho ainda não fizer sentido. Cada um aparece nas próximas seções, com exemplo.

### Como é o jogo na tela

Para ter uma ideia do que está sendo sincronizado, estas são capturas reais do Ito publicado, feitas num navegador com tela de celular (a interface do jogo é só em português). À esquerda, a tela inicial, onde se cria a sala. À direita, a sala com duas pessoas: o código da sala no topo, os botões de convite e a lista de quem já entrou, com o anfitrião marcado.

![Duas capturas reais do Ito no celular, lado a lado. À esquerda, a tela inicial, com o título "Pense no número. Fale o tema." e o cartão "Criar sala", com o número de rodadas e as categorias de tema. À direita, a sala vista pelo anfitrião: o código FVGZ-FYFH no topo, os botões Copiar, QR code e Convidar, e a lista "Na sala" com João, marcado como você e anfitrião, e Maria, os dois com bolinha verde de conectados. Embaixo, o botão "Começar partida"](/images/posts/how-ito-works/ito-telas-inicio-sala.webp)

Essas duas pessoas eram duas janelas de navegador no lab, cada uma fingindo ser um celular. O nome da Maria apareceu na lista do anfitrião porque os dois navegadores conseguiram abrir o canal direto. Como isso acontece é o assunto daqui para frente.

## Um pouco de rede, sem ser especialista

Antes de falar de WebRTC, vale entender por que dois celulares não conseguem simplesmente "ligar" um para o outro. São três ideias: endereço IP, endereço privado e NAT.

### Endereço IP: o endereço de entrega

Todo aparelho conectado tem um **endereço IP**, um número que diz para onde os pacotes de dados devem ir, como o endereço numa carta. Algo como `203.0.113.5`.

Só que existem dois tipos:

- **Endereço público:** único na internet inteira. Qualquer um no mundo consegue mandar pacotes para ele.
- **Endereço privado:** só vale dentro de uma rede local, como a sua casa. Faixas como `192.168.x.x` e `10.x.x.x` são reservadas para isso, e milhões de casas usam os mesmos números ao mesmo tempo. O `192.168.0.10` da sua casa e o da casa do vizinho são aparelhos diferentes.

Todos os endereços deste artigo são **exemplos**, tirados de faixas reservadas para documentação. Nenhum é de um aparelho de verdade.

### NAT: um prédio com um endereço só

Se cada casa usa endereços privados, como os dados chegam até o seu celular? Pelo **NAT** (Network Address Translation, "tradução de endereços de rede"), que roda no roteador.

Pense num prédio. A rua só conhece o endereço do prédio (o IP público, `203.0.113.5`). Lá dentro, cada apartamento tem um número (o IP privado, `192.168.0.10`, `192.168.0.11`). O roteador é o porteiro: quando um morador manda uma carta para fora, ele anota "a resposta para esta carta é do apartamento 10" e troca o remetente pelo endereço do prédio. Quando a resposta chega, ele consulta a anotação e entrega no apartamento certo. Na prática, a anotação usa uma **porta**, um número extra que vai junto com o endereço (como em `203.0.113.5:61000`).

O detalhe que importa: o porteiro só entrega o que é **resposta** a algo que um morador mandou. Uma carta que chega de fora sem ninguém ter pedido não tem anotação, então ela é descartada. Isso é ótimo para segurança e péssimo para quem quer conexão direta.

### Por que um celular no 4G e outro no Wi-Fi não se acham

Agora junte as peças. O celular A está no Wi-Fi de casa, com o endereço privado `192.168.0.10`, atrás do roteador. O celular B está no 4G. As operadoras móveis têm tantos clientes que fazem um NAT em escala, chamado **CGNAT** (Carrier-Grade NAT, o NAT da operadora): o celular recebe um endereço interno (algo como `100.64.12.7`) e divide um endereço público com milhares de outros clientes.

![Diagrama de NAT. À esquerda, a rede de casa: um celular com 192.168.0.10 e um notebook com 192.168.0.11 ligados a um roteador, que mostra para fora o endereço 203.0.113.5. À direita, a rede móvel: um celular no 4G com 100.64.12.7 atrás do CGNAT da operadora, que mostra para fora 198.51.100.20. No meio, a internet, que só vê os endereços de fora. Uma seta vermelha tracejada mostra o celular do 4G tentando entrar direto no roteador de casa e sendo barrado, porque chegou de fora sem pedido. Os endereços são de exemplo](/images/posts/how-ito-works/nat-pt.svg)

Se B tentar mandar algo para `192.168.0.10`, não chega: esse endereço só existe dentro da casa de A. Se tentar o endereço público do roteador de A, o roteador não tem anotação nenhuma e descarta. E o mesmo vale no sentido contrário. Nenhum dos dois consegue ser o primeiro a bater na porta. É esse o problema que o WebRTC precisa resolver, e ele resolve com três ferramentas: ICE, STUN e TURN.

## Como a conexão atravessa a rede: ICE, STUN e TURN

### Candidatos ICE: "onde você pode me encontrar"

O **ICE** (Interactive Connectivity Establishment, "estabelecimento interativo de conectividade") é o processo que o navegador usa para descobrir caminhos possíveis até o outro lado. Cada endereço em que um celular *talvez* possa ser encontrado vira um **candidato ICE**. Existem três tipos:

- **host:** o endereço da própria rede local (`192.168.0.10:50000`). Só funciona se os dois estiverem na mesma rede.
- **srflx** (server reflexive, "refletido pelo servidor"): o endereço público que o roteador usa para aquele celular (`203.0.113.5:61000`). É descoberto com a ajuda de um servidor STUN.
- **relay:** um endereço emprestado de um servidor TURN, que repassa os dados. É o plano B.

Cada lado junta seus candidatos e manda a lista para o outro (a seção de sinalização mostra como). Aí o ICE monta pares, um candidato meu com um do outro, e testa todos. Ganha o par que funcionar, de preferência o mais direto, deixando o TURN por último.

### STUN: "de fora, como você me vê?"

Um celular não sabe sozinho qual é o seu endereço público: ele só conhece o `192.168.0.10`. Quem sabe é o roteador, que troca o remetente no caminho. O **STUN** (Session Traversal Utilities for NAT) resolve isso com uma pergunta só. O celular manda um pacote para um servidor STUN na internet, e o servidor responde com o endereço de onde o pacote chegou:

![Troca STUN em quatro passos. 1: o celular, com 192.168.0.10, pergunta "quem sou eu?" saindo da porta 50000. 2: o roteador troca o remetente e a pergunta chega ao servidor STUN vinda de 203.0.113.5:61000; o roteador anota que a porta 61000 é do celular. 3: o servidor STUN responde "te vejo em 203.0.113.5:61000". 4: o roteador repassa a resposta ao celular. No fim, o celular tem dois candidatos ICE: host 192.168.0.10:50000, que só vale dentro de casa, e srflx 203.0.113.5:61000, descoberto pelo STUN. Endereços e portas de exemplo](/images/posts/how-ito-works/stun-pt.svg)

Repare no efeito colateral: ao fazer a pergunta, o celular também criou uma anotação no porteiro. Isso é a base do caminho direto. Depois que os dois lados trocam os candidatos srflx, cada um manda pacotes para o endereço público do outro **ao mesmo tempo**. Para o roteador de A, o pacote que chega de B parece a resposta de algo que A acabou de mandar, então ele deixa passar. E o mesmo acontece do outro lado. Essa técnica tem o nome informal de *hole punching* ("furar o NAT").

O STUN é barato: só responde uma pergunta e não carrega nenhum dado do jogo. O Ito usa os servidores STUN padrão do Trystero (a biblioteca de que falo daqui a pouco): os do Google (`stun.l.google.com` e variações) e o da Cloudflare (`stun.cloudflare.com`).

### Quando o caminho direto falha: TURN

O hole punching nem sempre funciona. Os casos mais comuns:

- **NAT simétrico:** alguns roteadores usam uma porta diferente para cada destino. A porta que o STUN viu não vale para falar com o outro celular, então o endereço srflx não serve.
- **Redes corporativas e de faculdade:** muitas bloqueiam o UDP (o tipo de pacote que o WebRTC prefere) e só deixam sair tráfego web, nas portas 80 e 443.
- **CGNAT de operadora:** com milhares de clientes atrás do mesmo endereço, o NAT da operadora costuma ser mais restritivo, e o caminho direto entre dois celulares no 4G pode não abrir.

Para esses casos existe o **TURN** (Traversal Using Relays around NAT). Em vez de tentar entrar um no outro, os dois celulares abrem conexão **para fora**, até um servidor TURN, o que quase toda rede permite. O TURN repassa os pacotes de um para o outro. Ele é um carteiro, não um leitor: o canal continua criptografado com DTLS de ponta a ponta, então o TURN vê bytes cifrados, não as jogadas.

![Dois caminhos lado a lado. À esquerda, o caminho direto: o celular A, no Wi-Fi de casa, atrás de um NAT, e o celular B, no 4G, atrás de um CGNAT, ligados direto, porque os dois batem na porta ao mesmo tempo usando os endereços descobertos pelo STUN. À direita, via TURN: cada celular abre conexão para fora até um servidor TURN da Cloudflare, que repassa entre eles. Embaixo, os motivos de o direto falhar, NAT simétrico, rede corporativa que bloqueia UDP e CGNAT de operadora, e o lembrete de que, nos dois casos, o DTLS vale de ponta a ponta e o TURN vê bytes cifrados, não as jogadas](/images/posts/how-ito-works/paths-pt.svg)

O TURN do Ito é o [Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/). Um TURN precisa de credenciais, e eu não queria deixar uma senha no código do site, onde qualquer um pode ler. A solução foi um [Cloudflare Worker](https://workers.cloudflare.com/), uma função pequena que roda na Cloudflare, sem servidor para manter. O app pede a ele credenciais temporárias, que valem 24 horas, e as reaproveita até uns 5 minutos antes de vencer. A chave secreta fica só no Worker, que só responde para o endereço do jogo e para `localhost`. Os detalhes estão em [docs/turn.md](https://github.com/sschonss/ito/blob/main/docs/turn.md).

E se o Worker falhar ou demorar mais de uns 3 segundos? A sala abre do mesmo jeito, só com STUN e conexão direta. O TURN é um reforço, não um requisito.

## Como os celulares se acham: sinalização

Até aqui, cada celular sabe **onde ele pode ser encontrado** (seus candidatos ICE). Falta contar isso para o outro. E tem um ovo e galinha aqui: para conversar direto, eles precisam trocar essas informações; para trocar informações, precisariam já estar conversando. Então essa primeira troca passa por um terceiro. Ela se chama **sinalização**, e o WebRTC de propósito não define como ela acontece: cada aplicação escolhe o seu meio.

### O que precisa ser trocado

São dois tipos de recado:

- **Oferta e resposta SDP**, o "o que eu sei fazer". O SDP (Session Description Protocol) é uma ficha técnica: "quero abrir um canal de dados, estes são meus parâmetros de segurança". Um lado manda a **oferta**, o outro devolve a **resposta**, e assim os dois combinam o formato da conversa.
- **Candidatos ICE**, o "onde você pode me encontrar": a lista de endereços da seção anterior.

### O mural de avisos

A melhor imagem que encontrei é um **mural de avisos de cortiça** num corredor movimentado. Qualquer um pode prender um bilhete e qualquer um pode ler. O Ito usa o mural assim:

1. **O código da sala é o nome do mural.** Quem sabe o código (`FVGZ-FYFH`, por exemplo) sabe em qual mural olhar. Na prática, o nome é um hash (uma "impressão digital" do texto) de `Trystero@` + o nome do app + `@` + o código da sala. Numa das salas do lab, com o código `NUFW-FYFH`, o nome do mural era `3x5w6s4e1l5n636x5s235r2n5539gk1k6643c`, e dá para conferir: é exatamente o SHA-1 desse texto.
2. **Cada um prende um "estou aqui"** no mural, com um identificador aleatório.
3. **Cada um também tem uma caixa de recados pessoal**, outro nome derivado do mural mais o próprio identificador. Quem vê o "estou aqui" de alguém deixa a **oferta** na caixa dessa pessoa. A pessoa responde na caixa de quem ofereceu, e os candidatos ICE seguem pelo mesmo caminho.
4. **Os bilhetes vão cifrados.** A chave sai do código da sala, então quem passa pelo mural sem o código vê só números e letras sem sentido.
5. **O mural nunca carrega o jogo.** Assim que o canal direto abre, ninguém mais olha para ele. Nenhuma jogada, carta ou mensagem de chat passa por lá.

![Diagrama de sequência da sinalização, com três colunas: anfitrião, mural (relays Nostr e brokers MQTT) e convidado. 1 e 2: cada um prende "estou aqui" no mural da sala. 3: o mural mostra ao anfitrião o aviso do convidado. 4 e 5: o anfitrião deixa a oferta SDP cifrada na caixa do convidado, e o mural entrega. 6 e 7: o convidado deixa a resposta SDP cifrada na caixa do anfitrião, e o mural entrega. 8: candidatos ICE cifrados nos dois sentidos. Uma faixa verde diz que o mural sai de cena e nunca carrega uma jogada. 9: o ICE testa os pares de endereços e o canal WebRTC abre, com DTLS. 10: o jogo segue direto, com act, state, ack e tick](/images/posts/how-ito-works/signal-pt.svg)

Um detalhe que costuma ser simplificado: não é sempre o anfitrião quem manda a oferta. Quem manda é quem vê o "estou aqui" do outro, e se os dois mandarem ao mesmo tempo, uma regra de desempate da biblioteca escolhe um. No teste do lab, o anfitrião já estava no mural, viu o convidado chegar e mandou a oferta.

### Quem faz o papel de mural

O Ito usa a biblioteca [Trystero](https://github.com/dmotz/trystero), que faz essa sinalização usando redes públicas que já existem, e entra em duas ao mesmo tempo:

- **[Nostr](https://nostr.com/):** um protocolo aberto de redes sociais descentralizadas, em que as mensagens circulam por **relays**, servidores públicos que guardam e repassam recados para quem pergunta.
- **[MQTT](https://mqtt.org/):** um protocolo leve de mensagens usado em IoT (sensores, lâmpadas inteligentes), em que **brokers**, servidores públicos, entregam cada mensagem para quem assina um assunto.

Para o Ito, os dois são murais: lugares públicos onde dá para prender e ler bilhetes por nome. O código da sala serve como nome da sala nas duas redes e também como senha da negociação. Simplificando o que está em [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js):

```javascript
// para cada rede (Nostr e MQTT)
const room = lib.joinRoom(
  { appId: APP_ID, password: code, turnConfig }, // código da sala também é a senha
  code                                           // e o nome da sala
);
```

### Como é um bilhete de verdade

No lab, o teste gravou as mensagens que os navegadores mandaram para um relay Nostr. Este é o "estou aqui" do anfitrião, encurtado (`kind` é o tipo de evento Nostr e a tag `x` é o nome do mural):

```json
["EVENT", {
  "kind": 22750,
  "tags": [["x", "3x5w6s4e1l5n636x5s235r2n5539gk1k6643c"]],
  "content": "{\"peerId\":\"Hz5mLideyfm3wcxbVDYG\"}",
  "pubkey": "6b4303fa…", "sig": "…"
}]
```

E esta é a oferta que ele deixou na caixa do convidado. Repare que a tag `x` agora é outro nome (a caixa pessoal) e que o SDP está cifrado: antes do `$` vem o vetor de inicialização da cifra AES-GCM, depois o texto cifrado em base64 (o `content` vai como texto na mensagem; aqui ele aparece formatado para caber):

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

Quem tem o código da sala decifra e encontra um SDP comum. Este é um trecho do SDP que o navegador do anfitrião gerou no mesmo teste, lido direto da API do navegador, com os identificadores mascarados:

```text
m=application 12988 UDP/DTLS/SCTP webrtc-datachannel
a=candidate:2032783209 1 udp 8191 104.30.x.x 12988 typ relay …
a=ice-ufrag:(mascarado)
a=fingerprint:sha-256 B9:8F:11:F5:…:54:62:E1
a=setup:actpass
a=sctp-port:5000
```

Lendo linha a linha: `m=application ... webrtc-datachannel` diz "quero um canal de dados, não áudio nem vídeo". A linha `a=candidate` é um candidato ICE do tipo `relay`. O `fingerprint` é a impressão digital do certificado DTLS, que o outro lado usa para garantir que está cifrando com quem negociou, e não com alguém no meio.

### Duas redes ao mesmo tempo

Usar dois murais tem um efeito colateral interessante: a mesma pessoa pode chegar duas vezes, uma por cada rede. Por isso as mensagens são **idempotentes**, ou seja, receber a mesma mensagem duas vezes dá no mesmo que receber uma. O estado tem versão, reações têm um `id`, e alguém só conta como desconectado quando cai **nas duas redes**.

A redundância apareceu no próprio lab: na rede do teste, nenhum broker MQTT público aceitou conexão, e a sala abriu do mesmo jeito, só pelo Nostr.

## O que o lab mostrou: a conexão passou pelo TURN

O teste abriu o Ito publicado em duas janelas de navegador na mesma máquina de lab, uma como anfitrião e outra como convidado, e leu o `getStats()`, a API do WebRTC que conta qual par de candidatos foi escolhido. O resumo, com os endereços mascarados:

```text
par selecionado: relay (local) <-> relay (remoto), udp, rtt ~0,02 s
candidato local: relay 104.30.x.x
  via turns:turn.cloudflare.com:443 (relayProtocol: tls)
transporte:      dtlsState connected, DTLS 1.3
  cifra TLS_AES_128_GCM_SHA256
```

A rede do lab bloqueava UDP de saída, como muitas redes corporativas. O ICE não achou caminho direto, e a conexão saiu pelo TURN da Cloudflare **por TLS na porta 443**, a mesma porta de um site HTTPS comum. É exatamente o cenário da seção anterior: o TURN segurou a partida, e o DTLS continuou valendo por dentro.

O teste não conseguiu mostrar o caminho direto. Mesmo numa segunda rodada, com as duas janelas na mesma máquina, o navegador não gerou candidatos UDP locais nessa rede, então o único par possível foi relay com relay. Num Wi-Fi de casa comum, o esperado é o ICE escolher um par `host` ou `srflx`, sem TURN, mas isso o lab não registrou.

## O truque das cartas: ninguém envia as cartas

Esta é a minha parte favorita. Num jogo de cartas online, a intuição é que alguém sorteia e envia a carta de cada um. No Ito, **as cartas nunca trafegam**.

Cada celular calcula o baralho sozinho, e todos chegam ao mesmo resultado. O segredo é um **gerador pseudoaleatório com semente**: um algoritmo que produz números que parecem aleatórios, mas que são sempre os mesmos para a mesma semente. É como uma receita: com os mesmos ingredientes, sai o mesmo bolo em qualquer cozinha.

A semente é o texto `código da sala|número da partida|número da rodada`. Um hash chamado xmur3 transforma esse texto num número, o mulberry32 gera a sequência a partir dele, e o embaralhamento de [Fisher-Yates](https://pt.wikipedia.org/wiki/Embaralhamento_de_Fisher-Yates) usa essa sequência para embaralhar as cartas de 1 a 100 (versão simplificada de [js/core.js](https://github.com/sschonss/ito/blob/main/js/core.js)):

```javascript
// mesmo texto de entrada, mesmo baralho em qualquer celular
const rng = seed => mulberry32(xmur3(seed)());
const deckFor = (code, game, round) =>
  shuffle([...Array(100)].map((_, i) => i + 1), rng(`${code}|${game}|${round}`));
```

![As cartas não trafegam. O texto da semente, código da sala, partida e rodada, passa pelo hash xmur3, pelo gerador mulberry32 e pelo embaralhamento Fisher-Yates, e cada celular chega ao mesmo baralho de 1 a 100. Pela rede vão só as decisões: baixar a carta, a ordem, os votos e as dicas](/images/posts/how-ito-works/deck-pt.svg)

Pela rede vão só as **decisões**: "baixei minha carta", "arrumei a ordem assim", votos e dicas. Mensagens pequenas, e nada de carta circulando.

O código da sala também carrega a configuração. São 8 letras sem I e O (para não confundir com 1 e 0): as 4 primeiras são o sorteio da sala, e as 4 últimas guardam, em base 24, o número de rodadas e as categorias de tema escolhidas. Quem digita o código já sabe como a partida foi configurada.

## Quem manda na partida: o anfitrião

Com vários celulares, quem decide o que é verdade? No Ito, a regra é simples: **quem cria a sala é o anfitrião, e ele é a única fonte da verdade**. Só ele altera o estado da partida. Os outros pedem ações (`act`), recebem o estado e confirmam que receberam (`ack`).

Cada mudança aumenta a versão do estado (`ver`), e o anfitrião manda o estado inteiro. O convidado só aceita um estado mais novo do que o que já tem. E, a cada 2 segundos, o anfitrião envia um `tick` com a versão e um **hash** do estado (uma "impressão digital" curta: se qualquer detalhe mudar, o hash muda). Quem estiver diferente pede o estado de novo:

```javascript
// no convidado, a cada tick do anfitrião
if (msg.ver !== my.ver || msg.h !== stateHash(my)) {
  sendTo(host, { t: 'pull' }); // "me manda o estado de novo"
}
```

O ciclo completo, com a assinatura que aparece na próxima seção:

![Diagrama de sequência entre convidado e anfitrião. 1: o convidado manda act, "baixei minha carta". 2: o anfitrião aplica a regra, a versão passa de 7 para 8, e ele assina com a chave privada. 3: manda state, versão 8, com a assinatura. 4: o convidado confere a assinatura com a chave pública fixada pela impressão digital do link. 5: o convidado responde ack com a versão e o hash. 6: a cada 2 segundos, o anfitrião manda tick com versão e hash. 7: se o hash não bate, o convidado manda pull. 8: o anfitrião reenvia o state assinado. Embaixo, em vermelho: estado sem assinatura válida ou com versão velha é descartado](/images/posts/how-ito-works/host-pt.svg)

Isso corrige mensagens perdidas sem ninguém perceber. Não é um algoritmo de consenso sofisticado, é uma fonte da verdade e uma conferência periódica. Para um jogo entre amigos, é exatamente o necessário.

Dá para ver essa diferença de papéis na própria tela. Na mesma rodada, capturada no lab, o anfitrião tem o botão "Revelar nessa ordem" e pode mudar o tema; o convidado vê só o aviso de que, quando todos concordarem, o João revela:

![Duas capturas reais da mesma rodada do Ito, lado a lado. À esquerda, a tela do anfitrião, João: o tema "Programas de TV de domingo", de 1, sono, a 100, imperdível, o botão "Mudar tema", a carta virada para baixo e o botão vermelho "Revelar nessa ordem". À direita, a tela da convidada, Maria: o mesmo tema e a mesma rodada 1 de 5, a carta virada para baixo e, no lugar do botão, o aviso "Quando todos concordarem, João revela"](/images/posts/how-ito-works/ito-partida-anfitriao-convidado.webp)

## Ninguém se passa pelo anfitrião: assinaturas

Se o anfitrião é a verdade, o que impede alguém de mandar um estado falso dizendo "eu sou o anfitrião"? **Assinatura digital.**

Na primeira vez que abre o jogo, cada celular gera um par de chaves **ECDSA P-256** usando a [WebCrypto](https://developer.mozilla.org/pt-BR/docs/Web/API/SubtleCrypto/sign), a API de criptografia que já vem no navegador (o código está em [js/crypto.js](https://github.com/sschonss/ito/blob/main/js/crypto.js)). ECDSA é um algoritmo de assinatura com curvas elípticas, e P-256 é a curva usada. A ideia, sem matemática: a **chave privada** é um carimbo que só você tem e nunca sai do aparelho; a **chave pública** é uma cópia do desenho do carimbo, que todo mundo pode usar para conferir se um documento foi carimbado por você.

É o mesmo algoritmo (ECDSA na curva P-256) que o servidor usa para carimbar cada envio no [Web Push](/pt-br/posts/how-web-push-works/).

O anfitrião carimba (assina) cada estado, e todos conferem. O estado leva a chave pública do dono da sala, e o link de convite leva a **impressão digital** dela (um resumo curto da chave). Assim, quem entra pelo convite já sabe qual carimbo esperar. A apresentação de cada jogador (`hello`) também é assinada, para ninguém ocupar o lugar de outra pessoa.

O próprio projeto deixa claro o limite: isso protege contra um anfitrião falso, **não** contra quem já está na sala. Como as cartas são calculadas no celular, alguém que saiba inspecionar o código no navegador poderia descobrir os números. Impedir isso exigiria um servidor guardando as cartas. Para um jogo entre amigos, é um trade-off aceitável.

## E se o anfitrião cair?

O anfitrião é a fonte da verdade, então ele também é um ponto único de falha. Se o celular dele perde a conexão (nas duas redes) e não volta em uns 5 segundos, o jogador conectado com o menor número de lugar vira **anfitrião provisório**. Só assume quem recebeu o estado atual nesta sessão, e ele aumenta a versão (`ver + 1`) para que todos reconheçam o estado novo.

Quando o dono da sala volta, ele espera um instante para pegar o estado mais novo do provisório e **reassume**. A partida continua de onde parou, sem perder jogadas. As assinaturas também cobrem esse caso: o estado do provisório só é aceito enquanto o dono está fora, e com a chave que todos já conheciam.

## Como testar algo que depende de redes públicas

Depender de relays e brokers de terceiros é ótimo até o dia em que um deles muda. Por isso o Ito tem dois tipos de teste:

- **Testes end-to-end com um relé falso:** os testes abrem vários "celulares" num navegador controlado pelo [Playwright](https://playwright.dev/) (uma ferramenta que automatiza navegadores) e trocam a biblioteca de conexão por uma falsa, que imita as duas redes dentro do próprio teste. Rápido e sem depender da internet.
- **Um teste diário com as redes de verdade:** um workflow do [GitHub Actions](https://github.com/features/actions) roda todo dia e conecta dois navegadores pela internet real e joga uma rodada em três cenários: só pelo Nostr, só pelo MQTT e pelas duas redes juntas. Se um relay ou broker público mudar, o teste avisa antes de alguém tentar jogar.

## Limites e o que aprendi

"Sem servidor" precisa de asterisco: **não existe um servidor central da partida**. Ainda existem relays Nostr, brokers MQTT, servidores STUN, o TURN da Cloudflare (com o meu Worker) e as CDNs de onde a biblioteca é carregada. Todos são de terceiros e podem sair do ar; as duas redes e os endereços reserva reduzem o risco, mas não zeram. O jogo também precisa de internet para a primeira conexão e, como contei, não é à prova de trapaça entre quem já está na sala.

O que eu levo do laboratório:

- **O navegador sabe muito mais do que eu imaginava:** conexão P2P criptografada e criptografia de verdade, sem instalar nada.
- **Às vezes o melhor jeito de sincronizar é não mandar:** o baralho determinístico eliminou uma categoria inteira de problemas.
- **Uma fonte da verdade com versão e conferência resolve muito:** antes de buscar um algoritmo de consenso, vale perguntar se não basta um chefe e uma checagem a cada 2 segundos.
- **Ser honesto sobre as dependências:** nomear o que é de terceiros ajuda a decidir o que testar todo dia.

Abra o [Ito](https://sschonss.github.io/ito/), crie uma sala e chame os amigos: tudo o que está aqui acontece de verdade no seu celular. E, se ainda não leu, o contexto de por que eu fiz isso está em [Trabalhar não é estudar](/pt-br/posts/personal-projects-as-a-lab/). Se você já brincou com WebRTC ou tem uma ideia de jogo P2P, me conta nos comentários.
