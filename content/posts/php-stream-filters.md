---
title: 'PHP — Stream Filters'
date: 2024-06-04
translationKey: php-streams-filters
draft: false
tags: ['PHP']
---

<p>If you have ever worked with files in PHP, you have probably used functions like <code>fopen</code>, <code>fwrite</code>, <code>fread</code> and <code>fclose</code>. Streams are a very powerful and flexible abstraction for working with files and other I/O resources.</p>
<p>Streams abstract the handling of input and output data, letting you read and write data from and to different sources, such as files, strings, network connections, etc.</p>
<p>For example, you can use streams to read data from a file, process it and write it to another file, without worrying about where the data comes from or where it goes.</p>
<p>Or you can use streams to read data from a network connection, process it and write it to a database. And so on.</p>
<h3 id="heading-basic-example">Basic example</h3>

```php
$stream = fopen('data.txt', 'r');
while (!feof($stream)) {
    $line = fgets($stream);
    echo $line;
}
fclose($stream);
```

<p>In this example, we open a file called <code>data.txt</code> in read mode (<code>'r'</code>). Then we read the file line by line until the end (<code>feof($stream)</code>). Finally, we close the file with <code>fclose($stream)</code>.</p>
<p>But what is a stream? A stream is a resource that represents a source or destination of data. In the example above, <code>$stream</code> is a stream that represents the file <code>data.txt</code>.</p>
<p>Let's look at a more advanced example.</p>
<h3 id="heading-advanced-example">Advanced example</h3>

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

<p>In this example, we create a stream context with <code>stream_context_create</code>, an associative array of configuration options for the stream. Here we configure an HTTP stream with the <code>POST</code> method, the <code>Content-Type: application/json</code> header and a JSON request body.</p>
<p>Then we open a stream to the URL <code>http://example.com/data.csv</code> in read mode (<code>'r'</code>) with the stream context we just created.</p>
<p>Next, we read the stream line by line with <code>fgetcsv</code>, which reads a line from the stream and turns it into an array of comma-separated values.</p>
<p>Finally, we close the stream with <code>fclose</code>.</p>
<h3 id="heading-but-why-use-streams">But why use streams?</h3>
<p>PHP was born at a time when file handling was the main way to interact with the file system and other I/O resources. That is why PHP's file functions are based on low-level operations such as opening, reading, writing and closing files: the famous <code>fopen</code>, <code>fread</code>, <code>fwrite</code> and <code>fclose</code>.</p>
<p>Over time, the need to interact with other kinds of I/O resources, such as network connections and databases, became more and more common. That is where streams came in.</p>
<p>Streams are essentially an abstraction layer over different kinds of I/O resources, letting you read and write data from and to them consistently, regardless of where the data comes from or goes to.</p>
<p>By I/O resources, I mean anything you can read data from or write data to, such as files, strings, console windows, network connections, sockets, pipes, etc.</p>
<p>And by not worrying about where the data comes from or goes to, I mean you don't need to know whether you are reading from a file, a network connection, a database, etc. You simply read the data from the stream and process it however you like. That is very powerful and flexible.</p>
<h3 id="heading-so-how-do-i-use-streams">So how do I use streams?</h3>
<p>To use streams in PHP, you need to understand a few basic concepts:</p>
<ul>
<li><strong>Resource</strong></li>
<li><strong>Context</strong></li>
<li><strong>Wrapper</strong></li>
<li><strong>Stream functions</strong></li>
<li><strong>Stream filters</strong></li>
</ul>
<blockquote>
<p><strong><em>Note</em></strong>: this is just a basic overview of streams in PHP. To learn more, see the <a target="_blank" href="https://www.php.net/manual/en/book.stream.php">official documentation</a>.</p>
</blockquote>
<h3 id="heading-resource">Resource</h3>
<p>Let's dig a little deeper into the concept of a resource in PHP.</p>
<p>A stream is represented by a resource in PHP. A resource is a special variable that holds an internal reference to an external resource, such as a file or a network connection. You can create a resource with <code>fopen</code> and close it with <code>fclose</code>.</p>
<p>A <code>resource</code> in PHP is an internal identifier for external resources, and the <code>get_resource_type</code> function can be used to get the resource's type.</p>

```php
$stream = fopen('data.txt', 'r');
echo get_resource_type($stream);
fclose($stream);
```

<p>In the console, you will see something like <code>stream</code>.</p>
<p>The <code>resource</code> always refers to the open file.</p>
<h3 id="heading-context">Context</h3>
<p>A stream context is an associative array of configuration options for the stream. You can create one with <code>stream_context_create</code> and pass it as an argument to functions that open streams, such as <code>fopen</code>, <code>file_get_contents</code>, etc.</p>
<p>When you open a stream with a stream context, the context's options are applied to the stream. For example, you can configure an HTTP stream with the <code>POST</code> method, the <code>Content-Type: application/json</code> header, etc.</p>

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

<p>Or you can use a stream context to configure an FTP stream with a username and password.</p>

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
<p>A wrapper is a URL scheme that defines how PHP should open a stream. For example, the <code>http</code> wrapper is used to open HTTP streams, the <code>ftp</code> wrapper to open FTP streams, and so on.</p>
<p>When you open a stream with <code>fopen</code>, PHP uses the matching wrapper to open it. For example, if you open <code>http://example.com/data.csv</code>, PHP uses the <code>http</code> wrapper.</p>
<p>You can also use wrappers to open streams over other kinds of resources, such as strings, in-memory variables, etc.</p>

```php
$stream = fopen('data:text/plain;base64,SGVsbG8gV29ybGQ=', 'r');
echo stream_get_contents($stream);
fclose($stream);
```

<p>In this example, we open a stream over a base64-encoded string with the <code>data</code> wrapper. The string's content is <code>Hello World</code>.</p>

```php
$stream = fopen('php://memory', 'r+');
```

<p>In this example, we open an in-memory stream with the <code>php</code> wrapper. The stream is opened in read-write mode (<code>'r+'</code>).</p>

```php
$stream = fopen('ogg://temp', 'r+');
```

<p>OGG is a wrapper for handling audio files in the OGG format; this is an example of a custom wrapper.</p>
<p>You can create your own custom wrappers to open streams over other kinds of resources, such as databases, APIs, etc.</p>
<p>See the <a target="_blank" href="https://www.php.net/manual/en/wrappers.php">official documentation</a> for more information about wrappers in PHP.</p>
<h3 id="heading-stream-functions">Stream functions</h3>
<p>PHP provides several functions for working with streams, such as <code>fopen</code>, <code>fclose</code>, <code>fread</code>, <code>fwrite</code>, <code>feof</code>, <code>fseek</code>, <code>ftell</code>, <code>fgetcsv</code>, <code>stream_get_contents</code>, etc.</p>
<p>You can use these functions to open, close, read, write, seek, check for the end of a stream, and so on.</p>
<p>For example, you can use <code>fopen</code> to open a stream, <code>fread</code> to read from it, <code>fwrite</code> to write to it and <code>fclose</code> to close it.</p>

```php
$stream = fopen('data.txt', 'r');

while (!feof($stream)) {
    $line = fgets($stream);
    echo $line;
}

fwrite($stream, 'Hello World');
fclose($stream);
```

<p>In this example, we open a file called <code>data.txt</code> in read mode (<code>'r'</code>). Then we read the file line by line until the end with <code>fgets</code>. Next, we write the string <code>Hello World</code> to the file with <code>fwrite</code>. Finally, we close the file with <code>fclose</code>.</p>
<p>You can use these functions with streams over different kinds of resources, such as curl, sockets, pipes, etc.</p>

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

<p>In this example, we make an HTTP request with curl to <code>http://example.com/data/page.html</code>. Then we open an in-memory stream with the <code>php</code> wrapper in read-write mode (<code>'r+'</code>). Next, we write the response to the stream with <code>fwrite</code>. Finally, we print the stream's contents with <code>stream_get_contents</code> and close it with <code>fclose</code>.</p>
<h3 id="heading-stream-filters">Stream filters</h3>
<p>Here we reach one of the most powerful and flexible features of streams in PHP: stream filters.</p>
<p>Imagine the following scenario: you are reading data from a file and need to process it before printing it. With stream filters, you can create a filter that processes the data as needed and attach it to the read stream, without changing the code that reads the data.</p>
<p>For example, you can use a stream filter to convert a text file's contents to uppercase before printing it.</p>

```php
$stream = fopen('data.txt', 'r');
stream_filter_append($stream, 'string.toupper');
echo stream_get_contents($stream);
fclose($stream);
```

<p>In this example, we open a file called <code>data.txt</code> in read mode (<code>'r'</code>). Then we attach the <code>string.toupper</code> filter to the stream with <code>stream_filter_append</code>, which converts the data to uppercase. Finally, we print the stream's contents with <code>stream_get_contents</code> and close the file with <code>fclose</code>.</p>
<p>The conversion is done automatically by the stream filter while the data is being read, and it does not affect the original file.</p>
<p>You can create your own stream filters to process data however you need.</p>
<p>See the <a target="_blank" href="https://www.php.net/manual/en/filters.php">official documentation</a> for more information about stream filters in PHP.</p>
<h3 id="heading-filterphp">FilterPHP</h3>
<p>I prepared an example to help you better understand how a stream filter works.</p>
<p>In this example, we will create a stream filter that keeps only the lines containing the word “PHP”.</p>

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

<p>Let's go through what the code above does, step by step.</p>
<ol>
<li>We create a class called <code>FilterPHP</code> that extends <code>php_user_filter</code>. This class is used to create a custom stream filter.</li>
</ol>
<p>If you have worked with classes in PHP, extending a class with such an odd name may look strange. That is because <code>php_user_filter</code> is an internal PHP class that predates the class naming conventions the community established over the years.</p>
<ol>
<li>The <code>FilterPHP</code> class has two properties: <code>$stream</code> and <code>$filter</code>. <code>$stream</code> holds a temporary stream where the filtered data will be written. <code>$filter</code> holds the filter that will be applied to the data.</li>
<li>The <code>onCreate</code> method is called when the filter is created. In it, we open a temporary stream with <code>fopen('php://temp', 'w+')</code> and store the stream resource in <code>$stream</code>. If the stream cannot be opened, we return <code>false</code>.</li>
</ol>
<blockquote>
<p>The <code>onCreate</code> method acts as a constructor for the filter, and custom stream filters typically implement it to set up their resources.</p>
<p>But what is <code>php://temp</code>? <code>php://temp</code> is a wrapper for creating temporary streams in PHP. Temporary streams are kept in memory or in a temporary file, depending on the size of the data.</p>
</blockquote>
<p>3. The <code>filter</code> method is called to filter the stream's data. It receives the following parameters:</p>
<ul>
<li><code>$in</code>: the input bucket brigade, from which the original data is read. It is read-only and is passed to the filter.</li>
<li><code>$out</code>: the output bucket brigade, to which the filtered data is written. It is write-only and is passed to the filter.</li>
<li><code>&$consumed</code>: the amount of data consumed by the filter. The filter updates this value and it is passed back to PHP.</li>
<li><code>$closing</code>: indicates whether the stream is being closed. If it is <code>true</code>, the filter should release any resources it allocated.</li>
</ul>
<blockquote>
<p><strong><em>Note</em></strong>: the <code>&</code> in front of a variable in PHP means it is passed by reference, so changes made inside the function are reflected outside it.</p>
</blockquote>
<p>4. In the <code>filter</code> method, we read the input data with <code>stream_bucket_make_writeable</code>. Then we split it into lines with <code>explode("\n", $bucket->data)</code> and check whether each line contains the word "PHP" with <code>str_contains($l, $this->filter)</code>.</p>
<p>5. If the line contains the word “PHP”, it is added to <code>$out_data</code>. Then we create a new output bucket with <code>stream_bucket_new</code> and append it to the output with <code>stream_bucket_append</code>.</p>
<p>6. Finally, we return <code>PSFS_PASS_ON</code> to indicate that the filter should keep passing data on to the next filter or to the output stream.</p>
<p>Now that we have created the stream filter, let's attach it to an input stream.</p>

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

<p>In this example, we read a JSON file from a URL with <code>file_get_contents</code> and store its contents in a variable called <code>$fileContents</code>.</p>
<p>Then we register the <code>FilterPHP</code> stream filter with <code>stream_filter_register</code>. The first argument is the filter's name, used to attach it to the input stream. The second argument is the filter's class name.</p>
<p>It is important to register the stream filter before attaching it to the input stream, so PHP knows how to handle it.</p>
<p>Next, we open a temporary stream with <code>fopen('php://temp', 'r+')</code> and write the file's contents to it with <code>fwrite</code>. Then we rewind the stream with <code>rewind</code>.</p>
<blockquote>
<p><strong><em>Note</em></strong>: <code>rewind</code> moves the stream's internal pointer back to the beginning. This is needed because the pointer is left at the end of the stream after writing.</p>
<p><strong><em>Note</em></strong>: a pointer in PHP works like a cursor that marks the current position in the stream.</p>
</blockquote>
<p>Then we open an output stream with <code>fopen('php://stdout', 'w')</code> and attach the <code>FilterPHP</code> stream filter to the temporary stream with <code>stream_filter_append</code>.</p>
<p>Finally, we read the data from the temporary stream with <code>fread</code> and print it with <code>echo</code>. Before printing, we strip the <code>name</code> and <code>description</code> keys with <code>str_replace</code>.</p>
<p>At the end, we close the temporary stream and the output stream with <code>fclose</code>.</p>
<p>The output of the code above will look like this (the sample data is in Portuguese):</p>

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

<p>If you want to try the code above, clone the <a target="_blank" href="https://github.com/sschonss/stream-php">stream-php</a> repository and run <code>docker-compose up</code> to start the PHP container and test it.</p>
<h3 id="heading-conclusion">Conclusion</h3>
<p>Streams are a powerful and flexible abstraction for working with files and other I/O resources in PHP. With streams, you can read and write data from and to different sources, such as files, strings and network connections, consistently and regardless of where the data comes from or goes to.</p>
<p>You can also use stream contexts to configure streams with specific options, wrappers to open streams over different kinds of resources, stream functions to work with streams efficiently, and stream filters to process data as needed.</p>
<p>I hope this guide helped you better understand how to work with streams in PHP. If you have any questions, suggestions or corrections, feel free to reach out.</p>
<p>See you next time!</p>
