---
title: "0x5f3759df"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/614af92b58df44b58b160a84775a5471"
---

在某个帖子(公司文化衫, 求代码片段)看到的比较疑惑的回复.

```cpp
float InvSqrt(float x)
{
	float xhalf = 0.5f*x;
	int i = *(int*)&x;
	// get bits for floating value
	i = 0x5f3759df - (i>>1); // gives initial guess y0
	x = *(float*)&i;
	// convert bits back to float
	x = x*(1.5f-xhalf*x*x);
	// Newton step, repeating increases accuracy
	return x;
}
```

上述代码可以用于获取 $​1⁄√x$ (平方根倒数). 其中最令人疑惑的地方就是: 0x5f3759df.

我找到了一篇文档详细描述了这个数字的由来. 

[http://www.lomont.org/Math/Papers/2003/InvSqrt.pdf](http://www.lomont.org/Math/Papers/2003/InvSqrt.pdf)

Floating point numbers are stored in the PC as 32 bit numbers;

s: bit 31

E: 30 ← bits → 23

M: 22 ← bits → 0
where s is a 1 bit sign (1 denotes negative), E is an 8 bit exponent, and
M is a 23 bit mantissa. The exponent is biased by 127 to accommodate
positive and negative exponents, and the mantissa does not store the
leading 1, so think of M as a binary number with the decimal point to
the left, thus M is a value in I = [0, 1). The represented value is

[https://imgur.com/o4TIIFO](https://imgur.com/o4TIIFO)

These bits can be viewed as the floating point representation of a
real number, or thinking only of bits, as an integer. Thus M will be
considered a real number in I or as an integer, depending on context.
M as a real number is M as an integer divided by 223.

这里顺便复习一下计机机浮点数结构.

[https://imgur.com/jpDZwMv](https://imgur.com/jpDZwMv)

算法主要借鉴于牛顿近似法. magic 常量用于给定一个好的初始猜测. 

PS: 然后我没看出来为什么 f(y) 的定义, 以及其他定义. 好烦, 这个作者又省略了很多东西. 

查了一下:

[Newton's method - Wikipedia](https://en.wikipedia.org/wiki/Newton%27s_method)

[Derivative - Wikipedia](https://en.wikipedia.org/wiki/Derivative)

有点尴尬. 导数, 微积分. 我不明白 = = ... 咋办?
