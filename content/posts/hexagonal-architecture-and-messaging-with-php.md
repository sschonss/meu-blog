---
title: 'Hexagonal Architecture and Messaging with PHP'
date: 2024-07-04
translationKey: arquitetura-hexagonal-e-mensageria-com-php
draft: false
---

<h3 id="heading-hexagonal-architecture-ports-and-adapters">Hexagonal Architecture (Ports and Adapters)</h3>
<p>Project link: <a target="_blank" href="https://github.com/sschonss/microservices-hexagonal">https://github.com/sschonss/microservices-hexagonal</a></p>
<p>There are many ways to organize a project, and one of the best known is hexagonal architecture. Hexagonal architecture organizes a project so that it is independent of frameworks, databases, UI and so on. The goal is for the project to be independent of any technology, so that each one can be easily replaced.</p>
<p>In this project, hexagonal architecture was implemented with the PHP programming language and the Laravel framework. The idea is for the project to be independent of Laravel, so we use Laravel only to create routes and controllers, and the rest of the project does not depend on it.</p>
<h3 id="heading-project-structure">Project structure</h3>
<p>The project was split into 3 main layers:</p>
<ul>
<li><p><strong>Laravel</strong>: All of the project's infrastructure, such as routes, controllers, etc.</p>
</li>
<li><p><strong>Adapters</strong>: Layer that holds the project's input and output adapters.</p>
</li>
<li><p><strong>Core</strong>: Layer that holds the project's business rules. Inside the core, we will work with Domain Driven Design (DDD).</p>
</li>
</ul>
<h3 id="heading-adapters">Adapters</h3>
<p>Adapters are responsible for adapting the project's inputs and outputs. But what does that mean?</p>
<p>Imagine you have a project that needs to talk to a database. Without an adapter layer, you would have to use the database directly in your project. That means using the database classes directly in your code, which makes your project dependent on the database.</p>
<p>An ORM (Object Relational Mapping) is an example of an adapter. The ORM is a layer that adapts communication with the database, so the project does not depend on the database itself.</p>
<p>In our project, we have the following adapters:</p>
<ul>
<li><p><strong>EmailAdapter</strong>: Adapter responsible for sending emails.</p>
</li>
<li><p><strong>RabbitMQAdapter</strong>: Adapter responsible for sending messages to RabbitMQ.</p>
</li>
</ul>
<p>They contain the classes that adapt communication with the email service and with RabbitMQ.</p>
<p>All of this uses plain PHP, without Laravel, so the project stays independent and each piece can be easily replaced.</p>
<h3 id="heading-core">Core</h3>
<p>The core is the layer that holds the project's business rules. Inside the core, we will work with Domain Driven Design (DDD).</p>
<h3 id="heading-what-is-ddd">What is DDD?</h3>
<p>Domain Driven Design is a way of organizing a project so that it is split into domains. Each domain is a part of the project that holds business rules. This keeps the project organized and easy to maintain.</p>
<p>Inside the core, we have the following domains:</p>
<ul>
<li><p>Email: Domain responsible for the application's emails in general.</p>
</li>
<li><p>Connections: Domain responsible for connections to external services, such as RabbitMQ, Redis, etc.</p>
</li>
</ul>
<p>Inside each domain, we have the layers that hold the business rules for each feature.</p>
<p>Most importantly, the core depends on nothing. It is independent of any framework, database, etc. That way, we can easily replace Laravel with another framework, or MySQL with another database.</p>
<p>The core talks to external services through the adapters. That way, the core does not depend on any external service, only on the adapter.</p>
<h3 id="heading-the-project">The project</h3>
<p>The project is a simple example of how hexagonal architecture can be implemented. It is a user registration system, where users can sign up and receive a welcome email.</p>
<p>The project was split into 3 services:</p>
<ul>
<li><p>Main App: The main service, where users sign up. This is where the hexagonal architecture lives.</p>
</li>
<li><p>RabbitMQ: The messaging service, to which the Main App sends a message.</p>
</li>
<li><p>Email App: The email service, which reads messages from RabbitMQ and sends an email to the user.</p>
</li>
</ul>
<p>This way, the Main App does not depend on RabbitMQ or on the email service. It just sends a message to RabbitMQ, and RabbitMQ delivers the message to the email service.</p>
<h3 id="heading-how-to-run-the-project">How to run the project</h3>
<p>To run the project, you need Composer, Docker and Docker Compose installed on your machine.</p>
<p>After installing Docker and Docker Compose, just run the following command:</p>
<p><code>cd main-app   composer install   ./vendor/bin/sail up</code></p>
<p>After running the command, the project will be running on port 80.</p>
<p>We can now create a user through the <code>POST /api/user</code> endpoint, sending the following JSON:</p>
<p><code>{   "name": "John Doe",   "email": "john@doe.com",   "password": "123456"   }</code></p>
<p>After the user is created, an event is published to RabbitMQ, but the email service is not running yet. To run it, just run the following command:</p>
<p><code>cd email-app   docker-compose up --build --force-recreate</code></p>
<p>After running the command, the email service will be running, reading messages from RabbitMQ and sending an email to the user.</p>
<h3 id="heading-accessing-rabbitmq">Accessing RabbitMQ</h3>
<p>To access RabbitMQ, just open the following address:</p>
<p><code>http://localhost:15672</code></p>
<p>And log in with the following credentials:</p>
<p><code>Username: guest   Password: guest</code></p>
<h3 id="heading-conclusion">Conclusion</h3>
<p>Hexagonal architecture is a way of organizing a project so that it is independent of any technology. In this project, it was implemented with PHP and the Laravel framework. The idea is for the project to be independent of Laravel, so we use Laravel only to create routes and controllers, and the rest of the project does not depend on it.</p>
<p>The project is a simple example of how hexagonal architecture can be implemented. It is a user registration system, where users can sign up and receive a welcome email.</p>
<p>We also implemented a messaging service with RabbitMQ and an email service. This way, the Main App does not depend on RabbitMQ or on the email service. It just sends a message to RabbitMQ, and RabbitMQ delivers it to the email service.</p>
<p>We saw how messaging helps decouple services, and how hexagonal architecture helps organize a project so that it is independent of any technology.</p>
