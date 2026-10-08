---
title: 'Quicksort'
date: 2024-02-28
translationKey: quicksort
draft: false
tags: ['Algorithms']
---

<p>Quicksort is a very efficient sorting algorithm, invented by C.A.R. Hoare in 1960. It is widely used to sort arrays. The algorithm presented below is a recursive version of Quicksort that picks an element as the pivot and partitions the array so that all elements smaller than the pivot come before it and the larger ones come after it. The subarrays are then sorted recursively.</p>
<p>But before we start talking about the algorithm, you need to understand what D&amp;C (Divide and Conquer) methods are.</p>
<h3 id="heading-dc-methods">D&amp;C methods</h3>
<p>D&amp;C methods are algorithms that solve a problem by splitting it into subproblems, solving the subproblems recursively and combining their solutions to solve the original problem.</p>
<p>Let's look at an example of an algorithm that uses D&amp;C.</p>
<h3 id="heading-example">Example</h3>
<p>Imagine you have an array of integers and want to know the sum of all its elements. You can solve this problem with D&amp;C like this:</p>
<p>Array: [1, 2, 3, 4, 5]</p>
<p>What is the base case? The base case is when the array has only one element. In that case, the sum is the element itself.</p>
<p>How do we reach the base case? We remove one element at a time and see what is left.</p>
<table><thead><tr><th>Removed element</th><th>Remaining array</th></tr></thead><tbody><tr><td>1</td><td>[2, 3, 4, 5]</td></tr><tr><td>2</td><td>[3, 4, 5]</td></tr><tr><td>3</td><td>[4, 5]</td></tr><tr><td>4</td><td>[5]</td></tr></tbody></table>
<p>Now that we have reached the base case, let's solve the problem. The sum of all elements of the array [5] is 5. Now we add the 4 we removed earlier. The sum of all elements of the array [4, 5] is 9. Now we add the 3 we removed earlier. The sum of all elements of the array [3, 9] is 12. And so on.</p>
<table><thead><tr><th>Base case</th><th>Sum</th></tr></thead><tbody><tr><td>[5]</td><td>5</td></tr><tr><td>[4, 5]</td><td>9</td></tr><tr><td>[3, 9]</td><td>12</td></tr><tr><td>[2, 12]</td><td>14</td></tr><tr><td>[1, 14]</td><td>15</td></tr></tbody></table>
<p>The sum of all elements of the array [1, 2, 3, 4, 5] is 15.</p>
<p>This is a simple case of D&amp;C, and many algorithms use this concept to solve problems.</p>
<h3 id="heading-why-not-use-a-loop">Why not use a loop?</h3>
<p>You may be wondering why not just use a loop to solve this problem. And the answer is: you can! But in some cases, the D&amp;C solution is simpler and easier to understand.</p>
<p>Another important point is that some languages, especially functional ones, have no loop constructs (for, while, etc.). In those, the only way to solve such a problem is with D&amp;C.</p>
<p>Once you understand this approach, you can work with other programming languages and understand how they work.</p>
<p>If you have any questions, look for more examples and try solving problems using D&amp;C.</p>
<h3 id="heading-quicksort">Quicksort</h3>
<p>Now that you understand what D&amp;C is, let's talk about Quicksort.</p>
<p>Quicksort is a very efficient sorting algorithm, invented by C.A.R. Hoare in 1960. It is widely used to sort arrays. The algorithm presented below is a recursive version of Quicksort that picks an element as the pivot and partitions the array so that all elements smaller than the pivot come before it and the larger ones come after it. The subarrays are then sorted recursively.</p>
<h3 id="heading-example-1">Example</h3>
<p>Let's see an example of how Quicksort works.</p>
<table><thead><tr><th>Array</th></tr></thead><tbody><tr><td>3, 6, 8, 10, 1, 2, 1</td></tr></tbody></table>
<p>Step 1: Pick an element as the pivot. Let's pick 6.</p>
<p>Step 2: Partition the array so that all elements smaller than the pivot come before it and the larger ones come after it.</p>
<table><thead><tr><th>Less than 6</th><th>Pivot</th><th>Greater than 6</th></tr></thead><tbody><tr><td>3, 1, 2, 1</td><td>6</td><td>8, 10</td></tr></tbody></table>
<p>Step 3: Sort the subarrays recursively.</p>
<p>What does sorting the subarrays recursively mean? It means repeating steps 1 and 2 for each subarray, picking a pivot and partitioning it.</p>
<p>Let's pick 1 as the pivot.</p>
<table><thead><tr><th>Less than 1</th><th>Pivot</th><th>Greater than 1</th></tr></thead><tbody><tr><td></td><td>1, 1</td><td>2, 3</td></tr></tbody></table>
<p>Let's pick 2 as the pivot.</p>
<table><thead><tr><th>Less than 2</th><th>Pivot</th><th>Greater than 2</th></tr></thead><tbody><tr><td></td><td>2</td><td>3</td></tr></tbody></table>
<p>Now we have to pick 3 as the pivot.</p>
<table><thead><tr><th>Less than 3</th><th>Pivot</th><th>Greater than 3</th></tr></thead><tbody><tr><td></td><td>3</td><td></td></tr></tbody></table>
<p>Now that we have reached the base case, let's sort the subarrays recursively.</p>
<p>We go back up through the arrays until the left side is sorted.</p>
<table><thead><tr><th>Less than 6</th><th>Pivot</th><th>Greater than 6</th></tr></thead><tbody><tr><td>1, 1, 2, 3</td><td>6</td><td>8, 10</td></tr></tbody></table>
<p>Now let's sort the right side.</p>
<table><thead><tr><th>Array</th></tr></thead><tbody><tr><td>8, 10</td></tr></tbody></table>
<p>Step 1: Pick an element as the pivot. Let's pick 10.</p>
<p>Step 2: Partition the array so that all elements smaller than the pivot come before it and the larger ones come after it.</p>
<table><thead><tr><th>Less than 10</th><th>Pivot</th><th>Greater than 10</th></tr></thead><tbody><tr><td>8</td><td>10</td><td></td></tr></tbody></table>
<p>Now that we have reached the base case, let's sort the subarrays recursively.</p>
<p>We go back up through the arrays until the right side is sorted.</p>
<table><thead><tr><th>Array</th></tr></thead><tbody><tr><td>8, 10</td></tr></tbody></table>
<p>Now that the subarrays are sorted, the original array is sorted.</p>
<table><thead><tr><th>Array</th></tr></thead><tbody><tr><td>1, 1, 2, 3, 6, 8, 10</td></tr></tbody></table>
<p>That is an example of how Quicksort works.</p>
<h3 id="heading-performance">Performance</h3>
<p>In software development, performance is a very important factor, and we often use Big O notation to describe an algorithm's efficiency.</p>
<p>If you are not familiar with Big O notation, I recommend an article I wrote about it (in Portuguese): <a target="_blank" href="https://medium.com/@sschonss/introdu%C3%A7%C3%A3o-a-algoritmos-nota%C3%A7%C3%A3o-big-o-d1d555b5e0e9">Big O Notation</a>.</p>
<p>Quicksort's performance is O(n log n) in the best case and O(n²) in the worst case.</p>
<p>Performance depends on the pivot you choose. If you pick a pivot that is the smallest or largest element of the array, Quicksort runs in O(n²). But if you pick a pivot that is the middle element, Quicksort runs in O(n log n).</p>
<p>So how do you choose the pivot? There are several ways, and the right choice depends on your problem. One option is to pick the middle element of the array.</p>
<p>With that in mind, I created a GitHub repository with a Quicksort implementation in Go. If you want to see it, click <a target="_blank" href="https://github.com/sschonss/quicksort">here</a>.</p>
<p>This article is an introduction to Quicksort, and I hope you now understand how the algorithm works. Next time you hear someone talking about Quicksort, you will know what it is about.</p>
<p>Remember that practice makes perfect, and the more you practice, the more you will understand the subject.</p>
<p>If you have any questions, look for more examples and try solving problems using Quicksort.</p>
<p>I hope you enjoyed the article. See you next time!</p>
