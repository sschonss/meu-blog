---
title: 'Uma memória, qualquer editor: conhecimento do time compartilhado entre agentes de código com o Loom'
date: 2026-11-28
description: 'Um laboratório com Loom, Cursor e OpenCode: uma memória compartilhada via MCP, onde um fato gravado num editor é lido no outro, e os dados vivos vêm do sistema dono deles.'
translationKey: loom-shared-memory-coding-agents
tags: ['IA', 'Arquitetura']
---

A maioria dos times não está construindo um produto de IA. As pessoas já usam um agente de código no trabalho do dia a dia. Umas preferem o [Cursor](https://cursor.com/), outras o [OpenCode](https://opencode.ai/), outras o [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview). Essa parte está resolvida.

O problema é o que acontece com o que elas aprendem. Alguém descobre a janela de deploy, ou quem está de plantão, ou onde fica um log. Essa resposta fica presa no chat de uma pessoa. A próxima pessoa pergunta de novo, em outro editor, e começa do zero.

A solução de costume é um bot especialista por assunto. Um bot de deploy, um bot de plantão, um bot de logs. É mais coisa para construir e manter, e o conhecimento fica preso a quem hospeda o bot.

A ideia testada aqui é mais simples. Uma memória compartilhada. Quem descobre uma coisa grava. Quem pergunta depois, em outro editor, recebe a mesma resposta. Trocar de provedor não troca o conhecimento.

Um laboratório pequeno testou isso em 24 de novembro de 2026, numa máquina só, com dois editores: Cursor e OpenCode. O código e as anotações estão em [sschonss/loom-lab](https://github.com/sschonss/loom-lab).

## O setup em um parágrafo

O [Loom](https://loom.clickhouse.com/) é um servidor de memória para agentes. No laboratório, o Loom 1.3.0 rodou localmente em `http://127.0.0.1:7777`, no modo de um usuário só, namespace `local`, sem login. Os dois editores falam com ele pelo [MCP](https://modelcontextprotocol.io/) (Model Context Protocol, o jeito padrão de um editor plugar ferramentas externas) em `http://127.0.0.1:7777/mcp?toolset=coding`. O Cursor tem essa URL em `~/.cursor/mcp.json`. O OpenCode tem em `~/.config/opencode/opencode.json`. Os dois arquivos são globais do usuário, não de um projeto. O [guia de conexão](https://loom.clickhouse.com/docs/getting-started/connect-a-coding-agent) mostra cada editor.

Há dois jeitos de responder uma pergunta, e o laboratório testou os dois:

1. **Um fato estável fica na memória.** O próprio texto é a resposta.
2. **Um dado vivo não é copiado para a memória.** A memória guarda só o caminho até ele. O valor vem do sistema que é dono dele.

## Teste 1: um fato, dois editores

No Cursor, a pessoa disse que a janela de deploy agora é de segunda a sexta, das 8h às 14h. O Cursor procurou um registro anterior, não achou nenhum, e gravou o fato na chave `work/decision/deploy-window`.

![Chat do Cursor: a pessoa diz que a janela de deploy agora é de segunda a sexta, das 8h às 14h, e o Cursor responde que gravou o fato em work/decision/deploy-window, sem registro anterior](/images/posts/loom-shared-memory-coding-agents/01-cursor-saves-deploy-window-pt.webp)
*O Cursor grava a janela de deploy em `work/decision/deploy-window`.*

Depois, no OpenCode, a pessoa perguntou qual é a janela de deploy. O OpenCode chamou `loom_context_pack` e depois `loom_search`. Ele devolveu o mesmo texto, junto com a chave da memória de onde ele veio.

![O OpenCode chama loom_loom_context_pack e loom_loom_search e responde que a janela de deploy é de segunda a sexta-feira, das 8h às 14h, citando work/decision/deploy-window](/images/posts/loom-shared-memory-coding-agents/02-opencode-reads-deploy-window-pt.webp)
*O OpenCode encontra o mesmo fato e cita a chave `work/decision/deploy-window`.*

Um detalhe importa aqui. O OpenCode foi aberto numa pasta qualquer, não no repositório do laboratório. Mesmo assim ele leu a memória. A conexão com o Loom fica na configuração global do OpenCode, então a pasta aberta não fez diferença.

## Teste 2: a memória aponta para outro serviço

Quem está de plantão muda todo dia. Copiar o nome para a memória deixaria a memória errada no dia seguinte. Então a memória guarda o procedimento, não o valor.

No OpenCode, a pessoa pediu para anotar o procedimento do plantão. O OpenCode gravou `work/procedure/plantonista-de-hoje`. O procedimento diz: não chute o nome, chame a ferramenta `plantonista_de_hoje` no servidor MCP `plantao` e responda exatamente o que ela devolver. Nenhum nome de pessoa entrou na memória.

![O OpenCode confirma que anotou work/procedure/plantonista-de-hoje no Loom: não chutar o nome, chamar a ferramenta plantonista_de_hoje do servidor MCP plantao e responder o que ela devolver](/images/posts/loom-shared-memory-coding-agents/03-opencode-saves-oncall-procedure-pt.webp)
*O OpenCode grava o procedimento em `work/procedure/plantonista-de-hoje`, sem nenhum nome.*

Depois, no Cursor, a pessoa perguntou "quem é o plantonista hoje?". O Cursor leu o Loom, viu que a escala não está na memória e foi ao serviço. A resposta foi Luiz Schons, canal `#plantao`, até 25/11/2026 às 09:00 (horário de Brasília). É exatamente o que o serviço de mock devolveu.

![Chat do Cursor: perguntado quem é o plantonista hoje, o Cursor diz que a escala não fica na memória, avisa que o servidor de plantão ainda não terminou de carregar e responde Luiz Schons, canal #plantao, até 25/11/2026 às 09:00](/images/posts/loom-shared-memory-coding-agents/04-cursor-reads-oncall-pt.webp)
*O Cursor segue o caminho gravado e responde com o valor que veio do serviço.*

Sendo honesto sobre essa execução: nesse chat do Cursor, o servidor MCP `plantao` ainda não tinha terminado de carregar. O print mostra o Cursor dizendo isso. O editor chamou o mesmo processo do servidor direto, e o valor bateu com o mock do mesmo jeito. Num chat aberto depois de recarregar o editor, a chamada aparece como a ferramenta `plantonista_de_hoje`, como esperado.

## O que ficou no Loom

Depois dos dois testes, a memória tinha dois registros, um gravado por cada editor:

| Chave | O que guarda | Gravado pelo |
| --- | --- | --- |
| `work/decision/deploy-window` | A janela de deploy é de segunda a sexta-feira, das 8h às 14h. | Cursor |
| `work/procedure/plantonista-de-hoje` | Não chute o nome. Chame `plantonista_de_hoje` no MCP `plantao` e responda exatamente o que ela devolver. | OpenCode |

Os valores gravados estão em português, do jeito que foram escritos nos chats. A página Memories mostra em cada registro o cliente que gravou: `opencode` e `cursor-vscode`.

![Página Memories do Loom em 24 de novembro com dois registros: work/procedure/plantonista-de-hoje gravado pelo opencode e work/decision/deploy-window gravado pelo cursor-vscode](/images/posts/loom-shared-memory-coding-agents/05-loom-memories-dashboard-pt.webp)
*A página Memories do Loom em 24 de novembro de 2026.*

## As peças

**O Loom** guarda o fato e o procedimento. O painel dele roda em `http://127.0.0.1:7777/`, na página Memories, namespace `local`, mostrada acima.

**O [Mockoon](https://mockoon.com/)** faz o papel do sistema de fora. É uma ferramenta que serve APIs HTTP falsas. No laboratório ele responde `GET /plantonista` na porta 3010, em `http://127.0.0.1:3010/plantonista`. O corpo da resposta fica em `mockoon/plantao.json`. Trocar quem está de plantão é editar esse arquivo e recriar o container. Num time de verdade, esse seria o sistema de plantão real.

**O MCP fino**, `plantao/server.py`, é a porta entre o editor e esse serviço. Ele expõe uma ferramenta, `plantonista_de_hoje`. A ferramenta faz um GET em `/plantonista` e devolve o JSON. Só isso. Ela não guarda dado nenhum nem tem lógica sobre quem está de plantão.

```text
Cursor ou OpenCode
        |
        |  MCP
        v
      Loom                         Mockoon :3010
 memória do time                   GET /plantonista
 "chame a ferramenta X"  ------>   { "nome": "Luiz Schons", ... }
```

No Cursor, uma regra do projeto diz ao agente para buscar no Loom antes de responder. O OpenCode usa a mesma URL do Loom na configuração dele.

Só o Cursor e o OpenCode foram testados. O Claude Code entraria do mesmo jeito, apontando a configuração MCP dele para o mesmo Loom. O laboratório não testou isso.

## Por que isso importa para um time

Muito conhecimento do time mora na máquina de um dev. Fica num caderno, num arquivo de texto ou no histórico de chat daquela pessoa. Quando outra pessoa precisa, tem que achar quem sabe.

Times também têm fluxos comuns que todo dev deveria fazer do mesmo jeito. Fazer deploy em produção é um. Procurar nos logs é outro. Cada pessoa acaba fazendo um pouco diferente, porque o jeito certo nunca foi escrito num lugar que todo mundo alcança.

Com um Loom compartilhado, esse conhecimento tem um lugar só. Um dev novo pergunta para o agente que já usa, no editor que já usa, e recebe o jeito do time de fazer aquilo. Não precisa sair caçando quem sabe.

Para deixar claro: esse uso no onboarding é a motivação, não algo que o laboratório testou. O laboratório só provou o mecanismo, numa máquina, com dois editores.

## Para onde o mesmo mecanismo vai

A pergunta do plantão é trivial de propósito. Ela deixa o mecanismo visível. As perguntas triviais são a prova, não o destino.

A mesma forma serve para perguntas de verdade do time. **Nada do que vem abaixo está implementado. É a possibilidade, não algo que o laboratório construiu.**

| Pergunta | O que fica no Loom | De onde sai a resposta |
| --- | --- | --- |
| Qual é a janela de deploy? *(testado)* | O fato, em texto. | A própria memória. |
| Quem está de plantão? *(testado)* | O procedimento: chame `plantonista_de_hoje`. | O Mockoon, pelo MCP `plantao`. |
| Como eu encontro um log específico em produção? *(não construído)* | Onde olhar, qual consulta, qual ferramenta. | O sistema de logs devolve a linha. |
| Qual é o nosso processo de deploy? *(não construído)* | Os passos e o que conferir antes de seguir. | A memória, mais uma ferramenta quando um passo depende de um sistema. |
| Vou fazer o deploy deste serviço. O que eu olho? *(não construído)* | Os dashboards, a ordem e o que cada um mostra. | A memória aponta o dashboard. O dashboard mostra o número. |

Nesses casos a memória não é um texto solto. Ela é um caminho: qual ferramenta chamar, o que conferir, qual dashboard abrir. O agente que a pessoa já usa segue esse caminho. Nenhum bot novo por assunto. Nenhuma dependência de um fornecedor só.

## O que este modo local não faz

Não há separação de time. Qualquer um que alcance a porta 7777 lê e grava a memória. Isso serve para dois editores numa máquina, e nada mais.

Um time em máquinas diferentes precisa de contas, de um namespace e de um token por pessoa. O Loom documenta isso em [Tokens and grants](https://loom.clickhouse.com/docs/guides/tokens-and-grants). O laboratório não configurou isso.
