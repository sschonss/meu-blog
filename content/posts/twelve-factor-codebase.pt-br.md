---
title: 'Os 12 fatores, parte 1: uma base de código, muitos deploys'
date: 2026-11-23
description: 'Abrindo a série Doze fatores na prática: o que é a metodologia Twelve-Factor e o fator I, base de código, explicado do zero com exemplos em PHP.'
translationKey: twelve-factor-codebase
series: ['Doze fatores na prática']
series_weight: 1
tags: ['Arquitetura', 'PHP']
draft: true
---

Quase todo projeto passa por esse momento: funciona na máquina de quem escreveu, mas quebra no servidor. Às vezes é uma senha que só existe num arquivo esquecido, às vezes é um arquivo salvo numa pasta que some no próximo deploy, às vezes é uma correção que alguém fez direto em produção e que ninguém sabe onde está.

O [Twelve-Factor App](https://12factor.net/pt_br/) é uma lista de 12 práticas para evitar exatamente esses problemas. Ela foi escrita por engenheiros da [Heroku](https://www.heroku.com/), uma plataforma que hospeda aplicações na nuvem, a partir do que viram em centenas de milhares de apps rodando lá. O texto é curto, tem mais de dez anos e continua atual, porque descreve problemas que todo mundo ainda tem.

Este é o primeiro artigo da série **Doze fatores na prática**. A ideia é simples: um artigo para cada fator, sempre com exemplos em PHP e Laravel. Neste primeiro, faço uma apresentação rápida da metodologia e depois entro no fator I, **base de código**.

## Antes de começar: três palavras

- **Deploy:** uma instalação do app rodando em algum lugar. Produção é um deploy, homologação é outro, a sua máquina é outro.
- **Ambiente:** o lugar onde um deploy roda, com suas próprias senhas, endereços e configurações.
- **Repositório:** o lugar onde o código e todo o histórico de mudanças ficam guardados, como um projeto no [Git](https://git-scm.com/), o sistema de controle de versão mais usado hoje.

## A ideia central dos 12 fatores

Os 12 fatores giram em torno de uma separação: **o código é o mesmo em todo lugar, o que muda entre os ambientes fica fora dele**. Se o mesmo código roda na sua máquina, em homologação e em produção, mudando só a configuração, fica fácil subir mais uma cópia, trocar de servidor ou colocar alguém novo no projeto.

![Diagrama: um único repositório Git gera um build. O mesmo build vira três deploys (local, homologação e produção), cada um com sua própria configuração em variáveis de ambiente e seus próprios serviços de apoio, como banco e fila](/images/posts/twelve-factor-codebase/overview-pt.svg)

## O mapa da série

Cada linha abaixo vai virar um artigo. Por enquanto, basta uma frase para cada fator:

| Fator | Em uma frase |
| --- | --- |
| I. Base de código | Um repositório por app, muitos deploys |
| II. Dependências | Tudo que o app precisa está declarado, nada é presumido |
| III. Configuração | O que muda entre ambientes fica no ambiente, não no código |
| IV. Serviços de apoio | Banco, fila e cache são endereços que dá para trocar |
| V. Construir, lançar, executar | Build, release e execução são etapas separadas |
| VI. Processos | O app roda em processos que não guardam estado |
| VII. Vínculo de porta | O app se apresenta escutando numa porta |
| VIII. Concorrência | Mais carga se resolve com mais processos |
| IX. Descartabilidade | Sobe rápido e desliga sem perder trabalho |
| X. Paridade entre ambientes | A sua máquina se parece com a produção |
| XI. Logs | O app escreve eventos na saída e não cuida de arquivos |
| XII. Processos administrativos | Tarefas pontuais rodam com o mesmo código e configuração |

## Fator I: uma base de código, muitos deploys

O texto original resume o fator assim: **uma base de código com rastreamento utilizando controle de revisão, muitos deploys**. São duas regras numa frase:

1. **Todo app vive num sistema de controle de versão**, como o Git. Nada de código que só existe numa pasta do servidor ou num ZIP mandado por e-mail.
2. **Existe uma relação de um para um entre app e base de código.** Um app tem um repositório. Um repositório guarda um app.

E aí vem a parte que parece contraditória, mas não é: uma base de código, **muitos deploys**. Produção, homologação e a máquina de cada pessoa do time são deploys do mesmo repositório. Eles podem estar em versões diferentes ao mesmo tempo, e isso é normal.

![Diagrama em dois lados. À esquerda, o certo: um repositório com as versões v1.3, v1.4, v1.5 e main numa única linha, e cada deploy roda uma delas (produção na v1.4, homologação na v1.5, local na main com mudanças). À direita, o problema: uma cópia do sistema por cliente (loja-cliente-a, loja-cliente-b, loja-cliente-c), cada uma com sua própria história, e uma correção feita numa não chega às outras](/images/posts/twelve-factor-codebase/codebase-pt.svg)

### Versões diferentes não são bases diferentes

Imagine uma loja virtual em Laravel. Hoje:

- a produção roda a tag `v1.4`;
- a homologação roda a `v1.5`, que o time está testando;
- na sua máquina está a `main`, com uma funcionalidade pela metade.

São três versões diferentes, mas todas estão na mesma linha do tempo do mesmo repositório. Qualquer uma delas pode ser reproduzida a partir de um commit. É isso que torna os três ambientes "deploys do mesmo app".

Um jeito prático de ver isso no dia a dia é cada deploy saber dizer qual versão está rodando. No momento do build, dá para gravar o commit numa variável de ambiente:

```bash
# no build: descobre a versão atual do repositório
APP_VERSION=$(git describe --tags --always)
echo $APP_VERSION   # v1.4, ou v1.4-3-g9f2c1ab se houver commits depois da tag
```

E no Laravel, expor isso numa rota simples (ou no rodapé do painel administrativo):

```php
// config/app.php
'version' => env('APP_VERSION', 'dev'),

// routes/web.php
Route::get('/version', fn () => config('app.version'));
```

Se alguém perguntar "o que está em produção?", a resposta é um commit, e não um "acho que é a última versão".

## Onde o fator I costuma ser quebrado

Os dois erros que o texto original aponta aparecem muito em projetos PHP.

### 1. Um app com várias bases: a cópia por cliente

O cenário clássico: o sistema é vendido para vários clientes e, para cada um, alguém copia a pasta (ou faz um fork do repositório) e ajusta o que precisa. No começo parece prático. Depois de alguns meses:

- uma correção de segurança feita na cópia do cliente A não chega ao cliente B;
- o cliente C ficou parado numa versão antiga, porque ninguém tem coragem de atualizar;
- ninguém sabe dizer qual cópia é a "oficial".

Isso é exatamente o lado direito do diagrama: várias bases para o mesmo app. A saída é voltar para uma única base de código e mover as diferenças para fora dela:

- o que muda de cliente para cliente (nome, logo, URLs, chaves de API) vira **configuração**, que é o assunto do fator III;
- funcionalidades que só alguns clientes têm viram **flags de funcionalidade** (*feature flags*): liga e desliga por configuração, com o mesmo código para todos. No Laravel, o [Pennant](https://laravel.com/docs/pennant) é o pacote oficial para isso.

### 2. Várias apps numa base: o código copiado e colado

O erro inverso: duas aplicações diferentes (o site da loja e um painel interno, por exemplo) precisam da mesma regra de cálculo de frete. Alguém copia a classe de um projeto para o outro. Cada cópia evolui do seu jeito, e um dia o frete calculado no site é diferente do frete no painel.

O texto original é direto aqui: código compartilhado vira **biblioteca**, incluída pelo gerenciador de dependências. No PHP, isso é um pacote do [Composer](https://getcomposer.org/), o gerenciador de dependências do PHP. O pacote pode ficar num repositório privado, sem precisar ir para o [Packagist](https://packagist.org/), o repositório público de pacotes:

```json
{
    "repositories": [
        { "type": "vcs", "url": "git@github.com:minha-empresa/calculo-frete.git" }
    ],
    "require": {
        "minha-empresa/calculo-frete": "^2.1"
    }
}
```

Agora o site e o painel usam a mesma regra, cada um numa versão declarada. Corrigir o frete é lançar a `2.1.1` do pacote e atualizar os dois apps. Como declarar e fixar essas versões é justamente o fator II, dependências.

### Bônus: a correção feita direto no servidor

Esse não é um dos dois casos do texto, mas quebra o fator I do mesmo jeito. Alguém abre o FTP, corrige um arquivo em produção e vai embora. A partir daí, o código que roda em produção não existe em nenhum commit. O próximo deploy apaga a correção, e o bug volta.

Um teste rápido para descobrir se isso aconteceu: em servidores onde o deploy é um `git pull`, rodar `git status` na pasta do app. Qualquer arquivo modificado ali é código que não está na base de código.

## E monorepo, pode?

Um **monorepo** é um único repositório que guarda vários apps, como uma API e um painel lado a lado. Ele parece contrariar o "um app, um repositório", e o texto original, que é anterior à popularização dessa prática, não fala dele.

Na prática, o espírito do fator continua valendo: cada app dentro do monorepo tem uma pasta clara, um build próprio e deploys que saem de um commit conhecido. O problema que o fator quer evitar não é ter muitos arquivos num repositório, é não conseguir dizer qual código está rodando em cada lugar.

## Como saber se o seu projeto segue o fator I

Algumas perguntas rápidas:

- O código em produção corresponde a um commit específico do repositório?
- Existe alguma cópia do sistema "só para um cliente"?
- Alguma classe foi copiada de outro projeto, em vez de vir de um pacote?
- Alguém já corrigiu algo direto no servidor?

Se a resposta da primeira for "não sei" ou qualquer uma das outras for "sim", vale começar por aqui. Também é uma questão de ownership: quando ninguém consegue dizer qual código está em produção, ninguém é realmente dono dele.

## Próximo artigo

No próximo artigo da série, o assunto é o fator II, **dependências**: por que o app nunca deve presumir que algo "já está instalado" no servidor, e como o `composer.json`, o `composer.lock` e as extensões do PHP entram nessa história.

## Glossário

- **Controle de versão:** um sistema que guarda cada mudança no código, com quem fez e quando, e permite voltar a qualquer ponto do histórico.
- **Commit:** um registro de mudança no repositório, identificado por um código único (o *hash*).
- **Tag:** um nome fixo dado a um commit, normalmente uma versão, como `v1.4`.
- **Fork:** uma cópia de um repositório que passa a ter vida própria.
- **Feature flag:** um interruptor na configuração que liga ou desliga uma funcionalidade sem mudar o código.

## Fontes

- [The Twelve-Factor App, em português](https://12factor.net/pt_br/) e [em inglês](https://12factor.net/)
- [I. Base de código](https://12factor.net/pt_br/codebase)
- [Composer: repositórios VCS](https://getcomposer.org/doc/05-repositories.md#vcs)
- [Laravel Pennant](https://laravel.com/docs/pennant)
- [Git: git describe](https://git-scm.com/docs/git-describe)
