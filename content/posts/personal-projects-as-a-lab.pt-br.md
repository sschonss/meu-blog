---
title: 'Trabalhar não é estudar: onde o aprendizado foi parar na era da IA'
date: 2026-11-02
description: 'Entregar no trabalho e aprender são coisas diferentes, e a IA deixou isso mais claro. Uma reflexão sobre como o estudo mudou e por que projetos pessoais viraram o lugar dele.'
translationKey: personal-projects-as-a-lab
tags: ['Carreira', 'IA']
series: ['Estudos por curiosidade']
series_weight: 1
draft: false
---

Uma pergunta que eu comecei a me fazer: quando foi a última vez que eu **estudei** programação? Não estou falando de resolver um ticket difícil, nem de entregar uma feature com uma tecnologia nova. Estou falando de parar para entender alguma coisa até conseguir explicar para outra pessoa.

Por muito tempo, eu achei que essas duas coisas eram a mesma. Eu programava o dia inteiro, então estava aprendendo o dia inteiro, certo? Hoje eu acho que não. E acho que a IA só deixou claro algo que já era verdade antes.

Este texto não é tutorial nem tem padrão de arquitetura. É uma provocação: **trabalhar com programação é uma coisa, estudar programação é outra**, e o jeito de fazer a segunda mudou.

## Entregar não é aprender

No trabalho, o objetivo é entregar valor com segurança. Tem prazo, tem time, tem cliente, tem o padrão que a empresa já usa. Faz todo sentido escolher a tecnologia conhecida, o caminho com menos risco e a solução que já funcionou da última vez. Ninguém deveria transformar a sprint num experimento só porque quer aprender algo novo.

O detalhe é que, nesse modo, o aprendizado é um **efeito colateral**. Ele acontece quando sobra espaço, e não é o que está sendo medido. A pergunta da daily é "terminou?", não "entendeu?". E dá para terminar muita coisa sem entender quase nada, principalmente quando o código já existe e você só precisa encaixar mais uma peça.

Durante muitos anos, esse efeito colateral foi grande o bastante para ninguém reparar. Para entregar, você precisava bater cabeça: ler a documentação, testar três respostas do Stack Overflow, colocar um `print` em todo lugar até achar o problema. Era lento e frustrante, mas o atrito ensinava. Você saía do ticket sabendo um pouco mais, querendo ou não.

## O que a IA mudou

Hoje um agente de IA (um assistente que lê o código, escreve, roda comandos e corrige o que deu errado) tira boa parte desse atrito. E, no trabalho, isso é ótimo: o que antes levava uma tarde sai em minutos, com revisão e guardrails (as regras e checagens que mantêm o agente no trilho). Eu escrevi uma [série inteira](/pt-br/series/arquitetura-amigável-à-ia/) sobre preparar sistemas para isso, e continuo achando que é o caminho.

Mas o atrito que ia embora era justamente a parte que ensinava. A entrega continua saindo; o aprendizado que vinha de carona, não necessariamente.

Isso não é só impressão. Em janeiro de 2026, a Anthropic publicou um [experimento controlado](https://www.anthropic.com/research/AI-assistance-coding-skills) com 52 desenvolvedores, a maioria em início de carreira, aprendendo uma biblioteca Python que não conheciam. Quem usou assistente de IA terminou um pouco mais rápido, mas a diferença não foi estatisticamente significativa. Já no teste sobre os conceitos que tinham acabado de usar, o grupo com IA ficou em média em 50%, contra 67% de quem programou sem. A maior diferença foi nas perguntas de debugging, ou seja, em entender por que um código falha. O [artigo completo](https://arxiv.org/abs/2601.20245) é pequeno e tem limites, mas a parte mais interessante é outra: as pessoas que usaram a IA para **perguntar e pedir explicação**, e não só para gerar código, mantiveram o aprendizado.

Ou seja: a ferramenta não decide se você aprende. O jeito de usar decide. E o trabalho, com toda razão, empurra para o jeito que entrega mais rápido.

## Então onde fica o estudo?

Se o aprendizado não vem mais de carona, ele precisa de um lugar próprio. Para mim, esse lugar virou o projeto pessoal, tratado como **laboratório**.

A diferença não é a tecnologia, é o critério de sucesso:

- **No trabalho**, pronto é quando atende o requisito. Erro custa caro. A stack é a do time.
- **No laboratório**, pronto é quando eu consigo explicar como funciona. Erro é o conteúdo do estudo. A stack é a que me deixou curioso.

Nenhum dos dois é melhor. O problema aparece quando cobro de um o que é do outro: esperar que o trabalho me ensine tudo, ou tratar o fim de semana como mais uma sprint, com prazo e entregável.

E tem uma ironia boa aqui. A mesma IA que tira o atrito do trabalho tornou o laboratório muito mais barato. Antes, para chegar na pergunta que me interessava, eu gastava semanas com setup, build, tela e deploy, e muita ideia morria no boilerplate (aquele código repetitivo que todo projeto precisa e ninguém quer escrever). Hoje o esqueleto sai numa noite, e o tempo que sobra vai para a parte que eu sempre gostei: entender como aquilo funciona por baixo. Foi assim que eu voltei a programar por diversão.

## Como eu estudo usando IA

Não é um texto anti-IA. É sobre ser intencional. A regra que eu sigo no laboratório é simples:

> **Deixo o agente fazer o que eu já sei fazer. Faço à mão, ou leio linha a linha, o que eu quero aprender.**

Na prática, o agente monta a tela, o CSS, o workflow de deploy. Quando chego no pedaço que me deu curiosidade, eu desacelero:

- **Pergunto "por que assim?"** até a resposta fazer sentido, em vez de aceitar o código que funcionou.
- **Quebro de propósito** para ver o erro acontecer. Debugging foi exatamente onde o estudo da Anthropic viu a maior perda, então é onde eu mais insisto.
- **Leio a especificação**, não só o resumo do agente.
- **Escrevo sobre o que aprendi**, num README ou aqui no blog. Escrever é o melhor teste de "entendi mesmo?". Se eu não consigo explicar um trecho, ele ainda não é meu.

Repare que nada disso é novo. É o jeito de estudar de sempre. O que mudou é que antes o trabalho fazia parte disso por mim, sem eu pedir, e agora eu preciso escolher fazer.

## Como isso ficou por aqui

Este próprio blog começou assim. Eu queria saber até onde um site estático, que é só um monte de arquivos HTML sem servidor nenhum, conseguia se comportar como um sistema vivo. Ele é gerado pelo [Hugo](https://gohugo.io/) e hospedado de graça no GitHub Pages. Todo dia de manhã, um workflow do GitHub Actions roda sozinho: busca minhas palestras na API pública do [Sessionize](https://sessionize.com/), reconstrói o site e, nessa reconstrução, publica os artigos que estavam agendados para aquele dia. Depois do deploy, um script prepara a newsletter dos posts novos no [Buttondown](https://buttondown.com/). Não tem banco de dados nem servidor para manter, e mesmo assim o site muda sozinho. Os detalhes estão em [Hugo, Sessionize e um cron](/pt-br/posts/hugo-sessionize-cron-blog-setup/).

Neste mesmo pacote saem mais dois textos que nasceram desse jeito de estudar.

O primeiro é sobre o [Ito](/pt-br/posts/how-ito-works/), um jogo para jogar com os amigos, cada um no seu celular. Eu fiz ele **peer-to-peer** (P2P): os celulares conversam direto entre si, sem servidor de jogo no meio. Fiz assim porque queria entender como isso funciona, e a curiosidade veio do FIFA, hoje EA FC. Em partidas P2P, [segundo a própria EA](https://www.ea.com/games/battlefield/news/pitch-notes-fifa20-game-data-center), a conexão vai direto de um console para o outro e um dos jogadores vira o anfitrião da partida. No Ito é parecido: quem cria a sala é o anfitrião. O que me pegou foram as perguntas que vêm junto. Se não tem servidor, como dois celulares se acham na internet? E o que impede um deles de trapacear?

O segundo é sobre o [Web Push](/pt-br/posts/how-web-push-works/), a notificação que chega com a aba fechada. O lab virou um PWA, que é o site instalado como aplicativo, e mostra que dá para mandar notificação sem contratar nenhum serviço de notificações. Quem entrega é o serviço de push do próprio navegador, sem custo, e a mensagem vai cifrada de um jeito que nem esse serviço consegue ler. Do seu lado, basta um servidor pequeno e um par de chaves.

Nenhum dos dois vai mudar o meu trabalho amanhã. Eles existem porque eu queria saber como as coisas funcionam, e são o exemplo do que eu chamo de laboratório: perguntas que eu levei até conseguir explicar.

## Para quem está em dúvida se ainda vale estudar

Se você está pensando se ainda vale a pena estudar programação em 2026, a minha resposta é: vale, mas não espere que o trabalho faça isso por você. Algumas ideias que funcionaram para mim:

- **Escolha algo pequeno, útil para você e com um conceito novo só.** Um projeto que você vai usar te dá motivo para terminar; um conceito novo (e não cinco) te dá chance de entender de verdade.
- **Use a IA para tirar o atrito, não para pular o entendimento.** Peça o esqueleto, mas fique com a parte que importa.
- **Meça de outro jeito.** No laboratório, a pergunta não é "terminei?". É "aprendi algo que não sabia?" e "me diverti?".

E se o seu trabalho virou só entrega, tudo bem. Trabalho é isso mesmo. Como resumiu o Chris Kiehl em [It's still OK to enjoy programming](https://chriskiehl.com/article/it-is-still-ok-to-enjoy-programming): "But that's work. Work is not life." A curiosidade pode morar em outro lugar.

## Para fechar

A IA não acabou com o estudo de programação. Ela acabou com a ilusão de que trabalhar e estudar eram a mesma coisa. O que antes acontecia sem a gente perceber agora precisa de tempo, de um lugar e de intenção.

Então fica a pergunta que eu me fiz no começo: **o que você está estudando hoje, só porque é bom saber?** Me conta nos comentários ou no [LinkedIn](https://www.linkedin.com/in/luiz-schons/).
