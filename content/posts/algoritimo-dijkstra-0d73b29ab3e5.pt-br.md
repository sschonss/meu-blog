---
title: 'Algoritimo Dijkstra'
date: 2024-07-29
source: https://luizschons.com/algoritimo-dijkstra-0d73b29ab3e5
translationKey: algoritimo-dijkstra-0d73b29ab3e5
draft: false
aliases: ["/algoritimo-dijkstra-0d73b29ab3e5/", "/posts/algoritimo-dijkstra-0d73b29ab3e5/"]
---

<p>Edsger W. Dijkstra foi um cientista da computação holandês que fez contribuições significativas para a ciência da computação. Ele é mais conhecido por desenvolver o algoritmo de Dijkstra, que resolve o problema do caminho menos custoso em um grafo direcionado ou não direcionado com arestas não negativas.</p>
<p>Mas antes de falar sobre o algoritmo de Dijkstra, vamos falar sobre o algoritmo de <code>Pesquisa em Largura</code>.</p>
<h3 id="heading-pesquisa-em-largura">Pesquisa em Largura</h3>
<p>Trabalhar com grafos é uma tarefa comum em computação. Um dos problemas mais comuns é encontrar o menor caminho entre dois vértices em um grafo. O algoritmo de <code>Pesquisa em Largura</code> mostra como encontrar o menor caminho em um grafo, como por exemplo, o caminho mais curto entre duas cidades em um mapa que tem cidades como vértices e estradas como arestas.</p>
<p><img src="/images/posts/algoritimo-dijkstra-0d73b29ab3e5/83906eab-e030-4187-ada0-a6fb599c5a92.png" alt /></p>
<p>Imagine que precisamos sair de A para chegar em G. O algoritmo de <code>Pesquisa em Largura</code> nos ajuda a encontrar o menor caminho. O algoritmo começa visitando o vértice de origem (A) e então explora todos os vértices vizinhos. Depois disso, explora os vértices que estão a dois passos de distância e assim por diante.</p>
<p>No nosso caso o menor caminho é <code>A -> B -> E -> G</code>.</p>
<p><img src="/images/posts/algoritimo-dijkstra-0d73b29ab3e5/21335b16-46e7-41d0-83ce-9616afcbc13c.png" alt /></p>
<p>Nesse caso, temos somente 3 <code>passos</code> para chegar em G.</p>
<h3 id="heading-algoritmo-de-dijkstra">Algoritmo de Dijkstra</h3>
<p>Mas e se as arestas tiverem pesos? O algoritmo de <code>Pesquisa em Largura</code> não funciona mais. O algoritmo de Dijkstra é um algoritmo que encontra o caminho mais <code>barato</code> em um grafo direcionado ou não direcionado, com arestas que possuem pesos. O algoritmo de Dijkstra mantém duas listas: uma lista de vértices visitados e uma lista de vértices não visitados. Ele seleciona o vértice não visitado mais próximo do vértice de origem, marca-o como visitado e atualiza os pesos dos vértices vizinhos.</p>
<p>Vamos adaptar o exemplo anterior para incluir pesos nas arestas.</p>
<p><img src="/images/posts/algoritimo-dijkstra-0d73b29ab3e5/e98599cc-e8c7-42f7-90fd-db6bc0585fe0.png" alt /></p>
<p>Agora temos pesos em cada aresta, e nosso desafio é encontrar o caminho em que a soma dos pesos seja menor.</p>
<p>Vamos aplicar o algoritmo de Dijkstra para encontrar o menor caminho de A para G.</p>
<ol>
<li>Começamos em A e visitamos todos os vértices vizinhos.</li>
</ol>
<p><img src="/images/posts/algoritimo-dijkstra-0d73b29ab3e5/c8fb16dd-c96c-46f1-9631-8cc994f9e8c8.png" alt /></p>
<p>2. O próximo vértice mais próximo de A é C. Então visitamos C e atualizamos as distâncias dos vértices vizinhos.</p>
<p><img src="/images/posts/algoritimo-dijkstra-0d73b29ab3e5/605433b6-8e50-4537-a177-c1622ea93383.png" alt /></p>
<p>3. O próximo vértice mais próximo de A é D. Então visitamos D e atualizamos as distâncias dos vértices vizinhos.</p>
<p><img src="/images/posts/algoritimo-dijkstra-0d73b29ab3e5/9501673c-afae-4064-8bbc-07d604383605.png" alt /></p>
<p>4. O próximo vértice mais próximo de A é E. Então visitamos E e atualizamos as distâncias dos vértices vizinhos.</p>
<p><img src="/images/posts/algoritimo-dijkstra-0d73b29ab3e5/0b1d5fc0-12a1-45e9-9da0-d87c7527efa4.png" alt /></p>
<p>O menor caminho de A para G é <code>A -> C -> D -> E -> G</code>.</p>
<p><img src="/images/posts/algoritimo-dijkstra-0d73b29ab3e5/72e9e802-5834-479a-856d-0a9cb6649c96.png" alt /></p>
<h3 id="heading-aplicando-isso-com-php">Aplicando isso com PHP</h3>
<p>Vamos criar um exemplo prático em PHP para aplicar o algoritmo de Dijkstra.</p>
<pre><code class="lang-php"><span class="hljs-meta"><?php</span>
$graph = [
    <span class="hljs-string">'A'</span> => [<span class="hljs-string">'B'</span> => <span class="hljs-number">10</span>, <span class="hljs-string">'C'</span> => <span class="hljs-number">5</span>],
    <span class="hljs-string">'B'</span> => [<span class="hljs-string">'E'</span> => <span class="hljs-number">8</span>, <span class="hljs-string">'D'</span> => <span class="hljs-number">3</span>],
    <span class="hljs-string">'C'</span> => [<span class="hljs-string">'D'</span> => <span class="hljs-number">2</span>, <span class="hljs-string">'F'</span> => <span class="hljs-number">4</span>],
    <span class="hljs-string">'D'</span> => [<span class="hljs-string">'E'</span> => <span class="hljs-number">2</span>, <span class="hljs-string">'F'</span> => <span class="hljs-number">6</span>],
    <span class="hljs-string">'E'</span> => [<span class="hljs-string">'G'</span> => <span class="hljs-number">2</span>],
    <span class="hljs-string">'F'</span> => [<span class="hljs-string">'E'</span> => <span class="hljs-number">1</span>],
    <span class="hljs-string">'G'</span> => []
];

<span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">dijkstra</span>(<span class="hljs-params">$graph, $source, $target</span>)
</span>{
    $dist = [];
    $prev = [];
    $queue = <span class="hljs-keyword">new</span> <span class="hljs-built_in">SplPriorityQueue</span>();

    <span class="hljs-keyword">foreach</span> ($graph <span class="hljs-keyword">as</span> $vertex => $adj) {
        $dist[$vertex] = INF;
        $prev[$vertex] = <span class="hljs-literal">null</span>;
        $queue->insert($vertex, $vertex === $source ? <span class="hljs-number">0</span> : INF);
    }

    $dist[$source] = <span class="hljs-number">0</span>;

    <span class="hljs-keyword">while</span> (!$queue->isEmpty()) {
        $u = $queue->extract();

        <span class="hljs-keyword">if</span> (!<span class="hljs-keyword">empty</span>($graph[$u])) {
            <span class="hljs-keyword">foreach</span> ($graph[$u] <span class="hljs-keyword">as</span> $v => $cost) {
                $alt = $dist[$u] + $cost;
                <span class="hljs-keyword">if</span> ($alt < $dist[$v]) {
                    $dist[$v] = $alt;
                    $prev[$v] = $u;
                    $queue->insert($v, $alt);
                }
            }
        }
    }

    $path = [];
    $u = $target;
    <span class="hljs-keyword">while</span> (<span class="hljs-keyword">isset</span>($prev[$u])) {
        array_unshift($path, $u);
        $u = $prev[$u];
    }
    array_unshift($path, $source);

    <span class="hljs-keyword">return</span> $path;
}

$path = dijkstra($graph, <span class="hljs-string">'A'</span>, <span class="hljs-string">'G'</span>);
<span class="hljs-keyword">echo</span> implode(<span class="hljs-string">' -> '</span>, $path);
</code></pre>
<p>Segue o passo a passo da execução do algoritmo:</p>
<ul>
<li><p>1. Inicializamos as distâncias e a fila de prioridade.</p>
</li>
<li><p>2. Inicializamos a distância do vértice de origem como 0.</p>
</li>
<li><p>3. Enquanto a fila de prioridade não estiver vazia, extraímos o vértice com a menor distância.</p>
</li>
<li><p>4. Para cada vértice vizinho, calculamos a distância alternativa e atualizamos a distância se for menor.</p>
</li>
<li><p>5. Construímos o caminho percorrendo os vértices anteriores. 6. Retornamos o caminho.</p>
<h2 id="heading-conclusao">Conclusão</h2>
<p>  Com o aumento do uso de AI, Machine Learning e Big Data, o conceito de grafos se tornou cada vez mais importante. O algoritmo de Dijkstra é um dos algoritmos mais importantes para encontrar o menor caminho em um grafo. Espero que você tenha entendido como o algoritmo de Dijkstra funciona e como ele pode ser aplicado em um cenário do mundo real. Se você gostou desse artigo, deixe um comentário e compartilhe com seus amigos. Até a próxima!</p>
</li>
</ul>
