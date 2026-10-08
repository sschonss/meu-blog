---
title: 'Quicksort'
date: 2024-02-28
source: https://luizschons.com/quicksort-33f8e917ab6c
translationKey: quicksort
draft: false
tags: ['Algoritmos']
---

<p>Quicksort é um algoritmo de ordenação muito eficiente, inventado por C.A.R. Hoare em 1960. Ele é amplamente utilizado para ordenação de arrays. O algoritmo que apresentamos a seguir é uma versão recursiva do Quicksort que seleciona um elemento como pivô e particiona o array de forma que todos os elementos menores que o pivô fiquem antes dele e os maiores fiquem depois. Os subarrays são então ordenados recursivamente.</p>
<p>Mas antes de começarmos a falar sobre o algoritmo, você precisa entender o que são métodos de DC (Divisão e Conquista).</p>
<h3 id="heading-metodos-de-dc">Métodos de DC</h3>
<p>Métodos de DC são algoritmos que resolvem um problema dividindo-o em subproblemas, resolvendo os subproblemas recursivamente e combinando as soluções dos subproblemas para resolver o problema original.</p>
<p>Vamos ver um exemplo de um algoritmo que utiliza DC.</p>
<h3 id="heading-exemplo">Exemplo</h3>
<p>Imagina que você tenha um array de inteiros e quer saber a soma de todos os elementos desse array. Você pode resolver esse problema utilizando DC da seguinte forma:</p>
<p>Array: [1, 2, 3, 4, 5]</p>
<p>Qual é o caso base? O caso base é quando o array tem apenas um elemento. Nesse caso, a soma é o próprio elemento.</p>
<p>Como iremos chegar no caso base? Vamos remover um elemento e ver o que sobra.</p>
<table><thead><tr><th>Elemento removido</th><th>Array restante</th></tr></thead><tbody><tr><td>1</td><td>[2, 3, 4, 5]</td></tr><tr><td>2</td><td>[3, 4, 5]</td></tr><tr><td>3</td><td>[4, 5]</td></tr><tr><td>4</td><td>[5]</td></tr></tbody></table>
<p>Agora que chegamos no caso base, vamos resolver o problema. A soma de todos os elementos do array [5] é 5. Agora, vamos somar o 4 que removemos anteriormente. A soma de todos os elementos do array [4, 5] é 9. Agora, vamos somar o 3 que removemos anteriormente. A soma de todos os elementos do array [3, 9] é 12. E assim por diante.</p>
<table><thead><tr><th>Caso base</th><th>Soma</th></tr></thead><tbody><tr><td>[5]</td><td>5</td></tr><tr><td>[4, 5]</td><td>9</td></tr><tr><td>[3, 9]</td><td>12</td></tr><tr><td>[2, 12]</td><td>14</td></tr><tr><td>[1, 14]</td><td>15</td></tr></tbody></table>
<p>A soma de todos os elementos do array [1, 2, 3, 4, 5] é 15.</p>
<p>Esse é um caso simples de DC e muitos algoritmos utilizam esse conceito para resolver problemas.</p>
<h3 id="heading-por-que-nao-usar-um-loop">Por que não usar um loop?</h3>
<p>Você pode estar se perguntando por que não usar um loop para resolver esse problema. E a resposta é: você pode! Mas, em alguns casos, a solução utilizando DC é mais simples e mais fácil de entender.</p>
<p>Outro ponto importante é que, em algumas linguagens, principalmente as funcionais, não existe a estrutura de repetição (for, while, etc.). Então, a única forma de resolver um problema é utilizando DC.</p>
<p>Entendendo esse algoritmo, você consegue trabalhar com outras linguagens de programação e entender como elas funcionam.</p>
<p>Caso tenha alguma dúvida, busque por mais exemplos e tente resolver problemas utilizando DC.</p>
<h3 id="heading-quicksort">Quicksort</h3>
<p>Agora que você entendeu o que é DC, vamos falar sobre o Quicksort.</p>
<p>O Quicksort é um algoritmo de ordenação muito eficiente, inventado por C.A.R. Hoare em 1960. Ele é amplamente utilizado para ordenação de arrays. O algoritmo que apresentamos a seguir é uma versão recursiva do Quicksort que seleciona um elemento como pivô e particiona o array de forma que todos os elementos menores que o pivô fiquem antes dele e os maiores fiquem depois. Os subarrays são então ordenados recursivamente.</p>
<h3 id="heading-exemplo-1">Exemplo</h3>
<p>Vamos ver um exemplo de como o Quicksort funciona.</p>
<table><thead><tr><th>Array</th></tr></thead><tbody><tr><td>3, 6, 8, 10, 1, 2, 1</td></tr></tbody></table>
<p>Passo 1: Escolha um elemento como pivô. Vamos escolher o 6.</p>
<p>Passo 2: Particione o array de forma que todos os elementos menores que o pivô fiquem antes dele e os maiores fiquem depois.</p>
<table><thead><tr><th>Menores que 6</th><th>Pivô</th><th>Maiores que 6</th></tr></thead><tbody><tr><td>3, 1, 2, 1</td><td>6</td><td>8, 10</td></tr></tbody></table>
<p>Passo 3: Ordenar os subarrays recursivamente.</p>
<p>O que significa ordenar os subarrays recursivamente? Significa que vamos repetir os passos 1 e 2 para os subarrays, escolhendo um pivô e particionando o array.</p>
<p>Vamos escolher o 1 como pivô.</p>
<table><thead><tr><th>Menores que 1</th><th>Pivô</th><th>Maiores que 1</th></tr></thead><tbody><tr><td></td><td>1, 1</td><td>2, 3</td></tr></tbody></table>
<p>Vamos escolher o 2 como pivô.</p>
<table><thead><tr><th>Menores que 2</th><th>Pivô</th><th>Maiores que 2</th></tr></thead><tbody><tr><td></td><td>2</td><td>3</td></tr></tbody></table>
<p>Agora somos obrigados a escolher o 3 como pivô.</p>
<table><thead><tr><th>Menores que 3</th><th>Pivô</th><th>Maiores que 3</th></tr></thead><tbody><tr><td></td><td>3</td><td></td></tr></tbody></table>
<p>Agora que chegamos no caso base, vamos ordenar os subarrays recursivamente.</p>
<p>Voltando agora os arrays até organizarmos o array da esquerda.</p>
<table><thead><tr><th>Menores que 6</th><th>Pivô</th><th>Maiores que 6</th></tr></thead><tbody><tr><td>1, 1, 2, 3</td><td>6</td><td>8, 10</td></tr></tbody></table>
<p>Agora vamos organizar o array da direita.</p>
<table><thead><tr><th>Array</th></tr></thead><tbody><tr><td>8, 10</td></tr></tbody></table>
<p>Passo 1: Escolha um elemento como pivô. Vamos escolher o 10.</p>
<p>Passo 2: Particione o array de forma que todos os elementos menores que o pivô fiquem antes dele e os maiores fiquem depois.</p>
<table><thead><tr><th>Menores que 10</th><th>Pivô</th><th>Maiores que 10</th></tr></thead><tbody><tr><td>8</td><td>10</td><td></td></tr></tbody></table>
<p>Agora que chegamos no caso base, vamos ordenar os subarrays recursivamente.</p>
<p>Voltando agora os arrays até organizarmos o array da direita.</p>
<table><thead><tr><th>Array</th></tr></thead><tbody><tr><td>8, 10</td></tr></tbody></table>
<p>Agora que organizamos os subarrays, o array original está ordenado.</p>
<table><thead><tr><th>Array</th></tr></thead><tbody><tr><td>1, 1, 2, 3, 6, 8, 10</td></tr></tbody></table>
<p>Esse é um exemplo de como o Quicksort funciona.</p>
<h3 id="heading-performance">Performance</h3>
<p>Dentro do desenvolvimento de software, a performance é um fator muito importante e muitas vezes usamos a Notação Big O para descrever a eficiência de um algoritmo.</p>
<p>Caso você não conheça a Notação Big O, recomendo que você leia um artigo sobre o assunto que escrevi aqui nesse link: <a target="_blank" href="https://medium.com/@sschonss/introdu%C3%A7%C3%A3o-a-algoritmos-nota%C3%A7%C3%A3o-big-o-d1d555b5e0e9">Notação Big O</a>.</p>
<p>O desempenho do Quicksort é O(n log n) no melhor caso e O(n²) no pior caso.</p>
<p>E a performance vai depender do pivô que você escolher. Se você escolher um pivô que seja o menor ou o maior elemento do array, o desempenho do Quicksort será O(n²). Mas, se você escolher um pivô que seja o elemento do meio do array, a performance do Quicksort será O(n log n).</p>
<p>Mas como escolher o pivô? Existem várias formas de escolher o pivô e a escolha do pivô vai depender do seu problema. Uma forma de escolher o pivô é escolher o elemento do meio do array.</p>
<p>Dessa forma, eu fiz um repositório no github com a implementação do Quicksort em Go. Caso você queira ver a implementação, clique <a target="_blank" href="https://github.com/sschonss/quicksort">aqui</a>.</p>
<p>Esse artigo é uma introdução ao Quicksort e espero que você tenha entendido como o algoritmo funciona, e agora se você escutar alguém falando sobre Quicksort, você vai entender do que se trata.</p>
<p>Lembre-se que a prática leva à perfeição e, quanto mais você praticar, mais você vai entender sobre o assunto.</p>
<p>Caso tenha alguma dúvida, busque por mais exemplos e tente resolver problemas utilizando Quicksort.</p>
<p>Espero que você tenha gostado do artigo e até a próxima!</p>
