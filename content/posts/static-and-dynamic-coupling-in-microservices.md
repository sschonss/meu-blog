---
title: 'Static and dynamic coupling in microservices'
date: 2024-10-11
translationKey: acoplamento-estatico-e-dinamico-em-microservices
draft: false
tags: ['Architecture', 'Microservices']
---

<p>Monolithic applications are those with a single codebase, a single executable and a single process. They are often built in a single programming language and deployed to a single server.</p>
<p>When we start developing, monoliths are usually our first experience. They are easy to develop, test and deploy. However, as the application grows, the monolith starts to become a problem.</p>
<p>Scalability is one of the most important things to consider in software today. Being able to handle the growth of users and data dynamically is essential to a software product's success.</p>
<p>Monolithic systems are hard to scale. They are built as a single block of code, which means that to scale the application you need to replicate all of the code or scale the server vertically. That can be expensive and inefficient.</p>
<blockquote>
<p><strong>Vertical scalability</strong> is the ability to increase a server's capacity by adding more resources, such as CPU, RAM and disk. It is done to improve a server's performance.</p>
<p><strong>Horizontal scalability</strong> is the ability to increase a system's capacity by adding more instances of it. It is done to improve a system's availability and reliability.</p>
</blockquote>
<p>Microservices is a software architecture that solves this problem (but creates others). Instead of building a single monolithic application, you build several small, independent applications called microservices. Each microservice is responsible for a specific part of the application and communicates with the others.</p>
<p>Although microservices seem in theory to offer an ideal solution to scalability problems, in practice they bring challenges of their own. One of the main ones is managing the coupling between them.</p>
<p>In an ideal world, microservices should be independent and decoupled. That means one application should be able to work without depending on another. However, especially when migrating from monoliths to microservices, it is common for them to depend on each other, and that is what we call coupling.</p>
<p>There are two kinds of coupling in microservices: static coupling and dynamic coupling, and those are what we are going to talk about today.</p>
<hr />
<h2><strong>Example of a microservices architecture</strong></h2>
<img src="/images/posts/acoplamento-estatico-e-dinamico-em-microservices/bb9c5c1b-8245-4a17-9691-a5a166d7539f.png" alt="Microservices architecture diagram: API Gateway, Nginx, PaymentService, OrderService, UserService, ProductCatalogService, RabbitMQ, NotificationService, MongoDB and Consul" style="display:block;margin:0 auto" />

<h3><strong>Components:</strong></h3>
<ol>
<li><p><strong>API Gateway</strong>:</p>
<ul>
<li><p>Acts as the entry point for all external requests to the system.</p>
</li>
<li><p>Receives HTTP requests from clients and routes them to the appropriate internal services (such as ProductCatalogService, OrderService and UserService).</p>
</li>
<li><p>Handles access control, authentication, request routing and response aggregation.</p>
</li>
</ul>
</li>
<li><p><strong>ProductCatalogService</strong>:</p>
<ul>
<li><p>Manages information about products for sale, such as descriptions, prices and availability.</p>
</li>
<li><p>Can query a discovery service such as Consul to locate other services it needs.</p>
</li>
</ul>
</li>
<li><p><strong>OrderService</strong>:</p>
<ul>
<li><p>Creates purchase orders.</p>
</li>
<li><p>Interacts with other services to get product information (via ProductCatalogService) and user details (via UserService).</p>
</li>
<li><p>Handles orders in the MongoDB database and publishes order events to RabbitMQ, enabling asynchronous communication with other services.</p>
</li>
</ul>
</li>
<li><p><strong>UserService</strong>:</p>
<ul>
<li><p>Manages user information, such as profiles, preferences and purchase history.</p>
</li>
<li><p>Lets other services query user information securely.</p>
</li>
</ul>
</li>
<li><p><strong>PaymentService</strong>:</p>
<ul>
<li><p>Responsible for processing payment transactions.</p>
</li>
<li><p>Interacts with the MongoDB database to store information about financial transactions.</p>
</li>
<li><p>Publishes transaction events to RabbitMQ so that other services (such as NotificationService) are notified of financial events.</p>
</li>
</ul>
</li>
<li><p><strong>RabbitMQ</strong>:</p>
<ul>
<li><p>Enables asynchronous messaging between services, making decoupled communication easier.</p>
</li>
<li><p>Delivers order and transaction events to interested parties.</p>
</li>
</ul>
</li>
<li><p><strong>NotificationService</strong>:</p>
<ul>
<li>Sends notifications to users based on events received through RabbitMQ, such as order status updates or payment confirmation messages.</li>
</ul>
</li>
<li><p><strong>MongoDB</strong>:</p>
<ul>
<li><p>Stores data critical to the system, such as order, user and transaction information.</p>
</li>
<li><p>A NoSQL database like MongoDB is well suited to systems that need schema flexibility and efficient handling of unstructured data.</p>
</li>
</ul>
</li>
<li><p><strong>Consul</strong>:</p>
<ul>
<li><p>Service used for service discovery, configuration and management.</p>
</li>
<li><p>Lets microservices dynamically discover the location of other services, enabling a highly flexible and resilient architecture.</p>
</li>
</ul>
</li>
<li><p><strong>Nginx</strong>:</p>
<ul>
<li>Can act as a reverse proxy or load balancer that distributes requests across several API Gateway instances, improving capacity and availability.</li>
</ul>
</li>
</ol>
<hr />
<h2><strong>Static coupling</strong></h2>
<p>The components in green represent static coupling.</p>
<p>Static coupling happens when a microservice depends on another microservice at compile time or at the system's initial configuration.</p>
<p>Most of the time, static coupling is easy to spot. The most common forms are:</p>
<ol>
<li><p><strong>Code dependency</strong>: a microservice calls another one directly through a function call or an API.</p>
</li>
<li><p><strong>Database dependency</strong>: a microservice accesses another application's database directly.</p>
</li>
<li><p><strong>Configuration dependency</strong>: a microservice depends on specific settings of another microservice.</p>
</li>
</ol>
<p>Another form of static coupling is when a microservice depends on a specific contract of another one. For example, a microservice expects another service to return a specific JSON object. If the contract changes, the microservice that depends on it may break, so the application that depends on the contract has to be updated.</p>
<hr />
<h2><strong>Dynamic coupling</strong></h2>
<p>The components in blue represent dynamic coupling.</p>
<p>Dynamic coupling happens when a microservice depends on another one at runtime.</p>
<p>Most of the time, dynamic coupling is harder to spot. The most common forms are:</p>
<ol>
<li><p><strong>Messaging dependency</strong>: a microservice sends a message to a message bus and expects another service to respond.</p>
</li>
<li><p><strong>Service discovery dependency</strong>: a microservice queries a discovery service to locate another one.</p>
</li>
</ol>
<p>The interesting thing about dynamic coupling is that it lets microservices be more independent and decoupled. If a microservice is unavailable, the one that depends on it can keep working, even if in a limited way.</p>
<hr />
<h2><strong>Conclusion</strong></h2>
<p>When designing microservices, it is important to consider the coupling between them. Static coupling and dynamic coupling are two forms of coupling that can be used in distributed systems.</p>
<p>There is no hard rule about which kind of coupling is better. In fact, most microservices systems will have a combination of static and dynamic coupling.</p>
<p>As an architect, you need to decide which kind of coupling makes the most sense for the problem you are solving right now. In some cases, static coupling can be simpler and more efficient. In others, dynamic coupling can be more flexible and resilient.</p>
<p>What matters is understanding the differences between static and dynamic coupling and knowing when to use each one.</p>
<hr />
<h2><strong>References</strong></h2>
<ul>
<li><a href="https://www.oreilly.com/library/view/software-architecture-the/9781492086888/">Software Architecture: The Hard Parts — Modern Trade-Off Analyses for Distributed Architectures</a></li>
</ul>
