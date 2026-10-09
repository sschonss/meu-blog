---
title: 'Corrotinas no PHP: Swoole e Hyperf na prática'
date: 2026-10-16
description: 'O que muda quando o PHP deixa de ser um processo por requisição: o modelo do PHP-FPM, o Swoole, as corrotinas e o Hyperf, com uma demo que compara os três rodando o mesmo endpoint.'
translationKey: corrotinas-no-php-swoole-e-hyperf
tags: ['PHP', 'Performance', 'Hyperf']
draft: true
---

Quase todo mundo que trabalha com PHP aprendeu o mesmo modelo: chega uma requisição, um processo do PHP-FPM executa o script do começo ao fim, responde e esquece tudo. Esse modelo é simples e funciona muito bem. Mas ele tem um custo que quase ninguém mede: o tempo que o processo passa **parado, esperando**.

Neste artigo eu mostro o que muda quando o PHP passa a rodar como um servidor de verdade, com o **Swoole**, e como as **corrotinas** aproveitam esse tempo de espera. No fim, o **Hyperf**, que é um framework construído em cima disso. Tudo isso é assunto da minha palestra sobre Hyperf, e montei um repositório com uma demo que você roda com um `docker compose up`:

**[github.com/sschonss/hyperf-coroutines](https://github.com/sschonss/hyperf-coroutines)**

## O cenário da demo

Um endpoint `/report` monta um relatório consultando três serviços: usuários, pedidos e pagamentos. Cada um demora 200 ms para responder, como uma consulta ao banco ou uma chamada HTTP faria. O código é PHP comum:

```php
function fetch_json(string $path): array
{
    $body = file_get_contents(upstream_url() . $path);

    return json_decode((string) $body, true, flags: JSON_THROW_ON_ERROR);
}

function build_report_sequential(): array
{
    return [
        'user' => fetch_json('/users/42'),
        'orders' => fetch_json('/orders?user=42'),
        'payments' => fetch_json('/payments?user=42'),
    ];
}
```

Três chamadas, uma depois da outra: cerca de 600 ms. Esse mesmo arquivo vai rodar no PHP-FPM e no Swoole, sem mudar uma linha.

## Como o PHP-FPM funciona

O PHP-FPM mantém um grupo de processos (o *pool*). Cada processo atende **uma requisição por vez**: recebe, executa o script, responde e só então pega a próxima.

Durante os 600 ms do nosso relatório, o processo passa quase todo o tempo esperando a rede. Ele não está calculando nada, mas também não pode atender mais ninguém. Com 4 processos no pool, a conta é direta: no máximo 4 requisições ao mesmo tempo, e cerca de 4 ÷ 0,6 s ≈ **6,7 requisições por segundo**. A 5ª requisição fica na fila.

A solução clássica é aumentar o pool. Funciona, mas cada processo custa memória, e o framework continua sendo carregado do zero a cada requisição.

## O que é o Swoole

O [Swoole](https://www.swoole.com/) é uma extensão do PHP escrita em C que transforma o PHP em um servidor de longa duração, como Node.js ou Go. Em vez de o Nginx entregar cada requisição para um processo novo, o próprio PHP abre a porta e atende as requisições:

```php
$server = new Swoole\Http\Server('0.0.0.0', 9501);
$server->set(['worker_num' => 1, 'hook_flags' => SWOOLE_HOOK_ALL]);

$server->on('request', function ($request, $response) {
    $response->end(json_encode(build_report_sequential()));
});

$server->start();
```

Duas coisas mudam aqui:

1. **O processo não morre.** O código é carregado uma vez, quando o worker sobe, e fica na memória atendendo requisição atrás de requisição.
2. **Cada requisição roda em uma corrotina.** E é aqui que está o ganho.

## Corrotinas, sem mistério

Uma corrotina é uma função que pode **pausar no meio** e continuar depois. Quando uma corrotina vai esperar alguma coisa, como a rede, um arquivo ou o banco, ela devolve o controle para o *scheduler* do Swoole, que roda outra corrotina enquanto isso. Tudo isso acontece em um único processo e uma única thread.

O primeiro exemplo do repositório mostra a diferença com três tarefas de 300 ms:

```php
use Swoole\Coroutine;
use function Swoole\Coroutine\run;

run(function () {
    foreach (['A', 'B', 'C'] as $task) {
        Coroutine::create(function () use ($task) {
            echo "{$task} começa\n";
            Coroutine::sleep(0.3); // pausa e deixa outra corrotina rodar
            echo "{$task} termina\n";
        });
    }
});
```

```text
PHP comum (uma coisa por vez)        Corrotinas (as esperas se sobrepõem)
     0 ms  A começa                       0 ms  A começa
   300 ms  A termina                      0 ms  B começa
   300 ms  B começa                       0 ms  C começa
   600 ms  B termina                    302 ms  A termina
   600 ms  C começa                     302 ms  C termina
   900 ms  C termina                    302 ms  B termina
  total: 901 ms                        total: 302 ms
```

As três esperas acontecem ao mesmo tempo. Não é paralelismo de CPU: é aproveitar o tempo em que o processo ficaria parado.

### Runtime hooks: o mesmo código, sem bloquear

"Mas o meu código usa `file_get_contents`, PDO e Guzzle, não `Coroutine::sleep`." É aí que entram os **runtime hooks**. Com `SWOOLE_HOOK_ALL`, o Swoole troca as funções bloqueantes do PHP por versões que pausam a corrotina em vez de travar o processo:

```text
Hooks desligados: 3 x usleep(300ms) em corrotinas levaram 900 ms
Hooks ligados:    3 x usleep(300ms) em corrotinas levaram 302 ms
```

É por isso que o `src/report.php` da demo roda no Swoole sem nenhuma mudança: o `file_get_contents` continua lá, mas agora, enquanto ele espera, o worker atende outras requisições.

### Fazendo as três chamadas ao mesmo tempo

Os hooks resolvem o problema *entre* requisições: um worker atende várias ao mesmo tempo. Mas cada requisição continua levando 600 ms, porque as três chamadas ainda são feitas uma depois da outra. Para fazer as três ao mesmo tempo, dentro da mesma requisição, usamos um `WaitGroup`:

```php
$report = [];
$wg = new Swoole\Coroutine\WaitGroup();

foreach ($calls as $key => $path) {
    $wg->add();
    Swoole\Coroutine::create(function () use ($key, $path, &$report, $wg) {
        $report[$key] = fetch_json($path);
        $wg->done();
    });
}

$wg->wait(); // pausa só esta requisição, não o worker
```

Agora a requisição leva o tempo da chamada mais lenta, cerca de 200 ms, e não a soma delas. O exemplo 02 do repositório também mostra o `Channel`, que serve para limitar quantas tarefas rodam ao mesmo tempo.

## O Hyperf

Escrever tudo direto no Swoole funciona, mas você perde o que um framework dá: rotas, injeção de dependência, middlewares, validação, ORM, filas. O [Hyperf](https://hyperf.io) é um framework PHP construído para rodar em cima do Swoole, com tudo isso já preparado para corrotinas.

O mesmo relatório em Hyperf fica assim:

```php
use function Hyperf\Coroutine\parallel;

class ReportController
{
    private Client $http;

    public function __construct(ClientFactory $clients)
    {
        $this->http = $clients->create(['base_uri' => 'http://upstream:9502']);
    }

    public function parallel(): array
    {
        return parallel([
            'user' => fn () => $this->get('/users/42'),
            'orders' => fn () => $this->get('/orders?user=42'),
            'payments' => fn () => $this->get('/payments?user=42'),
        ]);
    }
}
```

O `parallel()` faz o papel do `WaitGroup`. O `ClientFactory` entrega um Guzzle que, dentro de uma corrotina, usa o cliente HTTP do Swoole, então a chamada não bloqueia o worker. E o controller recebe as dependências pelo construtor, como em qualquer framework moderno.

## Os números

O CI do repositório roda o mesmo teste de carga nos três runtimes: 300 requisições, 50 ao mesmo tempo, cada uma chamando os três serviços de 200 ms. O PHP-FPM tem 4 processos. O Swoole e o Hyperf têm **um único** worker.

| Runtime | Requisições/s | Latência média | p95 |
| --- | ---: | ---: | ---: |
| PHP-FPM, 4 workers, sequencial | 6,5 | 7.679 ms | 7.885 ms |
| Swoole, 1 worker, mesmo código sequencial | 70,2 | 712 ms | 627 ms |
| Swoole, 1 worker, corrotinas em paralelo | **201,1** | **249 ms** | 257 ms |
| Hyperf, 1 worker, sequencial | 70,1 | 713 ms | 625 ms |
| Hyperf, 1 worker, `parallel()` | **200,1** | **250 ms** | 232 ms |

Alguns pontos chamam atenção:

- **O PHP-FPM bateu a conta:** 6,5 requisições por segundo, praticamente os 6,7 previstos. A latência média passou de 7 segundos porque, com 50 requisições chegando e só 4 processos livres, quase todo o tempo é **fila**: a requisição espera um processo ficar livre antes de começar os 600 ms dela.
- **Um único worker do Swoole, com exatamente o mesmo código, atendeu 11 vezes mais.** Nada no `src/report.php` mudou. A diferença é que, enquanto uma requisição espera a rede, as outras andam.
- **Com as chamadas em paralelo, foram 30 vezes mais**, e cada requisição levou o tempo da chamada mais lenta.
- **O Hyperf ficou praticamente igual ao Swoole puro.** O framework não cobra um preço visível por rotas, injeção de dependência e o resto, porque tudo é carregado uma vez só, quando o worker sobe.

Os números exatos variam de máquina para máquina, mas a proporção se mantém. O resultado da última execução fica sempre em [`results/benchmark.md`](https://github.com/sschonss/hyperf-coroutines/blob/main/results/benchmark.md).

## As diferenças que pegam de surpresa

Trocar de modelo não é só ganho. Algumas coisas que no PHP-FPM simplesmente não existem passam a importar.

**O estado sobrevive entre requisições.** No PHP-FPM, cada requisição começa do zero. No Swoole, variáveis estáticas, singletons e globais vivem enquanto o worker viver e são compartilhados por todas as requisições. O endpoint `/counter` da demo mostra isso: no PHP-FPM ele sempre responde 1, no Swoole ele não para de crescer.

O caso mais perigoso é guardar "o usuário atual" em uma propriedade estática, um hábito comum no PHP-FPM. Com duas requisições ao mesmo tempo, uma sobrescreve a outra enquanto espera o banco:

```text
Propriedade estática (hábito do FPM):
  requisição do Bruno -> gravou o pedido como Bruno
  requisição da Ana   -> gravou o pedido como Bruno   <-- usuário errado!

Contexto da corrotina:
  requisição do Bruno -> gravou o pedido como Bruno
  requisição da Ana   -> gravou o pedido como Ana
```

A solução é guardar dados da requisição no contexto da corrotina: `Coroutine::getContext()` no Swoole, ou `Hyperf\Context\Context` no Hyperf. No Hyperf vale lembrar que os controllers também são instanciados uma vez só, então uma propriedade do controller é compartilhada por todas as requisições.

**Corrotina não acelera CPU.** As corrotinas se revezam em uma única thread. Se o código está calculando, e não esperando, ele não pausa, e todas as outras requisições daquele worker ficam paradas. O exemplo 05 mostra isso: três tarefas pesadas levam o mesmo tempo com ou sem corrotinas. Para trabalho pesado de CPU, use mais workers, *task workers* do Swoole ou uma fila.

**Vazamento de memória vira problema.** Um array que cresce a cada requisição no PHP-FPM é descartado no fim dela. Num worker que roda por dias, ele cresce até derrubar o processo. A opção `max_request` reinicia o worker de tempos em tempos, mas o certo é não acumular estado.

**Nem toda biblioteca está pronta.** Os hooks cobrem as funções mais comuns, como streams, sockets, PDO, sleep e cURL, mas uma extensão que faz I/O por conta própria pode continuar bloqueando o worker inteiro. Vale testar antes.

**O deploy muda.** Como o código fica carregado na memória, alterar um arquivo não muda nada até reiniciar o servidor.

## Quando vale a pena

O Swoole e o Hyperf brilham quando a aplicação passa a maior parte do tempo **esperando**: APIs que agregam outros serviços, gateways, websockets, consumidores de fila, qualquer coisa com muita chamada de rede. Nesses casos, um worker faz o trabalho de dezenas de processos do PHP-FPM.

Para uma aplicação tradicional, que consulta o banco e renderiza uma página, o PHP-FPM continua ótimo e é mais simples de operar. Não é uma troca obrigatória. É mais uma ferramenta, e agora você sabe o que ela faz por baixo.

O repositório tem tudo para você testar na sua máquina, inclusive os exemplos das armadilhas. Se rodar e encontrar algo diferente, me conta nos comentários.
