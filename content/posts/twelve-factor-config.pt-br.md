---
title: '12 fatores: configuração fora do código'
date: 2026-11-30
draft: true
description: 'Fator III da série Doze fatores na prática: por que senhas e endereços ficam em variáveis de ambiente, e como ler, validar e passar essas configurações num app PHP.'
translationKey: twelve-factor-config
series: ['Doze fatores na prática']
series_weight: 3
tags: ['Arquitetura', 'PHP']
---

Todo time já viu um commit com a mensagem "remove senha". O problema é que o Git não esquece: a senha continua no histórico, ao alcance de qualquer pessoa que clonar o repositório. E quase sempre ela foi parar ali pelo mesmo motivo: alguém escreveu a configuração direto no código.

Este é o terceiro artigo da série **Doze fatores na prática**. No [primeiro](/pt-br/posts/twelve-factor-codebase/), o assunto foi o fator I, base de código. O segundo tratou do fator II, dependências. Agora é a vez do fator III, **configuração**: o que é, onde ela deve morar e como ler tudo isso em PHP puro, sem framework.

## Antes de começar: três palavras

- **Configuração:** tudo o que muda de um deploy para outro. O endereço do banco, a senha do banco, a chave de uma API de pagamento, o nível de log.
- **Variável de ambiente:** um par nome e valor, como `DB_HOST=localhost`, que o sistema operacional entrega para cada programa quando ele começa a rodar. Todo processo tem as suas, e elas não ficam em nenhum arquivo do projeto.
- **Segredo:** uma configuração que não pode vazar, como senhas, tokens e chaves privadas.

## O que o fator III diz

O texto original é direto: o app guarda a configuração **separada do código**, em **variáveis de ambiente**.

A ideia por trás disso é que o código é o mesmo em todos os deploys. Produção, homologação e a máquina de quem desenvolve rodam o mesmo código. O que muda entre eles é só a configuração. Se a configuração está dentro do código, cada deploy precisa de um código diferente, e aí o fator I deixa de valer.

Uma analogia ajuda. Pense num carregador de celular que você leva numa viagem. O carregador é o mesmo em qualquer país. O que muda é o adaptador de tomada. Ninguém abre o carregador para soldar um plugue novo em cada viagem: troca o adaptador. O código é o carregador, a configuração é o adaptador.

## O que é configuração, e o que não é

Nem tudo que fica num arquivo chamado `config` é configuração no sentido do fator III. A pergunta que separa uma coisa da outra é: **isso muda de um deploy para outro?**

| É configuração (muda por deploy) | Não é configuração (igual em todo deploy) |
| --- | --- |
| Endereço e senha do banco | As rotas do app (`/login` chama `LoginController`) |
| Chave da API de pagamento | Qual classe implementa qual interface |
| Endereço do servidor de e-mail | Regras de validação de um formulário |
| Nível de log, tempo de cache | Os nomes das tabelas do banco |

O lado direito é configuração **interna** do app. Ela pode e deve ficar no código, versionada no Git, porque faz parte de como o app funciona. Se as rotas mudassem de produção para homologação, você estaria testando um app diferente do que vai para o ar.

## O teste do código aberto

O texto original propõe um teste simples: **o código poderia virar open source agora, sem vazar nenhuma credencial?**

Se a resposta for "não", alguma configuração está no lugar errado. O lab deste artigo tem um exemplo do jeito errado, um arquivo com a senha escrita no código:

```php
<?php
// Jeito errado: configuração escrita no código.
$config = [
    'db_host'     => 'localhost',
    'db_password' => 'super-secret-123',
    'mail_from'   => 'noreply@example.com',
];
```

O lab também tem um `.env` com outra senha, só para desenvolvimento local (mais sobre ele adiante). O teste procurou as duas senhas em tudo que o Git rastreia, com o `git grep`:

```text
$ git grep -n -E 'super-secret-123|local-only-pass'
src/01-hardcoded.php:5:    'db_password' => 'super-secret-123',
```

A senha escrita no código apareceu. A do `.env` não, porque esse arquivo está no `.gitignore` e nunca entra no repositório. Esse é o resultado que se quer: nenhuma senha encontrada. Ferramentas como o [gitleaks](https://github.com/gitleaks/gitleaks) fazem essa busca de forma automática, com padrões para senhas e chaves conhecidas, e podem rodar no CI a cada commit.

## Lendo variáveis de ambiente no PHP

O PHP oferece três jeitos de ler uma variável de ambiente: a função `getenv()`, o array `$_ENV` e o array `$_SERVER`. Parecem iguais, mas o lab mostrou que não são.

O teste rodou um script que lê `DB_HOST` dos três jeitos:

```text
$ DB_HOST=db.internal php src/02-getenv-vs-env.php
variables_order=GPCS
getenv(DB_HOST)='db.internal'
$_ENV[DB_HOST]=NULL
$_SERVER[DB_HOST]='db.internal'
```

O `$_ENV` veio vazio. O motivo é uma diretiva do `php.ini` chamada `variables_order`, que diz quais arrays o PHP preenche. O valor padrão das instalações comuns, como a do Debian usada no lab, é `GPCS`, e a letra `E` (de *environment*) não está lá. Com a letra de volta, os três concordam:

```text
$ DB_HOST=db.internal php -d variables_order=EGPCS src/02-getenv-vs-env.php
variables_order=EGPCS
getenv(DB_HOST)='db.internal'
$_ENV[DB_HOST]='db.internal'
$_SERVER[DB_HOST]='db.internal'
```

Na prática: para ler direto do ambiente, `getenv()` é o caminho mais previsível. Quem usa `$_ENV` precisa conferir o `variables_order` do servidor.

## Um build, dois ambientes

Com a leitura resolvida, o lab montou um `config.php` que pega tudo do ambiente, com valores padrão para o que é opcional:

```php
<?php
return [
    'db_host'     => env_required('DB_HOST'),
    'db_password' => env_required('DB_PASSWORD'),
    'log_level'   => env_optional('LOG_LEVEL', 'info'),
    'cache_ttl'   => (int) env_optional('CACHE_TTL', '60'),
];
```

As funções `env_required()` e `env_optional()` são pequenas e aparecem na próxima seção. O mesmo código rodou duas vezes, primeiro com os valores de desenvolvimento e depois com os de produção:

```text
$ DB_HOST=localhost DB_PASSWORD=dev-pass LOG_LEVEL=debug php src/03-app.php
connecting to localhost
password length=8
log_level=debug cache_ttl=60

$ DB_HOST=db.prod.internal DB_PASSWORD=Pr0d-s3cret CACHE_TTL=3600 php src/03-app.php
connecting to db.prod.internal
password length=11
log_level=info cache_ttl=3600
```

Nenhum arquivo foi editado entre as duas execuções. O que mudou foi só o ambiente, e com ele o banco, o nível de log e o tempo de cache. Repare também que o app mostra só o **tamanho** da senha, nunca a senha. Configuração secreta não aparece em log.

![Diagrama: o mesmo código, um build sem senhas, roda em dois deploys. Com o ambiente de dev, DB_HOST=localhost, vira o deploy de dev, com banco local e log debug. Com o ambiente de produção, DB_HOST=db.prod.internal, vira o deploy de produção, com banco de produção e log info. O código vai para o Git; os valores ficam no ambiente de cada deploy e nunca no repositório](/images/posts/twelve-factor-config/config-pt.svg)

## Falhar cedo quando falta algo

E se alguém esquecer de definir a senha em produção? O pior que pode acontecer é o app subir, parecer saudável e só quebrar na primeira requisição que precisa do banco, minutos ou horas depois.

Por isso o `config.php` do lab separa o que é obrigatório do que é opcional:

```php
<?php
function env_required(string $name): string
{
    $value = getenv($name);
    if ($value === false || $value === '') {
        fwrite(STDERR, "Config error: required environment variable {$name} is not set\n");
        exit(1);
    }
    return $value;
}

function env_optional(string $name, string $default): string
{
    $value = getenv($name);
    return ($value === false || $value === '') ? $default : $value;
}
```

O teste rodou o app sem a senha e depois com a senha vazia:

```text
$ DB_HOST=db.prod.internal php src/03-app.php
Config error: required environment variable DB_PASSWORD is not set
[exit 1]

$ DB_HOST=db.prod.internal DB_PASSWORD= php src/03-app.php
Config error: required environment variable DB_PASSWORD is not set
[exit 1]
```

Nos dois casos, o app parou na hora, com uma mensagem que diz exatamente o que falta, e com código de saída 1. Esse código importa: é ele que avisa ao deploy, ao CI ou ao orquestrador que algo deu errado, para que a versão nova não entre no ar. Esse comportamento tem nome: **fail fast**, falhar cedo.

## O arquivo .env, só para a sua máquina

Definir cinco ou dez variáveis na mão toda vez que abre o terminal cansa. Para o desenvolvimento local, a solução comum é um arquivo `.env` na raiz do projeto, lido por uma biblioteca. No PHP, a mais usada é a [phpdotenv](https://github.com/vlucas/phpdotenv), instalada pelo Composer:

```bash
composer require vlucas/phpdotenv
```

O lab usou assim:

```php
<?php
require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();
$dotenv->required(['DB_HOST', 'DB_PASSWORD'])->notEmpty();

echo 'DB_HOST=' . $_SERVER['DB_HOST'] . "\n";
```

Três detalhes desse código:

- `createImmutable`: o `.env` **não sobrescreve** uma variável que já existe no ambiente. A variável real sempre ganha.
- `safeLoad`: se o `.env` não existir, segue em frente sem erro. Em produção, ele não deve existir.
- `required(...)->notEmpty()`: o mesmo fail fast da seção anterior, agora pela biblioteca.

O teste mostrou os três comportamentos:

```text
$ php src/04-dotenv.php
DB_HOST=127.0.0.1

$ DB_HOST=db.from.real.env php src/04-dotenv.php
DB_HOST=db.from.real.env

$ php src/04-dotenv.php        # sem .env e sem variáveis
PHP Fatal error:  Uncaught Dotenv\Exception\ValidationException: One or more
environment variables failed assertions: DB_HOST is missing, DB_PASSWORD is missing.
```

Primeiro, o valor veio do `.env`. Depois, a variável real ganhou do arquivo. Por fim, sem nenhum dos dois, a validação parou o app.

Uma pegadinha apareceu no caminho. A primeira versão do script lia `$_ENV['DB_HOST']`, e quando a variável veio do ambiente real, o resultado foi este:

```text
$ DB_HOST=db.from.real.env php src/04a-dotenv-env-trap.php
PHP Warning:  Undefined array key "DB_HOST" in .../src/04a-dotenv-env-trap.php on line 9
DB_HOST=
```

É o `variables_order` de novo: o PHP não colocou a variável real no `$_ENV`, e o modo imutável impediu a biblioteca de colocar. Ler do `$_SERVER`, como na versão final, resolveu.

### O que vai e o que não vai para o Git

O `.env` tem valores reais, então **nunca** vai para o repositório. No lugar dele, vai um `.env.example`, com os nomes das variáveis e valores de exemplo, sem nenhum segredo:

```bash
# .env.example: copie para .env no desenvolvimento local. Nunca faça commit do .env.
DB_HOST=127.0.0.1
DB_PASSWORD=
LOG_LEVEL=debug
```

E o `.gitignore` garante o resto:

```text
/vendor/
.env
```

No lab, o Git confirmou:

```text
$ git check-ignore -v .env
.gitignore:2:.env	.env

$ git ls-files | grep -E '^\.env'
.env.example
```

O `.env.example` é também documentação: quem chega no projeto vê, num lugar só, todas as configurações de que o app precisa. Frameworks como o [Hyperf](https://hyperf.wiki/3.1/#/en/config) já trazem esse arranjo pronto, com um `.env` lido na inicialização e uma função `env()` para usar nos arquivos de configuração.

## Por ambiente ou por variável?

Um jeito comum de organizar configuração é criar um arquivo para cada ambiente:

```php
<?php
// config/production.php
return [
    'db_host'   => 'db.prod.internal',
    'log_level' => 'info',
    'cache_ttl' => 3600,
];
```

E outro `config/staging.php`, e outro `config/development.php`. O app escolhe o arquivo por uma única variável, como `APP_ENV=production`.

O texto original desaconselha esse arranjo, por dois motivos:

1. **Não escala.** Cada ambiente novo, como um deploy de homologação para um cliente específico, vira mais um arquivo. Com o tempo, ninguém sabe qual diferença entre eles é proposital.
2. **Puxa segredos para o código.** O arquivo de produção é o lugar natural para alguém colocar a senha de produção, e aí ela vai para o Git.

O caminho do fator III são variáveis **granulares**: uma variável para cada coisa (`DB_HOST`, `LOG_LEVEL`, `CACHE_TTL`), independentes entre si. Cada deploy define as suas, sem um nome de ambiente amarrando tudo. Esse exemplo é só ilustrativo e não rodou no lab.

## A pegadinha do PHP-FPM

Até aqui, tudo rodou pela linha de comando. Na web, o PHP costuma rodar pelo [PHP-FPM](https://www.php.net/manual/pt_BR/install.fpm.php), um gerenciador que mantém processos PHP prontos para atender as requisições que chegam do servidor web. E o PHP-FPM tem uma configuração que pega muita gente de surpresa: `clear_env`.

Com `clear_env = yes`, que é o padrão, o PHP-FPM **apaga as variáveis de ambiente** antes de entregar a requisição ao PHP. O seu app lê `getenv('DB_HOST')` e recebe `false`, mesmo com a variável definida no servidor.

O lab testou com o php-fpm 8.4 de verdade: subiu o PHP-FPM com `APP_SECRET` e `DB_HOST` definidas e fez uma requisição para uma página que só imprime as duas. Com a configuração padrão:

```text
getenv(APP_SECRET)=false
getenv(DB_HOST)=false
```

Há duas saídas. A primeira é desligar a limpeza no arquivo do pool (no Debian, `/etc/php/8.4/fpm/pool.d/www.conf`):

```ini
clear_env = no
```

A segunda, mais controlada, é manter a limpeza e repassar só as variáveis que o app precisa, uma por uma:

```ini
env[APP_SECRET] = $APP_SECRET
env[DB_HOST] = $DB_HOST
```

Nos dois casos, a mesma requisição passou a ver os valores:

```text
getenv(APP_SECRET)='from-shell'
getenv(DB_HOST)='db.prod.internal'
```

A segunda opção é a que costuma valer mais a pena: o app recebe só o que precisa, e não todas as variáveis do servidor. Um detalhe: o teste usou um pool mínimo iniciado à mão e as requisições foram feitas direto pelo protocolo FastCGI, com o `cgi-fcgi`, sem um servidor web na frente.

## E em produção, de onde vêm os valores?

Fora da sua máquina, quem define as variáveis é a plataforma onde o app roda:

- No [Docker](https://docs.docker.com/reference/cli/docker/container/run/#env), com `-e DB_HOST=...` ou `--env-file` ao iniciar o contêiner.
- No [Kubernetes](https://kubernetes.io/docs/concepts/configuration/secret/), com objetos `Secret` e `ConfigMap`, que viram variáveis de ambiente dentro do contêiner.
- Em plataformas como a Heroku, num painel ou por linha de comando, deploy por deploy.

O Docker não estava disponível na máquina do lab, então nenhum desses exemplos rodou aqui. A ideia, em todos, é a mesma: a imagem ou o código é um só, e os valores entram de fora na hora de rodar.

Um último cuidado: variável de ambiente não é cofre. Uma chamada a `phpinfo()` esquecida numa página pública mostra todas elas. Segredo não aparece em log, em página de erro nem em `phpinfo()`.

## Como saber se o seu projeto segue o fator III

Algumas perguntas rápidas:

- O código poderia virar open source hoje, sem vazar nenhuma senha?
- O `.env` está no `.gitignore`, e existe um `.env.example` no repositório?
- O mesmo build roda em todos os ambientes, só com variáveis diferentes?
- O app para na inicialização, com uma mensagem clara, quando falta uma variável obrigatória?
- As configurações são variáveis granulares, e não arquivos por ambiente?
- Se o app roda no PHP-FPM, as variáveis chegam ao PHP (`clear_env` ou `env[...]`)?

Se alguma resposta for "não", vale começar por ela. E aqui também há uma questão de ownership. Quando a configuração está explícita, com um `.env.example` que lista tudo e um app que reclama do que falta, qualquer pessoa do time consegue subir um ambiente novo, trocar uma senha vazada ou entender por que produção se comporta diferente. A configuração deixa de ser um segredo de quem fez o primeiro deploy e passa a ser responsabilidade do time.

## Próximo artigo

No próximo artigo da série, o assunto é o fator IV, **serviços de apoio**: por que banco de dados, fila e cache devem ser tratados como recursos plugáveis, trocados só mudando a configuração.

## Glossário

- **Configuração:** tudo o que muda de um deploy para outro, como endereços, senhas e chaves.
- **Configuração interna:** o que é igual em todos os deploys, como rotas e regras do app. Fica no código.
- **Variável de ambiente:** um par nome e valor que o sistema operacional entrega para cada processo.
- **Segredo:** uma configuração que não pode vazar, como senha, token ou chave privada.
- **Fail fast (falhar cedo):** parar logo na inicialização, com uma mensagem clara, em vez de quebrar mais tarde.
- **`.env`:** arquivo com variáveis para o desenvolvimento local. Nunca vai para o Git.
- **Pool do PHP-FPM:** um grupo de processos PHP com a mesma configuração, definido em arquivos como o `www.conf`.
- **Código de saída:** o número que um programa devolve ao terminar. Zero quer dizer sucesso; qualquer outro, erro.

## Fontes

- [The Twelve-Factor App: III. Configurações](https://12factor.net/pt_br/config)
- [PHP: getenv](https://www.php.net/manual/pt_BR/function.getenv.php)
- [PHP: a diretiva variables_order](https://www.php.net/manual/pt_BR/ini.core.php#ini.variables-order)
- [PHP: $_ENV](https://www.php.net/manual/pt_BR/reserved.variables.environment.php)
- [PHP: configuração do PHP-FPM (clear_env e env)](https://www.php.net/manual/pt_BR/install.fpm.configuration.php)
- [phpdotenv no GitHub](https://github.com/vlucas/phpdotenv)
- [Hyperf: configuração e arquivo .env](https://hyperf.wiki/3.1/#/en/config)
- [Docker: variáveis de ambiente no docker run](https://docs.docker.com/reference/cli/docker/container/run/#env)
- [Kubernetes: Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [gitleaks no GitHub](https://github.com/gitleaks/gitleaks)
