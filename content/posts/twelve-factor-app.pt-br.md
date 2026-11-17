---
title: 'Os 12 fatores: um guia para apps que rodam em qualquer lugar'
date: 2026-11-23
description: 'A primeira parte de Doze fatores na prática: o que é a metodologia Twelve-Factor, os 12 fatores explicados do zero e como cada um aparece num projeto PHP.'
translationKey: twelve-factor-app
series: ['Doze fatores na prática']
series_weight: 1
tags: ['Arquitetura', 'PHP']
draft: true
---

Quase todo projeto passa por esse momento: funciona na máquina de quem escreveu, mas quebra no servidor. Às vezes é uma senha que só existe num arquivo esquecido, às vezes é um arquivo salvo numa pasta que some no próximo deploy, às vezes é uma extensão do PHP que ninguém lembrou de instalar.

O [Twelve-Factor App](https://12factor.net/pt_br/) é uma lista de 12 práticas para evitar exatamente esses problemas. Ela foi escrita por engenheiros da [Heroku](https://www.heroku.com/), uma plataforma que hospeda aplicações na nuvem, a partir do que viram em centenas de milhares de apps rodando lá. O texto é curto, tem mais de dez anos e continua atual, porque descreve problemas que todo mundo ainda tem.

Este é o primeiro artigo da série **Doze fatores na prática**. Aqui eu faço um passeio leve pelos 12 fatores, um parágrafo para cada, com exemplos em PHP e Laravel. Nos próximos artigos, cada fator (ou par de fatores) ganha um texto próprio, com um lab que mostra o fator sendo quebrado e depois corrigido.

## Antes de começar: três palavras

- **Deploy:** uma instalação do app rodando em algum lugar. Produção é um deploy, homologação é outro, a sua máquina é outro.
- **Ambiente:** o lugar onde um deploy roda, com suas próprias senhas, endereços e configurações.
- **Serviço de apoio** (*backing service*): qualquer coisa que o app usa pela rede, como banco de dados, fila, cache ou um serviço de e-mail.

## A ideia central

Os 12 fatores giram em torno de uma separação: **o código é o mesmo em todo lugar, o que muda entre os ambientes fica fora dele**. Se o mesmo código roda na sua máquina, em homologação e em produção, mudando só a configuração, fica fácil subir mais uma cópia, trocar de servidor ou colocar alguém novo no projeto.

![Diagrama: um único repositório Git gera um build. O mesmo build vira três deploys (local, homologação e produção), cada um com sua própria configuração em variáveis de ambiente e seus próprios serviços de apoio, como banco e fila](/images/posts/twelve-factor-app/overview-pt.svg)

## Os 12 fatores, um por um

### I. Base de código

**Uma base de código, versionada, com muitos deploys.** Um app é um repositório (no Git, por exemplo). Produção e homologação são deploys desse mesmo repositório, talvez em versões diferentes. Se dois apps compartilham código, esse código vira uma biblioteca, não uma cópia colada.

No PHP: um repositório por app, e código compartilhado vira um pacote do [Composer](https://getcomposer.org/), o gerenciador de dependências do PHP.

### II. Dependências

**Declare e isole as dependências.** O app nunca assume que algo "já está instalado" no servidor. Tudo que ele precisa está declarado num arquivo.

No PHP: o `composer.json` declara as bibliotecas e o `composer.lock` fixa as versões exatas. Extensões também entram lá, como `"ext-pdo": "*"`, e o Composer avisa se faltar alguma.

### III. Configuração

**Guarde a configuração no ambiente.** Configuração é tudo que muda entre deploys: senha do banco, chave de API, URL de outro serviço. Ela fica em variáveis de ambiente, não no código. Um teste simples: se o repositório virasse público agora, alguma senha vazaria?

No Laravel: o `.env` serve para desenvolvimento, e em produção os valores vêm das variáveis de ambiente do servidor. Um detalhe que pega muita gente: depois de `php artisan config:cache`, a função `env()` usada fora dos arquivos de `config/` passa a devolver `null` ([documentação](https://laravel.com/docs/configuration#configuration-caching)).

### IV. Serviços de apoio

**Trate serviços de apoio como recursos anexados.** Para o app, tanto faz se o banco roda na mesma máquina ou num serviço gerenciado. Trocar um pelo outro deve exigir só mudar a configuração, sem mexer no código.

No Laravel: `DB_HOST`, `REDIS_HOST` e `MAIL_MAILER` no ambiente. Trocar o MySQL local por um banco na nuvem é trocar valores, não reescrever classes.

### V. Construir, lançar, executar

**Separe bem as etapas de build e execução.** São três etapas:

1. **Build:** transforma o código num pacote executável (instala dependências, compila assets).
2. **Release:** junta o build com a configuração de um ambiente.
3. **Run:** executa o release.

Nada é editado direto no servidor. Mudou algo? Novo build, novo release.

No PHP: `composer install --no-dev` e `npm run build` no build, uma imagem Docker como resultado, e as variáveis de ambiente entrando só no release.

### VI. Processos

**Execute o app como um ou mais processos sem estado.** Nenhum dado importante fica guardado na memória ou no disco local do processo entre uma requisição e outra. O que precisa durar vai para um serviço de apoio.

No PHP: sessões e cache no Redis ou no banco, uploads num armazenamento de arquivos como o S3. Esse fator conversa com uma série que está a caminho aqui no blog, sobre como o PHP roda: no PHP-FPM o estado some a cada requisição, mas em runtimes com workers persistentes, como o [RoadRunner](https://roadrunner.dev/) e o [Laravel Octane](https://laravel.com/docs/octane), uma variável estática pode vazar de uma requisição para a próxima.

### VII. Vínculo de porta

**Exporte serviços via vínculo de porta.** O app se apresenta escutando numa porta (`8080`, por exemplo), e não depende de um servidor web injetado de fora para existir.

No PHP: esse é o fator que o modelo clássico, Nginx mais PHP-FPM, segue menos ao pé da letra, porque o FPM fala FastCGI e não HTTP. Uma imagem Docker que junta os dois e expõe uma porta resolve isso na prática. Runtimes como o [FrankenPHP](https://frankenphp.dev/) e o RoadRunner já escutam HTTP direto.

### VIII. Concorrência

**Escale com mais processos.** Para atender mais carga, você sobe mais processos do mesmo tipo, em vez de criar um processo gigante. E cada tipo de trabalho tem seu próprio tipo de processo: um para a web, outro para filas.

No Laravel: o servidor web atende requisições e o `php artisan queue:work` processa a fila. Para dar conta de mais jobs, sobe mais workers de fila, sem mexer na web.

### IX. Descartabilidade

**Inicie rápido e desligue com elegância.** Um processo pode ser parado a qualquer momento (num deploy, num ajuste de escala). Ele deve subir em segundos e, ao receber o sinal para parar, terminar o que está fazendo e sair sem perder trabalho.

No Laravel: o `queue:work` termina o job atual antes de sair quando recebe o sinal `SIGTERM`, que é o "por favor, encerre" que o sistema operacional manda. Jobs também devem ser seguros para rodar de novo, caso um processo morra no meio.

### X. Paridade entre desenvolvimento e produção

**Mantenha desenvolvimento, homologação e produção o mais parecidos possível.** Se a produção usa PostgreSQL, rodar SQLite na sua máquina esconde bugs que só aparecem lá.

No PHP: o [Docker Compose](https://docs.docker.com/compose/) ou o [Laravel Sail](https://laravel.com/docs/sail) sobem localmente as mesmas versões de banco, Redis e PHP da produção.

### XI. Logs

**Trate logs como fluxos de eventos.** O app não gerencia arquivos de log. Ele escreve na saída padrão (`stdout`) e o ambiente decide para onde isso vai: um terminal, um arquivo, uma ferramenta de busca de logs.

No Laravel: `LOG_CHANNEL=stderr` manda os logs para a saída de erro do processo, que o Docker e as plataformas de nuvem já coletam. Arquivo em `storage/logs` dentro de um contêiner some quando o contêiner é recriado.

### XII. Processos administrativos

**Rode tarefas administrativas como processos pontuais.** Migrations, scripts de correção e consoles rodam no mesmo ambiente, com o mesmo código e a mesma configuração do app, como um processo que começa e termina.

No Laravel: `php artisan migrate --force` no deploy, ou `php artisan tinker` num contêiner com o mesmo release. Nada de um script solto no servidor, com uma cópia própria da senha do banco.

## Resumo em uma tabela

| Fator | Em uma frase | Exemplo em PHP |
| --- | --- | --- |
| I. Base de código | Um repositório, muitos deploys | Código compartilhado vira pacote do Composer |
| II. Dependências | Tudo declarado, nada presumido | `composer.json` e `composer.lock` |
| III. Configuração | O que muda entre ambientes fica no ambiente | `.env` local, variáveis de ambiente em produção |
| IV. Serviços de apoio | Banco e fila são endereços trocáveis | `DB_HOST`, `REDIS_HOST` |
| V. Build, release, run | Três etapas separadas | Imagem Docker mais variáveis no release |
| VI. Processos | Sem estado guardado no processo | Sessão no Redis, upload no S3 |
| VII. Vínculo de porta | O app escuta numa porta | FrankenPHP ou contêiner com porta exposta |
| VIII. Concorrência | Mais carga, mais processos | Mais `queue:work` |
| IX. Descartabilidade | Sobe rápido, para com elegância | `SIGTERM` no worker de fila |
| X. Paridade | Local parecido com produção | Docker Compose ou Sail |
| XI. Logs | Escreve na saída e não cuida de arquivos | `LOG_CHANNEL=stderr` |
| XII. Admin | Tarefas pontuais no mesmo release | `php artisan migrate` |

## Isso ainda vale?

O texto é de uma época anterior ao Kubernetes, e algumas partes mostram a idade. O fator VII, por exemplo, faz menos sentido em plataformas que escondem a rede, e muita gente hoje usa um cofre de segredos em vez de variáveis de ambiente puras. Mesmo assim, a ideia central continua sendo a base do que contêineres e plataformas de nuvem esperam de um app: código igual em todo lugar, configuração fora dele e processos que podem morrer sem drama.

Também é um assunto de ownership. Muitos desses fatores parecem "coisa de infra", mas quem escreve o código decide se a senha fica no repositório, se o upload vai para o disco local ou se o worker sabe parar com elegância. Seguir os 12 fatores é o time assumir como o app roda, não só como ele é escrito.

## Próximos artigos

No próximo artigo, vou falar sobre o fator III, configuração, com um lab em Laravel que mostra o que acontece quando um segredo vai parar no código e como o `config:cache` muda o comportamento do `env()`. Depois vêm processos e descartabilidade, que conversam com a série sobre runtimes PHP, e logs como fluxo de eventos.

## Glossário

- **Variável de ambiente:** um valor com nome (`DB_PASSWORD=...`) que o sistema operacional entrega ao processo quando ele começa.
- **Contêiner:** um pacote isolado com o app e tudo que ele precisa para rodar, como os criados pelo [Docker](https://www.docker.com/).
- **Worker:** um processo que fica rodando para atender trabalho, como requisições ou jobs de fila.
- **SIGTERM:** o sinal que o sistema operacional manda para pedir que um processo encerre.
- **stdout e stderr:** as saídas padrão de um processo, uma para mensagens normais e outra para erros.

## Fontes

- [The Twelve-Factor App, em português](https://12factor.net/pt_br/) e [em inglês](https://12factor.net/)
- [Laravel: cache de configuração](https://laravel.com/docs/configuration#configuration-caching)
- [Laravel: filas e workers](https://laravel.com/docs/queues#running-the-queue-worker)
- [Laravel: logs](https://laravel.com/docs/logging)
