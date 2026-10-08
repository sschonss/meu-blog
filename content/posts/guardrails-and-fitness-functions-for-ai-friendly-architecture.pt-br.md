---
title: 'Guardrails e Fitness Functions para uma Arquitetura Amigável à IA'
date: 2026-08-31
source: https://luizschons.com/guardrails-and-fitness-functions-for-ai-friendly-architecture
series: ['Arquitetura Amigável à IA']
translationKey: 'guardrails-and-fitness-functions-for-ai-friendly-architecture'
draft: false
tags: ['IA', 'Arquitetura']
---

<p>Este é o quinto artigo da série sobre arquitetura amigável à IA. Já discutimos como os agentes encontram contexto, usam skills e trabalham com conhecimento especializado.</p>
<p>Agora precisamos responder a duas perguntas:</p>
<ul>
<li><p>o que o agente pode fazer?</p>
</li>
<li><p>como sabemos que a arquitetura continua respeitando esses limites?</p>
</li>
</ul>
<p>Dar contexto a um agente não significa dar a ele acesso ilimitado ao sistema.</p>
<h2>Instruções não são controles de segurança</h2>
<p>Um ponto de partida comum é adicionar uma regra ao prompt ou a uma skill:</p>

```text
Use the production API only for read operations.
Never change data.
Never access admin endpoints.
```

<p>Essa orientação pode ajudar a direcionar o comportamento do agente, mas não deve ser tratada como uma barreira de segurança.</p>
<p>O agente pode receber novos documentos, combinar informações de fontes diferentes e ler o código da aplicação. Um texto que diz ao agente para seguir uma regra também pode conter instruções conflitantes ou mostrar maneiras de contorná-la.</p>
<p>O mesmo vale para verificações feitas dentro de uma skill ou por meio de uma integração MCP. Se a mesma camada que executa a ação decide se ela é segura com base no contexto fornecido ao agente, esse contexto pode ser alterado ou interpretado de forma inesperada.</p>
<p>O MCP pode ajudar a conectar um agente a sistemas e ferramentas, mas a conexão em si não é um limite de segurança. A autorização deve existir no serviço que protege o recurso.</p>
<h2>Até o acesso de leitura pode criar um problema</h2>
<p>Imagine que queremos ajudar um agente a investigar um incidente. Para isso, damos a ele um token que permite requisições <code>GET</code> à API de produção.</p>
<p>À primeira vista, isso parece seguro. O agente não pode alterar pedidos, reiniciar serviços ou mudar configurações.</p>
<p>Mas, ao ler o código, a documentação e os contratos da aplicação, o agente pode descobrir outros endpoints disponíveis. Ele pode encontrar rotas administrativas, parâmetros internos, conexões entre recursos ou formas indiretas de obter dados que não deveriam fazer parte da investigação.</p>
<p>O problema não é apenas o método HTTP usado pela requisição. O problema é o conjunto de recursos que o agente consegue alcançar, os dados que recebe e as conexões que pode descobrir.</p>
<p>Por isso, não basta dizer:</p>

```text
GET is allowed.
POST, PUT, and DELETE are not allowed.
```

<p>Precisamos perguntar:</p>
<ul>
<li><p>qual serviço pode ser acessado;</p>
</li>
<li><p>quais rotas estão disponíveis;</p>
</li>
<li><p>quais campos podem ser retornados;</p>
</li>
<li><p>quais registros podem ser consultados;</p>
</li>
<li><p>quais conexões entre recursos podem ser descobertas;</p>
</li>
<li><p>por quanto tempo a credencial é válida;</p>
</li>
<li><p>como cada acesso será auditado.</p>
</li>
</ul>
<h2>Como fornecer contexto sem abrir a produção</h2>
<p>Existem formas mais seguras de fornecer informações para uma investigação.</p>
<h3>Um token com escopo limitado</h3>
<p>Em vez de dar ao agente uma credencial de API genérica, podemos criar uma credencial específica para ele:</p>

```text
principal: incident-investigation-agent
resource: orders-observability-api
operations:
  - read:incident-summary
  - read:service-health
  - read:dependency-latency
data_policy:
  - exclude:customer.personal_data
  - exclude:payment.card_data
expiration: 15 minutes
```

<p>O serviço que recebe essa credencial deve validar seu escopo. Uma descrição no prompt não substitui essa validação.</p>
<h3>Dados derivados para investigação</h3>
<p>Também podemos manter o agente longe da aplicação de produção. Eventos, métricas, logs sanitizados e informações operacionais podem ser enviados para um local separado de consultas, como uma réplica, um data lake ou um data warehouse.</p>
<img width="1448" height="1086" loading="lazy" decoding="async" src="/images/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/7cd5dbfe-0c2e-40c9-88bb-2d7f12fd3cfc.webp" alt="Context Without Opening Production" style="display:block;margin:0 auto" />

<p>Essa camada pode aplicar retenção, anonimização, filtragem de campos e um atraso antes que os dados fiquem disponíveis. O agente recebe contexto suficiente para investigar sem ganhar uma porta de entrada para a aplicação de produção.</p>
<h3>O banco de dados com o menor privilégio possível</h3>
<p>Quando o acesso direto ao banco for realmente necessário, ele deve ser criado para a tarefa. Não deve reutilizar uma credencial da aplicação:</p>

```sql
CREATE ROLE incident_reader LOGIN PASSWORD 'managed-externally';

GRANT CONNECT ON DATABASE operations TO incident_reader;
GRANT USAGE ON SCHEMA incident_data TO incident_reader;
GRANT SELECT ON incident_data.service_health TO incident_reader;
GRANT SELECT ON incident_data.request_summary TO incident_reader;

REVOKE ALL ON SCHEMA billing FROM incident_reader;
REVOKE ALL ON SCHEMA customers FROM incident_reader;
```

<p>Além de ser somente leitura, esse usuário deve ter acesso apenas às tabelas, views ou schemas necessários para a tarefa. Views de investigação podem ocultar dados sensíveis e limitar a quantidade de informações retornadas.</p>
<p>A ideia é simples: não devemos confiar que o agente evitará tabelas perigosas. O banco deve bloquear o acesso mesmo que o agente tente consultar algo fora do seu escopo.</p>
<h2>Guardrails</h2>
<p>Guardrails são mecanismos externos às intenções do agente que validam, limitam ou bloqueiam ações. Eles podem existir na identidade, na rede, na API, no banco de dados, no sistema de arquivos ou no processo de aprovação.</p>
<p>Um guardrail realista não é uma instrução <code>if</code> dentro de um prompt. É uma política aplicada pelo serviço que recebe a requisição.</p>
<p>A política pode verificar identidade, recurso, operação, parâmetros, campos solicitados, quantidade de dados e ambiente. Se qualquer condição não for atendida, a requisição é rejeitada antes de chegar ao recurso protegido.</p>
<p>Para mudanças, podemos separar preparação de execução.</p>
<p>O agente não recebe a credencial de execução. Mesmo que crie uma instrução errada, a camada de execução ainda aplica suas próprias regras.</p>
<h3>Exemplo: um incidente de CPU</h3>
<p>Durante um incidente, a investigação pode mostrar que os pods estão ficando sem CPU. O agente pode conectar os sinais, formular uma hipótese e preparar uma mudança no repositório de infraestrutura.</p>
<p>Ele também pode abrir o pull request e criar a solicitação de mudança. Mas a mudança ainda depende de uma pessoa responsável. Essa pessoa revisa o impacto, aprova a solicitação e faz ou aprova o merge. Depois disso, o pipeline aplica a mudança aos pods.</p>
<img width="1600" height="900" loading="lazy" decoding="async" src="/images/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/9ea1e52a-ecc7-4554-8526-5d36780a0363.webp" alt="From Incident to Controlled Change" style="display:block;margin:0 auto" />

<p>Guardrails também podem limitar caminhos de arquivos, destinos de rede, tamanho de consultas, tempo de execução, quantidade de registros e tipos de dados retornados.</p>
<h2>Fitness functions determinísticas</h2>
<p>Fitness functions vêm da arquitetura evolutiva. Elas transformam uma característica arquitetural importante em uma verificação objetiva e contínua.</p>
<p>Uma fitness function não precisa de IA para decidir o resultado. Ela pode ser um teste de arquitetura, uma regra do pipeline, uma análise estática, uma consulta a metadados ou uma verificação periódica. Com o mesmo estado de entrada, o resultado deve ser reproduzível.</p>
<p>O objetivo não é avaliar se a resposta do agente parece boa. O objetivo é verificar se a arquitetura ainda possui as propriedades que consideramos importantes.</p>
<h3>Exemplo com Deptrac</h3>
<p>Um exemplo real é o <a href="https://github.com/deptrac/deptrac">Deptrac</a>, uma ferramenta de análise estática para projetos PHP. Ela permite definir camadas arquiteturais e as dependências permitidas entre elas.</p>
<p>Imagine um sistema com dois contextos: <code>Orders</code> e <code>Billing</code>. Uma decisão arquitetural pode determinar que <code>Orders</code> não deve importar diretamente classes internas de <code>Billing</code>. A comunicação deve acontecer por meio de um contrato público.</p>
<p>Essa regra pode ser descrita em uma configuração do Deptrac:</p>

```yaml
deptrac:
  paths:
    - ./src

  layers:
    - name: Orders
      collectors:
        - type: classLike
          value: .*\\Orders\\.*

    - name: Billing
      collectors:
        - type: classLike
          value: .*\\Billing\\.*

    - name: Shared
      collectors:
        - type: classLike
          value: .*\\Shared\\.*

  ruleset:
    Orders:
      - Shared
    Billing:
      - Shared
```

<p>Com essa regra, uma classe em <code>Orders</code> que importe diretamente uma classe de <code>Billing</code> cria uma violação. O pipeline pode executar:</p>

```bash
vendor/bin/deptrac analyse --config-file=deptrac.yaml
```

<p>O resultado é determinístico. O Deptrac não precisa entender a intenção do agente, avaliar a qualidade do código gerado ou interpretar um prompt. Ele apenas verifica as dependências no código em relação às regras definidas pela equipe.</p>
<p>Se um agente criar uma nova classe e adicionar uma dependência proibida, o pull request falhará mesmo que o agente tenha sido instruído a respeitar os limites. A fitness function protege a decisão arquitetural à medida que o sistema muda.</p>
<h2>Conclusão</h2>
<p>Uma arquitetura amigável à IA não é apenas uma arquitetura que permite ao agente fazer mais. É uma arquitetura que fornece contexto sem transformar cada fonte de informação em uma nova superfície de ataque.</p>
<p>Prompts, skills e integrações ajudam a orientar o agente, mas não devem ser a última linha de defesa. As permissões precisam ser aplicadas pelos recursos protegidos, com identidade, menor privilégio, escopo, auditoria e possibilidade de revogar o acesso.</p>
<p>Guardrails limitam ações em tempo de execução. Fitness functions determinísticas verificam se essas proteções continuam presentes à medida que a arquitetura muda.</p>
<p>Para saber mais sobre fitness functions, leia <a href="https://tss-yonder.com/insights/architectural-fitness-functions">Architectural Fitness Functions, da Yonder</a> e <a href="https://www.thoughtworks.com/en-us/insights/articles/fitness-function-driven-development">Fitness Function Driven Development, da Thoughtworks</a>.</p>
<p>No próximo artigo, mostraremos como dividir um grande bloco de conhecimento em contextos especializados, organizados por domínio, responsabilidade e objetivo.</p>
