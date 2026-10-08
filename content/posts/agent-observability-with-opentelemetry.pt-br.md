---
title: 'Observabilidade de Agentes com OpenTelemetry'
date: 2026-09-16
source: https://luizschons.com/agent-observability-with-opentelemetry
series: ['Arquitetura Amigável à IA']
translationKey: agent-observability-with-opentelemetry
draft: false
tags: ['IA', 'Observabilidade']
---

<p>Este é o nono e último artigo da série sobre arquitetura amigável para IA. Ao longo da série, falamos sobre contexto, documentação, observabilidade de sistemas, habilidades, agentes, ferramentas, MCP, segurança e o fluxo completo para entregar uma funcionalidade.</p>
<p>Para encerrar, quero olhar para dentro da própria ferramenta de IA.</p>
<p>Quando um agente participa de uma tarefa, normalmente observamos apenas o resultado final. O pull request foi criado? Os testes passaram? A funcionalidade foi entregue?</p>
<p>Essas perguntas são importantes, mas não explicam o caminho percorrido pelo agente.</p>
<p>Quanto tempo levou para encontrar o contexto correto? Quantas vezes a investigação foi repetida? Quais ferramentas foram usadas? Quando foi necessária aprovação? O problema estava no modelo, na documentação, na integração ou no próprio fluxo?</p>
<p>Sem esses sinais, toda avaliação se baseia em impressões.</p>
<h2>O trabalho do agente também precisa ser observável</h2>
<p>Em sistemas tradicionais, já sabemos que logs, métricas e traces ajudam a explicar o comportamento de uma aplicação. Não consideramos uma API confiável apenas porque ela respondeu uma vez. Observamos latência, erros, dependências, tráfego e impacto.</p>
<p>Com agentes, muitas equipes ainda fazem o oposto. Avaliam a ferramenta por meio de algumas interações isoladas e decidem que ela é rápida, lenta, boa ou ruim.</p>
<p>Uma sessão de agente também é um fluxo distribuído. Ela envolve modelo, contexto, ferramentas, permissões, sistemas externos, arquivos, testes e decisões humanas. O resultado final é apenas o último evento dessa cadeia.</p>
<p>Se queremos melhorar esse fluxo, precisamos enxergar o que acontece antes do resultado final.</p>
<img src="/images/posts/agent-observability-with-opentelemetry/e98ed5d6-ff82-4af9-abd1-c47cbabb2f20.png" alt="Fluxo de observabilidade para sessões de IA: ferramenta de IA, instrumentação, coletor OpenTelemetry e, no fim, Prometheus e Grafana" style="display:block;margin:0 auto" />

<h2>O que vale a pena medir?</h2>
<p>Observabilidade não significa registrar tudo. O objetivo não é vigiar desenvolvedores nem transformar contagem de tokens em uma falsa medida de produtividade.</p>
<p>O objetivo é criar evidências para decisões de engenharia.</p>
<p>Alguns sinais úteis incluem:</p>
<ul><li><p>quantidade e duração das sessões;</p></li><li><p>tempo gasto em chamadas ao modelo e às ferramentas;</p></li><li><p>tokens usados e custo estimado;</p></li><li><p>erros, novas tentativas e interrupções;</p></li><li><p>quantidade de solicitações de aprovação;</p></li><li><p>testes executados e seus resultados;</p></li><li><p>arquivos ou linhas alterados;</p></li><li><p>resultado da tarefa, como um pull request criado, uma alteração interrompida ou uma entrega concluída.</p></li></ul>
<p>Esses sinais se tornam úteis quando os conectamos a perguntas reais.</p>
<p>A nova documentação reduziu o tempo até a primeira hipótese útil? Uma habilidade de investigação reduziu a quantidade de chamadas às ferramentas? Um MCP externo está adicionando latência sem melhorar o resultado? O agente está pedindo aprovação cedo ou tarde demais? Uma mudança de contexto aumentou o custo porque adicionou informação útil ou porque adicionou ruído?</p>
<p>Não conseguimos responder a essas perguntas olhando apenas para a resposta final do agente.</p>
<p>Uma boa métrica nem sempre é a mais fácil de contar. É aquela que ajuda a entender uma decisão ou encontrar uma oportunidade de melhoria.</p>
<h2>OpenTelemetry como camada comum</h2>
<p>Este artigo usa OpenTelemetry porque ele é um padrão aberto e um projeto open source. Podemos começar sem pagar por uma plataforma proprietária de observabilidade.</p>
<p>Uma arquitetura possível usa um OpenTelemetry Collector para receber e encaminhar sinais, Prometheus para armazenar métricas e Grafana para consultá-las. Esses componentes são gratuitos e open source, embora o modelo usado pela ferramenta ou uma plataforma gerenciada possa ter seus próprios custos.</p>
<p>O ponto mais importante não é a escolha do dashboard. É a separação entre a ferramenta que produz eventos e o sistema que os observa.</p>
<p>OpenCode é apenas o exemplo usado neste artigo. Ele pode ser instrumentado por um plugin que exporta sinais por OTLP. A mesma arquitetura pode ser usada com Codex, Claude Code, Cursor ou outra ferramenta que tenha um exportador nativo, plugin, hook ou adaptador capaz de produzir telemetria.</p>
<p>Cada ferramenta pode emitir eventos de uma maneira diferente. O backend não precisa conhecer todos esses detalhes. Ele pode trabalhar com conceitos mais estáveis, como sessão, chamada de modelo, ferramenta, aprovação, erro e resultado.</p>
<p>Essa separação permite trocar a ferramenta sem reconstruir toda a infraestrutura de observabilidade. Também permite comparar diferentes fluxos usando uma linguagem comum.</p>
<h2>Da atividade aos resultados</h2>
<p>Uma armadilha comum é observar apenas a atividade.</p>
<p>Mais mensagens nem sempre significam mais progresso. Mais tokens podem representar um contexto melhor, mas também podem indicar que o agente está perdido. Mais chamadas de ferramentas podem mostrar uma investigação cuidadosa ou falta de documentação.</p>
<p>Por isso, os sinais de atividade precisam ser conectados aos sinais de resultado.</p>
<table><thead><tr><th>Atividade</th><th>Resultado que vale investigar</th></tr></thead><tbody><tr><td>Tokens usados</td><td>A tarefa foi concluída com menos retrabalho?</td></tr><tr><td>Chamadas de ferramentas</td><td>O agente encontrou evidências melhores?</td></tr><tr><td>Duração da sessão</td><td>O tempo extra melhorou a qualidade ou apenas aumentou a espera?</td></tr><tr><td>Solicitações de aprovação</td><td>Os limites de autonomia eram adequados?</td></tr><tr><td>Linhas alteradas</td><td>Os testes e critérios de sucesso foram atendidos?</td></tr></tbody></table>
<p>Esse cuidado impede que a observabilidade se torne um placar. Não estamos julgando o agente pela maior quantidade possível de saída. Estamos tentando entender se o fluxo ajuda a equipe a tomar decisões melhores com segurança.</p>
<h2>O contexto também aparece nas métricas</h2>
<p>Os sinais da sessão podem revelar problemas que não estão no modelo.</p>
<p>Se o agente passa muito tempo procurando arquivos, a arquitetura de contexto pode ser difícil de navegar. Se ele repete consultas, pode estar faltando uma habilidade especializada. Se chamadas externas são lentas, a integração pode estar mal projetada. Se ele pede aprovação a cada passo, as permissões podem ser rígidas demais ou o fluxo pode não estar claro.</p>
<p>Essa é uma parte importante de uma arquitetura amigável para IA: contexto não é apenas algo que entregamos ao agente. Também é algo que podemos avaliar por meio do comportamento observado.</p>
<p>A telemetria fecha o ciclo entre contexto, execução e aprendizado.</p>
<h2>Observabilidade também é segurança</h2>
<p>A telemetria de agentes pode conter mais informação do que parece.</p>
<p>Um prompt pode conter uma regra interna. Um argumento de ferramenta pode conter um token. Um resultado pode incluir dados de clientes. Um trace pode registrar parte do código. Um caminho de arquivo pode revelar a estrutura de um sistema.</p>
<p>Por isso, não devemos confiar no próprio agente para decidir o que pode ser enviado ao backend. A proteção precisa ser aplicada por componentes determinísticos, como o Collector, o gateway de telemetria e as políticas de acesso.</p>
<p>Alguns princípios são importantes:</p>
<ul><li><p>prompts completos não devem ser armazenados em métricas;</p></li><li><p>argumentos e resultados de ferramentas precisam ser sanitizados antes do envio;</p></li><li><p>caminhos de arquivos e conteúdo de código não devem virar labels;</p></li><li><p>credenciais devem ficar fora de configurações versionadas;</p></li><li><p>tokens para destinos gerenciados devem ter o menor privilégio possível;</p></li><li><p>retenção e acesso devem ser definidos antes do início da coleta;</p></li><li><p>identificadores de alta cardinalidade precisam ser tratados com cuidado.</p></li></ul>
<p>Isso se conecta ao artigo sobre <a href="https://luizschons.com/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/">segurança, guardrails e fitness functions</a>. Guardrails determinísticos não devem proteger apenas as ações do agente. Eles também precisam proteger os dados criados durante o trabalho do agente.</p>
<h2>O caso do <code>session_id</code></h2>
<p>Durante uma investigação, pode ser útil abrir uma sessão e entender o que aconteceu nela. Uma implementação local pode permitir selecionar um <code>session_id</code> no Grafana para esse tipo de análise.</p>
<p>Isso é conveniente em um ambiente local, mas cada nova sessão pode criar uma nova série de métricas. Em uma operação com muitos usuários e execuções, esse crescimento de cardinalidade pode ser caro e difícil de sustentar.</p>
<p>Por isso, observabilidade para desenvolvimento é diferente de observabilidade para produção.</p>
<p>No desenvolvimento, manter o identificador pode facilitar o aprendizado. Em produção, pode ser melhor usar métricas agregadas e enviar traces ou logs sanitizados para um backend projetado para investigações individuais.</p>
<p>Um dashboard é uma ferramenta de investigação. Ele não deve ser tratado como autorização para coletar qualquer dado que quisermos.</p>
<h2>Um laboratório que torna a ideia concreta</h2>
<p>Para manter a discussão prática, criei o repositório <a href="https://github.com/sschonss/agent-observability-with-opentelemetry">agent-observability-with-opentelemetry</a>.</p>
<p>Ele contém uma configuração local com OpenTelemetry Collector, Prometheus e Grafana, além de um dashboard inicial para sessões de agentes. OpenCode é usado como exemplo de instrumentação, mas o backend foi projetado para receber sinais de outras ferramentas também.</p>
<p>O repositório também documenta os limites do experimento. Logs e traces ficam desativados inicialmente porque podem conter prompts, código e argumentos sensíveis. A ideia é começar com um conjunto pequeno de métricas, entender o que realmente precisamos observar e só então ampliar a coleta.</p>
<p>Isso é mais saudável do que ativar todos os sinais disponíveis e descobrir tarde demais que criamos um novo problema de segurança.</p>
<h2>Conclusão</h2>
<p>Uma arquitetura amigável para IA não deve apenas fornecer contexto ao agente. Ela também precisa tornar o trabalho do agente observável.</p>
<p>Quando medimos sessões, duração, tokens, ferramentas, erros, aprovações e resultados, conseguimos discutir a evolução do fluxo com base em evidências. Podemos descobrir que o problema não é o modelo, mas a documentação. Podemos perceber que uma habilidade reduziu a exploração desnecessária. Podemos encontrar uma integração lenta ou uma etapa que pede revisão humana cedo demais.</p>
<p>O OpenTelemetry oferece uma forma aberta de começar. OpenCode foi apenas o exemplo usado neste artigo. A mesma separação entre ferramenta, instrumentação, Collector e backend pode dar suporte a outras ferramentas e modelos.</p>
<p>Este é o fim da série. A ideia central é simples: agentes melhores dependem menos de tentativa e mais de contexto, limites, evidências e feedback. A observabilidade mostra se estamos realmente melhorando.</p>
