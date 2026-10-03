---
title: 'Microservices e Mensageria com PHP, NodeJS, RabbitMQ e Docker'
date: 2024-06-29
source: https://luizschons.com/microservices-e-mensageria-com-php-nodejs-rabbitmq-e-docker-7266127c8489
draft: false
aliases: ["/microservices-e-mensageria-com-php-nodejs-rabbitmq-e-docker-7266127c8489/"]
---

<p>O desenvolvimento de microserviços é uma abordagem arquitetural que estrutura uma aplicação como um conjunto de serviços pequenos e independentes, que são executados em seu próprio processo e se comunicam por meio de protocolos leves, como HTTP, WebSockets ou AMQP.</p>
<p>Neste artigo, vamos criar uma aplicação de microserviços com PHP, RabbitMQ e Docker. O RabbitMQ é um software de mensageria que implementa o protocolo AMQP (Advanced Message Queuing Protocol), que é um protocolo de mensagens assíncronas.</p>
<h3 id="heading-o-que-e-rabbitmq">O que é RabbitMQ?</h3>
<p>Vamos imaginar o seguinte cenário: você tem um sistema que precisa enviar e-mails para os usuários. Em vez de enviar os e-mails diretamente, você pode enviar uma mensagem para uma fila de mensagens, que será consumida por um serviço que envia os e-mails. Isso é o que o RabbitMQ faz: ele recebe mensagens de produtores e as envia para consumidores.</p>
<p>Dessa forma é possível desacoplar a produção de mensagens do consumo, o que permite escalar cada parte do sistema de forma independente. Além disso, o RabbitMQ garante que as mensagens sejam entregues na ordem correta e que não sejam perdidas.</p>
<h3 id="heading-arquitetura-da-aplicacao">Arquitetura da aplicação</h3>
<p>Nossa aplicação será composta por dois microserviços: um produtor e um consumidor. O produtor será responsável por enviar mensagens para uma fila de mensagens, e o consumidor será responsável por consumir as mensagens e exibi-las no terminal.</p>
<p>Nosso primeiro passo será criar o arquivo <code>docker-compose.yml</code> para definir os serviços da nossa aplicação:</p>
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
<p>Neste arquivo, definimos três serviços: <code>rabbitmq</code>, <code>php-app</code> e <code>node-app</code>. O serviço <code>rabbitmq</code> é baseado na imagem <code>rabbitmq:3-management</code>, que inclui a interface de gerenciamento do RabbitMQ. Os serviços <code>php-app</code> e <code>node-app</code> são baseados em imagens customizadas que iremos criar.</p>
<h3 id="heading-criando-o-produtor-com-php">Criando o produtor com PHP</h3>
<p>Agora, vamos criar o diretório <code>php-app</code> e o arquivo <code>Dockerfile</code> dentro dele:</p>
<pre><code class="lang-bash">mkdir php-app && touch php-app/Dockerfile
</code></pre>
<p>No arquivo <code>Dockerfile</code>, vamos definir a imagem base e copiar os arquivos da aplicação:</p>
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
<p>Neste arquivo, definimos a imagem base <code>php:7.4-cli</code> e instalamos as dependências necessárias para o RabbitMQ e o Composer. Em seguida, copiamos os arquivos da aplicação para o diretório <code>/usr/src/myapp</code>, instalamos as dependências do Composer e executamos o script <code>publisher.php</code>.</p>
<p>Agora, vamos criar o arquivo <code>publisher.php</code> na raiz do projeto:</p>
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
<p>Neste arquivo, criamos uma conexão com o RabbitMQ, declaramos uma fila chamada `hello` e enviamos uma mensagem para essa fila. Em seguida, fechamos a conexão com o RabbitMQ. Perceba que estamos tentando conectar ao RabbitMQ várias vezes, com um intervalo de 5 segundos entre as tentativas.</p>
<p>Isso é importante para garantir que a aplicação consiga se conectar ao RabbitMQ mesmo que ele não esteja disponível imediatamente. Isso é uma prática comum em aplicações distribuídas, onde a disponibilidade dos serviços pode variar ao longo do tempo, pesquise mais sobre `circuit breaker` e `retry pattern`.</p>
<p>Mas para instalar as dependências do RabbitMQ e do Composer, precisamos criar o arquivo `composer.json` na raiz do projeto:</p>
<pre><code class="lang-json">{ <span class="hljs-attr">"require"</span>: { <span class="hljs-attr">"php-amqplib/php-amqplib"</span>: <span class="hljs-string">"^3.1"</span>, <span class="hljs-attr">"phpseclib/phpseclib"</span>: <span class="hljs-string">"^3.0"</span> } }
</code></pre>
<h2 id="heading-criando-o-consumidor-com-nodejs">Criando o consumidor com Node.js</h2>
<p>Agora, vamos criar o diretório `node-app` e o arquivo `Dockerfile` dentro dele:</p>
<pre><code class="lang-bash">mkdir node-app && touch node-app/Dockerfile
</code></pre>
<p>No arquivo `Dockerfile`, vamos definir a imagem base e copiar os arquivos da aplicação:</p>
<pre><code class="lang-dockerfile"><span class="hljs-keyword">FROM</span> node:<span class="hljs-number">14</span> 
<span class="hljs-keyword">WORKDIR</span><span class="bash"> /usr/src/app </span>
<span class="hljs-keyword">COPY</span><span class="bash"> package\*.json ./ </span>
<span class="hljs-keyword">RUN</span><span class="bash"> npm install </span>
<span class="hljs-keyword">COPY</span><span class="bash"> . . </span>
<span class="hljs-keyword">CMD</span><span class="bash"> \[<span class="hljs-string">"node"</span>, <span class="hljs-string">"subscriber.js"</span>\]</span>
</code></pre>
<p>Neste arquivo, definimos a imagem base `node:14`, copiamos os arquivos da aplicação para o diretório `/usr/src/app`, instalamos as dependências do Node.js e executamos o script `subscriber.js`.</p>
<p>Agora, vamos criar o arquivo `subscriber.js` na raiz do projeto:</p>
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
<p>Neste arquivo, criamos uma conexão com o RabbitMQ, declaramos uma fila chamada `hello` e consumimos as mensagens dessa fila.</p>
<p>Em seguida, exibimos as mensagens no terminal. Assim como no produtor, estamos tentando conectar ao RabbitMQ várias vezes, com um intervalo de 5 segundos entre as tentativas. Isso é importante para garantir que o consumidor consiga se conectar ao RabbitMQ mesmo que ele não esteja disponível imediatamente.</p>
<p>E para instalar as dependências do RabbitMQ, precisamos criar o arquivo `package.json` na raiz do projeto:</p>
<pre><code class="lang-json">{ <span class="hljs-attr">"name"</span>: <span class="hljs-string">"node-app"</span>, <span class="hljs-attr">"version"</span>: <span class="hljs-string">"1.0.0"</span>, <span class="hljs-attr">"description"</span>: <span class="hljs-string">""</span>, <span class="hljs-attr">"main"</span>: <span class="hljs-string">"subscriber.js"</span>, <span class="hljs-attr">"dependencies"</span>: { <span class="hljs-attr">"amqplib"</span>: <span class="hljs-string">"^0.8.0"</span> }, <span class="hljs-attr">"author"</span>: <span class="hljs-string">""</span>, <span class="hljs-attr">"license"</span>: <span class="hljs-string">"ISC"</span> }
</code></pre>
<h2 id="heading-executando-a-aplicacao">Executando a aplicação</h2>
<p>Agora que criamos os serviços do RabbitMQ, do produtor e do consumidor, vamos executar a aplicação com o Docker Compose:</p>
<pre><code class="lang-bash">docker compose up --build
</code></pre>
<p>Isso irá criar os containers dos serviços e executar a aplicação. Você verá as mensagens enviadas pelo produtor sendo exibidas no terminal pelo consumidor.</p>
<p>O RabbitMQ também estará disponível na porta 15672, onde você pode acessar a interface de gerenciamento e visualizar as filas e as mensagens.</p>
<p>Com isso, criamos uma aplicação de microserviços com PHP, RabbitMQ e Docker. Essa abordagem arquitetural permite escalar cada parte do sistema de forma independente e garante a entrega das mensagens na ordem correta.</p>
<p>Espero que este artigo tenha sido útil e que você possa aplicar esses conceitos em seus projetos. Se tiver alguma dúvida ou sugestão, deixe nos comentários.</p>
<p>Qualquer dúvida, estou à disposição.</p>
<p>Link do Repositório: <a target="_blank" href="https://github.com/sschonss/ms-rabbitmq">Microservices e Mensageria com PHP, RabbitMQ e Docker</a></p>
