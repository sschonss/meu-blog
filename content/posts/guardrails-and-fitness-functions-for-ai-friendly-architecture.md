---
title: 'Guardrails and Fitness Functions for AI-Friendly Architecture'
date: 2026-08-31
source: https://luizschons.com/guardrails-and-fitness-functions-for-ai-friendly-architecture
series: ['AI-Friendly Architecture']
draft: false
translationKey: 'guardrails-and-fitness-functions-for-ai-friendly-architecture'
---

<p>This is the fifth article in the series about AI-friendly architecture. We have already discussed how agents find context, use skills, and work with specialized knowledge.</p>
<p>Now we need to answer two questions:</p>
<ul>
<li><p>what can the agent do?</p>
</li>
<li><p>how do we know that the architecture still respects these limits?</p>
</li>
</ul>
<p>Giving context to an agent does not mean giving it unlimited access to the system.</p>
<h2>Instructions Are Not Security Controls</h2>
<p>A common starting point is to add a rule to the prompt or to a skill:</p>
<pre><code class="language-text">Use the production API only for read operations.
Never change data.
Never access admin endpoints.
</code></pre>
<p>This guidance can help direct the agent's behavior, but it should not be treated as a security barrier.</p>
<p>The agent may receive new documents, combine information from different sources, and read the application code. A text that tells the agent to follow a rule may also contain conflicting instructions or show ways to bypass that rule.</p>
<p>The same is true for checks made inside a skill or through an MCP integration. If the same layer that performs the action decides whether it is safe based on context given to the agent, that context may be changed or understood in an unexpected way.</p>
<p>MCP can help connect an agent to systems and tools, but the connection itself is not a security limit. Authorization must exist in the service that protects the resource.</p>
<h2>Even Read Access Can Create a Problem</h2>
<p>Imagine that we want to help an agent investigate an incident. To do this, we give it a token that allows <code>GET</code> requests to the production API.</p>
<p>At first, this looks safe. The agent cannot change orders, restart services, or change settings.</p>
<p>But by reading the code, documentation, and application contracts, the agent may discover other available endpoints. It may find admin routes, internal parameters, connections between resources, or indirect ways to get data that should not be part of the investigation.</p>
<p>The problem is not only the HTTP method used by the request. The problem is the set of resources the agent can reach, the data it receives, and the connections it can discover.</p>
<p>That is why it is not enough to say:</p>
<pre><code class="language-text">GET is allowed.
POST, PUT, and DELETE are not allowed.
</code></pre>
<p>We need to ask:</p>
<ul>
<li><p>which service can be accessed;</p>
</li>
<li><p>which routes are available;</p>
</li>
<li><p>which fields can be returned;</p>
</li>
<li><p>which records can be queried;</p>
</li>
<li><p>which connections between resources can be discovered;</p>
</li>
<li><p>how long the credential is valid;</p>
</li>
<li><p>how each access will be audited.</p>
</li>
</ul>
<h2>How to Provide Context Without Opening Production</h2>
<p>There are safer ways to provide information for an investigation.</p>
<h3>A Limited-Scope Token</h3>
<p>Instead of giving the agent a general API credential, we can create a credential made for the agent:</p>
<pre><code class="language-text">principal: incident-investigation-agent
resource: orders-observability-api
operations:
  - read:incident-summary
  - read:service-health
  - read:dependency-latency
data_policy:
  - exclude:customer.personal_data
  - exclude:payment.card_data
expiration: 15 minutes
</code></pre>
<p>The service that receives this credential must validate its scope. A description in the prompt does not replace this validation.</p>
<h3>Derived Data for Investigation</h3>
<p>We can also keep the agent away from the production application. Events, metrics, sanitized logs, and operational information can be sent to a separate place for queries, such as a replica, a data lake, or a data warehouse.</p>
<img src="/images/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/7cd5dbfe-0c2e-40c9-88bb-2d7f12fd3cfc.png" alt="Context Without Opening Production" style="display:block;margin:0 auto" />

<p>This layer can apply retention, anonymization, field filtering, and a delay before data is available. The agent receives enough context to investigate without getting a way into the production application.</p>
<h3>The Least Privilege Database Possible</h3>
<p>When direct database access is really needed, it should be created for the task. It should not reuse an application credential:</p>
<pre><code class="language-sql">CREATE ROLE incident_reader LOGIN PASSWORD 'managed-externally';

GRANT CONNECT ON DATABASE operations TO incident_reader;
GRANT USAGE ON SCHEMA incident_data TO incident_reader;
GRANT SELECT ON incident_data.service_health TO incident_reader;
GRANT SELECT ON incident_data.request_summary TO incident_reader;

REVOKE ALL ON SCHEMA billing FROM incident_reader;
REVOKE ALL ON SCHEMA customers FROM incident_reader;
</code></pre>
<p>Besides being read-only, this user should have access only to the tables, views, or schemas needed for the task. Investigation views can hide sensitive data and limit the amount of information returned.</p>
<p>The idea is simple: we should not trust the agent to avoid dangerous tables. The database must block access even if the agent tries to query something outside its scope.</p>
<h2>Guardrails</h2>
<p>Guardrails are mechanisms outside the agent's intentions that validate, limit, or block actions. They can exist in identity, the network, the API, the database, the file system, or the approval process.</p>
<p>A realistic guardrail is not an <code>if</code> statement inside a prompt. It is a policy applied by the service that receives the request.</p>
<p>The policy can check the identity, resource, operation, parameters, requested fields, amount of data, and environment. If any condition is not met, the request is rejected before it reaches the protected resource.</p>
<p>For changes, we can separate preparation from execution.</p>
<p>The agent does not receive the execution credential. Even if it creates a wrong instruction, the execution layer still applies its own rules.</p>
<h3>Example: A CPU Incident</h3>
<p>During an incident, the investigation may show that the pods are running out of CPU. The agent can connect the signals, form a hypothesis, and prepare a change in the infrastructure repository.</p>
<p>It can also open the pull request and create the change request. But the change still depends on a responsible person. That person reviews the impact, approves the change request, and merges or approves the merge. After that, the pipeline applies the change to the pods.</p>
<img src="/images/posts/guardrails-and-fitness-functions-for-ai-friendly-architecture/9ea1e52a-ecc7-4554-8526-5d36780a0363.png" alt="From Incident to Controlled Change" style="display:block;margin:0 auto" />

<p>Guardrails can also limit file paths, network destinations, query size, execution time, number of records, and types of returned data.</p>
<h2>Deterministic Fitness Functions</h2>
<p>Fitness functions come from evolutionary architecture. They turn an important architectural characteristic into an objective and continuous check.</p>
<p>A fitness function does not need AI to decide the result. It can be an architecture test, a pipeline rule, a static analysis, a metadata query, or a periodic check. With the same input state, the result should be reproducible.</p>
<p>The goal is not to judge whether the agent's answer looks good. The goal is to check whether the architecture still has the properties we consider important.</p>
<h3>Example with Deptrac</h3>
<p>One real example is <a href="https://github.com/deptrac/deptrac">Deptrac</a>, a static analysis tool for PHP projects. It lets us define architectural layers and the dependencies allowed between them.</p>
<p>Imagine a system with two contexts: <code>Orders</code> and <code>Billing</code>. An architectural decision may say that <code>Orders</code> must not directly import internal classes from <code>Billing</code>. Communication must happen through a public contract.</p>
<p>This rule can be described in a Deptrac configuration:</p>
<pre><code class="language-yaml">deptrac:
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
</code></pre>
<p>With this rule, a class in <code>Orders</code> that directly imports a class from <code>Billing</code> creates a violation. The pipeline can run:</p>
<pre><code class="language-bash">vendor/bin/deptrac analyse --config-file=deptrac.yaml
</code></pre>
<p>The result is deterministic. Deptrac does not need to understand the agent's intention, judge the quality of the generated code, or interpret a prompt. It only checks the dependencies in the code against the rules defined by the team.</p>
<p>If an agent creates a new class and adds a forbidden dependency, the pull request fails even if the agent was told to respect the limits. The fitness function protects the architectural decision as the system changes.</p>
<h2>Conclusion</h2>
<p>An AI-friendly architecture is not only an architecture that lets the agent do more. It is an architecture that provides context without turning every source of information into a new attack surface.</p>
<p>Prompts, skills, and integrations help guide the agent, but they should not be the last line of defense. Permissions must be enforced by the protected resources, with identity, least privilege, scope, auditing, and the ability to revoke access.</p>
<p>Guardrails limit actions at runtime. Deterministic fitness functions check that these protections remain in place as the architecture changes.</p>
<p>To learn more about fitness functions, read <a href="https://tss-yonder.com/insights/architectural-fitness-functions">Architectural Fitness Functions by Yonder</a> and <a href="https://www.thoughtworks.com/en-us/insights/articles/fitness-function-driven-development">Fitness Function Driven Development by Thoughtworks</a>.</p>
<p>In the next article, we will show how to divide a large block of knowledge into specialized contexts, organized by domain, responsibility, and purpose.</p>
