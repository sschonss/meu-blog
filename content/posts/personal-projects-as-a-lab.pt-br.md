---
title: 'Programar ainda é divertido: o prazer de criar coisas na era da IA'
date: 2026-11-03
description: 'O trabalho ensina muito, mas criar coisas por curiosidade é outro jeito de aprender. Com a IA, tirar uma ideia da gaveta ficou fácil, e programar voltou a ser uma brincadeira.'
translationKey: personal-projects-as-a-lab
tags: ['Carreira', 'IA']
series: ['Estudos por curiosidade']
series_weight: 1
draft: false
---

Faz tempo que eu não me divertia tanto programando. Sério. Aquelas ideias que ficavam anos na gaveta, do tipo "um dia eu queria entender como isso funciona", agora viram alguma coisa rodando numa noite. E no meio do caminho eu acabo aprendendo um monte, quase sem perceber.

Este texto não é tutorial. É mais um relato animado de quem redescobriu o prazer de **criar coisas só porque sim**, e de como isso virou o meu jeito favorito de estudar.

## O trabalho também ensina (e muito)

Antes de qualquer coisa: eu aprendo muito no trabalho. É lá que aparecem os problemas de verdade, com usuário real, produção, prazo e um time inteiro revisando o que eu faço. Muita coisa que eu sei hoje veio de um bug em produção ou de uma revisão de código caprichada. A [série sobre arquitetura amigável à IA](/pt-br/series/arquitetura-amigável-à-ia/) que eu escrevi aqui no blog nasceu justamente disso.

Só que o trabalho tem um jeito próprio de ensinar. O problema vem pronto, a stack é a do time e faz todo sentido escolher o caminho mais seguro. Eu aprendo o que o problema pede.

No projeto pessoal, a lógica se inverte. Eu escolho a pergunta. A stack é a que me deixou curioso. E se der tudo errado, tudo bem, o erro vira parte da graça. Não é um jeito melhor nem pior de aprender, é **outro jeito**, mais solto, mais brincadeira. E os dois se completam: o que eu descubro brincando volta para o trabalho, e o que o trabalho me ensina deixa as brincadeiras mais ambiciosas.

## Criar ficou fácil, e isso é ótimo

Durante muito tempo, o que matava as minhas ideias não era a parte difícil. Era a parte chata. Para chegar na pergunta que me interessava, eu precisava de setup, build, tela, CSS, deploy... e muita ideia morria no boilerplate (aquele código repetitivo que todo projeto precisa e ninguém quer escrever).

Hoje um agente de IA (um assistente que lê o código, escreve, roda comandos e corrige o que deu errado) resolve boa parte disso. O esqueleto sai numa noite, e o tempo que sobra vai inteiro para a parte que eu sempre gostei: entender como aquilo funciona por baixo.

Tem gente que acha que a IA tirou a graça de programar. Para mim foi o contrário. Ela tirou a parte que me fazia desistir e deixou a parte que me fazia começar.

## Construir também é estudar

Quando você constrói alguma coisa por curiosidade, as perguntas aparecem sozinhas. Você não lê sobre WebRTC porque está no cronograma; você lê porque o seu jogo não conecta no 4G e você quer saber por quê. Esse tipo de pergunta gruda na cabeça de um jeito que nenhum curso consegue.

Mas tem um cuidado. Se eu deixar o agente fazer tudo, eu termino com um projeto funcionando e nenhuma ideia de como. A Anthropic publicou em janeiro de 2026 um [experimento](https://www.anthropic.com/research/AI-assistance-coding-skills) com desenvolvedores aprendendo uma biblioteca Python nova: quem só pediu código para a IA foi pior no teste sobre os conceitos, principalmente em debugging. Já quem usou a IA para **perguntar e pedir explicação** manteve o aprendizado ([artigo completo](https://arxiv.org/abs/2601.20245)).

Então eu sigo uma regra simples:

> **Deixo o agente fazer o que eu já sei fazer. Faço à mão, ou leio linha a linha, o que eu quero aprender.**

Na prática, o agente monta a tela e o workflow de deploy. Quando chego no pedaço que me deu curiosidade, eu desacelero: pergunto "por que assim?" até fazer sentido, quebro de propósito para ver o erro acontecer, leio a especificação e, no fim, escrevo sobre o que aprendi. Escrever é o melhor teste de "entendi mesmo?".

## Coisas que eu criei só porque sim

**Este blog.** Eu queria saber até onde um site estático, que é só um monte de arquivos HTML sem servidor nenhum, conseguia se comportar como um sistema vivo. Ele é gerado pelo [Hugo](https://gohugo.io/), um gerador de sites estáticos, e hospedado de graça no GitHub Pages. Todo dia de manhã, um workflow do GitHub Actions roda sozinho: busca minhas palestras na API pública do [Sessionize](https://sessionize.com/), a plataforma que eventos usam para organizar as palestras, reconstrói o site e publica os artigos agendados para aquele dia. Depois do deploy, um script prepara a newsletter dos posts novos no [Buttondown](https://buttondown.com/). Sem banco, sem servidor, e o site muda sozinho. Os detalhes estão em [Hugo, Sessionize e um cron](/pt-br/posts/hugo-sessionize-cron-blog-setup/).

**O [Ito](/pt-br/posts/how-ito-works/).** Um jogo para jogar com os amigos, cada um no seu celular, feito **peer-to-peer** (P2P): os celulares conversam direto entre si, sem servidor de jogo no meio. A curiosidade veio do FIFA, hoje EA FC. Em partidas P2P, [segundo a própria EA](https://www.ea.com/games/battlefield/news/pitch-notes-fifa20-game-data-center), um dos jogadores vira o anfitrião da partida. Eu queria entender como isso funciona, e as perguntas foram aparecendo: se não tem servidor, como dois celulares se acham na internet? E o que impede um deles de trapacear? Um post mais adiante na série conta o que eu descobri.

**Um lab de [Web Push](/pt-br/posts/how-web-push-works/).** Sempre me intrigou como uma notificação chega com a aba fechada. O lab virou um PWA, que é o site instalado como aplicativo, e mostrou que dá para mandar notificação sem contratar nenhum serviço de notificações: quem entrega é o serviço de push do próprio navegador, sem custo, e a mensagem vai cifrada de um jeito que nem esse serviço consegue ler. Do lado de quem envia, basta um servidor pequeno e um par de chaves.

Nenhum desses projetos vai mudar o meu trabalho amanhã. E está tudo bem. Eles existem porque eu fiquei curioso, e cada um me ensinou mais do que muito tutorial.

## Se você quiser tentar

- **Comece pequeno e com uma curiosidade só.** Um projeto que você vai usar te dá motivo para terminar; um conceito novo (e não cinco) te dá chance de entender de verdade.
- **Use a IA para pular a parte chata, não a parte legal.** Peça o esqueleto, mas fique com o pedaço que te deixou curioso.
- **Meça pela diversão.** A pergunta não é "terminei?". É "aprendi algo que não sabia?" e "me diverti?".
- **Conte para alguém.** Um README, um post, uma conversa no café. Explicar fecha o ciclo.

## Para fechar

O Chris Kiehl escreveu um texto com um título que eu gosto muito: [It's still OK to enjoy programming](https://chriskiehl.com/article/it-is-still-ok-to-enjoy-programming). Eu iria além: talvez nunca tenha sido tão bom gostar de programar. Criar ficou fácil, e quando criar fica fácil, sobra espaço para a curiosidade.

Então fica a pergunta: **o que você criaria hoje, só para descobrir como funciona?** Me conta nos comentários ou no [LinkedIn](https://www.linkedin.com/in/luiz-schons/).
