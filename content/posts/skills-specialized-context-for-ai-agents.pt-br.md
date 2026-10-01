---
title: 'Skills: Contexto Especializado para Agentes de IA'
date: 2026-08-21
source: https://luizschons.com/skills-specialized-context-for-ai-agents
series: ['Arquitetura Amigável à IA']
draft: false
translationKey: 'skills-specialized-context-for-ai-agents'
---

<p>Este é o quarto artigo de uma série sobre arquitetura amigável à IA. Já falamos sobre contexto, documentação e observabilidade. Agora quero falar sobre uma forma de organizar conhecimento e fluxos de trabalho para agentes: as skills.</p>
<p>Este artigo não está ligado a um produto ou ferramenta específica. O objetivo é discutir a ideia de uma skill de forma geral, independentemente do modelo, agente ou plataforma utilizada.</p>
<p>A ideia principal é simples: um agente não precisa de todo o contexto possível. Ele precisa do contexto certo para o problema que está tentando resolver.</p>
<h2>O problema de colocar tudo em um só lugar</h2>
<p>Uma reação comum quando começamos a trabalhar com agentes é ensiná-los tudo de uma vez.</p>
<p>Colocamos documentação da empresa, padrões de código, regras de negócio, instruções operacionais, dashboards, runbooks e links para muitas ferramentas em um único lugar.</p>
<p>Parece conveniente. Afinal, o agente tem acesso a mais informações. Mas mais informação nem sempre significa conhecimento mais útil.</p>
<p>Quando tudo é mostrado ao mesmo tempo, o agente precisa descobrir:</p>
<ul><li><p>quais informações são relevantes;</p></li><li><p>quais informações são confiáveis;</p></li><li><p>quais partes estão relacionadas;</p></li><li><p>quais informações devem ser ignoradas.</p></li></ul>
<p>Isso cria mais ruído e torna o raciocínio mais difícil de acompanhar.</p>
<p>Talvez estejamos repetindo um problema que já tivemos com sistemas: tentar colocar responsabilidades demais no mesmo lugar.</p>
<p>Uma skill parte de uma ideia diferente. Cada contexto importante pode ter sua própria especialização.</p>
<h2>O que é uma habilidade?</h2>
<p>Uma skill é uma unidade de conhecimento e fluxo de trabalho para um contexto específico.</p>
<p>Ela pode explicar quais conceitos são importantes no domínio, quais perguntas devem ser feitas primeiro, quais fontes podem ser utilizadas, como interpretar os dados, quais limites e regras de segurança devem ser seguidos e como apresentar o resultado.</p>
<p>Por exemplo, uma skill de investigação de incidentes pode orientar o agente a identificar o serviço afetado, reconstruir a linha do tempo, verificar sinais operacionais, separar fatos de suposições e registrar as evidências.</p>
<p>Ela não precisa armazenar cada log, métrica ou documento. Precisa saber onde encontrar essas informações e como utilizá-las.</p>
<p>O valor vem da combinação entre conhecimento e ação.</p>
<h2>Skills são os novos microsserviços?</h2>
<p>Eu não diria que skills são os novos microsserviços. Tecnicamente, são coisas diferentes. Mas existe uma conexão importante entre eles.</p>
<p>Aprendemos que sistemas grandes são mais fáceis de mudar quando são separados por responsabilidade e contexto de negócio. Cada contexto pode ter vocabulário, regras, dados, contratos e responsabilidades mais claros.</p>
<p>Podemos usar uma ideia semelhante para o contexto que oferecemos aos agentes.</p>
<p>Em vez de criar um agente que sabe um pouco sobre cada domínio, podemos criar contextos especializados com limites claros:</p>
<img src="/images/posts/skills-specialized-context-for-ai-agents/e98f98b4-fb9b-45f6-92fc-df22073ed217.png" alt="Agente de engenharia" style="display:block;margin:0 auto" />
<p>O agente ainda tem uma visão geral do sistema, mas pode usar um contexto especializado quando precisa investigar um problema específico.</p>
<h2>Contexto especializado não significa contexto isolado</h2>
<p>Dividir o conhecimento em partes menores não significa criar caixas que não conseguem se comunicar.</p>
<p>Uma investigação pode começar pela observabilidade, continuar pela entrega e terminar nos dados. O agente precisa saber quando cada contexto é relevante e como conectar as evidências que encontra.</p>
<img src="/images/posts/skills-specialized-context-for-ai-agents/f0a395fc-f30c-4a9d-9f96-547af24fa796.png" alt="Investigação de incidente" style="display:block;margin:0 auto" />
<p>Uma skill oferece profundidade. O agente coordena o trabalho.</p>
<h2>Uma skill precisa de limites claros</h2>
<p>Uma skill genérica demais rapidamente perde seu valor.</p>
<p>“Investigue problemas em produção” é uma instrução ampla. Ela não explica por onde começar, quais fontes consultar ou como decidir que uma hipótese é mais provável do que outra.</p>
<p>Uma skill mais útil define o contexto, o objetivo, as fontes disponíveis e os limites da investigação:</p>
<pre><code class="language-text">Contexto:
  APIs e serviços do domínio de pedidos.

Objetivo:
  Investigar um aumento de latência e identificar as
  causas mais prováveis com base em evidências.

Fontes e capacidades:
  - pesquisar logs, métricas e traces do fluxo de pedidos;
  - consultar o catálogo de serviços e suas dependências;
  - verificar mudanças e deploys recentes;
  - consultar o banco de dados em modo somente leitura;
  - comparar o comportamento atual com um período anterior.

Fluxo de trabalho:
  1. Identificar o serviço e o endpoint afetados.
  2. Descobrir quando a mudança começou.
  3. Comparar latência, erros e volume de requisições.
  4. Verificar traces e dependências do fluxo.
  5. Verificar mudanças recentes.
  6. Consultar dados de pedidos para testar a hipótese,
     sem alterar nenhum registro.
  7. Registrar fatos, possíveis causas e informações ausentes.

Limites:
  - não alterar dados;
  - não executar comandos de escrita;
  - não expor dados sensíveis no resultado;
  - pedir ajuda quando as evidências não forem suficientes.
</code></pre>
<p>Este exemplo é mais útil porque transforma uma intenção em um processo que pode ser seguido.</p>
<p>Ele também deixa algo claro: consultar um banco de dados não significa oferecer acesso ilimitado. A skill pode usar uma conexão somente leitura, com tabelas, campos e limites definidos para aquela investigação.</p>
<p>Na prática, o agente pode acessar fontes por meio de capacidades claramente definidas:</p>
<pre><code class="language-text">search_logs(service, time_range)
query_metrics(service, metric, time_range)
get_trace(trace_id)
list_recent_changes(service, time_range)
query_readonly_database(query, parameters)
</code></pre>
<p>Cada capacidade deve ter sua própria política de acesso. A consulta ao banco pode permitir somente operações de leitura, limitar o tempo de execução e permitir acesso apenas às tabelas necessárias para aquele domínio.</p>
<p>Isso não significa que toda skill precise ser rígida. Ela pode permitir alguma flexibilidade, desde que defina claramente o problema que pretende resolver.</p>
<p>Quanto mais claro o contexto, menor a probabilidade de o agente desperdiçar tempo em caminhos irrelevantes.</p>
<h2>Uma skill também precisa conhecer seus limites</h2>
<p>Um bom especialista não é apenas alguém que sabe o que fazer. Também é alguém que sabe quando não deve agir sozinho.</p>
<p>Uma skill deve deixar claros estes pontos:</p>
<ul><li><p>quais ações são somente de leitura;</p></li><li><p>quais ações precisam de aprovação;</p></li><li><p>quais dados podem ser expostos;</p></li><li><p>quando não há evidências suficientes para uma conclusão;</p></li><li><p>quando o problema deve ser encaminhado para uma pessoa.</p></li></ul>
<p>Isso é especialmente importante para skills relacionadas à produção, a dados sensíveis ou a mudanças que possam afetar outros contextos.</p>
<p>Contexto especializado não deve ser confundido com autonomia ilimitada.</p>
<p>Esses limites não podem existir apenas como instruções para o agente. Também precisamos de guardrails fixos que verifiquem permissões, argumentos, ambiente e impacto antes que qualquer ação seja executada.</p>
<p>Nunca devemos confiar que o agente vai se lembrar de uma regra de segurança ou segui-la por conta própria.</p>
<p>A skill orienta o comportamento, mas o guardrail impõe a restrição. Vou explicar essa diferença com mais detalhes posteriormente, em um artigo sobre guardrails, permissões e fitness functions.</p>
<h2>O agente conecta os contextos</h2>
<p>O maior valor não está apenas em criar skills separadas. Também está na capacidade do agente de conectá-las.</p>
<p>Uma skill de observabilidade pode encontrar um comportamento incomum. Uma skill de entrega pode identificar uma mudança recente. Uma skill de dados pode encontrar uma alteração em um pipeline.</p>
<p>Com uma visão mais ampla, o agente pode conectar essas descobertas e formar uma possível explicação:</p>
<blockquote><p>O aumento de erros começou depois de uma mudança recente. O serviço passou a receber dados com uma estrutura diferente, e a falha está concentrada nos pedidos criados após a atualização.</p></blockquote>
<p>Essa conclusão ainda precisa ser verificada, mas é mais útil do que uma lista de fatos desconectados.</p>
<p>As skills fornecem profundidade. O agente fornece coordenação.</p>
<h2>Como começar a criar skills</h2>
<p>Você não precisa começar criando uma skill para cada ferramenta ou equipe.</p>
<p>Escolha um problema recorrente e observe como as pessoas experientes o resolvem hoje.</p>
<p>Pergunte quais perguntas são feitas primeiro, quais fontes são consultadas, como os dados são interpretados, quais causas possíveis costumam ser descartadas, quando a investigação precisa ser escalada e qual formato de resultado é realmente útil.</p>
<p>Depois, transforme esse conhecimento em um processo que possa ser encontrado e reutilizado.</p>
<p>Uma skill não precisa ser perfeita em sua primeira versão. Ela pode melhorar ao longo do tempo com casos reais e incorporar as lições de cada investigação.</p>
<h2>Conclusão</h2>
<p>Skills são uma forma de organizar contexto especializado para agentes.</p>
<p>Elas evitam que o agente receba uma quantidade enorme de informações sem orientação. Também ajudam a tornar o raciocínio mais específico, fácil de verificar e mais útil.</p>
<p>A principal mudança não é adicionar outra camada de abstração. É reconhecer que problemas diferentes precisam de conhecimentos, fontes e métodos de investigação diferentes.</p>
<p>Assim como aprendemos a separar serviços por contexto, também podemos separar o conhecimento e as capacidades dos agentes por contexto.</p>
