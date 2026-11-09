---
title: 'De microservices a agentes: Design for Failure quando o sistema decide sozinho'
date: 2026-11-16T07:00:00-03:00
description: 'As chamadas deram certo, mas o agente sugeriu o estorno errado. Uma história passo a passo sobre limites, tentativas, aprovação e como recuperar uma operação sem repeti-la.'
translationKey: design-for-failure-agents
draft: false
tags: ['Arquitetura', 'IA', 'Microservices']
---

"Fui cobrado duas vezes."

O usuário abre o atendimento da loja, o assistente consulta o pedido e sugere um estorno. Parece uma tarefa resolvida. Só tem um detalhe: aquele pagamento já estava sendo estornado.

Nenhum servidor caiu. Nenhuma chamada deu erro. Mesmo assim, a proposta estava errada.

No artigo [Design for Failure: como assim meu sistema falha?](/pt-br/posts/design-for-failure/), a pergunta era o que acontece com o resto da loja quando uma dependência para de responder. Agora quero continuar a conversa com outra pergunta: **o que acontece quando tudo responde, mas o sistema escolhe o próximo passo errado?**

É uma parte do problema de colocar agentes de IA (inteligência artificial) em uma aplicação. Aqui, agente é um programa que usa um modelo de linguagem para escolher ações, como consultar um pedido, buscar mais informações ou preparar uma resposta. Ele não substitui a loja inteira. Entra em um pedaço do atendimento.

Vamos acompanhar esse pedaço do começo ao fim. O pedido, os valores e os horários abaixo são fictícios. Servem para explicar o desenho, não são um relato de produção nem resultados de um laboratório.

## Um pedido em cinco momentos

O pedido é o **1842**, uma compra de **R$ 120**. Os horários são ilustrativos, no horário de Brasília (BRT).

1. **Às 10:01, o pagamento é confirmado.** A loja registra uma cobrança de R$ 120.
2. **Às 10:02, um resumo do pedido é atualizado.** Naquele momento, ele mostra uma cobrança e nenhum estorno.
3. **Às 10:03, a loja inicia o estorno.** O serviço de pagamento, que mantém o registro da movimentação financeira, já sabe disso. O resumo ainda não foi atualizado.
4. **Às 10:04, o usuário pede ajuda.** Ele diz que foi cobrado duas vezes. O assistente consulta o resumo das 10:02, mas não consulta o estado atual do pagamento.
5. **Às 10:05, o assistente sugere outro estorno.** Ele transformou uma informação incompleta em uma ação que não deveria acontecer.

Repare no salto entre os dois últimos passos. "O resumo não mostra um estorno" virou "é preciso estornar". Não é a mesma coisa.

A frase do usuário é o ponto de partida da investigação, não uma autorização para devolver dinheiro. Duas cobranças confirmadas, duas tentativas de pagamento e um estorno em andamento são situações diferentes. Antes de escolher uma ação, a loja precisa descobrir qual delas aconteceu.

É por uma **API** (Application Programming Interface, "interface de programação de aplicações") que um programa consulta outro. Nessas consultas, o **HTTP** (Hypertext Transfer Protocol, o protocolo usado na comunicação web) devolve um código de status. Um `200 OK` informa que aquela requisição foi bem-sucedida. Não certifica a conclusão que o assistente tirou dela.

![Dois retratos do pedido 1842: o resumo das 10:02 mostra uma cobrança de 120 sem estorno, enquanto o pagamento às 10:04 já mostra um estorno em processamento. O assistente consultou apenas o resumo antigo](/images/posts/design-for-failure-agents/story-pt.svg)

Se a aplicação aceitar a proposta sem conferir o pagamento, pode tentar criar uma operação duplicada. Isso não quer dizer que o provedor necessariamente devolverá o dinheiro duas vezes: ele também pode ter controles que bloqueiem a tentativa. O erro que já conseguimos apontar está antes disso, na proposta e na falta de uma barreira para ela.

**Em resumo:** o assistente consultou um retrato antigo. A aplicação não pode tratar esse retrato como autorização para movimentar dinheiro agora.

## De microservices a agentes: o que muda?

Microservices dividem uma aplicação em serviços menores, com responsabilidades próprias. No exemplo do [primeiro artigo](/pt-br/posts/design-for-failure/), a loja conversa com estoque, frete e pagamento. Se o frete não responde, a compra precisa ter um caminho de saída.

Um agente acrescenta uma escolha no meio desse caminho. Em vez de seguir apenas uma sequência definida no código, o modelo pode decidir se deve consultar o pagamento, pedir outra informação ou encerrar o atendimento. É esse recorte que um [artigo da InfoQ chama de decomposição de decisões](https://www.infoq.com/articles/distributed-systems-microservices-agentic-ai/).

Não significa que serviços tradicionais só falham quando caem. Eles também podem calcular valores errados ou usar dados antigos. A diferença é ter mais uma origem de decisões para limitar e verificar.

![Comparação entre uma dependência indisponível, com o frete fora do ar, e uma decisão incorreta, com o assistente propondo outro estorno mesmo quando as consultas respondem sem erro](/images/posts/design-for-failure-agents/compare-pt.svg)

| Pergunta | Fluxo definido nos serviços | Fluxo com um agente escolhendo passos |
| --- | --- | --- |
| Quem escolhe o próximo passo? | O código da aplicação. | Parte da escolha fica com o modelo, dentro de limites definidos pela aplicação. |
| O que pode falhar? | A chamada, os dados e a regra de negócio. | Tudo isso, mais a escolha da ferramenta, a interpretação e o momento de parar. |
| O que uma resposta 200 confirma? | Que aquela requisição foi bem-sucedida. | A mesma coisa. Não confirma a qualidade da decisão. |
| O que vale repetir? | Uma operação cuja repetição seja segura. | A mesma regra. Replanejar não dá permissão para criar outra movimentação. |
| Quem protege o pagamento? | As regras e os controles do serviço de pagamento. | Os mesmos controles. O modelo não ganha poder para ignorá-los. |
| Quando não dá para concluir? | O fluxo segue uma alternativa prevista. | A tarefa precisa parar ou seguir para revisão, sem inventar a informação que falta. |

Os padrões conhecidos continuam úteis. Mas não basta colocar mais tentativas em volta do agente e torcer para uma delas dar certo.

## Primeiro, separe o que foi lido do que foi concluído

Vamos voltar ao pedido 1842. A proposta do assistente deveria deixar claras duas coisas:

- **Evidência:** "Foi consultado o resumo do pedido, atualizado às 10:02. Ele não mostrava estorno."
- **Conclusão:** "O assistente sugere estornar R$ 120."

Isso permite fazer a pergunta que faltou: **essa evidência é suficiente para esta ação?**

Para responder ao usuário sobre a descrição de um produto, talvez um resumo seja suficiente. Para movimentar dinheiro, o desenho precisa consultar os registros financeiros relevantes e conferir as regras da operação.

Também não basta exigir um **JSON** (JavaScript Object Notation, um formato de texto para dados estruturados) com os campos corretos. O valor `120` pode ser um número válido e continuar sendo o valor errado para aquela ação.

Eu guardaria junto da proposta a origem da informação, o momento da leitura e a regra aplicada. Não uma transcrição do raciocínio interno do modelo, mas referências que permitam conferir o resultado.

## Depois, separe propor de executar

O agente pode investigar o pedido e escrever uma proposta. A permissão para executar o estorno fica em outra parte da aplicação, o **executor**.

Pense na diferença entre preencher uma solicitação e ter acesso à conta que vai pagar por ela. Preencher corretamente não dá, por si só, permissão para enviar o dinheiro.

O caminho seria este:

![O usuário faz a solicitação, o agente prepara uma proposta e a política da aplicação verifica identidade, valor e aprovação. O executor revalida o pagamento e as regras antes de registrar e enviar a operação. Casos bloqueados seguem para revisão](/images/posts/design-for-failure-agents/proposal-pt.svg)

No nosso pedido, a nova consulta mostraria que já existe um estorno em processamento. **A proposta para ali.** O usuário pode receber uma explicação sobre o estorno existente, em vez de ganhar outra operação que ninguém pediu corretamente.

Um esboço ajuda a mostrar onde fica essa parada. É pseudocódigo didático, não uma implementação pronta:

```text
proposta = agente.investigar(solicitacao)
pagamento = pagamentos.consultar(proposta.pagamento)

decisao = politica.avaliar(
    proposta,
    pagamento,
    aprovacao_do_caso
)

se decisao != "permitido":
    encaminhar_para_revisao(proposta, decisao)
    parar

registrar_para_execucao_controlada(proposta)
```

A **política** é a regra de negócio aplicada fora do modelo. Ela confere a identidade, o pagamento, o valor disponível e se aquela ação exige aprovação humana. Não é a proposta que escolhe se precisa de aprovação.

Quando uma pessoa aprova, aprova aquela operação: aquele pagamento, aquele valor. Se a proposta mudar, a autorização anterior não serve para a nova versão.

E uma leitura recente, sozinha, não resolve concorrência. Duas execuções podem ler o mesmo estado antes de qualquer uma atualizá-lo. O fluxo real ainda precisa de controles no armazenamento e no serviço de pagamento para impedir operações incompatíveis. O esboço mostra a divisão de responsabilidades, não substitui esses controles.

A discussão sobre permissões está em [Guardrails e Fitness Functions para uma Arquitetura Amigável à IA](/pt-br/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/). Aqui, o ponto é não deixar uma sugestão errada atravessar a fronteira entre texto e efeito externo.

## A tarefa inteira também precisa ter um limite

Agora imagine que o pagamento não responde.

O **timeout** é o máximo que uma chamada aceita esperar. O assistente pode respeitar o timeout, consultar outra ferramenta, reescrever o plano e tentar de novo. Cada chamada é curta. O atendimento inteiro não acaba.

Uma **ferramenta**, aqui, é uma função disponível para o agente, como consultar o pedido. Repetir essa consulta depois de uma falha temporária é um **retry**, uma nova tentativa da mesma operação.

A [orientação da Anthropic sobre construir agentes eficazes](https://www.anthropic.com/engineering/building-effective-agents) inclui condições de parada, como um máximo de iterações. Eu aplicaria isso à tarefa inteira, não só a cada chamada:

```yaml
# Exemplo ilustrativo, não configuração de um framework.
execution_budget:
  deadline_seconds: 20
  max_model_calls: 4
  max_tool_calls: 6
  on_exhaustion: review_queue
```

Os números só mostram o formato de um orçamento. Não foram medidos neste artigo e não são limites recomendados para produção.

O importante é que o contador fique na aplicação. Replanejar não zera o orçamento. Delegar uma consulta também não cria tempo e tentativas extras. E o limite de uma tarefa não substitui um limite de concorrência para o serviço inteiro.

Se o prazo acabar com uma chamada em andamento, isso não prova que a operação remota foi cancelada. Vamos voltar a esse caso mais adiante.

**Em resumo:** o agente pode escolher caminhos, mas não pode escolher uma quantidade infinita de caminhos.

## Tentar de novo também pode piorar a falha

A [Amazon Builders' Library](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) mostra por que tentativas em várias camadas se multiplicam.

Suponha que o fluxo faça até três tentativas. A ferramenta chamada por ele também faz até três. O cliente que conversa com a API faz mais três. No pior caso dessa combinação, são `3 × 3 × 3 = 27` tentativas na dependência, contando a primeira de cada camada. É uma conta ilustrativa, não um resultado de teste.

Dar mais tempo para o modelo "pensar melhor" não resolve essa multiplicação. É preciso definir onde as novas tentativas acontecem e contabilizar o trabalho feito nas camadas de baixo.

O primeiro artigo já explica **backoff**, o aumento do intervalo entre tentativas, e **jitter**, a aleatoriedade nesse intervalo para que vários clientes não repitam juntos. Isso continua valendo. A novidade é não confundir três coisas:

1. Repetir uma consulta que falhou.
2. Buscar outra evidência para revisar uma conclusão.
3. Criar um novo estorno.

As duas últimas não são retries de transporte. Precisam de limites e regras próprios.

## Uma resposta perdida não é um estorno recusado

A proposta duplicada foi barrada. Agora vamos olhar outra falha possível, no estorno legítimo.

A aplicação envia a solicitação. O provedor aceita. Antes de a resposta chegar, a conexão cai.

Para o provedor, a operação existe. Para a loja, o resultado ainda não foi confirmado. Se o assistente interpretar o timeout como "não aconteceu" e criar outra operação, pode transformar um problema de comunicação em uma tentativa duplicada.

Por isso, **desconhecido precisa ser um estado de verdade**, não um sinônimo de falha.

![Três estados da operação: intenção registrada, resultado desconhecido após o envio e resultado conhecido após confirmação. Enquanto o resultado estiver desconhecido, o sistema reconcilia a mesma operação em vez de criar outro estorno](/images/posts/design-for-failure-agents/outcome-pt.svg)

O executor registra a intenção e uma identidade da operação antes do envio. Se precisar retomar, continua investigando **aquela operação**. Esse registro ajuda na recuperação, mas não cria uma transação única entre o banco da loja e o provedor.

É aqui que entra a **idempotência**: repetir a mesma operação sem repetir o efeito de negócio. A [documentação da Stripe](https://docs.stripe.com/api/idempotent_requests) dá um exemplo concreto. Na API v1, a mesma chave permite recuperar o resultado salvo de uma requisição cuja execução começou. Há regras sobre parâmetros e retenção; não é uma promessa de que qualquer repetição será segura para sempre.

A chave identifica uma operação de negócio, não toda a vida de um pedido. Dois estornos parciais legítimos podem ser operações diferentes. O erro é criar outra identidade para a mesma intenção só porque a resposta se perdeu.

A recuperação usa o contrato disponível: consulta de status, evento do provedor ou repetição com a mesma chave quando isso for suportado. Esse processo de conferir o estado local com o remoto é a **reconciliação**.

E vale separar duas proteções: a idempotência evita repetir o efeito; a política verifica se o efeito deveria acontecer. Um estorno errado continua errado se acontecer uma vez só.

## O plano B pode ser parar

**Fallback** é o caminho alternativo quando o principal não consegue concluir. Neste atendimento, não precisa ser outro modelo tentando adivinhar o pagamento.

Pode ser algo bem mais simples: guardar o caso, informar que a análise ainda não terminou e encaminhar a evidência para uma pessoa responsável. Sem criar outro estorno enquanto o resultado anterior estiver indefinido.

A fila precisa de capacidade, prazo e alerta. Caso contrário, o sistema parece disponível enquanto o trabalho só muda de lugar e se acumula.

O **circuit breaker**, o disjuntor que interrompe chamadas a uma dependência após falhas demais, continua útil para falhas de comunicação. Mas uma proposta errada pode chegar rápido, sem erro técnico. Por isso eu também teria uma forma de pausar a execução automática quando os critérios do fluxo deixarem de ser atendidos.

Se uma operação já aconteceu, desligar o agente não a desfaz. Uma **compensação** é outra ação que tenta corrigir seu efeito e também pode falhar. É a discussão de saga, a sequência de operações e compensações do primeiro artigo. E nem todo efeito volta atrás: corrigir o pagamento não apaga uma informação errada que já foi enviada ao usuário.

## Como conferir se o desenho funciona

A tabela abaixo é uma proposta de testes, não um relato de testes executados:

| Cenário do teste | O que o teste deve verificar |
| --- | --- |
| O assistente recebe o resumo antigo do pedido 1842. | A proposta não é executada sem consultar o pagamento e validar a política. |
| A proposta tem o formato certo, mas o estorno já está em andamento. | A aplicação bloqueia a nova operação. |
| O agente replaneja depois de gastar o orçamento. | O contador não recomeça e o caso segue para a saída prevista. |
| A resposta se perde depois da aceitação do provedor. | A operação entra em reconciliação, sem ganhar outra identidade. |
| Duas execuções tentam agir sobre o mesmo pagamento. | Os controles impedem operações incompatíveis. |
| O pagamento muda depois da aprovação humana. | A autorização e o estado são revalidados antes do efeito. |

Um [estudo sobre verificações em agentes de programação](https://martinfowler.com/articles/are-harnesses-worth-the-cost.html) separa orientação de checagens executáveis. O contexto é diferente deste atendimento. O princípio que interessa aqui é o mesmo: "terminei" não substitui uma verificação independente do resultado.

Além dos testes, eu acompanharia propostas rejeitadas, casos que pararam por falta de evidência, operações com resultado desconhecido e tempo de espera na revisão. O artigo sobre [observabilidade de agentes com OpenTelemetry](/pt-br/posts/agent-observability-with-opentelemetry/) explica a infraestrutura. OpenTelemetry é um projeto aberto para instrumentar e transportar dados de observabilidade, como métricas e rastros de execução.

Nenhum desses números prova qualidade sozinho. É preciso revisar também casos aprovados e entender se mudou o modelo, a política ou o tipo de solicitação. E não colocar dados pessoais em rótulos de métricas nem guardar todo prompt por padrão. O **prompt** é a entrada de instruções e contexto enviada ao modelo.

Eu começaria em **modo sombra**: preparar propostas para comparação, sem permissão de estornar. Depois, revisão humana. Só então, se as evidências justificarem, execução automática em um recorte aprovado, com um jeito de desligá-la. O modo sombra também lê dados e consome recursos; não fica fora dos limites.

## Um checklist para levar para o projeto

Antes de liberar uma ação, vale conferir:

- [ ] A proposta distingue o que foi consultado do que foi concluído?
- [ ] As evidências são adequadas à ação e revalidadas quando necessário?
- [ ] A política e a exigência de aprovação são controladas fora do modelo?
- [ ] A aprovação corresponde exatamente à operação que será executada?
- [ ] Existem controles para concorrência e operações incompatíveis?
- [ ] A tarefa tem orçamento total, incluindo delegações e novas tentativas?
- [ ] A mesma operação preserva sua identidade durante a recuperação?
- [ ] Resultado desconhecido leva à reconciliação, não a uma nova movimentação?
- [ ] A revisão tem responsável, capacidade e prazo?
- [ ] É possível observar os resultados e desligar novas ações automáticas?

## Glossário rápido {#glossary}

| Termo | Em uma frase |
| --- | --- |
| IA | Inteligência artificial; aqui, usada para interpretar pedidos e propor passos. |
| Agente | Programa que usa um modelo para escolher ações dentro de um fluxo. |
| Ferramenta | Função que o agente pode chamar, como consultar o pagamento. |
| API | Interface de programação de aplicações, por onde um programa usa outro. |
| HTTP | Protocolo de comunicação web; 200 indica sucesso daquela requisição, não da decisão inteira. |
| JSON | Formato de texto para representar dados estruturados. |
| Evidência | Informação consultada, com origem e momento da leitura. |
| Política | Regras que determinam se uma ação pode acontecer. |
| Executor | Parte da aplicação que tem permissão para realizar a ação. |
| Timeout | Limite de espera por uma chamada. |
| Retry | Nova tentativa da mesma operação. |
| Backoff e jitter | Espera entre tentativas, com aumento de intervalo e aleatoriedade. |
| Orçamento | Limites de tempo e trabalho para a tarefa inteira. |
| Idempotência | Repetir uma operação sem repetir seu efeito de negócio. |
| Reconciliação | Conferir o estado local com o remoto para esclarecer o resultado. |
| Fallback | Caminho alternativo quando o principal não conclui. |
| Circuit breaker | Interrupção temporária das chamadas após um limite de falhas. |
| Saga | Sequência de operações com compensações para lidar com falhas parciais. |
| Prompt | Entrada de instruções e contexto enviada ao modelo. |
| Modo sombra | Preparar propostas para avaliação sem executar as ações de negócio. |

## Para fechar

O pedido 1842 não precisava de um modelo mais convincente. Precisava de uma consulta que faltou, de uma regra fora do modelo e de uma aplicação capaz de dizer "esta ação não pode passar".

É isso que eu levaria do Design for Failure para agentes. Os cuidados com rede continuam. A responsabilidade pela decisão aumenta.

**Dar autonomia não é retirar as regras. É definir até onde o sistema pode ir e o que acontece quando ele precisa parar.**
