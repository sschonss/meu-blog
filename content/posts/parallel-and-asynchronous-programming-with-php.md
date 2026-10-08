---
title: 'Parallel and Asynchronous Programming with PHP'
date: 2024-04-25
translationKey: programacao-paralela-e-assincrona-com-php
draft: false
tags: ['PHP', 'Performance']
---

<p>Photo by <a target="_blank" href="https://unsplash.com/@benofthenorth?utm_source=medium&utm_medium=referral">Ben Griffiths</a> on <a target="_blank" href="https://unsplash.com?utm_source=medium&utm_medium=referral">Unsplash</a></p>
<h3 id="heading-introduction">Introduction</h3>
<p>PHP is a general-purpose programming language widely used for web development. However, PHP can also be used for desktop applications, automation scripts and more. In this article, we will explore using PHP for parallel and asynchronous programming.</p>
<h3 id="heading-parallel-programming">Parallel Programming</h3>
<p>Parallel programming is a programming paradigm that splits a problem into smaller parts that can run at the same time. In PHP, parallel programming can be done with the <a target="_blank" href="https://www.php.net/manual/en/book.parallel.php">parallel</a> extension or the <a target="_blank" href="https://www.php.net/manual/en/book.pthreads.php">pthreads</a> extension, which let you create threads in PHP.</p>
<h4 id="heading-but-do-you-know-what-a-thread-is">But do you know what a thread is?</h4>
<blockquote>
<p><em>A thread is a basic unit of processing that can run independently. In a parallel program, several threads can run at the same time, which can result in a significant performance boost.</em></p>
<p><em>When you buy a multi-core processor, you are buying the ability to run several threads at the same time. However, to take full advantage of that, the software has to be built to use those resources efficiently.</em></p>
</blockquote>
<h4 id="heading-parallel-programming-example-in-php">Parallel Programming Example in PHP</h4>

```php
<?php
use function parallel\run;

class DataProcessor
{
    public function process(array $data): array {
        $formattedData = $this->formatData($data);
        $excel_file = $this->generateExcel($formattedData);
        $this->sendEmail($excel_file, Auth::user()->email);
    }
}

$data = range(1, 1000);
$processor = new DataProcessor();

$parallelResult1 = run(function () use ($processor, $data) {
    return $processor->process($data);
});

$parallelResult2 = $processor->process($data);
```

<p>In the example above, we use the parallel extension to run the <code>process</code> method of the <code>DataProcessor</code> class in parallel. This means the method runs in a separate thread, which can result in better performance.</p>
<p>This is not a silver bullet, and it is not always the best solution for every problem. In some cases, however, parallel programming can be an efficient way to improve an application's performance.</p>
<p>The example above is quite simplified, but it shows how parallel programming can be used in PHP. For more information about the parallel extension, see the <a target="_blank" href="https://www.php.net/manual/en/book.parallel.php">official documentation</a>.</p>
<p>Here is an image illustrating parallel programming:</p>
<p><img src="/images/posts/programacao-paralela-e-assincrona-com-php/e7563efd-e150-4fc2-a5d1-758f6bb59a65.png" alt="Parallel programming diagram: the main thread starts threads A, B and C, which run at the same time" /></p>
<p><em>Illustration of parallel programming, taken from the internet.</em></p>
<p>Note that parallel programming is different from asynchronous programming. In parallel programming, several threads run at the same time, while in asynchronous programming several tasks can run concurrently, but not necessarily at the same time.</p>
<h3 id="heading-asynchronous-programming">Asynchronous Programming</h3>
<p>Asynchronous programming is a programming paradigm that runs tasks concurrently, without waiting for one task to finish before starting another. In PHP, asynchronous programming can be done with the <a target="_blank" href="https://www.swoole.co.uk/">swoole</a> extension, which lets you create asynchronous web servers in PHP.</p>
<h4 id="heading-but-do-you-know-what-an-asynchronous-web-server-is">But do you know what an asynchronous web server is?</h4>
<blockquote>
<p><em>An asynchronous web server is a server that can handle several requests at the same time without creating a new thread for each one. This makes the server more efficient and able to handle a large number of requests concurrently.</em></p>
<p><em>You may see the term “self-contained server” in some places, but the idea is the same: a server that can handle several requests at the same time without creating a new thread for each one.</em></p>
</blockquote>
<h4 id="heading-asynchronous-programming-example-in-php">Asynchronous Programming Example in PHP</h4>

```php
use Swoole\Http\Server;
$server = new Server("0.0.0.0", 9501);

$server->on("start", function (Server $server) {
    echo "Server started at http://{$server->host}:{$server->port}\n";
});

$server->on("request", function ($request, $response) {
    $data = $request->rawContent();
    $response->end("Received data: $data");
});

$server->start();
```

<p>In the example above, we use the swoole extension to create an asynchronous web server in PHP. The server listens on port 9501 and answers every request with a message containing the data it received.</p>
<p>This example is quite simplified, but it shows how asynchronous programming can be used in PHP. For more information about the swoole extension, see the <a target="_blank" href="https://www.swoole.co.uk/">official documentation</a>.</p>
<p>Here is an image illustrating asynchronous programming:</p>
<p><img src="/images/posts/programacao-paralela-e-assincrona-com-php/554adf54-7f19-4abf-bea2-aad9a2b23333.png" alt="Sequence diagram of asynchronous programming: a process fires several requests through a thread and gets the responses out of order" /></p>
<p>Illustration of asynchronous programming, taken from the internet.</p>
<h3 id="heading-request-lifecycle-in-php-fpm">Request Lifecycle in PHP-FPM</h3>
<p>When a request is made to a PHP web server such as PHP-FPM, the server goes through several steps to process it and return a response to the client. The lifecycle of a request in PHP-FPM can be split into these steps:</p>
<ol>
<li><strong>Receiving the Request:</strong> The web server (Apache, Nginx, etc.) receives the client's request and forwards it to PHP-FPM.</li>
<li><strong>Process Pool:</strong> PHP-FPM keeps a pool of preloaded PHP processes to handle requests. When a request arrives, PHP-FPM picks an available process to handle it.</li>
<li><strong>Autoload:</strong> PHP-FPM loads the files needed to process the request, including the classes and functions used in the PHP script. Classes and functions are loaded automatically by PHP, following the autoload rules defined in <code>composer.json</code>.</li>
<li><strong>Parsing and Compilation:</strong> PHP parses the PHP script and compiles the code into a form the PHP interpreter can execute.</li>
<li><strong>Script Execution:</strong> PHP executes the script, processing its instructions and generating the request's output.</li>
<li><strong>Building the Response:</strong> PHP-FPM builds the response, including the HTTP headers and the response body.</li>
<li><strong>Sending the Response:</strong> PHP-FPM sends the response to the web server, which forwards it back to the client.</li>
<li><strong>Ending the Process:</strong> After sending the response, the PHP process finishes and returns to the pool of processes available for new requests.</li>
</ol>
<p>The lifecycle of a request in PHP-FPM can vary depending on the web server and PHP-FPM configuration. However, these steps are common to most PHP web servers.</p>
<h3 id="heading-request-lifecycle-in-swoole">Request Lifecycle in Swoole</h3>
<p>When a request is made to an asynchronous PHP web server such as Swoole, the server goes through several steps to process it and return a response to the client. The lifecycle of a request in Swoole can be split into these steps:</p>
<p>The lifecycle starts when the Swoole server boots and sets up the PHP script that will handle requests. The Swoole server listens on a specific port and waits for requests to arrive.</p>
<p>At this point, the server already has autoload configured, the required classes and functions are already loaded, and the PHP script is ready to handle requests.</p>
<ol>
<li><strong>Receiving the Request:</strong> When a request reaches the Swoole server, the server receives it and passes it to the PHP script configured to handle it.</li>
<li><strong>Processing the Request:</strong> The PHP script processes the request, running the instructions needed to generate the response.</li>
<li><strong>Parsing and Compilation:</strong> PHP parses the PHP script and compiles the code into a form the PHP interpreter can execute.</li>
<li><strong>Script Execution:</strong> PHP executes the script, processing its instructions and generating the request's output.</li>
<li><strong>Building the Response:</strong> The PHP script builds the response, including the HTTP headers and the response body.</li>
<li><strong>Sending the Response:</strong> The Swoole server sends the response to the client, ending the request's lifecycle.</li>
</ol>
<p>At that point, the Swoole server is ready for new requests, keeping a pool of PHP processes available to handle them asynchronously.</p>
<p>The difference between the request lifecycle in PHP-FPM and in Swoole lies in how the PHP server boots and how requests are processed. In PHP-FPM, each PHP process is set up to handle one request at a time, while in Swoole the PHP server is set up to handle many requests asynchronously.</p>
<h3 id="heading-conclusion">Conclusion</h3>
<p>In this article, we explored using PHP for parallel and asynchronous programming. Parallel and asynchronous programming are techniques that can improve an application's performance and handle a large number of requests efficiently.</p>
<p>There are no hard rules, and parallel or asynchronous programming is not always the best solution to a problem. Still, it is always good to know the different techniques available and when to use them well.</p>
<p>I hope this article was useful and that you learned something new about parallel and asynchronous programming in PHP. In the future, I hope to write a more detailed article about each of these techniques, with more complex examples.</p>
<p>If you have any questions, corrections or suggestions, feel free to reach out. Thanks for reading this far!</p>
<h3 id="heading-references">References</h3>
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
<h3 id="heading-author">Author</h3>
<ul>
<li><a target="_blank" href="https://linkedin.com/in/luiz-schons">Luiz Schons</a></li>
</ul>
