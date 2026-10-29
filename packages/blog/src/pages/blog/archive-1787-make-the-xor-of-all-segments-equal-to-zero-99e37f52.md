---
title: "1787. Make the XOR of All Segments Equal to Zero"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/99e37f5296464d60864bf9013c5e686a"
---

emm... 时隔很久的 leetcode. 

可惜我之前百来篇的笔记因为转移到 notion 的原因, 全部丢失了 Orz

这并不是一次很好的做题体验. 这道题我没有想出来. 按照以往来说, 是不会有这个笔记的. 毕竟我头一向很铁. 不想看答案. 但是最近变得比较变通了. 虽然很抵制去看别人的答案. 但是... 

不会的东西不去学是不行的 = = (我指的是, 针对性的). 有些时候甚至连自己不会什么都不知道. 所以呢. 以后的笔记可能会出现这样的情况. 不是自己做的题, 仅仅只是学习别人的做法. 

我很讨厌这样, 我尽量减少这种做法.

说回其他情况. 这次还是很不错的一次体验. 因为像这类型的题已经难了我很多次了. 连续的嵌套关系. 这种题型绊了我很多次. (虽然之前是有看算法相关的书, 但是收获很散乱)所以, 也是借着开始变变通了点这缘故. 是时候解决这些问题了! 💪

[Make the XOR of All Segments Equal to Zero - LeetCode](https://leetcode.com/problems/make-the-xor-of-all-segments-equal-to-zero/)

You are given an array `nums` and an integer `k`. The XOR of a segment `[left, right]` where `left <= right` is the `XOR` of all the elements with indices between `left` and `right`, inclusive: `nums[left] XOR nums[left+1] XOR ... XOR nums[right]`.

Return *the minimum number of elements to change in the array* such that the `XOR` of all segments of size `k` is equal to zero.

给定一个数组 nums 以及一个整数值 k. [left, right] 段的 XOR 意为 XOR left 到 right 区间的所有元素:

nums[left] XOR nums[left + 1] XOR ... XOR nums[right].

返回能使所有指定 k 区间的元素 XOR 值为 0 的最少元素修改树. 

好家伙 = =. 前面 K 的元素有多种 XOR 为 0 的变化. 而这些变化会持续影响后续 k 区间的元素. 典型的套娃= =. 真要 recursive 能烦死人 = =.

(也是因此我才去了解了之前听说过的 dp)

这个问题除了知道 dp 之外, 还需分析简化一下这个问题. 就如同这位作者的描述:

[Explanation of DP Approach + Code (C++) - LeetCode Discuss](https://leetcode.com/problems/make-the-xor-of-all-segments-equal-to-zero/discuss/1097537/Explanation-of-DP-Approach-%2B-Code-(C%2B%2B))

好了, 那么什么是 dp(dynamic programming)? 根据 wiki 的描述:

[Dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming)

**Dynamic programming** is both a [mathematical optimization](https://en.wikipedia.org/wiki/Mathematical_optimization) method and a computer programming method. The method was developed by [Richard Bellman](https://en.wikipedia.org/wiki/Richard_Bellman) in the 1950s and has found applications in numerous fields, from [aerospace engineering](https://en.wikipedia.org/wiki/Aerospace_engineering) to [economics](https://en.wikipedia.org/wiki/Economics).

dp 不仅是一中数学优化方法, 同时也是计算机编程方法. 

In both contexts it refers to simplifying a complicated problem by breaking it down into simpler sub-problems in a [recursive](https://en.wikipedia.org/wiki/Recursion) manner. While some decision problems cannot be taken apart this way, decisions that span several points in time do often break apart recursively. Likewise, in computer science, if a problem can be solved optimally by breaking it into sub-problems and then recursively finding the optimal solutions to the sub-problems, then it is said to have [optimal substructure](https://en.wikipedia.org/wiki/Optimal_substructure).

在所有环境中, 它指通过将一个复杂的问题以递归形式简化为多个小问题. 然而部分问题不能使用这种方法. (后续的并不清楚该怎么说, 大意是: 如果一个问题可以递归地分为多个小问题解决. 那么它具有 optimal substructure.)

If sub-problems can be nested recursively inside larger problems, so that dynamic programming methods are applicable, then there is a relation between the value of the larger problem and the values of the sub-problems.[[1]](https://en.wikipedia.org/wiki/Dynamic_programming#cite_note-:0-1) In the optimization literature this relationship is called the [Bellman equation](https://en.wikipedia.org/wiki/Bellman_equation).

如果子问题以递归的形式存在于整个问题. 那么其可应用 dp. 并且两者的值存在一种关系. 

唔... 这就是我有时候很讨厌 Wiki 的原因 = =. 它说的话太过概念化. 这种概念化能使其运用于各种场合, 但是缺乏针对性. 也就是没有具体的案例. 没有具体的案例来分析. 通过这些概念化的理解. 最后的理解也只能是似是而非... 

这里有个很不错的案例用于理解: 

[Dynamic Programming - GeeksforGeeks](https://www.geeksforgeeks.org/dynamic-programming/)

然后, 跳过 mathematic optimization.  

### **Computer programming[[edit](https://en.wikipedia.org/w/index.php?title=Dynamic_programming&action=edit&section=5)]**

There are two key attributes that a problem must have in order for dynamic programming to be applicable: [optimal substructure](https://en.wikipedia.org/wiki/Optimal_substructure) and [overlapping sub-problems](https://en.wikipedia.org/wiki/Overlapping_subproblem). If a problem can be solved by combining optimal solutions to non-overlapping sub-problems, the strategy is called "[divide and conquer](https://en.wikipedia.org/wiki/Divide_and_conquer_algorithm)" instead.[[1]](https://en.wikipedia.org/wiki/Dynamic_programming#cite_note-:0-1) This is why [merge sort](https://en.wikipedia.org/wiki/Mergesort) and [quick sort](https://en.wikipedia.org/wiki/Quicksort) are not classified as dynamic programming problems.

为应用 dp, 必须有两个关键的属性: optimal substructure 以及 overlapping sub-problems. 

(这里插一句, optimal substructure 简单理解就是递归结构. 而 overlapping 即是'耦合'的重复部分. 比如 fib(4) = fib(3) + fib(2); 但在计算 fib(3) 的同时, 又会计算一便 fib(2). 这里的 fib(2) 即 overlapping sub-problems) 

如果问题可以通过结合优化方案去除重复性. 这个策略被称为 "divide and conquer". 因此 merge sort 和 quick sort 没有典型的 dp 问题.

Optimal substructure means that the solution to a given optimization problem can be obtained by the combination of optimal solutions to its sub-problems. Such optimal substructures are usually described by means of [recursion](https://en.wikipedia.org/wiki/Recursion). For example, given a graph G=(V,E), the shortest path p from a vertex u to a vertex v exhibits optimal substructure: take any intermediate vertex w on this shortest path p. If p is truly the shortest path, then it can be split into sub-paths p1 from u to w and p2 from w to v such that these, in turn, are indeed the shortest paths between the corresponding vertices (by the simple cut-and-paste argument described in [Introduction to Algorithms](https://en.wikipedia.org/wiki/Introduction_to_Algorithms)). Hence, one can easily formulate the solution for finding shortest paths in a recursive manner, which is what the [Bellman–Ford algorithm](https://en.wikipedia.org/wiki/Bellman%E2%80%93Ford_algorithm) or the [Floyd–Warshall algorithm](https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm) does.

最优子结构意为一个给定优化问题的解可以通过组合其子问题的最优解得到. 这样的最优子结构通常用递归描述. 

Overlapping sub-problems means that the space of sub-problems must be small, that is, any recursive algorithm solving the problem should solve the same sub-problems over and over, rather than generating new sub-problems. For example, consider the recursive formulation for generating the Fibonacci series: Fi = Fi−1 + Fi−2, with base case F1 = F2 = 1. Then F43 = F42 + F41, and F42 = F41 + F40. Now F41 is being solved in the recursive sub-trees of both F43 as well as F42. Even though the total number of sub-problems is actually small (only 43 of them), we end up solving the same problems over and over if we adopt a naive recursive solution such as this. 

重复子问题意为其子问题的空间必须小. 任务解决该问题的递归算法必须解决同样的子问题. 而非产生新的子问题. 

Dynamic programming takes account of this fact and solves each sub-problem only once.

dp 依据这个事实仅解决子问题一次. 

This can be achieved in either of two ways:[[citation needed](https://en.wikipedia.org/wiki/Wikipedia:Citation_needed)]

这可以由以下两种方法实现: 

- [Top-down approach](https://en.wikipedia.org/wiki/Top-down_and_bottom-up_design): This is the direct fall-out of the recursive formulation of any problem. If the solution to any problem can be formulated recursively using the solution to its sub-problems, and if its sub-problems are overlapping, then one can easily [memoize](https://en.wikipedia.org/wiki/Memoize) or store the solutions to the sub-problems in a table. Whenever we attempt to solve a new sub-problem, we first check the table to see if it is already solved. If a solution has been recorded, we can use it directly, otherwise we solve the sub-problem and add its solution to the table.
    
    top-down: 这是任意问题递归后的直接结果. 如果问题可以被递归使用其子问题的解法, 并且其子问题重叠. 则可以将其解法存储到一张表中. 当尝试解决新的子问题时, 首先检查其是否已经解决过. 
    
- [Bottom-up approach](https://en.wikipedia.org/wiki/Top-down_and_bottom-up_design): Once we formulate the solution to a problem recursively as in terms of its sub-problems, we can try reformulating the problem in a bottom-up fashion: try solving the sub-problems first and use their solutions to build-on and arrive at solutions to bigger sub-problems. This is also usually done in a tabular form by iteratively generating solutions to bigger and bigger sub-problems by using the solutions to small sub-problems.
    
    bottom-up: 当依据其子问题递归规划时, 可以尝试用 bottom-up 风格重新实现: 尝试先解决其子问题, 然后使用其解构造更大的子问题. 
    

Some [programming languages](https://en.wikipedia.org/wiki/Programming_language) can automatically [memoize](https://en.wikipedia.org/wiki/Memoization) the result of a function call with a particular set of arguments, in order to speed up [call-by-name](https://en.wikipedia.org/wiki/Call-by-name) evaluation (this mechanism is referred to as [call-by-need](https://en.wikipedia.org/wiki/Call-by-need)). Some languages make it possible portably (e.g. [Scheme](https://en.wikipedia.org/wiki/Scheme_(programming_language)), [Common Lisp](https://en.wikipedia.org/wiki/Common_Lisp), [Perl](https://en.wikipedia.org/wiki/Perl) or [D](https://en.wikipedia.org/wiki/D_(programming_language))). Some languages have automatic [memoization](https://en.wikipedia.org/wiki/Memoization) built in, such as tabled [Prolog](https://en.wikipedia.org/wiki/Prolog) and [J](https://en.wikipedia.org/wiki/J_(programming_language)), which supports memoization with the M. adverb.[[4]](https://en.wikipedia.org/wiki/Dynamic_programming#cite_note-4) In any case, this is only possible for a [referentially transparent](https://en.wikipedia.org/wiki/Referentially_transparent) function. Memoization is also encountered as an easily accessible design pattern within term-rewrite based languages such as [Wolfram Language](https://en.wikipedia.org/wiki/Wolfram_Language).
