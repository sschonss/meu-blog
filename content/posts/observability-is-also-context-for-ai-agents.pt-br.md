---
title: 'Observabilidade também é contexto para agentes de IA'
date: 2026-08-21
source: https://luizschons.com/observability-is-also-context-for-ai-agents
series: ['Arquitetura Amigável à IA']
draft: false
tags: ['IA', 'Observabilidade']
---

<p>Este é o terceiro artigo de uma série sobre arquitetura amigável à IA. Já falamos sobre como a IA se parece com uma nova pessoa entrando em uma empresa e sobre a importância de conectar código, documentação e decisões arquiteturais.</p>
<p>Agora quero falar sobre uma fonte de contexto que costuma ser tratada apenas como uma ferramenta de operações: observabilidade.</p>
<h2>O sistema real não está apenas no repositório</h2>
<p>Quando olhamos para um sistema por meio do seu código, vemos uma imagem do que foi construído.</p>
<p>Mas o sistema em produção pode contar uma história diferente.</p>
<p>Uma configuração pode ter mudado. Uma dependência pode estar mais lenta. Um determinado fluxo pode ser usado muito mais do que a equipe esperava. Uma regra pode funcionar corretamente na maioria dos casos, mas falhar com uma combinação específica de dados.</p>
<p>O código mostra o que deveria acontecer. A observabilidade nos ajuda a entender o que realmente está acontecendo.</p>
<p>Essa diferença importa tanto para as pessoas quanto para os agentes de IA.</p>
<h2>Observabilidade não é apenas monitoramento</h2>
<p>O monitoramento normalmente responde a uma pergunta simples: há algo errado?</p>
<p>A observabilidade tenta responder a uma pergunta maior: por que o sistema está se comportando dessa forma?</p>
<p>Para isso, usamos sinais diferentes:</p>
<ul>
<li><p>registros mostram eventos e detalhes de uma execução;</p>
</li>
<li><p>métricas mostram tendências, volumes e mudanças;</p>
</li>
<li><p>rastreamentos mostram o caminho de uma requisição por diferentes serviços;</p>
</li>
<li><p>eventos de implantação mostram quando uma mudança foi para produção;</p>
</li>
<li><p>dados de negócio mostram o impacto nas pessoas que usam o sistema.</p>
</li>
</ul>
<p>Cada sinal explica uma parte do comportamento do sistema. Quando esses sinais estão conectados, fica mais fácil criar uma possível explicação e verificar se ela faz sentido.</p>
<h2>Onde cada parte fica</h2>
<p>Assim como a documentação não precisa estar dentro do código, os dados de observabilidade não precisam ser armazenados no repositório.</p>
<p>O serviço cria eventos e sinais. Uma camada de instrumentação coleta esses sinais. A plataforma de observabilidade armazena e conecta os dados. A documentação explica o significado de métricas, alertas e fluxos importantes.</p>
<img width="1600" height="900" loading="lazy" decoding="async" src="/images/posts/observability-is-also-context-for-ai-agents/91445626-d25b-4a7d-a40f-035f366c83ee.webp" alt="Observabilidade como contexto" style="display:block;margin:0 auto" />

<p>O repositório pode manter apenas as configurações de instrumentação, os nomes dos sinais e links para dashboards e runbooks. O histórico dos dados permanece na plataforma de operações, que é o lugar certo para verificar como o sistema se comporta ao longo do tempo.</p>
<p>O importante é conectar essas fontes. Um agente precisa conseguir sair do serviço no repositório, chegar ao dashboard correto e encontrar uma explicação do que está observando.</p>
<h2>Um incidente é uma investigação de contexto</h2>
<p>Imagine que a latência de uma API começa a aumentar.</p>
<p>Uma pessoa experiente talvez saiba exatamente onde olhar. Ela conhece o dashboard certo, lembra de um incidente parecido e sabe qual serviço normalmente causa esse tipo de problema.</p>
<p>Uma pessoa nova não tem esse conhecimento. Um agente também não.</p>
<p>Para investigar o problema, é preciso encontrar uma sequência de pistas:</p>
<ol>
<li><p>Quando o problema começou?</p>
</li>
<li><p>Qual serviço apresentou o primeiro sinal?</p>
</li>
<li><p>O aumento afetou todos os usuários ou apenas um fluxo?</p>
</li>
<li><p>Houve uma implantação ou uma mudança de configuração nesse período?</p>
</li>
<li><p>Qual dependência começou a responder mais lentamente?</p>
</li>
<li><p>O aumento da latência afetou alguma métrica de negócio?</p>
</li>
</ol>
<p>Um único dashboard não consegue responder a todas essas perguntas. Elas exigem informações de fontes diferentes.</p>
<p>É por isso que observabilidade também é contexto. Ela fornece evidências sobre como o sistema se comporta em uma situação específica.</p>
<h2>Os registros precisam contar uma história</h2>
<p>Um log com uma mensagem curta pode ajudar alguém que conhece o código. Para uma investigação maior, normalmente não é suficiente.</p>
<p>Compare estes dois exemplos:</p>

```text
Error processing payment
```

```json
{
  "event": "payment_processing_failed",
  "order_id": "ord_123",
  "payment_provider": "provider_a",
  "error_code": "timeout",
  "retry_count": 2,
  "request_id": "req_456",
  "occurred_at": "2026-08-20T18:30:00Z"
}
```

<p>O segundo exemplo é melhor porque contém informações que podem ser conectadas a outros sinais.</p>
<p>Com um <code>request_id</code>, podemos acompanhar a requisição por diferentes serviços. Com um <code>order_id</code>, podemos entender o impacto em uma transação. Com o código de erro, podemos agrupar falhas semelhantes. Com o timestamp, podemos comparar o evento com deploys e mudanças de infraestrutura.</p>
<p>Registros estruturados tornam o comportamento do sistema mais fácil de entender.</p>
<h2>As métricas precisam ter significado</h2>
<p>É possível ter muitos dashboards e ainda assim ter uma observabilidade ruim.</p>
<p>Uma métrica só é útil quando sabemos o que ela significa, qual comportamento descreve e quando devemos prestar atenção nela.</p>
<p>Por exemplo, uma métrica chamada <code>request_count</code> pode mostrar o número de requisições. Mas também precisamos saber:</p>
<ul>
<li><p>qual é a unidade de tempo;</p>
</li>
<li><p>qual serviço cria essa métrica;</p>
</li>
<li><p>quais filtros estão disponíveis;</p>
</li>
<li><p>qual mudança é considerada normal;</p>
</li>
<li><p>como ela se relaciona com erros e latência.</p>
</li>
</ul>
<p>Sem esse contexto, um agente pode encontrar a métrica certa e ainda assim entendê-la de forma incorreta.</p>
<p>Uma boa prática é documentar as métricas mais importantes com seu significado, dimensões e limitações conhecidas. O dashboard se torna uma explicação visual do sistema.</p>
<h2>Rastreamentos conectam arquitetura e comportamento</h2>
<p>Em uma arquitetura distribuída, uma requisição pode passar por vários serviços antes de chegar ao usuário.</p>
<p>Quando olhamos para cada serviço separadamente, perdemos parte da história. Um trace permite acompanhar o caminho completo e ver onde o tempo foi gasto.</p>
<p>Isso ajuda a responder perguntas como:</p>
<ul>
<li><p>qual serviço adicionou mais latência;</p>
</li>
<li><p>qual chamada foi repetida várias vezes;</p>
</li>
<li><p>onde ocorreu o primeiro erro;</p>
</li>
<li><p>qual dependência externa está afetando o fluxo;</p>
</li>
<li><p>se uma falha em um serviço está causando problemas em outros.</p>
</li>
</ul>
<p>Para um agente, rastreamentos conectam o mapa da arquitetura a uma execução real. Eles mostram como os componentes trabalharam juntos, não apenas como foram descritos em um documento.</p>
<h2>O contexto operacional precisa incluir o negócio</h2>
<p>Um erro comum em observabilidade é olhar apenas para a saúde técnica do sistema.</p>
<p>CPU, memória, taxa de erros e latência são importantes. Mas nem sempre mostram o impacto real nas pessoas que usam o produto.</p>
<p>Uma API pode retornar uma resposta bem-sucedida enquanto uma etapa importante do negócio falha. Um fluxo pode ter poucos erros, mas afetar os clientes mais importantes. Uma fila pode processar mensagens, mas com um atraso que cria uma experiência ruim para o usuário.</p>
<p>Por isso, é útil conectar sinais técnicos a eventos de negócio:</p>
<ul>
<li><p>pagamentos aprovados;</p>
</li>
<li><p>pedidos concluídos;</p>
</li>
<li><p>documentos processados;</p>
</li>
<li><p>usuários que concluíram uma etapa;</p>
</li>
<li><p>transações que precisaram de ajuda manual.</p>
</li>
</ul>
<p>Esse contexto ajuda o agente a se concentrar no que realmente importa. Nem todo alerta técnico é um incidente de negócio, e nem todo problema de negócio aparece como um erro técnico óbvio.</p>
<h2>O que acontece depois de uma implantação?</h2>
<p>Uma mudança de código só pode ser avaliada corretamente depois que começa a executar.</p>
<p>O contexto de uma mudança também deve incluir sua conexão com os sinais de produção. Quando uma implantação acontece, devemos conseguir responder:</p>
<ul>
<li><p>quais serviços mudaram;</p>
</li>
<li><p>quais métricas precisam ser observadas;</p>
</li>
<li><p>qual comportamento esperamos;</p>
</li>
<li><p>quais alertas podem indicar um problema;</p>
</li>
<li><p>como comparar o comportamento antigo com o novo.</p>
</li>
</ul>
<p>Com essas conexões, um agente pode ajudar não apenas a escrever uma mudança, mas também a verificar se ela produziu o resultado esperado.</p>
<h2>Como preparar a observabilidade para agentes</h2>
<p>Você não precisa instrumentar tudo de uma vez. É melhor escolher um fluxo importante e torná-lo fácil de entender do início ao fim.</p>
<p>Estas etapas podem ajudar:</p>
<ol>
<li><p>Escolha um fluxo que seja importante para o negócio.</p>
</li>
<li><p>Garanta que ele tenha um ID de correlação.</p>
</li>
<li><p>Estruture os principais registros desse fluxo.</p>
</li>
<li><p>Crie métricas com nomes e significados claros.</p>
</li>
<li><p>Verifique se os rastreamentos passam pelos serviços envolvidos.</p>
</li>
<li><p>Conecte deploys, incidentes e mudanças de configuração.</p>
</li>
<li><p>Documente o que é normal e o que indica um comportamento incomum.</p>
</li>
</ol>
<p>O objetivo não é apenas criar dashboards mais bonitos. O objetivo é construir um sistema capaz de contar sua própria história quando algo muda.</p>
<h2>Conclusão</h2>
<p>Observabilidade é uma das formas mais importantes de fornecer contexto a agentes de IA.</p>
<p>Código e documentação explicam como o sistema foi projetado. Registros, métricas e rastreamentos mostram como ele se comporta quando as pessoas realmente o estão usando.</p>
<p>Quando esses sinais estão estruturados, conectados e relacionados ao contexto de negócio, uma pessoa nova ou um agente de IA pode investigar problemas com menos ajuda de quem já conhece o sistema.</p>
<p>No próximo artigo, falarei sobre habilidades. A ideia é entender como fornecer a um agente o contexto certo para cada problema, com habilidades especializadas para observabilidade, entrega, dados e outras áreas técnicas.</p>
