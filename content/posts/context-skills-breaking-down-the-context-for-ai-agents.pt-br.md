---
title: 'Context Skills: Dividindo o Contexto para Agentes de IA'
date: 2026-09-05
source: https://luizschons.com/context-skills-breaking-down-the-context-for-ai-agents
series: ['Arquitetura Amigável à IA']
draft: false
translationKey: 'context-skills-breaking-down-the-context-for-ai-agents'
---



<p>Este é o sexto artigo da série sobre arquitetura amigável à IA. Já discutimos como o código, a documentação e a observabilidade ajudam os agentes a entender os sistemas. Também vimos como as habilidades podem fornecer conhecimento especializado para problemas específicos.</p>
<p>Agora quero dar um passo para trás e olhar para a arquitetura por trás dessas habilidades.</p>
<p>Assim como aprendemos a dividir grandes sistemas em contextos menores, também podemos precisar aprender a dividir o contexto que damos aos agentes.</p>
<h2>O monólito de contexto</h2>
<p>Uma das primeiras tentativas de preparar um repositório para agentes é muitas vezes criar um arquivo central com todas as instruções.</p>
<p>Algo assim</p>
<pre><code class="language-text">AGENTS.md

# Como nossa empresa funciona

Architecture
Domains
Coding standards
Deployment processes
Observability
Business rules
Runbooks
Testing conventions
Information about all teams
</code></pre>
<p>No começo, esse arquivo ajuda. Ele cria um lugar para registrar decisões e orientações que costumavam existir apenas na cabeça das pessoas.</p>
<p>Mas pode crescer rapidamente. Depois de algum tempo, fica difícil saber quais partes se aplicam a cada tarefa, quem é responsável por atualizá-las e quais instruções têm prioridade.</p>
<p>Este é um monólito de contexto.</p>
<p>O problema não é ter um arquivo central. O problema é colocar o conhecimento de todos os domínios e todas as ferramentas no mesmo lugar, sem limites claros.</p>
<h2>O que aprendemos com microsserviços</h2>
<p>A evolução dos microsserviços nos ensinou uma lição importante: grandes sistemas são mais fáceis de entender quando são divididos por responsabilidade e contexto de negócios.</p>
<p>Um contexto limitado não é apenas uma pasta ou um serviço separado. Ele define um limite que contém:</p>
<ul>
<li><p>seu próprio vocabulário;</p>
</li>
<li><p>Regras Específicas</p>
</li>
<li><p>responsabilidades claras;</p>
</li>
<li><p>contratos com outros contextos;</p>
</li>
<li><p>dados e comportamentos relacionados;</p>
</li>
<li><p>propriedade definida.</p>
</li>
</ul>
<p>Por exemplo, dentro do contexto de pagamentos, a palavra transação pode ter um significado específico. Dentro do contexto de pedidos, a mesma palavra pode aparecer, mas representa outra parte do negócio.</p>
<p>Os limites ajudam a evitar que todos os componentes precisem saber tudo.</p>
<p>Podemos aplicar uma ideia semelhante ao contexto dado aos agentes.</p>
<h2>O contexto também pode ser decomposto</h2>
<p>Em vez de dar todas as instruções para cada problema, podemos criar especializações:</p>
<img src="/images/posts/context-skills-breaking-down-the-context-for-ai-agents/c4a20dee-f240-4c5a-9203-1a486b0fed2f.png" alt="Um agente, vários contextos" style="display:block;margin:0 auto" />

<p>Cada habilidade conhece profundamente um contexto. Pode ter seu próprio vocabulário, regras, ferramentas e limites.</p>
<p>Uma habilidade de pagamentos pode explicar os estados das transações, as políticas de reembolso e a integração do provedor. Uma habilidade de entrega pode explicar o fluxo de implantação, ambientes e aprovações. Uma habilidade de observabilidade pode orientar investigações usando logs, métricas e traços.</p>
<p>O agente ainda mantém uma visão geral, mas não precisa carregar todos os detalhes ao mesmo tempo.</p>
<h2>Context Skills não são microsserviços</h2>
<p>É importante fazer uma distinção.</p>
<p>Context Skills não são os novos microsserviços. Uma skill não é um serviço de produção, não possui necessariamente uma API de negócio e não substitui um limite de runtime.</p>
<p>A conexão entre os conceitos está na ideia de decomposição.</p>
<p>Microsserviços ajudam a separar capacidades de software. Context Skills ajudam a separar conhecimento e fluxos de trabalho para agentes.</p>
<p>O mesmo domínio pode ter um serviço, documentação, painéis e uma ou mais skills relacionadas. A skill conhece o contexto e sabe consultar as fontes corretas, mas os dados continuam nos sistemas responsáveis por eles.</p>
<img src="/images/posts/context-skills-breaking-down-the-context-for-ai-agents/2f622eba-b9f9-4eec-874a-51ef1c5c0f3d.png" alt="Contexto distribuído: pagamentos" style="display:block;margin:0 auto" />

<p>O valor vem da conexão entre essas partes.</p>
<h2>Uma skill é mais do que documentação</h2>
<p>Uma página de documentação explica um assunto. Uma Context Skill também precisa explicar como trabalhar com esse assunto.</p>
<p>Ela pode orientar o agente sobre:</p>
<ul>
<li><p>quando aquele contexto é relevante;</p>
</li>
<li><p>quais fontes devem ser verificadas primeiro;</p>
</li>
<li><p>quais perguntas precisam ser respondidas;</p>
</li>
<li><p>quais evidências devem aparecer no resultado;</p>
</li>
<li><p>quais ações são permitidas;</p>
</li>
<li><p>quais ações precisam de aprovação;</p>
</li>
<li><p>quando a investigação deve parar.</p>
</li>
</ul>
<p>Isso cria um contrato de trabalho para o contexto. A skill não precisa conter todos os detalhes, mas deve ajudar o agente a encontrar as informações corretas e respeitar os limites da equipe.</p>
<p>Por exemplo, a skill de pagamentos pode dizer que uma investigação de reembolso deve verificar o contrato da operação, os eventos emitidos e o runbook de falhas. Ela também pode exigir que o agente diferencie uma transação autorizada de uma transação capturada antes de formular uma hipótese.</p>
<h2>O que uma Context Skill precisa saber?</h2>
<p>Uma skill baseada em contexto não precisa copiar todas as informações do domínio. Ela precisa saber como navegá-las.</p>
<p>Alguns elementos importantes são:</p>
<h3>Vocabulário</h3>
<p>Quais termos têm um significado especial nesse domínio? O que é uma transação, uma autorização, uma captura ou um reembolso?</p>
<h3>Responsabilidades</h3>
<p>Qual serviço é responsável por cada ação? Quem é o responsável pelo contexto? Quais decisões a equipe pode tomar?</p>
<h3>Contratos</h3>
<p>Quais APIs, eventos e esquemas conectam esse contexto aos demais? Quais mudanças precisam de versionamento?</p>
<h3>Fontes de verdade</h3>
<p>Onde estão os dados atuais? Qual documentação deve ser consultada? Qual plataforma contém os sinais de produção?</p>
<h3>Limites</h3>
<p>Quais ações são somente leitura? O que precisa de aprovação? Quando o agente deve parar e pedir ajuda?</p>
<p>Esse conjunto de informações dá profundidade ao agente sem exigir que ele carregue o conhecimento da empresa inteira.</p>
<p>Esses limites devem ser definidos junto com as políticas de segurança da arquitetura. Como vimos no artigo <a href="https://luizschons.com/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/">Funções de segurança, guarda-corpos e condicionamento físico para agentes</a>, uma skill pode orientar o agente, mas não deve ser a única proteção contra uma ação insegura. Permissões, escopos e aprovações também precisam ser aplicados pelas ferramentas e pelos recursos protegidos.</p>
<h2>Um agente conecta as skills</h2>
<p>Dividir o contexto não significa criar agentes isolados que não conseguem se comunicar.</p>
<p>O agente principal coordena as especializações.</p>
<p>Imagine uma investigação em que a taxa de falhas de pagamento aumentou. O agente pode fazer o seguinte:</p>
<pre><code class="language-text">1. Activate the Payments Context Skill.
2. Use the Observability Skill to investigate the signals.
3. Use the Delivery Skill to check recent deployments.
4. Use the Data Platform Skill if the flow depends on processed data.
5. Combine the evidence into a hypothesis.
6. Show what was confirmed and what is still uncertain.
</code></pre>
<p>Cada skill acrescenta uma visão específica. O agente conecta as informações entre elas.</p>
<p>Essa separação permite que uma skill seja mantida pelas pessoas que realmente conhecem aquele contexto. Elas não precisam manter todas as instruções do agente de engenharia.</p>
<h2>Contexto demais também pode ser um problema</h2>
<p>Decompor não significa criar centenas de skills pequenas.</p>
<p>Existe um ponto em que a fragmentação excessiva começa a causar problemas. Se o agente precisa ativar dez skills para responder a uma pergunta simples, os limites podem estar errados ou a tarefa pode ter sido dividida em unidades pequenas demais.</p>
<p>Um bom limite geralmente agrupa conhecimentos que mudam juntos, são usados juntos e têm responsabilidades relacionadas.</p>
<p>Outra pergunta útil é: se esse contexto mudar, quem precisa revisar o conhecimento? Se a resposta incluir equipes muito diferentes, responsabilidades conflitantes ou fontes não relacionadas, o limite pode ser grande demais.</p>
<p>Os limites também devem ser observáveis. Precisamos saber qual contexto foi consultado, quais fontes foram usadas e quais regras orientaram a resposta. Sem essa visibilidade, é difícil entender se um problema veio de informação ausente, da escolha da skill ou da interpretação do agente.</p>
<p>Podemos começar com alguns contextos maiores:</p>
<pre><code class="language-text">Observability
Delivery
Data
Payments
Orders
Security
</code></pre>
<p>Com o tempo, cada contexto pode evoluir. Uma skill de observabilidade pode ganhar especializações para incidentes, desempenho e capacidade. Essa divisão deve acontecer quando houver uma necessidade real, não apenas porque é possível criar mais arquivos.</p>
<h2>Onde vivem as Context Skills?</h2>
<p>Uma Context Skill pode viver junto do código da equipe, em um repositório de plataforma ou em um catálogo compartilhado. A escolha depende de quem mantém o contexto e de como os agentes serão usados.</p>
<p>Os pontos mais importantes são deixar claro:</p>
<ul>
<li><p>quem é responsável pela skill;</p>
</li>
<li><p>quais agentes podem usá-la;</p>
</li>
<li><p>quais fontes externas ela consulta;</p>
</li>
<li><p>como suas instruções são versionadas;</p>
</li>
<li><p>como as mudanças são revisadas;</p>
</li>
<li><p>quais permissões ela precisa.</p>
</li>
</ul>
<p>Por exemplo, a skill de observabilidade pode ser mantida pela equipe de plataforma. Ela pode explicar como consultar painéis e métricas padrão, mas não deve armazenar cópias dos dados de produção.</p>
<p>Uma skill de pagamentos pode ser mantida pela equipe responsável pelo domínio. Ela pode apontar para ADRs, contratos e runbooks, mas deve continuar respeitando as fontes originais.</p>
<h2>Context Skills e responsabilidade</h2>
<p>A responsabilidade é uma parte essencial dessa arquitetura.</p>
<p>Se todos são responsáveis por uma skill, provavelmente ninguém é realmente responsável. Se ninguém revisa as instruções quando uma API muda, o agente começa a trabalhar com conhecimento desatualizado.</p>
<p>Uma skill pode ter um arquivo simples de metadados:</p>
<pre><code class="language-yaml">name: payments-context
owner: payments-team
review_frequency: quarterly
sources:
  - payment-service
  - payment-documentation
  - payment-dashboards
</code></pre>
<p>Esse arquivo não resolve sozinho o problema de manutenção, mas torna a responsabilidade mais visível e pode ajudar a criar um processo de revisão.</p>
<h2>Conclusão</h2>
<p>Durante muito tempo, nossa preocupação foi decompor sistemas para que pudessem ser desenvolvidos e operados por equipes diferentes.</p>
<p>Agora também precisamos decompor o conhecimento que fornecemos aos agentes.</p>
<p>Context Skills são uma forma de criar limites para esse conhecimento. Elas permitem que cada contexto tenha vocabulário, regras, ferramentas, responsabilidade e limites claros.</p>
<p>O agente não precisa conhecer tudo profundamente. Ele precisa saber quais contextos existem, quando usá-los e como conectar as evidências que encontra.</p>
<p>No próximo artigo, vamos separar as partes que fazem essa arquitetura funcionar: agentes, skills, ferramentas e MCP. O objetivo é entender o papel de cada camada antes de usá-las em um caso real.</p>
