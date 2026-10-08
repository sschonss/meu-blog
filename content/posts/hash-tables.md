---
title: 'Hash Tables'
date: 2024-03-06
translationKey: tabelas-hash
draft: false
---

<p>A hash table is a data structure that maps lookup keys to values.</p>
<p>Its main job is to take a simple key and find the value you want quickly and efficiently.</p>
<h3 id="heading-1-hash-functions">1. Hash Functions</h3>
<h3 id="heading-11-introduction">1.1. Introduction</h3>
<p>A hash function takes some input data and produces a number that identifies the position of an element in a hash table.</p>
<p>We have already looked at other data structures on this blog, such as finding an element in a linked list or in a binary tree, and we saw that those operations take O(n) and O(log n), respectively.</p>
<p>A hash table, on the other hand, can do that lookup in O(1), that is, in constant time.</p>
<p>This means that no matter how large the table is, the lookup takes the same time.</p>
<h3 id="heading-12-example">1.2. Example</h3>
<p>A hash function is often used to create an index into an array, which is why it needs to be fast and efficient.</p>
<p>I wrote a very simple hash function that takes a word and returns a number that represents it.</p>
<p>package main  </p>
<p>import (<br /> "fmt"<br />)  </p>
<p>func main() {<br /> for {<br />  run()<br /> }<br />}  </p>
<p>func run(){<br /> words := [10000]string{}<br /> fmt.Println("Type a word to hash")<br /> var word string<br /> fmt.Scanln(&word)<br /> wordHash := fake_hash(word)<br /> fmt.Println("The word", word, "has the hash", wordHash)<br /> words[wordHash] = word<br /> fmt.Println("The word", word, "was added to the array at position", wordHash)<br /> fmt.Println("Type a hash to look up the matching word")<br /> var hash int<br /> fmt.Scanln(&hash)<br /> fmt.Println("The word for hash", hash, "is", words[hash])<br />}  </p>
<p>func fake_hash(word string) int {<br /> hash := 0<br /> for i := 0; i < len(word); i++ {<br />  hash += int(word[i])<br /> }<br /> return hash<br />}</p>
<p>In this example, the fake_hash function takes the word and adds up the ASCII values of its characters, returning a number that represents the word.</p>
<p>But don't worry: you probably won't need to write a hash function yourself, since programming languages already ship with optimized ones.</p>
<p>Your language may call it something else, like a “map” or a “dictionary”, but the concept is the same.</p>
<h3 id="heading-2-use-cases">2. Use cases</h3>
<h3 id="heading-21-phone-book">2.1. Phone Book</h3>
<p>A classic example of a hash table is a phone book.</p>
<p>Imagine you want to find someone's phone number.</p>
<p>If the phone book were a linked list, you would have to walk the whole list until you found the person's name.</p>
<p>If it were a binary tree, you would have to walk down the tree until you found the name.</p>
<p>But since the phone book is a hash table, you can find a person's number in constant time, that is, in O(1).</p>
<p>Let's understand this better.</p>
<p>When you add a name and a phone number to the phone book, the hash function is used to generate an index for that name.</p>
<p>When you want to find someone's number, the hash function generates the index for that name, and the phone number is returned.</p>
<p>Like this:</p>
<p>package main  </p>
<p>import (<br />    "fmt"<br />)<br />func main() {<br />    phoneBook := make(map[string]string)<br />    phoneBook["John"] = "1234-5678"<br />    phoneBook["Mary"] = "8765-4321"<br />    phoneBook["Joseph"] = "4321-5678"<br />    phoneBook["Anna"] = "5678-4321"<br />    fmt.Println("John's phone number is", phoneBook["John"])<br />    fmt.Println("Mary's phone number is", phoneBook["Mary"])<br />    fmt.Println("Joseph's phone number is", phoneBook["Joseph"])<br />    fmt.Println("Anna's phone number is", phoneBook["Anna"])<br />}</p>
<p>In this example, the hash function generates an index for each name, and the phone number is returned in constant time.</p>
<h3 id="heading-22-dns">2.2. DNS</h3>
<p>Another classic example of a hash table is DNS (Domain Name System).</p>
<p>DNS is a system that translates Internet domain names into IP addresses.</p>
<p>Imagine you want to visit a website, like <a target="_blank" href="http://www.google.com/">www.google.com</a>.</p>
<p>If DNS were not a hash table, you would have to go through the whole list of domains until you found the site's name. Imagine how long that would take.</p>
<p>But since DNS is a hash table, you can find a site's IP address in constant time, that is, in O(1).</p>
<p>Let's look at an example.</p>
<p>package main  </p>
<p>import (<br />    "fmt"<br />)<br />func main() {<br />    dns := make(map[string]string)<br />    dns["www.google.com"] = "192.168.5.5"<br />    dns["www.facebook.com"] = "192.168.40.21"<br />    dns["www.twitter.com"] = "192.168.11.11"<br />    fmt.Println("The IP address of www.google.com is", dns["www.google.com"])<br />    fmt.Println("The IP address of www.facebook.com is", dns["www.facebook.com"])<br />    fmt.Println("The IP address of www.twitter.com is", dns["www.twitter.com"])<br />}</p>
<p>See how similar these examples are? The idea is the same: the hash table generates an index for each name, and the IP address is returned in constant time.</p>
<h3 id="heading-3-collisions">3. Collisions</h3>
<h3 id="heading-31-introduction">3.1. Introduction</h3>
<p>A collision happens when two different lookup keys have the same hash value.</p>
<p>But is that possible? Doesn't the hash function generate a unique value for each key?</p>
<p>Well, a hash function does not generate a unique value for each key; it generates a value that represents the key.</p>
<p>And since there are far more possible keys than hash values, two different keys can end up with the same hash value.</p>
<h3 id="heading-32-handling-collisions">3.2. Handling Collisions</h3>
<p>There are several ways to handle collisions, but the two most common are:</p>
<ul>
<li>Chaining</li>
<li>Open Addressing</li>
</ul>
<h4 id="heading-321-chaining">3.2.1. Chaining</h4>
<p>With chaining, each entry in the hash table is a linked list.</p>
<p>When a collision happens, the key is added to the corresponding linked list.</p>
<p>This means that if two different keys have the same hash value, they are added to the same linked list.</p>
<p>The main advantage of chaining is that it is simple to implement; the main disadvantage is that it can be inefficient in terms of space and performance.</p>
<h4 id="heading-322-open-addressing">3.2.2. Open Addressing</h4>
<p>With open addressing, when a collision happens, the key is placed in another position of the hash table.</p>
<p>This means that if two different keys have the same hash value, the second key is stored in another position of the table.</p>
<p>The main advantage of open addressing is that it is efficient in terms of space and performance; the main disadvantage is that it is more complex to implement.</p>
<h3 id="heading-4-performance">4. Performance</h3>
<h3 id="heading-41-load-factor">4.1. Load Factor</h3>
<p>The load factor is the ratio between the number of keys and the number of positions in the hash table.</p>
<p>The higher the load factor, the higher the chance of collisions.</p>
<p>That is why it is important to keep the load factor low to ensure good hash table performance.</p>
<p>An ideal load factor is below 0.7, meaning less than 70% of the table's positions are occupied.</p>
<h4 id="heading-411-how-to-calculate-the-load-factor">4.1.1. How to Calculate the Load Factor</h4>
<p>The load factor is calculated like this:</p>
<p>NK = number of keys<br />NP = number of positions in the hash table</p>
<p>NK / NP = load factor</p>
<p>For example, if the hash table has 100 positions and 70 keys, the load factor is 0.7.</p>
<p>70 / 100 = 0.7</p>
<h3 id="heading-42-resizing">4.2. Resizing</h3>
<p>When the load factor goes above 0.7, the hash table needs to be resized.</p>
<p>Resizing works like this:</p>
<ul>
<li>Create a new hash table twice the size of the original</li>
<li>Add all keys from the original table to the new one</li>
<li>Discard the original table</li>
</ul>
<p>Resizing a hash table is an expensive operation, but it is necessary to keep its performance good.</p>
<h3 id="heading-5-sha">5. SHA</h3>
<p>SHA (Secure Hash Algorithm) is a family of cryptographic hash functions.</p>
<p>It is a great hash function because it produces a practically unique value for each key.</p>
<p>SHA is widely used in cryptography, information security and authentication.</p>
<p>SHA is a very secure hash function, and it is practically impossible to find two different keys with the same hash value.</p>
<p>One of SHA's main advantages is that it is fast, efficient and one-way: it is easy to compute the hash of a key, but practically impossible to recover the key from the hash.</p>
<p>Here is an example of using SHA in Go:</p>
<p>package main<br />import (<br />    "crypto/sha256"<br />    "fmt"<br />)  </p>
<p>func main() {<br />    word := "hello"<br />    hash := sha256.Sum256([]byte(word))<br />    fmt.Printf("The hash of %s is %x\n", word, hash)<br />}</p>
<p>In this example, the SHA-256 hash function is used to generate a hash value for the word “hello”.</p>
<p>But if you try to use SHA-256 to get the word “hello” back from the hash value, you won't be able to.</p>
<h3 id="heading-6-conclusion">6. Conclusion</h3>
<p>Hash tables are very efficient data structures for fast lookups.</p>
<p>They are widely used in real-world applications, such as phone books, DNS, cryptography and information security.</p>
<p>You learned about hash functions, use cases, collisions, performance and SHA.</p>
<p>Never write your own hash function and use it in production; always use the ready-made, optimized hash functions from your programming language.</p>
<p>I hope you learned a lot about hash tables and that you can apply this knowledge in your real-world applications.</p>
<p>If you have any questions or suggestions, leave them in the comments.</p>
<p>See you next time!</p>
