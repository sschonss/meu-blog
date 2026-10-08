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
<p><img src="/images/posts/algoritmo-dijkstra/83906eab-e030-4187-ada0-a6fb599c5a92.png" alt="Unweighted graph with vertices A to G" /></p>
<p>Imagine we need to go from A to G. The <code>Breadth-First Search</code> algorithm helps us find the shortest path. It starts by visiting the source vertex (A) and then explores all neighboring vertices. After that, it explores the vertices two steps away, and so on.</p>
<p>In our case, the shortest path is <code>A -> B -> E -> G</code>.</p>
<p><img src="/images/posts/algoritmo-dijkstra/21335b16-46e7-41d0-83ce-9616afcbc13c.png" alt="Graph with the shortest path A → B → E → G highlighted" /></p>
<p>Here, it takes only 3 <code>steps</code> to reach G.</p>
<h3 id="heading-dijkstras-algorithm">Dijkstra's Algorithm</h3>
<p>But what if the edges have weights? Breadth-First Search no longer works. Dijkstra's algorithm finds the <code>cheapest</code> path in a directed or undirected graph whose edges have weights. It keeps two lists: one of visited vertices and one of unvisited vertices. It selects the unvisited vertex closest to the source, marks it as visited and updates the weights of its neighbors.</p>
<p>Let's adapt the previous example to include weights on the edges.</p>
<p><img src="/images/posts/algoritmo-dijkstra/e98599cc-e8c7-42f7-90fd-db6bc0585fe0.png" alt="Graph with weighted edges and vertices A to G" /></p>
<p>Now each edge has a weight, and our challenge is to find the path with the lowest total weight.</p>
<p>Let's apply Dijkstra's algorithm to find the cheapest path from A to G.</p>
<ol>
<li>We start at A and visit all neighboring vertices.</li>
</ol>
<p><img src="/images/posts/algoritmo-dijkstra/c8fb16dd-c96c-46f1-9631-8cc994f9e8c8.png" alt="Table of distances from A after visiting A" /></p>
<p>2. The next vertex closest to A is C. So we visit C and update the distances of its neighbors.</p>
<p><img src="/images/posts/algoritmo-dijkstra/605433b6-8e50-4537-a177-c1622ea93383.png" alt="Table of distances from A after visiting C" /></p>
<p>3. The next vertex closest to A is D. So we visit D and update the distances of its neighbors.</p>
<p><img src="/images/posts/algoritmo-dijkstra/9501673c-afae-4064-8bbc-07d604383605.png" alt="Table of distances from A after visiting D" /></p>
<p>4. The next vertex closest to A is E. So we visit E and update the distances of its neighbors.</p>
<p><img src="/images/posts/algoritmo-dijkstra/0b1d5fc0-12a1-45e9-9da0-d87c7527efa4.png" alt="Table of distances from A after visiting E" /></p>
<p>The cheapest path from A to G is <code>A -> C -> D -> E -> G</code>.</p>
<p><img src="/images/posts/algoritmo-dijkstra/72e9e802-5834-479a-856d-0a9cb6649c96.png" alt="Weighted graph with the cheapest path A → C → D → E → G highlighted" /></p>
<h3 id="heading-applying-it-with-php">Applying it with PHP</h3>
<p>Let's build a hands-on example in PHP to apply Dijkstra's algorithm.</p>

```php
$graph = [
    'A' => ['B' => 10, 'C' => 5],
    'B' => ['E' => 8, 'D' => 3],
    'C' => ['D' => 2, 'F' => 4],
    'D' => ['E' => 2, 'F' => 6],
    'E' => ['G' => 2],
    'F' => ['E' => 1],
    'G' => []
];

function dijkstra($graph, $source, $target)
{
    $dist = [];
    $prev = [];
    $queue = new SplPriorityQueue();

    foreach ($graph as $vertex => $adj) {
        $dist[$vertex] = INF;
        $prev[$vertex] = null;
        $queue->insert($vertex, $vertex === $source ? 0 : INF);
    }

    $dist[$source] = 0;

    while (!$queue->isEmpty()) {
        $u = $queue->extract();

        if (!empty($graph[$u])) {
            foreach ($graph[$u] as $v => $cost) {
                $alt = $dist[$u] + $cost;
                if ($alt insert($v, $alt);
                }
            }
        }
    }

    $path = [];
    $u = $target;
    while (isset($prev[$u])) {
        array_unshift($path, $u);
        $u = $prev[$u];
    }
    array_unshift($path, $source);

    return $path;
}

$path = dijkstra($graph, 'A', 'G');
echo implode(' -> ', $path);
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
