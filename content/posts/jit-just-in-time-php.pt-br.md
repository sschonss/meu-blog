---
title: 'JIT (Just in Time) — PHP'
date: 2024-05-28
source: https://luizschons.com/jit-just-in-time-php
translationKey: jit-just-in-time-php
draft: false
aliases: ["/jit-just-in-time-php/"]
tags: ['PHP', 'Performance']
---

<p>Se você ainda não atualizou para o PHP 8.0 ou maior, está na hora de fazer isso. O PHP 8.0 foi lançado em 26 de novembro de 2020 e trouxe o JIT (Just In Time) e é sobre ele que vamos falar hoje.</p>
<h3 id="heading-codigo-opc">Código OPC</h3>
<p>Quando você executa um script PHP, o PHP o compila para um código intermediário chamado de código OPC (PHP Opcode). O código OPC é então executado pela máquina virtual Zend.</p>
<p>Segue um exemplo de código PHP e seu código OPC:</p>
<p><strong>PHP:</strong></p>

```php
$a = M_PI;
$b = 10 + sin($a);
echo "Result: ", $b;
```

<p><strong>Código OPC:</strong></p>

```text
Finding entry points
Branch analysis from position: 0
1 jumps found. (Code = 62) Position 1 = -2
filename:       /in/ceTlX
function name:  (null)
number of ops:  9
compiled vars:  !0 = $a, !1 = $b
line      #* E I O op                           fetch          ext  return  operands
-------------------------------------------------------------------------------------
    2     0  E >   ASSIGN                                                   !0, 3.14159
    3     1        INIT_FCALL                                               'sin'
          2        SEND_VAR                                                 !0
          3        DO_ICALL                                         $3
          4        ADD                                              ~4      10, $3
          5        ASSIGN                                                   !1, ~4
    4     6        ECHO                                                     'Result%3A+'
          7        ECHO                                                     !1
    5     8      > RETURN                                                   1
```

<p>Basicamente, o código OPC é uma sequência de instruções que a máquina virtual Zend executa.</p>
<h1 id="heading-jit"><strong>JIT</strong></h1>
<p>Mas onde o JIT entra nisso? O JIT é um compilador que compila o código OPC em código de máquina nativo. Isso significa que o JIT compila o código OPC em código de máquina que a CPU pode executar diretamente.</p>
<p>Dessa forma não usamos mais a máquina virtual Zend para executar o código OPC, mas sim o código de máquina nativo gerado pelo JIT.</p>
<h1 id="heading-habilitando-o-jit"><strong>Habilitando o JIT</strong></h1>
<p>O JIT não é habilitado por padrão. Para habilitá-lo, você precisa de alguns passos adicionais.</p>
<p>Primeiro, você precisa instalar a extensão <code>opcache</code>:</p>

```bash
sudo apt-get install php8.0-opcache
```

<p>Depois, você precisa habilitar o JIT no arquivo de configuração do PHP (<code>php.ini</code>):</p>

```php
[opcache]
opcache.enable=1
opcache.jit_buffer_size=100M
opcache.jit=tracing
opcache.jit=1205
opcache.enable_cli=1
```

<p>Aqui, estamos habilitando o JIT e definindo o tamanho do buffer JIT para 100 MB. O JIT pode operar em dois modos: <code>tracing</code> e <code>function</code>. O modo <code>tracing</code> é o modo padrão e é mais rápido, mas o modo <code>function</code> é mais preciso.</p>
<p>Para entender melhor a diferença entre os modos <code>tracing</code> e <code>function</code>, recomendo a leitura da <a target="_blank" href="https://www.php.net/manual/en/opcache.configuration.php#ini.opcache.jit">documentação oficial</a>.</p>
<p>E depois habilitamos o JIT para a linha de comando (<code>opcache.enable_cli=1</code>).  </p>
<h2 id="heading-benchmark"><strong>Benchmark</strong></h2>
<p>Se você roda o PHP na Web, o JIT pode não fazer muita diferença. Mas se você roda scripts PHP na linha de comando, o JIT pode trazer um grande ganho de performance.</p>
<p>Pois então, vamos fazer um benchmark para comparar a performance do PHP 8.0 com e sem JIT.</p>
<p>No repositório <a target="_blank" href="https://github.com/sschonss/jit-php-doc">php-jit-doc</a> você encontra um script PHP que calcula um monte de coisa para deixar o processador bem ocupado.</p>
<blockquote>
<p><em>Não vamos entrar em detalhes de escrita e padrões deste script, pois o foco é o JIT.</em></p>
</blockquote>
<p>Vamos rodar o script sem JIT:</p>

```bash
./start.sh
```

<p>O resultado foi:</p>

```bash
Execution time: 6.2343468666077 seconds
Encrypted: 46d37684d6032ef0167c00d29f3358d5a180438d3e8604e4c11728699d78fdb0a32284bfa8234ed59f69e7febd0d23bebab983211565582a98da8cb5c8800e42
```

<p>Agora vamos habilitar o JIT e rodar o script novamente:</p>

```bash
./start-jit.sh
```

<p>O resultado foi:</p>

```bash
Execution time: 3.292811870575 seconds
Encrypted: 46d37684d6032ef0167c00d29f3358d5a180438d3e8604e4c11728699d78fdb0a32284bfa8234ed59f69e7febd0d23bebab983211565582a98da8cb5c8800e42
```

<p>Com o JIT habilitado, o script PHP rodou 3 segundos mais rápido. Isso é um ganho de performance muito considerável.</p>
<p>Mas lembre-se, o JIT não é uma bala de prata. Ele pode não fazer muita diferença para scripts PHP que rodam na Web. Mas para scripts PHP que rodam na linha de comando, o JIT pode trazer um grande ganho de performance.</p>
<h1 id="heading-conclusao"><strong>Conclusão</strong></h1>
<p>Esse foi um breve resumo sobre o JIT no PHP 8.0. Se você quiser saber mais sobre o JIT, recomendo a leitura da <a target="_blank" href="https://www.php.net/manual/en/intro.opcache.php">documentação oficial</a>.</p>
<p>Trouxe somente exemplos básicos e didáticos para que você entenda o que é o JIT e como habilitá-lo. Acho que era importante trazer esse conteúdo para o perfil para que possamos falar sobre assuntos mais complexos e avançados.</p>
<p>Se você gostou do conteúdo, deixe um comentário e compartilhe com seus amigos. Até a próxima!</p>
