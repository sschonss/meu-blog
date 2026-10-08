---
title: 'Algoritmo de Dijkstra'
date: 2024-07-29
source: https://luizschons.com/algoritimo-dijkstra-0d73b29ab3e5
translationKey: algoritmo-dijkstra
draft: false
tags: ['Algoritmos']
---

<p>Edsger W. Dijkstra foi um cientista da computação holandês que fez contribuições significativas para a ciência da computação. Ele é mais conhecido por desenvolver o algoritmo de Dijkstra, que resolve o problema do caminho menos custoso em um grafo direcionado ou não direcionado com arestas não negativas.</p>
<p>Mas antes de falar sobre o algoritmo de Dijkstra, vamos falar sobre o algoritmo de <code>Pesquisa em Largura</code>.</p>
<h3 id="heading-pesquisa-em-largura">Pesquisa em Largura</h3>
<p>Trabalhar com grafos é uma tarefa comum em computação. Um dos problemas mais comuns é encontrar o menor caminho entre dois vértices em um grafo. O algoritmo de <code>Pesquisa em Largura</code> mostra como encontrar o menor caminho em um grafo, como por exemplo, o caminho mais curto entre duas cidades em um mapa que tem cidades como vértices e estradas como arestas.</p>
<p><img loading="lazy" decoding="async" src="/images/posts/algoritmo-dijkstra/graph.svg" alt="Grafo sem pesos com os vértices A a G" /></p>
<p>Imagine que precisamos sair de A para chegar em G. O algoritmo de <code>Pesquisa em Largura</code> nos ajuda a encontrar o menor caminho. O algoritmo começa visitando o vértice de origem (A) e então explora todos os vértices vizinhos. Depois disso, explora os vértices que estão a dois passos de distância e assim por diante.</p>
<p>No nosso caso o menor caminho é <code>A -> B -> E -> G</code>.</p>
<p><img loading="lazy" decoding="async" src="/images/posts/algoritmo-dijkstra/graph-bfs-path.svg" alt="Grafo com o caminho mais curto A → B → E → G destacado" /></p>
<p>Nesse caso, temos somente 3 <code>passos</code> para chegar em G.</p>
<h3 id="heading-algoritmo-de-dijkstra">Algoritmo de Dijkstra</h3>
<p>Mas e se as arestas tiverem pesos? O algoritmo de <code>Pesquisa em Largura</code> não funciona mais. O algoritmo de Dijkstra é um algoritmo que encontra o caminho mais <code>barato</code> em um grafo direcionado ou não direcionado, com arestas que possuem pesos. O algoritmo de Dijkstra mantém duas listas: uma lista de vértices visitados e uma lista de vértices não visitados. Ele seleciona o vértice não visitado mais próximo do vértice de origem, marca-o como visitado e atualiza os pesos dos vértices vizinhos.</p>
<p>Vamos adaptar o exemplo anterior para incluir pesos nas arestas.</p>
<p><img loading="lazy" decoding="async" src="/images/posts/algoritmo-dijkstra/graph-weighted.svg" alt="Grafo com pesos nas arestas e vértices A a G" /></p>
<p>Agora temos pesos em cada aresta, e nosso desafio é encontrar o caminho em que a soma dos pesos seja menor.</p>
<p>Vamos aplicar o algoritmo de Dijkstra para encontrar o menor caminho de A para G.</p>
<ol>
<li><p>Começamos em A e olhamos os vizinhos dele: chegar em B custa 10 e chegar em C custa 5.</p>
<table><thead><tr><th>Vértice</th><th>Distância de A</th><th>Caminho</th></tr></thead><tbody><tr><td>A</td><td>0</td><td>A</td></tr><tr><td>B</td><td>10</td><td>A → B</td></tr><tr><td>C</td><td>5</td><td>A → C</td></tr></tbody></table>
</li>
<li><p>O vértice não visitado mais próximo de A é C (5). Visitamos C e atualizamos os vizinhos dele: D passa a custar 7 (5 + 2) e F passa a custar 9 (5 + 4).</p>
<table><thead><tr><th>Vértice</th><th>Distância de A</th><th>Caminho</th></tr></thead><tbody><tr><td>A</td><td>0</td><td>A</td></tr><tr><td>B</td><td>10</td><td>A → B</td></tr><tr><td>C</td><td>5</td><td>A → C</td></tr><tr><td>D</td><td>7</td><td>A → C → D</td></tr><tr><td>F</td><td>9</td><td>A → C → F</td></tr></tbody></table>
</li>
<li><p>O próximo mais próximo é D (7). Passando por D, E custa 8 (7 + 1). F custaria 13 (7 + 6), que é pior que 9, então F não muda.</p>
<table><thead><tr><th>Vértice</th><th>Distância de A</th><th>Caminho</th></tr></thead><tbody><tr><td>A</td><td>0</td><td>A</td></tr><tr><td>B</td><td>10</td><td>A → B</td></tr><tr><td>C</td><td>5</td><td>A → C</td></tr><tr><td>D</td><td>7</td><td>A → C → D</td></tr><tr><td>F</td><td>9</td><td>A → C → F</td></tr><tr><td>E</td><td>8</td><td>A → C → D → E</td></tr></tbody></table>
</li>
<li><p>O próximo é E (8). Passando por E, G custa 10 (8 + 2). Visitar F e B depois não melhora nenhuma distância, então o algoritmo termina.</p>
<table><thead><tr><th>Vértice</th><th>Distância de A</th><th>Caminho</th></tr></thead><tbody><tr><td>A</td><td>0</td><td>A</td></tr><tr><td>B</td><td>10</td><td>A → B</td></tr><tr><td>C</td><td>5</td><td>A → C</td></tr><tr><td>D</td><td>7</td><td>A → C → D</td></tr><tr><td>F</td><td>9</td><td>A → C → F</td></tr><tr><td>E</td><td>8</td><td>A → C → D → E</td></tr><tr><td>G</td><td>10</td><td>A → C → D → E → G</td></tr></tbody></table>
</li>
</ol>
<p>O menor caminho de A para G é <code>A -> C -> D -> E -> G</code>, com custo total 10.</p>
<p><img loading="lazy" decoding="async" src="/images/posts/algoritmo-dijkstra/graph-weighted-path.svg" alt="Grafo com pesos e o caminho mais barato A → C → D → E → G destacado" /></p>
<h3 id="heading-aplicando-isso-com-php">Aplicando isso com PHP</h3>
<p>Vamos criar um exemplo prático em PHP para aplicar o algoritmo de Dijkstra.</p>

```php
$graph = [
    'A' => ['B' => 10, 'C' => 5],
    'B' => ['E' => 8, 'D' => 3],
    'C' => ['D' => 2, 'F' => 4],
    'D' => ['E' => 1, 'F' => 6],
    'E' => ['G' => 2],
    'F' => ['E' => 1],
    'G' => []
];

function dijkstra(array $graph, string $source, string $target): array
{
    $dist = array_fill_keys(array_keys($graph), INF);
    $prev = array_fill_keys(array_keys($graph), null);
    $dist[$source] = 0;

    // SplPriorityQueue devolve primeiro a maior prioridade,
    // então usamos a distância negativa para pegar o vértice mais próximo.
    $queue = new SplPriorityQueue();
    $queue->insert($source, 0);

    while (!$queue->isEmpty()) {
        $u = $queue->extract();

        foreach ($graph[$u] as $v => $cost) {
            $alt = $dist[$u] + $cost;
            if ($alt < $dist[$v]) {
                $dist[$v] = $alt;
                $prev[$v] = $u;
                $queue->insert($v, -$alt);
            }
        }
    }

    $path = [];
    for ($u = $target; $u !== null; $u = $prev[$u]) {
        array_unshift($path, $u);
    }

    return $path;
}

$path = dijkstra($graph, 'A', 'G');
echo implode(' -> ', $path); // A -> C -> D -> E -> G
```

<p>Segue o passo a passo da execução do algoritmo:</p>
<ol>
<li>Inicializamos as distâncias e a fila de prioridade.</li>
<li>Inicializamos a distância do vértice de origem como 0.</li>
<li>Enquanto a fila de prioridade não estiver vazia, extraímos o vértice com a menor distância.</li>
<li>Para cada vértice vizinho, calculamos a distância alternativa e atualizamos a distância se for menor.</li>
<li>Construímos o caminho percorrendo os vértices anteriores.</li>
<li>Retornamos o caminho.</li>
</ol>
<h2 id="heading-conclusao">Conclusão</h2>
<p>Com o aumento do uso de IA, Machine Learning e Big Data, o conceito de grafos se tornou cada vez mais importante. O algoritmo de Dijkstra é um dos algoritmos mais importantes para encontrar o menor caminho em um grafo. Espero que você tenha entendido como o algoritmo de Dijkstra funciona e como ele pode ser aplicado em um cenário do mundo real. Se você gostou desse artigo, deixe um comentário e compartilhe com seus amigos. Até a próxima!</p>
