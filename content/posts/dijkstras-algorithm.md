---
title: "Dijkstra's Algorithm"
date: 2024-07-29
translationKey: algoritmo-dijkstra
draft: false
tags: ['Algorithms']
---

<p>Edsger W. Dijkstra was a Dutch computer scientist who made significant contributions to computer science. He is best known for developing Dijkstra's algorithm, which solves the least-cost path problem in a directed or undirected graph with non-negative edges.</p>
<p>But before talking about Dijkstra's algorithm, let's talk about the <code>Breadth-First Search</code> algorithm.</p>
<h3 id="heading-breadth-first-search">Breadth-First Search</h3>
<p>Working with graphs is a common task in computing. One of the most common problems is finding the shortest path between two vertices in a graph. The <code>Breadth-First Search</code> algorithm shows how to find the shortest path in a graph, for example the shortest route between two cities on a map where cities are vertices and roads are edges.</p>
<p><img loading="lazy" decoding="async" src="/images/posts/algoritmo-dijkstra/graph.svg" alt="Unweighted graph with vertices A to G" /></p>
<p>Imagine we need to go from A to G. The <code>Breadth-First Search</code> algorithm helps us find the shortest path. It starts by visiting the source vertex (A) and then explores all neighboring vertices. After that, it explores the vertices two steps away, and so on.</p>
<p>In our case, the shortest path is <code>A -> B -> E -> G</code>.</p>
<p><img loading="lazy" decoding="async" src="/images/posts/algoritmo-dijkstra/graph-bfs-path.svg" alt="Graph with the shortest path A → B → E → G highlighted" /></p>
<p>Here, it takes only 3 <code>steps</code> to reach G.</p>
<h3 id="heading-dijkstras-algorithm">Dijkstra's Algorithm</h3>
<p>But what if the edges have weights? Breadth-First Search no longer works. Dijkstra's algorithm finds the <code>cheapest</code> path in a directed or undirected graph whose edges have weights. It keeps two lists: one of visited vertices and one of unvisited vertices. It selects the unvisited vertex closest to the source, marks it as visited and updates the weights of its neighbors.</p>
<p>Let's adapt the previous example to include weights on the edges.</p>
<p><img loading="lazy" decoding="async" src="/images/posts/algoritmo-dijkstra/graph-weighted.svg" alt="Graph with weighted edges and vertices A to G" /></p>
<p>Now each edge has a weight, and our challenge is to find the path with the lowest total weight.</p>
<p>Let's apply Dijkstra's algorithm to find the cheapest path from A to G.</p>
<ol>
<li><p>We start at A and look at its neighbors: reaching B costs 10 and reaching C costs 5.</p>
<table><thead><tr><th>Vertex</th><th>Distance from A</th><th>Path</th></tr></thead><tbody><tr><td>A</td><td>0</td><td>A</td></tr><tr><td>B</td><td>10</td><td>A → B</td></tr><tr><td>C</td><td>5</td><td>A → C</td></tr></tbody></table>
</li>
<li><p>The unvisited vertex closest to A is C (5). We visit C and update its neighbors: D now costs 7 (5 + 2) and F now costs 9 (5 + 4).</p>
<table><thead><tr><th>Vertex</th><th>Distance from A</th><th>Path</th></tr></thead><tbody><tr><td>A</td><td>0</td><td>A</td></tr><tr><td>B</td><td>10</td><td>A → B</td></tr><tr><td>C</td><td>5</td><td>A → C</td></tr><tr><td>D</td><td>7</td><td>A → C → D</td></tr><tr><td>F</td><td>9</td><td>A → C → F</td></tr></tbody></table>
</li>
<li><p>The next closest is D (7). Through D, E costs 8 (7 + 1). F would cost 13 (7 + 6), which is worse than 9, so F stays the same.</p>
<table><thead><tr><th>Vertex</th><th>Distance from A</th><th>Path</th></tr></thead><tbody><tr><td>A</td><td>0</td><td>A</td></tr><tr><td>B</td><td>10</td><td>A → B</td></tr><tr><td>C</td><td>5</td><td>A → C</td></tr><tr><td>D</td><td>7</td><td>A → C → D</td></tr><tr><td>F</td><td>9</td><td>A → C → F</td></tr><tr><td>E</td><td>8</td><td>A → C → D → E</td></tr></tbody></table>
</li>
<li><p>Next is E (8). Through E, G costs 10 (8 + 2). Visiting F and B afterwards does not improve any distance, so the algorithm stops.</p>
<table><thead><tr><th>Vertex</th><th>Distance from A</th><th>Path</th></tr></thead><tbody><tr><td>A</td><td>0</td><td>A</td></tr><tr><td>B</td><td>10</td><td>A → B</td></tr><tr><td>C</td><td>5</td><td>A → C</td></tr><tr><td>D</td><td>7</td><td>A → C → D</td></tr><tr><td>F</td><td>9</td><td>A → C → F</td></tr><tr><td>E</td><td>8</td><td>A → C → D → E</td></tr><tr><td>G</td><td>10</td><td>A → C → D → E → G</td></tr></tbody></table>
</li>
</ol>
<p>The cheapest path from A to G is <code>A -> C -> D -> E -> G</code>, with a total cost of 10.</p>
<p><img loading="lazy" decoding="async" src="/images/posts/algoritmo-dijkstra/graph-weighted-path.svg" alt="Weighted graph with the cheapest path A → C → D → E → G highlighted" /></p>
<h3 id="heading-applying-it-with-php">Applying it with PHP</h3>
<p>Let's build a hands-on example in PHP to apply Dijkstra's algorithm.</p>

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

    // SplPriorityQueue returns the highest priority first,
    // so we use the negative distance to get the closest vertex.
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

<p>Here is the algorithm, step by step:</p>
<ol>
<li>We initialize the distances and the priority queue.</li>
<li>We set the distance of the source vertex to 0.</li>
<li>While the priority queue is not empty, we extract the vertex with the smallest distance.</li>
<li>For each neighboring vertex, we compute the alternative distance and update it if it is smaller.</li>
<li>We build the path by walking back through the previous vertices.</li>
<li>We return the path.</li>
</ol>
<h2 id="heading-conclusion">Conclusion</h2>
<p>With the growing use of AI, Machine Learning and Big Data, graphs have become more and more important. Dijkstra's algorithm is one of the most important algorithms for finding the shortest path in a graph. I hope you now understand how it works and how it can be applied to a real-world scenario. If you liked this article, leave a comment and share it with your friends. See you next time!</p>
