---
title: 'Tabelas Hash'
date: 2024-03-06
source: https://luizschons.com/tabelas-hash-1f1a85a83795
translationKey: tabelas-hash-1f1a85a83795
draft: false
aliases: ["/tabelas-hash-1f1a85a83795/"]
---

<p>Uma tabela hash é uma estrutura de dados que associa chaves de pesquisa a valores.</p>
<p>Sua principal função é, a partir de uma chave simples, fazer uma busca rápida e eficiente para encontrar o valor desejado.</p>
<h3 id="heading-1-funcoes-hash">1. Funções Hash</h3>
<h3 id="heading-11-introducao">1.1. Introdução</h3>
<p>A função hash é uma função que, a partir de uma entrada de dados, gera um valor numérico que identifica a posição de um elemento em uma tabela hash.</p>
<p>Nós já vimos algumas outras estruturas de dados aqui nesse perfil, como buscar um elemento em uma lista encadeada ou em uma árvore binária, e vimos que a complexidade dessas operações é O(n) e O(log n), respectivamente.</p>
<p>A tabela hash, por sua vez, consegue fazer essa busca em O(1), ou seja, em tempo constante.</p>
<p>Isso significa que, não importa o tamanho da tabela, a busca será feita no mesmo tempo.</p>
<h3 id="heading-12-exemplo">1.2. Exemplo</h3>
<p>Muitas vezes, a função hash é usada para criar um índice para um array, e é por isso que a função hash deve ser rápida e eficiente.</p>
<p>Desenvolvi uma função hash muito simples, que pega uma palavra e retorna um número que representa essa palavra.</p>
<p>package main  </p>
<p>import (<br /> "fmt"<br />)  </p>
<p>func main() {<br /> for {<br />  run()<br /> }<br />}  </p>
<p>func run(){<br /> array_palavras := [10000]string{}<br /> fmt.Println("Digite uma palavra para ser hasheada")<br /> var palavra string<br /> fmt.Scanln(&palavra)<br /> hash_palavra := fake_hash(palavra)<br /> fmt.Println("A palavra", palavra, "tem o hash", hash_palavra)<br /> array_palavras[hash_palavra] = palavra<br /> fmt.Println("A palavra", palavra, "foi adicionada ao array na posicao", hash_palavra)<br /> fmt.Println("Digite um hash para buscar a palavra correspondente")<br /> var hash int<br /> fmt.Scanln(&hash)<br /> fmt.Println("A palavra correspondente ao hash", hash, "é", array_palavras[hash])<br />}  </p>
<p>func fake_hash(palavra string) int {<br /> hash := 0<br /> for i := 0; i < len(palavra); i++ {<br />  hash += int(palavra[i])<br /> }<br /> return hash<br />}</p>
<p>Nesse exemplo, a função fake_hash pega a palavra e soma os valores ASCII de cada caractere, retornando um número que representa a palavra.</p>
<p>Mas fique tranquilo, provavelmente você não vai precisar criar uma função hash, pois as linguagens de programação já possuem funções hash prontas e otimizadas.</p>
<p>Pode ser que na sua linguagem de programação a função hash seja chamada de outra coisa, como “map” ou “dicionário”, mas o conceito é o mesmo.</p>
<h3 id="heading-2-usabilidade">2. Usabilidade</h3>
<h3 id="heading-21-lista-telefonica">2.1. Lista Telefônica</h3>
<p>Um exemplo clássico de uso de tabela hash é a lista telefônica.</p>
<p>Imagine que você quer encontrar o número de telefone de uma pessoa.</p>
<p>Se a lista telefônica fosse uma lista encadeada, você teria que percorrer toda a lista até encontrar o nome da pessoa.</p>
<p>Se fosse uma árvore binária, você teria que percorrer a árvore até encontrar o nome da pessoa.</p>
<p>Mas, como a lista telefônica é uma tabela hash, você pode encontrar o número de telefone de uma pessoa em tempo constante, ou seja, em O(1).</p>
<p>Vamos entender mais sobre isso.</p>
<p>Ao adicionar um nome e um número de telefone à lista telefônica, a função hash é usada para gerar um índice para esse nome.</p>
<p>Quando você quer encontrar o número de telefone de uma pessoa, a função hash é usada para gerar o índice correspondente ao nome da pessoa, e o número de telefone é retornado.</p>
<p>Dessa forma:</p>
<p>package main  </p>
<p>import (<br />    "fmt"<br />)<br />func main() {<br />    lista_telefonica := make(map[string]string)<br />    lista_telefonica["João"] = "1234-5678"<br />    lista_telefonica["Maria"] = "8765-4321"<br />    lista_telefonica["José"] = "4321-5678"<br />    lista_telefonica["Ana"] = "5678-4321"<br />    fmt.Println("O número de telefone de João é", lista_telefonica["João"])<br />    fmt.Println("O número de telefone de Maria é", lista_telefonica["Maria"])<br />    fmt.Println("O número de telefone de José é", lista_telefonica["José"])<br />    fmt.Println("O número de telefone de Ana é", lista_telefonica["Ana"])<br />}</p>
<p>Nesse exemplo, a função hash é usada para gerar um índice para cada nome, e o número de telefone é retornado em tempo constante.</p>
<h3 id="heading-22-dns">2.2. DNS</h3>
<p>Outro exemplo clássico de uso de tabela hash é o DNS (Domain Name System).</p>
<p>O DNS é um sistema que traduz nomes de domínio da Internet em endereços IP.</p>
<p>Imagine que você quer acessar um site, como <a target="_blank" href="http://www.google.com/">www.google.com</a>.</p>
<p>Se o DNS não fosse uma tabela hash, você teria que percorrer toda a lista de domínios até encontrar o nome do site, imagina o tempo que isso levaria.</p>
<p>Mas, como o DNS é uma tabela hash, você pode encontrar o endereço IP de um site em tempo constante, ou seja, em O(1).</p>
<p>Vamos entender mais sobre isso com um exemplo.</p>
<p>package main  </p>
<p>import (<br />    "fmt"<br />)<br />func main() {<br />    dns := make(map[string]string)<br />    dns["www.google.com"] = "192.168.5.5"<br />    dns["www.facebook.com"] = "192.168.40.21"<br />    dns["www.twitter.com"] = "192.168.11.11"<br />    fmt.Println("O endereço IP de www.google.com é", dns["www.google.com"])<br />    fmt.Println("O endereço IP de www.facebook.com é", dns["www.facebook.com"])<br />    fmt.Println("O endereço IP de www.twitter.com é", dns["www.twitter.com"])<br />}</p>
<p>Entende como são exemplos bem similares? A ideia é a mesma, a tabela hash é usada para gerar um índice para cada nome, e o endereço IP é retornado em tempo constante.</p>
<h3 id="heading-3-colisoes">3. Colisões</h3>
<h3 id="heading-31-introducao">3.1. Introdução</h3>
<p>Uma colisão ocorre quando duas chaves de pesquisa diferentes têm o mesmo valor hash.</p>
<p>Mas isso é possível? Como a função hash gera um valor único para cada chave de pesquisa?</p>
<p>Bom, a função hash não gera um valor único para cada chave de pesquisa, ela gera um valor que representa a chave de pesquisa.</p>
<p>E, como o número de chaves de pesquisa é muito maior do que o número de valores hash, é possível que duas chaves de pesquisa diferentes tenham o mesmo valor hash.</p>
<h3 id="heading-32-tratamento-de-colisoes">3.2. Tratamento de Colisões</h3>
<p>Existem várias maneiras de tratar colisões, mas as duas mais comuns são:</p>
<ul>
<li>Encadeamento</li>
<li>Endereçamento Aberto</li>
</ul>
<h4 id="heading-321-encadeamento">3.2.1. Encadeamento</h4>
<p>No encadeamento, cada entrada da tabela hash é uma lista encadeada.</p>
<p>Quando ocorre uma colisão, a chave de pesquisa é adicionada à lista encadeada correspondente.</p>
<p>Isso significa que, se duas chaves de pesquisa diferentes têm o mesmo valor hash, elas são adicionadas à mesma lista encadeada.</p>
<p>A principal vantagem do encadeamento é que ele é simples de implementar, mas a principal desvantagem é que ele pode ser ineficiente em termos de espaço e desempenho.</p>
<h4 id="heading-322-enderecamento-aberto">3.2.2. Endereçamento Aberto</h4>
<p>No endereçamento aberto, quando ocorre uma colisão, a chave de pesquisa é adicionada a outra posição da tabela hash.</p>
<p>Isso significa que, se duas chaves de pesquisa diferentes têm o mesmo valor hash, a segunda chave de pesquisa é adicionada a outra posição da tabela hash.</p>
<p>A principal vantagem do endereçamento aberto é que ele é eficiente em termos de espaço e desempenho, mas a principal desvantagem é que ele é mais complexo de implementar.</p>
<h3 id="heading-4-desempenho">4. Desempenho</h3>
<h3 id="heading-41-fator-de-carga">4.1. Fator de Carga</h3>
<p>O fator de carga é a razão entre o número de chaves de pesquisa e o número de posições da tabela hash.</p>
<p>Quanto maior o fator de carga, maior a probabilidade de colisões.</p>
<p>Por isso, é importante manter o fator de carga baixo, para garantir um bom desempenho da tabela hash.</p>
<p>Um fator de carga ideal é menor que 0,7, ou seja, menos de 70% das posições da tabela hash estão ocupadas.</p>
<h4 id="heading-411-como-calcular-o-fator-de-carga">4.1.1. Como Calcular o Fator de Carga</h4>
<p>O fator de carga é calculado da seguinte forma:</p>
<p>NK = número de chaves de pesquisa<br />NP = número de posições da tabela hash</p>
<p>NK / NP = fator de carga</p>
<p>Por exemplo, se a tabela hash tem 100 posições e 70 chaves de pesquisa, o fator de carga é 0,7.</p>
<p>70 / 100 = 0,7</p>
<h3 id="heading-42-redimensionamento">4.2. Redimensionamento</h3>
<p>Quando o fator de carga é maior que 0,7, é necessário redimensionar a tabela hash.</p>
<p>O redimensionamento da tabela hash é feito da seguinte forma:</p>
<ul>
<li>Crie uma nova tabela hash com o dobro do tamanho da tabela hash original</li>
<li>Adicione todas as chaves de pesquisa da tabela hash original à nova tabela hash</li>
<li>Descarte a tabela hash original</li>
</ul>
<p>O redimensionamento da tabela hash é uma operação custosa, mas é necessária para garantir um bom desempenho da tabela hash.</p>
<h3 id="heading-5-sha">5. SHA</h3>
<p>SHA (Secure Hash Algorithm) é uma família de funções hash criptográficas.</p>
<p>Ela é uma ótima função hash, pois gera um valor único para cada chave de pesquisa.</p>
<p>SHA é amplamente utilizada em criptografia, segurança da informação e autenticação.</p>
<p>SHA é uma função hash muito segura, e é praticamente impossível encontrar duas chaves de pesquisa diferentes com o mesmo valor hash.</p>
<p>Uma das principais vantagens de SHA é que ela é rápida, eficiente e unidirecional, ou seja, é fácil calcular o valor hash de uma chave de pesquisa, mas é praticamente impossível calcular a chave de pesquisa a partir do valor hash.</p>
<p>Segue um exemplo de como usar SHA em Go:</p>
<p>package main<br />import (<br />    "crypto/sha256"<br />    "fmt"<br />)  </p>
<p>func main() {<br />    palavra := "hello"<br />    hash := sha256.Sum256([]byte(palavra))<br />    fmt.Printf("O hash de %s é %x\n", palavra, hash)<br />}</p>
<p>Nesse exemplo, a função hash SHA-256 é usada para gerar um valor hash para a palavra “hello”.</p>
<p>Mas se você quiser usar o SHA-256 para gerar a palavra “hello” a partir do valor hash, você não vai conseguir.</p>
<h3 id="heading-6-conclusao">6. Conclusão</h3>
<p>As tabelas hash são estruturas de dados muito eficientes para fazer buscas rápidas e eficientes.</p>
<p>Elas são amplamente utilizadas em aplicações do mundo real, como listas telefônicas, DNS, criptografia e segurança da informação.</p>
<p>Você aprendeu sobre funções hash, usabilidade, colisões, desempenho e SHA.</p>
<p>Nunca implemente uma função hash e use em produção, sempre use funções hash prontas e otimizadas da sua linguagem de programação.</p>
<p>Espero que você tenha aprendido bastante sobre tabelas hash, e que você possa aplicar esse conhecimento em suas aplicações do mundo real.</p>
<p>Se você tiver alguma dúvida ou sugestão, deixe nos comentários.</p>
<p>Até a próxima!</p>
