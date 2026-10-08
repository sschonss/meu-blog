---
title: 'Seu software está pronto para ser entendido por uma IA?'
date: 2026-08-20
source: https://luizschons.com/seu-software-est-pronto-para-ser-entendido-por-uma-ia
series: ['Arquitetura Amigável à IA']
draft: false
tags: ['IA', 'Arquitetura']
---

<p>Este é o primeiro artigo de uma série sobre arquitetura amigável à IA, uma forma de pensar sobre sistemas, contexto e ferramentas para que agentes de IA possam trabalhar com mais eficiência em software do mundo real.</p>
<p>Talvez a melhor maneira de pensar em uma IA trabalhando no seu sistema seja imaginar uma nova pessoa entrando na empresa.</p>
<p>Ela ainda não conhece o domínio, não sabe quais serviços existem, não entende decisões passadas e não sabe onde encontrar as respostas. Para começar a contribuir, precisa passar por um processo de integração.</p>
<p>Essa pessoa pode tentar descobrir as coisas. Também pode perguntar a alguém mais experiente. Mas, quando o conhecimento está bem documentado, ela consegue encontrar as respostas por conta própria e avançar com mais autonomia.</p>
<p>Algo semelhante acontece com agentes de IA. Quanto mais um agente depende de uma pessoa específica, de um contexto informal ou da memória de alguém que já sabe executar uma tarefa, pior ele desempenha.</p>
<p>O objetivo de uma arquitetura amigável à IA é tornar esse conhecimento mais explícito, acessível e fácil de navegar. Não apenas para a IA, mas também para qualquer pessoa nova que entre na equipe.</p>
<p>Nos últimos anos, a forma como construímos software mudou bastante. Primeiro, aprendemos a escalar sistemas. Depois, aprendemos a modularizar o código. Mais tarde, começamos a separar responsabilidades, distribuir serviços e organizar equipes em torno de contextos. Agora estamos entrando em uma nova fase: criar software que não seja apenas usado por pessoas, mas que também possa ser entendido por agentes de IA.</p>
<p>Isso pode parecer sutil no começo, mas muda muita coisa. Um agente não entende seu sistema da mesma forma que um desenvolvedor experiente. Ele precisa de sinais, contexto, estrutura e caminhos para descoberta. Se esse contexto não estiver bem organizado, a IA ainda pode ajudar, mas trabalhará com mais ruído, mais tentativa e erro e menos precisão.</p>
<h2>O problema não é falta de inteligência</h2>
<p>Quando uma IA comete um erro ao analisar um sistema, a explicação mais comum costuma ser: “o modelo não é bom o suficiente”. Às vezes isso é verdade. Mas muitas falhas acontecem por outro motivo: o sistema foi projetado para pessoas que já conhecem o contexto, não para agentes que precisam descobri-lo.</p>
<p>Um desenvolvedor interno sabe:</p>
<ul>
<li><p>onde está a documentação relevante;</p>
</li>
<li><p>quais decisões foram registradas em ADRs antigos;</p>
</li>
<li><p>qual serviço é responsável por cada responsabilidade;</p>
</li>
<li><p>onde olhar quando ocorre um incidente;</p>
</li>
<li><p>quais métricas indicam que algo está realmente errado.</p>
</li>
</ul>
<p>Por padrão, um agente não sabe nada disso. Ele consegue descobrir algumas coisas por conta própria, mas ainda precisa de um contexto claro. Quando o contexto está espalhado, escondido ou inconsistente, a qualidade da resposta também cai.</p>
<h2>Código não é contexto suficiente</h2>
<p>Existe uma armadilha comum: presumir que, como a IA consegue ler código, ela já entende o sistema.</p>
<p>Mas o código é apenas parte da história.</p>
<p>O código mostra a implementação. Ele não necessariamente mostra:</p>
<ul>
<li><p>por que aquela decisão foi tomada;</p>
</li>
<li><p>qual problema de negócio ela resolve;</p>
</li>
<li><p>quais trade-offs foram aceitos;</p>
</li>
<li><p>quais partes são sensíveis;</p>
</li>
<li><p>o que já foi tentado e descartado;</p>
</li>
<li><p>como o sistema se comporta em produção.</p>
</li>
</ul>
<p>Na prática, um sistema maduro existe em mais lugares do que no repositório. Ele vive na documentação, na observabilidade, nos incidentes, nos tickets, nas decisões arquiteturais, nos dashboards e na memória coletiva da equipe. O desafio agora é transformar esse conhecimento em algo que uma IA possa navegar.</p>
<h2><strong>Uma arquitetura que os agentes conseguem entender</strong></h2>
<p>Se eu tivesse que resumir a ideia central deste artigo em uma frase, seria esta:</p>
<blockquote>
<p>Arquitetura amigável à IA é a disciplina de organizar sistemas para que agentes possam descobrir, correlacionar e aplicar contexto com o mínimo de atrito.</p>
</blockquote>
<p>Isso não significa expor tudo para a IA. Pelo contrário, significa tornar o contexto:</p>
<ul>
<li><p>mais acessível;</p>
</li>
<li><p>mais estruturado;</p>
</li>
<li><p>mais confiável;</p>
</li>
<li><p>mais conectado;</p>
</li>
<li><p>mais verificável.</p>
</li>
</ul>
<p>Em outras palavras, ter informação não é suficiente. A informação precisa ser fácil de encontrar e combinar.</p>
<h3>O que isso muda na prática</h3>
<p>Um sistema amigável à IA tende a ter algumas características:</p>
<ol>
<li><p><strong>Documentação viva</strong><br />A documentação não pode ser um cemitério de páginas desatualizadas. Ela precisa fazer parte do sistema e acompanhar as mudanças relevantes.</p>
</li>
<li><p><strong>Decisões registradas</strong><br />Arquitetura sem histórico vira suposição. ADRs, RFCs e notas de decisão ajudam o agente a entender o “porquê”, não apenas o “como”.</p>
</li>
<li><p><strong>Observabilidade como fonte de verdade</strong><br />Registros, rastreamentos e métricas não são usados apenas para operar o sistema. Eles também ajudam a explicar seu comportamento.</p>
</li>
<li><p><strong>Contexto organizado por domínio</strong><br />Nem todo conhecimento precisa viver no mesmo lugar. Cada contexto pode ter sua própria documentação, regras e pontos de referência.</p>
</li>
<li><p><strong>Ferramentas conectadas ao fluxo de trabalho</strong><br />O agente precisa ter acesso aos sistemas que realmente contam a história do software: ferramentas de observabilidade, listas de tarefas, repositórios, incidentes e implantações.</p>
</li>
</ol>
<h2>A forma antiga de organizar software</h2>
<p>Essa conversa me lembra muito a evolução dos microsserviços.</p>
<p>No passado, tentávamos colocar tudo em sistemas grandes e centralizados. Com o tempo, aprendemos que fazia mais sentido separar as coisas por domínio, responsabilidade e contexto. Não porque dividir seja elegante, mas porque sistemas menores, com limites claros, são mais fáceis de entender e evoluir.</p>
<p>Agora a pergunta é parecida:</p>
<blockquote>
<p>Se aprendemos a decompor sistemas por contexto, por que continuamos entregando contexto para a IA em blocos enormes?</p>
</blockquote>
<p>Talvez a próxima evolução seja esta: não apenas decompor serviços, mas também decompor o conhecimento que dá suporte aos agentes.</p>
<h2>O papel das habilidades</h2>
<p>É aqui que entra uma peça importante: habilidades.</p>
<p>Uma habilidade é uma forma de empacotar contexto especializado. Em vez de dar ao agente um oceano de informações genéricas, você fornece blocos claros e bem delimitados de conhecimento.</p>
<p>Pense em exemplos como:</p>
<ul>
<li><p>uma habilidade para Datadog;</p>
</li>
<li><p>uma habilidade para Argo;</p>
</li>
<li><p>uma habilidade para Databricks;</p>
</li>
<li><p>uma habilidade para New Relic;</p>
</li>
<li><p>uma habilidade para investigação de incidentes;</p>
</li>
<li><p>uma habilidade para análise de desempenho;</p>
</li>
<li><p>uma habilidade para mudanças em produção.</p>
</li>
</ul>
<p>A ideia não é fazer o agente saber tudo ao mesmo tempo. É permitir que ele ative o contexto certo no momento certo.</p>
<p>Isso reduz o ruído e aumenta a precisão. Em vez de tentar ler tudo, o agente trabalha com um contexto mais específico e focado no problema.</p>
<h2>Um exemplo simples</h2>
<p>Imagine que um incidente começou a afetar a latência de uma API. Sem uma arquitetura amigável à IA, o agente ainda pode tentar ajudar, mas dependerá muito da sorte:</p>
<ul>
<li><p>procurando registros nos lugares errados;</p>
</li>
<li><p>interpretando dashboards sem saber quais métricas importam;</p>
</li>
<li><p>perdendo tempo em caminhos irrelevantes;</p>
</li>
<li><p>sugerindo hipóteses genéricas.</p>
</li>
</ul>
<p>Com um contexto mais bem organizado, o fluxo muda:</p>
<ol>
<li><p>O agente identifica o serviço afetado.</p>
</li>
<li><p>Consulta a documentação do domínio.</p>
</li>
<li><p>Correlaciona os sinais de observabilidade.</p>
</li>
<li><p>Encontra as decisões arquiteturais relacionadas.</p>
</li>
<li><p>Concentra a investigação nas hipóteses mais prováveis.</p>
</li>
</ol>
<p>O benefício não é a IA fazer mágica. É o sistema estar preparado para que a IA trabalhe com menos atrito e mais precisão.</p>
<h2>O que vale a pena começar agora</h2>
<p>Se quiser começar de forma prática, eu sugeriria quatro áreas de foco:</p>
<ul>
<li><p>revisar a documentação mais importante do sistema;</p>
</li>
<li><p>registrar decisões arquiteturais de forma mais consistente;</p>
</li>
<li><p>melhorar a clareza operacional por meio da observabilidade;</p>
</li>
<li><p>separar contextos que hoje estão misturados demais.</p>
</li>
</ul>
<p>Você não precisa transformar tudo de uma vez. Na verdade, a melhor abordagem pode ser começar pelas áreas onde a equipe mais enfrenta dificuldades: incidentes, integração de novas pessoas e mudanças em áreas críticas.</p>
<h2>Conclusão</h2>
<p>Software pronto para ser entendido por uma IA não é software “construído para robôs”. É software com um contexto mais claro, acessível e útil para qualquer pessoa ou coisa que precise entender o sistema rapidamente.</p>
<p>No fundo, a ideia é simples: se a arquitetura ajuda as pessoas a tomar decisões melhores, ela também pode ajudar agentes a tomar decisões melhores.</p>
<p>E talvez esta seja a próxima grande evolução da arquitetura de software: não apenas sistemas que escalam, mas sistemas que podem ser rapidamente entendidos por humanos e agentes trabalhando juntos.</p>
<p>Este foi apenas o começo. No próximo artigo, discutirei por que o código não é contexto suficiente e como projetar uma Arquitetura de Contexto para agentes conectando código, documentação, decisões arquiteturais e conhecimento de negócio.</p>
