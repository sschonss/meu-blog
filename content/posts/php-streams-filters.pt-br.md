---
title: 'PHP — Streams Filters'
date: 2024-06-04
source: https://luizschons.com/php-streams-filters-d2c681cbec6d
translationKey: php-streams-filters
draft: false
tags: ['PHP']
---

<p>Se você já trabalhou com arquivos em PHP, provavelmente já usou funções como <code>fopen</code>, <code>fwrite</code>, <code>fread</code>, <code>fclose</code>, entre outras. Streams são uma abstração muito poderosa e flexível para trabalhar com arquivos e outros recursos de I/O.</p>
<p>Streams são uma forma de abstrair a manipulação de dados de entrada e saída, permitindo que você leia e escreva dados de e para diferentes fontes, como arquivos, strings, conexões de rede, etc.</p>
<p>Por exemplo, você pode usar streams para ler dados de um arquivo, processá-los e escrevê-los em outro arquivo, sem ter que se preocupar com a origem ou destino dos dados.</p>
<p>Ou então, você pode usar streams para ler dados de uma conexão de rede, processá-los e escrevê-los em um banco de dados. E assim por diante.</p>
<h3 id="heading-exemplo-basico">Exemplo básico</h3>

```php
$stream = fopen('data.txt', 'r');
while (!feof($stream)) {
    $line = fgets($stream);
    echo $line;
}
fclose($stream);
```

<p>Neste exemplo, abrimos um arquivo chamado <code>data.txt</code> em modo de leitura (<code>'r'</code>). Em seguida, lemos o conteúdo do arquivo linha por linha até o final do arquivo (<code>feof($stream)</code>). Por fim, fechamos o arquivo com <code>fclose($stream)</code>.</p>
<p>Mas o que é um stream? Um stream é um recurso que representa uma fonte ou destino de dados. No exemplo acima, <code>$stream</code> é um stream que representa o arquivo <code>data.txt</code>.</p>
<p>Vamos ver um exemplo mais avançado.</p>
<h3 id="heading-exemplo-avancado">Exemplo avançado</h3>

```php
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode(['key' => 'value']),
    ],
]);

$stream = fopen('http://example.com/data.csv', 'r', false, $context);
while (!feof($stream)) {
    $line = fgetcsv($stream);
    print_r($line);
}
fclose($stream);
```

<p>Neste exemplo, criamos um contexto de stream com <code>stream_context_create</code>, que é um array associativo com opções de configuração para o stream. No caso, estamos configurando um stream HTTP com o método <code>POST</code>, o cabeçalho <code>Content-Type: application/json</code> e o corpo da requisição em formato JSON.</p>
<p>Em seguida, abrimos um stream para a URL <code>http://example.com/data.csv</code> em modo de leitura (<code>'r'</code>) com o contexto de stream que acabamos de criar.</p>
<p>Depois, lemos o conteúdo do stream linha por linha com <code>fgetcsv</code>, que lê uma linha do stream e a converte em um array de valores separados por vírgula.</p>
<p>Por fim, fechamos o stream com <code>fclose</code>.</p>
<h3 id="heading-mas-por-que-usar-streams">Mas por que usar streams?</h3>
<p>O PHP surgiu em uma época em que a manipulação de arquivos era a principal forma de interagir com o sistema de arquivos e outros recursos de I/O. Por isso, as funções de manipulação de arquivos do PHP são baseadas em operações de baixo nível, como abrir, ler, escrever e fechar arquivos, os famosos <code>fopen</code>, <code>fread</code>, <code>fwrite</code> e <code>fclose</code>.</p>
<p>Com o tempo, a necessidade de interagir com outros tipos de recursos de I/O, como conexões de rede, bancos de dados, etc., tornou-se cada vez mais comum. E foi aí que os streams entraram em cena.</p>
<p>Streams são essencialmente uma camada de abstração sobre diferentes tipos de recursos de I/O, permitindo que você leia e escreva dados de e para esses recursos de forma consistente, independente da origem ou destino dos dados.</p>
<p>Quando eu falo de recursos de I/O, estou me referindo a qualquer coisa que você possa ler ou escrever dados, como arquivos, strings, janelas de console, conexões de rede, sockets, pipes, etc.</p>
<p>E quando eu falei de não se preocupar com a origem ou destino dos dados, eu quis dizer que você não precisa saber se está lendo de um arquivo, de uma conexão de rede, de um banco de dados, etc. Você simplesmente lê os dados do stream e os processa da forma que desejar. Isso é muito poderoso e flexível.</p>
<h3 id="heading-e-como-eu-uso-streams">E como eu uso streams?</h3>
<p>Para usar streams em PHP, você precisa entender alguns conceitos básicos:</p>
<ul>
<li><strong>Resource</strong></li>
<li><strong>Context</strong></li>
<li><strong>Wrapper</strong></li>
<li><strong>Stream functions</strong></li>
<li><strong>Stream filters</strong></li>
</ul>
<blockquote>
<p><strong><em>Nota</em></strong>: Este é apenas um resumo básico sobre streams em PHP. Para saber mais, consulte a <a target="_blank" href="https://www.php.net/manual/en/book.stream.php">documentação oficial</a>.</p>
</blockquote>
<h3 id="heading-resource">Resource</h3>
<p>Vamos nos aprofundar um pouco mais no conceito de recurso (resource) em PHP.</p>
<p>Um stream é representado por um recurso (resource) em PHP. Um recurso é uma variável especial que contém uma referência interna para um recurso externo, como um arquivo, uma conexão de rede, etc. Você pode criar um recurso com a função <code>fopen</code> e fechá-lo com a função <code>fclose</code>.</p>
<p>Um <code>resource</code> em PHP é um identificador interno para recursos externos, e a função <code>get_resource_type</code> pode ser usada para obter o tipo de recurso.</p>

```php
$stream = fopen('data.txt', 'r');
echo get_resource_type($stream);
fclose($stream);
```

<p>No console, você verá algo como <code>stream</code>.</p>
<p>O <code>resource</code> sempre vai referenciar o arquivo aberto.</p>
<h3 id="heading-context">Context</h3>
<p>Um contexto de stream é um array associativo com opções de configuração para o stream. Você pode criar um contexto de stream com a função <code>stream_context_create</code> e passá-lo como argumento para funções que abrem streams, como <code>fopen</code>, <code>file_get_contents</code>, etc.</p>
<p>Quando você abre um stream com um contexto de stream, as opções de configuração do contexto são aplicadas ao stream. Por exemplo, você pode configurar um stream HTTP com o método <code>POST</code>, o cabeçalho <code>Content-Type: application/json</code>, etc.</p>

```php
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode(['key' => 'value']),
    ],
]);

$stream = fopen('http://example.com/data.csv', 'r', false, $context);
```

<p>Ou então, você pode usar um contexto de stream para configurar um stream FTP com o nome de usuário e senha.</p>

```php
$context = stream_context_create([
    'ftp' => [
        'username' => 'user',
        'password' => 'pass',
    ],
]);

$stream = fopen('ftp://example.com/data.csv', 'r', false, $context);
```

<h3 id="heading-wrapper">Wrapper</h3>
<p>Um wrapper é um esquema de URL que define como o PHP deve abrir um stream. Por exemplo, o wrapper <code>http</code> é usado para abrir streams HTTP, o wrapper <code>ftp</code> é usado para abrir streams FTP, etc.</p>
<p>Quando você abre um stream com <code>fopen</code>, o PHP usa o wrapper correspondente para abrir o stream. Por exemplo, se você abrir um stream <code>http://example.com/data.csv</code>, o PHP usará o wrapper <code>http</code> para abrir o stream.</p>
<p>Você também pode usar wrappers para abrir streams de outros tipos de recursos, como strings, variáveis de memória, etc.</p>

```php
$stream = fopen('data:text/plain;base64,SGVsbG8gV29ybGQ=', 'r');
echo stream_get_contents($stream);
fclose($stream);
```

<p>Neste exemplo, estamos abrindo um stream de uma string codificada em base64 com o wrapper <code>data</code>. O conteúdo da string é <code>Hello World</code>.</p>

```php
$stream = fopen('php://memory', 'r+');
```

<p>Neste exemplo, estamos abrindo um stream de uma variável de memória com o wrapper <code>php</code>. O stream é aberto em modo de leitura e escrita (<code>'r+'</code>).</p>

```php
$stream = fopen('ogg://temp', 'r+');
```

<p>OGG é um wrapper que permite a manipulação de arquivos de áudio no formato OGG, isso é um exemplo de um wrapper personalizado.</p>
<p>Você pode criar seus próprios wrappers personalizados para abrir streams de outros tipos de recursos, como bancos de dados, APIs, etc.</p>
<p>Veja a <a target="_blank" href="https://www.php.net/manual/en/wrappers.php">documentação oficial</a> para mais informações sobre wrappers em PHP.</p>
<h3 id="heading-stream-functions">Stream functions</h3>
<p>O PHP fornece várias funções para trabalhar com streams, como <code>fopen</code>, <code>fclose</code>, <code>fread</code>, <code>fwrite</code>, <code>feof</code>, <code>fseek</code>, <code>ftell</code>, <code>fgetcsv</code>, <code>stream_get_contents</code>, etc.</p>
<p>Você pode usar essas funções para abrir, fechar, ler, escrever, posicionar, verificar o final, etc., de um stream.</p>
<p>Por exemplo, você pode usar <code>fopen</code> para abrir um stream, <code>fread</code> para ler dados do stream, <code>fwrite</code> para escrever dados no stream e <code>fclose</code> para fechar o stream.</p>

```php
$stream = fopen('data.txt', 'r');

while (!feof($stream)) {
    $line = fgets($stream);
    echo $line;
}

fwrite($stream, 'Hello World');
fclose($stream);
```

<p>Neste exemplo, estamos abrindo um arquivo chamado <code>data.txt</code> em modo de leitura (<code>'r'</code>). Em seguida, lemos o conteúdo do arquivo linha por linha até o final do arquivo com <code>fgets</code>. Depois, escrevemos a string <code>Hello World</code> no arquivo com <code>fwrite</code>. Por fim, fechamos o arquivo com <code>fclose</code>.</p>
<p>Você pode usar essas funções para trabalhar com streams de diferentes tipos de recursos, como o curl, sockets, pipes, etc.</p>

```php
$url = 'http://example.com/data/page.html';
$data = curl_init($url);
curl_setopt($data, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($data);
curl_close($data);
$stream = fopen('php://memory', 'r+');
fwrite($stream, $response);
rewind($stream);
echo stream_get_contents($stream);
fclose($stream);
```

<p>Neste exemplo, estamos fazendo uma requisição HTTP com o curl para a URL <code>http://example.com/data/page.html</code>. Em seguida, abrimos um stream de uma variável de memória com o wrapper <code>php</code> em modo de leitura e escrita (<code>'r+'</code>). Depois, escrevemos a resposta da requisição no stream com <code>fwrite</code>. Por fim, exibimos o conteúdo do stream com <code>stream_get_contents</code> e fechamos o stream com <code>fclose</code>.</p>
<h3 id="heading-stream-filters">Stream filters</h3>
<p>Aqui chegamos a um dos recursos mais poderosos e flexíveis dos streams em PHP: os filtros de stream.</p>
<p>Imagine o seguinte cenário: você está lendo dados de um arquivo e precisa processar esses dados antes de exibi-los na tela. Com os filtros de stream, você pode criar um filtro que processa os dados conforme necessário e aplicá-lo ao stream de leitura, sem precisar modificar o código que lê os dados.</p>
<p>Por exemplo, você pode usar um filtro de stream para converter os dados de um arquivo de texto para letras maiúsculas antes de exibi-los na tela.</p>

```php
$stream = fopen('data.txt', 'r');
stream_filter_append($stream, 'string.toupper');
echo stream_get_contents($stream);
fclose($stream);
```

<p>Neste exemplo, estamos abrindo um arquivo chamado <code>data.txt</code> em modo de leitura (<code>'r'</code>). Em seguida, aplicamos o filtro <code>string.toupper</code> ao stream com <code>stream_filter_append</code>, que converte os dados para letras maiúsculas. Por fim, exibimos o conteúdo do stream com <code>stream_get_contents</code> e fechamos o arquivo com <code>fclose</code>.</p>
<p>Essa conversão é feita automaticamente pelo filtro de stream, ocorre durante a leitura dos dados e não afeta o arquivo original.</p>
<p>Você pode criar seus próprios filtros de stream para processar os dados de acordo com suas necessidades.</p>
<p>Veja a <a target="_blank" href="https://www.php.net/manual/en/filters.php">documentação oficial</a> para mais informações sobre filtros de stream em PHP.</p>
<h3 id="heading-filterphp">FilterPHP</h3>
<p>Mas eu preparei um exemplo para você entender melhor como funciona um filtro de stream.</p>
<p>No primeiro exemplo, vamos criar um filtro de stream que filtrará somente para linhas que contêm a palavra “PHP”.</p>

```php
<?php

class FilterPHP extends php_user_filter
{
    public $stream;
    public string $filter;

    public function onCreate(): bool {
        $this->stream = fopen('php://temp', 'w+');
        return $this->stream !== false;
    }

    public function filter($in, $out, &$consumed, $closing): int {
        $this->filter = 'PHP';
        $out_data = '';
        while ($bucket = stream_bucket_make_writeable($in)) {
            $line = explode("\n", $bucket->data);
            foreach ($line as $l) {
                if (str_contains($l, $this->filter)) {
                    $out_data .= $l . "\n";
                }
            }
        }

        $bucket_out = stream_bucket_new($this->stream, $out_data);
        stream_bucket_append($out, $bucket_out);

        return PSFS_PASS_ON;
    }
}
```

<p>Vamos entender o que está acontecendo no código acima passo a passo.</p>
<ol>
<li>Criamos uma classe chamada <code>FilterPHP</code> que estende a classe <code>php_user_filter</code>. Esta classe é usada para criar um filtro de stream personalizado.</li>
</ol>
<p>Se você já trabalhou com classes em PHP, deve estar estranhando o fato de estender uma classe com um nome tão estranho. Isso acontece porque a classe <code>php_user_filter</code> é uma classe interna do PHP que não segue as convenções de nomenclatura de classes em PHP que foram estabelecidas pela comunidade ao longo dos anos.</p>
<ol start="2">
<li>A classe <code>FilterPHP</code> possui duas propriedades: <code>$stream</code> e <code>$filter</code>. A propriedade <code>$stream</code> é usada para armazenar um stream temporário onde os dados filtrados serão escritos. A propriedade <code>$filter</code> é usada para armazenar o filtro que será aplicado aos dados.</li>
<li>O método <code>onCreate</code> é chamado quando o filtro é criado. Neste método, abrimos um stream temporário com <code>fopen('php://temp', 'w+')</code> e armazenamos o recurso do stream na propriedade <code>$stream</code>. Se o stream não puder ser aberto, retornamos <code>false</code>.</li>
</ol>
<blockquote>
<p>O método <code>onCreate</code> é um método obrigatório que deve ser implementado em todos os filtros de stream personalizados, funcionando como um construtor para o filtro.</p>
<p>Mas o que é <code>php://temp</code>? <code>php://temp</code> é um wrapper que permite a criação de streams temporários em PHP. Os streams temporários são armazenados na memória ou em um arquivo temporário, dependendo do tamanho dos dados.</p>
</blockquote>
<p>4. O método <code>filter</code> é chamado para filtrar os dados do stream. Neste método, lemos os dados de entrada das seguintes variáveis:</p>
<ul>
<li><code>$in</code>: stream de entrada, onde os dados originais são lidos. Este stream é somente leitura, vem de <code>input</code> e é passado para o filtro.</li>
<li><code>$out</code>: stream de saída, onde os dados filtrados são escritos. Este stream é somente escrita, vem de <code>output</code> e é passado para o filtro.</li>
<li><code>&$consumed</code>: quantidade de dados consumidos pelo filtro. Este valor é atualizado pelo filtro e passado de volta para o PHP.</li>
<li><code>$closing</code>: indica se o stream está sendo fechado. Se for <code>true</code>, o filtro deve liberar todos os recursos alocados.</li>
</ul>
<blockquote>
<p><strong><em>Nota</em></strong>: O <code>&</code> na frente de uma variável em PHP indica que a variável é passada por referência, ou seja, o valor da variável pode ser alterado dentro da função e refletido fora dela.</p>
</blockquote>
<p>5. No método <code>filter</code>, lemos os dados de entrada do stream com <code>stream_bucket_make_writeable</code> e os armazenamos na variável <code>$out_data</code>. Em seguida, dividimos os dados em linhas com <code>explode("\n", $bucket->data)</code> e verificamos se cada linha contém a palavra "PHP" com <code>str_contains($l, $this->filter)</code>.</p>
<p>6. Se a linha contiver a palavra “PHP”, a linha é adicionada à variável <code>$out_data</code>. Em seguida, criamos um novo bucket de saída com <code>stream_bucket_new</code> e o adicionamos ao stream de saída com <code>stream_bucket_append</code>.</p>
<p>7. Por fim, retornamos <code>PSFS_PASS_ON</code> para indicar que o filtro deve continuar a passar os dados para o próximo filtro ou para o stream de saída.</p>
<p>Agora que criamos o filtro de stream, vamos aplicá-lo a um stream de entrada.</p>

```php
<?php
require_once './FilterPHP.php';
$json = 'https://raw.githubusercontent.com/sschonss/stream-php/main/data.json';
$fileContents = file_get_contents($json);

if ($fileContents === false) {
    die('Failed to fetch data from the endpoint.');
}

stream_filter_register('filterphp', 'FilterPHP') or die("Failed to register filter.");

$tempStream = fopen('php://temp', 'r+');
fwrite($tempStream, $fileContents);
rewind($tempStream);

$out_fp = fopen('php://stdout', 'w') or die("Failed to open output stream.");
stream_filter_append($tempStream, 'filterphp');

while ($data = fread($tempStream, 1024)) {
    $data = str_replace('"name": ', '', $data);
    $data = str_replace('"description": ', '', $data);
    echo $data;
}

fclose($tempStream);
fclose($out_fp);
```

<p>Neste exemplo, estamos lendo um arquivo JSON de uma URL com <code>file_get_contents</code> e armazenando o conteúdo do arquivo em uma variável chamada <code>$fileContents</code>.</p>
<p>Em seguida, registramos o filtro de stream <code>FilterPHP</code> com <code>stream_filter_register</code>. O primeiro argumento é o nome do filtro, que será usado para aplicar o filtro ao stream de entrada. O segundo argumento é o nome da classe do filtro.</p>
<p>É importante registrar o filtro de stream antes de aplicá-lo ao stream de entrada, para que o PHP saiba como lidar com o filtro.</p>
<p>Depois, abrimos um stream temporário com <code>fopen('php://temp', 'r+')</code> e escrevemos o conteúdo do arquivo no stream com <code>fwrite</code>. Em seguida, rebobinamos o stream com <code>rewind</code>.</p>
<blockquote>
<p><strong><em>Nota</em></strong>: O <code>rewind</code> é uma função que move o ponteiro interno do stream para o início do stream. Isso é necessário porque o ponteiro interno do stream é movido para o final do stream após a escrita.</p>
<p><strong><em>Nota</em></strong>: Ponteiro em PHP é como se fosse um cursor que aponta para a posição atual do stream.</p>
</blockquote>
<p>Depois, abrimos um stream de saída com <code>fopen('php://stdout', 'w')</code> e aplicamos o filtro de stream <code>FilterPHP</code> ao stream temporário com <code>stream_filter_append</code>.</p>
<p>Por fim, lemos os dados do stream temporário com <code>fread</code> e exibimos os dados na tela com <code>echo</code>. Antes de exibir os dados, removemos as aspas duplas das chaves <code>name</code> e <code>description</code> com <code>str_replace</code>.</p>
<p>Por fim, fechamos o stream temporário e o stream de saída com <code>fclose</code>.</p>
<p>O retorno do código acima será algo como:</p>

```text
php-filter_1  |       "PHP",
php-filter_1  |        "PHP (Hypertext Preprocessor) é uma linguagem de script amplamente utilizada para desenvolvimento web e pode ser embutida em HTML."
php-filter_1  |        "Composer é um gerenciador de dependências para PHP, permitindo que você declare as bibliotecas que seu projeto depende e as instale."
php-filter_1  |        "Laravel é um framework web PHP, conhecido por sua sintaxe elegante e ferramentas robustas para desenvolvimento rápido de aplicativos."
php-filter_1  |        "Symfony é um conjunto de componentes PHP reutilizáveis e um framework web para criar aplicações e sites."
php-filter_1  |        "CodeIgniter é um framework PHP poderoso e simples de usar, construído para desenvolvedores que precisam de um toolkit elegante para criar aplicativos web completos."
php-filter_1  |       "CakePHP",
php-filter_1  |        "CakePHP é um framework PHP rápido de desenvolvimento que proporciona uma estrutura extensível para desenvolvedores criar aplicativos web."
php-filter_1  |        "Zend Framework é uma coleção de pacotes PHP profissionais com mais de 570 milhões de instalações."
```

<p>Caso você queira testar o código acima, você pode clonar o repositório <a target="_blank" href="https://github.com/sschonss/stream-php">stream-php</a> e executar o comando <code>docker-compose up</code> para subir o container com o PHP e testar o código.</p>
<h3 id="heading-conclusao">Conclusão</h3>
<p>Streams são uma abstração poderosa e flexível para trabalhar com arquivos e outros recursos de I/O em PHP. Com streams, você pode ler e escrever dados de e para diferentes fontes, como arquivos, strings, conexões de rede, etc., de forma consistente e independente da origem ou destino dos dados.</p>
<p>Além disso, você pode usar contextos de stream para configurar streams com opções específicas, wrappers para abrir streams de diferentes tipos de recursos, funções de stream para trabalhar com streams de forma eficiente e filtros de stream para processar os dados conforme necessário.</p>
<p>Espero que este guia tenha sido útil para você entender melhor como trabalhar com streams em PHP. Se tiver alguma dúvida, sugestão ou correção, fique à vontade para entrar em contato.</p>
<p>Até a próxima!</p>
