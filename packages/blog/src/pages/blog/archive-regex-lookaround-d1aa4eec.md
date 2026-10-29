---
title: "Regex lookaround"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/d1aa4eecc2304d32ada968caaf46fae2"
---

之前学 Regex 的时候就很迷惑 lookaround 的意义. 于是这次一并解决它.

[https://www.rexegg.com/regex-lookarounds.html](https://www.rexegg.com/regex-lookarounds.html)

[Look around](/archive-assets/6b1422ba36b94989.csv)

| Symbol | Name | Description |
| --- | --- | --- |
| (?=foo) | Lookahead | Asserts that what immediately follows the current position in the string is foo |
| (?&lt;=foo) | Lookbehind | Asserts that what immediately precedes the current position in the string is foo |
| (?!foo) | Negative Lookahead | Asserts that what immediately follows the current position in the string is not foo |
| (?&lt;!foo) | Negative Lookbehind | Asserts that what immediately precedes the current position in the string is not foo |

Reference entries:

- [(?=foo)](/b/archive-foo-05b4dbcd)
- [(?!foo)](/b/archive-foo-1b447275)
- [(?<=foo)](/b/archive-foo-cf247d5b)
- [(?<!foo)](/b/archive-foo-f27b2acb)

实际上可以把 lookaround(la) 视作一种修饰. 这种修饰不会被包含进匹配中. 也不会被'消耗'.

[https://imgur.com/faJI3Vd](https://imgur.com/faJI3Vd)

比如这个 Regex. 我期望一个任意数量大小写字符前是一个非数字并且后面跟着数字的字符串. 

如果我在表达式最后加上一个非数字规则:

[https://imgur.com/DK0h8bi](https://imgur.com/DK0h8bi)

则无法匹配. 因为 (?=\d) 不消耗原始字符串, 仅仅是一个修饰. 而这个规则要求所匹配的字符串后面是数字. 但是我又在后面指定了$. 相当于这个字符串需要满足两个条件: 

1. [a-zA-Z]后接数字
2. [a-zA-Z]后接$

彼此冲突了. 所以无法匹配出字符串. 

PS: 其实很简单的东西. 我之前为什么会犯迷糊呢 = =.

同时需要注意的是. lookbehind 在部分 Regex 实现中可能是定长的.

[https://imgur.com/Mv5RflX](https://imgur.com/Mv5RflX)
