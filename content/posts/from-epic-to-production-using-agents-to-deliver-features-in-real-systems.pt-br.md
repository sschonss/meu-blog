---
title: 'Do Épico à Produção: usando agentes para entregar funcionalidades em sistemas reais'
date: 2026-09-12
source: https://luizschons.com/from-epic-to-production-using-agents-to-deliver-features-in-real-systems
series: ['Arquitetura Amigável à IA']
translationKey: 'from-epic-to-production-using-agents-to-deliver-features-in-real-systems'
draft: false
---

<p>Este é o oitavo artigo da série sobre arquitetura amigável à IA. Nos artigos anteriores, falamos sobre contexto, documentação, observabilidade, skills, Context Skills, agentes, ferramentas, MCP, guardrails e harnesses.</p>
<p>Agora vamos reunir essas peças em um fluxo completo de engenharia.</p>
<p>A ideia não é pedir a um agente para “implementar uma funcionalidade” e esperar que ele descubra tudo sozinho. O objetivo é mostrar como um agente pode ajudar em uma entrega desde o momento em que entendemos o épico até monitorarmos a mudança em produção.</p>
<p>Escrever o código é apenas uma etapa. Em muitos casos, nem é a mais difícil.</p>
<h2>O épico</h2>
<p>Vamos usar esta solicitação como exemplo:</p>
<pre><code class="language-text">As a customer, I want to request a partial refund for an order,
so I can return only some of the items I bought.
</code></pre>
<p>À primeira vista, isso parece uma pequena mudança no serviço de pagamentos.</p>
<p>Mas, antes de escrever código, precisamos entender várias coisas:</p>
<ul>
<li><p>onde o pedido é criado;</p>
</li>
<li><p>quem calcula o valor total;</p>
</li>
<li><p>qual serviço é responsável pelo pagamento;</p>
</li>
<li><p>como os itens são vinculados à transação;</p>
</li>
<li><p>quais regras de cancelamento existem;</p>
</li>
<li><p>como o estoque é atualizado;</p>
</li>
<li><p>como o cliente é notificado;</p>
</li>
<li><p>quais dados precisam ser enviados ao provedor de pagamentos.</p>
</li>
</ul>
<p>Um agente que recebe apenas o épico pode produzir uma solução plausível, mas ainda assim errada.</p>
<h2>Questione o épico</h2>
<p>A primeira tarefa do agente não deve ser criar arquivos. Deve ser transformar o épico em perguntas.</p>
<p>As perguntas podem incluir:</p>
<ul>
<li><p>Qual problema de negócio estamos tentando resolver?</p>
</li>
<li><p>Quem pode solicitar um reembolso?</p>
</li>
<li><p>Quais itens são elegíveis?</p>
</li>
<li><p>Existe um prazo para solicitar um reembolso?</p>
</li>
<li><p>Um pedido pode ter mais de um reembolso?</p>
</li>
<li><p>Como lidamos com um reembolso parcial que já foi iniciado?</p>
</li>
<li><p>O valor do reembolso é calculado a partir do pedido ou do pagamento?</p>
</li>
<li><p>O que acontece se o provedor aceitar o reembolso, mas a atualização interna falhar?</p>
</li>
<li><p>O estoque deve ser liberado imediatamente ou somente após a confirmação?</p>
</li>
<li><p>Como o cliente será informado?</p>
</li>
</ul>
<p>O agente não precisa responder tudo sozinho. Seu trabalho é levar as perguntas certas ao responsável pelo produto e às equipes envolvidas.</p>
<p>Questionar o épico não bloqueia o trabalho. Transforma pontos pouco claros em decisões explícitas antes que se tornem bugs ou retrabalho.</p>
<p>Uma skill de planejamento pode orientar a criação dessas perguntas. O agente pode consultar a documentação do domínio e usar uma ferramenta para encontrar épicos, requisitos e decisões anteriores.</p>
<h2>Execute o spike</h2>
<p>Depois que o objetivo está claro, começa a investigação técnica.</p>
<p>O agente pode usar diferentes Context Skills para investigar o problema. Uma skill de pedidos ajuda a entender itens e estados do pedido. Uma skill de pagamentos explica as regras do provedor. Uma skill de observabilidade mostra como investigar o comportamento atual.</p>
<p>O objetivo do spike não é produzir uma resposta bonita. É construir uma visão baseada em evidências.</p>
<p>O agente pode procurar:</p>
<ul>
<li><p>código relacionado ao pedido;</p>
</li>
<li><p>o fluxo atual de cancelamento;</p>
</li>
<li><p>a integração com o provedor de pagamentos;</p>
</li>
<li><p>testes de reembolso ou cancelamento;</p>
</li>
<li><p>eventos publicados após uma mudança no pagamento;</p>
</li>
<li><p>consumidores desses eventos;</p>
</li>
<li><p>ADRs e decisões anteriores;</p>
</li>
<li><p>métricas e traces do fluxo atual;</p>
</li>
<li><p>incidentes relacionados.</p>
</li>
</ul>
<p>Uma investigação razoável poderia seguir esta ordem:</p>
<ol>
<li><p>Encontre o modelo ou contrato do pedido.</p>
</li>
<li><p>Encontre o fluxo atual de cancelamento.</p>
</li>
<li><p>Encontre a integração com o provedor de pagamentos.</p>
</li>
<li><p>Encontre testes de reembolso ou cancelamento.</p>
</li>
<li><p>Encontre eventos publicados após uma mudança no pagamento.</p>
</li>
<li><p>Encontre os consumidores desses eventos.</p>
</li>
<li><p>Verifique os sinais de produção para entender o comportamento atual.</p>
</li>
</ol>
<p>O agente não deve apenas encontrar arquivos com nomes semelhantes. Ele precisa reconstruir o fluxo e explicar como as partes estão conectadas.</p>
<h2>Registre a decisão do spike</h2>
<p>O resultado do spike não deve permanecer apenas no histórico da conversa. Ele deve se tornar uma documentação que possa ser encontrada em investigações futuras.</p>
<p>Um documento de decisão poderia ser assim:</p>
<pre><code class="language-markdown"># Decision: partial refunds

## Context

An order can contain several items, but the current refund flow
works only with the total transaction amount.

## Options considered

- create a new transaction type;
- allow multiple refunds on the existing transaction;
- create a separate refund service.

## Decision

Use the existing transaction and track the total refunded amount.

## Consequences

- the external provider must support multiple refunds;
- the refund event must identify the items;
- the operation must be idempotent;
- old consumers must keep working.

## Risks

- two refund requests may run at the same time;
- the external and internal states may become different;
- some consumers may not know the new format.
</code></pre>
<p>Essa documentação ajuda a equipe atual, mas também ajuda agentes e trabalhos futuros.</p>
<p>Cada spike bem documentado adiciona uma nova fonte de contexto à arquitetura. Com o tempo, deixamos de depender apenas do código e construímos um mapa de decisões, contratos e consequências.</p>
<h2>Defina o que significa sucesso</h2>
<p>Antes de criar tarefas, precisamos responder a uma pergunta simples:</p>
<blockquote>
<p>Como saberemos que esta implementação resolveu o problema?</p>
</blockquote>
<p>Para um reembolso parcial, sucesso pode significar:</p>
<ul>
<li><p>o cliente pode selecionar itens elegíveis;</p>
</li>
<li><p>o valor do reembolso nunca excede o valor pago;</p>
</li>
<li><p>a mesma solicitação nunca é processada duas vezes;</p>
</li>
<li><p>o provedor recebe os dados corretos;</p>
</li>
<li><p>o estoque é atualizado no momento certo;</p>
</li>
<li><p>o cliente recebe uma notificação clara;</p>
</li>
<li><p>os consumidores antigos continuam funcionando;</p>
</li>
<li><p>a taxa de erros não aumenta;</p>
</li>
<li><p>a latência permanece dentro do limite esperado;</p>
</li>
<li><p>o número de solicitações de suporte sobre reembolsos parciais diminui;</p>
</li>
<li><p>a operação pode ser investigada posteriormente.</p>
</li>
</ul>
<p>Esses critérios importam mais do que o número de arquivos alterados. Código implementado não significa automaticamente que o problema foi resolvido.</p>
<p>Também precisamos medir o impacto fora do sistema. Se o objetivo é permitir que os clientes solicitem reembolsos parciais sozinhos, menos solicitações de suporte sobre esse processo pode ser uma métrica importante de sucesso.</p>
<p>Essa métrica deve ser combinada com sinais técnicos. Menos solicitações de suporte só representam sucesso se a taxa de erros não tiver aumentado e os reembolsos estiverem sendo processados corretamente. Caso contrário, podemos apenas estar tornando o problema menos visível para o suporte.</p>
<p>Por isso, a definição de sucesso já deve apontar para o trabalho de observabilidade. Esses critérios precisam se transformar em métricas, consultas, dashboards e alertas.</p>
<h2>Defina e crie as tarefas</h2>
<p>Com as decisões e os critérios de sucesso definidos, o agente pode dividir a entrega em tarefas:</p>
<ul>
<li><p>adicionar o endpoint de reembolso parcial;</p>
</li>
<li><p>validar os itens e o valor total reembolsado;</p>
</li>
<li><p>atualizar a integração com o provedor;</p>
</li>
<li><p>garantir idempotência e controle de concorrência;</p>
</li>
<li><p>versionar o evento de pagamento;</p>
</li>
<li><p>atualizar os consumidores de estoque e notificações;</p>
</li>
<li><p>criar testes unitários e de integração;</p>
</li>
<li><p>configurar o ambiente de QA;</p>
</li>
<li><p>adicionar métricas e traces;</p>
</li>
<li><p>criar dashboards e alertas;</p>
</li>
<li><p>atualizar a documentação e o runbook.</p>
</li>
</ul>
<p>Uma ferramenta pode criar essas tarefas no sistema usado pela equipe. Uma skill de planejamento pode definir o formato mínimo de cada tarefa, incluindo contexto, critérios de aceitação, dependências e riscos.</p>
<p>O agente pode preparar as tarefas, mas a equipe ainda precisa confirmar se a divisão representa corretamente o trabalho e a responsabilidade de cada domínio.</p>
<h2>Defina como testar</h2>
<p>Antes da implementação, precisamos decidir como validar a mudança em um ambiente que não seja de produção.</p>
<p>Isso pode envolver:</p>
<ul>
<li><p>dados de teste para pedidos com vários itens;</p>
</li>
<li><p>um provedor de pagamentos simulado;</p>
</li>
<li><p>uma feature flag para lançamento gradual;</p>
</li>
<li><p>um ambiente de QA com consumidores atualizados;</p>
</li>
<li><p>testes de contrato para eventos;</p>
</li>
<li><p>testes de concorrência;</p>
</li>
<li><p>testes de idempotência;</p>
</li>
<li><p>testes de falha após a confirmação externa;</p>
</li>
<li><p>testes de rollback.</p>
</li>
</ul>
<p>O agente pode criar cenários de teste a partir dos critérios de sucesso, mas a equipe deve verificar se o ambiente consegue reproduzir as condições importantes do sistema real.</p>
<p>Uma boa pergunta é:</p>
<blockquote>
<p>O que precisa ser configurado em QA para confiarmos no resultado?</p>
</blockquote>
<p>Se a resposta for “nada”, o teste provavelmente não foi definido com detalhes suficientes.</p>
<h2>Defina a observabilidade antes do código</h2>
<p>Mesmo antes de existirem ferramentas de IA, era uma boa prática decidir como uma mudança seria observada após o lançamento.</p>
<p>Para cada funcionalidade, precisamos decidir:</p>
<ul>
<li><p>quais logs serão emitidos;</p>
</li>
<li><p>quais métricas serão coletadas;</p>
</li>
<li><p>quais traces precisam existir;</p>
</li>
<li><p>quais consultas serão usadas;</p>
</li>
<li><p>qual comportamento significa sucesso;</p>
</li>
<li><p>qual comportamento significa degradação;</p>
</li>
<li><p>qual sinal deve iniciar um rollback.</p>
</li>
</ul>
<p>Para reembolsos parciais, poderíamos acompanhar:</p>
<ul>
<li><p>o número de solicitações iniciadas;</p>
</li>
<li><p>o número de reembolsos confirmados;</p>
</li>
<li><p>o número de falhas do provedor;</p>
</li>
<li><p>o valor total reembolsado;</p>
</li>
<li><p>o tempo entre a solicitação e a confirmação;</p>
</li>
<li><p>diferenças entre o estado externo e o interno;</p>
</li>
<li><p>o número de novas tentativas;</p>
</li>
<li><p>falhas por provedor ou método de pagamento.</p>
</li>
</ul>
<p>O agente pode ajudar a escrever consultas e configurar dashboards, mas decidir o que observar é uma decisão de engenharia. Sem esse trabalho, a equipe pode lançar a mudança sem ter evidências de que ela funcionou.</p>
<h2>Implemente o código</h2>
<p>Somente agora começa a implementação.</p>
<p>O agente pode ajudar a:</p>
<ul>
<li><p>criar ou alterar classes;</p>
</li>
<li><p>atualizar contratos;</p>
</li>
<li><p>escrever testes;</p>
</li>
<li><p>alterar schemas;</p>
</li>
<li><p>adicionar instrumentação;</p>
</li>
<li><p>atualizar configurações;</p>
</li>
<li><p>preparar um pull request.</p>
</li>
</ul>
<p>Mas é importante entender o tamanho dessa etapa. A implementação é apenas uma parte do ciclo.</p>
<p>Entender o problema, tomar decisões, definir sucesso, preparar o ambiente, escolher sinais e planejar a operação pode exigir mais raciocínio do que escrever o próprio código.</p>
<p>O agente se torna mais útil quando participa de todas essas etapas, não apenas quando recebe um arquivo para modificar.</p>
<h2>Crie dashboards e alertas</h2>
<p>Antes da implantação, precisamos preparar a operação da funcionalidade.</p>
<p>Isso pode incluir:</p>
<ul>
<li><p>um dashboard para o novo fluxo;</p>
</li>
<li><p>taxa de sucesso;</p>
</li>
<li><p>taxa de erros;</p>
</li>
<li><p>latência;</p>
</li>
<li><p>volume de solicitações;</p>
</li>
<li><p>impacto por cliente ou região;</p>
</li>
<li><p>falhas por dependência;</p>
</li>
<li><p>alertas de divergência de estado;</p>
</li>
<li><p>alertas de aumento de erros;</p>
</li>
<li><p>critérios de rollback.</p>
</li>
</ul>
<p>Um dashboard sem uma pergunta operacional clara pode virar decoração. Cada painel deve ajudar a responder a uma pergunta como:</p>
<ul>
<li><p>A funcionalidade está sendo usada?</p>
</li>
<li><p>Ela está funcionando?</p>
</li>
<li><p>Ela está mais lenta?</p>
</li>
<li><p>Ela está afetando outro contexto?</p>
</li>
<li><p>Precisamos interromper o lançamento?</p>
</li>
</ul>
<h2>Implante e monitore</h2>
<p>O agente pode preparar o pull request, o registro da mudança e o plano de implantação. Ele pode resumir riscos, listar verificações e organizar as etapas.</p>
<p>A execução em produção ainda deve seguir as políticas da organização. Dependendo do risco, uma pessoa pode precisar aprovar o registro da mudança, revisar o pull request e autorizar o merge.</p>
<p>Após a implantação, o monitoramento deve comparar o comportamento observado com a linha de base anterior:</p>
<ul>
<li><p>As métricas estão dentro do intervalo esperado?</p>
</li>
<li><p>A taxa de erros mudou?</p>
</li>
<li><p>O provedor está respondendo como esperado?</p>
</li>
<li><p>Os eventos estão sendo consumidos?</p>
</li>
<li><p>Os dashboards mostram o resultado definido no início?</p>
</li>
<li><p>Algum alerta precisa ser acionado?</p>
</li>
</ul>
<p>O agente pode verificar os sinais e organizar a análise. A decisão de continuar, pausar ou reverter a mudança deve seguir os limites definidos pela equipe.</p>
<h2>Finalize a entrega com documentação</h2>
<p>A entrega não termina quando a implantação é concluída.</p>
<p>O documento criado durante o spike deve ser atualizado com o resultado real da implementação:</p>
<ul>
<li><p>o que foi implementado;</p>
</li>
<li><p>quais decisões mudaram;</p>
</li>
<li><p>quais contratos foram versionados;</p>
</li>
<li><p>quais métricas foram criadas;</p>
</li>
<li><p>quais alertas existem;</p>
</li>
<li><p>como operar a funcionalidade;</p>
</li>
<li><p>como investigar falhas;</p>
</li>
<li><p>quais limitações permanecem;</p>
</li>
<li><p>quais aprendizados podem ser reutilizados.</p>
</li>
</ul>
<p>Essa etapa final cria um ciclo de aprendizado:</p>
<ol>
<li><p>O épico cria perguntas.</p>
</li>
<li><p>O spike cria uma decisão.</p>
</li>
<li><p>A implementação cria um novo comportamento.</p>
</li>
<li><p>A operação cria evidências.</p>
</li>
<li><p>A documentação registra o que foi aprendido.</p>
</li>
<li><p>A próxima solicitação começa com mais contexto.</p>
</li>
</ol>
<p>É assim que uma Arquitetura de Contexto realmente cresce. Ela não é um documento criado uma única vez. É um corpo de conhecimento que cresce com o sistema.</p>
<h2>Onde entram as skills, as ferramentas e o MCP?</h2>
<p>Cada etapa pode usar uma combinação diferente:</p>
<ul>
<li><p><strong>Planning Skill:</strong> questiona o épico e divide o trabalho;</p>
</li>
<li><p><strong>Architecture Skill:</strong> verifica decisões e identifica impactos;</p>
</li>
<li><p><strong>Testing Skill:</strong> define cenários e estratégias de validação;</p>
</li>
<li><p><strong>Observability Skill:</strong> cria consultas, métricas e dashboards;</p>
</li>
<li><p><strong>Delivery Skill:</strong> prepara o pull request, o registro da mudança e a implantação;</p>
</li>
<li><p><strong>Tools:</strong> executam ações específicas, como encontrar documentos ou criar tarefas;</p>
</li>
<li><p><strong>MCP:</strong> conecta o agente aos sistemas onde essas ações acontecem.</p>
</li>
</ul>
<p>O agente coordena o fluxo, mas não precisa carregar todo o conhecimento de todos os contextos ao mesmo tempo. Cada skill fornece uma especialização, e cada ferramenta executa uma capacidade concreta.</p>
<h2>O papel da revisão humana</h2>
<p>O objetivo não é remover a equipe do processo de engenharia.</p>
<p>A equipe ainda precisa:</p>
<ul>
<li><p>confirmar as regras de negócio;</p>
</li>
<li><p>avaliar os trade-offs;</p>
</li>
<li><p>aprovar mudanças de contrato;</p>
</li>
<li><p>decidir quais riscos são aceitáveis;</p>
</li>
<li><p>aprovar mudanças em produção;</p>
</li>
<li><p>assumir a responsabilidade pela decisão.</p>
</li>
</ul>
<p>O agente ajuda a tornar a preparação mais rápida e completa. Ele pode percorrer diferentes fontes, encontrar relações que poderiam passar despercebidas e organizar evidências em um formato mais fácil de revisar.</p>
<p>A decisão continua sendo responsabilidade da equipe.</p>
<h2>Conclusão</h2>
<p>Um agente pode participar de todo o ciclo de vida de uma funcionalidade sem começar escrevendo código.</p>
<p>Ele pode questionar um épico, executar um spike, registrar decisões, definir critérios de sucesso, criar tarefas, planejar testes, preparar consultas de observabilidade, implementar mudanças, abrir um pull request, monitorar uma implantação e atualizar a documentação.</p>
<p>Esse fluxo funciona bem somente quando o contexto está disponível, conectado e confiável. Sem documentação, decisões, observabilidade e skills, o agente tende a preencher lacunas com suposições.</p>
<p>Com uma arquitetura amigável à IA, o agente pode trabalhar com evidências e deixar claro o que sabe, o que inferiu e o que ainda precisa ser decidido.</p>
<p>É nesse ponto que a conversa deixa de ser apenas sobre gerar código. O agente começa a participar do trabalho de engenharia que acontece antes, durante e depois da implementação.</p>
