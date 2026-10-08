---
title: 'Microservices e Mensageria com PHP, NodeJS, RabbitMQ e Docker'
date: 2024-06-29
source: https://luizschons.com/microservices-e-mensageria-com-php-nodejs-rabbitmq-e-docker-7266127c8489
translationKey: microservices-e-mensageria-com-php-nodejs-rabbitmq-e-docker
draft: false
tags: ['Microservices', 'Mensageria', 'PHP', 'Docker']
---

<p>O desenvolvimento de microserviços é uma abordagem arquitetural que estrutura uma aplicação como um conjunto de serviços pequenos e independentes, que são executados em seu próprio processo e se comunicam por meio de protocolos leves, como HTTP, WebSockets ou AMQP.</p>
<p>Neste artigo, vamos criar uma aplicação de microserviços com PHP, RabbitMQ e Docker. O RabbitMQ é um software de mensageria que implementa o protocolo AMQP (Advanced Message Queuing Protocol), que é um protocolo de mensagens assíncronas.</p>
<h3 id="heading-o-que-e-rabbitmq">O que é RabbitMQ?</h3>
<p>Vamos imaginar o seguinte cenário: você tem um sistema que precisa enviar e-mails para os usuários. Em vez de enviar os e-mails diretamente, você pode enviar uma mensagem para uma fila de mensagens, que será consumida por um serviço que envia os e-mails. Isso é o que o RabbitMQ faz: ele recebe mensagens de produtores e as envia para consumidores.</p>
<p>Dessa forma é possível desacoplar a produção de mensagens do consumo, o que permite escalar cada parte do sistema de forma independente. Além disso, o RabbitMQ garante que as mensagens sejam entregues na ordem correta e que não sejam perdidas.</p>
<h3 id="heading-arquitetura-da-aplicacao">Arquitetura da aplicação</h3>
<p>Nossa aplicação será composta por dois microserviços: um produtor e um consumidor. O produtor será responsável por enviar mensagens para uma fila de mensagens, e o consumidor será responsável por consumir as mensagens e exibi-las no terminal.</p>
<p>Nosso primeiro passo será criar o arquivo <code>docker-compose.yml</code> para definir os serviços da nossa aplicação:</p>

```yaml
services:
  rabbitmq:
    image: "rabbitmq:3-management"
    container_name: "rabbitmq"
    ports:
      - "15672:15672"
      - "5672:5672"

  php-app:
    build: ./php-app
    depends_on:
      - rabbitmq

  node-app:
    build: ./node-app
    depends_on:
      - rabbitmq
```

<p>Neste arquivo, definimos três serviços: <code>rabbitmq</code>, <code>php-app</code> e <code>node-app</code>. O serviço <code>rabbitmq</code> é baseado na imagem <code>rabbitmq:3-management</code>, que inclui a interface de gerenciamento do RabbitMQ. Os serviços <code>php-app</code> e <code>node-app</code> são baseados em imagens customizadas que iremos criar.</p>
<h3 id="heading-criando-o-produtor-com-php">Criando o produtor com PHP</h3>
<p>Agora, vamos criar o diretório <code>php-app</code> e o arquivo <code>Dockerfile</code> dentro dele:</p>

```bash
mkdir php-app && touch php-app/Dockerfile
```

<p>No arquivo <code>Dockerfile</code>, vamos definir a imagem base e copiar os arquivos da aplicação:</p>

```dockerfile
FROM php:7.4-cli

RUN apt-get update && apt-get install -y librabbitmq-dev libssl-dev git unzip wget curl

RUN docker-php-ext-install sockets pdo pdo_mysql
RUN pecl install amqp && docker-php-ext-enable amqp

COPY . /usr/src/myapp
WORKDIR /usr/src/myapp

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN composer clear-cache

RUN composer install

CMD ["php", "./publisher.php"]
```

<p>Neste arquivo, definimos a imagem base <code>php:7.4-cli</code> e instalamos as dependências necessárias para o RabbitMQ e o Composer. Em seguida, copiamos os arquivos da aplicação para o diretório <code>/usr/src/myapp</code>, instalamos as dependências do Composer e executamos o script <code>publisher.php</code>.</p>
<p>Agora, vamos criar o arquivo <code>publisher.php</code> na raiz do projeto:</p>

```php
require_once __DIR__ . '/vendor/autoload.php';
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

$maxRetries = 5;
$retryDelay = 5;

for ($attempt = 0; $attempt try {
        $connection = new AMQPStreamConnection('rabbitmq', 5672, 'guest', 'guest');
        $channel = $connection->channel();
        break;
    } catch (Exception $e) {
        echo "Failed to connect to RabbitMQ. Retrying in $retryDelay seconds...\n";
        sleep($retryDelay);
    }    
}

if (!isset($connection)) {
    echo "Not possible to connect to RabbitMQ. Exiting...\n The application will be restarted by Docker\n";
    exit(1);
}

$channel->queue_declare('hello', false, false, false, false);

$msg = new AMQPMessage('Hello, RabbitMQ! Now is ' . date('Y-m-d H:i:s'));
$channel->basic_publish($msg, '', 'hello');

echo " [x] Sent 'Hello, RabbitMQ!'\n";

$channel->close();
$connection->close();
```

<p>Neste arquivo, criamos uma conexão com o RabbitMQ, declaramos uma fila chamada `hello` e enviamos uma mensagem para essa fila. Em seguida, fechamos a conexão com o RabbitMQ. Perceba que estamos tentando conectar ao RabbitMQ várias vezes, com um intervalo de 5 segundos entre as tentativas.</p>
<p>Isso é importante para garantir que a aplicação consiga se conectar ao RabbitMQ mesmo que ele não esteja disponível imediatamente. Isso é uma prática comum em aplicações distribuídas, onde a disponibilidade dos serviços pode variar ao longo do tempo, pesquise mais sobre `circuit breaker` e `retry pattern`.</p>
<p>Mas para instalar as dependências do RabbitMQ e do Composer, precisamos criar o arquivo `composer.json` na raiz do projeto:</p>

```json
{ "require": { "php-amqplib/php-amqplib": "^3.1", "phpseclib/phpseclib": "^3.0" } }
```

<h2 id="heading-criando-o-consumidor-com-nodejs">Criando o consumidor com Node.js</h2>
<p>Agora, vamos criar o diretório `node-app` e o arquivo `Dockerfile` dentro dele:</p>

```bash
mkdir node-app && touch node-app/Dockerfile
```

<p>No arquivo `Dockerfile`, vamos definir a imagem base e copiar os arquivos da aplicação:</p>

```dockerfile
FROM node:14 
WORKDIR /usr/src/app 
COPY package\*.json ./ 
RUN npm install 
COPY . . 
CMD \["node", "subscriber.js"\]
```

<p>Neste arquivo, definimos a imagem base `node:14`, copiamos os arquivos da aplicação para o diretório `/usr/src/app`, instalamos as dependências do Node.js e executamos o script `subscriber.js`.</p>
<p>Agora, vamos criar o arquivo `subscriber.js` na raiz do projeto:</p>

```javascript
const amqp = require('amqplib');

async function connectWithRetry() {
    const maxRetries = 5;
    const retryDelay = 5000;

    for (let attempt = 1; attempt try {
            const connection = await amqp.connect('amqp://rabbitmq');
            return connection;
        } catch (err) {
            console.error(`Not possible to connect to RabbitMQ. Retrying in ${retryDelay}ms. Attempt ${attempt} of ${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    throw new Error(`Failed to connect to RabbitMQ after ${maxRetries} attempts`);
}

async function receiveMessages() {
    try {
        const connection = await connectWithRetry();
        const channel = await connection.createChannel();
        const queue = 'hello';

        await channel.assertQueue(queue, { durable: false });

        console.log(" [*] Waiting for messages in %s.", queue);

        channel.consume(queue, function (msg) {
            console.log(" [x] Received: %s", msg.content.toString());
        }, {
            noAck: true
        });

    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

receiveMessages();
```

<p>Neste arquivo, criamos uma conexão com o RabbitMQ, declaramos uma fila chamada `hello` e consumimos as mensagens dessa fila.</p>
<p>Em seguida, exibimos as mensagens no terminal. Assim como no produtor, estamos tentando conectar ao RabbitMQ várias vezes, com um intervalo de 5 segundos entre as tentativas. Isso é importante para garantir que o consumidor consiga se conectar ao RabbitMQ mesmo que ele não esteja disponível imediatamente.</p>
<p>E para instalar as dependências do RabbitMQ, precisamos criar o arquivo `package.json` na raiz do projeto:</p>

```json
{ "name": "node-app", "version": "1.0.0", "description": "", "main": "subscriber.js", "dependencies": { "amqplib": "^0.8.0" }, "author": "", "license": "ISC" }
```

<h2 id="heading-executando-a-aplicacao">Executando a aplicação</h2>
<p>Agora que criamos os serviços do RabbitMQ, do produtor e do consumidor, vamos executar a aplicação com o Docker Compose:</p>

```bash
docker compose up --build
```

<p>Isso irá criar os containers dos serviços e executar a aplicação. Você verá as mensagens enviadas pelo produtor sendo exibidas no terminal pelo consumidor.</p>
<p>O RabbitMQ também estará disponível na porta 15672, onde você pode acessar a interface de gerenciamento e visualizar as filas e as mensagens.</p>
<p>Com isso, criamos uma aplicação de microserviços com PHP, RabbitMQ e Docker. Essa abordagem arquitetural permite escalar cada parte do sistema de forma independente e garante a entrega das mensagens na ordem correta.</p>
<p>Espero que este artigo tenha sido útil e que você possa aplicar esses conceitos em seus projetos. Se tiver alguma dúvida ou sugestão, deixe nos comentários.</p>
<p>Qualquer dúvida, estou à disposição.</p>
<p>Link do Repositório: <a target="_blank" href="https://github.com/sschonss/ms-rabbitmq">Microservices e Mensageria com PHP, RabbitMQ e Docker</a></p>
