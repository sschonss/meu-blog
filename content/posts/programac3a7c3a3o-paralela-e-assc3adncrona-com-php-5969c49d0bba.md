---
title: 'Programação Paralela, e Assíncrona com PHP'
date: 2024-04-25
source: https://luizschons.com/programac3a7c3a3o-paralela-e-assc3adncrona-com-php-5969c49d0bba
draft: false
aliases: ["/programac3a7c3a3o-paralela-e-assc3adncrona-com-php-5969c49d0bba/"]
---

<p>Photo by <a target="_blank" href="https://unsplash.com/@benofthenorth?utm_source=medium&utm_medium=referral">Ben Griffiths</a> on <a target="_blank" href="https://unsplash.com?utm_source=medium&utm_medium=referral">Unsplash</a></p>
<h3 id="heading-introducao">Introdução</h3>
<p>PHP é uma linguagem de programação de propósito geral, amplamente utilizada para desenvolvimento web. No entanto, PHP também pode ser utilizado para desenvolvimento de aplicações desktop, scripts de automação, entre outros. Neste artigo, vamos explorar o uso de PHP para programação paralela e assíncrona.</p>
<h3 id="heading-programacao-paralela">Programação Paralela</h3>
<p>Programação paralela é um paradigma de programação que consiste em dividir um problema em partes menores que podem ser executadas simultaneamente. Em PHP, a programação paralela pode ser feita utilizando a extensão <a target="_blank" href="https://www.php.net/manual/en/book.parallel.php">parallel</a> ou a extensão <a target="_blank" href="https://www.php.net/manual/en/book.pthreads.php">pthreads</a>, que permite a criação de threads em PHP.</p>
<h4 id="heading-mas-voce-sabe-o-que-e-uma-thread">Mas você sabe o que é uma thread?</h4>
<blockquote>
<p><em>Uma thread é uma unidade básica de processamento que pode ser executada de forma independente. Em um programa paralelo, várias threads podem ser executadas simultaneamente, o que pode resultar em um aumento significativo de desempenho.</em></p>
<p><em>Quando você compra um processador com múltiplos núcleos, você está comprando a capacidade de executar várias threads simultaneamente. No entanto, para aproveitar ao máximo essa capacidade, é necessário que o software seja desenvolvido de forma a utilizar esses recursos de forma eficiente.</em></p>
</blockquote>
<h4 id="heading-exemplo-de-programacao-paralela-em-php">Exemplo de Programação Paralela em PHP</h4>
<p><?php  </p>
<p>use function parallel\run;  </p>
<p>class DataProcessor<br />{<br />    public function process(array $data): array {<br />        $formattedData = $this->formatData($data);<br />        $excel_file = $this->generateExcel($formattedData);<br />        $this->sendEmail($excel_file, Auth::user()->email);<br />    }<br />}  </p>
<p>$data = range(1, 1000);  </p>
<p>$processor = new DataProcessor();  </p>
<p>$parallelResult1 = run(function () use ($processor, $data) {<br />    return $processor->process($data);<br />});  </p>
<p>$parallelResult2 = $processor->process($data);</p>
<p>No exemplo acima, estamos utilizando a extensão parallel para executar o método <code>process</code> da classe <code>DataProcessor</code> em paralelo. Isso significa que o método será executado em uma thread separada, o que pode resultar em um aumento de desempenho.</p>
<p>Isso não é bala de prata, e nem sempre é a melhor solução para todos os problemas. No entanto, em alguns casos, a programação paralela pode ser uma forma eficiente de melhorar o desempenho de uma aplicação.</p>
<p>O exemplo acima é bastante simplificado, mas ilustra como a programação paralela pode ser utilizada em PHP. Para obter mais informações sobre a extensão parallel, consulte a <a target="_blank" href="https://www.php.net/manual/en/book.parallel.php">documentação oficial</a>.</p>
<p>Aqui esta uma imagem de um exemplo de programação paralela em PHP:</p>
<p><img src="/images/posts/programac3a7c3a3o-paralela-e-assc3adncrona-com-php-5969c49d0bba/e7563efd-e150-4fc2-a5d1-758f6bb59a65.png" alt /></p>
<p><em>Imagem ilustrativa de um exemplo de programação paralela retirada da internet.</em></p>
<p>Perceba que a programação paralela é diferente da programação assíncrona. Na programação paralela, várias threads são executadas simultaneamente, enquanto na programação assíncrona, várias tarefas podem ser executadas de forma concorrente, mas não necessariamente simultaneamente.</p>
<h3 id="heading-programacao-assincrona">Programação Assíncrona</h3>
<p>Programação assíncrona é um paradigma de programação que consiste em executar tarefas de forma concorrente, sem a necessidade de esperar que uma tarefa seja concluída para iniciar outra. Em PHP, a programação assíncrona pode ser feita utilizando a extensão <a target="_blank" href="https://www.swoole.co.uk/">swoole</a>, que permite a criação de servidores web assíncronos em PHP.</p>
<h4 id="heading-mas-voce-sabe-o-que-e-um-servidor-web-assincrono">Mas você sabe o que é um servidor web assíncrono?</h4>
<blockquote>
<p><em>Um servidor web assíncrono é um servidor que pode lidar com várias requisições simultaneamente, sem a necessidade de criar uma nova thread para cada requisição. Isso permite que o servidor seja mais eficiente e possa lidar com um grande número de requisições de forma concorrente.</em></p>
<p><em>Você pode achar o termo “servidor auto-contido” em alguns lugares, mas a ideia é a mesma: um servidor que pode lidar com várias requisições simultaneamente, sem a necessidade de criar uma nova thread para cada requisição.</em></p>
</blockquote>
<h4 id="heading-exemplo-de-programacao-assincrona-em-php">Exemplo de Programação Assíncrona em PHP</h4>
<p>use Swoole\Http\Server;  </p>
<p>$server = new Server("0.0.0.0", 9501);  </p>
<p>$server->on("start", function (Server $server) {<br />    echo "Server started at http://{$server->host}:{$server->port}\n";<br />});  </p>
<p>$server->on("request", function ($request, $response) {<br />    $data = $request->rawContent();<br />    $response->end("Received data: $data");<br />});  </p>
<p>$server->start();</p>
<p>No exemplo acima, estamos utilizando a extensão swoole para criar um servidor web assíncrono em PHP. O servidor irá escutar na porta 9501 e responder a todas as requisições com uma mensagem contendo os dados recebidos</p>
<p>Esse exemplo é bastante simplificado, mas ilustra como a programação assíncrona pode ser utilizada em PHP. Para obter mais informações sobre a extensão swoole, consulte a <a target="_blank" href="https://www.swoole.co.uk/">documentação oficial</a>.</p>
<p>Aqui esta uma imagem de um exemplo de programação assíncrona:</p>
<p><img src="/images/posts/programac3a7c3a3o-paralela-e-assc3adncrona-com-php-5969c49d0bba/554adf54-7f19-4abf-bea2-aad9a2b23333.png" alt /></p>
<p>Imagem ilustrativa de um exemplo de programação assíncrona retirada da internet.</p>
<h3 id="heading-ciclo-de-vida-de-uma-requisicao-no-php-fpm">Ciclo de Vida de uma Requisição no PHP-FPM</h3>
<p>Quando uma requisição é feita a um servidor web PHP, como o PHP-FPM, o servidor passa por várias etapas para processar a requisição e retornar uma resposta ao cliente. O ciclo de vida de uma requisição no PHP-FPM pode ser dividido em várias etapas:</p>
<ol>
<li><strong>Recebimento da Requisição:</strong> O servidor web (Apache, Nginx, etc.) recebe a requisição do cliente e a encaminha para o PHP-FPM.</li>
<li><strong>Pool de Processos:</strong> O PHP-FPM mantém um pool de processos PHP pré-carregados para processar as requisições. Quando uma requisição é recebida, o PHP-FPM escolhe um processo disponível para processar a requisição.</li>
<li><strong>Autoload:</strong> O PHP-FPM carrega os arquivos necessários para processar a requisição, incluindo as classes e funções utilizadas no script PHP. As classes e funções são carregadas automaticamente pelo PHP, de acordo com as regras de autoload definidas no arquivo <code>composer.json</code>.</li>
<li><strong>Análise e Compilação:</strong> O PHP analisa o script PHP e compila o código em uma forma que pode ser executada pelo interpretador PHP.</li>
<li><strong>Execução do Script:</strong> O PHP executa o script PHP, processando as instruções e gerando a saída da requisição.</li>
<li><strong>Gerar Resposta:</strong> O PHP-FPM gera a resposta da requisição, incluindo o cabeçalho HTTP e o corpo da resposta.</li>
<li><strong>Envio da Resposta:</strong> O PHP-FPM envia a resposta ao servidor web, que a encaminha de volta ao cliente.</li>
<li><strong>Encerramento do Processo:</strong> Após enviar a resposta, o processo PHP é encerrado e retorna ao pool de processos disponíveis para processar novas requisições.</li>
</ol>
<p>O ciclo de vida de uma requisição no PHP-FPM pode variar dependendo da configuração do servidor web e do PHP-FPM. No entanto, essas etapas são comuns na maioria dos servidores web PHP.</p>
<h3 id="heading-ciclo-de-vida-de-uma-requisicao-no-swoole">Ciclo de Vida de uma Requisição no Swoole</h3>
<p>Quando uma requisição é feita a um servidor web assíncrono PHP, como o Swoole, o servidor passa por várias etapas para processar a requisição e retornar uma resposta ao cliente. O ciclo de vida de uma requisição no Swoole pode ser dividido em várias etapas:</p>
<p>O início do ciclo de vida de uma requisição no Swoole começa com a inicialização do servidor Swoole e a configuração do script PHP que será executado para processar as requisições. O servidor Swoole escuta em uma porta específica e aguarda a chegada de requisições.</p>
<p>Nesse ponto, o servidor já está com o autoload configurado, as classes e funções necessárias já estão carregadas e o script PHP está pronto para processar as requisições.</p>
<ol>
<li><strong>Recebimento da Requisição:</strong> Quando uma requisição é feita ao servidor Swoole, o servidor recebe a requisição e a encaminha para o script PHP configurado para processar a requisição.</li>
<li><strong>Processamento da Requisição:</strong> O script PHP processa a requisição, executando as instruções necessárias para gerar a resposta da requisição.</li>
<li><strong>Análise e Compilação:</strong> O PHP analisa o script PHP e compila o código em uma forma que pode ser executada pelo interpretador PHP.</li>
<li><strong>Execução do Script:</strong> O PHP executa o script PHP, processando as instruções e gerando a saída da requisição.</li>
<li><strong>Gerar Resposta:</strong> O script PHP gera a resposta da requisição, incluindo o cabeçalho HTTP e o corpo da resposta.</li>
<li><strong>Envio da Resposta:</strong> O servidor Swoole envia a resposta ao cliente, encerrando o ciclo de vida da requisição.</li>
</ol>
<p>E nesse momento, o servidor Swoole está pronto para processar novas requisições, mantendo um pool de processos PHP disponíveis para processar as requisições de forma assíncrona.</p>
<p>A diferença entre o ciclo de vida de uma requisição no PHP-FPM e no Swoole está na forma como o servidor PHP é inicializado e como as requisições são processadas. No PHP-FPM, o servidor PHP é inicializado para processar uma única requisição de cada vez, enquanto no Swoole, o servidor PHP é inicializado para processar várias requisições de forma assíncrona.</p>
<h3 id="heading-conclusao">Conclusão</h3>
<p>Neste artigo, exploramos o uso de PHP para programação paralela e assíncrona. A programação paralela e assíncrona são técnicas de programação que podem ser utilizadas para melhorar o desempenho de uma aplicação e lidar com um grande número de requisições de forma eficiente.</p>
<p>Nem tudo é regra, e nem sempre a programação paralela ou assíncrona é a melhor solução para um problema. No entanto, é sempre bom conhecer as diferentes técnicas de programação disponíveis e saber quando utilizá-las de forma eficiente.</p>
<p>Espero que este artigo tenha sido útil e que você tenha aprendido algo novo sobre programação paralela e assíncrona em PHP. Espero que futuramente eu consiga fazer um artigo mais detalhado sobre cada uma dessas técnicas, com exemplos mais complexos e detalhados.</p>
<p>Qualquer dúvida, correção ou sugestão, fique à vontade para entrar em contato. Obrigado por ler até aqui!</p>
<h3 id="heading-referencias">Referências</h3>
<ul>
<li><a target="_blank" href="https://www.php.net/manual/en/book.parallel.php">PHP Parallel Extension</a></li>
<li><a target="_blank" href="https://www.php.net/manual/en/book.pthreads.php">PHP pthreads Extension</a></li>
<li><a target="_blank" href="https://www.swoole.co.uk/">Swoole Extension</a></li>
<li><a target="_blank" href="https://www.php.net/manual/en/install.fpm.php">PHP-FPM</a></li>
<li><a target="_blank" href="https://www.php.net/manual/en/language.oop5.autoload.php">PHP Autoload</a></li>
<li><a target="_blank" href="https://getcomposer.org/">PHP Composer</a></li>
<li><a target="_blank" href="https://www.php-fig.org/psr/">PHP PSR</a></li>
<li><a target="_blank" href="https://fastcgi-archives.github.io/">FastCGI</a></li>
</ul>
<h3 id="heading-autor">Autor</h3>
<ul>
<li><a target="_blank" href="https://linkedin.com/in/luiz-schons">Luiz Schons</a></li>
</ul>
