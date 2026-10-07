---
title: 'Arquitetura Hexagonal e Mensageria com PHP'
date: 2024-07-04
source: https://luizschons.com/arquitetura-hexagonal-e-mensageria-com-php-aa10a2148257
translationKey: arquitetura-hexagonal-e-mensageria-com-php-aa10a2148257
draft: false
aliases: ["/arquitetura-hexagonal-e-mensageria-com-php-aa10a2148257/"]
---

<h3 id="heading-arquiteura-hexagonal-ports-and-adapters">Arquiteura Hexagonal (Ports and Adapters)</h3>
<p>Link para o projeto: <a target="_blank" href="https://github.com/sschonss/microservices-hexagonal">https://github.com/sschonss/microservices-hexagonal</a></p>
<p>Existem diversas formas de se organizar um projeto, e uma das formas mais conhecidas é a arquitetura hexagonal. A arquitetura hexagonal é uma forma de organizar o projeto de forma que ele seja independente de frameworks, banco de dados, UI, etc. O objetivo é que o projeto seja independente de qualquer tecnologia, e que possa ser facilmente substituído.</p>
<p>Neste projeto, a arquitetura hexagonal foi implementada utilizando a linguagem de programação PHP e o framework Laravel. A ideia é que o projeto seja independente do Laravel, e dessa maneira, usamos somente o Laravel para criar rotas e controladores, e o restante do projeto é independente do Laravel.</p>
<h3 id="heading-estrutura-do-projeto">Estrutura do projeto</h3>
<p>O projeto foi dividido em 3 camadas principais:</p>
<ul>
<li><p><strong>Laravel</strong>: Toda a infraestrutura do projeto, como rotas, controladores, etc.</p>
</li>
<li><p><strong>Adapters</strong>: Camada responsável por conter os adaptadores de entrada e saída do projeto.</p>
</li>
<li><p><strong>Core</strong>: Camada responsável por conter as regras de negócio do projeto. Dentro do core, iremos trabalhar com Domain Driven Design (DDD).</p>
</li>
</ul>
<h3 id="heading-adapters">Adapters</h3>
<p>Os adapters são responsáveis por adaptar as entradas e saídas do projeto. Mas o que isso significa?</p>
<p>Imagine que você tem um projeto que precisa se comunicar com um banco de dados. Se você não utilizar uma camada de adapter, você terá que utilizar o banco de dados diretamente no seu projeto. Isso significa que você terá que utilizar as classes do banco de dados diretamente no seu projeto, e isso fará com que seu projeto fique dependente do banco de dados.</p>
<p>Então um ORM (Object Relational Mapping) é um exemplo de adapter. O ORM é uma camada que adapta a comunicação com o banco de dados, e dessa maneira, o projeto não fica dependente do banco de dados.</p>
<p>Dentro do nosso projeto, temos os seguintes adapters:</p>
<ul>
<li><p><strong>EmailAdapter</strong>: Adapter responsável por enviar e-mails.</p>
</li>
<li><p><strong>RabbitMQAdapter</strong>: Adapter responsável por enviar mensagens para o RabbitMQ.</p>
</li>
</ul>
<p>Neles contém as classes que adaptam a comunicação com o serviço de e-mail e com o RabbitMQ.</p>
<p>Tudo isso somente usando PHP sem Laravel, para que o projeto seja independente e possa ser facilmente substituído.</p>
<h3 id="heading-core">Core</h3>
<p>O core é a camada responsável por conter as regras de negócio do projeto. Dentro do core, iremos trabalhar com Domain Driven Design (DDD).</p>
<h3 id="heading-o-que-e-ddd">O que é DDD?</h3>
<p>Domain Driven Design é uma forma de organizar o projeto de forma que ele seja separado por domínios. Cada domínio é uma parte do projeto que contém as regras de negócio. Dessa maneira, o projeto fica organizado e fácil de ser mantido.</p>
<p>Dentro do core, temos os seguintes domínios:</p>
<ul>
<li><p>Email: Domínio responsável por emails em geral da aplicação.</p>
</li>
<li><p>Connections: Domínio responsável por conexões com serviços externos, como RabbitMQ, Redis, etc.</p>
</li>
</ul>
<p>Dentro de cada domínio, teremos as camadas responsáveis por conter as regras de negócio para cada feature.</p>
<p>O mais importante é que o core não depende de nada. Ele é independente de qualquer framework, banco de dados, etc. Dessa maneira, podemos facilmente substituir o Laravel por outro framework, ou o MySQL por outro banco de dados.</p>
<p>O Core se comunica com serviços externos através dos adapters. Dessa maneira, o core não fica dependente de nenhum serviço externo, somente do adapter.</p>
<h3 id="heading-projeto">Projeto</h3>
<p>O projeto é um exemplo simples de como a arquitetura hexagonal pode ser implementada. O projeto é um sistema de cadastro de usuários, onde o usuário pode se cadastrar e receber um e-mail de boas-vindas.</p>
<p>O projeto foi dividido em 3 serviços:</p>
<ul>
<li><p>Main App: Serviço principal, onde o usuário se cadastra. Nele está a arquitetura hexagonal.</p>
</li>
<li><p>RabbitMQ: Serviço de mensageria, onde o Main App envia uma mensagem para o RabbitMQ.</p>
</li>
<li><p>Email App: Serviço de e-mail, onde lê as mensagens do RabbitMQ e envia um e-mail para o usuário.</p>
</li>
</ul>
<p>Dessa maneira, o Main App não fica dependente do RabbitMQ e do serviço de e-mail. Ele somente envia uma mensagem para o RabbitMQ, e o RabbitMQ envia a mensagem para o serviço de e-mail.</p>
<h3 id="heading-como-rodar-o-projeto">Como rodar o projeto</h3>
<p>Para rodar o projeto, você precisa ter o Composer, Docker e o Docker Compose instalados na sua máquina.</p>
<p>Após instalar o Docker e o Docker Compose, basta rodar o seguinte comando:</p>
<p><code>cd main-app   composer install   ./vendor/bin/sail up</code></p>
<p>Após rodar o comando, o projeto estará rodando na porta 80.</p>
<p>Já podemos criar um usuário através do endpoint <code>POST /api/user</code>, passando o seguinte JSON:</p>
<p><code>{   "name": "John Doe",   "email": "john@doe.com",   "password": "123456"   }</code></p>
<p>Após criar o usuário, será disparado um evento para o RabbitMQ, mas o serviço de e-mail ainda não está rodando. Para rodar o serviço de e-mail, basta rodar o seguinte comando:</p>
<p><code>cd email-app   docker-compose up --build --force-recreate</code></p>
<p>Após rodar o comando, o serviço de e-mail estará rodando e irá ler as mensagens do RabbitMQ e enviar um e-mail para o usuário.</p>
<h3 id="heading-acessar-o-rabbitmq">Acessar o RabbitMQ</h3>
<p>Para acessar o RabbitMQ, basta acessar o seguinte endereço:</p>
<p><code>http://localhost:15672</code></p>
<p>E fazer login com as seguintes credenciais:</p>
<p><code>Username: guest   Password: guest</code></p>
<h3 id="heading-conclusao">Conclusão</h3>
<p>A arquitetura hexagonal é uma forma de organizar o projeto de forma que ele seja independente de qualquer tecnologia. Neste projeto, a arquitetura hexagonal foi implementada utilizando a linguagem de programação PHP e o framework Laravel. A ideia é que o projeto seja independente do Laravel, e dessa maneira, usamos somente o Laravel para criar rotas e controladores, e o restante do projeto é independente do Laravel.</p>
<p>O projeto é um exemplo simples de como a arquitetura hexagonal pode ser implementada. O projeto é um sistema de cadastro de usuários, onde o usuário pode se cadastrar e receber um e-mail de boas-vindas.</p>
<p>Também foi implementado um serviço de mensageria com RabbitMQ e um serviço de e-mail. Dessa maneira, o Main App não fica dependente do RabbitMQ e do serviço de e-mail. Ele somente envia uma mensagem para o RabbitMQ, e o RabbitMQ envia a mensagem para o serviço de e-mail.</p>
<p>Vimos como a mensageria ajuda a desacoplar os serviços, e como a arquitetura hexagonal ajuda a organizar o projeto de forma que ele seja independente de qualquer tecnologia.</p>
