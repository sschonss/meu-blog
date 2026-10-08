---
title: 'Código não é contexto: projetando uma arquitetura de contexto para agentes'
date: 2026-08-21
source: https://luizschons.com/code-is-not-context-designing-a-context-architecture-for-agents
series: ['Arquitetura Amigável à IA']
translationKey: 'code-is-not-context-designing-a-context-architecture-for-agents'
draft: false
tags: ['IA', 'Arquitetura']
---

<p>Este é o segundo artigo de uma série sobre arquitetura amigável à IA. No primeiro artigo, expliquei como a IA se parece com uma pessoa nova entrando em uma empresa e tentando entender um sistema pela primeira vez.</p>
<p>Agora quero explorar uma parte importante dessa comparação: onde essa pessoa encontra as informações de que precisa?</p>
<h2>Código é apenas parte da história</h2>
<p>Quando alguém novo entra em um time, normalmente começa pelo repositório. É lá que estão os serviços, endpoints, modelos, testes e regras de negócio.</p>
<p>Mas raramente o código responde a tudo.</p>
<p>Ele pode mostrar que uma decisão existe, mas não explicar por que foi tomada. Pode mostrar que dois serviços se comunicam, mas não deixar claro qual serviço é responsável por aquela função. Pode mostrar uma regra de negócio, mas não explicar quando ela se aplica ou o que acontece quando muda.</p>
<p>Para entender um sistema de verdade, é preciso combinar várias fontes:</p>
<ul>
<li><p>código;</p>
</li>
<li><p>documentação;</p>
</li>
<li><p>decisões arquiteturais;</p>
</li>
<li><p>tickets e épicos;</p>
</li>
<li><p>incidentes anteriores;</p>
</li>
<li><p>dashboards e métricas;</p>
</li>
<li><p>conversas com os membros do time.</p>
</li>
</ul>
<p>O mesmo vale para agentes de IA.</p>
<p>O problema é que, em muitas empresas, essas informações existem, mas não estão conectadas. O código está em um repositório. As decisões estão em uma ferramenta de documentação. Os tickets estão em outro sistema. Os incidentes estão em uma plataforma de operações. E o contexto mais importante ainda está na cabeça de poucas pessoas.</p>
<p>Ter informação não é o mesmo que ter contexto.</p>
<h2>O que é uma arquitetura de contexto?</h2>
<p>Gosto de pensar em Arquitetura de Contexto como uma forma de organizar e conectar as diferentes fontes de conhecimento que explicam um sistema.</p>
<p>Não se trata de criar um documento enorme com tudo o que a empresa sabe. Também não se trata de copiar toda a documentação para um banco vetorial e esperar a resposta aparecer.</p>
<p>Trata-se de criar caminhos que ajudem uma pessoa ou um agente a responder perguntas como:</p>
<ul>
<li><p>Por qual responsabilidade este serviço responde?</p>
</li>
<li><p>De quais outros sistemas ele depende?</p>
</li>
<li><p>Por que ele foi construído dessa forma?</p>
</li>
<li><p>Qual regra de negócio está sendo usada aqui?</p>
</li>
<li><p>Como sabemos que ele está funcionando corretamente?</p>
</li>
<li><p>O que aconteceu na última vez que esta parte mudou?</p>
</li>
</ul>
<p>Uma arquitetura de contexto bem projetada não elimina a necessidade de raciocínio. Ela reduz o esforço necessário para encontrar a informação certa.</p>
<h2>O contexto não precisa estar em um só lugar</h2>
<p>Podemos querer colocar tudo em um só lugar. Poderíamos criar uma página grande chamada “Como a empresa funciona” e esperar que todos encontrem ali o que precisam.</p>
<p>Na prática, esse documento fica desatualizado muito rapidamente. Torna-se difícil saber o que ainda é válido, quem deve atualizá-lo e qual parte se aplica a cada situação.</p>
<p>Talvez seja melhor pensar no contexto como uma rede:</p>
<img width="1600" height="900" loading="lazy" decoding="async" src="/images/posts/code-is-not-context-designing-a-context-architecture-for-agents/9fb6215a-d1db-49a0-bd1b-59c5db990aab.webp" alt="Context Architecture" style="display:block;margin:0 auto" />

<p>Cada fonte pode permanecer onde funciona melhor. O que muda é que existem links claros entre elas.</p>
<p>Uma tarefa deve apontar para o domínio afetado. O domínio deve apontar para os serviços envolvidos. O serviço deve ter sua documentação operacional. Decisões importantes devem ser registradas. Os sinais de produção também devem ser fáceis de encontrar.</p>
<p>O objetivo não é centralizar o conhecimento. É torná-lo fácil de encontrar.</p>
<h2>Exemplo de estrutura</h2>
<p>Imagine um domínio de pagamentos. O código pode estar em um repositório, enquanto a documentação, os ADRs e os runbooks permanecem nas ferramentas que o time já usa:</p>
<img width="1600" height="900" loading="lazy" decoding="async" src="/images/posts/code-is-not-context-designing-a-context-architecture-for-agents/2b3eab9e-984a-4bb7-94c2-3ade8f135b7f.webp" alt="Distributed context: payments" style="display:block;margin:0 auto" />

<p>O <code>README.md</code> do repositório pode explicar a responsabilidade do serviço e apontar para o <code>Architecture Hub</code>. A página <code>context.md</code> pode descrever conceitos de negócio e limites de domínio. ADRs podem ficar em uma ferramenta de arquitetura, runbooks em uma plataforma de documentação e dashboards na ferramenta de observabilidade.</p>
<p>O arquivo <code>links.md</code> não precisa copiar o conteúdo dessas fontes. Ele pode funcionar como um índice confiável, com links para onde cada informação está armazenada.</p>
<p>Um agente que recebe uma tarefa de pagamentos não precisa ler imediatamente todos os arquivos do repositório. Pode começar pelo mapa do domínio, seguir os links relacionados à tarefa e consultar cada fonte no momento certo.</p>
<p>A parte mais importante dessa estrutura não é colocar tudo na mesma pasta. É deixar claro onde cada tipo de conhecimento vive e como chegar até ele.</p>
<h2>O contexto precisa de um responsável</h2>
<p>Documentação sem responsável geralmente acaba abandonada.</p>
<p>Se ninguém souber quem deve atualizar uma página, ela ficará desatualizada. Se uma decisão arquitetural não disser quem a tomou e por quê, mais tarde ela poderá parecer uma regra sem motivo.</p>
<p>Por isso, uma Arquitetura de Contexto também precisa responder:</p>
<ul>
<li><p>Quem é responsável por este contexto?</p>
</li>
<li><p>Quando ele foi atualizado pela última vez?</p>
</li>
<li><p>Qual sistema é a fonte original desta informação?</p>
</li>
<li><p>Como sabemos que ela ainda é válida?</p>
</li>
</ul>
<p>Pessoas e agentes de IA precisam disso. Um agente pode encontrar uma página útil, mas ainda precisa verificar se a informação está atualizada, pertence ao sistema correto e é útil para tomar uma decisão.</p>
<p>Contexto sem um sinal claro de validade pode ser tão perigoso quanto não ter contexto algum.</p>
<h2>O papel das decisões arquiteturais</h2>
<p>Uma das fontes mais valiosas de informação sobre um sistema é o histórico de suas decisões.</p>
<p>O código atual mostra o resultado de muitas escolhas. Um ADR ajuda a explicar essas escolhas.</p>
<p>Ele pode registrar:</p>
<ul>
<li><p>o problema que precisava ser resolvido;</p>
</li>
<li><p>as opções que foram consideradas;</p>
</li>
<li><p>os critérios usados para tomar a decisão;</p>
</li>
<li><p>os trade-offs que foram aceitos;</p>
</li>
<li><p>os resultados esperados.</p>
</li>
</ul>
<p>Sem esse histórico, alguém pode olhar para uma implementação e pensar que ela poderia ser muito mais simples. Talvez pudesse. Mas pode ter existido uma restrição que já não está visível no código.</p>
<p>Para um agente, essa diferença é muito importante. Sem o contexto por trás de uma decisão, ele pode sugerir uma mudança tecnicamente elegante que não atende a uma necessidade real de negócio ou a um limite operacional conhecido.</p>
<h2>O contexto deve acompanhar o fluxo de trabalho</h2>
<p>Outro ponto importante é que o contexto não deve ser tratado como uma atividade separada do desenvolvimento.</p>
<p>Se a documentação for atualizada apenas durante uma grande revisão anual, ela ficará para trás. Se os ADRs forem escritos apenas quando alguém se lembrar de escrevê-los, muitas decisões importantes desaparecerão. Se os incidentes não deixarem aprendizados registrados, o time investigará os mesmos problemas repetidamente.</p>
<p>O contexto precisa fazer parte do fluxo de trabalho normal:</p>
<ol>
<li><p>Uma mudança começa com uma tarefa ou um épico.</p>
</li>
<li><p>O time identifica os domínios e serviços afetados.</p>
</li>
<li><p>As decisões importantes são registradas.</p>
</li>
<li><p>A documentação é atualizada junto com o código.</p>
</li>
<li><p>A observabilidade mostra o que acontece depois da implantação.</p>
</li>
<li><p>Incidentes e aprendizados são adicionados à base de conhecimento.</p>
</li>
</ol>
<p>Isso não precisa ser um processo pesado. O importante é criar e manter esses links próximos do momento em que o conhecimento é criado.</p>
<h2>O que uma pessoa nova deve conseguir fazer?</h2>
<p>Uma boa forma de testar essa arquitetura é escolher uma tarefa real e imaginar uma pessoa nova tentando concluí-la.</p>
<p>Essa pessoa conseguiria descobrir:</p>
<ul>
<li><p>qual parte do sistema precisa mudar;</p>
</li>
<li><p>quem é responsável pelo domínio;</p>
</li>
<li><p>quais decisões limitam a solução;</p>
</li>
<li><p>como verificar se a mudança funcionou;</p>
</li>
<li><p>onde investigar se algo der errado?</p>
</li>
</ul>
<p>Se a resposta para todas essas perguntas for “você precisa falar com alguém”, existe uma oportunidade de melhorar o contexto do sistema.</p>
<p>O mesmo teste pode ser usado com um agente de IA. A diferença é que um agente deixará ainda mais claro quando informações importantes dependem de conhecimento informal.</p>
<p>Uma forma simples de medir isso é escolher uma tarefa pequena e observar as etapas necessárias para resolvê-la. Se alguém precisa abrir vários sistemas não relacionados ou perguntar a outra pessoa antes de cada decisão, o problema não é apenas documentação. É um problema de arquitetura de contexto.</p>
<h2>Arquitetura de contexto não é burocracia</h2>
<p>É possível transformar este tema em mais um conjunto de processos obrigatórios. Não acho que esse seja o objetivo.</p>
<p>O objetivo não é escrever documentação apenas por escrever. É reduzir o tempo que as pessoas gastam procurando respostas e diminuir a dependência das pessoas que estavam presentes quando uma decisão foi tomada.</p>
<p>Uma arquitetura de contexto bem mantida ajuda no onboarding, na investigação de incidentes, no planejamento de funcionalidades e na manutenção do sistema. Os agentes de IA apenas tornam essa necessidade mais fácil de enxergar.</p>
<p>No fim, esta é uma prática antiga diante de um novo desafio: tornar o conhecimento do sistema mais explícito para que ele não permaneça apenas na memória de poucas pessoas.</p>
<h2>Conclusão</h2>
<p>O código explica como o sistema funciona em um determinado momento. O contexto ajuda a explicar por que ele funciona dessa forma, quais limites existem e como ele se conecta ao restante da organização.</p>
<p>Uma Arquitetura de Contexto não precisa colocar tudo em um único lugar. Ela precisa conectar as fontes corretas, deixar claro quem é responsável por cada contexto e tornar as informações fáceis de encontrar.</p>
<p>Quando fazemos isso, o sistema fica mais fácil de entender para quem está entrando no time, para quem está investigando um problema e para os agentes que trabalham conosco.</p>
<p>No próximo artigo, vou falar sobre observabilidade como fonte de contexto. Logs, métricas e traces não servem apenas para encontrar erros. Eles também ajudam a explicar como o sistema realmente se comporta.</p>
