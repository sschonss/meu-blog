---
title: 'Microservices and Messaging with PHP, NodeJS, RabbitMQ and Docker'
date: 2024-06-29
translationKey: microservices-e-mensageria-com-php-nodejs-rabbitmq-e-docker
draft: false
tags: ['Microservices', 'Messaging', 'PHP', 'Docker']
---

<p>Microservices development is an architectural approach that structures an application as a set of small, independent services, each running in its own process and communicating through lightweight protocols such as HTTP, WebSockets or AMQP.</p>
<p>In this article, we will build a microservices application with PHP, RabbitMQ and Docker. RabbitMQ is messaging software that implements AMQP (Advanced Message Queuing Protocol), an asynchronous messaging protocol.</p>
<h3 id="heading-what-is-rabbitmq">What is RabbitMQ?</h3>
<p>Imagine the following scenario: you have a system that needs to send emails to users. Instead of sending the emails directly, you can send a message to a message queue, which will be consumed by a service that sends the emails. That is what RabbitMQ does: it receives messages from producers and delivers them to consumers.</p>
<p>This decouples producing messages from consuming them, which lets you scale each part of the system independently. RabbitMQ also makes sure messages are delivered in the right order and are not lost.</p>
<h3 id="heading-application-architecture">Application architecture</h3>
<p>Our application will have two microservices: a producer and a consumer. The producer sends messages to a message queue, and the consumer reads the messages and prints them to the terminal.</p>
<p>Our first step is to create the <code>docker-compose.yml</code> file to define our application's services:</p>

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

<p>In this file, we define three services: <code>rabbitmq</code>, <code>php-app</code> and <code>node-app</code>. The <code>rabbitmq</code> service is based on the <code>rabbitmq:3-management</code> image, which includes the RabbitMQ management UI. The <code>php-app</code> and <code>node-app</code> services are based on custom images we are going to build.</p>
<h3 id="heading-building-the-producer-with-php">Building the producer with PHP</h3>
<p>Now let's create the <code>php-app</code> directory and a <code>Dockerfile</code> inside it:</p>

```bash
mkdir php-app && touch php-app/Dockerfile
```

<p>In the <code>Dockerfile</code>, we define the base image and copy the application files:</p>

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

<p>In this file, we use the <code>php:7.4-cli</code> base image and install the dependencies needed for RabbitMQ and Composer. Then we copy the application files into <code>/usr/src/myapp</code>, install the Composer dependencies and run the <code>publisher.php</code> script.</p>
<p>Now let's create the <code>publisher.php</code> file at the project root:</p>

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

<p>In this file, we open a connection to RabbitMQ, declare a queue called `hello` and send a message to it. Then we close the connection. Notice that we try to connect to RabbitMQ several times, waiting 5 seconds between attempts.</p>
<p>This matters to make sure the application can connect to RabbitMQ even if it is not available right away. It is a common practice in distributed applications, where service availability can vary over time; look up the `circuit breaker` and `retry pattern` patterns to learn more.</p>
<p>To install the RabbitMQ dependencies with Composer, we need to create a `composer.json` file at the project root:</p>

```json
{ "require": { "php-amqplib/php-amqplib": "^3.1", "phpseclib/phpseclib": "^3.0" } }
```

<h2 id="heading-building-the-consumer-with-nodejs">Building the consumer with Node.js</h2>
<p>Now let's create the `node-app` directory and a `Dockerfile` inside it:</p>

```bash
mkdir node-app && touch node-app/Dockerfile
```

<p>In the `Dockerfile`, we define the base image and copy the application files:</p>

```dockerfile
FROM node:14 
WORKDIR /usr/src/app 
COPY package\*.json ./ 
RUN npm install 
COPY . . 
CMD \["node", "subscriber.js"\]
```

<p>In this file, we use the `node:14` base image, copy the application files into `/usr/src/app`, install the Node.js dependencies and run the `subscriber.js` script.</p>
<p>Now let's create the `subscriber.js` file at the project root:</p>

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

<p>In this file, we open a connection to RabbitMQ, declare a queue called `hello` and consume the messages from it.</p>
<p>Then we print the messages to the terminal. Just like in the producer, we try to connect to RabbitMQ several times, waiting 5 seconds between attempts. This makes sure the consumer can connect to RabbitMQ even if it is not available right away.</p>
<p>And to install the RabbitMQ dependencies, we need to create a `package.json` file at the project root:</p>

```json
{ "name": "node-app", "version": "1.0.0", "description": "", "main": "subscriber.js", "dependencies": { "amqplib": "^0.8.0" }, "author": "", "license": "ISC" }
```

<h2 id="heading-running-the-application">Running the application</h2>
<p>Now that we have the RabbitMQ, producer and consumer services, let's run the application with Docker Compose:</p>

```bash
docker compose up --build
```

<p>This will create the service containers and run the application. You will see the messages sent by the producer printed to the terminal by the consumer.</p>
<p>RabbitMQ will also be available on port 15672, where you can open the management UI and see the queues and messages.</p>
<p>With that, we have built a microservices application with PHP, RabbitMQ and Docker. This architectural approach lets you scale each part of the system independently and guarantees that messages are delivered in the right order.</p>
<p>I hope this article was useful and that you can apply these concepts in your projects. If you have any questions or suggestions, leave them in the comments.</p>
<p>Feel free to reach out with any questions.</p>
<p>Repository: <a target="_blank" href="https://github.com/sschonss/ms-rabbitmq">Microservices and Messaging with PHP, RabbitMQ and Docker</a></p>
