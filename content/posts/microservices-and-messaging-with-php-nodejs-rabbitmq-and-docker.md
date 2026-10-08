---
title: 'Microservices and Messaging with PHP, NodeJS, RabbitMQ and Docker'
date: 2024-06-29
translationKey: microservices-e-mensageria-com-php-nodejs-rabbitmq-e-docker
draft: false
---

<p>Microservices development is an architectural approach that structures an application as a set of small, independent services, each running in its own process and communicating through lightweight protocols such as HTTP, WebSockets or AMQP.</p>
<p>In this article, we will build a microservices application with PHP, RabbitMQ and Docker. RabbitMQ is messaging software that implements AMQP (Advanced Message Queuing Protocol), an asynchronous messaging protocol.</p>
<h3 id="heading-what-is-rabbitmq">What is RabbitMQ?</h3>
<p>Imagine the following scenario: you have a system that needs to send emails to users. Instead of sending the emails directly, you can send a message to a message queue, which will be consumed by a service that sends the emails. That is what RabbitMQ does: it receives messages from producers and delivers them to consumers.</p>
<p>This decouples producing messages from consuming them, which lets you scale each part of the system independently. RabbitMQ also makes sure messages are delivered in the right order and are not lost.</p>
<h3 id="heading-application-architecture">Application architecture</h3>
<p>Our application will have two microservices: a producer and a consumer. The producer sends messages to a message queue, and the consumer reads the messages and prints them to the terminal.</p>
<p>Our first step is to create the <code>docker-compose.yml</code> file to define our application's services:</p>
<pre><code class="lang-yaml"><span class="hljs-attr">services:</span>
  <span class="hljs-attr">rabbitmq:</span>
    <span class="hljs-attr">image:</span> <span class="hljs-string">"rabbitmq:3-management"</span>
    <span class="hljs-attr">container_name:</span> <span class="hljs-string">"rabbitmq"</span>
    <span class="hljs-attr">ports:</span>
      <span class="hljs-bullet">-</span> <span class="hljs-string">"15672:15672"</span>
      <span class="hljs-bullet">-</span> <span class="hljs-string">"5672:5672"</span>

  <span class="hljs-attr">php-app:</span>
    <span class="hljs-attr">build:</span> <span class="hljs-string">./php-app</span>
    <span class="hljs-attr">depends_on:</span>
      <span class="hljs-bullet">-</span> <span class="hljs-string">rabbitmq</span>

  <span class="hljs-attr">node-app:</span>
    <span class="hljs-attr">build:</span> <span class="hljs-string">./node-app</span>
    <span class="hljs-attr">depends_on:</span>
      <span class="hljs-bullet">-</span> <span class="hljs-string">rabbitmq</span>
</code></pre>
<p>In this file, we define three services: <code>rabbitmq</code>, <code>php-app</code> and <code>node-app</code>. The <code>rabbitmq</code> service is based on the <code>rabbitmq:3-management</code> image, which includes the RabbitMQ management UI. The <code>php-app</code> and <code>node-app</code> services are based on custom images we are going to build.</p>
<h3 id="heading-building-the-producer-with-php">Building the producer with PHP</h3>
<p>Now let's create the <code>php-app</code> directory and a <code>Dockerfile</code> inside it:</p>
<pre><code class="lang-bash">mkdir php-app && touch php-app/Dockerfile
</code></pre>
<p>In the <code>Dockerfile</code>, we define the base image and copy the application files:</p>
<pre><code class="lang-dockerfile"><span class="hljs-keyword">FROM</span> php:<span class="hljs-number">7.4</span>-cli

<span class="hljs-keyword">RUN</span><span class="bash"> apt-get update && apt-get install -y librabbitmq-dev libssl-dev git unzip wget curl</span>

<span class="hljs-keyword">RUN</span><span class="bash"> docker-php-ext-install sockets pdo pdo_mysql</span>
<span class="hljs-keyword">RUN</span><span class="bash"> pecl install amqp && docker-php-ext-enable amqp</span>

<span class="hljs-keyword">COPY</span><span class="bash"> . /usr/src/myapp</span>
<span class="hljs-keyword">WORKDIR</span><span class="bash"> /usr/src/myapp</span>

<span class="hljs-keyword">RUN</span><span class="bash"> curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/<span class="hljs-built_in">local</span>/bin --filename=composer</span>

<span class="hljs-keyword">RUN</span><span class="bash"> composer clear-cache</span>

<span class="hljs-keyword">RUN</span><span class="bash"> composer install</span>

<span class="hljs-keyword">CMD</span><span class="bash"> [<span class="hljs-string">"php"</span>, <span class="hljs-string">"./publisher.php"</span>]</span>
</code></pre>
<p>In this file, we use the <code>php:7.4-cli</code> base image and install the dependencies needed for RabbitMQ and Composer. Then we copy the application files into <code>/usr/src/myapp</code>, install the Composer dependencies and run the <code>publisher.php</code> script.</p>
<p>Now let's create the <code>publisher.php</code> file at the project root:</p>
<pre><code class="lang-php"><span class="hljs-meta"><?php</span>
<span class="hljs-keyword">require_once</span> <span class="hljs-keyword">__DIR__</span> . <span class="hljs-string">'/vendor/autoload.php'</span>;
<span class="hljs-keyword">use</span> <span class="hljs-title">PhpAmqpLib</span>\<span class="hljs-title">Connection</span>\<span class="hljs-title">AMQPStreamConnection</span>;
<span class="hljs-keyword">use</span> <span class="hljs-title">PhpAmqpLib</span>\<span class="hljs-title">Message</span>\<span class="hljs-title">AMQPMessage</span>;

$maxRetries = <span class="hljs-number">5</span>;
$retryDelay = <span class="hljs-number">5</span>;

<span class="hljs-keyword">for</span> ($attempt = <span class="hljs-number">0</span>; $attempt < $maxRetries; $attempt++) {
    <span class="hljs-keyword">try</span> {
        $connection = <span class="hljs-keyword">new</span> AMQPStreamConnection(<span class="hljs-string">'rabbitmq'</span>, <span class="hljs-number">5672</span>, <span class="hljs-string">'guest'</span>, <span class="hljs-string">'guest'</span>);
        $channel = $connection->channel();
        <span class="hljs-keyword">break</span>;
    } <span class="hljs-keyword">catch</span> (<span class="hljs-built_in">Exception</span> $e) {
        <span class="hljs-keyword">echo</span> <span class="hljs-string">"Failed to connect to RabbitMQ. Retrying in <span class="hljs-subst">$retryDelay</span> seconds...\n"</span>;
        sleep($retryDelay);
    }    
}

<span class="hljs-keyword">if</span> (!<span class="hljs-keyword">isset</span>($connection)) {
    <span class="hljs-keyword">echo</span> <span class="hljs-string">"Not possible to connect to RabbitMQ. Exiting...\n The application will be restarted by Docker\n"</span>;
    <span class="hljs-keyword">exit</span>(<span class="hljs-number">1</span>);
}

$channel->queue_declare(<span class="hljs-string">'hello'</span>, <span class="hljs-literal">false</span>, <span class="hljs-literal">false</span>, <span class="hljs-literal">false</span>, <span class="hljs-literal">false</span>);

$msg = <span class="hljs-keyword">new</span> AMQPMessage(<span class="hljs-string">'Hello, RabbitMQ! Now is '</span> . date(<span class="hljs-string">'Y-m-d H:i:s'</span>));
$channel->basic_publish($msg, <span class="hljs-string">''</span>, <span class="hljs-string">'hello'</span>);

<span class="hljs-keyword">echo</span> <span class="hljs-string">" [x] Sent 'Hello, RabbitMQ!'\n"</span>;

$channel->close();
$connection->close();
</code></pre>
<p>In this file, we open a connection to RabbitMQ, declare a queue called `hello` and send a message to it. Then we close the connection. Notice that we try to connect to RabbitMQ several times, waiting 5 seconds between attempts.</p>
<p>This matters to make sure the application can connect to RabbitMQ even if it is not available right away. It is a common practice in distributed applications, where service availability can vary over time; look up the `circuit breaker` and `retry pattern` patterns to learn more.</p>
<p>To install the RabbitMQ dependencies with Composer, we need to create a `composer.json` file at the project root:</p>
<pre><code class="lang-json">{ <span class="hljs-attr">"require"</span>: { <span class="hljs-attr">"php-amqplib/php-amqplib"</span>: <span class="hljs-string">"^3.1"</span>, <span class="hljs-attr">"phpseclib/phpseclib"</span>: <span class="hljs-string">"^3.0"</span> } }
</code></pre>
<h2 id="heading-building-the-consumer-with-nodejs">Building the consumer with Node.js</h2>
<p>Now let's create the `node-app` directory and a `Dockerfile` inside it:</p>
<pre><code class="lang-bash">mkdir node-app && touch node-app/Dockerfile
</code></pre>
<p>In the `Dockerfile`, we define the base image and copy the application files:</p>
<pre><code class="lang-dockerfile"><span class="hljs-keyword">FROM</span> node:<span class="hljs-number">14</span> 
<span class="hljs-keyword">WORKDIR</span><span class="bash"> /usr/src/app </span>
<span class="hljs-keyword">COPY</span><span class="bash"> package\*.json ./ </span>
<span class="hljs-keyword">RUN</span><span class="bash"> npm install </span>
<span class="hljs-keyword">COPY</span><span class="bash"> . . </span>
<span class="hljs-keyword">CMD</span><span class="bash"> \[<span class="hljs-string">"node"</span>, <span class="hljs-string">"subscriber.js"</span>\]</span>
</code></pre>
<p>In this file, we use the `node:14` base image, copy the application files into `/usr/src/app`, install the Node.js dependencies and run the `subscriber.js` script.</p>
<p>Now let's create the `subscriber.js` file at the project root:</p>
<pre><code class="lang-javascript"><span class="hljs-keyword">const</span> amqp = <span class="hljs-built_in">require</span>(<span class="hljs-string">'amqplib'</span>);

<span class="hljs-keyword">async</span> <span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">connectWithRetry</span>(<span class="hljs-params"></span>) </span>{
    <span class="hljs-keyword">const</span> maxRetries = <span class="hljs-number">5</span>;
    <span class="hljs-keyword">const</span> retryDelay = <span class="hljs-number">5000</span>;

    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> attempt = <span class="hljs-number">1</span>; attempt <= maxRetries; attempt++) {
        <span class="hljs-keyword">try</span> {
            <span class="hljs-keyword">const</span> connection = <span class="hljs-keyword">await</span> amqp.connect(<span class="hljs-string">'amqp://rabbitmq'</span>);
            <span class="hljs-keyword">return</span> connection;
        } <span class="hljs-keyword">catch</span> (err) {
            <span class="hljs-built_in">console</span>.error(<span class="hljs-string">`Not possible to connect to RabbitMQ. Retrying in <span class="hljs-subst">${retryDelay}</span>ms. Attempt <span class="hljs-subst">${attempt}</span> of <span class="hljs-subst">${maxRetries}</span>`</span>);
            <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-built_in">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =></span> <span class="hljs-built_in">setTimeout</span>(resolve, retryDelay));
        }
    }

    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-built_in">Error</span>(<span class="hljs-string">`Failed to connect to RabbitMQ after <span class="hljs-subst">${maxRetries}</span> attempts`</span>);
}

<span class="hljs-keyword">async</span> <span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">receiveMessages</span>(<span class="hljs-params"></span>) </span>{
    <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">const</span> connection = <span class="hljs-keyword">await</span> connectWithRetry();
        <span class="hljs-keyword">const</span> channel = <span class="hljs-keyword">await</span> connection.createChannel();
        <span class="hljs-keyword">const</span> queue = <span class="hljs-string">'hello'</span>;

        <span class="hljs-keyword">await</span> channel.assertQueue(queue, { <span class="hljs-attr">durable</span>: <span class="hljs-literal">false</span> });

        <span class="hljs-built_in">console</span>.log(<span class="hljs-string">" [*] Waiting for messages in %s."</span>, queue);

        channel.consume(queue, <span class="hljs-function"><span class="hljs-keyword">function</span> (<span class="hljs-params">msg</span>) </span>{
            <span class="hljs-built_in">console</span>.log(<span class="hljs-string">" [x] Received: %s"</span>, msg.content.toString());
        }, {
            <span class="hljs-attr">noAck</span>: <span class="hljs-literal">true</span>
        });

    } <span class="hljs-keyword">catch</span> (err) {
        <span class="hljs-built_in">console</span>.error(err.message);
        process.exit(<span class="hljs-number">1</span>);
    }
}

receiveMessages();
</code></pre>
<p>In this file, we open a connection to RabbitMQ, declare a queue called `hello` and consume the messages from it.</p>
<p>Then we print the messages to the terminal. Just like in the producer, we try to connect to RabbitMQ several times, waiting 5 seconds between attempts. This makes sure the consumer can connect to RabbitMQ even if it is not available right away.</p>
<p>And to install the RabbitMQ dependencies, we need to create a `package.json` file at the project root:</p>
<pre><code class="lang-json">{ <span class="hljs-attr">"name"</span>: <span class="hljs-string">"node-app"</span>, <span class="hljs-attr">"version"</span>: <span class="hljs-string">"1.0.0"</span>, <span class="hljs-attr">"description"</span>: <span class="hljs-string">""</span>, <span class="hljs-attr">"main"</span>: <span class="hljs-string">"subscriber.js"</span>, <span class="hljs-attr">"dependencies"</span>: { <span class="hljs-attr">"amqplib"</span>: <span class="hljs-string">"^0.8.0"</span> }, <span class="hljs-attr">"author"</span>: <span class="hljs-string">""</span>, <span class="hljs-attr">"license"</span>: <span class="hljs-string">"ISC"</span> }
</code></pre>
<h2 id="heading-running-the-application">Running the application</h2>
<p>Now that we have the RabbitMQ, producer and consumer services, let's run the application with Docker Compose:</p>
<pre><code class="lang-bash">docker compose up --build
</code></pre>
<p>This will create the service containers and run the application. You will see the messages sent by the producer printed to the terminal by the consumer.</p>
<p>RabbitMQ will also be available on port 15672, where you can open the management UI and see the queues and messages.</p>
<p>With that, we have built a microservices application with PHP, RabbitMQ and Docker. This architectural approach lets you scale each part of the system independently and guarantees that messages are delivered in the right order.</p>
<p>I hope this article was useful and that you can apply these concepts in your projects. If you have any questions or suggestions, leave them in the comments.</p>
<p>Feel free to reach out with any questions.</p>
<p>Repository: <a target="_blank" href="https://github.com/sschonss/ms-rabbitmq">Microservices and Messaging with PHP, RabbitMQ and Docker</a></p>
