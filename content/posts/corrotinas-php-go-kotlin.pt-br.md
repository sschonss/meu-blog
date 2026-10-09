---
title: 'Corrotinas no PHP, no Go e no Kotlin: o mesmo problema, três respostas'
date: 2026-10-23
description: 'WaitGroup, channels, schedulers e o custo de cada corrotina: os mesmos quatro cenários escritos em PHP com Swoole, em Go e em Kotlin, e o que muda por baixo.'
translationKey: corrotinas-php-go-kotlin
series: ['Concorrência no PHP']
tags: ['PHP', 'Go', 'Kotlin']
draft: true
---

No [artigo anterior](/pt-br/posts/corrotinas-no-php-swoole-e-hyperf/) eu mostrei como o Swoole e o Hyperf usam corrotinas para um único processo PHP atender centenas de requisições enquanto elas esperam a rede. Quem já programou em Go provavelmente teve um *déjà vu* lendo aquele código: `Coroutine::create`, `WaitGroup`, `Channel`. Não é coincidência. O Swoole trouxe para o PHP praticamente o mesmo modelo do Go.

Neste artigo eu dou um passo atrás e explico as ideias por trás disso, comparando três linguagens que tratam corrotinas de jeitos diferentes: **PHP com Swoole**, **Go** e **Kotlin**. Escrevi os mesmos quatro cenários nas três, e o resultado de cada uma está no mesmo repositório do artigo anterior:

**[github.com/sschonss/hyperf-coroutines/tree/main/languages](https://github.com/sschonss/hyperf-coroutines/tree/main/languages)**

## Concorrência não é paralelismo

Antes do código, a distinção que mais importa aqui:

- **Concorrência** é lidar com várias coisas ao mesmo tempo: começar a segunda tarefa enquanto a primeira está esperando.
- **Paralelismo** é **executar** várias coisas ao mesmo tempo, em vários núcleos da CPU.

Um garçom atendendo várias mesas é concorrência: ele anota um pedido, leva para a cozinha e, enquanto o prato fica pronto, atende outra mesa. Dois garçons é paralelismo. Corrotinas são, antes de tudo, uma ferramenta de **concorrência**. Se e como elas também viram paralelismo é justamente onde as três linguagens se separam.

## Quem decide quem roda: o scheduler

Uma corrotina precisa de alguém que decida quando ela pausa e qual roda em seguida. Esse alguém é o *scheduler*, e cada linguagem tem o seu:

- **Swoole:** um scheduler por processo, rodando em uma única thread. Uma corrotina só cede a vez quando vai esperar alguma coisa (rede, disco, `sleep`) ou quando chama algo que pausa explicitamente. É um modelo **cooperativo** por padrão: se uma corrotina fica calculando, ninguém mais roda naquele processo. (O Swoole tem uma opção de escalonamento preemptivo, `enable_preemptive_scheduler`, mas continua sendo uma thread só.)
- **Go:** o *runtime* do Go distribui milhares de goroutines entre algumas threads do sistema, por padrão uma por núcleo (`GOMAXPROCS`). Desde o Go 1.14, ele também consegue interromper uma goroutine que está calculando há tempo demais. Ou seja, as goroutines rodam **em paralelo** e o scheduler é **preemptivo**.
- **Kotlin:** as corrotinas rodam em um *dispatcher*, e você escolhe qual. O `runBlocking` usa uma única thread, parecido com o Swoole. O `Dispatchers.Default` é um pool de threads com uma por núcleo, parecido com o Go. O `Dispatchers.IO` é um pool maior, para código que bloqueia.

Guarde isso, porque explica quase todas as diferenças dos números mais abaixo.

## Cenário 1: esperar várias coisas de uma vez

Três tarefas que esperam 300 ms cada. Em PHP com Swoole e em Go, o código é praticamente uma tradução linha a linha:

```php
// PHP + Swoole
$wg = new WaitGroup();
foreach ([1, 2, 3] as $task) {
    $wg->add();
    Coroutine::create(function () use ($wg) {
        Coroutine::sleep(0.3);
        $wg->done();
    });
}
$wg->wait();
```

```go
// Go
var wg sync.WaitGroup
for task := 0; task < 3; task++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        time.Sleep(300 * time.Millisecond)
    }()
}
wg.Wait()
```

O Kotlin não precisa de `WaitGroup`:

```kotlin
// Kotlin
coroutineScope {
    repeat(3) { launch { delay(300) } }
}
```

O `coroutineScope` só termina quando todas as corrotinas criadas dentro dele terminam. Isso se chama **concorrência estruturada**: as corrotinas têm um "pai", e o pai espera os filhos. Se uma delas falha, as outras são canceladas. No Swoole e no Go, esquecer um `done()` ou deixar uma goroutine rodando para sempre é um erro comum. No Kotlin, isso é bem mais difícil de acontecer.

Nas três linguagens, o resultado é o mesmo: cerca de **300 ms**, e não 900.

## Cenário 2: um pool de workers com channel

Dez tarefas de 100 ms, mas no máximo três rodando ao mesmo tempo. Três corrotinas leem de um *channel*, que funciona como uma fila entre elas:

```php
// PHP + Swoole
$jobs = new Channel(10);
for ($worker = 0; $worker < 3; $worker++) {
    Coroutine::create(function () use ($jobs) {
        while (($job = $jobs->pop()) !== false) {
            Coroutine::sleep(0.1);
        }
    });
}
```

```go
// Go
jobs := make(chan int, 10)
for worker := 0; worker < 3; worker++ {
    go func() {
        for range jobs {
            time.Sleep(100 * time.Millisecond)
        }
    }()
}
```

```kotlin
// Kotlin
val jobs = Channel<Int>(10)
repeat(3) {
    launch { for (job in jobs) delay(100) }
}
```

É a mesma ideia nas três: quem produz faz `push`/`<-`/`send`, quem consome faz `pop`/`range`/`for`, e fechar o channel avisa os consumidores que acabou. Dez tarefas em rodadas de três levam quatro rodadas, cerca de **400 ms** em todas.

Esse padrão aparece muito no dia a dia: limitar quantas chamadas uma API externa recebe ao mesmo tempo, processar uma fila com um número fixo de consumidores, montar um pipeline em etapas.

## Cenário 3: 100 mil corrotinas

Aqui as diferenças começam. Criamos 100 mil corrotinas, cada uma esperando 1 segundo, e medimos quanta memória cada uma custa:

| | Tempo total | Memória por corrotina |
| --- | ---: | ---: |
| PHP + Swoole | 2.065 ms | ~9,1 KB |
| Go | 1.114 ms | ~2,7 KB |
| Kotlin | 1.780 ms | **~0,2 KB** |

As três aguentam 100 mil sem esforço, coisa impensável com threads ou processos. Mas o custo de cada uma é bem diferente, e o motivo é como cada linguagem guarda o "onde eu parei" de uma corrotina pausada:

- **Go e Swoole usam corrotinas com pilha** (*stackful*). Cada corrotina tem a sua própria pilha de execução, como uma thread em miniatura. No Go, ela começa com 2 KB e cresce quando precisa. No Swoole, cada corrotina tem a sua própria pilha da máquina virtual do PHP, que é o que a medição mostra, e ainda uma pilha em C reservada pela extensão.
- **Kotlin usa corrotinas sem pilha** (*stackless*). O compilador transforma cada função `suspend` em uma pequena máquina de estados, e uma corrotina pausada é só um objeto com as variáveis que ela vai precisar quando voltar. Por isso cabe em uns 200 bytes.

## Cenário 4: trabalho pesado de CPU

Quatro tarefas que só calculam (um milhão de hashes MD5 cada), primeiro uma depois da outra e depois em corrotinas, numa máquina com 2 núcleos. Cada medição roda 5 vezes e vale a mediana, e o cálculo foi escrito para não alocar memória, para o coletor de lixo do Go e da JVM não atrapalhar a comparação:

| | Uma por vez | Em corrotinas | Ganho |
| --- | ---: | ---: | ---: |
| PHP + Swoole | 601 ms | 591 ms | **1,0x** |
| Go | 551 ms | 369 ms | **1,5x** |
| Kotlin (`Dispatchers.Default`) | 545 ms | 369 ms | **1,5x** |

Aqui aparece o que vimos sobre os schedulers:

- **No Swoole, não muda nada.** As corrotinas de um processo se revezam em uma única thread, e cálculo não tem espera para aproveitar. Para usar vários núcleos no PHP, a resposta continua sendo mais processos: mais workers no servidor ou *task workers*.
- **No Go, as goroutines se espalham pelos núcleos sozinhas**, sem mudar uma linha.
- **No Kotlin, foi preciso pedir:** o mesmo código no `runBlocking` rodaria em uma thread só, como o Swoole. Com o `Dispatchers.Default`, ele usou os dois núcleos.

O ideal com 2 núcleos seria 2x. As máquinas do GitHub Actions costumam entregar 2 núcleos virtuais que são, na verdade, duas threads do mesmo núcleo físico, e aí o ganho fica por volta de 1,5x. Numa máquina com 2 núcleos de verdade, o mesmo programa em Go chegou a 2,0x.

Não compare as linhas entre si: cada linguagem calcula MD5 de um jeito, e o PHP tem o MD5 escrito em C. O que importa é a última coluna, o quanto cada uma ganha ao rodar em paralelo.

## A diferença que não aparece nos números: a "cor" das funções

Tem uma diferença que muda muito o dia a dia e que nenhum benchmark mostra.

No Kotlin, uma função que pode pausar precisa ser marcada com `suspend`, e só pode ser chamada de dentro de outra função `suspend` ou de uma corrotina. No JavaScript é igual com `async` e `await`. Isso divide o código em dois "tipos" de função, e trocar uma função de tipo obriga a mudar todas que a chamam. É o que se costuma chamar de **funções coloridas**.

O Go e o Swoole não têm isso. No Go, qualquer função pode bloquear e o runtime cuida do resto. No Swoole, os runtime hooks fazem o mesmo com funções que já existem: um `file_get_contents`, uma consulta PDO ou uma chamada do Guzzle passam a pausar a corrotina sem nenhuma marcação. É por isso que, no artigo anterior, o mesmo arquivo rodou no PHP-FPM e no Swoole sem mudar uma linha.

As duas abordagens têm um lado bom e um lado ruim:

- **Com cor (Kotlin, JavaScript):** você **vê** no código onde ele pode pausar, e o compilador ajuda. Em troca, código antigo precisa ser adaptado.
- **Sem cor (Go, Swoole):** código antigo funciona como está. Em troca, qualquer chamada pode pausar sem aviso, e é exatamente isso que faz o "usuário atual" guardado numa propriedade estática ser trocado por outro, como no exemplo da armadilha do artigo anterior.

## As três lado a lado

| | PHP + Swoole | Go | Kotlin |
| --- | --- | --- | --- |
| Criar | `Coroutine::create(fn)` | `go fn()` | `launch { }` |
| Esperar várias | `WaitGroup` | `sync.WaitGroup` | `coroutineScope` (estruturada) |
| Comunicar | `Channel` | `chan` | `Channel` |
| Tipo de corrotina | Com pilha (~9 KB) | Com pilha (~2,7 KB) | Sem pilha (~0,2 KB) |
| Scheduler | Cooperativo, 1 thread por processo | Preemptivo, várias threads | Depende do dispatcher |
| Vários núcleos | Só com mais processos | Automático | Com `Dispatchers.Default` |
| Marcar funções que pausam | Não (runtime hooks) | Não | Sim (`suspend`) |

## O que fica disso

Para quem vem do PHP, a boa notícia é que o modelo do Swoole não é uma invenção isolada: é o mesmo do Go, com `WaitGroup` e `Channel` funcionando do mesmo jeito. Aprender um ajuda a entender o outro. O Hyperf, por sua vez, esconde a maior parte disso atrás de coisas como o `parallel()`.

A principal limitação do PHP aqui é a CPU: um processo usa um núcleo, e para usar mais é preciso mais processos. Para o que o PHP mais faz na web, que é esperar banco, cache e outras APIs, isso quase nunca é o gargalo. E, como mostrou o artigo anterior, é justamente esperando que as corrotinas fazem diferença.

O código dos quatro cenários nas três linguagens está no [repositório](https://github.com/sschonss/hyperf-coroutines/tree/main/languages), e o resultado da última execução, em [`results/languages.md`](https://github.com/sschonss/hyperf-coroutines/blob/main/results/languages.md). Se você usa outra linguagem com corrotinas, como Rust, Python ou C#, me conta nos comentários como ela se compara.
