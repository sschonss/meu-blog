---
title: 'Ensinar uma vez só: uma memória compartilhada para os agentes de código do time'
date: 2026-11-28
description: 'Cada dev ensina ao próprio agente de IA como o time busca logs ou faz deploy. Um ensaio sobre guardar esse conhecimento numa memória compartilhada, com um laboratório como prova.'
translationKey: loom-shared-memory-coding-agents
tags: ['IA', 'Arquitetura']
---

Lembre da última vez que você pediu ao seu agente de IA para achar um log em produção. Provavelmente teve que explicar onde ficam os logs, qual ferramenta usar e qual filtro funciona. Agora pense no dev que senta do seu lado. Ele fez a mesma coisa semana passada, com o agente dele, do zero.

Todo time tem alguns fluxos padrão: buscar nos logs, fazer deploy de um serviço, descobrir quem está de plantão. Todo mundo faz, e todo mundo deveria fazer do mesmo jeito. Mas cada dev acaba ensinando a mesma lição para o próprio agente, de novo e de novo.

Este artigo apresenta outro jeito de pensar nesse conhecimento: guardar tudo **numa memória só, compartilhada por todos os agentes do time**, seja qual for o editor ou o provedor de IA de cada pessoa. Depois, mostra um laboratório pequeno que testou a ideia com dois editores.

## Antes de começar: três palavras

- **Agente de código:** o assistente de IA dentro do editor, como os do Cursor, do OpenCode ou do Claude Code. Você pede em linguagem natural e ele lê código, roda ferramentas e responde.
- **MCP (Model Context Protocol):** um jeito padrão de plugar ferramentas externas num agente. Se uma ferramenta fala MCP, qualquer editor que fala MCP consegue usar.
- **Memória compartilhada:** um lugar fora do editor onde os agentes guardam e consultam o que aprenderam. Neste artigo, a memória é o [Loom](https://loom.clickhouse.com/), um servidor de memória para agentes.

## O problema: cada agente aprende sozinho

O conhecimento do time quase nunca fica num lugar compartilhado. Ele fica na cabeça de alguém, num caderno pessoal ou no histórico de chat da máquina de um dev.

Os agentes de código pioraram isso sem ninguém perceber. Quando um dev explica para o agente dele como o time busca logs, essa explicação fica naquele chat, naquele editor. O agente do editor ao lado não sabe de nada. Então o próximo dev explica tudo de novo. E quando alguém troca de provedor de IA, também começa do zero.

![Diagrama: à esquerda, hoje, três devs ensinam cada um o seu agente (Cursor, OpenCode, Claude Code) e cada agente guarda as próprias anotações de como buscar logs. À direita, os três agentes leem e gravam numa memória compartilhada com os fluxos do time.](/images/posts/loom-shared-memory-coding-agents/problem-pt.svg)

Uma analogia ajuda. Imagine a cozinha de um restaurante onde cada cozinheiro guarda as receitas de cabeça. Todo cozinheiro novo precisa sair perguntando, e cada um aprende uma versão um pouco diferente do mesmo prato. A solução não é treinar cada cozinheiro separado. É ter um livro de receitas que fica na cozinha, onde os cozinheiros já estão.

Quem mais sente isso é o dev que acabou de chegar. Ele começa do zero, e o agente dele também.

## A ideia: uma memória para todos os agentes

E se os fluxos padrão do time ficassem numa memória que todo agente consegue ler e gravar?

Funciona assim, passo a passo:

1. Alguém descobre como fazer uma tarefa do jeito do time.
2. O agente dessa pessoa grava isso na memória compartilhada, uma vez só.
3. Depois, outro dev pergunta sobre a mesma tarefa para o próprio agente, em qualquer editor.
4. Esse agente olha primeiro na memória compartilhada e segue o que está lá.

O conhecimento passa a ser do time, não de uma máquina nem de um fornecedor. Trocar de provedor de IA não significa ensinar tudo de novo, porque a memória continua no mesmo lugar.

## Dois tipos de conhecimento: fatos e caminhos

Nem tudo deve ser copiado para a memória. Existem dois tipos de conhecimento, e cada um pede um tratamento.

Um **fato** muda pouco. "A janela de deploy é de segunda a sexta, das 8h às 14h." Tudo bem gravar o próprio fato na memória.

Um **dado vivo** muda o tempo todo, ou pertence a outro sistema. "Quem está de plantão hoje?" Se o nome for gravado na memória, amanhã ele está errado. Então a memória guarda o **caminho**: qual ferramenta chamar para conseguir a resposta. O agente segue o caminho e pega o valor atual no sistema que é dono dele.

Pense no bilhete na geladeira do escritório. Ninguém escreve "hoje o plantão é de tal pessoa", porque de manhã já estaria errado. O bilhete diz "confira a escala no quadro". O bilhete é o caminho. O quadro tem o valor.

## Por que não escrever uma documentação?

É a pergunta óbvia, e ela merece uma resposta honesta. O que vem a seguir é raciocínio, não algo que o laboratório mediu.

Documentação continua sendo necessária. Um bom runbook ou uma boa página de wiki ajuda as pessoas, e nada aqui substitui isso. A diferença está em quem lê, e quando.

| | Documentação | Memória compartilhada |
| --- | --- | --- |
| Escrita para | Pessoas | O agente, que então ajuda a pessoa |
| Lida quando | Alguém lembra de abrir | O agente consulta antes de responder |
| Escrita por | Muitas vezes outra pessoa, depois | Quem acabou de descobrir, na hora |
| Onde fica | Numa wiki, fora do editor | No lugar onde o agente já olha |

O ponto principal é o momento da necessidade. Quando um dev pergunta ao agente como achar um log, o agente não abre a wiki se ninguém mandou, e se ninguém disse onde ela está. A memória compartilhada fica no caminho dele.

A memória também tem custos, e eles são reais:

- **Ela fica desatualizada.** Igual à documentação. Pior: uma informação errada se espalha para todo agente que lê.
- **Ela precisa de curadoria.** Alguém tem que revisar o que entra e tirar o que ficou velho.
- **Ela precisa de controle de acesso.** Num time, nem todo mundo deveria poder reescrever tudo.

Então não é uma melhoria de graça em relação à documentação. É outra ferramenta, mais perto de onde o trabalho acontece, com os cuidados dela.

## O laboratório: testando a ideia

Para conferir se o mecanismo funciona, um laboratório pequeno ligou dois editores, o [Cursor](https://cursor.com/) e o [OpenCode](https://opencode.ai/), à mesma memória do Loom. Os dois se conectam a ela pelo MCP. Tudo rodou numa máquina só.

O objetivo não era construir um produto. Era responder uma pergunta: **o que é gravado num editor aparece mesmo no outro?**

O relato completo, com os prints reais de cada chat, está no repositório: [sschonss/loom-lab](https://github.com/sschonss/loom-lab/blob/main/docs/how-it-works.md). Os diagramas abaixo mostram o que aconteceu, de um jeito mais simples.

### Teste 1: um fato gravado num editor, lido no outro

No Cursor, a pessoa disse que a janela de deploy agora é de segunda a sexta, das 8h às 14h. O Cursor gravou esse fato no Loom.

Depois, no OpenCode, a pessoa perguntou qual é a janela de deploy. O OpenCode buscou no Loom e respondeu com o mesmo texto, dizendo de onde veio a resposta.

![Diagrama do primeiro teste: no Cursor, a pessoa informa a janela de deploy e o Cursor grava na memória compartilhada. No OpenCode, a pessoa pergunta qual é a janela de deploy, o OpenCode lê a memória e responde com o mesmo texto.](/images/posts/loom-shared-memory-coding-agents/fact-pt.svg)

Um detalhe importa: o OpenCode foi aberto numa pasta qualquer, fora do projeto do laboratório. Mesmo assim achou a resposta. A memória não está presa a um projeto nem a um editor.

### Teste 2: a memória guarda o caminho, não o valor

No OpenCode, a pessoa pediu para anotar como descobrir quem está de plantão. O OpenCode gravou só o procedimento: não chute o nome, pergunte ao serviço de plantão e responda o que ele devolver. Nenhum nome entrou na memória.

Depois, no Cursor, a pessoa perguntou quem é o plantonista hoje. O Cursor leu a memória, viu que a escala não está lá, seguiu o procedimento e perguntou ao serviço. O nome da resposta veio do serviço.

![Diagrama do segundo teste: o OpenCode grava na memória compartilhada só o procedimento, pergunte ao serviço de plantão. No Cursor, a pessoa pergunta quem está de plantão. O Cursor lê o procedimento na memória, chama o serviço de plantão por um conector pequeno, e o serviço devolve o nome de quem está de plantão hoje.](/images/posts/loom-shared-memory-coding-agents/path-pt.svg)

O serviço de plantão do laboratório é um mock feito com o [Mockoon](https://mockoon.com/), uma ferramenta que serve APIs falsas. Ele faz o papel de um sistema de plantão de verdade. Entre o editor e o serviço existe um conector pequeno, que só busca o valor atual. Ele não guarda nada.

Sendo honesto sobre um detalhe: nesse chat do Cursor, a conexão com o serviço de plantão ainda não tinha terminado de carregar. Então o agente chamou o mesmo serviço direto. A resposta foi a mesma.

No fim, a página de memórias do Loom mostrava os dois registros e qual editor gravou cada um: a janela de deploy pelo Cursor, o procedimento do plantão pelo OpenCode.

### O que o laboratório não testou

Só o Cursor e o OpenCode foram testados. O [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) se conectaria do mesmo jeito, apontando para a mesma memória, mas o laboratório não testou.

## Para onde isso pode ir

As perguntas do laboratório são triviais de propósito, para o mecanismo ficar fácil de ver. Elas são a prova, não o destino.

A mesma forma serve para as perguntas que um time faz de verdade. **Nada disto está construído.** É para onde a ideia aponta:

| Pergunta | O que a memória guarda | De onde vem a resposta |
| --- | --- | --- |
| Como eu acho este log em produção? | Onde olhar, qual consulta, qual ferramenta | O sistema de logs devolve a linha |
| Qual é o nosso processo de deploy? | Os passos e o que conferir antes de seguir | A memória, mais uma ferramenta quando um passo precisa |
| Vou fazer o deploy deste serviço. O que eu acompanho? | Quais dashboards importam, e em que ordem | O dashboard mostra o número |

Em todas as linhas, o agente que a pessoa já usa segue o caminho. Nenhum bot novo por assunto. Nenhuma dependência de um fornecedor só.

## Um limite

O laboratório rodou num modo local, de um usuário só, sem contas. Qualquer um que alcançasse a memória podia ler e gravar tudo. Isso serve para um teste numa máquina, e nada mais. Um time de verdade precisa de contas e de acesso por pessoa, e o Loom documenta isso em [Tokens and grants](https://loom.clickhouse.com/docs/guides/tokens-and-grants).

## Como saber se o seu time ganharia com isso

Algumas perguntas para começar:

- Mais de uma pessoa do time explica o mesmo fluxo para o próprio agente?
- Quando um dev novo precisa buscar logs ou fazer deploy, ele tem que achar uma pessoa específica?
- O time usa mais de um editor ou provedor de IA?
- Tem alguém disposto a cuidar do que entra numa memória compartilhada?

Se as três primeiras respostas forem "sim", vale testar a ideia. Se a última for "não", comece por ela.

## Conclusão

O ponto não é o Loom, nem um editor específico. É outro lugar para o conhecimento do time: escrito uma vez, por quem aprendeu, onde todo agente já olha. O laboratório mostrou que o mecanismo funciona entre dois editores. Fazer funcionar para um time inteiro é o próximo passo, com curadoria e controle de acesso.

Se você quiser ver como o laboratório foi montado, e os prints reais, está tudo em [sschonss/loom-lab](https://github.com/sschonss/loom-lab).

## Glossário

- **Agente de código:** o assistente de IA dentro de um editor, que lê código, roda ferramentas e responde.
- **MCP:** Model Context Protocol, um jeito padrão de plugar ferramentas externas num agente.
- **Memória compartilhada:** um lugar fora do editor onde todos os agentes do time guardam e consultam conhecimento.
- **Fato:** conhecimento que muda pouco e pode ficar guardado como texto.
- **Caminho:** instruções para conseguir um valor que muda, como qual ferramenta chamar.
- **Mock:** um serviço falso que responde como o de verdade, usado em testes.
- **Curadoria:** revisar o que entra na memória e tirar o que ficou desatualizado.

## Fontes

- [Loom](https://loom.clickhouse.com/)
- [Loom: connect a coding agent](https://loom.clickhouse.com/docs/getting-started/connect-a-coding-agent)
- [Loom: tokens and grants](https://loom.clickhouse.com/docs/guides/tokens-and-grants)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Mockoon](https://mockoon.com/)
- [O laboratório: sschonss/loom-lab](https://github.com/sschonss/loom-lab)
