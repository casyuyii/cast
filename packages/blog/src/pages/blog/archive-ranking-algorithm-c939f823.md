---
title: "ranking algorithm"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/c939f823be394f449b86ed23f8398367"
---

[https://kmwllc.com/index.php/2020/03/20/understanding-tf-idf-and-bm-25/](https://kmwllc.com/index.php/2020/03/20/understanding-tf-idf-and-bm-25/)

TF-IDF

define: score(D, T) = termFrequency(D, T) * log(N / docFrequency(T))

termFrequency: the number of occurrences of a term in a document

docFrequency: the number of documents that contain the term

N: the size of the search index or corpus.

TF 是 term-frequency 的意思. DP 是 document-frequency .

但是 I 是啥?
