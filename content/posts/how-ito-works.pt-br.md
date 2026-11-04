---
title: 'Ito por debaixo dos panos: multiplayer P2P no navegador sem servidor de jogo'
date: 2026-11-03
description: 'Como vários celulares jogam juntos a partir de um site estático: WebRTC, sinalização por Nostr e MQTT, STUN e TURN, um baralho que ninguém envia e um anfitrião que assina o estado.'
translationKey: how-ito-works
tags: ['WebRTC', 'Arquitetura']
series: ['Estudos por curiosidade']
series_weight: 3
draft: false
---

O [Ito](https://sschonss.github.io/ito/) é um jogo de cartas cooperativo em que cada pessoa joga no próprio celular. Ele é um [PWA](https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps) (progressive web app): um site que dá para instalar e abrir como se fosse um app.

O site é só um punhado de arquivos estáticos no [GitHub Pages](https://pages.github.com/). Não existe um servidor central cuidando da partida. Mesmo assim, até dez celulares jogam juntos, em tempo real, conversando direto entre si.

Este artigo conta como isso funciona, e o código está aberto no [repositório do Ito](https://github.com/sschonss/ito). Ele faz par com [Trabalhar não é estudar](/pt-br/posts/personal-projects-as-a-lab/), em que eu falo de onde o estudo foi parar na era da IA.

Não é tutorial: é uma explicação com diagramas, capturas reais de um lab e trechos de código simplificados. Não precisa entender de redes. Cada sigla é explicada na primeira vez que aparece, e se alguma escapar, o [glossário rápido](#glossary) no fim do artigo resume todas em uma linha.

### A partida em cinco momentos

Para não se perder no meio dos termos, o artigo acompanha uma partida do começo ao fim. Cada momento puxa uma parte da técnica:

1. **O João cria a sala.** O celular dele vira o anfitrião, o dono da partida.
2. **A Maria digita o código e entra.** Os dois celulares precisam se achar pela internet. É a parte de rede, conexão e sinalização.
3. **As cartas são distribuídas.** Sem ninguém enviar carta nenhuma.
4. **A Maria baixa uma carta.** A jogada vai até o anfitrião, e o novo estado da partida volta para todos, assinado.
5. **A conexão de alguém cai.** A partida precisa continuar mesmo assim.

## O desafio: um site estático e vários celulares

O jeito tradicional de fazer um jogo multiplayer é ter um servidor no meio. Cada celular manda a jogada para o servidor, e o servidor repassa para os outros. É como um grupo de amigos que só conversa por meio de um mediador.

O GitHub Pages não roda meu código: ele só entrega arquivos (HTML, CSS, JavaScript). Então a pergunta do laboratório era: dá para os celulares conversarem **direto entre si**, sem mediador?

Dá, com o [WebRTC](https://developer.mozilla.org/pt-BR/docs/Web/API/WebRTC_API) (Web Real-Time Communication, "comunicação em tempo real na web"). É a tecnologia que os navegadores usam para videochamadas, e já vem em qualquer navegador moderno, sem instalar nada.

Além de áudio e vídeo, o WebRTC tem o [**data channel**](https://developer.mozilla.org/pt-BR/docs/Web/API/RTCDataChannel) ("canal de dados"). Pense nele como um cano entre dois navegadores, por onde passa qualquer dado: no Ito, o texto de cada jogada.

Esse modelo se chama [**P2P**](https://developer.mozilla.org/en-US/docs/Glossary/P2P) (peer-to-peer, "de par para par"). Cada celular fala com os outros sem passar por um servidor central, como amigos conversando na mesma mesa em vez de por uma telefonista.

O canal ainda é criptografado com [**DTLS**](https://developer.mozilla.org/en-US/docs/Glossary/DTLS) (Datagram Transport Layer Security). É a versão do [TLS](https://developer.mozilla.org/pt-BR/docs/Glossary/TLS), o cadeado do HTTPS, feita para esse tipo de conexão. Na prática, ninguém no caminho consegue ler as jogadas.

Só tem um porém: para abrir esse canal, os dois lados precisam se encontrar primeiro, e a internet não facilita isso. O resto do artigo é a história desse encontro, e depois do que acontece quando ele dá certo.

O mapa geral é este (o desenho completo da rede está documentado em [docs/p2p.md](https://github.com/sschonss/ito/blob/main/docs/p2p.md)):

![Visão geral do Ito. O anfitrião e o convidado usam relays Nostr e brokers MQTT só para se encontrarem, trocando SDP e candidatos ICE. Depois, conversam por um canal WebRTC direto, criptografado com DTLS. Ao lado, o STUN ajuda cada celular a descobrir o endereço público, e um TURN da Cloudflare, com credenciais de 24 horas entregues por um Worker, repassa os dados quando o caminho direto é bloqueado. O GitHub Pages só serve os arquivos do site](/images/posts/how-ito-works/overview-pt.svg)

Não se preocupe se metade dos nomes do desenho ainda não fizer sentido. Cada um aparece nas próximas seções, com exemplo.

**Em resumo:** o WebRTC deixa dois navegadores conversarem direto e com criptografia. O difícil é fazer os dois se acharem.

### Como é o jogo na tela

Para ter uma ideia do que está sendo sincronizado, estas são capturas reais do Ito publicado, feitas num navegador com tela de celular (a interface do jogo é só em português).

À esquerda, a tela inicial, onde se cria a sala. À direita, a sala com duas pessoas: o código da sala no topo, os botões de convite e a lista de quem já entrou, com o anfitrião marcado.

![Duas capturas reais do Ito no celular, lado a lado. À esquerda, a tela inicial, com o título "Pense no número. Fale o tema." e o cartão "Criar sala", com o número de rodadas e as categorias de tema. À direita, a sala vista pelo anfitrião: o código FVGZ-FYFH no topo, os botões Copiar, QR code e Convidar, e a lista "Na sala" com João, marcado como você e anfitrião, e Maria, os dois com bolinha verde de conectados. Embaixo, o botão "Começar partida"](/images/posts/how-ito-works/ito-telas-inicio-sala.webp)

Essas duas pessoas eram duas janelas de navegador no lab, cada uma fingindo ser um celular. O nome da Maria apareceu na lista do anfitrião porque os dois navegadores conseguiram abrir o canal direto. Como isso acontece é o assunto daqui para frente.

## Um pouco de rede, sem ser especialista

Antes de falar de WebRTC, vale entender por que dois celulares não conseguem simplesmente "ligar" um para o outro. São três ideias: endereço IP, endereço privado e NAT.

### Endereço IP: o endereço de entrega

Todo aparelho conectado tem um [**endereço IP**](https://developer.mozilla.org/pt-BR/docs/Glossary/IP_Address), um número que diz para onde os pacotes de dados devem ir, como o endereço numa carta. Algo como `203.0.113.5`.

Só que existem dois tipos:

- **Endereço público:** único na internet inteira. Qualquer um no mundo consegue mandar pacotes para ele.
- **Endereço privado:** só vale dentro de uma rede local, como a sua casa. Faixas como `192.168.x.x` e `10.x.x.x` são reservadas para isso, e milhões de casas usam os mesmos números ao mesmo tempo. O `192.168.0.10` da sua casa e o da casa do vizinho são aparelhos diferentes.

Todos os endereços deste artigo são **exemplos**, tirados de faixas reservadas para documentação. Nenhum é de um aparelho de verdade.

### NAT: um prédio com um endereço só

Se cada casa usa endereços privados, como os dados chegam até o seu celular? Pelo [**NAT**](https://developer.mozilla.org/en-US/docs/Glossary/NAT) (Network Address Translation, "tradução de endereços de rede"), que roda no roteador.

Pense num prédio. A rua só conhece o endereço do prédio (o IP público, `203.0.113.5`). Lá dentro, cada apartamento tem um número (o IP privado, `192.168.0.10`, `192.168.0.11`).

O roteador é o porteiro. Quando um morador manda uma carta para fora, ele anota "a resposta para esta carta é do apartamento 10" e troca o remetente pelo endereço do prédio. Quando a resposta chega, ele consulta a anotação e entrega no apartamento certo.

Na prática, a anotação usa uma [**porta**](https://developer.mozilla.org/pt-BR/docs/Glossary/Port): um número extra que vai junto com o endereço, como em `203.0.113.5:61000`. Pense nela como o número do apartamento escrito no envelope.

O detalhe que importa: o porteiro só entrega o que é **resposta** a algo que um morador mandou. Uma carta que chega de fora sem ninguém ter pedido não tem anotação, então ela é descartada. Isso é ótimo para segurança e péssimo para quem quer conexão direta.

### Por que um celular no 4G e outro no Wi-Fi não se acham

Agora junte as peças, com o momento em que a Maria tenta entrar na sala do João. O celular do João está no Wi-Fi de casa, com o endereço privado `192.168.0.10`, atrás do roteador. O celular da Maria está no 4G.

As operadoras móveis têm tantos clientes que fazem um NAT em escala, chamado **CGNAT** (Carrier-Grade NAT, "NAT da operadora"). O celular recebe um endereço interno (algo como `100.64.12.7`) e divide um endereço público com milhares de outros clientes. É um prédio gigante, com um porteiro só.

![Diagrama de NAT. À esquerda, a rede de casa: um celular com 192.168.0.10 e um notebook com 192.168.0.11 ligados a um roteador, que mostra para fora o endereço 203.0.113.5. À direita, a rede móvel: um celular no 4G com 100.64.12.7 atrás do CGNAT da operadora, que mostra para fora 198.51.100.20. No meio, a internet, que só vê os endereços de fora. Uma seta vermelha tracejada mostra o celular do 4G tentando entrar direto no roteador de casa e sendo barrado, porque chegou de fora sem pedido. Os endereços são de exemplo](/images/posts/how-ito-works/nat-pt.svg)

Se a Maria tentar mandar algo para `192.168.0.10`, não chega: esse endereço só existe dentro da casa do João. Se tentar o endereço público do roteador dele, o roteador não tem anotação nenhuma e descarta. E o mesmo vale no sentido contrário.

**Em resumo:** cada porteiro só deixa entrar resposta. Se os dois celulares esperam o outro bater primeiro, ninguém entra. É esse o problema que o WebRTC precisa resolver.

## Como a conexão atravessa a rede: ICE, STUN e TURN

O WebRTC resolve esse impasse com três ferramentas. Vale guardar uma frase para cada uma:

- **ICE** organiza a busca: junta os endereços possíveis e testa qual caminho funciona.
- **STUN** responde a cada celular "é assim que você aparece lá fora".
- **TURN** é o plano B: um servidor que repassa os dados quando nenhum caminho direto abre.

A MDN tem uma boa visão geral dos [protocolos do WebRTC](https://developer.mozilla.org/pt-BR/docs/Web/API/WebRTC_API/Protocols), para quem quiser ir além.

### Candidatos ICE: "onde você pode me encontrar"

O [**ICE**](https://developer.mozilla.org/en-US/docs/Glossary/ICE) (Interactive Connectivity Establishment, "estabelecimento interativo de conectividade") é o processo que o navegador usa para descobrir caminhos até o outro lado.

Cada endereço em que um celular *talvez* possa ser encontrado vira um **candidato ICE**. É um palpite: "tente me achar aqui". Existem três tipos:

- **host:** o endereço da própria rede local (`192.168.0.10:50000`). Só funciona se os dois estiverem na mesma rede.
- **srflx** (server reflexive, "refletido pelo servidor"): o endereço público que o roteador usa para aquele celular (`203.0.113.5:61000`). É descoberto com a ajuda de um servidor STUN.
- **relay** ("repasse"): um endereço emprestado de um servidor TURN, que repassa os dados. É o plano B.

Cada lado junta seus candidatos e manda a lista para o outro (a seção de sinalização mostra como). Aí o ICE monta pares, um candidato meu com um do outro, e testa todos, como quem testa as chaves de um molho até uma abrir a porta.

Ganha o par que funcionar, de preferência o mais direto. O TURN fica por último.

### STUN: "de fora, como você me vê?"

Um celular não sabe sozinho qual é o seu endereço público: ele só conhece o `192.168.0.10`. Quem sabe é o roteador, que troca o remetente no caminho.

O [**STUN**](https://developer.mozilla.org/en-US/docs/Glossary/STUN) (Session Traversal Utilities for NAT) resolve isso com uma pergunta só. O celular manda um pacote para um servidor STUN na internet, e o servidor responde com o endereço de onde o pacote chegou. É como ligar para um amigo e perguntar "qual número apareceu aí na sua tela?".

![Troca STUN em quatro passos. 1: o celular, com 192.168.0.10, pergunta "quem sou eu?" saindo da porta 50000. 2: o roteador troca o remetente e a pergunta chega ao servidor STUN vinda de 203.0.113.5:61000; o roteador anota que a porta 61000 é do celular. 3: o servidor STUN responde "te vejo em 203.0.113.5:61000". 4: o roteador repassa a resposta ao celular. No fim, o celular tem dois candidatos ICE: host 192.168.0.10:50000, que só vale dentro de casa, e srflx 203.0.113.5:61000, descoberto pelo STUN. Endereços e portas de exemplo](/images/posts/how-ito-works/stun-pt.svg)

Repare no efeito colateral: ao fazer a pergunta, o celular também criou uma anotação no porteiro. Isso é a base do caminho direto, que funciona assim:

1. O João e a Maria trocam os candidatos srflx, ou seja, os endereços públicos que o STUN mostrou.
2. Os dois mandam pacotes para o endereço público do outro **ao mesmo tempo**.
3. Para o roteador do João, o pacote que chega da Maria parece a resposta de algo que o João acabou de mandar, então ele deixa passar. Do outro lado acontece o mesmo.

Essa técnica tem o nome informal de *hole punching* ("furar o NAT").

O STUN é barato: só responde uma pergunta e não carrega nenhum dado do jogo. O Ito usa os servidores STUN padrão do Trystero (a biblioteca de que falo daqui a pouco): os do Google (`stun.l.google.com` e variações) e o da Cloudflare (`stun.cloudflare.com`).

### Quando o caminho direto falha: TURN

O hole punching nem sempre funciona. Os casos mais comuns:

- **NAT simétrico:** alguns roteadores usam uma porta diferente para cada destino. A porta que o STUN viu não vale para falar com o outro celular, então o endereço srflx não serve.
- **Redes corporativas e de faculdade:** muitas bloqueiam o [UDP](https://developer.mozilla.org/en-US/docs/Glossary/UDP), o tipo de pacote que o WebRTC prefere (rápido, sem confirmação de entrega, bom para tempo real). Elas só deixam sair tráfego web, nas portas 80 e 443.
- **CGNAT de operadora:** com milhares de clientes atrás do mesmo endereço, o NAT da operadora costuma ser mais restritivo, e o caminho direto entre dois celulares no 4G pode não abrir.

Para esses casos existe o [**TURN**](https://developer.mozilla.org/en-US/docs/Glossary/TURN) (Traversal Using Relays around NAT). Em vez de tentar entrar um no outro, os dois celulares abrem conexão **para fora**, até um servidor TURN, o que quase toda rede permite. O TURN repassa os pacotes de um para o outro.

Ele é um carteiro, não um leitor. O canal continua criptografado com DTLS de ponta a ponta, então o TURN vê bytes cifrados, não as jogadas.

![Dois caminhos lado a lado. À esquerda, o caminho direto: o celular A, no Wi-Fi de casa, atrás de um NAT, e o celular B, no 4G, atrás de um CGNAT, ligados direto, porque os dois batem na porta ao mesmo tempo usando os endereços descobertos pelo STUN. À direita, via TURN: cada celular abre conexão para fora até um servidor TURN da Cloudflare, que repassa entre eles. Embaixo, os motivos de o direto falhar, NAT simétrico, rede corporativa que bloqueia UDP e CGNAT de operadora, e o lembrete de que, nos dois casos, o DTLS vale de ponta a ponta e o TURN vê bytes cifrados, não as jogadas](/images/posts/how-ito-works/paths-pt.svg)

O TURN do Ito é o [Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/). Um TURN precisa de credenciais, e eu não queria deixar uma senha no código do site, onde qualquer um pode ler.

A solução foi um [Cloudflare Worker](https://workers.cloudflare.com/), uma função pequena que roda na Cloudflare, sem servidor para manter:

- O app pede ao Worker credenciais temporárias, que valem 24 horas, e as reaproveita até uns 5 minutos antes de vencer.
- A chave secreta fica só no Worker, que só responde para o endereço do jogo e para `localhost`.

Os detalhes estão em [docs/turn.md](https://github.com/sschonss/ito/blob/main/docs/turn.md).

E se o Worker falhar ou demorar mais de uns 3 segundos? A sala abre do mesmo jeito, só com STUN e conexão direta. O TURN é um reforço, não um requisito.

**Em resumo:** o ICE testa caminhos, o STUN descobre o endereço público de cada celular para tentar o caminho direto, e o TURN repassa os dados cifrados quando o direto não abre.

## Como os celulares se acham: sinalização

Até aqui, cada celular sabe **onde ele pode ser encontrado** (seus candidatos ICE). Falta contar isso para o outro.

E tem um ovo e galinha aqui. Para conversar direto, eles precisam trocar essas informações. Para trocar informações, precisariam já estar conversando.

Então essa primeira troca passa por um terceiro. Ela se chama [**sinalização**](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling): é como dois amigos que combinam por mensagem o lugar do encontro antes de se ver. O WebRTC, de propósito, não define como ela acontece. Cada aplicação escolhe o seu meio.

### O que precisa ser trocado

São dois tipos de recado:

- **Oferta e resposta SDP**, o "o que eu sei fazer". O [SDP](https://developer.mozilla.org/pt-BR/docs/Glossary/SDP) (Session Description Protocol, "protocolo de descrição de sessão") é uma ficha técnica: "quero abrir um canal de dados, estes são meus parâmetros de segurança". Um lado manda a **oferta**, o outro devolve a **resposta**, e assim os dois combinam o formato da conversa.
- **Candidatos ICE**, o "onde você pode me encontrar": a lista de endereços da seção anterior.

### O mural de avisos

A melhor imagem que encontrei é um **mural de avisos de cortiça** num corredor movimentado. Qualquer um pode prender um bilhete e qualquer um pode ler. O Ito usa o mural assim:

1. **O código da sala é o nome do mural.** Quem sabe o código (`FVGZ-FYFH`, por exemplo) sabe em qual mural olhar.
2. **Cada um prende um "estou aqui"** no mural, com um identificador aleatório.
3. **Cada um também tem uma caixa de recados pessoal**, outro nome derivado do mural mais o próprio identificador. Quem vê o "estou aqui" de alguém deixa a **oferta** na caixa dessa pessoa. A pessoa responde na caixa de quem ofereceu, e os candidatos ICE seguem pelo mesmo caminho.
4. **Os bilhetes vão cifrados.** A chave sai do código da sala, então quem passa pelo mural sem o código vê só números e letras sem sentido.
5. **O mural nunca carrega o jogo.** Assim que o canal direto abre, ninguém mais olha para ele. Nenhuma jogada, carta ou mensagem de chat passa por lá.

Um detalhe sobre o nome do mural: na prática, ele é um [hash](https://developer.mozilla.org/en-US/docs/Glossary/Hash_function) do código da sala. Hash é uma "impressão digital" de um texto: o mesmo texto sempre gera o mesmo resultado, e qualquer mudança gera outro bem diferente.

O texto de entrada é `Trystero@` + o nome do app + `@` + o código da sala. Numa das salas do lab, com o código `NUFW-FYFH`, o nome do mural era `3x5w6s4e1l5n636x5s235r2n5539gk1k6643c`. Dá para conferir: é exatamente o SHA-1 (um algoritmo de hash) desse texto.

![Diagrama de sequência da sinalização, com três colunas: anfitrião, mural (relays Nostr e brokers MQTT) e convidado. 1 e 2: cada um prende "estou aqui" no mural da sala. 3: o mural mostra ao anfitrião o aviso do convidado. 4 e 5: o anfitrião deixa a oferta SDP cifrada na caixa do convidado, e o mural entrega. 6 e 7: o convidado deixa a resposta SDP cifrada na caixa do anfitrião, e o mural entrega. 8: candidatos ICE cifrados nos dois sentidos. Uma faixa verde diz que o mural sai de cena e nunca carrega uma jogada. 9: o ICE testa os pares de endereços e o canal WebRTC abre, com DTLS. 10: o jogo segue direto, com act, state, ack e tick](/images/posts/how-ito-works/signal-pt.svg)

Os nomes no fim do desenho (`act`, `state`, `ack` e `tick`) são os tipos de mensagem do jogo. Eles aparecem com calma na seção sobre o anfitrião.

Um detalhe que costuma ser simplificado: não é sempre o anfitrião quem manda a oferta. Quem manda é quem vê o "estou aqui" do outro. Se os dois mandarem ao mesmo tempo, uma regra de desempate da biblioteca escolhe um. No teste do lab, o anfitrião já estava no mural, viu o convidado chegar e mandou a oferta.

### Quem faz o papel de mural

O Ito usa a biblioteca [Trystero](https://github.com/dmotz/trystero), que faz essa sinalização usando redes públicas que já existem. Ela entra em duas ao mesmo tempo:

- **[Nostr](https://nostr.com/):** um protocolo aberto de redes sociais descentralizadas. As mensagens circulam por **relays**, servidores públicos que guardam e repassam recados para quem pergunta.
- **[MQTT](https://mqtt.org/):** um protocolo leve de mensagens usado em IoT (internet das coisas: sensores, lâmpadas inteligentes). Nele, **brokers**, também servidores públicos, entregam cada mensagem para quem assina um assunto.

Para o Ito, os dois são murais: lugares públicos onde dá para prender e ler bilhetes por nome. O código da sala serve como nome da sala nas duas redes e também como senha da negociação.

No trecho abaixo, simplificado de [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js), repare que o código da sala (`code`) aparece duas vezes: uma como senha e outra como nome da sala.

```javascript
// para cada rede (Nostr e MQTT)
const room = lib.joinRoom(
  { appId: APP_ID, password: code, turnConfig }, // código da sala também é a senha
  code                                           // e o nome da sala
);
```

### Como é um bilhete de verdade

No lab, o teste gravou as mensagens que os navegadores mandaram para um relay Nostr. Este é o "estou aqui" do anfitrião, encurtado. Repare em dois campos: a tag `x`, que é o nome do mural, e o `content`, que traz só o identificador aleatório (`kind` é o tipo de evento Nostr).

```json
["EVENT", {
  "kind": 22750,
  "tags": [["x", "3x5w6s4e1l5n636x5s235r2n5539gk1k6643c"]],
  "content": "{\"peerId\":\"Hz5mLideyfm3wcxbVDYG\"}",
  "pubkey": "6b4303fa…", "sig": "…"
}]
```

E esta é a oferta que ele deixou na caixa do convidado. Repare em duas diferenças:

- A tag `x` agora é outro nome: a caixa pessoal do convidado.
- O SDP está cifrado com AES-GCM, um algoritmo de criptografia comum. Antes do `$` vem o vetor de inicialização, um número aleatório que faz o mesmo texto sair diferente a cada vez que é cifrado. Depois vem o texto cifrado em [base64](https://developer.mozilla.org/pt-BR/docs/Glossary/Base64), um jeito de escrever bytes só com letras e números.

O `content` vai como texto na mensagem; aqui ele aparece formatado para caber:

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

Quem tem o código da sala decifra e encontra um SDP comum. Abaixo, um trecho do SDP que o navegador do anfitrião gerou no mesmo teste, lido direto da API do navegador, com os identificadores mascarados. Não precisa ler tudo: as linhas que importam são a primeira, a do `candidate` e a do `fingerprint`.

```text
m=application 12988 UDP/DTLS/SCTP webrtc-datachannel
a=candidate:2032783209 1 udp 8191 104.30.x.x 12988 typ relay …
a=ice-ufrag:(mascarado)
a=fingerprint:sha-256 B9:8F:11:F5:…:54:62:E1
a=setup:actpass
a=sctp-port:5000
```

Lendo essas três linhas:

- `m=application ... webrtc-datachannel` diz "quero um canal de dados, não áudio nem vídeo". O [SCTP](https://developer.mozilla.org/en-US/docs/Glossary/SCTP) que aparece nela é o protocolo que o data channel usa por baixo.
- `a=candidate` é um candidato ICE do tipo `relay`, ou seja, um endereço emprestado do TURN.
- `fingerprint` é a impressão digital do [certificado](https://developer.mozilla.org/en-US/docs/Glossary/Digital_certificate) DTLS. O outro lado usa esse valor para garantir que está cifrando com quem negociou, e não com alguém no meio.

### Duas redes ao mesmo tempo

Usar dois murais tem um efeito colateral interessante: a mesma pessoa pode chegar duas vezes, uma por cada rede. A Maria pode aparecer pelo Nostr e, um instante depois, de novo pelo MQTT.

Por isso as mensagens são [**idempotentes**](https://developer.mozilla.org/pt-BR/docs/Glossary/Idempotent): receber a mesma mensagem duas vezes dá no mesmo que receber uma. Na prática:

- O estado tem versão, então uma cópia repetida não muda nada.
- Reações têm um `id`, então não contam em dobro.
- Alguém só conta como desconectado quando cai **nas duas redes**.

A redundância apareceu no próprio lab: na rede do teste, nenhum broker MQTT público aceitou conexão, e a sala abriu do mesmo jeito, só pelo Nostr.

### Quais murais, e o que a tela mostra enquanto procura

Sozinho, o Trystero usa uma lista padrão de murais, e alguns relays dessa lista já tinham saído do ar ou passaram a exigir login para aceitar bilhetes.

Por isso o Ito leva a própria lista: **8 relays Nostr**, escolhidos por aceitarem escrita anônima (sem conta nem autenticação), e **4 brokers MQTT**. A lista fica na constante `RELAYS`, em [js/core.js](https://github.com/sschonss/ito/blob/main/js/core.js), e vai inteira para o Trystero no lugar da lista padrão.

Os 8 relays atendem na **porta 443**, a do HTTPS, a mesma de qualquer site. Isso importa porque muitas redes móveis e corporativas só deixam sair tráfego web e cortam as outras portas.

Três dos quatro brokers MQTT usam portas fora do padrão web (8081, 8084 e 8884). Numa rede assim, quem segura a sinalização são os relays Nostr, como aconteceu no lab contado acima.

Achar a sala também pode demorar. Se ninguém aparece em 15 segundos, o app entra no mural de novo sozinho, até 3 vezes, e mostra em qual tentativa está ("Tentativa 2 de 4", contando a primeira entrada).

Enquanto isso, a tela da Maria separa quatro situações, porque cada uma pede uma atitude diferente:

- **Sem internet:** a biblioteca de conexão nem carregou. O problema está na rede do próprio celular.
- **Procurando a sala:** o celular está nos murais, esperando alguém da sala aparecer.
- **Quase lá:** já existe canal com alguém da sala, mas o estado assinado do anfitrião ainda não chegou. Se ele não chegar, a tela diz exatamente isso ("Estado do anfitrião não chegou"), em vez de fingir que a sala não existe.
- **Não achamos a sala:** as tentativas acabaram e ninguém apareceu. A tela sugere conferir se quem criou a sala está com o Ito aberto, e o botão "Tentar de novo" recomeça a busca.

Para ver o código: os 15 segundos e o limite de 3 novas tentativas são as constantes `CONNECT_TIMEOUT` e `SEEK_TRIES`, em [js/core.js](https://github.com/sschonss/ito/blob/main/js/core.js), e a nova entrada no mural acontece na função `armSeek`, em [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js).

**Em resumo:** antes do canal direto existir, os celulares trocam a ficha técnica (SDP) e os endereços (candidatos ICE) por bilhetes cifrados em murais públicos, o Nostr e o MQTT. Depois que o canal abre, o mural sai de cena.

## O que o lab mostrou: a conexão passou pelo TURN

O teste abriu o Ito publicado em duas janelas de navegador na mesma máquina de lab, uma como anfitrião e outra como convidado. Depois leu o [`getStats()`](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats), a função do WebRTC que conta qual par de candidatos foi escolhido.

O resumo vem abaixo, com os endereços mascarados. As linhas que importam são a primeira, que mostra o par escolhido (relay com relay), e a terceira, que mostra por onde o TURN foi alcançado.

```text
par selecionado: relay (local) <-> relay (remoto), udp, rtt ~0,02 s
candidato local: relay 104.30.x.x
  via turns:turn.cloudflare.com:443 (relayProtocol: tls)
transporte:      dtlsState connected, DTLS 1.3
  cifra TLS_AES_128_GCM_SHA256
```

O `rtt` ([round-trip time](https://developer.mozilla.org/en-US/docs/Glossary/Round_Trip_Time)) é o tempo de ida e volta de um pacote: uns 20 milissegundos. A última linha é o nome da cifra usada pelo DTLS.

A rede do lab bloqueava UDP de saída, como muitas redes corporativas. O ICE não achou caminho direto, e a conexão saiu pelo TURN da Cloudflare **por TLS na porta 443**, a mesma porta de um site HTTPS comum.

É exatamente o cenário da seção anterior: o TURN segurou a partida, e o DTLS continuou valendo por dentro.

O teste não conseguiu mostrar o caminho direto. Mesmo numa segunda rodada, com as duas janelas na mesma máquina, o navegador não gerou candidatos UDP locais nessa rede, então o único par possível foi relay com relay. Num Wi-Fi de casa comum, o esperado é o ICE escolher um par `host` ou `srflx`, sem TURN, mas isso o lab não registrou.

## O truque das cartas: ninguém envia as cartas

Esta é a minha parte favorita. Num jogo de cartas online, a intuição é que alguém sorteia e envia a carta de cada um. No Ito, **as cartas nunca trafegam**.

Quando a rodada começa, cada celular calcula o baralho sozinho, e todos chegam ao mesmo resultado. O segredo é um **gerador pseudoaleatório com semente**: um algoritmo que produz números que parecem aleatórios, mas que são sempre os mesmos para a mesma semente (o texto de partida).

É como uma receita: com os mesmos ingredientes, sai o mesmo bolo em qualquer cozinha.

A receita do Ito tem três passos:

1. A semente é o texto `código da sala|número da partida|número da rodada`.
2. Um hash chamado xmur3 transforma esse texto num número, e o gerador mulberry32 produz a sequência "aleatória" a partir dele.
3. O embaralhamento de [Fisher-Yates](https://pt.wikipedia.org/wiki/Embaralhamento_de_Fisher-Yates) usa essa sequência para embaralhar as cartas de 1 a 100.

No trecho abaixo, versão simplificada de [js/core.js](https://github.com/sschonss/ito/blob/main/js/core.js), repare que a única entrada é o texto da semente: nada vem da rede.

```javascript
// mesmo texto de entrada, mesmo baralho em qualquer celular
const rng = seed => mulberry32(xmur3(seed)());
const deckFor = (code, game, round) =>
  shuffle([...Array(100)].map((_, i) => i + 1), rng(`${code}|${game}|${round}`));
```

![As cartas não trafegam. O texto da semente, código da sala, partida e rodada, passa pelo hash xmur3, pelo gerador mulberry32 e pelo embaralhamento Fisher-Yates, e cada celular chega ao mesmo baralho de 1 a 100. Pela rede vão só as decisões: baixar a carta, a ordem, os votos e as dicas](/images/posts/how-ito-works/deck-pt.svg)

Pela rede vão só as **decisões**: "baixei minha carta", "arrumei a ordem assim", votos e dicas. Mensagens pequenas, e nada de carta circulando.

O código da sala também carrega a configuração. São 8 letras sem I e O (para não confundir com 1 e 0):

- As 4 primeiras são o sorteio da sala.
- As 4 últimas guardam, em base 24, o número de rodadas e as categorias de tema escolhidas.

Quem digita o código já sabe como a partida foi configurada.

**Em resumo:** com a mesma semente, todo celular calcula o mesmo baralho. Pela rede só passam as decisões dos jogadores.

## Quem manda na partida: o anfitrião

Com vários celulares, quem decide o que é verdade? No Ito, a regra é simples: **quem cria a sala é o anfitrião (host), e ele é a única fonte da verdade**. Os outros são os convidados (guests).

A inspiração veio do modelo de anfitrião que eu conhecia das partidas online de FIFA e EA FC, em que um dos lados hospeda a partida e o outro se conecta a ele. No Ito, o anfitrião é o celular do João.

Só o anfitrião altera o estado da partida. O **estado** é a foto completa do jogo naquele instante: quem está na sala, o tema, quem já baixou carta, a ordem na mesa.

Os celulares conversam com poucos tipos de mensagem. Os nomes são curtos porque aparecem no código:

- **`act`** ("ação"): o pedido de um convidado, como "baixei minha carta".
- **`state`** ("estado"): o estado inteiro, enviado pelo anfitrião a cada mudança.
- **`ack`** (de acknowledge, "confirmar recebimento"): o convidado avisa "recebi a versão 8".
- **`tick`** ("tique", como o de um relógio): um pulso que o anfitrião manda a cada 2 segundos, com a versão e um hash do estado.
- **`pull`** ("puxar"): o convidado pede "me manda o estado de novo".

Cada mudança aumenta a versão do estado (`ver`), um contador que só cresce, e o anfitrião manda o estado inteiro. O convidado só aceita um estado mais novo do que o que já tem.

O `tick` funciona como um juiz que, de tempos em tempos, confere o placar com todo mundo. Ele leva a versão e o hash do estado: se qualquer detalhe for diferente, o hash muda. Quem estiver diferente pede o estado de novo.

O trecho abaixo é o que o convidado faz a cada `tick`. Repare na condição: se a versão ou o hash não batem com o que ele tem, ele manda um `pull`.

```javascript
// no convidado, a cada tick do anfitrião
if (msg.ver !== my.ver || msg.h !== stateHash(my)) {
  guestSend({ t: 'pull' }); // "me manda o estado de novo"
}
```

O trecho é uma versão simplificada da função `dispatch`, em [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js), e o `tick` sai da função `syncTick`, no mesmo arquivo. O pedido `pull` não vai só para o anfitrião: ele sai assinado para todos os celulares ligados, e isso vai fazer diferença na seção sobre a malha.

O ciclo completo, quando a Maria baixa uma carta, com a assinatura que aparece na próxima seção:

![Diagrama de sequência entre convidado e anfitrião. 1: o convidado manda act, "baixei minha carta". 2: o anfitrião aplica a regra, a versão passa de 7 para 8, e ele assina com a chave privada. 3: manda state, versão 8, com a assinatura. 4: o convidado confere a assinatura com a chave pública fixada pela impressão digital do link. 5: o convidado responde ack com a versão e o hash. 6: a cada 2 segundos, o anfitrião manda tick com versão e hash. 7: se o hash não bate, o convidado manda pull. 8: o anfitrião reenvia o state assinado. Embaixo, em vermelho: estado sem assinatura válida ou com versão velha é descartado](/images/posts/how-ito-works/host-pt.svg)

Isso corrige mensagens perdidas sem ninguém perceber. Se o estado com a carta da Maria se perder a caminho de algum celular, no próximo `tick` esse celular nota a diferença e pede de novo.

Não é um algoritmo de consenso sofisticado (o tipo de algoritmo que faz várias máquinas concordarem sem um chefe). É uma fonte da verdade e uma conferência periódica. Para um jogo entre amigos, é exatamente o necessário.

Dá para ver essa diferença de papéis na própria tela. Na mesma rodada, capturada no lab, o anfitrião tem o botão "Revelar nessa ordem" e pode mudar o tema; o convidado vê só o aviso de que, quando todos concordarem, o João revela:

![Duas capturas reais da mesma rodada do Ito, lado a lado. À esquerda, a tela do anfitrião, João: o tema "Programas de TV de domingo", de 1, sono, a 100, imperdível, o botão "Mudar tema", a carta virada para baixo e o botão vermelho "Revelar nessa ordem". À direita, a tela da convidada, Maria: o mesmo tema e a mesma rodada 1 de 5, a carta virada para baixo e, no lugar do botão, o aviso "Quando todos concordarem, João revela"](/images/posts/how-ito-works/ito-partida-anfitriao-convidado.webp)

**Em resumo:** só o anfitrião muda o estado. Os convidados pedem ações, recebem o estado com versão e, a cada 2 segundos, conferem se estão em dia.

## Ninguém se passa pelo anfitrião: assinaturas

Se o anfitrião é a verdade, o que impede alguém de mandar um estado falso dizendo "eu sou o anfitrião"? A [**assinatura digital**](https://developer.mozilla.org/en-US/docs/Glossary/Signature/Security).

A ideia, sem matemática, usa um par de chaves (é a [criptografia de chave pública](https://developer.mozilla.org/en-US/docs/Glossary/Public-key_cryptography)):

- A **chave privada** é um carimbo que só você tem e nunca sai do aparelho.
- A **chave pública** é uma cópia do desenho do carimbo. Todo mundo pode usar para conferir se um documento foi carimbado por você, mas ninguém consegue carimbar com ela.

Na primeira vez que abre o jogo, cada celular gera o seu par de chaves usando a [WebCrypto](https://developer.mozilla.org/pt-BR/docs/Web/API/SubtleCrypto/sign), a API de criptografia que já vem no navegador (o código está em [js/crypto.js](https://github.com/sschonss/ito/blob/main/js/crypto.js)).

O tipo de chave é **ECDSA P-256**. ECDSA (Elliptic Curve Digital Signature Algorithm) é um algoritmo de assinatura baseado em curvas elípticas, e P-256 é a curva usada. É o mesmo algoritmo que o servidor usa para carimbar cada envio no [Web Push](/pt-br/posts/how-web-push-works/).

Na partida, funciona assim:

- O anfitrião carimba (assina) cada estado, e todos conferem.
- O estado leva a chave pública do dono da sala, e o link de convite leva a **impressão digital** dela (um resumo curto da chave). Assim, a Maria, que entrou pelo convite, já sabe qual carimbo esperar.
- A apresentação de cada jogador ao entrar na sala (a mensagem `hello`, "olá") também é assinada, para ninguém ocupar o lugar de outra pessoa.

O próprio projeto deixa claro o limite: isso protege contra um anfitrião falso, **não** contra quem já está na sala. Como as cartas são calculadas no celular, alguém que saiba inspecionar o código no navegador poderia descobrir os números.

Impedir isso exigiria um servidor guardando as cartas. Para um jogo entre amigos, é um trade-off (uma troca consciente) aceitável.

**Em resumo:** cada estado sai com o carimbo do anfitrião, e o convite diz qual carimbo esperar. Um estado falso não passa na conferência.

## Quando nem todo mundo alcança o anfitrião: a malha

Até aqui, a história tinha o anfitrião ligado direto a cada convidado. Na prática, nem todo par de celulares consegue abrir um canal: os NATs difíceis e as redes que bloqueiam UDP, da primeira parte do artigo, valem para cada par separadamente.

Imagine que um terceiro jogador, o Pedro, entra na sala. Pode acontecer de o João (anfitrião) ter canal com a Maria, a Maria ter canal com o Pedro, e o Pedro não ter canal nenhum com o João.

Por isso o Ito funciona como uma **malha** (mesh, em inglês): uma rede em que cada celular se liga a quem conseguir, e os recados vão passando de um para outro até chegar. É como passar um bilhete na sala de aula, de carteira em carteira.

O anfitrião continua sendo a única fonte da verdade e continua assinando o estado. O que muda é o caminho: quem recebe um estado assinado mais novo do que o que já tinha repassa o mesmo pacote para os celulares ligados a ele.

![Diagrama de sequência com três colunas: João, o anfitrião; Maria, com canal com João e com Pedro; e Pedro, sem canal direto com João. 1: João manda o estado na versão 12, assinado, e Maria confere e aceita porque 12 é maior que 11. 2: Maria repassa o mesmo pacote assinado, e Pedro confere a assinatura de João. 3, em vermelho: a versão 12 chega de novo pela outra rede e Maria descarta sem repassar. 4: Pedro manda uma dica assinada por ele, com um id. 5: Maria repassa a ação intacta e João aplica uma vez, indo para a versão 13. 6 e 7: o estado 13 vai de João para Maria e de Maria para Pedro. Na tela de Pedro aparece "conectado via Maria". Embaixo: quem está no meio só repassa e não consegue mudar nada; e, em vermelho, o limite: se Pedro não tiver canal com ninguém da sala, não há por onde repassar, e quem resolve é o TURN](/images/posts/how-ito-works/mesh-pt.svg)

### O estado indo: de João para Maria, e de Maria para Pedro

No exemplo do desenho, o João aplica uma jogada e manda o estado na versão 12, assinado. A Maria confere a assinatura, vê que 12 é maior do que a 11 que ela tinha, aceita e repassa o pacote **do jeito que chegou**, com a assinatura do João.

O Pedro faz a mesma conferência com a chave pública do João, não com a da Maria. Para ele, tanto faz por onde o estado veio: o carimbo é do anfitrião.

Duas regras seguram esse esquema:

- **A versão fica dentro da parte assinada.** O `ver` é o contador que cresce a cada mudança do estado, como na seção sobre o anfitrião. Como ele faz parte do que o João assinou, ninguém no meio troca o 12 por 99 sem quebrar a assinatura.
- **Só se repassa versão estritamente maior.** Se a versão 12 chega de novo (pela outra rede de sinalização, ou de volta pelo próprio Pedro), ela não é maior do que a 12 que a Maria já viu, então não é repassada.

A segunda regra evita dois problemas:

- O **loop**, em que um recado fica dando voltas para sempre entre a Maria e o Pedro.
- O **replay** ("repetição"), em que alguém guarda um estado antigo, verdadeiro e bem assinado, e o reenvia mais tarde para fazer a partida voltar no tempo. A assinatura velha continua válida, mas a versão velha não passa.

Como o jogo roda em HTTPS, todo estado vai assinado. Quem está no meio não consegue mudar uma carta, um ponto ou a ordem: qualquer alteração invalida o carimbo, e o estado é descartado.

### As ações voltando pelo mesmo caminho

O caminho de volta é o espelho. Quando o Pedro dá uma dica, baixa a carta, mexe na ordem, vota, troca de nome, sai da sala ou escreve no chat, o pedido:

- sai assinado com a chave **do Pedro**;
- leva um `id`, um identificador único daquele pedido.

A Maria confere a assinatura com a chave do Pedro, que ela conhece porque a lista de jogadores do estado traz a chave pública de cada um. Depois repassa ao João sem tocar em nada.

O `id` resolve a duplicação: numa malha, o mesmo pedido pode chegar por mais de um caminho. O João aplica cada `id` uma vez só, então a dica do Pedro não conta em dobro. E a assinatura impede a Maria de inventar uma jogada em nome do Pedro ou de trocar a dica dele por outra.

Na tela do Pedro aparece um aviso discreto, "conectado via Maria", para ele saber que está jogando por tabela. E o aviso de que o anfitrião caiu só aparece se esse caminho indireto também sumir: enquanto o `tick` do João continua chegando pela Maria, ninguém assume o lugar dele.

Para ver o código: o repasse do estado (`spreadState`) e das ações fica em [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js), a assinatura de cada pedido (`seal`) fica em [js/crypto.js](https://github.com/sschonss/ito/blob/main/js/crypto.js), e o desenho completo da malha está em [docs/p2p.md](https://github.com/sschonss/ito/blob/main/docs/p2p.md), na seção "Malha".

### O que a malha não resolve

A malha só ajuda quem tem canal com **alguém** da sala. Se o Pedro não conseguir abrir canal com ninguém, não há por onde repassar, e ele continua de fora.

Esse é o caso dos NATs difíceis e das redes que bloqueiam UDP, e quem resolve é o TURN da Cloudflare, visto lá no começo: ele dá ao Pedro um caminho até pelo menos um dos outros celulares. Um complementa o outro, nenhum substitui o outro.

E a Maria, mesmo sem conseguir forjar ou alterar nada, ainda pode simplesmente parar de repassar. Nesse caso o Pedro fica sem notícias, como se a conexão tivesse caído.

**Em resumo:** quem não alcança o anfitrião recebe o estado por tabela. Quem está no meio só repassa, porque a assinatura e a versão impedem qualquer mudança.

## E se o anfitrião cair?

O anfitrião é a fonte da verdade, então ele também é um ponto único de falha. Imagine que o João entra num elevador e o celular dele perde o sinal.

Se o celular do anfitrião perde a conexão (nas duas redes) e não volta em uns 5 segundos, o jogador conectado com o menor número de lugar na mesa vira **anfitrião provisório**.

- Só assume quem recebeu o estado atual nesta sessão.
- Ele aumenta a versão (`ver + 1`) para que todos reconheçam o estado novo.

Quando o João, dono da sala, volta, ele espera um instante para pegar o estado mais novo do provisório e **reassume**. A partida continua de onde parou, sem perder jogadas.

As assinaturas também cobrem esse caso: o estado do provisório só é aceito enquanto o dono está fora, e com a chave que todos já conheciam. A troca de anfitrião está nas funções `considerHostLost` e `finishReclaim`, em [js/net.js](https://github.com/sschonss/ito/blob/main/js/net.js).

**Em resumo:** se o anfitrião some, outro jogador segura a partida até ele voltar, e ninguém perde jogada.

## Como testar algo que depende de redes públicas

Depender de relays e brokers de terceiros é ótimo até o dia em que um deles muda. Por isso o Ito tem dois tipos de teste:

- **Testes end-to-end com um relé falso:** são testes que usam o app inteiro, como uma pessoa usaria. Eles abrem vários "celulares" num navegador controlado pelo [Playwright](https://playwright.dev/) (uma ferramenta que automatiza navegadores) e trocam a biblioteca de conexão por uma falsa, que imita as duas redes dentro do próprio teste. Rápido e sem depender da internet.
- **Um teste diário com as redes de verdade:** um workflow (uma rotina automática) do [GitHub Actions](https://github.com/features/actions) roda todo dia, conecta dois navegadores pela internet real e joga uma rodada em três cenários: só pelo Nostr, só pelo MQTT e pelas duas redes juntas. Se um relay ou broker público mudar, o teste avisa antes de alguém tentar jogar.

## Limites e o que aprendi

"Sem servidor" precisa de asterisco: **não existe um servidor central da partida**. Ainda existem relays Nostr, brokers MQTT, servidores STUN, o TURN da Cloudflare (com o meu Worker) e as [CDNs](https://developer.mozilla.org/pt-BR/docs/Glossary/CDN) (redes de servidores que entregam arquivos) de onde a biblioteca é carregada.

Todos são de terceiros e podem sair do ar. As duas redes e os endereços reserva reduzem o risco, mas não zeram. O jogo também precisa de internet para a primeira conexão e, como contei, não é à prova de trapaça entre quem já está na sala.

O que eu levo do laboratório:

- **O navegador sabe muito mais do que eu imaginava:** conexão P2P criptografada e criptografia de verdade, sem instalar nada.
- **Às vezes o melhor jeito de sincronizar é não mandar:** o baralho determinístico eliminou uma categoria inteira de problemas.
- **Uma fonte da verdade com versão e conferência resolve muito:** antes de buscar um algoritmo de consenso, vale perguntar se não basta um chefe e uma checagem a cada 2 segundos.
- **Ser honesto sobre as dependências:** nomear o que é de terceiros ajuda a decidir o que testar todo dia.

Abra o [Ito](https://sschonss.github.io/ito/), crie uma sala e chame os amigos: tudo o que está aqui acontece de verdade no seu celular. E, se ainda não leu, o contexto de por que eu fiz isso está em [Trabalhar não é estudar](/pt-br/posts/personal-projects-as-a-lab/). Se você já brincou com WebRTC ou tem uma ideia de jogo P2P, me conta nos comentários.

## Glossário rápido {#glossary}

Todos os termos do artigo, em uma linha cada, na ordem em que aparecem:

| Termo | Em uma frase |
| --- | --- |
| PWA | Site que dá para instalar e abrir como um app. |
| WebRTC | Tecnologia do navegador para comunicação direta em tempo real, a mesma das videochamadas. |
| Data channel | O "cano" do WebRTC por onde passam dados quaisquer, como as jogadas. |
| P2P | Cada aparelho fala direto com os outros, sem um servidor central no meio. |
| DTLS / TLS | A criptografia do canal; o TLS é o cadeado do HTTPS, e o DTLS é a versão para esse tipo de conexão. |
| IP público / privado | O endereço de um aparelho; o público vale na internet toda, o privado só dentro de casa. |
| Porta | Número extra junto do endereço, como o número do apartamento no envelope. |
| NAT | O roteador como porteiro: um endereço público para a casa toda, e só deixa entrar resposta. |
| CGNAT | NAT da operadora, com milhares de clientes atrás do mesmo endereço público. |
| UDP | Tipo de pacote rápido e sem confirmação de entrega, o preferido do WebRTC. |
| ICE | O processo que junta os endereços possíveis e testa qual caminho funciona. |
| Candidato ICE | Um endereço em que o celular talvez possa ser encontrado (`host`, `srflx` ou `relay`). |
| STUN | Servidor que responde "é assim que você aparece lá fora". |
| Hole punching | Os dois lados mandam pacotes ao mesmo tempo para abrir caminho pelos NATs. |
| TURN | Servidor que repassa os dados cifrados quando o caminho direto não abre. |
| Sinalização | A troca de bilhetes antes do canal direto existir. |
| SDP | A "ficha técnica" da conexão, trocada como oferta e resposta. |
| Relay Nostr / broker MQTT | Servidores públicos que o Ito usa como mural de avisos para a sinalização. |
| Hash | Impressão digital curta de um texto; qualquer mudança no texto muda o hash. |
| Idempotente | Receber a mesma mensagem duas vezes dá no mesmo que receber uma. |
| Semente | O texto de partida de um gerador pseudoaleatório; mesma semente, mesmos números. |
| Anfitrião (host) / convidado (guest) | Quem criou a sala e manda no estado / quem entrou e pede ações. |
| `act`, `state`, `ack`, `tick`, `pull` | Pedido de ação, estado completo, confirmação, conferência a cada 2 segundos e "me manda de novo". |
| Assinatura digital | Carimbo feito com a chave privada e conferido com a chave pública. |
| ECDSA P-256 | O algoritmo e a curva usados nas assinaturas do Ito. |
| Malha (mesh) | Cada celular se liga a quem conseguir, e os recados vão passando adiante. |
| Replay | Reenviar um recado antigo e verdadeiro para voltar no tempo; a versão impede. |
| CDN | Rede de servidores que entrega arquivos, como a biblioteca de conexão. |
