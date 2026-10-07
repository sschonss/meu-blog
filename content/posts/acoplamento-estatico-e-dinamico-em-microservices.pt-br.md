---
title: 'Acoplamento estático e dinâmico em Microservices'
date: 2024-10-11
source: https://luizschons.com/acoplamento-estatico-e-dinamico-em-microservices
translationKey: acoplamento-estatico-e-dinamico-em-microservices
draft: false
aliases: ["/acoplamento-estatico-e-dinamico-em-microservices/"]
---

<p>Aplicações monolíticas são aquelas que possuem um único código fonte, um único executável e um único processo. Muitas vezes, essas aplicações são construídas em uma única linguagem de programação e são implantadas em um único servidor.</p>
<p>Quando começamos a desenvolver, monolitos são a nossa primeira experiência na maioria das vezes. Eles são fáceis de desenvolver, testar e implantar. No entanto, à medida que a aplicação cresce, o monolito começa a se tornar um problema.</p>
<p>A escalabilidade de um software é a uma das coisas mais importantes a serem consideradas hoje. Saber lidar de forma dinâmica com o crescimento de usuários e dados é essencial para o sucesso de um software.</p>
<p>Sistemas monolíticos são difíceis de escalar. Eles são construídos como um único bloco de código, o que significa que, para escalar a aplicação, você precisa replicar todo o código ou escalar verticalmente o servidor. Isso pode ser caro e ineficiente.</p>
<blockquote>
<p><strong>Escalabilidade vertical</strong> é a capacidade de aumentar a capacidade de um servidor, adicionando mais recursos, como CPU, RAM e disco. Isso é feito para melhorar o desempenho de um servidor.</p>
<p><strong>Escalabilidade horizontal</strong> é a capacidade de aumentar a capacidade de um sistema, adicionando mais instâncias do sistema. Isso é feito para melhorar a disponibilidade e a confiabilidade de um sistema.</p>
</blockquote>
<p>Microservices é uma arquitetura de software que resolve esse problema (mas cria outros). Em vez de construir uma única aplicação monolítica, você constrói várias aplicações pequenas e independentes, chamadas de micro-serviços. Cada microservice é responsável por uma parte específica da aplicação e se comunica com outras aplicações.</p>
<p>Embora, em teoria, os micro-serviços pareçam oferecer uma solução ideal para problemas de escalabilidade, eles apresentam desafios próprios na prática. Um dos principais desafios é o gerenciamento do acoplamento entre eles.</p>
<p>No mundo ideal, microservices devem ser independentes e desacoplados. Isso significa que uma aplicação deve ser capaz de funcionar sem depender de outra. No entanto, principalmente em migrações de sistemas monolíticos para microservices, é comum que dependam uns dos outros e chamamos isso de acoplamento.</p>
<p>Existem dois tipos de acoplamento em microservices: acoplamento estático e acoplamento dinâmico, e é sobre eles que vamos falar hoje.</p>
<hr />
<h2><strong>Exemplo de arquitetura de microservices</strong></h2>
<img src="/images/posts/acoplamento-estatico-e-dinamico-em-microservices/bb9c5c1b-8245-4a17-9691-a5a166d7539f.png" alt="" style="display:block;margin:0 auto" />

<h3><strong>Componentes:</strong></h3>
<ol>
<li><p><strong>API Gateway</strong>:</p>
<ul>
<li><p>Atua como o ponto de entrada para todas as solicitações externas ao sistema.</p>
</li>
<li><p>Recebe requisições HTTP dos clientes e as encaminha para os serviços internos apropriados (como ProductCatalogService, OrderService, e UserService).</p>
</li>
<li><p>Manter o controle de acesso, autenticação, roteamento de requisições, e agregação de respostas.</p>
</li>
</ul>
</li>
<li><p><strong>ProductCatalogService</strong>:</p>
<ul>
<li><p>Gerencia informações sobre produtos à venda, como descrições, preços e disponibilidade.</p>
</li>
<li><p>Pode consultar um serviço de descoberta como o Consul para localizar outros serviços necessários.</p>
</li>
</ul>
</li>
<li><p><strong>OrderService</strong>:</p>
<ul>
<li><p>Gera pedidos de compra.</p>
</li>
<li><p>Interage com outros serviços para obter informações do produto (via ProductCatalogService) e detalhes do usuário (via UserService).</p>
</li>
<li><p>Manipula pedidos no banco de dados MongoDB e publica eventos de pedidos para o RabbitMQ, permitindo comunicação assíncrona com outros serviços.</p>
</li>
</ul>
</li>
<li><p><strong>UserService</strong>:</p>
<ul>
<li><p>Administra informações de usuários, como perfis, preferências e histórico de compras.</p>
</li>
<li><p>Permite que outros serviços venham a consultar informações do usuário de forma segura.</p>
</li>
</ul>
</li>
<li><p><strong>PaymentService</strong>:</p>
<ul>
<li><p>Responsável pelo processamento de transações de pagamento.</p>
</li>
<li><p>Interage com o banco de dados MongoDB para armazenar informações sobre transações financeiras.</p>
</li>
<li><p>Publica eventos de transação no RabbitMQ para permitir que outros serviços (como o NotificationService) sejam notificados sobre ocorrências financeiras.</p>
</li>
</ul>
</li>
<li><p><strong>RabbitMQ</strong>:</p>
<ul>
<li><p>Permite a mensageria assíncrona entre serviços, facilitando a comunicação desacoplada.</p>
</li>
<li><p>Transmite eventos de pedidos e transações para partes interessadas.</p>
</li>
</ul>
</li>
<li><p><strong>NotificationService</strong>:</p>
<ul>
<li>Envia notificações para os usuários com base em eventos recebidos através do RabbitMQ, como atualizações de status de pedidos ou mensagens de confirmação de pagamento.</li>
</ul>
</li>
<li><p><strong>MongoDB</strong>:</p>
<ul>
<li><p>Armazena dados críticos para o sistema, como informações de pedidos, usuários e transações.</p>
</li>
<li><p>Um banco de dados NoSQL, como o MongoDB, é bem adequado para sistemas que exigem flexibilidade de esquema e manuseio eficiente de dados não estruturados.</p>
</li>
</ul>
</li>
<li><p><strong>Consul</strong>:</p>
<ul>
<li><p>Serviço utilizado para descoberta, configuração e gerenciamento de serviços.</p>
</li>
<li><p>Permite que microservices descubram dinamicamente a localização de outros serviços, facilitando uma arquitetura altamente flexível e resiliente.</p>
</li>
</ul>
</li>
<li><p><strong>Nginx</strong>:</p>
<ul>
<li>Pode representar um servidor web reverso ou balançador de carga que distribui requisições entre várias instâncias do API Gateway, melhorando a capacidade e a disponibilidade.</li>
</ul>
</li>
</ol>
<hr />
<h2><strong>Acoplamento estático</strong></h2>
<p>Os componentes em verde representam acoplamento estático.</p>
<p>O acoplamento estático ocorre quando um microservice depende de outro microservice em tempo de compilação ou configuração inicial do sistema.</p>
<p>Na maioria das vezes, acoplamentos estáticos são fáceis de identificar. Os mais comuns são:</p>
<ol>
<li><p><strong>Dependência de código</strong>: um microservice chama diretamente outro através de uma chamada de função ou API.</p>
</li>
<li><p><strong>Dependência de banco de dados</strong>: um microservice acessa diretamente o banco de dados de outra aplicação.</p>
</li>
<li><p><strong>Dependência de configuração</strong>: um micro-serviço depende de configurações específicas de outro microservice.</p>
</li>
</ol>
<p>Outra forma de acoplamento estático é quando um microservice depende de um contrato específico de outro. Por exemplo, um microservice espera que outro serviço retorne um objeto JSON específico. Se o contrato mudar, o microservice que depende dele pode quebrar, então é preciso atualizar a aplicação que depende do contrato.</p>
<hr />
<h2><strong>Acoplamento dinâmico</strong></h2>
<p>Os componentes em azul representam acoplamento dinâmico.</p>
<p>O acoplamento dinâmico ocorre quando um microservice depende de outro em tempo de execução.</p>
<p>Na maioria das vezes, acoplamentos dinâmicos são mais difíceis de identificar. Os mais comuns são:</p>
<ol>
<li><p><strong>Dependência de mensageria</strong>: um microservice envia uma mensagem para um barramento de mensagens e espera que outro serviço responda.</p>
</li>
<li><p><strong>Dependência de descoberta de serviço</strong>: um microservice consulta um serviço de descoberta para localizar outro.</p>
</li>
</ol>
<p>O interessante do acoplamento dinâmico é que ele permite que microservices sejam mais independentes e desacoplados. Se um microservice não estiver disponível, o que depende dele pode continuar funcionando, mesmo que de forma limitada.</p>
<hr />
<h2><strong>Conclusão</strong></h2>
<p>Na hora de projetar microservices, é importante considerar o acoplamento entre eles. Acoplamento estático e acoplamento dinâmico são duas formas de acoplamento que podem ser usadas em sistemas distribuídos.</p>
<p>Não existe uma regra rígida sobre qual tipo de acoplamento é melhor. Na verdade, a maioria dos sistemas de microservices terá uma combinação de acoplamento estático e acoplamento dinâmico.</p>
<p>Você como arquiteto precisa decidir qual tipo de acoplamento faz mais sentido para o problema que você está resolvendo no momento. Em alguns casos, acoplamento estático pode ser mais simples e eficiente. Em outros casos, acoplamento dinâmico pode ser mais flexível e resiliente.</p>
<p>O importante é entender as diferenças entre acoplamento estático e acoplamento dinâmico e saber quando usar cada um deles.</p>
<hr />
<h2><strong>Referências</strong></h2>
<ul>
<li><a href="https://www.amazon.com.br/Arquitetura-Software-Trade-off-Arquiteturas-Distribu%C3%ADdas/dp/8550819840">Arquitetura de Software: as Partes Difíceis: Análises Modernas de Trade-off Para Arquiteturas Distribuídas</a></li>
</ul>
