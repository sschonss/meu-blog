---
title: 'Event-driven Architecture (EDA)'
date: 2024-08-03
source: https://luizschons.com/event-driven-architecture-eda-2775822e52cf
draft: false
aliases: ["/event-driven-architecture-eda-2775822e52cf/"]
---

Arquitetura de software envolve muitos trade-offs. Uma escolha inadequada pode gerar retrabalho e atrasos, por isso é importante conhecer as opções disponíveis e entender quando cada uma faz sentido.

Neste artigo, vamos falar sobre a Arquitetura Orientada a Eventos (Event-driven Architecture — EDA), um estilo cuja principal característica é a comunicação entre serviços por meio de eventos.

### O que é EDA?

A Arquitetura Orientada a Eventos promove a produção, detecção, consumo e reação a eventos. Um evento pode ser qualquer fato relevante para o sistema: uma alteração de estado, uma ação do usuário, um erro ou uma mensagem recebida.

Os eventos são mensagens assíncronas geradas por um produtor e consumidas por um ou mais consumidores. O produtor não precisa conhecer os consumidores, e os consumidores não precisam conhecer os produtores. Isso permite construir sistemas mais desacoplados, escaláveis e flexíveis.

No exemplo deste artigo, vamos simular o seguinte cenário:

![Fluxo da arquitetura orientada a eventos](/images/posts/event-driven-architecture-eda-2775822e52cf/fc4eed68-02f7-4b90-9ff9-8eb40d9c2fd0.png)

### Exemplo prático

O sistema é composto por quatro serviços.

#### `ecommerce-frontend`

- Frontend de um e-commerce que permite adicionar produtos ao carrinho.
- Usa React para criar a interface do usuário.

![Frontend do e-commerce](/images/posts/event-driven-architecture-eda-2775822e52cf/735c553b-591e-4b72-92dc-a186c441bae4.png)

#### `stock-service`

- Gerencia o estoque dos produtos.
- Usa PHP para se comunicar com o RabbitMQ.

Um exemplo simplificado de publicação de um evento de estoque em PHP:

```php
$message = new AMQPMessage(json_encode([
    'order_id' => 1,
    'status' => 'updated',
]));

$channel->basic_publish($message, '', 'stock_updated');
```

O código acima é apenas um exemplo didático, não um código funcional ou seguro para produção.

#### `payment-service`

- Processa os pagamentos dos pedidos.
- Usa Python para se comunicar com o RabbitMQ.

```python
def process_payment(order):
    print(f"Processando pagamento do pedido: {order['order_id']}")
    return True
```

#### `rabbitmq`

- Servidor de mensageria que permite a comunicação entre os serviços.
- Recebe os eventos publicados e os encaminha para os consumidores interessados.

![Comunicação entre os serviços](/images/posts/event-driven-architecture-eda-2775822e52cf/f89afcd2-0cc9-4390-837c-6fafa44d770a.png)

O código completo está disponível no [repositório do projeto](https://github.com/sschonss/event-driver).

### Fluxo de comunicação

1. O usuário acessa o frontend do e-commerce e adiciona um produto ao carrinho.
2. O frontend envia uma requisição ao serviço de estoque para realizar o checkout.
3. O serviço de estoque verifica a disponibilidade e publica um evento no RabbitMQ.
4. O serviço de pagamentos consome o evento e processa o pagamento.
5. O serviço de pagamentos publica um evento informando o resultado do processamento.

### Trade-offs

Esse fluxo é um exemplo simples de como a EDA pode desacoplar serviços e permitir comunicação assíncrona sem que produtores e consumidores precisem conhecer uns aos outros. Cada serviço fica responsável por uma tarefa e pode ser substituído ou atualizado com menor impacto nos demais.

Por outro lado, a arquitetura orientada a eventos aumenta a complexidade operacional. É necessário lidar com ordenação, entrega, idempotência, rastreabilidade e depuração de problemas distribuídos.

Por isso, antes de adotar EDA, avalie se os benefícios compensam essa complexidade para o seu projeto.

### Conclusão

A Arquitetura Orientada a Eventos é uma alternativa poderosa para criar sistemas desacoplados, flexíveis e resilientes. Não existe uma arquitetura perfeita: a melhor escolha depende dos requisitos, das restrições e da maturidade operacional do projeto.

O [código completo está disponível no GitHub](https://github.com/sschonss/event-driver).
