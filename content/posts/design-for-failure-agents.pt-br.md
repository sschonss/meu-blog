---
title: 'De microservices a agentes: Design for Failure quando o sistema decide sozinho'
date: 2026-11-16T07:00:00-03:00
description: 'Um assistente de atendimento pode receber HTTP 200 em toda chamada e ainda estornar o mesmo pedido duas vezes. Uma compra fictícia, passo a passo: evidência, proposta, orçamento, retry e resposta perdida.'
translationKey: design-for-failure-agents
draft: false
tags: ['Arquitetura', 'IA', 'Microservices']
---

A Ana escreve para a loja: "fui cobrada duas vezes."

O assistente consulta o pedido, as chamadas dão certo e a tela continua verde. Aí ele prepara um segundo estorno para um pagamento que já está sendo estornado.

Nada caiu. A cliente ainda pode sair no prejuízo.

No artigo [Design for Failure: como assim meu sistema falha?](/pt-br/posts/design-for-failure/) eu falei de retry, fallback, circuit breaker e saga: o que o resto do sistema deve fazer quando uma dependência falha. Esses padrões continuam valendo. Um agente (um programa que pergunta a um modelo qual é o próximo passo) não conserta a rede e não torna um pagamento seguro para repetir.

Ele acrescenta uma segunda pergunta. **O que acontece quando as chamadas funcionam e a decisão está errada?**

Este artigo acompanha um pedido fictício, da mensagem até o estorno, e para ali. Não transforma a loja inteira em agentes. Cada sigla aparece explicada na primeira vez, e o [glossário](#glossary) no fim repete cada uma numa linha. O valor 120 e os horários são inventados, para a história ficar fácil de seguir. Não são medições.

## Um pedido, das 10:01 às 10:05

Vamos ficar com a Ana. Pedido 1842. Uma compra de 120.

1. **10:01.** A Ana paga 120. O serviço de pagamento (o sistema que de fato mexe no dinheiro) registra uma cobrança que deu certo.
2. **10:03.** Um estorno desses mesmos 120 começa. Pode ser que o item tenha acabado no estoque. O pagamento agora sabe que há um estorno em processamento. A Ana não sabe.
3. **10:04.** A Ana escreve "fui cobrada duas vezes." Ela descreve a sensação, não o extrato.
4. **10:04, alguns segundos depois.** O assistente lê um resumo do pedido montado às 10:02. Esse resumo diz: uma cobrança, nenhum estorno.
5. **10:05.** O assistente propõe outro estorno de 120. Ele não pergunta de novo ao serviço de pagamento.

Se essa proposta puder rodar, a Ana recebe 240 de volta por uma compra de 120. Toda chamada que o assistente fez pode continuar devolvendo HTTP 200, o status usual de "esta chamada deu certo".

A mesma frase da cliente nem sempre é a mesma ação:

| O que "fui cobrada duas vezes" pode significar | O que a loja deveria fazer |
| --- | --- |
| Duas cobranças que deram certo | Estornar a que sobrou, uma vez. |
| Duas tentativas, e só uma cobrança que ficou | Não estornar. |
| Uma cobrança, e um estorno já em processamento | Não estornar de novo. |

O resto do artigo fica na terceira linha, porque é a linha que um resumo velho esconde. Uma leitura velha é uma cópia que era verdade antes e já não conta a história inteira.

Aqui estão as duas fotos, lado a lado:

![Dois cartões do pedido fictício 1842. À esquerda, o que o assistente leu: um resumo tirado às 10:02, uma cobrança de 120, estorno nenhum, e o assistente trata isso como cobrança aberta. À direita, o que o serviço de pagamento sabe às 10:04: a mesma cobrança, mais um estorno de 120 já em processamento, que o assistente não consultou. Uma nota diz que 120 é inventado, que as chamadas podem continuar com HTTP 200, e que um estorno novo é outra operação de negócio, não um retry da leitura](/images/posts/design-for-failure-agents/story-pt.svg)

**Em resumo:** o assistente respondeu a uma fotografia das 10:02, e o dinheiro está num registro das 10:04.

## Um 200 não é atestado de saúde

Uma API é a interface que outro programa chama. JSON é um formato de texto para dados estruturados, o formato da resposta. Conferir se o JSON tem os campos certos diz que a resposta está bem formada. Não diz que o estorno é o estorno certo.

Isso não começa com IA. Um serviço comum também pode devolver 200 com o total errado. A diferença aqui é que o modelo escolhe parte do próximo passo: o que consultar, qual nota acreditar e quando parar.

Mallika Rao descreve essa mudança como passar de quebrar o sistema em funções para [quebrá-lo em decisões](https://www.infoq.com/articles/distributed-systems-microservices-agentic-ai/). Acho uma lente útil. Não é uma ordem para trocar os serviços da loja por agentes.

Três perguntas, e só uma delas é o status HTTP:

| Camada | A pergunta | O que ainda pode estar errado no pedido 1842 |
| --- | --- | --- |
| Transporte | A chamada respondeu a tempo? | A resposta pode ser de outra compra. |
| Contrato | Os campos e os tipos são os que a gente espera? | Um valor bem formado ainda pode furar a regra de estorno. |
| Negócio | Esta proposta combina com a evidência de agora? | O resumo das 10:02 não basta para mandar dinheiro. |

Pedir ao modelo "você tem certeza?" não substitui uma leitura do pagamento.

O artigo da Rao também fala de decisões que pioram conforme passam de etapa em etapa, e de contexto que não bate, mesmo sem nenhum servidor fora do ar. Isso não quer dizer que toda cadeia longa falha. Quer dizer que um painel verde é só metade da história.

## Lado a lado: dependência morta e decisão ruim

O primeiro artigo usa uma loja em que o frete está fora. O modo novo de falha fica ao lado daquele:

![Dois desenhos da Ana. À esquerda, uma dependência caiu: a Ana chama a loja, a loja chama o frete, o frete está com borda vermelha tracejada e a palavra fora, e a legenda diz que a falha aparece como timeout ou HTTP 500, que é onde entram retry e fallback. À direita, uma decisão errou: a Ana chama um assistente que propõe um segundo estorno, a caixa do pagamento está verde com HTTP 200, e a legenda diz que as chamadas dão certo enquanto o estorno ainda estaria errado. O rodapé diz que é a mesma cliente e outro tipo de falha, e que o lado esquerdo é a loja do primeiro artigo de Design for Failure, desenhada menor](/images/posts/design-for-failure-agents/compare-pt.svg)

Timeout é o tempo máximo que quem chama aceita esperar. HTTP 500 é o status usual de "o servidor falhou". Retry é tentar a mesma chamada de novo. Fallback é um caminho mais simples quando o principal não consegue terminar. Circuit breaker é parar de chamar uma dependência por um tempo, depois de falhas demais, como o disjuntor do primeiro artigo.

| | O frete está fora | A decisão de estorno está errada |
| --- | --- | --- |
| A pergunta | O que acontece com a compra quando uma dependência falha? | O que acontece quando o pagamento devolve 200 e a conclusão está errada? |
| O que aparece | Timeout, HTTP 500 ou circuito aberto. | Chamadas verdes, e uma proposta ruim. |
| Retry | A mesma chamada de frete, com backoff e jitter. | Um retry da mesma leitura. Um estorno novo é outra operação. |
| Fallback | Outro jeito de concluir, ou um "hoje não dá para enviar" honesto. | Parar o estorno automático. Guardar o caso e dizer o que falta. |
| Resposta perdida | A chamada pode já ter tido efeito. | A mesma regra, e a decisão não pode criar uma segunda operação. |
| Onde a regra mora | No serviço que chama o frete. | Em código fora do modelo, conferida de novo antes de o dinheiro sair. |

Backoff é esperar mais a cada falha. Jitter é um pouco de aleatoriedade nessa espera, para vários clientes não tentarem de novo no mesmo instante. O primeiro artigo desenha isso. Não vou redesenhar aqui.

Os padrões antigos continuam valendo do lado esquerdo. Sozinhos, não respondem o lado direito.

## Anote o que foi lido

Uma proposta deveria carregar duas coisas diferentes:

- **Evidência:** quais registros foram lidos, e quando. Para a Ana, "resumo do pedido, tirado às 10:02".
- **Interpretação:** o que o assistente concluiu. "Esta cobrança ainda precisa de um estorno de 120."

Não precisa de uma transcrição do raciocínio privado do modelo. Precisa de uma trilha que uma pessoa consiga conferir. Pense num recibo grampeado na fotografia, não na fotografia fingindo que é o banco.

E o recibo vence. Antes de o dinheiro sair, o executor (a parte do sistema que tem permissão de chamar o pagamento) lê o pagamento de novo. Uma evidência correta às 10:02 pode ser a base errada às 10:05.

## O agente propõe. A aplicação envia.

A divisão importante não é "dois agentes". É **escrever uma proposta** versus **ter permissão para executá-la**.

![Um fluxo vertical do pedido 1842. 1, o pedido da Ana. 2, o agente escreve uma proposta de estorno de 120 a partir do resumo das 10:02, numa caixa âmbar. 3, a política mora no código da aplicação e confere identidade, valor e qual aprovação. Uma seta âmbar para a direita diz não, ou falta algo, e cai numa fila de revisão em que uma pessoa vê a proposta e o buraco. Uma seta cinza para baixo diz sim, e a aprovação é desta proposta. 4, o executor lê o pagamento de novo porque o resumo pode estar velho. 5, grava um id da operação e só então envia. 6, numa caixa verde: se a resposta se perdeu, reconcilia com o mesmo id](/images/posts/design-for-failure-agents/proposal-pt.svg)

A política fica em código e em dados que a aplicação controla. Ela confere quem é a Ana, qual é o pedido, quanto ainda pode ser estornado e se esta operação precisa de uma pessoa. Uma pessoa aprova uma proposta: este pedido, este valor. Se o assistente editar a proposta depois do "sim", a aprovação antiga não cobre o texto novo.

Escrevi sobre permissões em [Guardrails e Fitness Functions para uma Arquitetura Amigável à IA](/pt-br/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/). A consequência para a confiabilidade é a curta: uma sugestão errada não pode virar um pagamento sozinha.

Uma regra no código não prova que a regra de negócio está certa. Ela ainda precisa de revisão. O ganho é que a checagem não depende do humor do assistente.

O esboço abaixo é para ensinar, do mesmo jeito que o PHP do primeiro artigo é para ensinar. Não é uma biblioteca.

```text
proposal = agent.investigate("1842")
# pode dizer: estorne 120, porque o resumo das 10:02 não mostrava estorno

if not policy.allows(proposal):
    send_to_review(proposal)
    stop

if proposal.needs_a_person and not approval.matches(proposal):
    send_to_review(proposal)
    stop

payment = payments.read("1842")       # de novo, na hora de executar
if payment.refund_in_progress:
    send_to_review(proposal)
    stop

operation_id = store.get_or_create_id(case="1842-refund")
payments.refund(operation_id, order="1842", amount=120)
```

Leia isso junto com a história. O passo 2 do desenho é o `agent.investigate`. A parada no meio é o registro de pagamento das 10:04 que o resumo não tinha. O `operation_id` nasce no armazenamento, não é inventado de novo pelo modelo na tentativa seguinte.

## Dê um orçamento para a tarefa inteira

Cada chamada pode ter o próprio timeout enquanto a tarefa não tem nenhum.

O modelo chama uma ferramenta (uma função que ele pode executar, como "ler o pedido"), não gosta da resposta, chama outra, reescreve o plano e começa de novo. Cada chamada respeita o próprio prazo. A Ana continua esperando.

Orçamento é um limite para a tarefa inteira. A nota da Anthropic sobre [construir agentes eficazes](https://www.anthropic.com/engineering/building-effective-agents) recomenda condições de parada, como um máximo de iterações, e aponta que erro e custo se acumulam quando um agente segue sozinho. A página diz que as ferramentas mudaram desde a publicação. Estou usando esse conselho de desenho, não uma receita de framework.

```yaml
# Política para ensinar. Não é uma configuração real, nem uma recomendação.
execution_budget:
  deadline_seconds: 20
  max_model_calls: 4
  max_tool_calls: 6
  on_exhaustion: review_queue
```

Esses números são inventados para mostrar o formato. Não são resultado de teste, e não são o que você deveria copiar para produção.

O que importa é quem é dono do contador. O orçamento pertence à execução, não ao prompt. Replanejar não pode zerá-lo. Uma chamada que o agente delega também gasta o mesmo orçamento, inclusive os retries feitos numa camada de baixo.

Separe o limite de uma tarefa do limite do serviço inteiro. Muitas tarefas pequenas ainda podem afogar o pagamento. Uma fila só para isso, e um teto de quantas investigações rodam ao mesmo tempo, evitam que elas comam o atendimento normal. Não basta se os dois caminhos ainda dividirem um pool de banco sem limite.

Mais um lembrete, que já vale para timeout comum: o prazo acabou para quem está esperando. Isso não prova que o estorno remoto foi cancelado.

## Repita a chamada. Não repita o estorno.

A [Amazon Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) faz dois pontos que continuam úteis aqui. Retries empilhados em várias camadas multiplicam a carga. E um timeout não significa que a chamada não teve efeito.

Com um assistente no caminho, eu separaria três verbos:

- **Retry de transporte:** repetir a mesma leitura depois de um soluço, dentro das regras daquela API.
- **Revisão:** buscar mais evidência, porque a proposta ainda não passa na política.
- **Operação nova de negócio:** começar outro estorno. Isso não é um retry inofensivo.

Se o fluxo permitir 3 tentativas, a ferramenta permitir 3 e o cliente HTTP permitir 3, o produto é `3 × 3 × 3 = 27` chamadas no pior caso. A conta inclui a primeira tentativa de cada camada. É aritmética, para a multiplicação ficar fácil de ver. Não é um número que a Amazon publicou, e não é resultado de laboratório.

Trocar o nome de cada repetição não alivia a carga. O sistema precisa de um lugar explícito onde retry é permitido, e de um limite compartilhado que enxergue o trabalho real.

Para qualquer coisa que mexe em dinheiro, a identidade da operação tem de sobreviver à repetição. A camada confiável cria esse id e guarda. O modelo não ganha o direito de criar outro porque a primeira resposta demorou.

A [documentação de idempotência da Stripe](https://docs.stripe.com/api/idempotent_requests) é um contrato concreto disso, e só para a API v1. Idempotência quer dizer que fazer a operação duas vezes tem o mesmo efeito que fazer uma vez. Na v1, depois que o endpoint começou a rodar, o primeiro resultado fica salvo. A mesma chave devolve esse resultado salvo. A mesma chave com parâmetros diferentes é rejeitada. As chaves podem ser removidas depois de pelo menos 24 horas. A API v2 é outro contrato, então este parágrafo não a descreve.

Isso não é uma promessa universal de execução única. Ainda é preciso respeitar a janela do provedor, e ainda é preciso barrar duplicata no próprio banco.

E idempotência não corrige a intenção. Um estorno errado de 120 continua errado se acontecer uma vez só.

## Quando não der para terminar, pare de decidir

Trocar de modelo pode ser uma escolha de disponibilidade. Se o problema é que a evidência do pagamento não está lá, outro modelo não inventa a linha que falta.

Para a Ana, o fallback é modesto:

- dizer que a investigação não terminou;
- guardar o que for preciso para retomar o caso;
- mandar a proposta e a evidência para a fila de revisão;
- não criar outro estorno enquanto o primeiro resultado for desconhecido.

O sistema para de resolver o caso sozinho. Ainda consegue dizer o que aconteceu e o que falta.

A fila precisa de dono, capacidade, prazo e alerta. Mandar todo caso para uma pessoa, e nunca olhar a pilha, só muda o endereço da falha.

Um circuit breaker que olha timeout pode proteger a API de pagamento e ainda deixar passar uma proposta ruim, porque a proposta ruim volta rápido e com status 200. Se a barra de qualidade deixou de ser atingida, eu pausaria a execução automática deste fluxo com um interruptor separado. Não esperaria um 500.

## Resposta perdida ganha um estado próprio

O caso que eu mais quero ver nos testes: o executor envia o estorno, o provedor aceita e a resposta se perde.

O que o sistema sabe?

Não sabe que o estorno falhou. **Sabe que ainda não confirmou o resultado.**

![Três estados de um estorno. REGISTRADO significa que a intenção está salva e nada foi enviado. Uma seta com o rótulo enviou vai para DESCONHECIDO, em que a requisição saiu e a resposta não foi gravada. Uma seta com o rótulo confirmou vai para CONHECIDO, em que sucesso ou falha estão confirmados. Um texto em vermelho diz para não abrir um segundo estorno a partir de DESCONHECIDO. Confirme lendo o provedor, ou repetindo o mesmo id da operação onde a API permitir. Um id para o caso inteiro](/images/posts/design-for-failure-agents/outcome-pt.svg)

O executor deveria gravar a intenção e o id antes de enviar. Isso ajuda se o processo cair. Não cria uma transação atômica entre o seu banco e o provedor. Continuam sendo dois sistemas.

Na volta, use o contrato que você realmente tem: uma leitura de status, um evento do provedor, ou um retry com a mesma chave onde isso for suportado. Enquanto o resultado for desconhecido, o caso não pode ganhar um segundo estorno incompatível. Isso é uma trava no banco, não uma frase no prompt.

Uma compensação (uma ação posterior que tenta desfazer a primeira) é outra operação, e também pode falhar. A saga do primeiro artigo é essa conversa para uma compra que ficou pela metade. Nem todo efeito se desfaz: devolver o dinheiro não apaga a mensagem errada que a Ana já recebeu.

## Teste a falha antes de permitir a ação

Um primeiro conjunto útil de casos, com o comportamento esperado escrito:

| O que é injetado | O que deveria acontecer |
| --- | --- |
| Evidência velha ou contraditória | A execução automática para, e o fato que falta fica visível. |
| Proposta bem formada que fura a política | O executor rejeita antes de qualquer efeito externo. |
| O orçamento da tarefa acaba durante um replanejamento | A tarefa para, e o orçamento não é zerado. |
| A resposta se perde depois de o provedor aceitar | O caso entra em reconciliação, e não aparece um segundo id. |
| O processo morre depois do envio e antes de gravar a resposta | A retomada trata o resultado como desconhecido. |
| Duas execuções mexem no mesmo caso | O armazenamento barra estornos incompatíveis. |
| Existe uma aprovação, e depois o pagamento muda | O executor lê de novo e interrompe a ação se precisar. |
| A fila de revisão começa a encher | O teto e o alerta tornam a pilha visível. |

Esta tabela é um plano. Não é um laboratório executado para este artigo, e as linhas não são medições.

Naresh Jain descreve uma separação útil entre orientação e verificações que de fato rodam, em [Are Harnesses Worth the Cost?](https://martinfowler.com/articles/are-harnesses-worth-the-cost.html). Harness, naquele texto, é a maquinaria em volta de um agente de programação. O experimento é sobre agentes de programação, não sobre este assistente de atendimento, e não é evidência de que o estorno da Ana foi testado. A parte que eu quero é a separação em si: o assistente dizer "terminei" não é a verificação.

A última frase da proposta não basta. O teste tem de olhar o que foi lido, o que foi barrado e o que de fato mudou.

## Conte resultados, e só então abra a porteira

Em [Observabilidade de Agentes com OpenTelemetry](/pt-br/posts/agent-observability-with-opentelemetry/) eu escrevi sobre ligar atividade a resultado. OpenTelemetry é um jeito comum de exportar rastros e métricas. Para este fluxo, eu olharia estas contagens:

- Quantas propostas a política rejeitou, e por quê?
- Quantas tarefas pararam por evidência faltando ou orçamento esgotado?
- Quantas operações estão desconhecidas, e há quanto tempo?
- Quantos casos estão esperando, e quantos uma pessoa corrigiu?
- Depois de uma mudança, quais erros aparecem nos casos que uma pessoa revisou?

Uma rejeição não prova que o assistente piorou. Os pedidos podem ter mudado. Uma fila curta também não prova qualidade. O sistema pode estar aceitando o que deveria segurar. As contagens precisam de contexto, inclusive de uma olhada nos casos que foram aprovados.

Eu registraria a versão do modelo, a versão do prompt e a versão da política, mais os ids necessários para investigar uma operação, com acesso e retenção decididos antes. Eu não colocaria os dados da Ana em rótulo de métrica, e não guardaria todo prompt por padrão.

Antes de qualquer escrita, o fluxo pode rodar em modo sombra: ele prepara propostas para comparação, e não tem permissão de estornar. Modo sombra ainda gasta orçamento e ainda lê dados, então precisa dos mesmos limites.

Depois, uma pessoa revisa as propostas. Só então, se a evidência sustentar, execução automática dentro de um recorte que o negócio aprovou, com um interruptor que desliga a autonomia sem parar o atendimento comum. O interruptor barra ações novas. Não desfaz ações que já aconteceram.

## Um checklist deste desenho

Se eu estivesse revisando o desenho do assistente da Ana, eu procuraria estes itens e pararia quando um faltasse:

1. **Uma história.** Um único pedido, com horários, para uma pessoa conseguir apontar o passo que errou.
2. **Evidência separada da conclusão.** Registros lidos, e quando, grampeados na proposta.
3. **Política fora do modelo.** Identidade, valor e aprovação moram no código.
4. **Aprovação grudada numa proposta.** Uma edição depois do "sim" devolve o caso.
5. **Uma leitura na hora de executar.** O resumo das 10:02 não pode mover dinheiro às 10:05.
6. **Um orçamento para a tarefa.** Replanejar não zera o contador.
7. **Retries com nome.** Mesma leitura, mais evidência, ou estorno novo. Só o primeiro é retry de transporte.
8. **Um id de operação, criado no armazenamento.** O modelo não cria outro a cada tentativa.
9. **Desconhecido como estado de verdade.** Resposta perdida vai para reconciliação, não para um segundo estorno.
10. **Um fallback que para.** Evidência faltando vai para uma fila com dono e alerta.
11. **Um interruptor.** Sombra, depois uma pessoa, depois automático, e um jeito de barrar ações novas.

## Glossário rápido {#glossary}

Cada termo uma vez, na ordem em que importou acima:

| Termo | Numa frase |
| --- | --- |
| Agente | Um programa que usa um modelo para escolher o próximo passo. |
| Modelo | A peça que lê o pedido e propõe o próximo passo. |
| Ferramenta | Uma função que o modelo pode chamar, como "ler o pedido". |
| API | A interface que outro programa chama. |
| JSON | Um formato de texto para dados estruturados. |
| HTTP 200 / 500 | "Esta chamada deu certo" / "o servidor falhou". |
| Timeout | O máximo que quem chama espera. |
| Retry | Tentar a mesma chamada de novo. |
| Backoff | Esperar mais a cada falha. |
| Jitter | Um pouco de aleatoriedade nessa espera. |
| Fallback | Um caminho mais simples quando o principal não termina. |
| Circuit breaker | Uma pausa nas chamadas a uma dependência depois de falhas demais. |
| Saga | Um jeito de desfazer uma compra que ficou pela metade, do primeiro artigo. |
| Evidência | Os registros que foram lidos, e quando. |
| Proposta | O que o assistente acha que deveria acontecer em seguida. |
| Executor | A parte que tem permissão de chamar o pagamento. |
| Idempotência | Fazer duas vezes tem o mesmo efeito que fazer uma vez. |
| Id da operação | A identidade de um estorno, reusada em todo retry. |
| Orçamento | Um limite para a tarefa inteira, não para uma chamada. |
| Resultado desconhecido | A requisição saiu, e a resposta não foi gravada. |
| Reconciliação | Ler o provedor até o resultado ser conhecido. |
| Modo sombra | As propostas são preparadas, e escritas não são permitidas. |
| OpenTelemetry | Um jeito comum de exportar rastros e métricas. |

Timeout, retry, fallback e recuperação não ficaram menos úteis porque um modelo entrou no fluxo.

O alvo ficou maior. Além de impedir que uma dependência morta derrube a loja, a gente precisa impedir que uma conclusão ruim ganhe permissão, se repita sem limite e mova um dinheiro que ninguém consegue explicar depois.

Para mim, Design for Failure com um agente começa aqui: **definir o que pode ser proposto, conferir o que pode ser executado e saber o que fazer quando a tarefa não pode terminar.**

Às vezes, a decisão mais confiável é não decidir sozinho.
